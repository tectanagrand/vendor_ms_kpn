const SftpCB = require("../config/sftp_connection");
const path = require("path");
const { csvParser } = require("../helper/helper");
const fs = require("fs");
const fspromise = require("fs").promises;

const SFTPModel = {
    GetSFTPFiles: async (location_url, filename) => {
        return await SftpCB(async cl => {
            try {
                // const data = await cl.list("/Archive/Incoming/ExchangeRates");
                //  write destination
                const destination = path.resolve(
                    __dirname,
                    "../public/sftp_file",
                    filename
                );
                await cl.fastGet(location_url + filename, destination);
                //parse csv
                const result = await csvParser(filename);
                fs.unlinkSync(destination);
                return result;
            } catch (error) {
                throw error;
            }
        });
    },
};

module.exports = SFTPModel;
