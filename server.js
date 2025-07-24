const express = require("express");
const header = require("./backend/middleware/header");
const app = express();
const dotenv = require("dotenv").config({
    path: `./${process.env.NODE_ENV}.env`,
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
const { SchedulerSyncStaged } = require("./backend/helper/Scheduler");
const Material = require("./backend/models/MaterialModel");
const Emailer = require("./backend/models/EmailModel");
const cron = require("node-cron");
const moment = require("moment-timezone");

const whitelist = [
    "http://172.30.60.50:3000",
    "http://172.29.0.1:3000",
    "http://localhost:3000",
    "https://localhost:3000",
    "https://localhost:4173",
    "https://4c59-49-156-20-130.ngrok-free.app",
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
    exposedHeaders: ["set-cookie", "Content-Disposition"],
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
app.use("/static", express.static(path.join(__dirname, "backend/public")));
app.get("/*$", (req, res) => {
    res.sendFile(path.join(__dirname, "public/build", "index.html"));
});

process.on("uncaughtException", err => {
    console.error(err, "Uncaught Exception thrown");
    process.exit(1);
});

setInterval(
    async () => {
        await SchedulerSyncStaged();
    },
    1000 * 60 * 11
); //11 minutes

// setInterval(() => {
//     console.log("client:" + db.totalCount);
// }, 1000);

// const server = http.createServer(servOption, app).listen(port, () => {
//     console.log(`App running on ${port}`);
// });

// Schedule SAP sync every day at 6pm Asia/Jakarta time
cron.schedule(
    "0 18 * * *",
    async () => {
        // Calculate yesterday and today in Asia/Jakarta time, format YYYYMMDD
        const yesterday = moment
            .tz("Asia/Jakarta")
            .subtract(2, "day")
            .format("YYYYMMDD");
        const today = moment
            .tz("Asia/Jakarta")
            .add(1, "day")
            .format("YYYYMMDD");
        console.log(
            `[CRON] Running SAP sync for date range: ${yesterday} to ${today}`
        );
        // Run for LAEDA
        const resultLAEDA = await Material.syncSAPDataJob({
            startDate: yesterday,
            endDate: today,
            fieldName: "LAEDA",
        });
        console.log("[CRON] SAP sync result (LAEDA):", resultLAEDA);
        // Run for ERSDA
        const resultERSDA = await Material.syncSAPDataJob({
            startDate: yesterday,
            endDate: today,
            fieldName: "ERSDA",
        });
        console.log("[CRON] SAP sync result (ERSDA):", resultERSDA);
    },
    {
        timezone: "Asia/Jakarta",
    }
);

// Schedule material edit notification emails at 12 PM daily
cron.schedule(
    "0 12 * * *",
    async () => {
        console.log(
            "[CRON] Running material edit notification for 12 PM batch"
        );

        const client = await db.connect();
        try {
            // Get all unprocessed material edits
            const result = await client.query(
                `SELECT id, material_code, material_name, attachment_path, created_at
                 FROM mat_reqedit
                 WHERE processed = false
                 ORDER BY created_at DESC`
            );

            const { rows: getHostname } = await client.query(
                "SELECT hostname from hostname where mode_env = $1",
                [process.env.NODE_ENV]
            );

            const hostname = getHostname[0].hostname;

            if (result.rows.length > 0) {
                // Send email notification
                await Emailer.materialEditNotification(
                    result.rows,
                    "12 PM Batch",
                    hostname
                );

                // Mark records as processed
                const materialIds = result.rows.map(row => row.id);
                await client.query(
                    `UPDATE mat_reqedit
                         SET processed = true, processed_at = $2
                         WHERE id = ANY($1)`,
                    [
                        materialIds,
                        moment()
                            .tz("Asia/Jakarta")
                            .format("YYYY-MM-DD HH:mm:ss+0700"),
                    ]
                );

                console.log(
                    `[CRON] 12 PM batch: Sent email for ${result.rows.length} material edits`
                );
            } else {
                console.log("[CRON] 12 PM batch: No material edits to process");
            }
        } finally {
            client.release();
        }
    },
    {
        timezone: "Asia/Jakarta",
    }
);

// Schedule material edit notification emails at 6 PM daily
cron.schedule(
    "0 18 * * *",
    async () => {
        console.log("[CRON] Running material edit notification for 6 PM batch");

        const client = await db.connect();
        try {
            // Get all unprocessed material edits
            const result = await client.query(
                `SELECT id, material_code, material_name, attachment_path, created_at
                 FROM mat_reqedit
                 WHERE processed = false
                 ORDER BY created_at DESC`
            );

            const { rows: getHostname } = await client.query(
                "SELECT hostname from hostname where mode_env = $1",
                [process.env.NODE_ENV]
            );

            const hostname = getHostname[0].hostname;

            if (result.rows.length > 0) {
                // Send email notification
                await Emailer.materialEditNotification(
                    result.rows,
                    "6 PM Batch",
                    hostname
                );

                // Mark records as processed
                const materialIds = result.rows.map(row => row.id);
                await client.query(
                    `UPDATE mat_reqedit
                         SET processed = true, processed_at = $2
                         WHERE id = ANY($1)`,
                    [
                        materialIds,
                        moment()
                            .tz("Asia/Jakarta")
                            .format("YYYY-MM-DD HH:mm:ss+0700"),
                    ]
                );

                console.log(
                    `[CRON] 6 PM batch: Sent email for ${result.rows.length} material edits`
                );
            } else {
                console.log("[CRON] 6 PM batch: No material edits to process");
            }
        } finally {
            client.release();
        }
    },
    {
        timezone: "Asia/Jakarta",
    }
);

const server = https
    .createServer(servOption, app)
    .listen(port, "0.0.0.0", () => {
        console.log(`App running on ${port}`);
    });
