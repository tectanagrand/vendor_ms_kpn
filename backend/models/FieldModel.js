const Crud = require("../helper/crudquery");
const DBClientWrapper = require("../helper/DBClientWrapper");

const FieldModel = {
    getFieldMaster: async () => {
        return DBClientWrapper(async client => {
            try {
                const { rows } = await client.query(
                    `SELECT fields_name, indonesia as col_name from fields where is_active = true`
                );
                return rows;
            } catch (error) {
                throw error;
            }
        });
    },
};

module.exports = FieldModel;
