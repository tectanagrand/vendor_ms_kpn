const express = require("express");
const header = require("./backend/middleware/header");
const app = express();
const dotenv = require("dotenv").config();
const path = require("path");
const routers = require("./backend/routes");
const port = process.env.PORT;
const cors = require("cors");
const cookieParser = require("cookie-parser");
const whitelist = [
    "http://172.30.60.86:3000",
    "http://localhost:3003/",
    "http://127.0.0.1:3003/",
    "http://localhost:3000/",
    "http://vms.com:3000/",
    "http://localhost:5000/",
];
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
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE"],
    credentials: true,
    exposedHeaders: ["set-cookie"],
};

// app.use(header);
app.set("view engine", "ejs");
app.use(header);
app.set("views", path.join(__dirname, "\\backend\\views\\pages"));
app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(routers);

app.use(express.static(path.join(__dirname, "public/build")));
app.get("/*$", (req, res) => {
    res.sendFile(path.join(__dirname, "public/build", "index.html"));
});
app.listen(port, "0.0.0.0", () => {
    console.log(`App running on ${port}`);
});
