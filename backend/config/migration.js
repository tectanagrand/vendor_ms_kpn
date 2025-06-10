const pool = require("./connection");

const migration = async () => {
    try {
        // Create MaterialItemGroup table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS "mat_item_group" (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100),
        "created_at" DATE NOT NULL,
        "updated_at" DATE NOT NULL,
        "created_by" VARCHAR(100),
        "updated_by" VARCHAR(100)
      );
    `);

        // Create MaterialItemSubGroup table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS "mat_item_sub_group" (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) NOT NULL,
        name VARCHAR(100),
        "item_group_id" INTEGER REFERENCES "mat_item_group"(id) NOT NULL,
        "created_at" DATE NOT NULL,
        "updated_at" DATE NOT NULL,
        "created_by" VARCHAR(100),
        "updated_by" VARCHAR(100),
        UNIQUE(code, item_group_id)
      );
    `);

        // Create SAP Data table (main materials table)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS "mat_sap_data" (
        id SERIAL PRIMARY KEY,
        code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100),
        description VARCHAR(100),
        long_text TEXT,
        image VARCHAR(100),
        type VARCHAR(40),
        maintenance_status VARCHAR(40),
        unit_of_measurement VARCHAR(40),
        alias1 VARCHAR(40),
        alias2 VARCHAR(40),
        alias3 VARCHAR(40),
        filter_code_1 VARCHAR(3),
        filter_code_2 VARCHAR(3),
        material_sub_group_id INTEGER REFERENCES "mat_item_sub_group"(id) NOT NULL,
        created_by VARCHAR(100),
        updated_by VARCHAR(100),
        created_at DATE NOT NULL,
        updated_at DATE NOT NULL,
        dfFromClient BOOLEAN
      );
    `);

        // Create MaterialAttachment table (now references mat_sap_data instead of mat_item)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS "mat_attachment" (
        id SERIAL PRIMARY KEY,
        attachment VARCHAR(100),
        type VARCHAR(50),
        "material_id" INTEGER REFERENCES "mat_sap_data"(id) NOT NULL,
        "created_at" DATE NOT NULL,
        "updated_at" DATE NOT NULL
      );
    `);

        console.log("Migration completed successfully");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        // Close the pool after migration
        pool.end();
    }
};

migration();
