---
title: Go 語言筆記系列：初步認識 Go 語言
date: '2026-11-11'
lang: zh-TW
permalink: articles/go/intro-to-go/
categories: &id001
- Go
- 程式語言
tags: *id001
excerpt: 記錄我開始學習 Go 的原因，以及在動手寫程式之前，我對這門語言的初步認識。
lang_trend: true
---

## 為什麼想學 Go

我想學習 Go 的初衷很簡單，就只是單純看到身邊有人在用 Go，看起來很好玩，所以我也想玩玩看。

不過我平常寫 Python，後端用 FastAPI，其他時間多半在寫 JavaScript，這兩個用起來都蠻順手，也沒什麼不滿。要多花時間學一個新語言，總得先想一下：**值不值得**？

先看關注度。下圖是 TIOBE 程式語言指數 @citep[tiobe2026]，它用搜尋引擎裡各語言的查詢量來估算熱度。你可以切換時間範圍和座標，也可以只留自己在意的語言（語言標誌來自 @citet[devicon]）：

<figure id="fig-lang-trend"><div class="lang-trend"></div><figcaption><strong>圖 1</strong> 主要程式語言的 TIOBE 指數走勢，2001 年 6 月至 2026 年 11 月</figcaption></figure>

Go 這十年大多在 1% 到 3% 之間，2026 年 11 月是 1.69%，在這十個主流語言墊底；相較於 Go，Python 則是從 3.57% 一路爬到 20.86%。

那從職缺的角度看呢？根據英國 [ITJobsWatch](https://www.itjobswatch.co.uk/) @citep[itjobswatch2026] 針對 IT 廣告中有提到 Go 的比例：

<figure id="fig-go-jobs"><div class="lang-trend" data-set="jobs"></div><figcaption><strong>圖 2</strong> 英國 IT 職缺廣告中提到 Go 的占比（約略值）</figcaption></figure>

正職在 2022 年初衝到約 3%，現在只剩約 0.45%。當然，這只是英國一個市場，參考就好。另外有個地方蠻有意思：提到 Go 的廣告裡，約 58.5% 同時要求 Python，所以 Go 比較像是和 Python 搭配的語言。

不過換個角度，Stack Overflow 的開發者調查裡，Go 的使用比例從 2021 年的 9.55% @citep[stackoverflow2021] 升到 2025 年的 16.4% @citep[stackoverflow2025]。

雖然 Go 不是最紅、主流的語言，但也沒有消失，對我而言**值得花時間學習**！

## Go 是什麼

Go 是 Google 的 Robert Griesemer、Rob Pike 和 Ken Thompson 在 2007 年 9 月 21 日於白板上開始構想的語言，2009 年 11 月 10 日開源 @citep[gofaq]。

起因是他們對用當時的語言蓋大型專案感到挫折：程式和建置系統都太複雜，而且多核心處理器越來越普遍，多數語言卻幫不上什麼忙 @citep[gofaq]。Pike 後來也提到，當時 Google 的伺服器多半是 C++，其他部分是 Java 和 Python，建置時間動輒數分鐘甚至數小時 @citep[pike2012]。官方對它的定義是：

> *Go is a compiled, concurrent, garbage-collected, statically typed language developed at Google.*
>
> — Rob Pike @citep[pike2012]

對寫 Python 的人來說，最直接的差別是**編譯**和**靜態型別**。Python 是直譯執行、型別到執行時才確定；Go 則是先編譯成執行檔，型別在編譯時就會檢查。而且預設是靜態連結，執行檔會把 Go 的 runtime 一起包進去 @citep[gofaq]，不需要像 Python 那樣先在機器上裝好直譯器。

至於設計取向，Pike 說得很老實：

> *...a language that is not a breakthrough research language but is nonetheless an excellent tool for engineering large software projects.*
>
> — Rob Pike @citep[pike2012]

## 學習計畫

我學習 Go 的目標很單純，希望可以把 Go 練到跟 Python 一樣熟，並且做出更快、更省資源的服務。

因此本系列將會分成四段：基礎語法、並行與 runtime、後端常用的框架和資料庫，最後做一個簡化的支付服務。

{% go_roadmap <strong>圖 3</strong> Go 筆記系列的學習路線[^gopher] %}

[^gopher]: 地鼠造型改作自 Renée French 設計的 Go gopher（CC BY 4.0）@citep[gophergo]。

## 參考文獻

[references]
