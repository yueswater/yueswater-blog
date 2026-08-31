---
title: 佇列
date: '2026-08-26'
lang: zh-TW
permalink: dsa/queue/
categories: &id001
- 資料結構與演算法
- 佇列
tags: *id001
excerpt: 介紹佇列的定義與先進先出操作。
thumbnail: /images/covers/DSA_cover.png
mathjax: true
---

**佇列 (queue)** 的應用比[堆疊](../stack/index)更廣泛，也相較於堆疊稍微複雜一點。

!!! info "定義：佇列 (queue)"
    佇列是一種動態集合，其中元素的插入與刪除遵循**先進先出 (first-in-first-out, FIFO)** 的原則，每次刪除的元素，永遠是目前集合中最早被插入、且尚未被刪除的那一個。

    佇列支援兩種基本操作：

    - `enqueue(Q, x)`：將元素 $x$ 插入佇列 $Q$ 的**尾端 (tail)**
    - `dequeue(Q)`：刪除並回傳佇列 $Q$ **頭端 (head)** 的元素

## 基本操作

不同於堆疊，佇列的操作分別在頭尾兩端，新增元素從尾端放進去，要拿元素僅能從頭端拿走。

佇列的操作分為：將元素放到尾端的**入列 (enqueue)**、將頭端元素拿掉的**出列 (dequeue)**，以及查看頭端但不動它的**查佇列首 (front)**。

但比較需要注意的是，如果我們使用堆疊的方法處裡入/出列，會發生如@fig-queue-drift 的問題：

::: {#fig-queue-drift}
![佇列指標漂移示意圖](images/queue-drift.png)
:::

最後一步的 `tail` 跑到 6，已經超出陣列範圍，但佇列裡其實只有 3 個元素，前面還空著 2 格——空間沒用完卻已塞不下了。

因此通常我們會使用**環形佇列 (circular queue)** 的技巧，將指標繞一圈，在邏輯上形成一個環，重複利用。

### 入列

入列首先要檢查佇列是否已滿，並且執行以下操作：

- 若已滿：拒絕插入，可回傳/輸出失敗訊息
- 若未滿：將元素放進 `tail` 指到的那一格，再把 `tail` 往後移一格；若 `tail` 已經在最後一格，則繞回第一格

```plaintext
Enqueue(Q, x)
    if (tail[Q] mod length[Q]) + 1 = head[Q] then
        error "overflow"
    else
        Q[tail[Q]] = x
        if tail[Q] = length[Q] then
            tail[Q] = 1
        else
            tail[Q] = tail[Q] + 1
        end if
    end if
```

這裡的 `(tail[Q] mod length[Q]) + 1` 就是「`tail` 的下一格」，寫成 `mod` 是為了處理繞回開頭的情況。如果下一格剛好就是 `head`，代表再放就會撞上頭端，因此判定為已滿。

!!! tip "為什麼長度 $n$ 的陣列只能裝 $n-1$ 個元素？"
    注意上面的判定式：**空**是 `head[Q] = tail[Q]`，**滿**卻是`tail` 的下一格等於 `head`，也就是刻意留了一格不用。原因是這兩個狀態會撞在一起。假設真的把 $n$ 格全部塞滿的話，`tail` 從最後一格繞回開頭之後，剛好會停在 `head` 的位置，於是 `head[Q] = tail[Q]`——但這正是佇列為空的判定條件。同一組指標值同時代表空與滿，程式就再也分不出來了。

    因此環形佇列會犧牲一格當作分隔，讓 `head[Q] = tail[Q]` 唯一對應空這個狀態，長度 $n$ 的陣列實際可用容量是 $n-1$。若真的需要用滿 $n$ 格，就得額外維護一個 `size` 欄位記錄目前元素個數，改用 `size = 0` 判空、`size = length[Q]` 判滿，不再依賴指標關係。

### 出列

出列就是判斷是否為空：

- 若為空：拒絕出列，可回傳/輸出失敗訊息
- 若非空：取出 `head` 指到的元素，將 `head` 往後移一格（同樣會繞回開頭），回傳該元素

用虛擬碼的方式撰寫如下：

```plaintext
Dequeue(Q)
    if head[Q] = tail[Q] then
        error "underflow"
    else
        x = Q[head[Q]]
        if head[Q] = length[Q] then
            head[Q] = 1
        else
            head[Q] = head[Q] + 1
        end if
        return x
    end if
```

### 查佇列首

查佇列首則是一樣先判斷是否為空：

- 若為空：拒絕查看，可回傳/輸出失敗訊息
- 若非空：回傳頭端元素，但不將其移除

用虛擬碼的方式撰寫如下：

```plaintext
Front(Q)
    if head[Q] = tail[Q] then
        error "underflow"
    else
        return Q[head[Q]]
    end if
```

### 各項操作時間複雜度

`enqueue`、`dequeue`、`front` 三個操作都只碰 `head[Q]`、`tail[Q]` 這兩個指標，以及它們指到的那一格——不管是判斷、讀寫，還是移動指標（包含繞回開頭的 `mod` 運算），動作次數都是固定的，完全不需要因為佇列裡目前有幾個元素而多做事，所以都是 $O(1)$。

| 操作 | 時間複雜度 |
| --- | --- |
| `enqueue` | $O(1)$ |
| `dequeue` | $O(1)$ |
| `front` | $O(1)$ |
| 走訪（訪問所有元素） | $O(n)$ |

這裡要特別留意的是，環形佇列的 $O(1)$ 是**繞回開頭**換來的。如果不繞、改成每次 `dequeue` 就把後面的元素整批往前搬一格來補上空位，`head` 確實永遠會停在第一格，但每次出列都要搬動 $O(n)$ 個元素，佇列最核心的操作就從 $O(1)$ 掉到 $O(n)$ 了。

同堆疊一樣，走訪整個佇列一樣不算標準操作，佇列僅保證能碰到 `head`。如果想看過每一個元素，只能從 `head` 開始一路往後，沒有辦法跳著存取，每個元素都要碰一次，因此是 $O(n)$；用 `dequeue` 走訪還會把佇列本身清空，除非邊 `dequeue` 邊存到別的地方再 `enqueue` 回去。

## 佇列實作

### 使用陣列

```python
class ArrayQueue:
    def __init__(self, capacity: int):
        """初始化佇列"""
        self.capacity: int = capacity
        self._queue: list[int] = [0] * self.capacity
        self._head: int = 0
        self._tail: int = 0

    def is_empty(self) -> bool:
        """檢查佇列是否為空"""
        return self._head == self._tail

    def size(self) -> int:
        """回傳佇列長度"""
        return (self._tail - self._head) % self.capacity

    def _next(self, endpoint: int) -> int:
        """回傳某索引下一格"""
        return (endpoint + 1) % self.capacity

    def enqueue(self, x: int) -> None:
        """入列"""
        if self._next(self._tail) == self._head:
            raise IndexError("佇列已滿")
        self._queue[self._tail] = x
        self._tail = self._next(self._tail)

    def dequeue(self) -> int:
        """出列"""
        if self.is_empty():
            raise IndexError("佇列為空")
        x = self._queue[self._head]
        self._head = self._next(self._head)
        return x

    def front(self) -> int:
        """查看佇列首"""
        if self.is_empty():
            raise IndexError("佇列為空")
        return self._queue[self._head]

    def __repr__(self) -> str:
        """轉為字串"""
        result: list[str] = []
        curr_idx = self._head
        while curr_idx != self._tail:
            result.append(str(self._queue[curr_idx]))
            curr_idx = self._next(curr_idx)

        return " <- ".join(result)
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
class LinkedListQueue:
    def __init__(self):
        """初始化佇列"""
        self._head: ListNode | None = None
        self._tail: ListNode | None = None
        self._size: int = 0

    def is_empty(self) -> bool:
        """檢查佇列是否為空"""
        return not self._head

    def size(self) -> int:
        """回傳佇列長度"""
        return self._size 
    
    def enqueue(self, x: int) -> None:
        """入列"""
        node: ListNode = ListNode(x)
        if self.is_empty():
            self._head = node
            self._tail = node
        else:
            self._tail.next = node
            self._tail = node
        self._size += 1

    def dequeue(self) -> int:
        """出列"""
        if self.is_empty():
            raise IndexError("佇列為空")

        node = self._head
        self._head = self._head.next
        if self._head is None:
            self._tail = None

        self._size -= 1
        return node.data

    def front(self) -> int:
        """查佇列首"""
        if self.is_empty():
            raise IndexError("佇列為空")
        return self._head.data

    def __repr__(self) -> str:
        """轉為字串"""
        if self.is_empty():
            return ""

        result: list[str] = []
        curr = self._head

        while curr:
            result.append(str(curr.data))
            curr = curr.next

        return " <- ".join(result)
```

## 雙向佇列

前面實作的佇列限制得很死，佇列只能從尾端進、頭端出。這個限制換來的是 $O(1)$ 的操作，但也讓某些需求做不到——例如想反悔剛才放進去的元素，或是想從隊伍最後面插隊。

**雙向佇列 (double-ended queue, deque)** 放寬了這個限制：頭尾兩端都可以進、也都可以出，且四個操作的時間複雜度全部都是 $O(1)$。

!!! info "定義：雙向佇列 (deque)"
    雙向佇列是一種同時具備堆疊與佇列性質的動態集合，其兩端皆可執行插入與刪除操作。

放寬限制之後，它同時涵蓋了前面學過的兩種結構：只從尾端進、頭端出，它就是佇列；只從尾端進、尾端出，它就是堆疊。因此雙向佇列可以視為堆疊與佇列的一般化形式。

### 基本操作

兩端都能進出，因此操作數量是普通佇列的兩倍：

| 方法名 | 描述 | 時間複雜度 |
| --- | --- | --- |
| `push_first()` | 將元素新增至佇首 | $O(1)$ |
| `push_last()` | 將元素新增至佇尾 | $O(1)$ |
| `pop_first()` | 刪除佇首元素 | $O(1)$ |
| `pop_last()` | 刪除佇尾元素 | $O(1)$ |
| `peek_first()` | 訪問佇首元素 | $O(1)$ |
| `peek_last()` | 訪問佇尾元素 | $O(1)$ |

上面是通用的命名，實際在 Python 中會對應到 `collections` 裡 `deque` 的方法（以下 `d` 為一個 `deque` 物件）：

| 方法名 | `deque` | 本篇的佇列 |
| --- | --- | --- |
| `push_last()` | `d.append(x)` | `enqueue(x)` |
| `push_first()` | `d.appendleft(x)` | —— |
| `pop_first()` | `d.popleft()` | `dequeue()` |
| `pop_last()` | `d.pop()` | —— |
| `peek_first()` | `d[0]` | `front()` |
| `peek_last()` | `d[-1]` | —— |

最右欄空著的四格就是雙向佇列多出來的能力。只用 `push_last()` 與 `pop_first()` 就是普通佇列；只用 `push_last()` 與 `pop_last()`（兩個都在佇尾）就是堆疊——這也是為什麼一個 `deque` 就能同時扮演堆疊與佇列。

另外要注意，`deque` 雖然可以用索引存取中間的元素，但那是 $O(n)$：它不是陣列，越靠近中間就要走越多步。**需要頻繁隨機存取就別用 `deque` 而是 `list`。

### 使用陣列

```python
class ArrayDeque:
    def __init__(self, capacity: int):
        """初始化雙向佇列"""
        self.capacity: int = capacity
        self._deque: list[int] = [0] * self.capacity
        self._head: int = 0
        self._tail: int = 0
    
    def is_empty(self) -> bool:
        """檢查佇列是否為空"""
        return self._head == self._tail

    def size(self) -> int:
        """回傳佇列長度"""
        return (self._tail - self._head) % self.capacity

    def _next(self, endpoint: int) -> int:
        """回傳某索引下一格"""
        return (endpoint + 1) % self.capacity

    def _prev(self, endpoint: int) -> int:
        """回傳某索引前一格"""
        return (endpoint - 1) % self.capacity

    def push_last(self, x: int) -> None:
        """入列——尾端"""
        if self._next(self._tail) == self._head:
            raise IndexError("佇列已滿")
        self._deque[self._tail] = x
        self._tail = self._next(self._tail)

    def push_first(self, x: int) -> None:
        """入列——頭端"""
        if self._next(self._tail) == self._head:
            raise IndexError("佇列已滿")
        self._head = self._prev(self._head)
        self._deque[self._head] = x

    def pop_last(self) -> int:
        """出列——尾端"""
        if self.is_empty():
            raise IndexError("佇列為空")
        self._tail = self._prev(self._tail)
        x = self._deque[self._tail]
        return x

    def pop_first(self) -> int:
        """出列——頭端"""
        if self.is_empty():
            raise IndexError("佇列為空")
        x = self._deque[self._head]
        self._head = self._next(self._head)
        return x

    def peek_last(self) -> int:
        """查看佇列尾"""
        if self.is_empty():
            raise IndexError("佇列為空")
        return self._deque[self._prev(self._tail)]

    def peek_first(self) -> int:
        """查看佇列首"""
        if self.is_empty():
            raise IndexError("佇列為空")
        return self._deque[self._head]

    def __repr__(self) -> str:
        """轉為字串"""
        result: list[str] = []
        curr_idx = self._head
        while curr_idx != self._tail:
            result.append(str(self._deque[curr_idx]))
            curr_idx = self._next(curr_idx)

        return " <- ".join(result)
```

### 使用鏈結串列

首先定義雙向鏈結串列的節點：

```python
class DoublyListNode:
    def __init__(self, data: int):
        self.data: int = data
        self.prev: DoublyListNode | None = None
        self.next: DoublyListNode | None = None
```

與陣列實作雙向佇列的方式，以下用鏈結串列實作：

```python
class LinkedListDeque:
    def __init__(self):
        """初始化佇列"""
        self._head: DoublyListNode | None = None
        self._tail: DoublyListNode | None = None
        self._size: int = 0

    def is_empty(self) -> bool:
        """檢查佇列是否為空"""
        return not self._head

    def size(self) -> int:
        """回傳佇列長度"""
        return self._size

    def push_last(self, x: int) -> None:
        """入列——尾端"""
        node: DoublyListNode = DoublyListNode(x)
        if self.is_empty():
            self._head = node
            self._tail = node
        else:
            self._tail.next = node
            node.prev = self._tail
            self._tail = node
        self._size += 1

    def push_first(self, x: int) -> None:
        """入列——頭端"""
        node: DoublyListNode = DoublyListNode(x)
        if self.is_empty():
            self._head = node
            self._tail = node
        else:
            self._head.prev = node
            node.next = self._head
            self._head = node
        self._size += 1

    def pop_first(self) -> int:
        """出列——頭端"""
        if self.is_empty():
            raise IndexError("佇列為空")
        
        node = self._head
        self._head = self._head.next
        if self._head is None:
            self._tail = None
        else:
            self._head.prev = None

        self._size -= 1
        return node.data
    
    def pop_last(self) -> int:
        """出列——尾端"""
        if self.is_empty():
            raise IndexError("佇列為空")
        
        node = self._tail
        self._tail = self._tail.prev
        if self._tail is None:
            self._head = None
        else:
            self._tail.next = None

        self._size -= 1
        return node.data

    def peek_first(self) -> int:
        """查佇列首"""
        if self.is_empty():
            raise IndexError("佇列為空")
        return self._head.data

    def peek_last(self) -> int:
        """查佇列尾"""
        if self.is_empty():
            raise IndexError("佇列為空")
        return self._tail.data

    def __repr__(self) -> str:
        """轉為字串"""
        if self.is_empty():
            return ""

        result: list[str] = []
        curr = self._head

        while curr:
            result.append(str(curr.data))
            curr = curr.next

        return " <- ".join(result)
```

### 使用 `deque`

前面使用陣列與鏈結串列實作佇列，雖然可以了解底層邏輯，但實務上鮮少人這麼做，理由很簡單——太麻煩了！而如果偷懶直接拿 Python 的 `list` 當佇列用（`append` 進、`pop(0)` 出），效能又會非常慘：

| 元素個數 | `list.pop(0)` | `deque.popleft()` | 倍數 |
| --- | --- | --- | --- |
| 10,000 | 6.0 ms | 0.3 ms | 18x |
| 50,000 | 195.0 ms | 1.6 ms | 124x |
| 100,000 | 781.8 ms | 3.3 ms | 240x |
| 200,000 | 3894.0 ms | 8.0 ms | 488x |

慢的原因就是前面提到的：`pop(0)` 會把後面所有元素往前搬一格來補上空位，每次出列都是 $O(n)$。

通常來說，若要使用佇列，會利用 Python 內建函式庫的 `collections` 裡的 `deque`[^1]。

`deque` 位於 `collections` 模組中，並非內建型別，因此使用前必須先匯入：

```python
from collections import deque
```

`deque` 有三種常見的建立方式：

```python
d = deque()             # 建立空雙向佇列
d = deque([1, 2, 3])    # 從可迭代物件建立雙向佇列
d = deque(range(1, 5))  # 同上
```

接著是四個端點操作，與前面自己實作的方法逐一對應：

```python
d = deque([1, 2, 3])

d.append(4)       # 入列至佇尾
d.appendleft(0)   # 入列至佇首

d[0]              # 查看佇首
d[-1]             # 查看佇尾

d.pop()           # 從佇尾出列
d.popleft()       # 從佇首出列

len(d)            # 目前元素個數
```

命名規則相當好記：**沒有 `left` 的都在尾端**（`append`、`pop`），與 `list` 的用法一致；**加上 `left` 的則在頭端**（`appendleft`、`popleft`）。

因此把 `deque` 當作佇列使用時，進出只會用到 `append` 與 `popleft`：

```python
q = deque()
q.append(x)       # 入列
q.popleft()       # 出列
q[0]              # 查佇列首
```

當作堆疊使用則是 `append` 搭配 `pop`，兩者都在尾端，寫法與 `list` 完全相同。

若對空的 `deque` 執行出列或查看，會拋出 `IndexError`，與前面自己實作時 `raise IndexError` 的行為一致：

```plaintext
deque().pop()      # IndexError: pop from an empty deque
deque().popleft()  # IndexError: pop from an empty deque
deque()[0]         # IndexError: deque index out of range
```

實務上判斷是否為空，直接寫 `if not d:` 即可。

除了上述基本操作外，`deque` 建立時還可以指定 `maxlen`，也就是容量上限：

```python
d = deque(maxlen=3)
```

指定之後，一旦元素數量達到上限，再放入新元素時**另一端最舊的元素會自動被擠掉**，既不會拋出例外，也不需要自己處理：

```plaintext
append(1)  ->  deque([1])
append(2)  ->  deque([1, 2])
append(3)  ->  deque([1, 2, 3])
append(4)  ->  deque([2, 3, 4])   # 1 被擠掉
append(5)  ->  deque([3, 4, 5])   # 2 被擠掉
```

方向是相對的：從佇尾放入，擠掉的是佇首；從佇首放入（`appendleft`），擠掉的則是佇尾——永遠從另一端推出去。

!!! tip "滿了要報錯，還是丟掉最舊的？"
    可以很明顯地注意到 `deque` 的 `maxlen` 與前面自己實作的 `ArrayDeque` 行為並不相同：前者認為**滿了代表出事，應該讓呼叫端知道**，滿了會 `raise IndexError("佇列已滿")`；後者則是**只在乎最近的 $N$ 筆，舊的本來就該淘汰**。

    故 `maxlen` 的用途可理解為**僅保留最近 $N$ 筆資料**。常見的情境包括保留最近若干筆日誌、記錄使用者最近幾次操作以支援復原，以及滑動視窗——視窗往前移動時新元素進入、最舊的元素自動離開等。

若沒有 `maxlen`，同樣的效果得自己手動維護：

```python
d.append(x)
if len(d) > 3:
    d.popleft()
```

值得注意的是，`d.maxlen` 為唯讀屬性，建立之後無法更改；未指定時則代表沒有上限。

### 複雜度比較

接著我們使用以下表格來比較兩種實作佇列的差異：

| | 陣列佇列（`ArrayQueue`） | 鏈結串列佇列（`LinkedListQueue`） | `collections.deque` |
| --- | --- | --- | --- |
| 容量 | 建立時就固定，且實際可用只有 $n-1$ | 理論上無上限（僅受記憶體限制） | 預設無上限，可用 `maxlen` 指定 |
| 需要事先知道大小 | 是 | 否 | 否 |
| 額外空間開銷 | 一開始就配置整個陣列，沒裝滿的格子也一直佔著 | 每個節點多一個 `next` 指標的空間 | 指標開銷分攤到整個區塊上 |
| 記憶體局部性 | 好，元素連續存放，快取命中率高 | 差，節點散落在記憶體各處 | 好，區塊內部連續存放 |
| `enqueue` / `dequeue` / `front` | 均 $O(1)$ | 均 $O(1)$ | 均 $O(1)$ |

三個核心操作的時間複雜度完全一樣，差別在記憶體怎麼用。陣列版在建立時就把 $n$ 格配置好，之後不管實際裝幾個，那塊空間都佔著；鏈結串列版則是有幾個元素就配置幾個節點，但每個節點都要多存一個 `next` 指標。

同堆疊一樣，實際跑起來陣列版通常比較快。元素在記憶體裡連續排列，讀寫時記憶體局部性較好、快取命中率較高；鏈結串列版每個節點的位置是分散的，即使操作次數相同，實際存取速度仍會慢一截。

至於自己實作時怎麼選，關鍵在於**事先知不知道會有多少元素**：

- 上限明確、又在意速度（例如固定大小的緩衝區）：用陣列版
- 完全不知道會來多少（例如 BFS 的待處理節點）：用鏈結串列版，不必煩惱滿了要怎麼辦

不過實務上兩者都不必自己寫。`deque` 的內部結構是一串固定大小的區塊，再以雙向指標串接起來——區塊內部連續存放，因此保有陣列的記憶體局部性；區塊之間用指標相連，因此長度不受限制，而且指標的開銷是分攤在整個區塊上，而不是每個元素各付一次。換句話說，它同時拿下了上表前兩欄的優點，這也是為什麼標準函式庫值得直接拿來用。

雙向佇列的兩種實作也是同樣的取捨，但有兩個佇列沒有的差異：

| | 陣列雙向佇列（`ArrayDeque`） | 鏈結串列雙向佇列（`LinkedListDeque`） |
| --- | --- | --- |
| 容量 | 建立時就固定，且實際可用只有 $n-1$ | 理論上無上限（僅受記憶體限制） |
| 每個元素的額外空間 | 無 | 兩個指標（`prev` 與 `next`） |
| 佇尾的位置 | `_tail` 指向空格，取值需再算一次 `_prev()` | `_tail` 直接指向節點 |
| 六項操作 | 均 $O(1)$ | 均 $O(1)$ |

第一個差異是空間：佇列的鏈結串列版每個節點只多存一個 `next`，雙向佇列則要存 `prev` 與 `next` 兩個，額外開銷加倍。這是換取「兩端都能 $O(1)$ 進出」所付出的代價——單向串列刪除佇尾必須先找到前一個節點，只能從頭走一遍，是 $O(n)$。

第二個差異是取值的便利性。陣列版沿用佇列的慣例，`_head` 指向第一個元素、`_tail` 指向下一個空格，兩個指標的語意並不對稱，因此 `peek_last()` 要多算一次 `_prev(_tail)` 才拿得到佇尾；鏈結串列版的 `_tail` 直接就是最後一個節點，`peek_first()` 與 `peek_last()` 完全對稱。

這個不對稱也決定了陣列版四個進出操作的寫法，實作時特別容易寫反：

| 操作 | 指標指向 | 順序 |
| --- | --- | --- |
| `push_last` | `_tail` 為空格 | 先寫入，再移動指標 |
| `pop_last` | `_tail` 為空格 | 先移動指標，再讀取 |
| `push_first` | `_head` 為元素 | 先移動指標，再寫入 |
| `pop_first` | `_head` 為元素 | 先讀取，再移動指標 |

規則是：指標指向空格時「先寫後移、先移後讀」，指向元素時則完全相反。

鏈結串列版沒有這個問題，但有另一個要注意的地方：**雙向串列的每條連結都是成對的**，接上新節點時要同時設定兩個方向，移除節點時也要把兩邊都斷乾淨。撰寫頭端與尾端的鏡像版本時，`_head` 與 `_tail`、`prev` 與 `next` 必須**同時**對調，只換其中一組就會把串列接錯。

[^1]: 這裡的 `deque` 不是出列（那是 `dequeue`），請特別注意拼字，此處的 `deque` 代表**雙端佇列 (double-ended queue)**，亦即可以透過兩端進、出，四項操作全部為 $O(1)$。