# Discord 營養機器人｜膳食攝取規劃儀表板

[GitHub Pages 網站](https://hd-bot-ccc.github.io/) · [部署紀錄](https://github.com/hd-bot-ccc/hd-bot-ccc.github.io/actions)

網站是單一靜態 HTML。可直接用瀏覽器開啟 `index.html` 預覽。頁面上的數字是範例；欄位不會送出，也沒有連接 Discord 機器人。

- 發 PR 到 `main`：GitHub Actions 檢查 HTML，並準備靜態檔案。
- 推送或合併到 `main`：檢查通過後，自動部署到 GitHub Pages。
- 手動重發：在 **Actions → GitHub Pages → Run workflow** 選擇 `main`。

新建或搬移儲存庫時，在 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**，再執行一次部署。只有 `_site` 裡的檔案會發布。
