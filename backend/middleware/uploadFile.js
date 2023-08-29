const formidable = require("formidable");

const uploadFile = async params => {
    console.log(params);
    const date = Date.now().toString();
    let uploaded_files = [];
    const writeFile = await new Promise(async (resolve, reject) => {
        const form = new formidable.IncomingForm();
        [fields, items] = await form.parse(params);
        let files = items.file_atth;
        files.map(file => {
            let name = file.originalFilename.split(".");
            let newName = name[0] + "_" + date + "." + name[1];
            files.push(newName);
            let oldPath = file.filepath;
            let newPath = path.join(path.resolve(), "public") + "\\" + newName;
            let rawData = fs.readFileSync(oldPath);

            fs.writeFile(newPath, rawData, function (err) {
                if (err) reject(err);
            });
        });
        resolve([fields, uploaded_files]);
    });
    return writeFile;
};

module.exports = uploadFile;
