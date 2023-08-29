const Vendor = require("../models/VendorModel");

Vendor.showAll = async (req, res) => {
    await res.status(200);
};

Vendor.newbyVendor = async (req, res) => {
    try {
        const insert = await Vendor.newbyVendor(req.body);
        const response = {
            status: 200,
            message: `Vendor ${insert} successfully requested`,
        };
        res.status(200).send(response);
    } catch (err) {
        if (err.code == "23505") {
            res.status(400).send({
                status: 400,
                message: `${err.constraint} already taken`,
            });
        } else {
            res.status(400).send({
                status: 500,
                message: `error occured`,
            });
        }
    }
};

Vendor.setTempFile = async (req, res) => {
    console.log(req);
    try {
        const insertFile = await Vendor.setTempFile(req);
        const response = {
            status: 200,
            message: "Files Uploaded",
        };
        res.status(200).send(response);
    } catch (err) {
        // console.log(err);
        res.status(500).send({
            status: 500,
            message: err.stack,
        });
    }
};

module.exports = Vendor;
