# 🎰 Lucky Draw — 抽獎系統

純靜態網頁，無需後端，使用 localStorage 儲存資料。  
部署到 Vercel 後可永久使用，任何裝置開啟網址即可抽獎。

---

## 功能特色

- 🎰 **名單滾動動畫** — 拉霸效果，逐漸減速揭曉得獎者
- 👥 **彈性匯入名單** — 貼上文字 / 上傳 CSV / 拖曳檔案
- 🏆 **多獎項設定** — 可設定多個獎項與各獎項名額
- 🔒 **不重複中獎** — 同一人不會重複抽中
- 📊 **中獎紀錄** — 完整歷史紀錄，可匯出 CSV
- 💾 **自動儲存** — 資料存於瀏覽器，重開不遺失
- 🎊 **彩帶動畫** — 抽獎完成後自動觸發慶祝效果

---

## 部署步驟

### 第一步：上傳到 GitHub

```bash
# 1. 在 GitHub 建立新 Repository（任意名稱，例如 lucky-draw）

# 2. 在本機初始化並推送
git init
git add .
git commit -m "init: 抽獎系統初始版本"
git branch -M main
git remote add origin https://github.com/你的帳號/lucky-draw.git
git push -u origin main
```

### 第二步：部署到 Vercel

1. 前往 [vercel.com](https://vercel.com) 並用 GitHub 帳號登入
2. 點擊 **「Add New Project」**
3. 選擇剛才建立的 Repository（`lucky-draw`）
4. **Framework Preset** 選擇 **「Other」**（或留空）
5. 點擊 **「Deploy」**
6. 等待 1 分鐘後取得網址，例如：`https://lucky-draw-xxx.vercel.app`

> 日後只要 `git push`，Vercel 會自動重新部署。

---

## 使用說明

### 設定名單
1. 點擊上方「**名單設定**」分頁
2. 在「參與名單」貼上名字（每行一人）或上傳 CSV
3. CSV 格式支援：`員工編號,姓名` 或單純每行一個姓名

### 設定獎項
1. 在「名單設定」→「獎項設定」設定獎項名稱與名額
2. 點擊「儲存獎項」

### 開始抽獎
1. 切換到「**抽獎**」分頁
2. 點選上方獎項按鈕（例如：頭獎）
3. 調整一次抽取人數（預設 1 人）
4. 點擊「**開始抽獎**」
5. 動畫結束後顯示得獎者，並自動紀錄

### 匯出結果
1. 切換到「**歷史紀錄**」
2. 點擊「⬇ 匯出 CSV」

---

## 新活動使用方式

只需在「歷史紀錄」點選「清除結果」，  
即可用同一份名單重新開始新一輪抽獎。

若要換新名單，到「名單設定」→「清除名單」後重新匯入即可。

---

## 專案結構

```
lottery-app/
├── index.html    # 主頁面結構
├── style.css     # 樣式（深色主題）
├── app.js        # 抽獎邏輯、資料儲存
├── vercel.json   # Vercel 部署設定
└── README.md     # 本說明文件
```

---

## 技術架構

| 項目 | 說明 |
|------|------|
| 框架 | 純 Vanilla JS（無任何 npm 依賴） |
| 資料儲存 | `localStorage`（瀏覽器本地儲存） |
| 部署 | Vercel Static Hosting |
| 版本管理 | GitHub |
| 字型 | Google Fonts（Archivo Black + Noto Sans TC） |

---

## 授權

MIT License — 可自由修改使用
