const toTsQuery = text => {
    return text
        .toLowerCase()
        .replace(/[,.:;_\-\/\\|()\[\]{}]/g, " ") // remove common separators
        .trim()
        .split(/\s+/)
        .map(word => `${word}:*`)
        .join(" & "); // Convert to tsquery format (e.g., "holder:* & lamp:*")
};

module.exports = toTsQuery;
