const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

const router = express.Router();

// Регистрация пользователя
router.post("/register", async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;

        // Проверка, есть ли уже пользователь с таким email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email уже используется" });
        }

        // Создание нового пользователя
        const user = new User({
            firstname,
            lastname,
            email,
            password: hashedPassword
        });
        await user.save();

        // Генерация access token
        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "2m"
        });

        // Генерация refresh token
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: "14d"
        });

        // Сохранение refresh token в базе данных
        user.refresh_token = refreshToken;
        await user.save();

        res.status(200).json({ accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ message: "Ошибка сервера", error: error.message });
    }
});

// Вход пользователя
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Поиск пользователя по email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Неверный email или пароль" });
        }

        // Проверка пароля
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Неверный email или пароль" });
        }

        // Генерация access token
        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "2m"
        });

        // Генерация refresh token
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: "14d"
        });

        // Сохранение refresh token в базе данных
        user.refresh_token = refreshToken;
        await user.save();

        res.status(200).json({ accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ message: "Ошибка сервера", error: error.message });
    }
});

// Обновление токенов
router.post("/update_token", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        // Проверка наличия refresh token
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token отсутствует" });
        }

        // Верификация refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Поиск пользователя по id из токена
        const user = await User.findById(decoded.id);
        if (!user || user.refresh_token !== refreshToken) {
            return res.status(403).json({ message: "Недействительный refresh token" });
        }

        // Генерация нового access token
        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "2m"
        });

        // Генерация нового refresh token
        const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: "14d"
        });

        // Сохранение нового refresh token в базе данных
        user.refresh_token = newRefreshToken;
        await user.save();

        // Возвращаем новые токены
        res.status(200).json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(500).json({ message: "Ошибка сервера", error: error.message });
    }
});

module.exports = router;
