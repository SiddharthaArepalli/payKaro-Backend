const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./config"); // Fix: Destructure JWT_SECRET

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(403).json({
            message: "Authorization header missing or invalid"
        });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.userId) {
            req.userId = decoded.userId;
            next();
        } else {
            return res.status(403).json({
                message: "Invalid token payload"
            });
        }
    } catch (e) {
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = {
    authMiddleware
};