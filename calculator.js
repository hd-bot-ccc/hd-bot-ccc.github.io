const { ACTIVITY_LEVELS, GOALS, SERVING, CalcDailyTarget } = Nutrition;
const byId = (id) => document.getElementById(id);
const form = byId("nutrition-form");
const activity = byId("activity");
const activityHelp = byId("activity-help");
const goal = byId("goal");
const results = byId("nutrition-results");
const statusLine = byId("result-status");
const submitButton = form.querySelector('button[type="submit"]');

for (const [value, level] of Object.entries(ACTIVITY_LEVELS)) {
    activity.add(new Option(level.name, value));
}
for (const [value, target] of Object.entries(GOALS)) {
    goal.add(new Option(target.name, value, value === "maintain", value === "maintain"));
}

function updateActivityHelp() {
    activityHelp.textContent = ACTIVITY_LEVELS[activity.value]?.example ?? "依一天中大部分時間的活動選擇。";
}

function formatRange(range) {
    const [low, high] = range.map(Math.round);
    return (low === high ? low : `${low}–${high}`) + " 公克";
}

function calculateTarget() {
    const target = CalcDailyTarget(
        Number(byId("gender").value),
        byId("age").valueAsNumber,
        byId("height").valueAsNumber,
        byId("weight").valueAsNumber,
        Number(activity.value),
        goal.value,
    );
    if (target.error) {
        results.hidden = true;
        statusLine.textContent = target.error;
        return;
    }

    const kcal = Math.round(target.kcal);
    byId("result-activity").textContent = `生活活動強度：${ACTIVITY_LEVELS[activity.value].name}`;
    byId("result-goal").textContent = `目標：${GOALS[goal.value].name}`;
    byId("bmr-kcal").textContent = Math.round(target.bmr_kcal);
    byId("maintain-kcal").textContent = Math.round(target.maintain_kcal);
    byId("target-kcal").textContent = kcal;
    for (const [name, range] of Object.entries(target.ranges)) {
        byId(`target-${name}`).textContent = formatRange(range);
    }
    for (const group of Object.keys(SERVING)) {
        byId(group).textContent = `${target.servings[group]} 份`;
    }

    results.hidden = false;
    statusLine.textContent = `每日建議量已更新：${kcal} 大卡。`;
}

function calculateWhenReady() {
    if (!form.checkValidity()) {
        results.hidden = true;
        statusLine.textContent = "填寫完整且有效的資料後，會自動計算每日建議量。";
        return false;
    }

    calculateTarget();
    return true;
}

function handleFormChange() {
    updateActivityHelp();
    calculateWhenReady();
}

form.addEventListener("input", handleFormChange);
form.addEventListener("change", handleFormChange);

form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) {
        results.hidden = true;
        statusLine.textContent = "請先修正表單中的資料。";
        return;
    }

    calculateTarget();
});

updateActivityHelp();
submitButton.disabled = false;
calculateWhenReady();
