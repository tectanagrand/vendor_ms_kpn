// Helper function to determine MIME type from file extension
const getMimeType = extension => {
    switch (extension.toLowerCase()) {
        case "pdf":
            return "application/pdf";
        case "doc":
        case "docx":
            return "application/msword";
        case "png":
            return "image/png";
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "gif":
            return "image/gif";
        default:
            return "application/octet-stream";
    }
};

module.exports = getMimeType;
