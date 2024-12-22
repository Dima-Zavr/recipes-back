const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const User = require("../models/user");

// Получить данные по карточкам рецептов
router.get("/card_recipes", async (req, res) => {
  // try {
  //   const recipes = await Recipe.find();
  //   res.json(recipes);
  // } catch (err) {
  //   res.status(500).json({ message: err.message });
  // }
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
