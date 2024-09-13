const express = require("express");
const header = require("./backend/middleware/header");
const app = express();
const dotenv = require("dotenv").config({
    path: `./.env.${process.env.NODE_ENV}`,
});
const os = require("os");
const https = require("https");
const http = require("http");
const path = require("path");
const routers = require("./backend/routes");
const port = process.env.PORT;
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const db = require("./backend/config/connection");
const VerifyLogin = require("./backend/middleware/VerifyLogin");

const whitelist = [
    "http://172.30.60.50:3000",
    "http://172.29.0.1:3000",
    "http://localhost:3000",
    "https://localhost:3000",
    "https://localhost:4173",
];
const servOption = {
    cert: fs.readFileSync("./ssl/cert.pem"),
    key: fs.readFileSync("./ssl/key.pem"),
};
const corsOption = {
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
app.use(
    "/static",
    VerifyLogin.verif,
    express.static(path.join(__dirname, "backend/public"))
);
app.get("/*$", (req, res) => {
    res.sendFile(path.join(__dirname, "public/build", "index.html"));
});

process.on("uncaughtException", err => {
    console.error(err, "Uncaught Exception thrown");
    process.exit(1);
});

// setInterval(() => {
//     console.log("client:" + db.totalCount);
// }, 1000);

// const server = http.createServer(servOption, app).listen(port, () => {
//     console.log(`App running on ${port}`);
// });

const server = https
    .createServer(servOption, app)
    .listen(port, "0.0.0.0", () => {
        console.log(`App running on ${port}`);
    });
