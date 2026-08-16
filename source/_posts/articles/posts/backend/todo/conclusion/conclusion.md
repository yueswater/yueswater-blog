---
title: Todo App | 總結
date: '2026-08-08'
lang: zh-TW
categories: &id001
- 後端開發
- Todo App
tags: *id001
excerpt: 回顧整個 Todo App 系列，整理學到的東西與後續方向。
thumbnail: /images/covers/Backend_logo.png
---

從[介紹](../intro/intro.qmd)開始，這個系列用 Python/FastAPI 實作了一次 Todo API，走過初始化、Model、Schema、API 功能實作，最後在[分檔與解耦](../decoupling/decoupling.qmd)收尾。整個系列其實在做同一件事：把一個簡單的 CRUD 服務，逐步蓋成職責清楚、好維護的專案。

## 學到的東西

- **先定規格再寫**：資料表跟 API 端點先想清楚，比邊寫邊想省事。
- **框架有邊界**：`Query(ge=1)`、Pydantic 能擋掉不少錯誤輸入，但不是所有規則都靠得住，該補的還是得自己補。
- **職責要分層**：功能一多，函式越寫越長，業務邏輯也難單獨測試。拆成 Route → Service，才能避免牽一髮而動全身。

!!! info "筆記"
    **Model**：資料庫實際存的形狀

    **Schema**：API 請求/回應允許的形狀，通常是 Model 的子集或變形


## 接下來可以做的事

這個系列到這裡告一段落，但一個真正能上線的服務還缺幾塊，之後有機會可以再寫：

- 身份驗證與授權
- 自動化測試
- 部署與環境設定

跟著做完這個系列，應該已經清楚一個 API 請求從進來到回應，中間經過哪些層——這比記住任何框架用法都重要。
