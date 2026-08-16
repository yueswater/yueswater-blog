---
title: Todo App | Models & Database
date: '2026-08-04'
lang: en
categories: &id001
- Backend
- Todo App
tags: *id001
excerpt: Define the data model and connect to the database.
---

The [previous article](../init/init-en.qmd) initialized the project, so now we can start building the model.

A model is simply the "shape" of a piece of data written as code — it describes which fields the data has and what type each field is.

In this project, the fields for each task are shown in [the task data table on the introduction page](../intro/intro-en.qmd#tbl-task-fields). Most frameworks today support an [object-relational mapper (ORM)](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping), which lets you define the code once and automatically generate the SQL statements to build the table, saving you from writing raw SQL by hand.

**FastAPI** is usually paired with SQLAlchemy. You inherit from a `Base` class, and mark field types with `Mapped`[^sqlalchemy].

## Table Schema Diagram 

To see clearly what each field is defined as and what its type is, it is common practice to draw a table schema diagram, which helps with understanding[^dbdiagram].

This project only needs one table, the tasks table, shown below:

![Task table schema diagram](./images/table-design-diagram.svg)

Here, `NN` stands for `not null`. The corresponding SQL statement is:

```sql
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation 

Based on the table above, we can now actually write the code.

#### Set Up the Database 

First, we need to set up a database that can be connected to. Create `database.py` in the project root:

```bash
touch database.py
```

Next, we need to define a few database properties inside it, as follows:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Use SQLite and define where the database file is stored
DATABASE_URL = "sqlite:///./todo.db"

# Create the connection pool
engine = create_engine(
    url=DATABASE_URL,
    connect_args={
        "check_same_thread": False, # only the connection that created it may use it
        "uri": True,                # parse as a URI so extra parameters can be added
        "timeout": 30                # give up the connection after this timeout
    }
)

# Create the Session factory
SessionLocal = sessionmaker(
    bind=engine,    # only allowed to connect to the engine defined above
    autoflush=False # don't auto-send pending SQL statements
)

# The base class every model must inherit from
class Base(DeclarativeBase):
    pass
```

#### Define the Database 

Next, create `models.py`:

```bash
touch models.py
```

Then put all the field definitions for the table into this file:

```python
import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    completed: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
```

A couple of things worth noting here:

- `mapped_column`: used to configure a field, such as whether it is a primary/foreign key, whether it can be null, its default value, and so on.
- `server_default`: a database-side default value. Whether the data is inserted through the ORM or through some other tool, the database will fill this in automatically[^default].

#### Connect the Database 

Finally, we need to wire the database we just built into the entry point, so it gets created and connected when the app starts:

```python
from database import SessionLocal, engine, Base
from fastapi import FastAPI

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

@app.get("/")
def home():
    return "Todo API created successfully"
```

Once it starts, you should see a `todo.db` file appear — that means the database was created successfully!

[^sqlalchemy]: Since SQLAlchemy 2.0, it has been [recommended](https://docs.sqlalchemy.org/en/20/orm/declarative_tables.html#declarative-table-with-mapped-column) to mark the type with `Mapped[...]` and declare the column with `mapped_column()`, for example `id: Mapped[int] = mapped_column(primary_key=True)`, instead of the older style of using `Column()` alone. The old style still works (it is backward compatible), but the new style is friendlier to static type checkers such as [mypy](https://mypy-lang.org/) and [pyright](https://github.com/microsoft/pyright), and is also the style officially recommended now.

[^dbdiagram]: I recommend [dbdiagram.io](https://dbdiagram.io/) — it lets you draw a table schema diagram with a simple text syntax, and can also export/import SQL directly, which makes it easy to compare against the actual `CREATE TABLE` statement.

[^default]: `server_default` is different from `default`. The latter is a Python-side default value, which is only computed when data is inserted through the SQLAlchemy ORM — inserting via raw SQL that bypasses the ORM will not trigger it.
