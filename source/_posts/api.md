---
title: Todo App | API 功能實作
date: '2026-08-06'
categories:
- 後端開發
- Todo App
tags:
- 後端開發
- Todo App
excerpt: 實作 API
---

到目前為止，模型與 Schema 都齊全了，這篇要把它們串起來，寫出能動的 API。

## 路由 

**路由** (route) 可以視為「HTTP 方法 + 網址路徑」以及「該執行哪段程式碼」之間的對照表。當伺服器收到一個請求時，需要先查詢這張表，才知道該呼叫哪個函式進行處理。

事實上我們在[初始化](../init/init.qmd)時就已經寫過路由了，只是該路由作用僅僅只有在終端機輸出字串：

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return "Todo API 建立成功"
```

其意義為：當伺服器收到 `GET` 方法，路徑是 `/` 的請求，就執行 `home` 這個函式。

一個路由需要包含以下三要素：

1. **HTTP 方法**：`GET`、`POST`、`PATCH`、`DELETE` 等，代表此請求的**動作類型**
2. **路徑**：標示要存取哪個資源的字串，如 `/task`
3. **處理邏輯**：真正處理請求的函式本體

這篇要實作的路由，就是 [API 端點表](../intro/intro.qmd#tbl-api-endpoints)中的那五支。

## 程式碼實作 

在 `main.py` 實作前，需要 `import` 以下內容：

```python
from fastapi import Depends, HTTPException, Query
from uuid import UUID
from models import Task
from sqlalchemy.orm import Session
from schemas import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse
```


#### `GET`

```python
# 查詢任務
@app.get("/tasks/{id}", response_model=TaskResponse)
def get_task(id: UUID, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="找不到該任務")
    return task

# 查詢任務列表
@app.get("/tasks", response_model=TaskListResponse)
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    completed: bool | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Task)

    # 根據是否已完成限縮查詢範圍
    if completed is not None:
        query = query.filter(Task.completed == completed)

    # 根據是否關鍵字限縮查詢範圍
    if search is not None:
        query = query.filter(Task.title.ilike(f"%{search}%"))

    # 總任務數
    total = query.count()

    # 任務列表
    tasks = (
        query.order_by(Task.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return TaskListResponse(
        page=page,
        page_size=page_size,
        total=total,
        data=tasks
    )
```

#### `POST`

```python
# 建立任務
@app.post("/tasks", response_model=TaskResponse, status_code=201)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db)
):
    new_task = Task(**task.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task
```

#### `PATCH`

```python
# 更新任務
@app.patch("/tasks/{id}", response_model=TaskResponse)
def update_task(
    id: UUID,
    task_update: TaskUpdate,
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="找不到該任務")

    # 取得更新資料
    update_data = task_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="更新內容不可為空")

    # 替換任務資料
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task
```

#### `DELETE`

```python
# 刪除任務
@app.delete("/tasks/{id}", status_code=204)
def delete_task(id: UUID, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="找不到該任務")

    db.delete(task)
    db.commit()
```


完整的 `main.py` 如下：

<details>
<summary>main.py</summary>

```python
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine
from models import Task
from schemas import TaskCreate, TaskListResponse, TaskResponse, TaskUpdate

app = FastAPI()

# 創建資料表
Base.metadata.create_all(bind=engine)


# 資料庫依賴
def get_db():
    # 建立連線
    db = SessionLocal()
    try:
        yield db
    finally:
        # 必須關閉連線
        db.close()


# 根路由
@app.get("/")
def home():
    return "Todo API 建立成功"


# 建立任務
@app.post("/tasks", response_model=TaskResponse, status_code=201)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(**task.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


# 查詢任務
@app.get("/tasks/{id}", response_model=TaskResponse)
def get_task(id: UUID, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="找不到該任務")
    return task


# 查詢任務列表
@app.get("/tasks", response_model=TaskListResponse)
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    completed: bool | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Task)

    # 根據是否已完成限縮查詢範圍
    if completed is not None:
        query = query.filter(Task.completed == completed)

    # 根據是否關鍵字限縮查詢範圍
    if search is not None:
        query = query.filter(Task.title.ilike(f"%{search}%"))

    # 總任務數
    total = query.count()

    # 任務列表
    tasks = (
        query.order_by(Task.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return TaskListResponse(page=page, page_size=page_size, total=total, data=tasks)


# 更新任務
@app.patch("/tasks/{id}", response_model=TaskResponse)
def update_task(id: UUID, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="找不到該任務")

    # 取得更新資料
    update_data = task_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="更新內容不可為空")

    # 替換任務資料
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task


# 刪除任務
@app.delete("/tasks/{id}", status_code=204)
def delete_task(id: UUID, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="找不到該任務")

    db.delete(task)
    db.commit()
```

</details>

如此一來主要路由均完成了！接下來用 `curl` 實際打打看：

```bash
# 建立任務
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "買牛奶", "description": "去超市"}'
```

範例輸出：

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "買牛奶",
  "description": "去超市",
  "completed": false,
  "created_at": "2026/08/05 13:00:00",
  "updated_at": "2026/08/05 13:00:00"
}
```

```bash
# 查詢任務列表
curl http://localhost:8000/tasks
```

範例輸出：

```json
{
  "page": 1,
  "page_size": 20,
  "total": 1,
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "title": "買牛奶",
      "description": "去超市",
      "completed": false,
      "created_at": "2026/08/05 13:00:00",
      "updated_at": "2026/08/05 13:00:00"
    }
  ]
}
```

```bash
# 查詢單一任務
curl http://localhost:8000/tasks/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

範例輸出：

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "買牛奶",
  "description": "去超市",
  "completed": false,
  "created_at": "2026/08/05 13:00:00",
  "updated_at": "2026/08/05 13:00:00"
}
```

```bash
# 標記完成，測試只帶部分欄位
curl -X PATCH http://localhost:8000/tasks/3fa85f64-5717-4562-b3fc-2c963f66afa6 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

範例輸出：

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "買牛奶",
  "description": "去超市",
  "completed": true,
  "created_at": "2026/08/05 13:00:00",
  "updated_at": "2026/08/05 13:05:00"
}
```

```bash
# 刪除任務
curl -X DELETE http://localhost:8000/tasks/3fa85f64-5717-4562-b3fc-2c963f66afa6 -w "%{http_code}\n"
```

範例輸出：

```plaintext
204
```

```bash
# 刪除後再查一次，確認變成查無此任務
curl http://localhost:8000/tasks/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

範例輸出：

```json
{
  "detail": "找不到該任務"
}
```
