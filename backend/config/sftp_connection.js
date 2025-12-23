const Client = require("ssh2-sftp-client");
const dotenv = require("dotenv").config({
    path: `./${process.env.NODE_ENV}.env`,
});

/**
 * Establishes an SFTP connection and executes the provided callback function with the SFTP client.
 * @param {function(Client): Promise<any>} callback - The callback function that receives the connected SFTP client and returns a promise.
 * @returns {Promise<any>} The result of the callback execution.
 */
const SftpCB = async callback => {
    try {
        const client = new Client();
        return new Promise((resolve, reject) => {
            client
                .connect({
                    host: process.env.SFTPHOST ?? "",
                    port: 22,
                    username: process.env.SFTPUSERNAME ?? "",
                    password: process.env.SFTPPASS ?? "", // ex: -----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAACmFl
                })
                .then(() => {
                    resolve(callback(client));
                })
                .catch(error => reject(error));
        });
    } catch (error) {
        throw error;
    }
};

module.exports = SftpCB;
