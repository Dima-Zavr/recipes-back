const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Получить данные пользователя
router.get('/', async (req, res) => {
  // try {
  //   const recipes = await Recipe.find();
  //   res.json(recipes);
  // } catch (err) {
  //   res.status(500).json({ message: err.message });
  // }
});


module.exports = router;