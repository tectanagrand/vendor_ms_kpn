const MaterialEmail = {
    materialEditNotification: (materialEdits, timeWindow, hostname) => {
        // Build simple table rows for material edits
        const materialRows = materialEdits
            .map(edit => {
                const attachmentLink = `<a href="${hostname}/static/${edit.attachment_path}" target="_blank">View File</a>`;
                return `
            <tr>
                <td style="padding: 8px; border: 1px solid #ccc;">${edit.material_code}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${edit.material_name || ""}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${attachmentLink}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${new Date(edit.created_at).toLocaleString("en-GB", { timeZone: "Asia/Jakarta" })}</td>
            </tr>`;
            })
            .join("");

        return `
        <html>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
            <h3>Material Attachment Updates - ${timeWindow}</h3>
            <p>The following materials have new attachments that need review:</p>
            
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="padding: 10px; border: 1px solid #ccc;">Material Code</th>
                        <th style="padding: 10px; border: 1px solid #ccc;">Material Name</th>
                        <th style="padding: 10px; border: 1px solid #ccc;">Attachment</th>
                        <th style="padding: 10px; border: 1px solid #ccc;">Date Added</th>
                    </tr>
                </thead>
                <tbody>
                    ${materialRows}
                </tbody>
            </table>
            
            <p>Total materials: ${materialEdits.length}</p>
            <p><small>Generated: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Jakarta" })} (Asia/Jakarta)</small></p>
        </body>
        </html>`;
    },
};

module.exports = MaterialEmail;
