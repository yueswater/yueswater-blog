---
title: Todo App | 初始化
date: '2026-08-05 14:00:00'
lang: zh-TW
categories: &id001
- 後端開發
- Todo App
tags: *id001
excerpt: 建立專案骨架與空殼入口檔
mathjax: true
---

在開始之前，我們需要先建立專案資料夾：

使用 [uv](https://docs.astral.sh/uv/) 建立空殼專案：

```bash
uv init todo-app-py --bare
```

成功後進入資料夾

```bash
cd todo-app-py
```

會看到已有 `pyproject.toml` 檔：

```bash
todo-app-py/
└── pyproject.toml
```

專案資料夾建立成功後，先別寫任何 API 端點，先安裝開發時需要的套件：

安裝 [FastAPI](https://fastapi.tiangolo.com/tutorial/#install-fastapi)：

```bash
uv add "fastapi[standard]"
```

接著安裝 [SQLAlchemy](https://www.sqlalchemy.org/)：

```bash
uv add "sqlalchemy"
```

接著就可以在專案根目錄定義入口，入口的意思可以理解為應用程式啟動時最先被執行、負責建立伺服器實例並掛載路由的檔案。

建立 `main.py`：

```bash
touch main.py
```

接著裡面寫：

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return "Todo API 建立成功"
```

寫完後即可執行以下指令，沒意外應該會成功並看到預設埠號 `8000`

```bash
uv run fastapi dev main.py

⚡️ Starting FastAPI in development mode

🐍 Using import string: main:app

🌐 Server started at http://127.0.0.1:8000
  Documentation at http://127.0.0.1:8000/docs

Logs:

▕  Will watch for changes in these directories:
  ['/home/user/code/todo-app-py']
▕  Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
▕  Started reloader process [83130] using WatchFiles
▕  Started server process [83197]
▕  Waiting for application startup.
▕  Application startup complete.
```

若建議對外入口成功後，即可用 `curl` 指令進行測試

```bash
curl -X GET 127.0.0.1:{$PORT}
```

或

```bash
curl -X GET http://localhost:{$PORT}
```

其中 `{$PORT}` 需要填上相對應的埠號，正確的話會回應

```bash
"Todo API 建立成功"
```

以上就是所有初始化設定該完成的任務！下一篇就開始建立 Model～
