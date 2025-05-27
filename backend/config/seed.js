const pool = require("./connection");

// Get admin user ID for created_by/updated_by fields
const getAdminUserId = async () => {
    try {
        const { rows } = await pool.query(
            `SELECT user_id FROM mst_user WHERE fullname = 'ADMIN' LIMIT 1`
        );
        console.log("User query result:", rows);
        const userId = rows[0]?.user_id;
        if (userId) {
            console.log(
                `ℹ️ Using existing user ID: ${userId} for created_by/updated_by fields`
            );
            return userId;
        } else {
            console.log(
                "⚠️ No admin user found, using 'ADMIN' as user reference"
            );
            return "ADMIN";
        }
    } catch (error) {
        console.log("⚠️ Error finding user:", error.message);
        console.log("⚠️ Using 'ADMIN' as user reference");
        return "ADMIN";
    }
};

// Seed Material Groups
const seedMaterialGroups = async () => {
    try {
        const itemGroups = [
            { code: "001", name: "Heavy Equipment" },
            { code: "002", name: "Medical Supplies" },
            { code: "003", name: "Tools" },
            { code: "004", name: "Office Supplies" },
            { code: "005", name: "Safety Equipment" },
            { code: "006", name: "Construction Materials" },
            { code: "007", name: "Electrical Supplies" },
            { code: "008", name: "Plumbing Supplies" },
            { code: "009", name: "Automotive Parts" },
            { code: "010", name: "Laboratory Equipment" },
        ];

        for (const group of itemGroups) {
            await pool.query(
                `
        INSERT INTO mat_item_group (code, name, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (code) DO NOTHING
      `,
                [group.code, group.name, new Date(), new Date()]
            );
        }
        console.log(
            `✅ Successfully seeded ${itemGroups.length} material groups`
        );

        // Return group IDs for use in other seed functions
        const { rows: groupRows } = await pool.query(
            `SELECT id, code FROM mat_item_group`
        );
        const groupMap = {};
        groupRows.forEach(row => {
            groupMap[row.code] = row.id;
        });

        return groupMap;
    } catch (error) {
        console.error("❌ Error seeding material groups:", error);
        throw error;
    }
};

// Seed Material SubGroups
const seedMaterialSubGroups = async groupMap => {
    try {
        // Insert Material Item SubGroups - organized logically by group
        const subGroups = [
            // 001 - Heavy Equipment
            { code: "001", itemGroupId: groupMap["001"], name: "Tractors" },
            { code: "002", itemGroupId: groupMap["001"], name: "Excavators" },
            { code: "003", itemGroupId: groupMap["001"], name: "Bulldozers" },
            { code: "004", itemGroupId: groupMap["001"], name: "Loaders" },
            { code: "005", itemGroupId: groupMap["001"], name: "Cranes" },

            // 002 - Medical Supplies
            {
                code: "001",
                itemGroupId: groupMap["002"],
                name: "Surgical Instruments",
            },
            {
                code: "002",
                itemGroupId: groupMap["002"],
                name: "Diagnostic Equipment",
            },
            { code: "003", itemGroupId: groupMap["002"], name: "Disposables" },
            { code: "004", itemGroupId: groupMap["002"], name: "Medication" },
            { code: "005", itemGroupId: groupMap["002"], name: "PPE Medical" },

            // 003 - Tools
            { code: "001", itemGroupId: groupMap["003"], name: "Hand Tools" },
            { code: "002", itemGroupId: groupMap["003"], name: "Power Tools" },
            {
                code: "003",
                itemGroupId: groupMap["003"],
                name: "Measuring Tools",
            },
            {
                code: "004",
                itemGroupId: groupMap["003"],
                name: "Welding Equipment",
            },
            { code: "005", itemGroupId: groupMap["003"], name: "Garden Tools" },

            // 004 - Office Supplies
            { code: "001", itemGroupId: groupMap["004"], name: "Furniture" },
            { code: "002", itemGroupId: groupMap["004"], name: "Stationery" },
            { code: "003", itemGroupId: groupMap["004"], name: "IT Equipment" },
            {
                code: "004",
                itemGroupId: groupMap["004"],
                name: "Printers & Supplies",
            },
            {
                code: "005",
                itemGroupId: groupMap["004"],
                name: "Meeting Equipment",
            },

            // 005 - Safety Equipment
            {
                code: "001",
                itemGroupId: groupMap["005"],
                name: "Personal Protection",
            },
            { code: "002", itemGroupId: groupMap["005"], name: "Fire Safety" },
            { code: "003", itemGroupId: groupMap["005"], name: "First Aid" },
            {
                code: "004",
                itemGroupId: groupMap["005"],
                name: "Emergency Equipment",
            },
            {
                code: "005",
                itemGroupId: groupMap["005"],
                name: "Warning Signs",
            },

            // 006 - Construction Materials
            {
                code: "001",
                itemGroupId: groupMap["006"],
                name: "Cement & Concrete",
            },
            {
                code: "002",
                itemGroupId: groupMap["006"],
                name: "Bricks & Blocks",
            },
            {
                code: "003",
                itemGroupId: groupMap["006"],
                name: "Timber & Wood",
            },
            { code: "004", itemGroupId: groupMap["006"], name: "Fasteners" },
            {
                code: "005",
                itemGroupId: groupMap["006"],
                name: "Adhesives & Sealants",
            },

            // 007 - Electrical Supplies
            {
                code: "001",
                itemGroupId: groupMap["007"],
                name: "Cables & Wires",
            },
            {
                code: "002",
                itemGroupId: groupMap["007"],
                name: "Switches & Outlets",
            },
            {
                code: "003",
                itemGroupId: groupMap["007"],
                name: "Circuit Protection",
            },
            { code: "004", itemGroupId: groupMap["007"], name: "Lighting" },
            {
                code: "005",
                itemGroupId: groupMap["007"],
                name: "Electrical Tools",
            },

            // 008 - Plumbing Supplies
            {
                code: "001",
                itemGroupId: groupMap["008"],
                name: "Pipes & Fittings",
            },
            { code: "002", itemGroupId: groupMap["008"], name: "Valves" },
            { code: "003", itemGroupId: groupMap["008"], name: "Fixtures" },
            {
                code: "004",
                itemGroupId: groupMap["008"],
                name: "Pumps & Controls",
            },
            {
                code: "005",
                itemGroupId: groupMap["008"],
                name: "Water Heaters",
            },

            // 009 - Automotive Parts
            { code: "001", itemGroupId: groupMap["009"], name: "Engine Parts" },
            {
                code: "002",
                itemGroupId: groupMap["009"],
                name: "Fluids & Lubricants",
            },
            { code: "003", itemGroupId: groupMap["009"], name: "Brake System" },
            {
                code: "004",
                itemGroupId: groupMap["009"],
                name: "Electrical Parts",
            },
            { code: "005", itemGroupId: groupMap["009"], name: "Body Parts" },

            // 010 - Laboratory Equipment
            { code: "001", itemGroupId: groupMap["010"], name: "Glassware" },
            {
                code: "002",
                itemGroupId: groupMap["010"],
                name: "Measurement Instruments",
            },
            {
                code: "003",
                itemGroupId: groupMap["010"],
                name: "Chemicals & Reagents",
            },
            {
                code: "004",
                itemGroupId: groupMap["010"],
                name: "Safety Equipment",
            },
            { code: "005", itemGroupId: groupMap["010"], name: "Consumables" },
        ];

        for (const subGroup of subGroups) {
            await pool.query(
                `
        INSERT INTO mat_item_sub_group (code, name, item_group_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (code, item_group_id) DO NOTHING
      `,
                [
                    subGroup.code,
                    subGroup.name,
                    subGroup.itemGroupId,
                    new Date(),
                    new Date(),
                ]
            );
        }
        console.log(
            `✅ Successfully seeded ${subGroups.length} material subgroups`
        );

        // Get the inserted subgroup IDs and return them
        const { rows: subGroupRows } = await pool.query(`
      SELECT msg.id, msg.code as subgroup_code, msg.name, mig.code as group_code, mig.name as group_name
      FROM mat_item_sub_group msg
      JOIN mat_item_group mig ON msg.item_group_id = mig.id
    `);

        console.log(
            `🔍 Retrieved ${subGroupRows.length} subgroups from database`
        );

        const subGroupMap = {};
        subGroupRows.forEach(row => {
            const key = `${row.group_code}.${row.subgroup_code}`;
            subGroupMap[key] = {
                id: row.id,
                subgroupCode: row.subgroup_code,
                groupCode: row.group_code,
            };
        });

        return subGroupMap;
    } catch (error) {
        console.error("❌ Error seeding material subgroups:", error);
        throw error;
    }
};

// Seed Materials
const seedMaterials = async (subGroupMap, userId) => {
    try {
        // Define materials with their subgroups
        const materials = [
            // 001 - Heavy Equipment - Tractors (001.001)
            {
                name: "John Deere 5E Series Tractor",
                description: "Utility tractor for agricultural use",
                alias1: "Farm Tractor",
                alias2: "Agricultural Equipment",
                alias3: "Field Tractor",
                subgroupKey: "001.001",
                attachments: [
                    {
                        name: "john_deere_5e_series_tractor_manual.pdf",
                        type: "application/pdf",
                    },
                    {
                        name: "john_deere_5e_series_tractor_image.jpg",
                        type: "image/jpeg",
                    },
                ],
            },
            {
                name: "Kubota L2501 Compact Tractor",
                description: "Compact tractor for small farms and landscaping",
                alias1: "Compact Tractor",
                alias2: "Small Tractor",
                alias3: "Garden Tractor",
                subgroupKey: "001.001",
                attachments: [
                    {
                        name: "kubota_l2501_compact_tractor_manual.pdf",
                        type: "application/pdf",
                    },
                    {
                        name: "kubota_l2501_compact_tractor_image.jpg",
                        type: "image/jpeg",
                    },
                ],
            },

            // 001 - Heavy Equipment - Excavators (001.002)
            {
                name: "Caterpillar 320 Excavator",
                description: "Medium-sized hydraulic excavator",
                alias1: "CAT Excavator",
                alias2: "Hydraulic Excavator",
                alias3: "Construction Equipment",
                subgroupKey: "001.002",
                attachments: [
                    {
                        name: "caterpillar_320_excavator_manual.pdf",
                        type: "application/pdf",
                    },
                    {
                        name: "caterpillar_320_excavator_image.jpg",
                        type: "image/jpeg",
                    },
                ],
            },

            // 002 - Medical Supplies - Surgical Instruments (002.001)
            {
                name: "Stainless Steel Scalpel Set",
                description:
                    "Precision surgical scalpels with replaceable blades",
                alias1: "Surgical Scalpels",
                alias2: "Medical Cutting Tools",
                alias3: "Surgery Instruments",
                subgroupKey: "002.001",
                attachments: [
                    {
                        name: "stainless_steel_scalpel_set_manual.pdf",
                        type: "application/pdf",
                    },
                    {
                        name: "stainless_steel_scalpel_set_image.jpg",
                        type: "image/jpeg",
                    },
                ],
            },

            // 003 - Tools - Hand Tools (003.001)
            {
                name: "Craftsman Screwdriver Set",
                description: "Professional screwdriver set with multiple bits",
                alias1: "Screwdriver Kit",
                alias2: "Tool Set",
                alias3: "Hand Tools",
                subgroupKey: "003.001",
                attachments: [
                    {
                        name: "craftsman_screwdriver_set_manual.pdf",
                        type: "application/pdf",
                    },
                    {
                        name: "craftsman_screwdriver_set_image.jpg",
                        type: "image/jpeg",
                    },
                ],
            },

            // 003 - Tools - Power Tools (003.002)
            {
                name: "DeWalt 20V Cordless Drill",
                description: "Powerful cordless drill with lithium-ion battery",
                alias1: "Cordless Drill",
                alias2: "Power Drill",
                alias3: "DeWalt Drill",
                subgroupKey: "003.002",
                attachments: [
                    {
                        name: "dewalt_20v_cordless_drill_manual.pdf",
                        type: "application/pdf",
                    },
                    {
                        name: "dewalt_20v_cordless_drill_image.jpg",
                        type: "image/jpeg",
                    },
                ],
            },

            // 004 - Office Supplies - Furniture (004.001)
            {
                name: "Ergonomic Office Chair",
                description: "Adjustable office chair with lumbar support",
                alias1: "Office Chair",
                alias2: "Desk Chair",
                alias3: "Work Chair",
                subgroupKey: "004.001",
                attachments: [
                    {
                        name: "ergonomic_office_chair_manual.pdf",
                        type: "application/pdf",
                    },
                    {
                        name: "ergonomic_office_chair_image.jpg",
                        type: "image/jpeg",
                    },
                ],
            },

            // 005 - Safety Equipment - Fire Safety (005.002)
            {
                name: "Fire Extinguisher 5kg",
                description: "ABC powder fire extinguisher",
                alias1: "ABC Extinguisher",
                alias2: "Fire Safety",
                alias3: "Fire Protection",
                subgroupKey: "005.002",
                attachments: [
                    {
                        name: "fire_extinguisher_5kg_manual.pdf",
                        type: "application/pdf",
                    },
                    {
                        name: "fire_extinguisher_5kg_image.jpg",
                        type: "image/jpeg",
                    },
                ],
            },

            // 006 - Construction Materials - Cement & Concrete (006.001)
            {
                name: "Portland Cement 50kg",
                description: "General purpose portland cement",
                alias1: "Portland Cement",
                alias2: "Building Cement",
                alias3: "Construction Material",
                subgroupKey: "006.001",
                attachments: [
                    {
                        name: "portland_cement_50kg_manual.pdf",
                        type: "application/pdf",
                    },
                    {
                        name: "portland_cement_50kg_image.jpg",
                        type: "image/jpeg",
                    },
                ],
            },

            // 007 - Electrical Supplies - Lighting (007.004)
            {
                name: "LED Panel Light 60x60cm",
                description: "Energy-efficient LED panel for offices",
                alias1: "Office Lighting",
                alias2: "LED Panel",
                alias3: "Ceiling Light",
                subgroupKey: "007.004",
                attachments: [
                    {
                        name: "led_panel_light_60x60cm_manual.pdf",
                        type: "application/pdf",
                    },
                    {
                        name: "led_panel_light_60x60cm_image.jpg",
                        type: "image/jpeg",
                    },
                ],
            },
        ];

        console.log(`🔍 Preparing to insert ${materials.length} materials`);

        let totalMaterials = 0;
        let totalAttachments = 0;

        // Insert materials into mat_sap_data
        for (const material of materials) {
            // Validate subgroup mapping
            if (!subGroupMap[material.subgroupKey]) {
                console.warn(
                    `⚠️ Skipping material "${material.name}" because subgroup key ${material.subgroupKey} was not found`
                );
                continue;
            }

            const subgroupInfo = subGroupMap[material.subgroupKey];

            // Generate code with three parts (XXX.YYY.ZZZ)
            const groupCodePadded = subgroupInfo.groupCode.padStart(3, "0");
            const subgroupCodePadded = subgroupInfo.subgroupCode.padStart(
                3,
                "0"
            );
            const thirdPart = "001"; // Default for the third part

            const fullCode = `${groupCodePadded}.${subgroupCodePadded}.${thirdPart}`;

            console.log(
                `   - Inserting material: ${material.name} (code: ${fullCode})`
            );

            try {
                // Insert into mat_sap_data
                const { rows } = await pool.query(
                    `
                INSERT INTO mat_sap_data (
                    code,
                    name,
                    description,
                    alias1,
                    alias2,
                    alias3,
                    image,
                    filter_code_1,
                    filter_code_2,
                    material_sub_group_id,
                    created_by,
                    updated_by,
                    created_at,
                    updated_at,
                    dfFromClient
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING id
              `,
                    [
                        fullCode,
                        material.name,
                        material.description,
                        material.alias1,
                        material.alias2,
                        material.alias3,
                        `${material.name
                            .replace(/\s+/g, "_")
                            .toLowerCase()}_image.jpg`,
                        groupCodePadded,
                        subgroupCodePadded,
                        subgroupInfo.id,
                        userId,
                        userId,
                        new Date(),
                        new Date(),
                        false, // Not from client
                    ]
                );

                const materialId = rows[0].id;
                totalMaterials++;

                // Add attachments for the material
                if (material.attachments && material.attachments.length > 0) {
                    await seedAttachments(materialId, material.attachments);
                    totalAttachments += material.attachments.length;
                }
            } catch (error) {
                console.error(
                    `❌ Error inserting material "${material.name}":`,
                    error.message
                );
            }
        }

        console.log(`✅ Successfully seeded ${totalMaterials} materials`);
        console.log(`✅ Successfully seeded ${totalAttachments} attachments`);

        return { totalMaterials, totalAttachments };
    } catch (error) {
        console.error("❌ Error seeding materials:", error);
        throw error;
    }
};

// Seed Client Materials (not from SAP)
const seedClientMaterials = async (defaultSubgroupId, userId) => {
    try {
        // Add a couple client-created items (not assigned to any subgroup)
        const clientMaterials = [
            {
                code: "999.001.001",
                name: "Client Material 1",
                description: "Material created by client, not from SAP",
                alias1: "Client Item 1",
                alias2: "Custom Item",
                alias3: null,
                image: "client_material_1.jpg",
                filter_code_1: "999",
                filter_code_2: "001",
                dfFromClient: true,
                attachments: [
                    {
                        name: "client_material_1_spec.pdf",
                        type: "application/pdf",
                    },
                    { name: "client_material_1_image.jpg", type: "image/jpeg" },
                ],
            },
            {
                code: "999.002.001",
                name: "Client Material 2",
                description: "Another material created by client",
                alias1: "Client Item 2",
                alias2: "Custom Item",
                alias3: null,
                image: "client_material_2.jpg",
                filter_code_1: "999",
                filter_code_2: "002",
                dfFromClient: true,
                attachments: [
                    {
                        name: "client_material_2_spec.pdf",
                        type: "application/pdf",
                    },
                ],
            },
        ];

        let totalClientMaterials = 0;
        let totalClientAttachments = 0;

        for (const material of clientMaterials) {
            try {
                // For client materials, we don't require a subgroup but use a default one
                const { rows } = await pool.query(
                    `
                INSERT INTO mat_sap_data (
                    code,
                    name,
                    description,
                    alias1,
                    alias2,
                    alias3,
                    image,
                    filter_code_1,
                    filter_code_2,
                    material_sub_group_id,
                    created_by,
                    updated_by,
                    created_at,
                    updated_at,
                    dfFromClient
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING id
              `,
                    [
                        material.code,
                        material.name,
                        material.description,
                        material.alias1,
                        material.alias2,
                        material.alias3,
                        material.image,
                        material.filter_code_1,
                        material.filter_code_2,
                        defaultSubgroupId,
                        userId,
                        userId,
                        new Date(),
                        new Date(),
                        material.dfFromClient,
                    ]
                );

                const materialId = rows[0].id;
                totalClientMaterials++;

                // Add attachments for the client material
                if (material.attachments && material.attachments.length > 0) {
                    await seedAttachments(materialId, material.attachments);
                    totalClientAttachments += material.attachments.length;
                }

                console.log(`   - Inserted client material: ${material.name}`);
            } catch (error) {
                console.error(
                    `❌ Error inserting client material "${material.name}":`,
                    error.message
                );
            }
        }

        console.log(
            `✅ Successfully seeded ${totalClientMaterials} client materials`
        );
        console.log(
            `✅ Successfully seeded ${totalClientAttachments} client attachments`
        );

        return { totalClientMaterials, totalClientAttachments };
    } catch (error) {
        console.error("❌ Error seeding client materials:", error);
        throw error;
    }
};

// Seed Attachments for a material
const seedAttachments = async (materialId, attachments) => {
    try {
        for (const attachment of attachments) {
            await pool.query(
                `
                INSERT INTO mat_attachment (attachment, type, material_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    attachment.name,
                    attachment.type,
                    materialId,
                    new Date(),
                    new Date(),
                ]
            );
        }
        return true;
    } catch (error) {
        console.error(
            `❌ Error seeding attachments for material ${materialId}:`,
            error
        );
        throw error;
    }
};

// Main seed function that orchestrates all seed operations
const seed = async () => {
    let connection;
    try {
        // Get admin user ID
        const userId = await getAdminUserId();

        // Seed groups
        console.log("🌱 Seeding material groups...");
        const groupMap = await seedMaterialGroups();

        // Seed subgroups
        console.log("🌱 Seeding material subgroups...");
        const subGroupMap = await seedMaterialSubGroups(groupMap);

        // Seed materials
        console.log("🌱 Seeding materials...");
        const { totalMaterials, totalAttachments } = await seedMaterials(
            subGroupMap,
            userId
        );

        // Seed client materials
        console.log("🌱 Seeding client materials...");
        const defaultSubgroupId = subGroupMap["001.001"].id; // Use first subgroup as default
        const { totalClientMaterials, totalClientAttachments } =
            await seedClientMaterials(defaultSubgroupId, userId);

        console.log("🎉 Seeding completed successfully!");
        console.log(`🔢 Summary:
        - ${Object.keys(groupMap).length} material groups
        - ${Object.keys(subGroupMap).length} material subgroups
        - ${totalMaterials} materials with ${totalAttachments} attachments
        - ${totalClientMaterials} client materials with ${totalClientAttachments} attachments`);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        // Close the pool after seeding
        await pool.end();
    }
};

// Function to seed only material groups
const seedOnlyGroups = async () => {
    try {
        console.log("🌱 Seeding only material groups...");
        const groupMap = await seedMaterialGroups();
        console.log(
            `✅ Successfully seeded ${
                Object.keys(groupMap).length
            } material groups`
        );
    } catch (error) {
        console.error("❌ Seeding groups failed:", error);
    } finally {
        await pool.end();
    }
};

// Function to seed only material subgroups
const seedOnlySubGroups = async () => {
    try {
        console.log("🌱 Seeding only material subgroups...");
        const groupMap = await seedMaterialGroups(); // We still need the group IDs
        const subGroupMap = await seedMaterialSubGroups(groupMap);
        console.log(
            `✅ Successfully seeded ${
                Object.keys(subGroupMap).length
            } material subgroups`
        );
    } catch (error) {
        console.error("❌ Seeding subgroups failed:", error);
    } finally {
        await pool.end();
    }
};

// Function to seed only materials
const seedOnlyMaterials = async () => {
    try {
        console.log("🌱 Seeding only materials...");
        const userId = await getAdminUserId();
        const groupMap = await seedMaterialGroups();
        const subGroupMap = await seedMaterialSubGroups(groupMap);
        const { totalMaterials, totalAttachments } = await seedMaterials(
            subGroupMap,
            userId
        );
        console.log(
            `✅ Successfully seeded ${totalMaterials} materials with ${totalAttachments} attachments`
        );
    } catch (error) {
        console.error("❌ Seeding materials failed:", error);
    } finally {
        await pool.end();
    }
};

// Function to seed only client materials
const seedOnlyClientMaterials = async () => {
    try {
        console.log("🌱 Seeding only client materials...");
        const userId = await getAdminUserId();
        const groupMap = await seedMaterialGroups();
        const subGroupMap = await seedMaterialSubGroups(groupMap);
        const defaultSubgroupId = subGroupMap["001.001"].id;
        const { totalClientMaterials, totalClientAttachments } =
            await seedClientMaterials(defaultSubgroupId, userId);
        console.log(
            `✅ Successfully seeded ${totalClientMaterials} client materials with ${totalClientAttachments} attachments`
        );
    } catch (error) {
        console.error("❌ Seeding client materials failed:", error);
    } finally {
        await pool.end();
    }
};

// Run the appropriate seed function based on command line argument
const args = process.argv.slice(2);
if (args.length > 0) {
    const targetTable = args[0].toLowerCase();
    console.log(`🚀 Running seed for specific table: ${targetTable}`);

    switch (targetTable) {
        case "groups":
            seedOnlyGroups();
            break;
        case "subgroups":
            seedOnlySubGroups();
            break;
        case "materials":
            seedOnlyMaterials();
            break;
        case "client":
            seedOnlyClientMaterials();
            break;
        case "attachments":
            console.log("❌ Attachments can only be seeded with materials.");
            console.log(
                "Please use 'materials' or 'client' to seed attachments."
            );
            process.exit(1);
        default:
            console.log("❌ Unknown table specified.");
            console.log(
                "Available options: groups, subgroups, materials, client"
            );
            process.exit(1);
    }
} else {
    // If no argument provided, run the full seed
    seed();
}
