# contact-reply

後台留言分頁直接回信：管理員在後台寫回覆，由這支 Edge Function 透過 Resend 從 `contact@yueswater.com` 寄給訪客。

## 安全設計

- 只接受 `{ message_id, body }`。收件人、寄件人、主旨一律不從請求讀取，收件地址取自資料庫裡該則留言，因此不能拿來寄給任意人（open relay）。
- 呼叫者必須帶登入者的 JWT，函式再用 `is_admin()` 檢查一次。`verify_jwt` 維持預設的開啟。
- 收件地址再用嚴格的正規表示式檢查一次；所有 header 值去除 CR/LF；內文去除控制字元與雙向覆寫字元。
- HTML 版本全部跳脫，原文引用截短。
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
