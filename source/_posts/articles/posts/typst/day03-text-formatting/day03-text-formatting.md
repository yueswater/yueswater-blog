---
title: 30 天從零學會 Typst | Day 03：Typst 的基本文字排版
date: '2026-08-16'
lang: zh-TW
categories: &id001
- Typst
- 排版系統
tags: *id001
excerpt: 學會底線、刪除線、螢光標記等文字裝飾語法，用 text 函式客製化字型、字級、顏色與粗細，並掌握對齊與換行的控制方式。
thumbnail: /images/covers/Typst_logo.png
---

[上一篇](../day02-getting-started/day02-getting-started.html)寫出了第一份 Typst 文件，練了標題、粗體斜體、清單等幾個最基本的語法。這篇要繼續往下，細談常用的文字排版工具：底線、刪除線、螢光標記這類裝飾語法，上標下標、小型大寫這些細節調整，還有用 `text` 函式客製化字型、字級、顏色與粗細。

雖然這些語法單獨看都不難，但組合起來才是實際寫文件時常會用到的排版手感，得時常練習養成**肌肉記憶**。這篇會照著文字裝飾、客製化文字樣式、對齊與換行三個段落依序展開，讓手上的 Typst 文件除了骨架，也開始有一致的視覺風格。

## 文字裝飾

### 底線、刪除線與上劃線

底線、刪除線、上劃線是最基礎的三種文字裝飾，語法上對應三個函式：`#underline[...]`、`#strike[...]`、`#overline[...]`，把要套用效果的文字包進中括號就好，完全不需要額外設定：

```typst
這是一段包含#underline[底線]、#strike[刪除線]與#overline[上劃線]的文字。
```

### 螢光標記

要標記重點，可以用 `#highlight[...]`，預設會套上一層黃色背景，效果就像實體螢光筆畫過一樣：

```typst
#highlight[這段文字有螢光標記]，預設會套用黃色背景。
```

如果想換顏色，`highlight` 也吃 `fill` 參數，例如 `#highlight(fill: aqua)[...]` 就能換成水藍色螢光。

### 上標與下標

科學符號、化學式常會用到上標下標，`#super[...]` 與 `#sub[...]` 分別對應，通常直接接在要標註的文字後面：

```typst
質能方程式可以寫成 E = mc#super[2]，水的化學式則是 H#sub[2]O。
```

### 小型大寫字母

`#smallcaps[...]` 可以把文字轉換成小型大寫字母，常用在標題或強調專有名詞，但這個效果只對拉丁字母有效，中文字不受影響：

```typst
#smallcaps[Small Caps] 常用在標題或強調專有名詞的場合。
```

### 完整範例

把上面四種語法整合起來，寫成一份 `text-decoration.typ`：

```typst
#set text(font: ("Libertinus Serif", "PingFang TC"), size: 14pt)

= 文字裝飾範例

這是一段包含#underline[底線]、#strike[刪除線]與#overline[上劃線]的文字。

#highlight[這段文字有螢光標記]，預設會套用黃色背景。

質能方程式可以寫成 E = mc#super[2]，水的化學式則是 H#sub[2]O。

#smallcaps[Small Caps] 常用在標題或強調專有名詞的場合。
```

這裡額外用 `#set text(font: (...))` 指定了一份字型清單：拉丁字先用 [Libertinus Serif](https://fonts.google.com/specimen/Libertinus+Serif) 排版，中文字則退回到蘋方[^1]。

使用 `typst compile` 編譯後，結果如下：

<figure><img src="images/text-decoration-output.png" alt="文字裝飾範例輸出"><figcaption>文字裝飾範例輸出</figcaption></figure>

## 客製化文字樣式

前面的 `#set text(...)` 已經先用過一次，用來設定整份文件的預設字型跟字級。這一節要講的是同一個 `text` 函式的其他常用參數：字型、字級、顏色、粗細與樣式，而且不只能 `#set` 整份文件，也能只包住一小段文字局部套用。

`#text(...)[...]` 的括號分兩種：

- `()`：放是具名參數，也就是 `font`、`size`、`fill` 這些設定，寫成 `key: value` 的形式，多個參數用逗號隔開；
- `[]`：放實際內容，可以是一段文字，也可以是其他標記內容。

### 字型與字級

`#text(font: "...", size: ...)[...]` 可以只針對包住的文字換字型、換字級，不影響文件其他地方：

```typst
#text(font: "Heiti TC")[換成黑體字型的句子。]
```

#### 字型怎麼挑

在終端機中，我們可以使用 `typst fonts` 列出目前系統抓得到的所有字型名稱，直接複製貼上到 `font` 參數就能用，並可用 `sort`[^2] 排序輸出：

```bash
typst fonts | sort
```

以筆者的電腦為例，總共列出 482 種字型，這裡只列出排序後的前五個與後五個：

```
Academy Engraved LET
ADT Slab Numeric
ADT Slab Soft Numeric
Al Bayan
Al Bayan PUA
...
Yuppy SC
Yuppy TC
Zapf Dingbats
Zapfino
簡宋
```

如果是用 [typst.app](https://typst.app/) 線上編輯器，工具列上就有現成的字型下拉選單可以挑，不用自己查名字。找不到喜歡的字型，也可以到 [Google Fonts](https://fonts.google.com/) 下載字型檔、安裝到系統後一樣能用。

#### 字級單位

`size` 吃的是長度，而 Typst 支援的長度單位如下，其中 `pt` 是最常用來設定字級的單位：

| 單位 | 說明 | 範例 |
| --- | --- | --- |
| `pt` | 點 | `12pt` |
| `mm` | 公釐 | `254mm` |
| `cm` | 公分 | `2.54cm` |
| `in` | 英吋 | `1in` |
| `em` | 相對於目前字級的倍數 | `2.5em` |

### 顏色

`fill` 參數控制文字顏色，可以直接用內建的顏色名稱（如 `red`、`blue`），也可以用 `rgb("#...")` 指定自訂色碼。例如：

```typst
#text(fill: red)[紅色文字]
```

或是

```typst
#text(fill: rgb("#0074D9"))[自訂色碼的藍色文字]
```

除了內建的顏色名稱，Typst 也支援好幾種色彩模型直接指定顏色，各自的概念跟語法如下：

| 模型 | 全名 | 概念 | Typst 語法範例 |
| --- | --- | --- | --- |
| HEX | Hexadecimal | 用一串十六進位色碼表示顏色，網頁設計最常見的格式 | `rgb("#0074d9")` |
| RGB | Red Green Blue | 紅綠藍三個色光通道疊加，數值 0–255（或用百分比），螢幕顯示用的加法混色 | `rgb(0, 116, 217)` |
| CMYK | Cyan Magenta Yellow Key | 青、洋紅、黃、黑四種油墨疊加，數值為百分比，印刷輸出用的減法混色 | `cmyk(100%, 47%, 0%, 15%)` |
| HSL | Hue Saturation Lightness | 用色相、飽和度、明度描述顏色，比較貼近人眼直覺選色的方式 | `color.hsl(208deg, 100%, 43%)` |

上面四種語法其實描述的是同一個藍色，實務上如何選擇端視使用情境[^3]。

如果手上已經有想要的顏色（例如一張圖片、一份設計稿），但不知道色碼，可以用 [imagecolorpicker.com](https://imagecolorpicker.com/) 上傳圖片直接吸色，拿到 hex 值後貼進 `rgb("#...")` 就好，不用自己憑感覺猜。

### 粗細與樣式

字重 (weight) 指的是文字筆畫的粗細程度，數字愈大筆畫愈粗。但必須注意的是：**不是每種字型都會提供全部九個級別**，字型沒做對應的粗細時，Typst 會自動挑選最接近的版本代替：

| 具名字重 | 數值 |
| --- | --- |
| `"thin"` | `100` |
| `"extralight"` | `200` |
| `"light"` | `300` |
| `"regular"` | `400` |
| `"medium"` | `500` |
| `"semibold"` | `600` |
| `"bold"` | `700` |
| `"extrabold"` | `800` |
| `"black"` | `900` |

`weight` 參數可以填 `100` 到 `900` 的數字，也可以直接用上表的具名字重。先試試偏細的字重：

```typst
#text(weight: "light")[細字重 (light)]
```

反過來，換成偏粗的字重也是同樣寫法：

```typst
#text(weight: "bold")[粗字重 (bold)]
```

如果九個級別不夠用，也可以不用具名字重，直接填數字，指定介於粗體跟正常之間的字重，這是純 `*粗體*` 語法做不到的：

```typst
#text(weight: 500)[介於粗體與正常之間 (weight: 500)]
```

字重之外，`style` 則控制斜體或傾斜體，填 `"italic"` 或 `"oblique"`：

```typst
#text(style: "italic")[斜體 (italic)]
```

### 完整範例

把字型、顏色、粗細與樣式整合成一份 `text-styling.typ`：

```typst
#set text(font: ("Libertinus Serif", "PingFang TC"), size: 14pt)

= 客製化文字樣式範例

預設字型：這是一段用 Libertinus Serif 排版的句子。

#text(font: "Heiti TC")[換成黑體字型的句子。]

#text(fill: red)[紅色文字]、#text(fill: rgb("#0074D9"))[自訂色碼的藍色文字]。

#text(weight: "light")[細字重 (light)]、#text(weight: "bold")[粗字重 (bold)]、#text(style: "italic")[斜體 (italic)]。
```

用 `typst compile` 編譯後，結果如下：

<figure><img src="images/text-styling-output.png" alt="客製化文字樣式範例輸出"><figcaption>客製化文字樣式範例輸出</figcaption></figure>

## 對齊與換行

前面兩節都是針對文字本身做局部調整，這一節要往上一層，看內容整體在頁面上怎麼擺放：對齊在哪個位置、什麼時候該換行、什麼時候該開新段落。

### 文字對齊

`align` 控制內容對齊的位置，可以用 `#set align(...)` 套用到整份文件，也可以用 `#align(...)[...]` 只包住一段內容局部套用；水平、垂直方向的關鍵字可以用 `+` 組合，例如 `right + bottom`：

| 關鍵字 | 方向 | 說明 |
| --- | --- | --- |
| `left` | 水平 | 靠左對齊 |
| `center` | 水平 | 置中對齊 |
| `right` | 水平 | 靠右對齊 |
| `start` | 水平 | 靠語言的起始邊（由左至右語言等同 `left`） |
| `end` | 水平 | 靠語言的結束邊（由左至右語言等同 `right`） |
| `top` | 垂直 | 靠上對齊 |
| `horizon` | 垂直 | 垂直置中 |
| `bottom` | 垂直 | 靠下對齊 |

```typst
#align(center)[置中的一行字]

#align(right + bottom)[靠右下角對齊]
```

如果整份文件（或後面一大段內容）都要用同一種對齊方式，與其每段都包一次 `#align(...)[...]`，不如直接用 `#set align(...)` 一次設定，後面的內容就會沿用這個設定，不用再包：

```typst
#set align(center)

這一段會置中，後面沒有另外指定對齊方式的內容也是。
```

要注意的是，`align` 是區塊層級的設定，套用下去會直接把目前的段落中斷開來，不能拿來對齊段落裡的某幾個字[^4]。左右對齊、首段縮排這些屬於段落層級的細節設定，等到後面講 `par` 函式的文章再一起展開。

### 換行

Typst 原始碼裡的換行方式，跟畫面上實際呈現的結果不一定一樣：

| 寫法 | 效果 |
| --- | --- |
| 空一行 | 開新段落 |
| 單一個換行 | 被忽略，等同一個空格，不會產生視覺上的換行 |
| `\` 加空白 | 段落內強制換行，不開新段落 |
| `#linebreak()` | 效果跟 `\` 一樣，寫成函式的形式，可以額外加 `justify` 參數控制換行前是否要先做兩端對齊 |

```typst
這一行後面接反斜線，\
會強制換行，但還是同一段。

空一行則是開新的段落。
```

### 完整範例

把對齊跟換行整合成一份 `text-alignment.typ`：

```typst
#set text(font: ("Libertinus Serif", "PingFang TC"), size: 14pt)

= 對齊與換行範例

#align(center)[置中的一行字]

#align(right + bottom)[靠右下角對齊]

這一行後面接反斜線，\
會強制換行，但還是同一段。

空一行則是開新的段落。
```

用 `typst compile` 編譯後，結果如下：

<figure><img src="images/text-alignment-output.png" alt="對齊與換行範例輸出"><figcaption>對齊與換行範例輸出</figcaption></figure>

## 小結

這篇把 Typst 最基本的文字排版工具過了一輪：底線、刪除線、上劃線、螢光標記、上標下標、小型大寫這些裝飾語法，`text` 函式客製化字型、字級、顏色、粗細與樣式，最後用 `align` 決定內容擺在哪，用 `\`、`#linebreak()`、空行控制換不換行、開不開新段落。這些語法會反覆出現在後面幾乎每一篇文章裡，值得先練熟。下一篇要往結構走，處理清單跟連結這類更常用的標記語法！

我們下次見囉～

本篇程式碼：[day03-text-formatting](https://github.com/yueswater/typst-ironman-2026/tree/main/day03-text-formatting)

[^1]: Typst 預設字型（Libertinus Serif）對部分中文字（例如「黃」）沒有對應字符，底線、上劃線這類裝飾線也會跟著跑掉；不特別指定字型清單的話，畫面上會出現方框亂碼。把常用的系統中文字型（例如 PingFang TC）加進字型清單當 fallback，就能一次補齊缺字與裝飾線跑掉的問題。
[^2]: `sort` 是終端機常見的排序指令，把前面指令的輸出結果依照字母順序重新排過；`typst fonts` 本身輸出的順序不見得是字母排序，接上 `| sort` 只是方便閱讀跟對照，不接也不影響字型能不能用。
[^3]: 簡單分工：做網頁、螢幕上呈現的內容，通常用 HEX 或 RGB；文件要送印，才需要考慮 CMYK；想憑直覺微調顏色（例如同色系的深淺變化），HSL 會比較好操作。
[^4]: 如果在一句話中間包一小段文字用 `#align(center)[...]`，Typst 不會把那幾個字原地置中，而是先把段落切斷、另外開一個區塊把內容置中，前後文字仍然照原本的排版方式各自成段。
