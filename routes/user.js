const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Recipe = require("../models/recipe")
const authenticateToken = require("../controllers/authenticateToken");

// Получить данные пользователя
router.get("/get_data", authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Вы не авторизованы" });
        }

        const user = await User.findById(req.user.id).select("-password -refresh_token");

        const filter = {};
        filter.creator = req.user.id;
        const created_recipes = await Recipe.countDocuments(filter);

        let newUser = user.toObject();

        newUser.created_recipes = created_recipes;
        newUser.liked_recipes = user.liked_recipes.length

        res.status(200).json(newUser);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Изменить данные профиля
router.post("/change_data", authenticateToken, async (req, res) => {
    try {
        const { firstname, lastname, email } = req.body;

        if (!req.user) {
            return res.status(401).json({ message: "Вы не авторизованы" });
        }

        // Проверка, есть ли уже пользователь с таким email
        const existingUser = await User.findOne({ email });
        const user = await User.findById(req.user.id)
        if (existingUser) {
            if(existingUser.email !== user.email){
                return res.status(400).json({ message: "Email уже используется" });
            }
        }

        user.firstname = firstname;
        user.lastname = lastname;
        user.email = email;

        await user.save();

        res.status(200).json({ message: "Данные изменены" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Изменить пароль
router.post("/change_password", authenticateToken, async (req, res) => {
    try {
        const { new_password, old_password } = req.body;

        if (!req.user) {
            return res.status(401).json({ message: "Вы не авторизованы" });
        }

        const user = await User.findById(req.user.id)

        const isMatch = await user.comparePassword(old_password);
        if(isMatch){
            user.password = new_password;
        } else {
            return res.status(400).json({message: "Неверный пароль"})
        }

        await user.save();

        res.status(200).json({ message: "Пароль изменен" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;
