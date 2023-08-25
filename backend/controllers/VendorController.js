const Vendor = require("../models/VendorModel");

Vendor.showAll = async (req, res) => {
    await res.status(200);
};

module.exports = Vendor;
