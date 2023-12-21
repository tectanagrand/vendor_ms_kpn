module.exports = {
    apps: [
        {
            name: "vms_app",
            script: "server.js",
            watch: true,
            autorestart: true,
            exp_backoff_restart_delay: 100,
        },
    ],
};
