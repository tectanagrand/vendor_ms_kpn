const Crud = {
    insertItem: (toTable, val, returning = null) => {
        let valFormat = [];
        let value = [];
        let insertCol = [];
        Object.keys(val).forEach((key, ix) => {
            insertCol.push(key);
            valFormat.push("$" + (ix + 1));
        });
        Object.values(val).forEach(v => {
            value.push(v);
        });
        const qinsertCol = insertCol.join(", ");
        const qvalFormat = valFormat.join(", ");
        let query = `INSERT INTO ${toTable}(${qinsertCol}) values(${qvalFormat}) `;
        if (returning != null) {
            query += `RETURNING ${returning}`;
        } else {
            query += " ;";
        }

        return [query, value];
    },

    updateItem: (toTable, val, where, returning = null) => {
        let value = [];
        let insertCol = [];
        delete val[`${where.col}`];
        Object.keys(val).forEach((key, ix) => {
            insertCol.push(key + ` = $${ix + 1}`);
        });
        Object.values(val).forEach(v => {
            value.push(v);
        });
        const qinsertCol = insertCol.join(", ");
        let query = `UPDATE ${toTable} SET ${qinsertCol} WHERE ${where.col} = '${where.value}' `;
        if (returning != null) {
            query += `RETURNING ${returning}`;
        } else {
            query += " ;";
        }
        return [query, value];
    },

    deleteItem: (fromTable, col, value) => {
        const q = `DELETE FROM ${fromTable} WHERE ${col} = '${value}'`;
        return q;
    },
};

module.exports = Crud;
