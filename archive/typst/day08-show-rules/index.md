---
title: 30 天從零學會 Typst | Day 08：`#show` 規則
date: '2026-08-22'
lang: zh-TW
permalink: articles/typst/day08-show-rules/
categories: &id001
- Typst
- 排版系統
tags: *id001
excerpt: 介紹 `#show` 規則：基本語法、選擇器怎麼挑出目標、轉換式規則怎麼重新定義元素，以及跟 `#set` 的分工。
thumbnail: /images/covers/Typst_logo.png
---

[上一篇](/articles/typst/day07-set-rules/)介紹了 `#set` 規則，可以改變元素的樣式設定值，例如字級、顏色、邊界。但 `#set` 只能調整**既有**的參數，如果想改變的是元素本身的呈現方式，例如把每個標題自動加上一個裝飾符號、把清單項目換成完全不同的排版邏輯，`#set` 就做不到了。

這時候就輪到 `#show` 規則登場。`#show` 不只能像 `#set` 一樣套用樣式，還能接手一個元素該怎麼被畫出來，甚至整個改寫它的內容。這篇會從 `#show` 的基本語法開始，介紹選擇器怎麼挑出想處理的目標，再進到轉換式 `show` 規則怎麼重新定義一個元素，最後比較 `#show` 跟 `#set` 該怎麼分工。從**調整既有設定值**，走到**重新定義內容本身**。

## `#show` 規則基礎

`#show` 跟 `#set` 一樣，都是拿選擇器和規則來改變元素的呈現方式，差別在於 `#show` 能做的事情更廣：不只是調整既有的樣式參數，還可以直接接手一個元素要怎麼被畫出來。這節先從最基本的語法開始。

### 語法與運作方式

`#show` 規則的語法是 `#show 選擇器: 規則`。最簡單的選擇器就是元素函式，例如 `heading`，代表這條規則只影響標題，不會動到其他元素：

```typst
#show heading: set text(fill: rgb("#0074d9"))
```

這一行的意思是：**只要是 `heading` 元素，套用 `set text(fill: ...)` 這條規則**。跟 `#set` 一樣，`#show` 也是從宣告的那一行開始生效，一路套用到檔案結尾（或是被包在區塊裡的話，套用到區塊結束為止），在它之前出現的標題不受影響。

### 套用樣式與轉換內容

`#show` 規則的冒號後面可以放兩種東西：

第一種是 **`set` 規則**，也就是上面看到的寫法，效果是把一條 `#set` 規則限定在特定的元素上，而不是全域套用。

第二種是**函式**，寫法是 `it => 內容`：

```typst
#show heading: it => [
    ▸ #it.body
]
```

`it` 代表目前符合選擇器的那個元素本身，`it.body` 就是這個標題的內容。這種寫法可以完全重新決定這個元素要被畫成什麼樣子，不只是調整樣式參數，這也是為什麼 `#show` 比 `#set` 更有彈性。這種轉換式的寫法會在後面的章節深入介紹。

### 實際範例

<figure><img src="images/show-basics-demo-output.png" alt="`#show` 規則基礎範例"><figcaption>`#show` 規則基礎範例</figcaption></figure>

## 選擇器

上一節用的 `heading` 是最簡單的選擇器，但 `#show` 能接受的選擇器種類遠不止於此。這節介紹幾種常用的選擇器，讓規則可以更精準地挑出想處理的目標。

### 元素函式選擇器

最基本的選擇器就是元素函式本身，例如 `heading`、`list`、`strong`。只要是這個元素函式產生的內容，都會套用規則：

```typst
#show list: set text(fill: rgb("#0074d9"))
```

這條規則會讓所有無序清單的文字變成藍色，其他元素完全不受影響。

### 用 `where` 篩選特定條件

如果只想處理某個元素的一部分，可以在元素函式後面接 `.where(...)`，用欄位條件做篩選。例如只想改變第一層標題，不動到第二層：

```typst
#show heading.where(level: 1): set text(fill: rgb("#ff4136"))
```

這條規則只會套用在 `level` 為 1 的標題上，第二層、第三層標題都維持預設樣式。`where` 可以篩選的欄位，會依元素種類而不同，實際有哪些欄位可以用，要參考該元素在 Typst 文件上列出的參數。

### 文字與正規表達式選擇器

除了元素函式，`#show` 也可以直接選取符合特定文字的內容。最直接的是完全比對一段字串：

```typst
#show "Typst": text(fill: rgb("#2ecc40"), weight: "bold")[Typst]
```

這條規則會讓內文中每一個出現的 **Typst** 字樣變成綠色粗體。如果要比對的是一種模式而不是固定字串，可以改用 `regex`：

```typst
#show regex("\d+"): set text(fill: rgb("#b10dc9"))
```

這條規則會把內文裡所有的數字都變成紫色，不管數字是 `2026` 還是 `42`。

### 實際範例

<figure><img src="images/show-selector-demo-output.png" alt="`#show` 選擇器範例"><figcaption>`#show` 選擇器範例</figcaption></figure>

## 轉換式 `show` 規則

前面看到的轉換式寫法只加了一個符號，這節來看看它還能做到什麼程度。

### 用函式改寫元素內容

轉換式 `show` 規則收到的 `it`，其實是一個帶有多個欄位的元素，除了 `it.body` 之外，還可以讀到像 `it.level` 這種屬性：

```typst
#show heading: it => [
    #set text(fill: rgb("#0074d9"))
    第 #it.level 層：#it.body
]
```

這條規則會讓每個標題前面自動標出自己的層級，`it.level` 對第一層標題來說是 1，第二層就是 2，不用手動幫每個標題加註記。可以讀到哪些欄位，一樣要看該元素在 Typst 文件上列出的欄位說明。

### 搭配 `counter` 做客製化編號

轉換式規則也可以搭配 `counter`，做出比內建 `numbering` 參數更客製化的編號方式。例如想要標題編號用 **第 X 章** 這種格式，而不是單純的數字：

```typst
#set heading(numbering: none)

#show heading: it => block[
    #counter(heading).display()
    #it.body
]

#counter(heading).step()
= 第一章標題
```

這裡的重點是把 `heading` 內建的 `numbering` 關掉，改成手動用 `counter(heading).step()` 遞增，再用 `counter(heading).display()` 把目前的編號顯示出來，格式完全自己決定，不受限於 `numbering` 參數能表達的樣式。

### 實際範例

<figure><img src="images/show-transform-demo-output.png" alt="轉換式 `show` 規則範例"><figcaption>轉換式 `show` 規則範例</figcaption></figure>

## `#show` 與 `#set` 的差異與選擇

看完 `#show` 能做的事情之後，回頭比較一下 `#show` 跟 `#set` 該怎麼分工。

### 什麼時候用 `#set`，什麼時候用 `#show`

如果只是想調整一個元素**既有**的設定值，例如字級、顏色、邊界，用 `#set` 就足夠了，寫法也最簡單。但如果想做到下面幾件事，就需要 `#show`：

- 只想改變**某一種**元素的樣式，而不是全域套用（例如只想讓標題變色，不動到內文）
- 需要用 `where` 篩選出符合特定條件的元素（例如只改第一層標題）
- 想改變的是元素的**結構或內容本身**，不只是樣式參數（例如自動加上符號、自訂編號格式）

簡單說，`#set` 負責調整**設定值**，`#show` 負責決定**要不要套用、套用在哪、甚至要呈現成什麼樣子**。

### 兩者可以疊加使用

`#set` 跟 `#show` 不是二選一的關係，兩者可以同時作用在同一個元素上：

```typst
#set text(
    font: ("Libertinus Serif", "PingFang TC"),
    size: 11pt
)
#show heading: set text(fill: rgb("#0074d9"))
```

這裡 `#set text` 先設定了全域的字型和字級，`#show heading: set text(fill: ...)` 再針對標題額外加上藍色。兩條規則的效果會疊加：標題套用全域的字型和字級，同時套用專屬的藍色；內文則只受全域設定影響，跟第七天看到的多個 `#set` 疊加是同樣的邏輯。

### 實際範例

<figure><img src="images/show-vs-set-demo-output.png" alt="`#show` 與 `#set` 疊加範例"><figcaption>`#show` 與 `#set` 疊加範例</figcaption></figure>

## 小結

這篇介紹了 `#show` 規則：從最基本的 `#show 選擇器: 規則` 語法，到用元素函式、`where`、文字或正規表達式挑出想處理的目標，再到轉換式規則怎麼透過 `it` 拿到元素的內容和欄位，甚至搭配 `counter` 做出完全客製化的編號。最後也整理了 `#show` 跟 `#set` 該怎麼分工：一個負責調整設定值，一個負責決定內容要呈現成什麼樣子，兩者還可以疊加使用。

到這裡，Typst 排版最核心的兩個規則，`#set` 和 `#show`，都介紹完了。下一篇要開始進到圖片與圖表的處理，看看 Typst 怎麼安排圖片、加上標題說明，並且自動編號。

我們下次見囉～
