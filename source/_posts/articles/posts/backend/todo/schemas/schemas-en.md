---
title: Todo App | Schemas
date: '2026-08-04'
lang: en
categories: &id001
- Backend
- Todo App
tags: *id001
excerpt: Define request and response validation schemas.
---

In the [previous article](../models-db/models-db-en.qmd), we turned the table into code. Next, we need to define the validation structures for the data — the schemas.

A schema is built on top of the shape that is actually stored in the database, and it defines the format that an API request or response is allowed to have — usually a subset or a variation of the model. For example, a request to create a task should not allow the user to provide an `id` or timestamps.

!!! info "Note"
    **Model**: the shape the data actually has in the database

    **Schema**: the shape an API request or response is allowed to have — usually a subset or a variation of the Model


In general, a model does not map to just one schema — it is usually split into several schemas depending on the business logic involved.

**FastAPI** comes with [Pydantic](https://docs.pydantic.dev/)'s `BaseModel` built in — this is the core mechanism of FastAPI, and it also generates the API documentation automatically.

## Schema Analysis

When working out what a schema should contain, we should work backward from the [API endpoint table](../intro/intro-en.qmd#tbl-api-endpoints).

### Input Schema 

Taking the task data as an example — as mentioned earlier, things like `id` and the timestamps should not be provided by the user. They are calculated by the server itself, and should never appear in a schema. So, in this project:

- **For creating a task**: only `title` and `description` need to be filled in. `completed` should not be user-fillable either, since the business rules clearly state that **a new task defaults to incomplete**.

- **For updating a task**: `title`, `description`, and `completed` are all optional, since partial updates are allowed — but `id` must still never be user-fillable.

### Output Schema 

What gets sent back to the frontend is, in this project, basically the full task data. However, this project has a slightly special requirement, and the response needs to follow this example structure:

```json
{
  "page": 1,
  "page_size": 20,
  "total": 42,
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "title": "Buy milk",
      "description": "Go to the supermarket to buy fresh milk",
      "completed": false,
      "created_at": "2026-08-05T09:00:00Z",
      "updated_at": "2026-08-05T09:00:00Z"
    }
  ]
}
```

### Query Schema 

It is worth noting that this project has a requirement to search tasks by keyword when fetching them, for example:

```plaintext
url/tasks?page=1&page_size=20&completed=true&search=牛奶
```

This is what is known as a **query string**, and it has the following characteristics:

1. **Everything arrives as a string**: whatever comes through the URL — `page=1` for instance — is received as the string `1`, not a number. So when validating it, remember to **coerce** the type; do not treat it as already being an integer.
2. **Everything must be optional**: give each one a default value, so that `GET /tasks` still works when called with no parameters at all.

## Implementation 

Create `schemas.py`:

```bash
touch schemas.py
```

Then start implementing:

```python
from datetime import datetime
from uuid import UUID
from zoneinfo import ZoneInfo

from pydantic import BaseModel, ConfigDict, Field, field_validator, field_serializer


# Schema for creating a task
class TaskCreate(BaseModel):
    title: str = Field(..., max_length=100)
    description: str | None = Field(None, max_length=500)

    @field_validator("title", mode="before")
    @classmethod
    def trim_title(cls, v):
        if isinstance(v, str):
            v = v.strip()
        if not v:
            raise ValueError("title must not be empty")
        return v


# Schema for updating a task
class TaskUpdate(BaseModel):
    title: str | None = Field(None, max_length=100)
    description: str | None = Field(None, max_length=500)
    completed: bool | None = None

    @field_validator("title", mode="before")
    @classmethod
    def trim_title(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            v = v.strip()
        if not v:
            raise ValueError("title must not be empty")
        return v


# Schema for returning a task
class TaskResponse(BaseModel):
    id: UUID
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    # Convert the time to Taipei time
    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def convert_to_taipei_timezone(cls, v):
        if isinstance(v, datetime):
            if v.tzinfo is None:
                v = v.replace(tzinfo=ZoneInfo("UTC"))
            return v.astimezone(ZoneInfo("Asia/Taipei"))
        return v

    # Format the time
    @field_serializer("created_at", "updated_at")
    def format_datetime(self, v: datetime) -> str:
        return v.strftime("%Y/%m/%d %H:%M:%S")
```

When actually testing this, I found that the plain `str` type on `title` does not limit its length or reject a whitespace-only string — both an all-whitespace title and one over 100 characters passed validation. Note that the length limit needs to be added separately with `Field(max_length=...)`; and since a string like `"   "` does not have a length of 0, `Field` cannot catch it either — you need a `mode="before"` `field_validator` to trim it first and then check whether it is empty. Missing either one leaves a gap.
