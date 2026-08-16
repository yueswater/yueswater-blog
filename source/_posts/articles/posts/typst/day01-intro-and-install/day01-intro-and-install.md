---
title: 30 天從零學會 Typst | Day 01：為什麼是 Typst？
date: '2026-08-14'
lang: zh-TW
categories: &id001
- Typst
- 排版系統
tags: *id001
excerpt: 從 LaTeX 的痛點出發，認識 Typst 這個以 Rust 打造的新一代排版系統，並完成 macOS / Linux / Windows 安裝與線上編輯器設定。
thumbnail: /images/covers/Typst_logo.png
---

對於常需要排版數學符號、講究排版品質的大學生、研究人員來說，LaTeX 幾乎是繞不開的選擇——歷史悠久（自 1984 年起逾 40 年）、社群穩定、套件生態完整，也是學術圈論文範本與投稿系統的主流格式。但真正用過的人大概都對它又愛又恨：冗長的編譯時間、動輒佔滿整個螢幕的錯誤訊息、為排一張圖就得翻半天套件文件、package 衝突搞掉一個下午——這些對新手是門檻，對老手是日常，畢竟它的語法終究源自 1980 年代的設計思維，在習慣現代語言簡潔語法的人眼中，難免顯得笨重又難除錯。

於是這幾年，開始有人嘗試用現代的角度重新設計排版系統，而 [Typst](https://typst.app/) 正是其中最受矚目的一個。它由 [Rust](https://rust-lang.org/) 撰寫，主打**編譯速度快、語法簡潔、錯誤訊息友善**，同時保留了 LaTeX 引以為傲的數學排版能力與可程式化的彈性。對長期被 LaTeX 折磨的人來說，Typst 的出現像是一道曙光；但它終究還是個相對年輕的專案，生態、套件、社群資源都還在快速成長中，能不能真正取代 LaTeX，還有待時間證明。

這系列鐵人賽文章，我想從自己實際使用 Typst 的經驗出發，記錄它的語法設計、與 LaTeX 的差異、常見排版情境（論文、履歷、投影片等）的實作方式，也會誠實分享踩過的坑與尚未成熟的地方。希望能幫助同樣受夠 LaTeX 編譯速度、卻又離不開它排版品質的人，多一個值得認真考慮的選擇。

## Typst 介紹

Typst 由 Laurenz Mädje 與 Martin Haug 於 2019 年開始開發，背後是他們創立的 Typst GmbH，2023 年 3 月正式以開源形式發布，核心用 Rust 撰寫。官方 GitHub 專案簡介寫得很直白[^1]：

> [...] *designed to be as powerful as LaTeX while being much easier to learn and use* [...]

這也是它從一開始就鎖定的目標族群：被 LaTeX 折磨過、卻離不開它排版品質的人。

語法上，Typst 採 Markdown 般的標記語言設計，並區分標記、數學、程式碼三種模式，可依需求自由切換；內建數學公式排版、表格、引用書目、投影片等常見學術與文件需求，不必再像 LaTeX 那樣到處找套件拼湊。編譯採增量技術，只重新運算變動的部分，搭配線上編輯器的即時預覽，速度是毫秒等級，錯誤訊息也直接指出問題位置，不會再像 LaTeX 一樣噴出滿螢幕看不懂的 log。

目前 Typst 仍在 Beta 階段，版本迭代頻繁（截至 2026 年 7 月已來到 `0.15.1`），但無論是論文、履歷、投影片、報告或書籍，都已經有足夠的功能與穩定度可以實際使用，這也是這系列文章想帶大家一起上手的原因。

下面的表格把幾個常見的排版系統攤開來比較：

| 面向 | Word | LaTeX | Typst |
| --- | --- | --- | --- |
| 排版方式 | 所見即所得（WYSIWYG） | 標記語言＋編譯 | 標記語言＋編譯 |
| 學習曲線 | 低，多數人都會用 | 高，語法繁瑣、套件生態龐雜 | 中，語法比 LaTeX 簡潔 |
| 編譯／預覽速度 | 即時（本來就是所見即所得） | 慢，常見秒級以上 | 快，增量編譯多為毫秒級 |
| 數學公式排版 | 普通，公式編輯器陽春 | 業界標準，功能最完整 | 內建支援，語法比 LaTeX 精簡 |
| 版面精確控制 | 弱，排版容易跑版 | 強 | 強 |
| 授權／費用 | 付費（Office 訂閱或一次性購買） | 免費、開源（LPPL 等） | 免費、開源（Apache 2.0） |
| 適合場景 | 一般文書、商業文件 | 學術論文、書籍、長篇文件 | 學術論文、履歷、報告，且想要更現代的開發體驗 |

: 

簡單說，Word 好上手但排版不可控，LaTeX 排版最強但成本高，Typst 則是想在兩者之間找一個甜蜜點。

## 安裝 Typst

Typst 的安裝方式因作業系統而異，官方提供原生執行檔，也可透過各平台常見的套件管理工具安裝，指令都很簡短。裝好後，建議再裝 VS Code 插件，取得語法高亮與即時預覽，開發體驗會好上不少。以下依序介紹 macOS、Linux、Windows 的安裝方式，最後說明插件安裝與設定。


#### macOS

macOS 上最簡單的方式是透過 [Homebrew](https://brew.sh/)：

```bash
brew install typst
```

安裝完成後，可以用以下指令確認版本，確保安裝成功：

```bash
typst --version
```

如果一切順利，終端機會印出類似以下的版本資訊：

```
typst 0.15.1 (a1b2c3d)
```

#### Linux

Linux 沒有統一的官方套件來源，安裝方式會因發行版而異，可以先到 [Repology](https://repology.org/project/typst/versions) 查詢自己的發行版是否已收錄 Typst 套件，再用對應的套件管理器安裝（例如 Arch 的 `pacman -S typst`）。

如果發行版沒有現成套件，也可以透過 Rust 工具鏈直接安裝：

```bash
cargo install --locked typst-cli
```

安裝完成後，同樣用版本指令確認：

```bash
typst --version
```

看到類似 `typst 0.15.1 (a1b2c3d)` 的輸出，就代表安裝成功。

#### Windows

Windows 使用者可以透過內建的 [winget](https://learn.microsoft.com/zh-tw/windows/package-manager/winget/) 安裝：

```bash
winget install --id Typst.Typst
```

安裝完成後，打開終端機（PowerShell 或 CMD）輸入：

```bash
typst --version
```

看到版本號輸出如 `typst 0.15.1 (a1b2c3d)`，就代表安裝成功、且指令已正確加入 `PATH`。


### VS Code 插件

裝好 CLI 後，建議在 VS Code 安裝 [Tinymist Typst](https://marketplace.visualstudio.com/items?itemName=myriad-dreamin.tinymist) 插件，它是目前官方推薦、整合度最完整的 Typst 語言服務，提供語法高亮、即時預覽、自動補全與錯誤提示等功能。安裝方式很直覺：打開 VS Code 的擴充功能面板（`Cmd/Ctrl + Shift + X`），搜尋 Tinymist 後點選安裝即可，不需要額外設定就能直接編輯 `.typ` 檔案並看到即時預覽。

## 線上編輯

如果不想在本機裝任何東西，[typst.app](https://typst.app/) 是官方提供的線上編輯器，開瀏覽器就能直接寫，體驗很接近 LaTeX 使用者熟悉的 Overleaf。

<figure><img src="images/typst-app-home.png" alt="typst.app 首頁"><figcaption>typst.app 首頁</figcaption></figure>

進入首頁後，點選 [Sign up](https://typst.app/signup/) 並完成註冊後，使用免費方案就有基本的儲存空間與協作功能可用。

<figure><img src="images/typst-app-signup.png" alt="typst.app 註冊頁面"><figcaption>typst.app 註冊頁面</figcaption></figure>

登入後可以直接進到官方提供的 Playground 練習。編輯畫面是左右分割：左邊寫 Typst 語法，右邊即時渲染成排好版的頁面，改一個字右邊幾乎立刻跟著更新；上方工具列內建粗體、斜體、底線、標題、清單、數學符號、程式碼區塊、提及（mention）、留言等常用功能按鈕，不用先背指令也能上手，右上角則可以直接 Share 分享連結或匯出檔案。

<figure><img src="images/typst-playground.png" alt="Typst Playground 編輯畫面"><figcaption>Typst Playground 編輯畫面</figcaption></figure>

對還在猶豫要不要安裝本機環境的人，這是門檻最低的入門方式；等熟悉語法後，再切換到前面介紹的 CLI + VS Code 本機工作流也不遲，兩邊寫的 `.typ` 檔案是互通的。

## 小結

這篇算是整個系列的起點：從 LaTeX 的痛點出發，認識了 Typst 這個以 Rust 打造、主打快速編譯與簡潔語法的新選擇，也把環境準備好了——不管是 macOS、Linux、Windows 裝 CLI 搭配 VS Code 插件，或是懶得裝東西直接用 typst.app 線上編輯，都能開始寫。接下來的文章會正式進入 Typst 的語法本體，從最基本的標記語法開始，一步步比對它跟 LaTeX 的差異！

[^1]: 請參考[官方 Repo](https://github.com/typst/typst) 說明。
