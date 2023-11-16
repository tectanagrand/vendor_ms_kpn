const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const path = require("path");
const routers = require("./backend/routes");
const port = process.env.PORT;
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(routers);

app.listen(port, () => {
    console.log(`App running on ${port}`);
});
