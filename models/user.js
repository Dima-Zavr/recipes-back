const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Схема пользователя для БД
const UserSchema = new mongoose.Schema(
    {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        refresh_token: { type: String, required: true },
        liked_recipes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Recipe"
            }
        ],
        createdAt: { type: Date, default: Date.now }
    },
    {
        versionKey: false
    }
);

// Хэширование пароля перед сохранением пользователя
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Метод для проверки пароля
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
