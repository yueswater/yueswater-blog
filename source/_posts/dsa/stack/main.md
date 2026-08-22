---
title: 堆疊
date: '2026-08-22'
lang: zh-TW
permalink: dsa/stack/
categories: &id001
- 資料結構與演算法
- 堆疊
tags: *id001
excerpt: 介紹堆疊的定義與後進先出操作。
thumbnail: /images/covers/DSA_cover.png
mathjax: true
---

**堆疊 (stack)** 在電腦科學領域中是一個非常常見的資料結構，舉凡平時的 `Ctrl + Z`、瀏覽器的上一頁、括號對應，甚至是程式中的函式呼叫，都是堆疊的應用。

!!! info "定義：堆疊 (stack)"
    堆疊是一種**動態集合 (dynamic set)**，其中元素的插入與刪除遵循**後進先出 (last-in-first-out, LIFO)** 的原則：每次刪除的元素，永遠是目前集合中最晚被插入、且尚未被刪除的那一個。

    堆疊支援兩種基本操作：

    - `push(S, x)`：將元素 $x$ 插入堆疊 $S$ 的**頂端 (top)**
    - `pop(S)`：刪除並回傳堆疊 $S$ 頂端的元素

    若對空堆疊呼叫 `pop`，則會發生**下溢 (underflow)**；若插入操作使超出堆疊配置的最大容量，則發生**上溢 (overflow)**[^1]。以陣列實作時，`push` 與 `pop` 兩個操作皆可在 $O(1)$ 時間內完成。

## 基本操作

### 入堆疊

入堆疊首先要檢查堆疊是否已滿，並且執行以下操作：

- 若已滿：拒絕插入，可回傳/輸出失敗訊息
- 若未滿：將元素加入堆疊頂堆，回傳更新後的堆疊

```plaintext
Push(S, x)
    if top[S] = length[S] then
        error "overflow"
    else
        top[S] = top[S] + 1
        S[top[S]] = x
    end if
```

### 出堆疊

出堆疊就是判斷是否為空：

- 若為空：拒絕出堆疊，可回傳/輸出失敗訊息
- 若非空：將元素從堆疊頂移除，回傳該元素

用虛擬碼的方式撰寫如下：

```plaintext
Pop(S)
    if top[S] = 0 then
        error "underflow"
    else
        x = S[top[S]]
        top[S] = top[S] - 1
        return x
    end if
```

### 查看堆疊頂

查看堆疊頂則是一樣先判斷是否為空：

- 若為空：拒絕查看，可回傳/輸出失敗訊息
- 若非空：回傳堆疊頂元素，但不將其移除

用虛擬碼的方式撰寫如下：

```plaintext
Top(S)
    if top[S] = 0 then
        error "underflow"
    else
        return S[top[S]]
    end if
```

### 各項操作時間複雜度

`push`、`pop`、`top` 三個操作都只碰 `top[S]` 這個指標本身，以及它指到的那一格 `S[top[S]]`——不管是判斷、讀寫還是移動指標，動作次數都是固定的，完全不需要因為堆疊裡目前有幾個元素而多做事，所以都是 $O(1)$。

| 操作 | 時間複雜度 |
| --- | --- |
| `push` | $O(1)$ |
| `pop` | $O(1)$ |
| `top` | $O(1)$ |
| 走訪（訪問所有元素） | $O(n)$ |

不過走訪整個堆疊不算標準操作，堆疊僅保證能碰到 `top`。如果想看過每一個元素，只能從 `top` 開始一路往下，沒有辦法跳著存取，每個元素都要碰一次，因此是 $O(n)$；用 `pop` 走訪還會把堆疊本身清空，除非邊 `pop` 邊存到別的地方再 `push` 回去。

## 堆疊實作

### 使用陣列

```python
class ArrayStack:
    def __init__(self):
        """初始化堆疊"""
        self._stack: list[int] = []
    
    def is_empty(self) -> bool:
        """檢查堆疊是否為空"""
        return not self._stack

    def size(self) -> int:
        """回傳堆疊長度"""
        return len(self._stack)
    
    def push(self, x: int) -> None:
        """入堆疊"""
        self._stack.append(x)

    def pop(self) -> int:
        """出堆疊"""
        if self.is_empty():
            raise IndexError("堆疊為空")
        x: int = self._stack.pop()
        return x

    def top(self) -> int:
        """查看堆疊頂元素"""
        if self.is_empty():
            raise IndexError("堆疊為空")
        return self._stack[-1]

    def __repr__(self) -> str:
        """轉為字串"""
        return " <- ".join([str(x) for x in self._stack])
```

### 使用鏈結串列

首先定義節點：

```python
class ListNode:
    def __init__(self, data: int):
        self.data: int = data
        self.next: ListNode | None = None
```

接著開始實作：

```python
class LinkedListStack:
    def __init__(self):
        self._top: ListNode | None = None
        self._size: int = 0

    def is_empty(self) -> bool:
        """檢查堆疊是否為空"""
        return not self._top

    def size(self) -> int:
        """回傳堆疊長度"""
        return self._size

    def push(self, x: int) -> None:
        """入堆疊"""
        node: ListNode = ListNode(x)
        node.next = self._top
        self._top = node
        self._size += 1

    def pop(self) -> int:
        """出堆疊"""
        if self.is_empty():
            raise IndexError("堆疊為空")
        node = self._top
        self._top = node.next
        self._size -= 1
        return node.data

    def top(self) -> int:
        """查看堆疊頂"""
        if self.is_empty():
            raise IndexError("堆疊為空")
        return self._top.data

    def __repr__(self) -> str:
        """轉為字串"""
        if self.is_empty():
            return ""

        result: list[int] = []
        curr = self._top

        while curr:
            result.append(curr.data)
            curr = curr.next

        return " <- ".join([str(x) for x in result[::-1]])
```

### 複雜度比較

接著我們使用以下表格來比較兩種實作堆疊的時間複雜度：

| | 陣列堆疊（`ArrayStack`） | 鏈結串列堆疊（`LinkedListStack`） |
| --- | --- | --- |
| 容量 | 受限於 Python `list` 動態擴容機制 | 理論上無上限（僅受記憶體限制） |
| 額外空間開銷 | 幾乎沒有，元素緊密排列 | 每個節點多一個 `next` 指標的空間 |
| 記憶體局部性（locality） | 好，元素連續存放，快取命中率高 | 差，節點散落在記憶體各處 |
| `push` / `pop` / `top` | 均 $O(1)$ | 均 $O(1)$ |

三個核心操作的時間複雜度看起來一樣，但實際跑起來陣列版通常比較快，因為元素在記憶體裡是連續排列的，讀寫時**記憶體局部性 (memory locality)**[^2] 較好、快取命中率較高；鏈結串列版每個節點在記憶體裡的位置是分散的，即使操作次數相同，實際存取速度仍會慢一截。這也是為什麼多數語言的標準函式庫（如 Python 的 `list.append`/`list.pop`）都是用陣列實作 Stack——鏈結串列版更多是拿來練習指標操作、理解底層原理用的。

## 實作

### [LeetCode 20：有效的括號](https://leetcode.com/problems/valid-parentheses/)

::: {.problem}
給定一個只包含 `(`、`)`、`{`、`}`、`[`、`]` 的字串 `s`，判斷字串是否有效。有效的括號字串必須滿足：左括號必須用相同類型的右括號閉合，且左括號必須以正確的順序閉合。

#### 範例 1

```plaintext
輸入：s = "()"
輸出：true
```

#### 範例 2

```plaintext
輸入：s = "()[]{}"
輸出：true
```

#### 範例 3

```plaintext
輸入：s = "(]"
輸出：false
```
:::

左括號一律直接推入堆疊；碰到右括號時，若堆疊已空、或彈出的堆疊頂端不是對應的左括號，代表配對失敗。掃完整個字串後，若堆疊仍有剩餘的左括號沒被消掉，同樣代表無效：

```python
class Solution:
    def isValid(self, s: str) -> bool:
        if len(s) % 2 == 1:
            return False

        pairs = {
            ')': '(',
            '}': '{',
            ']': '['
        }
        stack = []

        for ch in s:
            if ch in pairs:
                if not stack or stack.pop() != pairs[ch]:
                    return False
            else:
                stack.append(ch)

        return not stack
```

### [LeetCode 155：最小堆疊](https://leetcode.com/problems/min-stack/)

::: {.problem}
設計一個支援 `push`、`pop`、`top` 操作，並能在常數時間內取得堆疊中最小元素的堆疊。實作 `MinStack` 類別：

- `MinStack()` 初始化堆疊物件
- `void push(int val)` 將元素 `val` 推入堆疊
- `void pop()` 移除堆疊頂端的元素
- `int top()` 取得堆疊頂端的元素
- `int getMin()` 取得堆疊中的最小元素

#### 範例

```plaintext
輸入：
["MinStack","push","push","push","getMin","pop","top","getMin"]
[[],[-2],[0],[-3],[],[],[],[]]
輸出：
[null,null,null,null,-3,null,0,-2]
```
:::

如果使用單一變數（例如 `min`）沒辦法追蹤最小值——一旦某個元素被 `pop` 掉，沒有辦法回溯到它被加入前的最小值是多少。解法是額外建立一個 `min_stack`，跟主堆疊同步 `push`、同步 `pop`：`min_stack` 的每一層都存著**到那一層為止的最小值**，這樣 `pop` 掉最上層後，底下那層本來就已經記好了正確的最小值，不需要重新計算：

```python
class MinStack:
    def __init__(self):
        self._stack = []
        self._min_stack = [float('inf')]

    def push(self, value: int) -> None:
        self._stack.append(value)
        self._min_stack.append(min(value, self._min_stack[-1]))

    def pop(self) -> None:
        self._stack.pop()
        self._min_stack.pop()

    def top(self) -> int:
        return self._stack[-1]

    def getMin(self) -> int:
        return self._min_stack[-1]
```

### [LeetCode 150：逆波蘭表示法求值](https://leetcode.com/problems/evaluate-reverse-polish-notation/)

::: {.problem}
給定一個字串陣列 `tokens`，代表以逆波蘭表示法（後序表示法）表示的算術運算式，計算該運算式的值。有效的運算子有 `+`、`-`、`*`、`/`，每個運算元可以是整數或另一個運算式，除法皆為向零取整。

#### 範例 1

```plaintext
輸入：tokens = ["2","1","+","3","*"]
輸出：9
解釋：((2 + 1) * 3) = 9
```

#### 範例 2

```plaintext
輸入：tokens = ["4","13","5","/","+"]
輸出：6
解釋：(4 + (13 / 5)) = 6
```
:::

從頭開始掃描 `tokens`，遇到數字就 `push`，遇到運算子，就從堆疊 `pop` 出最近的兩個運算元（後 `pop` 出來的是左運算元 `a`，先 `pop` 出來的是右運算元 `b`），算完把結果 `push` 回去。掃完後堆疊裡只會剩下一個元素，就是答案。

```python
class Solution:
    OPS = {
        '+': lambda a, b: a + b,
        '-': lambda a, b: a - b,
        '*': lambda a, b: a * b,
        '/': lambda a, b: int(a / b),
    }

    def evalRPN(self, tokens: List[str]) -> int:
        stack: list[int] = []

        for token in tokens:
            if token in self.OPS:
                b = stack.pop()
                a = stack.pop()
                stack.append(self.OPS[token](a, b))
            else:
                stack.append(int(token))

        return stack[-1]
```

要特別注意的是題目要求除法**向零取整**，跟 Python `//` 的**向下取整**在運算元正負號不同時會給出不同結果（例如 `7 // -2` 是 `-4`，但向零取整應該是 `-3`），因此除法要改用 `a / b` 算出浮點數後再用 `int()` 轉型，才符合題目要求。

[^1]: 這個詞其實跟記憶體配置的實際畫面有關。早期作業系統裡，堆疊與堆積 (heap) 通常共用同一塊記憶體區域，但成長方向相反：堆積由低位址往高位址長，堆疊則由高位址往低位址長，兩者相對而行。只要遞迴太深、或區域變數配置得太大，堆疊指標就會一路往下衝，直到撞上堆積的邊界——這個**衝出邊界**的畫面，就是 overflow 這個詞的由來。知名問答網站 <a href="https://stackoverflow.com/"><img src="https://upload.wikimedia.org/wikipedia/commons/0/02/Stack_Overflow_logo.svg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original" alt="Stack Overflow" style="display:inline-block; height:1em; vertical-align:middle; margin:0;"></a> 用這個詞當站名，也是工程師才懂的雙關：一邊是**程式炸掉的經典錯誤**，一邊是滿滿的技術問答堆在上面。

[^2]: CPU 讀取記憶體時，會一次把一整塊搬進速度快得多的快取，而不是只讀單一個值。陣列的元素緊挨在一起，讀一個很可能順便把鄰居也帶進快取；鏈結串列的節點各自散落，幾乎每次都要重新跑一趟主記憶體，這種情況稱為**快取缺失 (cache miss)**。