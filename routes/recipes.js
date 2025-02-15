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
router.get("/inf_recipe/:id", authenticateToken, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id).select("-creator -createdAt");

        // Если рецепт не найден, возвращаем ошибку 404
        if (!recipe) {
            return res.status(404).json({ message: "Рецепт не найден" });
        }

        // Добавляем параметр like, если пользователь аутентифицирован
        let recipeWithLike = recipe.toObject();
        if (req.user) {
            const user = await User.findById(req.user.id);
            if (user) {
                recipeWithLike.like = user.liked_recipes.includes(req.params.id); // Проверка, лайкал ли пользователь рецепт
            }
        } else {
            recipeWithLike.like = false; // Если пользователь не аутентифицирован, like: false
        }

        res.status(200).json(recipeWithLike);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Создать новый рецепт
router.post("/add_recipe", authenticateToken, async (req, res) => {
    try {
        const { name, photos, cook_time, calories, ingredients, equipments, cook_steps } = req.body;

        if (!req.user) {
            return res.status(401).json({ message: "Токен отсутствует" });
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

// Добавить в избранное / убрать из избранного
router.patch("/like_recipe/:id", authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Токен отсутствует" });
        }

        const user = await User.findById(req.user.id);

        // Проверяем, есть ли рецепт уже в избранном
        const recipeIndex = user.liked_recipes.indexOf(req.params.id);

        if (recipeIndex === -1) {
            // Если рецепта нет в избранном, добавляем его
            user.liked_recipes.push(req.params.id);
            await user.save();
            res.status(200).json({ message: "Рецепт добавлен в избранное" });
        } else {
            // Если рецепт уже в избранном, удаляем его
            user.liked_recipes.splice(recipeIndex, 1);
            await user.save();
            res.status(200).json({ message: "Рецепт удалён из избранного" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
