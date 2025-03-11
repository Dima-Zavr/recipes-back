const Recipe = require("../models/recipe"); // Импорт модели рецепта

async function filterData() {
    try {
        const result = await Recipe.aggregate([
            {
                $group: {
                    _id: null, // Группируем все документы вместе
                    times_min: { $min: "$cook_time" }, // Находим минимальное значение cook_time
                    times_max: { $max: "$cook_time" }, // Находим максимальное значение cook_time
                    cals_min: { $min: "$calories" }, // Находим минимальное значение calories
                    cals_max: { $max: "$calories" }, // Находим максимальное значение calories
                    types: { $addToSet: "$type" }        // Собираем уникальные значения type
                }
            }
        ]);

        
        // Если результат пустой (нет рецептов в базе)
        if (result.length === 0) {
            return {
                times_min: null,
                times_max: null,
                cals_min: null,
                cals_max: null,
                types: [] // Пустой массив для типов
            };
        }
        const sortedTypes = result[0].types.sort();
        // Возвращаем результат
        return {
            ...result[0],
            types: sortedTypes
        }
    } catch (error) {
        console.error("Ошибка при поиске min/max значений: ", error);
        throw error;
    }
}
module.exports = filterData;