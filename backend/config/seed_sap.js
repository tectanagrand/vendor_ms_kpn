const axios = require("axios");
const pool = require("./connection");

const createdAt = "ERSDA";
const updatedAt = "LAEDA";

// Configure axios instance with common settings
const sapClient = axios.create({
    headers: {
        Authorization: `Basic ${Buffer.from(
            `${process.env.SAP_USER}:${process.env.SAP_PWD}`
        ).toString("base64")}`,
        "Content-Type": "application/json",
    },
    timeout: 30000, // 30 second timeout
});

// In-memory database simulation
// In a real scenario, replace this with your actual database operations
const existingRecords = new Map(); // MATNR -> record

/**
 * Fetch data for a specific date range and field
 * @param {string} fieldName - Field to filter on (ERSDA or LAEDA)
 * @param {string} startDate - Start date in format YYYYMMDD
 * @param {string} endDate - End date in format YYYYMMDD
 * @returns {Promise<Array>} - Results array
 */
const fetchDataByDateRange = async (fieldName, startDate, endDate) => {
    const SAP_URL = `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZMM_MATERIAL_MASTER_SRV/MATERIALSet?$filter=(${fieldName} gt '${startDate}')and(${fieldName} lt '${endDate}')&$format=json`;

    try {
        console.log(
            `Fetching ${fieldName} data from ${startDate} to ${endDate}...`
        );
        const response = await sapClient.get(SAP_URL);
        const results = response.data.d.results;
        console.log(`Retrieved ${results.length} records`);
        return results;
    } catch (error) {
        console.error(
            `Error fetching data for ${fieldName} between ${startDate} and ${endDate}:`,
            error.message
        );
        return [];
    }
};

/**
 * Process results to insert or update database
 * @param {Array} items - Results from API
 * @param {string} source - Source of data (creation or update)
 * @returns {Object} - Statistics about operations performed
 */
const processItems = (items, source) => {
    const stats = {
        inserted: 0,
        updated: 0,
        skipped: 0,
        skippedNotStartsWith9: 0,
        total: items.length,
    };

    for (const item of items) {
        const materialId = item.MATNR;

        // Skip materials that don't start with 9
        if (!materialId.startsWith("9")) {
            stats.skippedNotStartsWith9++;
            console.log(
                `[${source}] Skipped (doesn't start with 9): ${materialId}`
            );
            continue;
        }

        // Check if record already exists in our database
        if (!existingRecords.has(materialId)) {
            // New record - insert
            existingRecords.set(materialId, item);
            stats.inserted++;
            console.log(`[${source}] Inserted: ${materialId}`);
        } else {
            // Existing record - check if it needs updating
            const existingItem = existingRecords.get(materialId);

            // Compare records to see if there are differences
            // This is a simplified comparison - in reality, you'd compare specific fields
            if (hasChanges(existingItem, item)) {
                existingRecords.set(materialId, item);
                stats.updated++;
                console.log(`[${source}] Updated: ${materialId}`);
            } else {
                stats.skipped++;
                // Skip logging for skipped items to reduce console output
            }
        }
    }

    return stats;
};

/**
 * Compare two records to check for changes
 * @param {Object} existing - Existing record
 * @param {Object} newItem - New record
 * @returns {boolean} - True if changes detected
 */
const hasChanges = (existing, newItem) => {
    // In a real implementation, you would compare specific fields that matter
    // This is a simplified example that checks a few important fields
    const fieldsToCompare = [
        "MAKTX", // Material description
        "MEINS", // Base unit of measure
        "MATKL", // Material group
        "MTART", // Material type
        // Add other relevant fields here
    ];

    for (const field of fieldsToCompare) {
        if (existing[field] !== newItem[field]) {
            return true;
        }
    }

    return false;
};

/**
 * Format a SAP date string to PostgreSQL date format
 * @param {string} sapDate - Date in SAP format (YYYYMMDD)
 * @returns {string} - Formatted date or current date if SAP date is null/empty
 */
const formatDate = sapDate => {
    if (!sapDate || sapDate === "00000000") {
        return new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD format
    }

    // Format from YYYYMMDD to YYYY-MM-DD
    const year = sapDate.substring(0, 4);
    const month = sapDate.substring(4, 6);
    const day = sapDate.substring(6, 8);
    return `${year}-${month}-${day}`;
};

/**
 * Extract item group and subgroup from material number
 * @param {string} materialCode - Material number in format XXX.YYY.ZZZ
 * @returns {Object} - Item group and subgroup
 */
const extractGroups = materialCode => {
    const parts = materialCode.split(".");
    return {
        itemGroup: parts.length > 0 ? parts[0] : "",
        itemSubGroup: parts.length > 1 ? parts[1] : "",
    };
};

/**
 * Decode base64 string to plain text
 * @param {string} base64String - Base64 encoded string
 * @returns {string} - Decoded string or null if invalid
 */
const decodeBase64 = base64String => {
    if (!base64String) return "";

    try {
        // Check if the string is in base64 format
        const isBase64 = /^[A-Za-z0-9+/=]+$/.test(base64String.trim());

        if (!isBase64) {
            return base64String; // Return as is if not base64
        }

        // Decode the base64 string
        const decodedString = Buffer.from(base64String, "base64").toString(
            "utf-8"
        );
        return decodedString;
    } catch (error) {
        console.error(`Error decoding base64 string: ${error.message}`);
        return base64String; // Return original string if decoding fails
    }
};

/**
 * Save a material record to the database
 * @param {Object} item - Material record from SAP
 * @returns {Promise<boolean>} - Success status
 */
const saveToDatabase = async item => {
    try {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            // Process dates
            const createdDate = formatDate(item[createdAt]);
            const updatedDate = formatDate(item[updatedAt]);

            // Extract group codes
            const { itemGroup, itemSubGroup } = extractGroups(item.MATNR);

            // Decode LTEXT from base64 if exists
            const longText = decodeBase64(item.LTEXT);

            // 1. Find or insert item group
            let itemGroupId;
            const groupResult = await client.query(
                "SELECT id FROM mat_item_group WHERE code = $1",
                [itemGroup]
            );

            if (groupResult.rows.length === 0) {
                // Insert new item group
                const insertGroup = await client.query(
                    "INSERT INTO mat_item_group(code, name, created_at, updated_at, created_by, updated_by) VALUES($1, $2, $3, $4, $5, $5) RETURNING id",
                    [
                        itemGroup,
                        `Group ${itemGroup}`,
                        createdDate,
                        updatedDate,
                        item.ERNAM || "SYSTEM",
                    ]
                );
                itemGroupId = insertGroup.rows[0].id;
                console.log(`Created new item group: ${itemGroup}`);
            } else {
                itemGroupId = groupResult.rows[0].id;
            }

            // 2. Find or insert item subgroup
            let subGroupId;
            const subGroupResult = await client.query(
                "SELECT id FROM mat_item_sub_group WHERE code = $1 AND item_group_id = $2",
                [itemSubGroup, itemGroupId]
            );

            if (subGroupResult.rows.length === 0 && itemSubGroup) {
                // Insert new item subgroup
                const insertSubGroup = await client.query(
                    "INSERT INTO mat_item_sub_group(code, name, item_group_id, created_at, updated_at, created_by, updated_by) VALUES($1, $2, $3, $4, $5, $6, $6) RETURNING id",
                    [
                        itemSubGroup,
                        `Subgroup ${itemSubGroup}`,
                        itemGroupId,
                        createdDate,
                        updatedDate,
                        item.ERNAM || "SYSTEM",
                    ]
                );
                subGroupId = insertSubGroup.rows[0].id;
                console.log(
                    `Created new item subgroup: ${itemSubGroup} (under ${itemGroup})`
                );
            } else if (subGroupResult.rows.length > 0) {
                subGroupId = subGroupResult.rows[0].id;
            } else {
                // If no subgroup, we can't proceed (foreign key constraint)
                throw new Error(
                    `No subgroup available for material ${item.MATNR}`
                );
            }

            // 3. Check if material already exists
            const materialResult = await client.query(
                "SELECT id FROM mat_sap_data WHERE code = $1",
                [item.MATNR]
            );

            if (materialResult.rows.length === 0) {
                // Insert new material
                await client.query(
                    `
                    INSERT INTO mat_sap_data(
                        code, name, description, long_text, type,
                        maintenance_status, unit_of_measurement,
                        material_sub_group_id, created_by, updated_by,
                        created_at, updated_at, dfFromClient
                    ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `,
                    [
                        item.MATNR, // code
                        item.MAKTX || null, // name
                        item.MAKTX || null, // description (same as MAKTX)
                        longText, // long_text (decoded from base64)
                        item.MTART || null, // type
                        item.PSTAT || null, // maintenance_status
                        item.MEINS || null, // unit_of_measurement
                        subGroupId, // material_sub_group_id
                        item.ERNAM || "SYSTEM", // created_by
                        item.AENAM || "SYSTEM", // updated_by
                        createdDate, // created_at
                        updatedDate, // updated_at
                        false, // dfFromClient
                    ]
                );
                console.log(`Inserted material: ${item.MATNR}`);
            } else {
                // Update existing material
                await client.query(
                    `
                    UPDATE mat_sap_data SET
                        name = $1, description = $2, long_text = $3, type = $4,
                        maintenance_status = $5, unit_of_measurement = $6,
                        material_sub_group_id = $7, updated_by = $8, updated_at = $9
                    WHERE code = $10
                `,
                    [
                        item.MAKTX || null, // name
                        item.MAKTX || null, // description
                        longText, // long_text (decoded from base64)
                        item.MTART || null, // type
                        item.PSTAT || null, // maintenance_status
                        item.MEINS || null, // unit_of_measurement
                        subGroupId, // material_sub_group_id
                        item.AENAM || "SYSTEM", // updated_by
                        updatedDate, // updated_at
                        item.MATNR, // code (for WHERE)
                    ]
                );
                console.log(`Updated material: ${item.MATNR}`);
            }

            await client.query("COMMIT");
            return true;
        } catch (err) {
            await client.query("ROLLBACK");
            console.error(
                `Database error for material ${item.MATNR}:`,
                err.message
            );
            return false;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Connection error:", err.message);
        return false;
    }
};

/**
 * Process a single year range
 * @param {string} startYear - Start year in YYYY format
 * @param {string} endYear - End year in YYYY format
 */
const processYearRange = async (startYear, endYear) => {
    const startDate = `${startYear}0101`;
    const endDate = `${endYear}0101`;

    console.log(`\n===== PROCESSING YEAR ${startYear} =====`);

    const results = await fetchDataByDateRange(updatedAt, startDate, endDate);
    const stats = processItems(results, `YEAR_${startYear}`);

    console.log(`\nYear ${startYear} to ${endYear} Summary:`);
    console.log(`  - Total records: ${stats.total}`);
    console.log(`  - Inserted: ${stats.inserted}`);
    console.log(`  - Updated: ${stats.updated}`);
    console.log(`  - Skipped (duplicates): ${stats.skipped}`);
    console.log(
        `  - Skipped (not starting with 9): ${stats.skippedNotStartsWith9}`
    );

    return {
        totalRecords: stats.total,
        inserted: stats.inserted,
        updated: stats.updated,
        skippedDuplicates: stats.skipped,
        skippedNotStartsWith9: stats.skippedNotStartsWith9,
    };
};

/**
 * Save collected records to database
 * @param {Array} records - Array of material records
 * @returns {Promise<Object>} - Statistics about database operations
 */
const saveToDatabaseBatch = async records => {
    console.log(`\n===== SAVING TO DATABASE =====`);
    console.log(`Total records to save: ${records.length}`);

    const stats = {
        success: 0,
        failed: 0,
    };

    for (const record of records) {
        const success = await saveToDatabase(record);
        if (success) {
            stats.success++;
        } else {
            stats.failed++;
        }

        // Log progress every 10 records
        if ((stats.success + stats.failed) % 10 === 0) {
            console.log(
                `Progress: ${stats.success + stats.failed}/${
                    records.length
                } (Success: ${stats.success}, Failed: ${stats.failed})`
            );
        }
    }

    console.log(`\nDatabase operation complete:`);
    console.log(`  - Success: ${stats.success}`);
    console.log(`  - Failed: ${stats.failed}`);

    return stats;
};

/**
 * Main function to fetch data for selected years
 */
const fetchAllData = async () => {
    let totalRawRecords = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkippedDuplicates = 0;
    let totalSkippedNotStartsWith9 = 0;

    console.log("===== PROCESSING CREATION DATE (ERSDA) =====");

    // Comment/uncomment the years you want to process

    // Process 2024 data
    // const stats2024 = await processYearRange("2024", "2025");
    // totalRawRecords += stats2024.totalRecords;
    // totalInserted += stats2024.inserted;
    // totalUpdated += stats2024.updated;
    // totalSkippedDuplicates += stats2024.skippedDuplicates;
    // totalSkippedNotStartsWith9 += stats2024.skippedNotStartsWith9;

    // Process 2023 data
    // const stats2023 = await processYearRange("2023", "2024");
    // totalRawRecords += stats2023.totalRecords;
    // totalInserted += stats2023.inserted;
    // totalUpdated += stats2023.updated;
    // totalSkippedDuplicates += stats2023.skippedDuplicates;
    // totalSkippedNotStartsWith9 += stats2023.skippedNotStartsWith9;

    // Process 2022 data - comment out if not needed

    // const stats2022 = await processYearRange("2022", "2023");
    // totalRawRecords += stats2022.totalRecords;
    // totalInserted += stats2022.inserted;
    // totalUpdated += stats2022.updated;
    // totalSkippedDuplicates += stats2022.skippedDuplicates;
    // totalSkippedNotStartsWith9 += stats2022.skippedNotStartsWith9;

    // Process 2021 data - comment out if not needed

    // const stats2021 = await processYearRange("2021", "2022");
    // totalRawRecords += stats2021.totalRecords;
    // totalInserted += stats2021.inserted;
    // totalUpdated += stats2021.updated;
    // totalSkippedDuplicates += stats2021.skippedDuplicates;
    // totalSkippedNotStartsWith9 += stats2021.skippedNotStartsWith9;

    // Process 2020 data - comment out if not needed

    const stats2020 = await processYearRange("2020", "2021");
    totalRawRecords += stats2020.totalRecords;
    totalInserted += stats2020.inserted;
    totalUpdated += stats2020.updated;
    totalSkippedDuplicates += stats2020.skippedDuplicates;
    totalSkippedNotStartsWith9 += stats2020.skippedNotStartsWith9;

    // Process 2019 data - comment out if not needed

    // const stats2019 = await processYearRange("2019", "2020");
    // totalRawRecords += stats2019.totalRecords;
    // totalInserted += stats2019.inserted;
    // totalUpdated += stats2019.updated;
    // totalSkippedDuplicates += stats2019.skippedDuplicates;
    // totalSkippedNotStartsWith9 += stats2019.skippedNotStartsWith9;

    console.log("\n===== FINAL SUMMARY =====");
    console.log(`Total raw records retrieved: ${totalRawRecords}`);
    console.log(`Total records inserted: ${totalInserted}`);
    console.log(`Total records updated: ${totalUpdated}`);
    console.log(
        `Total records skipped (duplicates): ${totalSkippedDuplicates}`
    );
    console.log(
        `Total records skipped (not starting with 9): ${totalSkippedNotStartsWith9}`
    );
    console.log(`Total processed: ${totalInserted + totalUpdated}`);
    console.log(
        `Total skipped: ${totalSkippedDuplicates + totalSkippedNotStartsWith9}`
    );
    console.log(`Final database size: ${existingRecords.size} records`);

    // Display sample records
    if (existingRecords.size > 0) {
        console.log("\nSample records (first 3):");
        let count = 0;
        for (const [key, value] of existingRecords.entries()) {
            console.log(JSON.stringify(value, null, 2));
            count++;
            if (count >= 3) break;
        }
    }

    // Convert the Map to an array of values for database insertion
    const recordsArray = Array.from(existingRecords.values());

    // Save to database
    const dbStats = await saveToDatabaseBatch(recordsArray);

    return {
        collectedRecords: recordsArray,
        dbStats,
    };
};

// Execute and time the operation
console.time("Total execution time");
fetchAllData()
    .then(results => {
        console.timeEnd("Total execution time");
        console.log(
            `\nData processing complete. Total records: ${results.collectedRecords.length}`
        );
        console.log(
            `Database insertion: Success=${results.dbStats.success}, Failed=${results.dbStats.failed}`
        );

        // Close the database pool
        pool.end().then(() => {
            console.log("Database connection closed");
        });
    })
    .catch(error => {
        console.error("Error in data processing:", error);

        // Make sure to close the pool even if there's an error
        pool.end().then(() => {
            console.log("Database connection closed");
        });
    });
