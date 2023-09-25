const Vendor = require("../models/VendorModel");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");

VendorController = {};

VendorController.showAll = async (req, res) => {
    try {
        const result = await Vendor.showAll();
        res.status(200).send({
            status: 200,
            result: result,
        });
    } catch (err) {
        res.status(500).send({
            status: 500,
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
        const form = new formidable.IncomingForm();
        [fields, items] = await form.parse(req);
        let files = items.file_atth;
        // console.log(fields);
        // res.status(200).send({
        //     status: 200,
        //     data: { fields, items },
        // });
        let uploaded_files = [];
        // console.log(items);
        files.map(async file => {
            const date = Date.now().toString();
            let name = file.originalFilename.split(".");
            let newName = name[0] + date + "." + name[1];
            let oldPath = file.filepath;
            let newPath =
                path.join(path.resolve(), "backend\\public") + "\\" + newName;
            uploaded_files.push(newName);
            let rawData = fs.readFileSync(oldPath);
            await fs.promises.writeFile(newPath, rawData);
        });
        const result = await Vendor.setTemp({ fields, uploaded_files });
        res.status(200).send({
            status: 200,
            data: result,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: 500,
            message: err.stack,
        });
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

module.exports = VendorController;
