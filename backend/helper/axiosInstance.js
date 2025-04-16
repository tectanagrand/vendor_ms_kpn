const axios = require("axios");

const axiosInstance = token => {
    return axios.create({
        baseURL: process.env.CGAPI,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: `application/json`,
        },
    });
};

module.exports = axiosInstance;
