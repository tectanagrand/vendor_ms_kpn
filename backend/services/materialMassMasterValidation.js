// Checks a mass row's free-text fields against our own master data, so a value
// SAP will refuse is caught when the row is entered rather than after the batch
// has gone through its whole approval chain and reached the staging table. For
// example, "PCS" is not a UoM in mst_uom ("PC" is), and "696" is not a
// material group.
//
// What is checked, and against what:
//   plant          -> mst_plant.plant_code
//   sloc           -> mst_storage_location (the plant + sloc pair)
//   materialGroup  -> mat_item_group, using the same matching the staging push
//                     and the final-code composer use
//                     (MASS_ITEM_GROUP_CODE_LATERAL_SQL), so a group accepted
//                     here always resolves later
//   uom            -> mst_uom.uom_code
//   description    -> at most 40 chars (SAP MAKTX)
//   poText         -> at most 210 chars (the PURCHASE_ORDER_TEXT the push
//                     stages; anything longer would be cut off silently)
// Material sub group is deliberately not checked.
//
// Codes are compared case-insensitively, because the mass grid upper-cases
// every field. The value that gets stored is the master's own spelling
// (`canonical`), so a UoM like "Kwh" reaches SAP as the master has it.

const {
    MASS_ITEM_GROUP_CODE_LATERAL_SQL,
    MAX_MATERIAL_DESCRIPTION_LENGTH,
    MAX_LONG_TEXT_COLUMN_LENGTH,
} = require("../constants/material");

const MASS_MAX_PO_TEXT_LENGTH = MAX_LONG_TEXT_COLUMN_LENGTH * 3; // 210

const MASS_MASTER_FIELDS = Object.freeze([
    "plant",
    "sloc",
    "materialGroup",
    "uom",
    "description",
    "poText",
]);

// Blank values are left to the caller's required-field check unless asked.
const MASS_REQUIRED_MESSAGES = Object.freeze({
    plant: "Plant wajib diisi.",
    sloc: "Sloc wajib diisi.",
    materialGroup: "Material group wajib diisi.",
    uom: "Base UoM wajib diisi.",
    description: "Material description wajib diisi.",
});

// The eight text fields of a mass grid line; a line with all of them blank is
// an unused grid row and is skipped.
const MASS_ROW_TEXT_FIELDS = Object.freeze([
    "plant",
    "sloc",
    "materialGroup",
    "materialSubGroup",
    "description",
    "poText",
    "uom",
    "spesifikasiTambahan",
]);

const toText = value =>
    value === undefined || value === null ? "" : String(value).trim();
const toKey = value => toText(value).toUpperCase();

const isMassRowFilled = row =>
    Boolean(row) &&
    typeof row === "object" &&
    MASS_ROW_TEXT_FIELDS.some(fieldKey => toText(row[fieldKey]) !== "");

// mst_uom holds a few codes that differ only by case (M3/m3, KM/Km, LTH/lth).
// Pick the code spelled exactly as typed, then the all-upper one (what the grid
// sends), then a single case-insensitive match. Anything else is not a UoM.
const resolveUomCode = (input, uomCodes) => {
    const typed = toText(input);
    if (uomCodes.includes(typed)) {
        return typed;
    }

    const wanted = typed.toUpperCase();
    if (uomCodes.includes(wanted)) {
        return wanted;
    }

    const matches = uomCodes.filter(code => code.toUpperCase() === wanted);
    return matches.length === 1 ? matches[0] : null;
};

/**
 * @param {{query: Function}} queryable  pg Client or Pool
 * @param {Array<{key: *, values: object, fields?: Iterable<string>}>} entries
 *        values: { plant, sloc, materialGroup, uom, description, poText }
 *        fields: which of those to check (default: all). sloc is always
 *                checked against values.plant.
 * @param {{requireFilled?: boolean}} [options]  report blank required fields
 * @returns {Promise<{errors: Array<{key, fieldKey, message}>, canonical: Map}>}
 *          canonical: key -> { plant?, sloc?, uom? } in the master's spelling
 */
const validateMassRowsAgainstMasters = async (
    queryable,
    entries = [],
    { requireFilled = false } = {}
) => {
    const errors = [];
    const canonical = new Map();
    const work = [];

    for (const entry of entries) {
        const fields = new Set(entry.fields ?? MASS_MASTER_FIELDS);
        const values = entry.values || {};
        const rowErrors = new Map();
        const addError = (fieldKey, message) => {
            if (!rowErrors.has(fieldKey)) {
                rowErrors.set(fieldKey, message);
            }
        };

        for (const fieldKey of fields) {
            if (
                requireFilled &&
                MASS_REQUIRED_MESSAGES[fieldKey] &&
                toText(values[fieldKey]) === ""
            ) {
                addError(fieldKey, MASS_REQUIRED_MESSAGES[fieldKey]);
            }
        }

        if (
            fields.has("description") &&
            toText(values.description).length > MAX_MATERIAL_DESCRIPTION_LENGTH
        ) {
            addError(
                "description",
                `Material description maksimal ${MAX_MATERIAL_DESCRIPTION_LENGTH} karakter.`
            );
        }
        if (
            fields.has("poText") &&
            toText(values.poText).length > MASS_MAX_PO_TEXT_LENGTH
        ) {
            addError(
                "poText",
                `PO text maksimal ${MASS_MAX_PO_TEXT_LENGTH} karakter.`
            );
        }

        work.push({ entry, fields, values, rowErrors, addError });
    }

    const wants = (item, fieldKey) =>
        item.fields.has(fieldKey) &&
        !item.rowErrors.has(fieldKey) &&
        toText(item.values[fieldKey]) !== "";

    // ---- plant ------------------------------------------------------------
    const plantKeys = [
        ...new Set(
            work
                .filter(
                    item =>
                        toText(item.values.plant) !== "" &&
                        (wants(item, "plant") || wants(item, "sloc"))
                )
                .map(item => toKey(item.values.plant))
        ),
    ];
    const plantByKey = new Map();
    if (plantKeys.length > 0) {
        const { rows } = await queryable.query(
            `SELECT plant_code
             FROM mst_plant
             WHERE UPPER(BTRIM(plant_code)) = ANY($1::text[])`,
            [plantKeys]
        );
        for (const row of rows) {
            plantByKey.set(toKey(row.plant_code), toText(row.plant_code));
        }
    }

    for (const item of work) {
        if (!wants(item, "plant")) continue;
        const plant = plantByKey.get(toKey(item.values.plant));
        if (plant) {
            canonical.set(item.entry.key, {
                ...canonical.get(item.entry.key),
                plant,
            });
        } else {
            item.addError(
                "plant",
                `Plant "${toText(item.values.plant)}" tidak ditemukan di master plant.`
            );
        }
    }

    // ---- sloc (per plant) -------------------------------------------------
    const slocPairs = work
        .filter(item => wants(item, "sloc"))
        .map(item => [toKey(item.values.plant), toKey(item.values.sloc)]);
    const slocByPair = new Map();
    if (slocPairs.length > 0) {
        const { rows } = await queryable.query(
            `SELECT plant_code, sloc_code
             FROM mst_storage_location
             WHERE (UPPER(BTRIM(plant_code)), UPPER(BTRIM(sloc_code))) IN (
                 SELECT * FROM UNNEST($1::text[], $2::text[])
             )`,
            [slocPairs.map(pair => pair[0]), slocPairs.map(pair => pair[1])]
        );
        for (const row of rows) {
            slocByPair.set(
                `${toKey(row.plant_code)}|${toKey(row.sloc_code)}`,
                toText(row.sloc_code)
            );
        }
    }

    for (const item of work) {
        if (!wants(item, "sloc")) continue;
        const plantKey = toKey(item.values.plant);
        // A blank or unknown plant is reported on the plant cell; a sloc
        // cannot be judged without a real plant.
        if (plantKey === "" || item.rowErrors.has("plant")) continue;
        const sloc = slocByPair.get(`${plantKey}|${toKey(item.values.sloc)}`);
        if (sloc) {
            canonical.set(item.entry.key, {
                ...canonical.get(item.entry.key),
                sloc,
            });
        } else {
            item.addError(
                "sloc",
                `Sloc "${toText(item.values.sloc)}" tidak terdaftar untuk plant ${
                    plantByKey.get(plantKey) || toText(item.values.plant)
                }.`
            );
        }
    }

    // ---- material group ---------------------------------------------------
    const groupItems = work.filter(item => wants(item, "materialGroup"));
    if (groupItems.length > 0) {
        // The LATERAL fragment reads `i.material_group`; aliasing the input
        // list as `i` runs the exact matching the push/final-code paths use.
        const { rows } = await queryable.query(
            `SELECT i.idx::int AS idx, mig.code
             FROM UNNEST($1::text[]) WITH ORDINALITY AS i(material_group, idx)
             ${MASS_ITEM_GROUP_CODE_LATERAL_SQL}`,
            [groupItems.map(item => toText(item.values.materialGroup))]
        );
        const codeByIdx = new Map(rows.map(row => [Number(row.idx), row.code]));
        groupItems.forEach((item, position) => {
            if (!codeByIdx.get(position + 1)) {
                item.addError(
                    "materialGroup",
                    `Material group "${toText(item.values.materialGroup)}" tidak ditemukan di master material group.`
                );
            }
        });
    }

    // ---- UoM --------------------------------------------------------------
    const uomItems = work.filter(item => wants(item, "uom"));
    if (uomItems.length > 0) {
        const { rows } = await queryable.query(
            "SELECT uom_code FROM mst_uom"
        );
        const uomCodes = rows.map(row => toText(row.uom_code));
        for (const item of uomItems) {
            const uom = resolveUomCode(item.values.uom, uomCodes);
            if (uom) {
                canonical.set(item.entry.key, {
                    ...canonical.get(item.entry.key),
                    uom,
                });
            } else {
                item.addError(
                    "uom",
                    `Base UoM "${toText(item.values.uom)}" tidak ditemukan di master UoM.`
                );
            }
        }
    }

    for (const item of work) {
        for (const [fieldKey, message] of item.rowErrors) {
            errors.push({ key: item.entry.key, fieldKey, message });
        }
    }

    return { errors, canonical };
};

/**
 * The create/validate body: one object per grid line, blank lines included so
 * row indexes line up with the file mapping and with the UI's rows.
 *
 * @returns {Promise<{errors: Array<{rowIndex, fieldKey, message}>, rows: object[]}>}
 *          rows: the input with plant/sloc/uom in the master's spelling
 */
const validateMassGridRows = async (queryable, rows = []) => {
    const sourceRows = Array.isArray(rows) ? rows : [];
    const entries = sourceRows
        .map((row, rowIndex) => ({ key: rowIndex, values: row || {} }))
        .filter(entry => isMassRowFilled(entry.values));
    const { errors, canonical } = await validateMassRowsAgainstMasters(
        queryable,
        entries
    );

    return {
        errors: errors.map(({ key, fieldKey, message }) => ({
            rowIndex: key,
            fieldKey,
            message,
        })),
        rows: sourceRows.map((row, rowIndex) =>
            canonical.has(rowIndex)
                ? { ...row, ...canonical.get(rowIndex) }
                : row
        ),
    };
};

module.exports = {
    MASS_MAX_PO_TEXT_LENGTH,
    MASS_MASTER_FIELDS,
    MASS_ROW_TEXT_FIELDS,
    isMassRowFilled,
    resolveUomCode,
    validateMassRowsAgainstMasters,
    validateMassGridRows,
};
