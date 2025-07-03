// Helper for code sorting
function getCodeSortClause(tableAlias = "code", order = "asc") {
    // tableAlias: e.g., 'mig.code', 'mis.code', 'm.code'
    // order: 'asc' or 'desc'
    const direction = order && order.toLowerCase() === "desc" ? "DESC" : "ASC";
    return `${tableAlias} ${direction}`;
}

module.exports = getCodeSortClause;
