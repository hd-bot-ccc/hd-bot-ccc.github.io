# Discord 營養機器人｜膳食攝取規劃儀表板

[GitHub Pages 網站](https://hd-bot-ccc.github.io/) · [部署紀錄](https://github.com/hd-bot-ccc/hd-bot-ccc.github.io/actions)

可直接用瀏覽器開啟 `index.html`。填寫年齡、生理性別、體重、生活活動強度和目標後，按「計算每日攝取量」，即可查看維持體重熱量、每日目標熱量、三大營養素建議範圍及六大類食物份數。資料只在瀏覽器中計算。

`nutrition.js` 移植自 HD_bot 的 `Modules/Nutrition.js`（版本 `44f54f3`），沿用 `/check-today` 的公式與參考表。更新 HD_bot 的公式或參考表時，請同步更新網站的計算模組。

- 發 PR 到 `main`：GitHub Actions 檢查 HTML，並準備靜態檔案。
- 推送或合併到 `main`：檢查通過後，自動部署到 GitHub Pages。
- 手動重發：在 **Actions → GitHub Pages → Run workflow** 選擇 `main`。

新建或搬移儲存庫時，在 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**，再執行一次部署。只有 `_site` 裡的檔案會發布。
