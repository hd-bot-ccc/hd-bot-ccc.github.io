// 移植自 HD_bot 的 Modules/Nutrition.js（來源版本見 README.md）。
const Nutrition = (() => {
    // 依衛福部國健署「國人膳食營養素參考攝取量」第八版（111年）計算每日熱量，
    // 再依「食物代換表」把蛋白質、脂質、碳水化合物換算成六大類食物的份數

    // 生活活動強度，DRIs 第八版對應的 PAL 為 低 1.3、稍低 1.5、適度 1.7、高 1.9
    const ACTIVITY_LEVELS = {
        1: { name: "低", example: "大多靜態，如坐著看書、看電視" },
        2: { name: "稍低", example: "站立活動，如站著說話、烹飪、開車、打電腦" },
        3: { name: "適度", example: "正常速度活動，如在公車上站著、做家事、散步、購物" },
        4: { name: "高", example: "快速或激烈活動，如上下樓梯、打球、騎腳踏車、游泳" },
    };

    // 每日少吃 / 多吃 500 大卡，約每週減少 / 增加 0.5 公斤
    const GOALS = {
        lose: { name: "減重", kcal: -500 },
        maintain: { name: "維持體重", kcal: 0 },
        gain: { name: "增重", kcal: 500 },
    };

    // 減重時每日熱量的下限（男 1500、女 1200 大卡）
    const MIN_KCAL = { 1: 1500, 2: 1200 };

    // DRIs 第八版總表：年齡下限、參考體重(kg)、熱量(kcal)依 低/稍低/適度/高 排列、蛋白質 RDA(g)
    // null 表示該年齡層沒有列出這個強度等級
    const DRIS_TABLE = {
        // 男
        1: [
            { min_age: 1, weight: 13, kcal: [null, 1150, 1350, null], protein: 20 },
            { min_age: 4, weight: 20, kcal: [null, 1550, 1800, null], protein: 30 },
            { min_age: 7, weight: 28, kcal: [null, 1800, 2100, null], protein: 40 },
            { min_age: 10, weight: 38, kcal: [null, 2050, 2350, null], protein: 55 },
            { min_age: 13, weight: 55, kcal: [null, 2400, 2800, null], protein: 70 },
            { min_age: 16, weight: 62, kcal: [2150, 2500, 2900, 3350], protein: 75 },
            { min_age: 19, weight: 64, kcal: [1850, 2150, 2400, 2700], protein: 70 },
            { min_age: 31, weight: 64, kcal: [1800, 2100, 2400, 2650], protein: 70 },
            { min_age: 51, weight: 60, kcal: [1700, 1950, 2250, 2500], protein: 70 },
            { min_age: 71, weight: 58, kcal: [1650, 1900, 2150, null], protein: 70 },
        ],
        // 女
        2: [
            { min_age: 1, weight: 13, kcal: [null, 1150, 1350, null], protein: 20 },
            { min_age: 4, weight: 19, kcal: [null, 1400, 1650, null], protein: 30 },
            { min_age: 7, weight: 27, kcal: [null, 1650, 1900, null], protein: 40 },
            { min_age: 10, weight: 39, kcal: [null, 1950, 2250, null], protein: 50 },
            { min_age: 13, weight: 49, kcal: [null, 2050, 2350, null], protein: 60 },
            { min_age: 16, weight: 51, kcal: [1650, 1900, 2250, 2550], protein: 55 },
            { min_age: 19, weight: 52, kcal: [1450, 1650, 1900, 2100], protein: 60 },
            { min_age: 31, weight: 54, kcal: [1450, 1650, 1900, 2100], protein: 60 },
            { min_age: 51, weight: 52, kcal: [1400, 1600, 1800, 2000], protein: 60 },
            { min_age: 71, weight: 50, kcal: [1300, 1500, 1700, null], protein: 60 },
        ],
    };

    // 三大營養素佔總熱量的比例範圍：脂質、碳水化合物為 DRIs 的 AMDR，
    // DRIs 沒有蛋白質的 AMDR，用常用的 10–20%，且不低於 DRIs 建議量
    const MACRO_RANGES = {
        protein: [0.1, 0.2],
        fat: [0.2, 0.3],
        carbs: [0.5, 0.65],
    };
    const KCAL_PER_GRAM = { protein: 4, fat: 9, carbs: 4 };

    // 食物代換表每 1 份的營養素(g)與熱量(kcal)，豆魚蛋肉類以中脂、乳品類以低脂計算
    const SERVING = {
        whole_grains: {
            name: "全穀雜糧類",
            example: "1/4碗飯、1/2碗稀飯或熟麵條",
            protein: 2,
            fat: 0,
            carbs: 15,
            kcal: 70,
        },
        legumes_fish_meat_and_eggs: {
            name: "豆魚蛋肉類",
            example: "1顆蛋、約1兩生肉或魚、190ml無糖豆漿",
            protein: 7,
            fat: 5,
            carbs: 0,
            kcal: 75,
        },
        dairy: {
            name: "乳品類",
            example: "1杯(240ml)牛奶、3湯匙奶粉",
            protein: 8,
            fat: 4,
            carbs: 12,
            kcal: 120,
        },
        vegetables: {
            name: "蔬菜類",
            example: "生重100g，煮熟約半碗",
            protein: 1,
            fat: 0,
            carbs: 5,
            kcal: 25,
        },
        fruits: {
            name: "水果類",
            example: "約1個拳頭大",
            protein: 0,
            fat: 0,
            carbs: 15,
            kcal: 60,
        },
        oils_fats_nuts_and_seeds: {
            name: "油脂與堅果種子類",
            example: "1茶匙(5g)油、1湯匙堅果",
            protein: 0,
            fat: 5,
            carbs: 0,
            kcal: 45,
        },
    };

    // 「每日飲食指南」各熱量建議的乳品、蔬菜、水果份數
    const GUIDE_KCAL = [1200, 1500, 1800, 2000, 2200, 2500, 2700];
    const GUIDE_DAIRY = [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 2];
    const GUIDE_VEGETABLES = [3, 3, 3, 4, 4, 5, 5];
    const GUIDE_FRUITS = [2, 2, 2, 3, 3.5, 4, 4];

    function FindDris(gender, age) {
        const table = DRIS_TABLE[gender];
        if (!table || !(age >= table[0].min_age)) return null;
        return table.findLast((row) => age >= row.min_age);
    }

    // 輸入資料不支援時回傳 null（例如舊版註冊時填的運動強度倍數）
    function CalcDailyTarget(gender, age, weight, activity, goal) {
        const dris = FindDris(gender, age);
        if (!dris || !ACTIVITY_LEVELS[activity] || !GOALS[goal] || !(weight > 0)) return null;

        // 兒童、青少年與 71 歲以上沒有列出全部的強度等級，改用最接近的等級
        let level = activity;
        if (dris.kcal[level - 1] == null) level = level == 1 ? 2 : 3;

        // DRIs 的熱量是以參考體重算出，依使用者的體重等比例換算
        const maintain_kcal = (dris.kcal[level - 1] * weight) / dris.weight;

        let kcal = maintain_kcal + GOALS[goal].kcal;
        if (GOALS[goal].kcal < 0) kcal = Math.max(kcal, Math.min(maintain_kcal, MIN_KCAL[gender]));

        const ranges = CalcNutrientRanges(kcal, dris.protein);
        const nutrients = CalcNutrients(kcal, dris.protein);
        const servings = NutrientsToServings(kcal, nutrients);

        return { level, maintain_kcal, kcal, ranges, nutrients, servings };
    }

    // 各營養素的建議範圍(g)，給使用者參考
    function CalcNutrientRanges(kcal, protein_rda) {
        const ranges = {};
        for (const key in MACRO_RANGES) {
            ranges[key] = MACRO_RANGES[key].map((ratio) => (kcal * ratio) / KCAL_PER_GRAM[key]);
        }
        ranges.protein = ranges.protein.map((protein) => Math.max(protein, protein_rda));
        return ranges;
    }

    // 換算份數用的單一目標值：蛋白質、脂質取範圍中間值，其餘給碳水化合物（約 60%）
    function CalcNutrients(kcal, protein_rda) {
        const protein = Math.max((kcal * Middle(MACRO_RANGES.protein)) / 4, protein_rda);
        // 熱量低時蛋白質會被建議量撐高，這時減少脂質（最低到範圍下限），讓碳水化合物不低於範圍下限
        const fat_ratio = Math.max(
            MACRO_RANGES.fat[0],
            Math.min(Middle(MACRO_RANGES.fat), 1 - (protein * 4) / kcal - MACRO_RANGES.carbs[0]),
        );
        const fat = (kcal * fat_ratio) / 9;
        const carbs = (kcal - protein * 4 - fat * 9) / 4;
        return { protein, fat, carbs };
    }

    function Middle(range) {
        return (range[0] + range[1]) / 2;
    }

    // 先依每日飲食指南決定乳品、蔬菜、水果，
    // 剩下的碳水化合物由全穀雜糧類補足、蛋白質由豆魚蛋肉類補足、脂質由油脂與堅果種子類補足
    function NutrientsToServings(kcal, nutrients) {
        let index = 0;
        for (let i = 1; i < GUIDE_KCAL.length; i++) {
            if (Math.abs(kcal - GUIDE_KCAL[i]) <= Math.abs(kcal - GUIDE_KCAL[index])) index = i;
        }

        const servings = {
            dairy: GUIDE_DAIRY[index],
            vegetables: GUIDE_VEGETABLES[index],
            fruits: GUIDE_FRUITS[index],
        };
        servings.whole_grains = RoundHalf(
            (nutrients.carbs - ServingsToNutrients(servings).carbs) / SERVING.whole_grains.carbs,
        );
        servings.legumes_fish_meat_and_eggs = RoundHalf(
            (nutrients.protein - ServingsToNutrients(servings).protein) /
                SERVING.legumes_fish_meat_and_eggs.protein,
        );
        servings.oils_fats_nuts_and_seeds = RoundHalf(
            (nutrients.fat - ServingsToNutrients(servings).fat) / SERVING.oils_fats_nuts_and_seeds.fat,
        );

        return TrimExcess(kcal, servings);
    }

    // 各類四捨五入到 0.5 份後多半會比目標多一點熱量（減重時尤其不理想），
    // 這裡把超出目標的份數從熱量影響最大的類別一次回退 0.5 份，直到加總不超過目標
    function TrimExcess(kcal, servings) {
        // 全榖雜糧 70、豆魚蛋肉 75、乳品 120、水果 60 大卡，依每 0.5 份的熱量由大到小回退
        const trim_order = [
            "dairy",
            "legumes_fish_meat_and_eggs",
            "whole_grains",
            "fruits",
            "oils_fats_nuts_and_seeds",
            "vegetables",
        ];
        while (ServingsToNutrients(servings).kcal > kcal) {
            const target = trim_order.find((group) => servings[group] >= 0.5);
            if (!target) break;
            servings[target] -= 0.5;
        }
        return servings;
    }

    function ServingsToNutrients(servings) {
        const total = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
        for (const group in servings) {
            for (const key in total) {
                total[key] += servings[group] * SERVING[group][key];
            }
        }
        return total;
    }

    function RoundHalf(value) {
        return Math.max(0, Math.round(value * 2) / 2);
    }

    return {
        ACTIVITY_LEVELS: ACTIVITY_LEVELS,
        GOALS: GOALS,
        SERVING: SERVING,

        CalcDailyTarget: CalcDailyTarget,
        ServingsToNutrients: ServingsToNutrients,
    };
})();
