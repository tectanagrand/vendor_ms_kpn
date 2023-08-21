const express = require("express");
const app = express();
const dotenv = require("dotenv");
const path = require("path");
const routers = require("./routes");
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(routers);

app.listen(port, () => {
    console.log(`App running on ${port}`);
});
