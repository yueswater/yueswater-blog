---
title: Todo App | Conclusion
date: '2026-08-08'
lang: en
categories: &id001
- Backend
- Todo App
tags: *id001
excerpt: A look back at the whole Todo App series, and what comes next.
---

Starting from the [introduction](../intro/intro-en.qmd), this series built a Todo API with Python and FastAPI, working through project setup, the Model, the Schema, the full API implementation, and finally wrapping up with [decoupling](../decoupling/decoupling-en.qmd). The whole series was really about one thing: turning a simple CRUD service into a project with clear responsibilities that is actually easy to maintain.

## What I learned

- **Spec first**: define the data table and API endpoints before writing any code — it saves more time than figuring it out mid-write.
- **Know the framework's limits**: `Query(ge=1)` and Pydantic's validation reject a lot of bad input, but not every rule — some still need to be written by hand.
- **Layer your code**: as features grow, functions keep growing too, and business logic can no longer be tested apart from the framework. Splitting into a Route and a Service layer stops one change from breaking everything else.

!!! info "Note"
    **Model**: the shape the data actually has in the database

    **Schema**: the shape an API request or response is allowed to have — usually a subset or a variation of the Model


## What could come next

The series stops here, but a few pieces are still missing before this could be a service that actually goes to production:

- Authentication and authorization
- Automated testing
- Deployment and environment configuration

Follow this series through, and you should have a clear picture of everything a request passes through, from arrival to response — that matters more than memorizing any one framework's syntax.
