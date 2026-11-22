# contact-notify

訪客送出新留言時，寄一封通知到你自己的信箱。

## 運作方式

`contact_messages` 的 `AFTER INSERT` 觸發器透過 `pg_net`（非同步，在交易提交後才送出）呼叫這支 Edge Function，函式再用 Resend 從 `contact@yueswater.com` 寄信。

- 觸發器包在例外處理裡：缺少設定、排隊失敗都不會影響訪客送出留言。
- 函式的 `verify_jwt` 關閉（`supabase/config.toml`），改用共用密鑰：請求必須帶 `x-notify-secret`，以逐位元比對（不提早結束）檢查。密鑰只存在 Supabase function secret 與 Vault，不在 repo、migration、測試或日誌中。
- 收件人只讀 secret `NOTIFY_EMAIL`，沒設定就什麼都不做並回 200；地址用嚴格的 ASCII 正規表示式檢查。
- 訪客的 email 只有通過同一個嚴格檢查才會成為 Reply-To。
- 內文用與回信相同的白名單 Markdown 轉換器；圖片顯示為 [圖片]，公式顯示 LaTeX 原文；信中不含 IP。
- 冪等：`Idempotency-Key` 為 `contact-notify-<留言 id>`，重送不會寄兩封。
- 防洪：以資料庫計算這則留言是最近一小時的第幾則，超過 30 就靜默略過並寫一行日誌（留言本身仍在後台）。

## 設定步驟（依序）

下面的指令都不會把密鑰印出來。

1. 在 Resend 建立 API key（Sending access，網域限制 yueswater.com），已有就跳過。
2. 產生密鑰並同時寫進 function secret（密鑰只存在這一行的 shell 變數，不會顯示）：

   ```bash
   read -rs "NOTIFY_SECRET?貼上或自己輸入一組長隨機字串後按 Enter: " ; echo
   supabase secrets set NOTIFY_WEBHOOK_SECRET="$NOTIFY_SECRET"
   ```

   想自動產生可改用 `NOTIFY_SECRET=$(openssl rand -hex 32)`，同一個終端機視窗接著做第 5 步，因為變數只存在這個視窗。

3. 設定其他 secret（自己輸入內容）：

   ```bash
   supabase secrets set RESEND_API_KEY=你的金鑰
   supabase secrets set NOTIFY_EMAIL=你的收件信箱
   ```

4. 部署函式（`--no-verify-jwt` 與 config.toml 一致）：

   ```bash
   supabase functions deploy contact-notify --no-verify-jwt
   ```

5. 套用 migration（建立觸發器；此時 Vault 還沒設定，觸發器什麼都不做）：

   ```bash
   supabase db push
   ```

6. 把網址與同一組密鑰寫進 Vault。到 Supabase Dashboard 的 SQL Editor 執行，`<project-ref>` 換成專案代號，密鑰請改在 Dashboard 的 Integrations > Vault 介面新增，名稱 `notify_webhook_secret`，值貼同一組密鑰，避免密鑰留在 SQL 歷史紀錄：

   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/contact-notify', 'notify_function_url');
   ```

   Vault 需要兩筆：`notify_function_url` 與 `notify_webhook_secret`。

7. 測試：到網站送一則留言，收件匣應在數秒內收到通知。沒收到時看 Dashboard 的 Edge Functions 日誌，以及 `select * from net._http_response order by created desc limit 5;`。

更換密鑰時，兩邊都要改：`supabase secrets set NOTIFY_WEBHOOK_SECRET=...`，並在 Vault 更新 `notify_webhook_secret`。

## 測試

```bash
make test-notify-unit   # 純模組單元測試
make test-notify        # 加上本機資料庫的觸發器測試（本機 Supabase 沒開會略過）
```
