const jwt = require("jsonwebtoken");

// Middleware для извлечения и верификации токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Получаем токен из заголовка

    if (!token) {
        req.user = null; // Если токена нет, пользователь не аутентифицирован
        return next();
    }

    // Верификация токена
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({ message: "Недействительный access токен" });
        }
        req.user = user; // Сохраняем данные пользователя в запросе
        next();
    });
};

module.exports = authenticateToken;
