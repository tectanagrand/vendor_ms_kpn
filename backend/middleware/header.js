const allowCrossDomain = (req, res, next) => {
    const allowedOrigins = [`http://localhost:3003`, `http://localhost:3000`];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header(`Access-Control-Allow-Origin`, origin);
    }
    res.header(`Access-Control-Allow-Methods`, `GET,PUT,POST,DELETE`);
    res.header(`Access-Control-Allow-Headers`, `Content-Type`);
    next();
};

module.exports = allowCrossDomain;
