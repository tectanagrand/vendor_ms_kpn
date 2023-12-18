const express = require("express");
const header = require("./backend/middleware/header");
const app = express();
const dotenv = require("dotenv").config();
const os = require("os");
const https = require("https");
const path = require("path");
const routers = require("./backend/routes");
const port = process.env.PORT;
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const whitelist = [
    "http://172.30.60.50:3000",
    "http://172.29.0.1:3000",
    "http://localhost:3000",
];
const servOption = {
    cert: fs.readFileSync("./ssl/certificate.crt"),
    key: fs.readFileSync("./ssl/private-key.pem"),
};
const corsOption = {
    // origin: [
    //     "http://172.30.60.86:3000",
    //     "http://127.0.0.1:3003/",
    //     "http://localhost:3000/",
    //     "http://vms.com:3000/",
    // ],
    origin: function (req, callback) {
        if (whitelist.indexOf(req) !== -1) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE", "PATCH"],
    credentials: true,
    exposedHeaders: ["set-cookie"],
};

// app.use(header);
app.set("view engine", "ejs");
app.use(header);
if (os.platform() === "linux") {
    app.set("views", path.join(__dirname, "/backend/views/pages"));
} else {
    app.set("views", path.join(__dirname, "\\backend\\views\\pages"));
}
app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(routers);

app.use(express.static(path.join(__dirname, "public/build")));
app.get("/*$", (req, res) => {
    res.sendFile(path.join(__dirname, "public/build", "index.html"));
});

const server = https.createServer(servOption, app).listen(port, () => {
    console.log(`App running on ${port}`);
});
// app.listen(port, "0.0.0.0", () => {
//     console.log(`App running on ${port}`);
// });
