# 圖片配對練習

這是一個可部署到 GitHub Pages 的靜態網頁應用，用於 iPad 上進行「人物／職業圖片配對」練習。題庫以本地 ZIP 匯入，瀏覽器會在裝置端解壓、讀取圖片、顯示題目並判斷答案，不需要後端、資料庫或登入。

## 安裝

```bash
npm install
```

## 本地啟動

```bash
npm run dev
```

## 建置

```bash
npm run build
```

建置結果會輸出到 `dist/`。

## GitHub Pages 部署提示

目前 `vite.config.ts` 使用：

```ts
base: "./"
```

這個設定通常能安全部署到 GitHub Pages 子路徑。如果你想改成固定 repository 路徑，可以改為：

```ts
base: "/repo-name/"
```

## 題庫 ZIP 結構

ZIP 可以有一層外包資料夾，也可以直接放 `manifest.json`、`people/`、`items/` 和選用的 `workplaces/`。

```txt
matching-pack/
  manifest.json
  people/
    firefighter.png
    vet.png
  items/
    fire.png
    fire-truck.png
    ladder.png
    cat.png
    dog.png
    stethoscope.png
    hammer.png
  workplaces/
    fire-station.png
    animal-clinic.png
```

支援圖片格式：`.png`、`.jpg`、`.jpeg`、`.webp`。會自動忽略 `__MACOSX`、`.DS_Store` 和非圖片檔。

人物圖片 id 來自 `people/` 內的檔名，例如 `people/firefighter.png` 的 id 是 `firefighter`。物品圖片 id 來自 `items/` 內的檔名，例如 `items/fire-truck.png` 的 id 是 `fire-truck`。

## manifest.json 範例

```json
{
  "title": "職業圖片配對",
  "version": "1.0.0",
  "activities": [
    {
      "id": "firefighter",
      "displayName": "消防員",
      "englishName": "Firefighter",
      "category": "occupation",
      "personImage": "people/firefighter.png",
      "correctItems": ["fire", "fire-truck", "ladder"],
      "workplaceId": "fire-station"
    },
    {
      "id": "vet",
      "displayName": "獸醫",
      "englishName": "Vet",
      "category": "occupation",
      "personImage": "people/vet.png",
      "correctItems": ["cat", "dog"],
      "workplaceId": "animal-clinic"
    }
  ],
  "items": [
    {
      "id": "fire",
      "displayName": "火",
      "englishName": "fire",
      "image": "items/fire.png"
    },
    {
      "id": "cat",
      "displayName": "貓",
      "englishName": "cat",
      "image": "items/cat.png"
    }
  ],
  "workplaces": [
    {
      "id": "fire-station",
      "displayName": "消防局",
      "englishName": "fire station",
      "image": "workplaces/fire-station.png"
    },
    {
      "id": "animal-clinic",
      "displayName": "動物診所",
      "englishName": "animal clinic",
      "image": "workplaces/animal-clinic.png"
    }
  ]
}
```

每個 activity 代表一個人物題目。可以使用 `personImage` 明確指定人物圖片；如果沒有指定，網站會用 `activity.id` 到 `people/` 尋找同名圖片。`correctItems` 是唯一答案來源，裡面的每個 item id 都必須能對應到 `items/` 內的圖片，或對應到 `manifest.items[].image`。

顯示選項時，網站會先加入該題全部 `correctItems`，再從其他 `items/` 隨機抽取干擾項。若 activity 有 `distractorCount`，會使用該數量；否則最多顯示 12 張選項。提交答案時，只以 `correctItems` 判斷正確、漏選與多選。

工作場所句型模式使用 `activity.workplaceId` 判斷答案，並對應到 `manifest.workplaces[].id`。如果題庫沒有提供 `workplaces`，網站仍可開啟，但場所模式會顯示「此題庫未提供工作場所選項」。

## iPad 使用流程

1. 打開網站。
2. 點選「匯入題庫 ZIP」。
3. 選擇本地 ZIP 題庫包。
4. 題庫載入後會自動進入第一題。
5. 點選右側或下方的物品圖片來選擇，再點一次可取消。
6. 點「提交答案」查看漏選、多選與正確結果。
7. 可選「再做一次」、「隨機下一題」或「選擇人物」。

練習紀錄會保存在瀏覽器的 `localStorage` 中，包含已做次數、正確率、最近題目和最近一次分數。
