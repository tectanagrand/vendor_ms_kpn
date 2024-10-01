const Vendor = require("../models/VendorModel");
const formidable = require("formidable");
const db = require("../config/connection");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const os = require("os");
const TRANS = require("../config/transaction");
const uuid = require("uuidv4");
const Crud = require("../helper/crudquery");

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

VendorController.deleteSavedId = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await Vendor.deleteFile({ id });
        res.status(200).send({
            status: 200,
            data: result,
        });
    } catch (error) {
        console.log(error.stack);
        res.status(500).send({
            status: 500,
            message: error.message,
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
                name[0] = name[0].replace(/ /g, "_");
                // console.log(name);
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

VendorController.setBankFile = async (req, res) => {
    try {
        // console.log(req);
        const client = await db.connect();
        const id_user = req.cookies.user_id;
        const extensions = ["pdf", "doc", "docx", "img", "png", "jpg", "jpeg"];
        const form = new formidable.IncomingForm();
        form.options.maxFileSize = 10 * 1024 * 1024;
        [fields, items] = await form.parse(req);
        console.log(items);
        console.log(fields);
        let file = items.file_atth[0];
        let newPath = "";
        try {
            await client.query(TRANS.BEGIN);
            const date = Date.now().toString();
            let name = file.originalFilename.split(".");
            name[0] = name[0].replace(/ /g, "_");
            // console.log(name);
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
                    path.join(path.resolve(), "backend/public") + "/" + newName;
            }
            let rawData = fs.readFileSync(oldPath);
            await fs.promises.writeFile(newPath, rawData);
            const payload = {
                file_id: uuid.uuid(),
                ven_id: fields.ven_id[0],
                file_name: newName,
                file_type: fields.file_type[0],
                created_at: moment().format("YYYY-MM-DD"),
                created_by: id_user,
                desc_file: "",
                bank_id: fields.bank_id[0],
            };
            const [queIns, valIns] = Crud.insertItem(
                "ven_file_atth",
                payload,
                "file_name"
            );
            await client.query(queIns, valIns);
            await client.query(TRANS.COMMIT);
            res.status(200).send({
                message: `file ${newName} is uploaded`,
                file_name: newName,
                file_id: payload.file_id,
            });
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            console.log(error);
            if (error.message === "File Format invalid") {
                return res.status(400).send({
                    message:
                        "Invalid file format. Please upload files with valid extensions.",
                });
            } else {
                throw error;
            }
        } finally {
            client.release();
        }
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
        console.error(err);
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
    try {
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
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
};

VendorController.deleteVenBank = async (req, res) => {
    try {
        const { id } = req.body;
        const { bank_acc } = await Vendor.deleteBankVen(id);
        res.status(200).send({
            message: `Bank data ${bank_acc} successfully deleted `,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

VendorController.deleteFileBank = async (req, res) => {
    try {
        const client = await db.connect();
        const bank_id = req.body.bank_id;
        try {
            await client.query(TRANS.BEGIN);
            const { rows } = await client.query(
                `select file_name from ven_file_atth where bank_id = $1`,
                [bank_id]
            );
            for (const row of rows) {
                await fs.promises.unlink(
                    path.join(path.resolve(), "backend/public") +
                        "/" +
                        row.file_name
                );
            }
            await client.query(`delete from ven_file_atth where bank_id = $1`, [
                bank_id,
            ]);
            await client.query(TRANS.COMMIT);
            res.status(200).send({
                message: "Files bank deleted",
            });
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

VendorController.newBank = async (req, res) => {
    try {
        const client = await db.connect();
        const { ven_id, bankv_id, bank_country } = req.body;
        const { user_id } = req.cookies;
        try {
            await client.query(TRANS.BEGIN);
            const payload = {
                ven_id: ven_id,
                bankv_id: bankv_id,
                country: bank_country,
                created_by: user_id,
            };
            const [queIns, valIns] = Crud.insertItem(
                "ven_bank",
                payload,
                "bankv_id"
            );
            await client.query(queIns, valIns);
            await client.query(TRANS.COMMIT);
            res.status(200).send({
                bankv_id: bankv_id,
            });
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

VendorController.verify = async (req, res) => {
    const verified = req.body.verified;
    const id = req.body.ven_id;
    const notes = req.body.reject_notes || "";
    const status = verified == 1 ? "approve" : "reject";
    try {
        if (!id || !verified) {
            throw new Error("Bad Request");
        }
        const result = await Vendor.verifyVendor(verified, id, notes);
        res.status(200).send({
            message: `Success ${status} verify vendor ${id}`,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

module.exports = VendorController;
