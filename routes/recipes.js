const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const User = require("../models/user");
const authenticateToken = require("../controllers/authenticateToken");
const filterData = require("../controllers/filterData");

// Получить данные по карточкам рецептов
router.get("/card_recipes/:type_recipes", authenticateToken, async (req, res) => {
    try {
        const {
            search = "",
            times = {},
            cals = {},
            page = 1,
            limit = 10,
            types = [],
            sort = ""
        } = req.query;

        // Проверка на корректность параметров
        if (page < 1 || limit < 1) {
            return res.status(400).json({ message: "Некорректные параметры пагинации" });
        }

        // Вычисление количества рецептов для пропуска
        const skip = (page - 1) * limit;

        // Создание сортировки
        const sorted = {};
        if (sort === "asc_cook_time") {
            sorted.cook_time = 1;
        }
        if (sort === "desc_cook_time") {
            sorted.cook_time = -1;
        }
        if (sort === "asc_calories") {
            sorted.calories = 1;
        }
        if (sort === "desc_calories") {
            sorted.calories = -1;
        }

        // Создание фильтра для поиска
        const filter = {};
        if (search) {
            filter.name = { $regex: search, $options: "i" }; // Поиск по полю name (регистронезависимый)
        }
        if (times.min || times.max) {
            filter.cook_time = { $gte: times.min, $lte: times.max };
        }
        if (cals.min || cals.max) {
            filter.calories = { $gte: cals.min, $lte: cals.max };
        }
        if (types && types.length > 0) {
            filter.type = { $in: types }; // Тип должен совпадать с одним из значений в массиве
        }

        // Дополнительные фильтры в зависимости от типа рецептов
        if (req.params.type_recipes === "myRecipes") {
            // Рецепты текущего пользователя
            if (!req.user) {
                return res.status(401).json({ message: "Вы не авторизованы" });
            }
            filter.creator = req.user.id; // Фильтр по создателю рецепта
        } else if (req.params.type_recipes === "likeRecipes") {
            // Рецепты, которые пользователь добавил в избранное
            if (!req.user) {
                return res.status(401).json({ message: "Вы не авторизованы" });
            }
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: "Пользователь не найден" });
            }
            filter._id = { $in: user.liked_recipes }; // Фильтр по id рецептов из избранного
        }

        // Запрос рецептов из базы данных с пагинацией
        const recipes = await Recipe.find(filter)
            .sort(sorted)
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
            meta: {
                totalRecipes,
                totalPages: Math.ceil(totalRecipes / limit),
                currentPage: page,
                filters: await filterData(),
                sort: [
                    { value: "default", label: "По умолчанию" },
                    { value: "asc_cook_time", label: "По возрастанию времени приготовления" },
                    { value: "desc_cook_time", label: "По убыванию времени приготовления" },
                    { value: "asc_calories", label: "По возрастанию калорий" },
                    { value: "desc_calories", label: "По убыванию калорий" }
                ]
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Получить всю инфу по конкретному рецепту
router.get("/inf_recipe/:id", authenticateToken, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id).select("-createdAt");

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
                if (recipeWithLike.creator.toString() === user._id.toString()) {  //Проверка принадлежит ли пользователю этот рецепт
                    recipeWithLike.isMyRecipe = true;
                } else {
                    recipeWithLike.isMyRecipe = false;
                }
                
            }
        } else {
            recipeWithLike.like = false; // Если пользователь не аутентифицирован, like: false
            recipeWithLike.isMyRecipe = false;
        }
        
        delete recipeWithLike.creator;

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
            return res.status(401).json({ message: "Вы не авторизованы" });
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

// Редактировать рецепт
router.post("/edit_recipe/:id", authenticateToken, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);

        const { name, photos, cook_time, calories, ingredients, equipments, cook_steps } = req.body;

        if (!req.user) {
            return res.status(401).json({ message: "Вы не авторизованы" });
        }

        recipe.name = name,
        recipe.photos = photos,
        recipe.cook_time = cook_time,
        recipe.calories = calories,
        recipe.ingredients = ingredients,
        recipe.equipments = equipments,
        recipe.cook_steps = cook_steps,

        await recipe.save();

        res.status(200).json({ message: "Рецепт изменен" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Добавить в избранное / убрать из избранного
router.get("/like_recipe/:id", authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Вы не авторизованы" });
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
