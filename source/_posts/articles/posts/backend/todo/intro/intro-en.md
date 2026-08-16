---
title: Todo App | Introduction
date: '2026-08-04'
lang: en
categories: &id001
- Backend
- Todo App
tags: *id001
excerpt: Introduction to the Todo App practice project
---

A Todo App is often one of the first projects that people build when they start learning backend development. This series is a collection of notes from my own practice, and I hope it will also be useful to others who are learning the same thing.

This project will be implemented using Python with FastAPI.

## Project Description 

> A small team needs an internal task management service. Only the backend needs to be built — there is no requirement for a login system, a frontend, or multi-user collaboration.

### Core Requirements 

The API needs to support the following functions:

- Create a task
- View the task list
- View a single task
- Update a task
- Delete a task
- Mark a task as complete or incomplete

### Task Data 

Each task should contain at least the following fields:

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Unique identifier |
| `title` | `VARCHAR(100)` | Title |
| `description` | `VARCHAR(500)` | Description, can be empty |
| `completed` | `BOOLEAN` | Completion status |
| `created_at` | `TIMESTAMP` | Created time |
| `updated_at` | `TIMESTAMP` | Updated time |

: 

**Note**: `created_at` and `updated_at` should be converted to Taipei time when shown to the client, in the format `yyyy/mm/dd HH:MM:SS`.

### Business Logic 

**Field Rules**

| Field | Rule |
|---|---|
| Title | Required; must not be empty after trimming leading and trailing whitespace; maximum 100 characters |
| Description | Optional; maximum 500 characters |
| Completion status | Defaults to incomplete for a new task; must be a boolean value |

**Operation Rules**

| Operation | Rule |
|---|---|
| Update | Partial updates are allowed; the ID must not be changed through an update; the updated time must change whenever the data is actually modified; an empty update payload should be rejected |
| Delete | Once a deletion succeeds, the task must no longer be retrievable; deleting a task that does not exist should return a clear error |



## API Endpoint Description

The core requirements correspond to five REST API routes, designed as follows:

| Method | Path | Description | Notes |
|---|---|---|---|
| `POST` | `/tasks` | Create a task | |
| `GET` | `/tasks` | Retrieve the task list | Supports pagination, filtering, sorting, and search |
| `GET` | `/tasks/{id}` | Retrieve a single task | |
| `PATCH` | `/tasks/{id}` | Update a task | Allows partial field updates, including marking completion status |
| `DELETE` | `/tasks/{id}` | Delete a task | |

:
