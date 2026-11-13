# Discord 營養機器人｜膳食攝取規劃儀表板

[GitHub Pages 網站](https://hd-bot-ccc.github.io/) · [部署紀錄](https://github.com/hd-bot-ccc/hd-bot-ccc.github.io/actions)

可直接用瀏覽器開啟 `index.html`。填寫年齡（18–79 歲）、生理性別、身高、體重、生活活動強度和目標後，網站會在資料完整時自動計算；之後修改任一欄位也會立即更新基礎代謝、維持體重熱量、每日目標熱量、三大營養素建議範圍及六大類食物份數。資料只在瀏覽器中計算。

基礎代謝使用[日本厚生勞動省報告表 2](https://www.mhlw.go.jp/content/10904750/001316585.pdf#page=77)的國立健康與營養研究所公式。

`nutrition.js` 移植自 HD_bot 的 `Modules/Nutrition.js`，與 `/check-today` 使用相同的公式與參考表。更新 HD_bot 的公式或參考表時，請同步更新網站的計算模組。

每日熱量、三大營養素、六大類食物份數及 Discord 飲食紀錄的換算方式，見[營養計算公式](docs/nutrition-formulas.md)。

- 發 PR 到 `main`：GitHub Actions 檢查 HTML，並準備靜態檔案。
- 推送或合併到 `main`：檢查通過後，自動部署到 GitHub Pages。
- 手動重發：在 **Actions → GitHub Pages → Run workflow** 選擇 `main`。

新建或搬移儲存庫時，在 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**，再執行一次部署。只有 `_site` 裡的檔案會發布。
