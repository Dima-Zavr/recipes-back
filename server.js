const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const recipesRoutes = require('./routes/recipes');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

app.use('/api/recipes', recipesRoutes);    // Данные по рецептам
app.use('/api/auth', authRoutes);          // Авторизация / Регистрация
app.use('/api/user', userRoutes);          // Данные пользователя