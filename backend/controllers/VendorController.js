const Vendor = require("../models/VendorModel");
const formidable = require("formidable");
const db = require("../config/connection");
const fs = require("fs");
const path = require("path");
const os = require("os");

VendorController = {};

VendorController.showAll = async (req, res) => {
    try {
        const result = await Vendor.showAll(req.query);
        res.status(200).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({
            message: "Failed to fetch data",
        });
    }
};

VendorController.deleteTempId = async (req, res) => {
    try {
        const id = req.body.id;
        const ven_id = req.body.ven_id;
        const result = await Vendor.deleteTemp({ id, ven_id });
        res.status(200).send({
            status: 200,
            data: result,
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send({
            status: 500,
            data: "failed to fetch data",
        });
    }
};

VendorController.setVenDetail = async (req, res) => {
    try {
        const params = req.body;
        params.ven_id = req.params.id;
        const insert = await Vendor.setDetailVen(params);
        const response = {
            status: 200,
            message: `Vendor ${insert} successfully requested`,
        };
        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        if (err.code == "23505") {
            res.status(400).send({
                status: 400,
                message: `${err.constraint} already taken`,
            });
        } else {
            res.status(400).send({
                status: 500,
                message: err.stack,
            });
        }
    }
};

VendorController.setTempFile = async (req, res) => {
    try {
        // console.log(req);
        const extensions = ["pdf", "doc", "docx", "img", "png", "jpg", "jpeg"];
        const form = new formidable.IncomingForm();
        form.options.multiples = true;
        form.options.maxFileSize = 10 * 1024 * 1024;
        [fields, items] = await form.parse(req);
        let files = items.file_atth;
        let uploaded_files = [];
        // console.log(items);
        for (const file of files) {
            let newPath = "";
            try {
                const date = Date.now().toString();
                let name = file.originalFilename.split(".");
                if (!extensions.includes(name[name.length - 1].toLowerCase())) {
                    throw new Error("File Format invalid");
                }
                let newName =
                    name.slice(0, -1).join(".") +
                    date +
                    "." +
                    name[name.length - 1];
                let oldPath = file.filepath;
                if (os.platform() === "win32") {
                    newPath =
                        path.join(path.resolve(), "backend\\public") +
                        "\\" +
                        newName;
                } else {
                    newPath =
                        path.join(path.resolve(), "backend/public") +
                        "/" +
                        newName;
                }
                uploaded_files.push(newName);
                let rawData = fs.readFileSync(oldPath);
                await fs.promises.writeFile(newPath, rawData);
            } catch (error) {
                console.log(error);
                if (error.message === "File Format invalid") {
                    return res.status(400).send({
                        message:
                            "Invalid file format. Please upload files with valid extensions.",
                    });
                } else {
                    throw error;
                }
            }
        }
        const result = await Vendor.setTemp({ fields, uploaded_files });
        res.status(200).send({
            status: 200,
            data: result,
        });
    } catch (err) {
        console.log(err);
        if (err.code === 1016) {
            res.status(500).send({
                status: 500,
                message: "File size (~10mb) exceeded",
            });
        } else {
            res.status(500).send({
                status: 500,
                message: err.message,
            });
        }
    }
};

VendorController.getFile = async (req, res) => {
    try {
        const result = await Vendor.getFiles(req.params.id);
        // console.log(result);
        res.status(200).send({
            status: 200,
            data: result,
        });
    } catch (err) {
        res.status(500);
    }
};

VendorController.getBank = async (req, res) => {
    try {
        const result = await Vendor.getBank(req.params.id);
        // console.log(result);
        res.status(200).send({
            status: 200,
            data: result,
        });
    } catch (err) {
        res.status(500);
    }
};

VendorController.getHeaderCode = async (req, res) => {
    try {
        const result = await Vendor.getHeaderCode(req.body);
        res.status(200).send({
            data: result,
        });
    } catch (err) {
        res.status(500).send(err);
    }
};

VendorController.checkNameisExist = async (req, res) => {
    const client = await db.connect();
    try {
        const q = req.query.name;
        const checkName = await client.query(
            `select * from vendor where LOWER(name_1) like LOWER('%${q}%')`
        );
        const counts = checkName.rowCount;
        if (counts > 0) {
            throw new Error("Company already exist");
        } else {
            res.status(200).send({
                message: "Company name available",
            });
        }
    } catch (err) {
        res.status(500).send({
            message: err.message,
        });
    } finally {
        client.release();
    }
};

module.exports = VendorController;
