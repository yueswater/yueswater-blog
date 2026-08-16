---
title: Todo App | API Implementation
date: '2026-08-04'
lang: en
categories: &id001
- Backend
- Todo App
tags: *id001
excerpt: Implement the API.
thumbnail: /images/covers/Backend_logo.png
---

By this point, the model and the schemas are both in place. This article is about wiring them together to produce a working API.

## Routing 

A **route** can be thought of as a lookup table between "HTTP method + URL path" and "which piece of code should run". When the server receives a request, it needs to check this table first to know which function to call.

In fact, we already wrote a route back in [Initialization](../init/init-en.qmd) — it just did nothing more than print a string to the terminal:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return "Todo API created successfully"
```

What this means is: when the server receives a `GET` request for the path `/`, it runs the `home` function.

A route needs three things:

1. **HTTP method**: `GET`, `POST`, `PATCH`, `DELETE`, and so on — this represents the **type of action** for the request.
2. **Path**: a string that identifies which resource is being accessed, such as `/task`.
3. **Handler logic**: the actual function body that processes the request.

The routes we are implementing in this article are exactly the five listed in the [API endpoint table](../intro/intro-en.qmd#tbl-api-endpoints).

## Implementation 

Before implementing `main.py`, we need to `import` the following:

```python
from fastapi import Depends, HTTPException, Query
from uuid import UUID
from models import Task
from sqlalchemy.orm import Session
from schemas import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse
```


#### `GET`

```python
# Retrieve a task
@app.get("/tasks/{id}", response_model=TaskResponse)
def get_task(id: UUID, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# Retrieve the task list
@app.get("/tasks", response_model=TaskListResponse)
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    completed: bool | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Task)

    # Narrow the query by completion status, if provided
    if completed is not None:
        query = query.filter(Task.completed == completed)

    # Narrow the query by keyword, if provided
    if search is not None:
        query = query.filter(Task.title.ilike(f"%{search}%"))

    # Total number of tasks
    total = query.count()

    # The task list
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
# Create a task
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
# Update a task
@app.patch("/tasks/{id}", response_model=TaskResponse)
def update_task(
    id: UUID,
    task_update: TaskUpdate,
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get the fields that were actually provided
    update_data = task_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Empty update payload")

    # Apply the update
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task
```

#### `DELETE`

```python
# Delete a task
@app.delete("/tasks/{id}", status_code=204)
def delete_task(id: UUID, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
```


The complete `main.py` is as follows:

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

# Create the tables
Base.metadata.create_all(bind=engine)


# Database dependency
def get_db():
    # Open a connection
    db = SessionLocal()
    try:
        yield db
    finally:
        # Always close the connection
        db.close()


# Root route
@app.get("/")
def home():
    return "Todo API created successfully"


# Create a task
@app.post("/tasks", response_model=TaskResponse, status_code=201)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(**task.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


# Retrieve a task
@app.get("/tasks/{id}", response_model=TaskResponse)
def get_task(id: UUID, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# Retrieve the task list
@app.get("/tasks", response_model=TaskListResponse)
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    completed: bool | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Task)

    # Narrow the query by completion status, if provided
    if completed is not None:
        query = query.filter(Task.completed == completed)

    # Narrow the query by keyword, if provided
    if search is not None:
        query = query.filter(Task.title.ilike(f"%{search}%"))

    # Total number of tasks
    total = query.count()

    # The task list
    tasks = (
        query.order_by(Task.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return TaskListResponse(page=page, page_size=page_size, total=total, data=tasks)


# Update a task
@app.patch("/tasks/{id}", response_model=TaskResponse)
def update_task(id: UUID, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get the fields that were actually provided
    update_data = task_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Empty update payload")

    # Apply the update
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task


# Delete a task
@app.delete("/tasks/{id}", status_code=204)
def delete_task(id: UUID, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
```

</details>

With that, all the main routes are done! Next, let's actually try them out with `curl`:

```bash
# create a task
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy milk", "description": "Go to the supermarket"}'
```

Example output:

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "Buy milk",
  "description": "Go to the supermarket",
  "completed": false,
  "created_at": "2026/08/05 13:00:00",
  "updated_at": "2026/08/05 13:00:00"
}
```

```bash
# retrieve the task list
curl http://localhost:8000/tasks
```

Example output:

```json
{
  "page": 1,
  "page_size": 20,
  "total": 1,
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "title": "Buy milk",
      "description": "Go to the supermarket",
      "completed": false,
      "created_at": "2026/08/05 13:00:00",
      "updated_at": "2026/08/05 13:00:00"
    }
  ]
}
```

```bash
# retrieve a single task
curl http://localhost:8000/tasks/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

Example output:

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "Buy milk",
  "description": "Go to the supermarket",
  "completed": false,
  "created_at": "2026/08/05 13:00:00",
  "updated_at": "2026/08/05 13:00:00"
}
```

```bash
# mark it complete, testing a partial update
curl -X PATCH http://localhost:8000/tasks/3fa85f64-5717-4562-b3fc-2c963f66afa6 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

Example output:

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "Buy milk",
  "description": "Go to the supermarket",
  "completed": true,
  "created_at": "2026/08/05 13:00:00",
  "updated_at": "2026/08/05 13:05:00"
}
```

```bash
# delete the task
curl -X DELETE http://localhost:8000/tasks/3fa85f64-5717-4562-b3fc-2c963f66afa6 -w "%{http_code}\n"
```

Example output:

```plaintext
204
```

```bash
# query it again after deleting, to confirm it is now not found
curl http://localhost:8000/tasks/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

Example output:

```json
{
  "detail": "Task not found"
}
```
