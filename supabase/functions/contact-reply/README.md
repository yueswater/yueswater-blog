# contact-reply

後台留言分頁直接回信：管理員在後台寫回覆，由這支 Edge Function 透過 Resend 從 `contact@yueswater.com` 寄給訪客。

## 安全設計

- 只接受 `{ message_id, body }`。收件人、寄件人、主旨一律不從請求讀取，收件地址取自資料庫裡該則留言，因此不能拿來寄給任意人（open relay）。
- 呼叫者必須帶登入者的 JWT，函式再用 `is_admin()` 檢查一次。`verify_jwt` 維持預設的開啟。
- 收件地址再用嚴格的正規表示式檢查一次；所有 header 值去除 CR/LF；內文去除控制字元與雙向覆寫字元。
- HTML 版本先跳脫，再用白名單轉換 Markdown（段落、粗體、斜體、行內程式碼、程式碼區塊、清單、僅 http(s) 連結）；圖片只允許本專案 Supabase storage 的 https 網址，其餘換成文字佔位；原文引用截短。同時寄出純文字版本。
- 信中的圖片是私有 bucket 的簽名網址，7 天後失效。
- 數學公式：後台瀏覽器把每個 `$...$`、`$$...$$` 用 MathJax 畫成透明 PNG 傳到同一個私有 bucket，函式只收 `math: [{ display, tex, path, w, h, d }]`（路徑須為 `<uuid>.png`，尺寸與數量重新檢查，每封最多 20 個、每個最長 1000 字元），以簽名網址輸出成 `<img>`，alt 為跳脫後的 LaTeX；純文字版保留 LaTeX 原文。公式全程不經過第三方。
- 冪等：`Idempotency-Key` 由留言 id 與內文雜湊組成，重送同一則不會寄兩封。
- 限流：每位管理員每小時 20 封；同一則留言 10 秒內不重複寄不同內容。
- 對瀏覽器只回傳通用錯誤，細節只進伺服器日誌，API key 不會出現在任何回應。

## 部署步驟

1. 在 Resend 建立 API key，權限選 Sending access，網域限制為 yueswater.com。
2. 設定 secret（自己輸入金鑰）：

   ```bash
   supabase secrets set RESEND_API_KEY=你的金鑰
   ```

3. （選用）設定寄件人顯示名稱，未設定時用 `compose.mjs` 的 `DEFAULT_FROM_NAME`：

   ```bash
   supabase secrets set FROM_NAME=顯示名稱
   ```

4. 部署函式：

   ```bash
   supabase functions deploy contact-reply
   ```

5. 套用資料庫 migration：

   ```bash
   supabase db push
   ```

6. 建議在 Cloudflare 加一筆 DMARC：`_dmarc` TXT，內容 `v=DMARC1; p=none; rua=mailto:contact@yueswater.com`。
