---
title: Todo App | Initialization
date: '2026-08-04'
lang: en
categories: &id001
- Backend
- Todo App
tags: *id001
excerpt: Set up the project skeleton and an empty entry file
thumbnail: /images/covers/Backend_logo.png
mathjax: true
---

Before we begin, we need to create a project folder:

Use [uv](https://docs.astral.sh/uv/) to create a bare project:

```bash
uv init todo-app-py --bare
```

Once it succeeds, move into the folder:

```bash
cd todo-app-py
```

You should now see a `pyproject.toml` file:

```bash
todo-app-py/
└── pyproject.toml
```

Once the project folder has been created, do not write any API endpoints yet. Install the packages needed for development first:

Install [FastAPI](https://fastapi.tiangolo.com/tutorial/#install-fastapi):

```bash
uv add "fastapi[standard]"
```

Then install [SQLAlchemy](https://www.sqlalchemy.org/):

```bash
uv add "sqlalchemy"
```

Next, we can define the entry point in the project root. The entry point can be understood as the file that is executed first when the application starts — it is responsible for creating the server instance and mounting the routes.

Create `main.py`:

```bash
touch main.py
```

Then write the following inside it:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return "Todo API created successfully"
```

After writing this, run the following command. If everything goes as expected, the server should start successfully on the default port `8000`:

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

Once the entry point has been successfully set up, you can test it with the `curl` command:

```bash
curl -X GET 127.0.0.1:{$PORT}
```

or

```bash
curl -X GET http://localhost:{$PORT}
```

Here, `{$PORT}` should be replaced with the corresponding port number. If everything is correct, you should receive the following response:

```bash
"Todo API created successfully"
```

That covers everything needed for the initial setup. The next article will move on to building the data models.
