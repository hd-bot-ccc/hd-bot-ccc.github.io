const { ACTIVITY_LEVELS, GOALS, SERVING, CalcDailyTarget } = Nutrition;
const byId = (id) => document.getElementById(id);
const form = byId("nutrition-form");
const activity = byId("activity");
const activityHelp = byId("activity-help");
const goal = byId("goal");
const results = byId("nutrition-results");
const statusLine = byId("result-status");
const activityNote = byId("activity-note");

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

form.addEventListener("input", (event) => {
    if (event.target.id === "height") return;
    updateActivityHelp();
    if (!results.hidden) {
        results.hidden = true;
        statusLine.textContent = "資料已變更，請重新計算。";
    }
});

form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const requestedLevel = Number(activity.value);
    const target = CalcDailyTarget(
        Number(byId("gender").value),
        byId("age").valueAsNumber,
        byId("weight").valueAsNumber,
        requestedLevel,
        goal.value,
    );
    if (!target) {
        results.hidden = true;
        statusLine.textContent = "無法計算，請確認輸入資料。";
        return;
    }

    const appliedActivity = ACTIVITY_LEVELS[target.level].name;
    const kcal = Math.round(target.kcal);
    byId("result-activity").textContent = `生活活動強度：${appliedActivity}`;
    byId("result-goal").textContent = `目標：${GOALS[goal.value].name}`;
    byId("maintain-kcal").textContent = Math.round(target.maintain_kcal);
    byId("target-kcal").textContent = `${kcal} 大卡`;
    for (const [name, range] of Object.entries(target.ranges)) {
        byId(`target-${name}`).textContent = formatRange(range);
    }
    for (const group of Object.keys(SERVING)) {
        byId(group).textContent = `${target.servings[group]} 份`;
    }

    activityNote.hidden = target.level === requestedLevel;
    activityNote.textContent = activityNote.hidden
        ? ""
        : `此年齡層沒有「${ACTIVITY_LEVELS[requestedLevel].name}」的參考值，改用「${appliedActivity}」計算。`;
    results.hidden = false;
    statusLine.textContent = `每日建議量已更新：${kcal} 大卡。`;
});

updateActivityHelp();
form.querySelector('button[type="submit"]').disabled = false;
