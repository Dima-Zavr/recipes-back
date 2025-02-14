const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const User = require("../models/user");
const authenticateToken = require("../controllers/authenticateToken");

// Получить данные по карточкам рецептов
router.get("/card_recipes", authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query._page) || 1;
        const limit = parseInt(req.query._limit) || 10;
        const search = req.query.search || ""; // Поисковая строка (по умолчанию пустая)

        // Проверка на корректность параметров
        if (page < 1 || limit < 1) {
            return res.status(400).json({ message: "Некорректные параметры пагинации" });
        }

        // Вычисление количества рецептов для пропуска
        const skip = (page - 1) * limit;

        // Создание фильтра для поиска
        const filter = {};
        if (search) {
            filter.name = { $regex: search, $options: "i" }; // Поиск по полю name (регистронезависимый)
        }

        // Запрос рецептов из базы данных с пагинацией
        const recipes = await Recipe.find(filter)
            .select("name photos cook_time calories")
            .skip(skip)
            .limit(limit)
            .exec();

        // Получение общего количества рецептов (для пагинации на клиенте)
        const totalRecipes = await Recipe.countDocuments(filter);

        let recipesWithLike = recipes;
        if (req.user) {
            // Если пользователь аутентифицирован, проверяем, лайкал ли он каждый рецепт
            const user = await User.findById(req.user.id);

            if (user) {
                recipesWithLike = recipes.map((recipe) => {
                    const liked = user.liked_recipes.includes(recipe._id); // Проверка, лайкал ли пользователь рецепт
                    return {
                        ...recipe.toObject(), // Преобразуем Mongoose-документ в обычный объект
                        like: liked // Добавляем параметр like
                    };
                });
            }
        } else {
            // Если пользователь не аутентифицирован, добавляем like: false
            recipesWithLike = recipes.map((recipe) => ({
                ...recipe.toObject(),
                like: false
            }));
        }

        // Формирование ответа
        res.status(200).json({
            recipes: recipesWithLike,
            totalRecipes,
            totalPages: Math.ceil(totalRecipes / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Получить всю инфу по конкретному рецепту
router.get("/inf_recipe", async (req, res) => {
    // try {
    //   const recipes = await Recipe.find();
    //   res.json(recipes);
    // } catch (err) {
    //   res.status(500).json({ message: err.message });
    // }
});

// Создать новый рецепт
router.post("/add_recipe", authenticateToken, async (req, res) => {
    try {
        const { name, photos, cook_time, calories, ingredients, equipments, cook_steps } = req.body;

        if (!req.user) {
            return res.status(401).json({ message: 'Токен отсутствует' });
        }

        const recipe = new Recipe({
            name,
            photos,
            cook_time,
            calories,
            ingredients,
            equipments,
            cook_steps,
            creator: req.user.id
        });

        await recipe.save();

        res.status(200).json({ message: "Рецепт сохранен" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
