// Mass grid master-data check: plant, plant+sloc, material group, UoM, and
// the description / PO text widths, checked against our own tables when a
// mass request is created or validated, or an item is edited. Material sub
// group is not checked.
//
// The master tables are faked by a small queryable. The SQL itself (notably
// the material-group LATERAL shared with the staging push) is the same SQL
// the push and final-code paths already run.

const assert = require("node:assert/strict");
const test = require("node:test");
const {
    MASS_ITEM_GROUP_CODE_LATERAL_SQL,
} = require("../constants/material");
const {
    MASS_MAX_PO_TEXT_LENGTH,
    resolveUomCode,
    validateMassRowsAgainstMasters,
    validateMassGridRows,
} = require("../services/materialMassMasterValidation");

const PLANTS = ["PS23", "RI21"];
const SLOCS = [
    ["PS23", "WN01"],
    ["RI21", "WN01"],
];
const GROUPS = [
    { code: "905", name: "BEARING" },
    { code: "927", name: "PUMP" },
];
const UOMS = ["EA", "PC", "SET", "M3", "m3", "KM", "Km", "Kwh"];

const createMasters = () => {
    const calls = [];
    const query = async (sql, params = []) => {
        calls.push(sql);
        if (/FROM mst_plant/.test(sql)) {
            return {
                rows: PLANTS.filter(code => params[0].includes(code)).map(
                    plant_code => ({ plant_code })
                ),
            };
        }
        if (/FROM mst_storage_location/.test(sql)) {
            const wanted = params[0].map((plant, i) => `${plant}|${params[1][i]}`);
            return {
                rows: SLOCS.filter(([plant, sloc]) =>
                    wanted.includes(`${plant}|${sloc}`)
                ).map(([plant_code, sloc_code]) => ({ plant_code, sloc_code })),
            };
        }
        if (/WITH ORDINALITY AS i\(material_group, idx\)/.test(sql)) {
            // Code, name or "code - name", case-insensitive — what the LATERAL does.
            return {
                rows: params[0].map((input, i) => {
                    const wanted = input.toUpperCase();
                    const head = wanted.split(" - ")[0];
                    const group = GROUPS.find(
                        g =>
                            [wanted, head].includes(g.code) ||
                            [wanted, head].includes(g.name) ||
                            `${g.code} - ${g.name}` === wanted
                    );
                    return { idx: i + 1, code: group ? group.code : null };
                }),
            };
        }
        if (/^SELECT uom_code FROM mst_uom$/.test(sql)) {
            return { rows: UOMS.map(uom_code => ({ uom_code })) };
        }
        throw new Error(`Unexpected query: ${sql}`);
    };
    return { query, calls };
};

const goodRow = (overrides = {}) => ({
    plant: "PS23",
    sloc: "WN01",
    materialGroup: "927",
    materialSubGroup: "041",
    description: "P/N 32A45-00020 PUMP ASSY,WATER",
    poText: "",
    uom: "PC",
    spesifikasiTambahan: "",
    ...overrides,
});

test("resolveUomCode prefers the exact spelling, then upper case, then a single case-insensitive match", () => {
    assert.equal(resolveUomCode("PC", UOMS), "PC");
    assert.equal(resolveUomCode(" pc ", UOMS), "PC");
    assert.equal(resolveUomCode("m3", UOMS), "m3");
    assert.equal(resolveUomCode("M3", UOMS), "M3");
    assert.equal(resolveUomCode("kM", UOMS), "KM");
    assert.equal(resolveUomCode("KWH", UOMS), "Kwh");
    assert.equal(resolveUomCode("PCS", UOMS), null);
    assert.equal(resolveUomCode("", UOMS), null);
});

test("a valid grid passes and comes back with plant / sloc / UoM as the master spells them", async () => {
    const masters = createMasters();
    const rows = [
        goodRow({ plant: "ps23", sloc: "wn01", uom: "kwh" }),
        {},
        goodRow({ materialGroup: "905 - BEARING" }),
        goodRow({ materialGroup: "bearing" }),
    ];

    const result = await validateMassGridRows(masters, rows);

    assert.deepEqual(result.errors, []);
    assert.equal(result.rows[0].plant, "PS23");
    assert.equal(result.rows[0].sloc, "WN01");
    assert.equal(result.rows[0].uom, "Kwh");
    assert.deepEqual(result.rows[1], {});
    // The group is stored as typed: every later reader resolves all shapes.
    assert.equal(result.rows[2].materialGroup, "905 - BEARING");
});

test("each unknown master value is reported on its own cell, keyed by grid row", async () => {
    const masters = createMasters();
    const rows = [
        goodRow({ uom: "PCS" }),
        {},
        goodRow({ plant: "RI21", materialGroup: "696" }),
        goodRow({ plant: "ZZ99", sloc: "XX01" }),
        goodRow({ sloc: "ZZ99" }),
    ];

    const { errors } = await validateMassGridRows(masters, rows);

    assert.deepEqual(errors, [
        { rowIndex: 0, fieldKey: "uom", message: 'Base UoM "PCS" tidak ditemukan di master UoM.' },
        { rowIndex: 2, fieldKey: "materialGroup", message: 'Material group "696" tidak ditemukan di master material group.' },
        // An unknown plant says so once; its sloc is not judged against it.
        { rowIndex: 3, fieldKey: "plant", message: 'Plant "ZZ99" tidak ditemukan di master plant.' },
        { rowIndex: 4, fieldKey: "sloc", message: 'Sloc "ZZ99" tidak terdaftar untuk plant PS23.' },
    ]);
});

test("a sloc that exists only under another plant is refused", async () => {
    const { errors } = await validateMassGridRows(createMasters(), [
        goodRow({ plant: "PS23", sloc: "WN01" }),
        goodRow({ plant: "RI21", sloc: "WN02" }),
    ]);

    assert.deepEqual(
        errors.map(e => [e.rowIndex, e.fieldKey]),
        [[1, "sloc"]]
    );
});

test("description and PO text widths are enforced; blanks are left to the required check", async () => {
    const masters = createMasters();
    const { errors } = await validateMassGridRows(masters, [
        goodRow({
            description: "X".repeat(41),
            poText: "Y".repeat(MASS_MAX_PO_TEXT_LENGTH + 1),
        }),
        goodRow({ poText: "Y".repeat(MASS_MAX_PO_TEXT_LENGTH) }),
        goodRow({ plant: "", sloc: "", materialGroup: "", uom: "", description: "" }),
    ]);

    assert.equal(MASS_MAX_PO_TEXT_LENGTH, 210);
    assert.deepEqual(errors, [
        { rowIndex: 0, fieldKey: "description", message: "Material description maksimal 40 karakter." },
        { rowIndex: 0, fieldKey: "poText", message: "PO text maksimal 210 karakter." },
    ]);
});

test("material sub group is never checked", async () => {
    const { errors } = await validateMassGridRows(createMasters(), [
        goodRow({ materialSubGroup: "NOT-A-SUBGROUP" }),
    ]);
    assert.deepEqual(errors, []);
});

test("the group check runs the same LATERAL match the staging push uses", async () => {
    const masters = createMasters();
    await validateMassGridRows(masters, [goodRow()]);
    const groupSql = masters.calls.find(sql => /WITH ORDINALITY/.test(sql));
    assert.ok(groupSql.includes(MASS_ITEM_GROUP_CODE_LATERAL_SQL));
});

test("an all-blank grid issues no queries", async () => {
    const masters = createMasters();
    const result = await validateMassGridRows(masters, [{}, {}, null]);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(masters.calls, []);
});

test("an edit checks only the fields it names and can require them to be filled", async () => {
    const masters = createMasters();
    const { errors, canonical } = await validateMassRowsAgainstMasters(
        masters,
        [
            // Only the UoM is being changed: a legacy group is left alone.
            { key: "a", fields: ["uom"], values: { uom: "pc", materialGroup: "696" } },
            // A plant change re-checks the sloc already on the item.
            { key: "b", fields: ["plant", "sloc"], values: { plant: "RI21", sloc: "WN01" } },
            { key: "c", fields: ["plant", "sloc"], values: { plant: "PS23", sloc: "" } },
        ],
        { requireFilled: true }
    );

    assert.deepEqual(errors, [
        { key: "c", fieldKey: "sloc", message: "Sloc wajib diisi." },
    ]);
    assert.deepEqual(canonical.get("a"), { uom: "PC" });
    assert.deepEqual(canonical.get("b"), { plant: "RI21", sloc: "WN01" });
});

// ---------------------------------------------------------------------------
// Endpoint wiring
// ---------------------------------------------------------------------------

const fakeResponse = () => {
    const res = { statusCode: null, body: null };
    res.status = code => {
        res.statusCode = code;
        return res;
    };
    res.json = body => {
        res.body = body;
        return res;
    };
    return res;
};

const withStubs = async (stubs, run) => {
    const originals = stubs.map(([object, key, value]) => {
        const original = object[key];
        object[key] = value;
        return [object, key, original];
    });
    try {
        return await run();
    } finally {
        for (const [object, key, original] of originals) {
            object[key] = original;
        }
    }
};

test("mass create returns master errors per cell, one per cell, and writes nothing", async () => {
    const controller = require("../controllers/MaterialController");
    const materialService = require("../services/materialService");
    const materialAiMatchService = require("../services/materialAiMatchService");
    const formidable = require("formidable");
    const masters = createMasters();
    let writes = 0;
    const rows = [
        goodRow({ uom: "PCS" }),
        goodRow({ description: "X".repeat(41), materialGroup: "696" }),
    ];

    await withStubs(
        [
            [formidable.IncomingForm.prototype, "parse", async () => [
                { rows: JSON.stringify(rows), massRequestReason: "Sparepart", fileRowIndex: ["0", "1"] },
                { files: [{ originalFilename: "a.png" }, { originalFilename: "b.png" }] },
            ]],
            [materialService, "validateMassGridRows", gridRows => validateMassGridRows(masters, gridRows)],
            [materialService, "createMassRequest", async () => { writes += 1; }],
            [materialAiMatchService, "getConfig", () => ({ enabled: false })],
        ],
        async () => {
            const res = fakeResponse();
            await controller.createMassRequest(
                { cookies: { user_id: "REQ-01" }, headers: { "content-type": "multipart/form-data" } },
                res
            );

            assert.equal(res.statusCode, 400, JSON.stringify(res.body));
            assert.deepEqual(
                res.body.errors.map(e => [e.rowIndex, e.fieldKey, e.message]),
                [
                    [1, "description", "Material description maksimal 40 karakter."],
                    [0, "uom", 'Base UoM "PCS" tidak ditemukan di master UoM.'],
                    [1, "materialGroup", 'Material group "696" tidak ditemukan di master material group.'],
                ]
            );
        }
    );
    assert.equal(writes, 0);
});

test("mass create saves plant / sloc / UoM in the master's spelling", async () => {
    const controller = require("../controllers/MaterialController");
    const materialService = require("../services/materialService");
    const materialAiMatchService = require("../services/materialAiMatchService");
    const formidable = require("formidable");
    const masters = createMasters();
    let saved;

    await withStubs(
        [
            [formidable.IncomingForm.prototype, "parse", async () => [
                {
                    rows: JSON.stringify([goodRow({ plant: "ps23", uom: "pc" }), {}, goodRow({ uom: "KWH" })]),
                    massRequestReason: "Sparepart",
                    fileRowIndex: ["0", "2"],
                },
                { files: [{ originalFilename: "a.png" }, { originalFilename: "b.png" }] },
            ]],
            [materialService, "validateMassGridRows", gridRows => validateMassGridRows(masters, gridRows)],
            [materialService, "createMassRequest", async args => { saved = args; return { id: null }; }],
            [materialAiMatchService, "getConfig", () => ({ enabled: false })],
            [materialAiMatchService, "scheduleMassRequestMatch", () => {}],
        ],
        async () => {
            const res = fakeResponse();
            await controller.createMassRequest(
                { cookies: { user_id: "REQ-01" }, headers: { "content-type": "multipart/form-data" } },
                res
            );
            assert.equal(res.statusCode, 201, JSON.stringify(res.body));
        }
    );

    assert.deepEqual(
        saved.rows.map(row => [row.plant, row.uom]),
        [["PS23", "PC"], ["PS23", "Kwh"]]
    );
});

test("the validate endpoint answers 200 with the per-cell errors", async () => {
    const controller = require("../controllers/MaterialController");
    const materialService = require("../services/materialService");
    const masters = createMasters();

    await withStubs(
        [[materialService, "validateMassGridRows", gridRows => validateMassGridRows(masters, gridRows)]],
        async () => {
            const res = fakeResponse();
            await controller.validateMassRequestRows(
                { cookies: { user_id: "REQ-01" }, body: { rows: [goodRow(), goodRow({ uom: "PCS" })] } },
                res
            );
            assert.equal(res.statusCode, 200);
            assert.equal(res.body.data.valid, false);
            assert.deepEqual(res.body.data.errors.map(e => [e.rowIndex, e.fieldKey]), [[1, "uom"]]);

            const bad = fakeResponse();
            await controller.validateMassRequestRows(
                { cookies: { user_id: "REQ-01" }, body: { rows: "nope" } },
                bad
            );
            assert.equal(bad.statusCode, 400);
        }
    );

    const routeSource = require("fs").readFileSync(
        require("path").join(__dirname, "../routes/MaterialRoute.js"),
        "utf8"
    );
    assert.match(
        routeSource,
        /"\/requests\/mass\/validate",\s+AuthToken\.authSession,\s+MaterialController\.validateMassRequestRows/
    );
});
