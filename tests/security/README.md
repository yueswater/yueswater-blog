# 聯絡表單安全測試

對應 `tests/contact/聯絡我-惡意內容測試案例.xlsx`。每個測試標題都帶案例編號（例如 `TC-SEC-XSS-013`），失敗清單會依編號列出。

## 執行

```bash
make test-security        # 全部（e2e + db）
make test-security-e2e    # 瀏覽器測試，所有 Supabase 請求都被 mock
make test-security-db     # 伺服器端測試，只打本機 Supabase
```

伺服器端測試需要本機 Supabase，沒開會自動略過並說明原因：

```bash
make supabase-up          # 檢查 Docker、supabase start、db reset --local
make test-security-db
make supabase-down
```

也可以直接用 npm：

```bash
npm run test:security
npm run test:security:e2e
npm run test:security:db
npx playwright test -c tests/security/playwright.config.js -g "XSS-013"   # 只跑一個案例
```

## 安全保護

- e2e：每個 Supabase 請求都被攔截，沒被 mock 的請求會讓測試失敗。
- db：`db/support/target.mjs` 拒絕任何不是 localhost / 127.0.0.1 的網址，不會碰到正式環境。
- 每個 db 測試自己清掉寫入的資料。

## 結構

```text
tests/security/
├── e2e/            # Playwright：XSS、外部資源、上傳、後台隱私、設定
│   └── support/    # payload、XSS 偵測、網路守衛、後台注入、圖片 fixture
├── db/             # node:test：輸入繞過、速率限制、權限、Storage、IP 保存
│   └── support/    # 本機目標、RPC、service-role 工具、Storage
├── reporters/      # 進度條（Playwright 與 node:test 共用）
└── .results/       # 報告與 trace（不進版控）
```

HTML 報告：`npx playwright show-report tests/security/.results/html`

失敗的測試代表真的發現問題，不要為了變綠改弱斷言。
