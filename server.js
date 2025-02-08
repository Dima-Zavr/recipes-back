const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const recipesRoutes = require("./routes/recipes");
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const connectDB = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await mongoose.connect(process.env.MONGO_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log("MongoDB подключена");
            return;
        } catch (error) {
            console.error(`Ошибка подключения: ${error.message}`);
            console.log(`Попытка повторного подключения (${i + 1}/${retries})...`);
            await new Promise((res) => setTimeout(res, delay));
        }
    }
    process.exit(1); // Если не удалось подключиться — выходим
};

connectDB(2, 1000);

app.listen(process.env.PORT, () => {
    console.log(`Сервер запущен на порту ${process.env.PORT}`);
});

app.use(express.json({ limit: '50mb' }))
app.use("/api/recipes", recipesRoutes); // Данные по рецептам
app.use("/api/auth", authRoutes); // Авторизация / Регистрация
app.use("/api/user", userRoutes); // Данные пользователя
