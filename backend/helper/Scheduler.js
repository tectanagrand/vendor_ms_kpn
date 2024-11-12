const Vendor = require("../models/VendorModel");

const SchedulerSyncStaged = async () => {
    try {
        const result = await Vendor.SyncStagingVendor();
        return result;
    } catch (error) {
        console.error(error);
    }
};

module.exports = { SchedulerSyncStaged };
