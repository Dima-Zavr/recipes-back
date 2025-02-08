const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const User = require("../models/user");

// Получить данные по карточкам рецептов
router.get("/card_recipes", async (req, res) => {
  try {
    res.json({
      cardRecipes: [
        {
          id: 1,
          name: "Куринная лапша",
          photos: [
            "https://cdn.xn--j1agri5c.xn--p1ai/preview/7813f67d-d637-4da1-9e76-9aa08d0b02ae.webp",
          ],
          cook_time: 30,
          calories: 43,
          like: [1],
        },
        {
          id: 2,
          name: "Классические блины",
          photos: [
            "https://cdn.xn--j1agri5c.xn--p1ai/preview/dc5c6931-bdc1-4442-8cc3-91bf958fc45f.webp",
          ],
          cook_time: 25,
          calories: 217,
          like: [2],
        },
        {
          id: 3,
          name: "Жареный рис с яйцом",
          photos: [
            "https://cdn.xn--j1agri5c.xn--p1ai/preview/ab08e314-bd52-472f-9188-c7e22868d1aa.webp",
          ],
          cook_time: 30,
          calories: 156,
          like: [],
        },
        {
          id: 4,
          name: "Борщ с говядиной",
          photos: [
            "https://cdn.xn--j1agri5c.xn--p1ai/preview/a78801c8-9a6e-4d12-9be2-f2fe6afc196a.webp",
          ],
          cook_time: 45,
          calories: 33,
          like: [],
        },
        {
          id: 5,
          name: "Паста с креветками",
          photos: [
            "https://cdn.xn--j1agri5c.xn--p1ai/preview/b4a5cdfd-b341-4cf6-b26a-773d4726289d.webp",
          ],
          cook_time: 15,
          calories: 132,
          like: [],
        },
      ],
    });
  } catch (error) {}
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

module.exports = router;
