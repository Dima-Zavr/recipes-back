const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        photos: [{ type: String, required: true }],
        type: { type: String, required: true  },
        cook_time: { type: Number, required: true },
        calories: { type: Number, required: true },
        ingredients: [{ type: String, required: true }],
        equipments: [{ type: String, required: true }],
        cook_steps: [{ type: String, required: true }],
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        createdAt: { type: Date, default: Date.now }
    },
    {
        versionKey: false
    }
);

module.exports = mongoose.model("Recipe", RecipeSchema);
