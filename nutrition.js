// 移植自 HD_bot 的 Modules/Nutrition.js，更新公式時請同步兩邊。
const Nutrition = (() => {
    // 基礎代謝依日本厚生勞動省《日本人の食事摂取基準（2025年版）》表 2。
    // https://www.mhlw.go.jp/content/10904750/001316585.pdf#page=77
    const BMR_AGE = { min: 18, max: 79 };
    const BMR_INTERCEPT = { 1: 0.4235, 2: 0.9708 };

    // 生活活動強度，DRIs 第八版對應的 PAL 為 低 1.3、稍低 1.5、適度 1.7、高 1.9
    const ACTIVITY_LEVELS = {
        1: { name: "低", pal: 1.3, example: "大多靜態，如坐著看書、看電視" },
        2: { name: "稍低", pal: 1.5, example: "站立活動，如站著說話、烹飪、開車、打電腦" },
        3: { name: "適度", pal: 1.7, example: "正常速度活動，如在公車上站著、做家事、散步、購物" },
        4: { name: "高", pal: 1.9, example: "快速或激烈活動，如上下樓梯、打球、騎腳踏車、游泳" },
    };

    // 每日少吃 / 多吃 500 大卡，約每週減少 / 增加 0.5 公斤
    const GOALS = {
        lose: { name: "減重", kcal: -500 },
        maintain: { name: "維持體重", kcal: 0 },
        gain: { name: "增重", kcal: 500 },
    };

    // 減重時每日熱量的下限（男 1500、女 1200 大卡）
    const MIN_KCAL = { 1: 1500, 2: 1200 };

    // DRIs 第八版的蛋白質 RDA（公克／天），保留公式涵蓋的年齡組
    const PROTEIN_RDA = {
        1: { under_19: 75, adult: 70 },
        2: { under_19: 55, adult: 60 },
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

    // 輸入資料不支援時，回傳可直接顯示的原因。
    function CalcDailyTarget(gender, age, height, weight, activity, goal) {
        if (!Number.isFinite(age) || age < BMR_AGE.min || age > BMR_AGE.max) {
            return { error: `基礎代謝公式適用於 ${BMR_AGE.min}–${BMR_AGE.max} 歲。` };
        }
        if (!Number.isFinite(height) || height < 50 || height > 250) {
            return { error: "請填寫有效身高（50–250 公分）。" };
        }
        if (!Number.isFinite(weight) || weight < 10 || weight > 500) {
            return { error: "請填寫有效體重（10–500 公斤）。" };
        }
        const intercept = BMR_INTERCEPT[gender];
        const pal = ACTIVITY_LEVELS[activity]?.pal;
        const adjustment = GOALS[goal]?.kcal;
        if (!Number.isFinite(intercept)) return { error: "請選擇生理性別。" };
        if (!Number.isFinite(pal)) return { error: "請選擇生活活動強度。" };
        if (!Number.isFinite(adjustment)) return { error: "請選擇體重目標。" };

        // 國立健康・營養研究所公式：體重用公斤、身高用公分，結果換算為大卡／天。
        const bmr_kcal = ((0.0481 * weight + 0.0234 * height - 0.0138 * age - intercept) * 1000) / 4.186;
        if (bmr_kcal <= 0) return { error: "此身高、體重與年齡的組合無法估算基礎代謝。" };
        const maintain_kcal = bmr_kcal * pal;

        let kcal = maintain_kcal + adjustment;
        if (adjustment < 0) kcal = Math.max(kcal, Math.min(maintain_kcal, MIN_KCAL[gender]));

        const protein_rda = age < 19 ? PROTEIN_RDA[gender].under_19 : PROTEIN_RDA[gender].adult;
        const ranges = CalcNutrientRanges(kcal, protein_rda);
        const nutrients = CalcNutrients(kcal, protein_rda);
        const servings = NutrientsToServings(kcal, nutrients);

        return { bmr_kcal, maintain_kcal, kcal, ranges, nutrients, servings };
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
        BMR_AGE: BMR_AGE,
        ACTIVITY_LEVELS: ACTIVITY_LEVELS,
        GOALS: GOALS,
        SERVING: SERVING,

        CalcDailyTarget: CalcDailyTarget,
        ServingsToNutrients: ServingsToNutrients,
    };
})();
