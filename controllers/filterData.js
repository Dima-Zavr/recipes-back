const Recipe = require("../models/recipe"); // Импорт модели рецепта

async function filterData() {
    try {
        const result = await Recipe.aggregate([
            {
                $group: {
                    _id: null, // Группируем все документы вместе
                    time_min: { $min: "$cook_time" }, // Находим минимальное значение cook_time
                    time_max: { $max: "$cook_time" }, // Находим максимальное значение cook_time
                    cal_min: { $min: "$calories" }, // Находим минимальное значение calories
                    cal_max: { $max: "$calories" } // Находим максимальное значение calories
                }
            }
        ]);

        
        // Если результат пустой (нет рецептов в базе)
        if (result.length === 0) {
            return {
                time_min: null,
                time_max: null,
                cal_min: null,
                cal_max: null
            };
        }
        // Возвращаем результат
        return result[0];
    } catch (error) {
        console.error("Ошибка при поиске min/max значений: ", error);
        throw error;
    }
}
module.exports = filterData;