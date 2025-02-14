const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    liked_recipes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe",
    }],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);