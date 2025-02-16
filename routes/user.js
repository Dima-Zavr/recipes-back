const express = require("express");
const router = express.Router();
const User = require("../models/user");
const authenticateToken = require("../controllers/authenticateToken");

// Получить данные пользователя
router.get("/", authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Вы не авторизованы" });
        }

        const user = await User.findById(req.user.id).select("-password -liked_recipes");

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
