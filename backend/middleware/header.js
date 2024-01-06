const allowCrossDomain = (req, res, next) => {
    const allowedOrigins = [
        "http://172.30.61.136:3000",
        "http://172.29.0.1:3000",
        `http://localhost:3003`,
        `https://localhost:3000`,
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header(`Access-Control-Allow-Origin`, origin);
    }
    res.header(`Access-Control-Allow-Methods`, `GET,PUT,POST,DELETE,PATCH`);
    res.header(`Access-Control-Allow-Headers`, `Content-Type`);
    next();
};

module.exports = allowCrossDomain;
