---
title: 雙指標
date: '2026-08-19'
lang: zh-TW
permalink: dsa/two-pointers/
categories: &id001
- 資料結構與演算法
- 雙指標
tags: *id001
excerpt: 介紹雙指標技巧——左右指標、快慢指標與平行指標。
thumbnail: /images/covers/DSA_cover.png
mathjax: true
---

在談雙指標之前，先來看一個例子：假設給定兩個**已排序 (sorted)** 的陣列，我們需要將其合併一個排序好的陣列。例如

```plaintext
list1 = [1, 3, 7]
list2 = [1, 2, 5]
```

合併後要變成

```plaintext
merged = [1, 1, 2, 3, 5, 7]
```

直覺的做法是直接將兩個陣列直接合併，然後用 `sorted` 函式排序：

```python
def merge(list1: list[int], list2: list[int]) -> list[int]:
    return sorted(list1 + list2)
```

雖然看起來很省事，但是會有兩個問題：

1. 完全沒有用到**已排序**的資訊
2. 時間複雜度是 $O((m + n)\log (m + n))$

而**雙指標 (two pointer)**的想法是：既然兩個陣列都已排序好，只要各放一個指標在最前面，每次比較兩個指標指到的值，把較小的值放進結果，指標往後挪動一格，就無需重新排序了！

## 雙指標

@citet[saad2017twopointers] 將雙指標定義為使用兩個互相制約的索引走訪資料，其中一個指標如何移動，可能會被另一個指標目前所在的位置限制住。

不過雙指標本身並不是一個特定的演算法，而是一種解決特定問題上很有效的通用想法，常見於**已排序陣列**、**正數的前綴和陣列**，以及**長度可變的滑動視窗**這類題型；每個指標各自最多在資料結構上移動 $O(n)$ 步，所以整體操作次數是 $O(n)$。

雙指標顧名思義，需要有兩個指標，而根據兩個指標在資料結構上的行為，又可以分為**左右指標 (left/right pointer)**、**快慢指標 (fast/slow pointer)**，以及**平行指標 (parallel pointer)**。

### 左右指標

給定兩個指標，左指標 `left` 與右指標 `right`，左指標從最左邊出發，右指標從最右邊出發，兩個指標**向中間靠攏**，直至**相遇**或**相交**為止。

而在過程（通常是迴圈）中，會需要依照題目所需條件，決定要如何移動指標，可以單移動左或是右指標，或是兩者均移動。

```plaintext
Algorithm 1 Two Pointers (Left/Right)
    procedure TwoPointerLeftRight(A)
        left = 1
        right = A.length
        while left < right do
            ▷ 執行任務
            ▷ 依條件決定如何移動指標
        end while
end procedure
```

::: {#fig-left-right-pointers}
![左右指標示意圖](images/left-right-pointers.png)
:::

常見使用情境與搭配的 LeetCode 題目所示：

| 使用情境 | LeetCode |
| --- | --- |
| 已排序資料找符合條件的組合 | [167](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/)、[15](https://leetcode.com/problems/3sum/)、[16](https://leetcode.com/problems/3sum-closest/) |
| 頭尾比對驗證對稱性 | [125](https://leetcode.com/problems/valid-palindrome/)、[344](https://leetcode.com/problems/reverse-string/) |
| 邊界間求極值 | [11](https://leetcode.com/problems/container-with-most-water/) |
| 比較頭尾大小，由後往前填入結果 | [977](https://leetcode.com/problems/squares-of-a-sorted-array/) |

### 快慢指標

給定兩個指標，一個快指標 `fast`，一個慢指標 `slow`，兩者步長不同，可以想像成兩個不同身高的人，從同個起點出發一同向前。

快慢指標停下的條件很特殊：快指標走不動了。假設走訪的資料結構總長度為 $L$，並且需要走 $k$ 輪，且快指標較慢指標快 $n$ 倍，則當快指標走到盡頭時，可得 $nk = L$，求解即可得到

$$
k^{*} = \dfrac{L}{n}
$$

而 $k^{*}$ 正好是慢指標走的距離，也就是走到 $1 / n$ 處。

```plaintext
Algorithm 2 Two Pointers (Fast/Slow)
    procedure TwoPointerFastSlow(head)
        slow = head
        fast = head
        while fast ≠ NIL and fast.next ≠ NIL do
            ▷ 執行任務
            slow = slow.next
            fast = fast.next.next
        end while
end procedure
```

::: {#fig-fast-slow-pointers}
![快慢指標示意圖](images/fast-slow-pointers.png)
:::

常見使用情境與搭配的 LeetCode 題目所示：

| 使用情境 | LeetCode |
| --- | --- |
| 一次走訪找出中點 | [876](https://leetcode.com/problems/middle-of-the-linked-list/) |
| 偵測是否存在循環 | [141](https://leetcode.com/problems/linked-list-cycle/)、[142](https://leetcode.com/problems/linked-list-cycle-ii/)、[202](https://leetcode.com/problems/happy-number/) |
| 陣列上原地篩選去重 | [26](https://leetcode.com/problems/remove-duplicates-from-sorted-array/)、[283](https://leetcode.com/problems/move-zeroes/) |

### 平行指標

給定兩個指標 `i`、`j`，分別走訪**兩個不同**的資料結構（例如兩個陣列、兩條鏈結串列），兩者皆從最前面出發、同方向前進，每一步依照題目所需條件，比較兩邊目前指到的值，決定該移動哪一個指標，或是兩者同時移動。

跟左右指標不同的地方在於：左右指標是同一個結構上的兩個指標互相靠攏；平行指標則是**兩個結構各自的指標，彼此獨立前進**。

```plaintext
Algorithm 3 Two Pointers (Parallel)
    procedure TwoPointerParallel(A, B)
        i = 1
        j = 1
        while i ≤ A.length and j ≤ B.length do
            ▷ 執行任務
            ▷ 依條件決定移動 i、j，或兩者皆移動
        end while
end procedure
```

常見使用情境與搭配的 LeetCode 題目所示：

| 使用情境 | LeetCode |
| --- | --- |
| 兩個已排序來源同向合併 | [21](https://leetcode.com/problems/merge-two-sorted-lists/)、[88](https://leetcode.com/problems/merge-sorted-array/) |
| 找出兩個集合的交集 | [350](https://leetcode.com/problems/intersection-of-two-arrays-ii/)、[986](https://leetcode.com/problems/interval-list-intersections/) |

## 實作

### [LeetCode 167：兩數之和 II - 輸入已排序陣列](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/)

::: {.problem}
給定一個 1-indexed（索引從 1 開始）的整數陣列 `numbers`，且該陣列已經依非遞減順序排序，再給定一個整數 `target`。找出陣列中兩個數字，使其相加等於 `target`，並回傳這兩個數字各自的索引（以 `1`-indexed 表示，`index1 < index2`）。每組輸入保證恰好存在一組解，且同一個元素不能重複使用兩次。

#### 範例 1

```plaintext
輸入：numbers = [2,7,11,15], target = 9
輸出：[1,2]
```

#### 範例 2

```plaintext
輸入：numbers = [2,3,4], target = 6
輸出：[1,3]
```

#### 範例 3

```plaintext
輸入：numbers = [-1,0], target = -1
輸出：[1,2]
```
:::

直覺的做法是利用兩層迴圈，第一層迴圈走訪陣列每個數字，第二層走訪當前數字後的所有數字：

```python
class Solution:
    def twoSum(self, numbers: list[int], target: int) -> list[int]:
        N = len(numbers)

        for i in range(N):
            for j in range(i + 1, N):
                if numbers[i] + numbers[j] == target:
                    return [i + 1, j + 1]
```

但是如果直接跑，會碰到超時的問題，理由很簡單：上述演算法的時間複雜度是 $O(n^{2})$。假設給定一個陣列裡面有超多數字，電腦會跑到天荒地老。

注意到題目已經給定陣列為**已排序**，因此我們可以使用左右指標，從兩端靠近，加總並與目標值比較：

- 若**太小**：說明左指標需要右移，換大一點的數字
- 若**太大**：說明右指標需要左移，換小一點的數字

```python
class Solution:
    def twoSum(self, numbers: list[int], target: int) -> list[int]:
        left, right = 0, len(numbers) - 1

        while left < right:
            tmp_sum = numbers[left] + numbers[right]
            if tmp_sum < target:    # 太小
                left += 1           # 左指標右移
            elif tmp_sum > target:  # 太大
                right -= 1          # 右指標左移
            else:
                return [left + 1, right + 1]
```

### [LeetCode 141：環狀鏈結串列](https://leetcode.com/problems/linked-list-cycle/)

::: {.problem}
給定一條鏈結串列的頭節點 `head`，判斷這條串列中是否存在環——也就是從某個節點出發，沿著 `next` 指標不斷往下走，最終能不能再次回到同一個節點。若存在環回傳 `true`，否則回傳 `false`。

#### 範例 1

```plaintext
輸入：head = [3,2,0,-4], pos = 1
輸出：true
```

#### 範例 2

```plaintext
輸入：head = [1,2], pos = 0
輸出：true
```

#### 範例 3

```plaintext
輸入：head = [1], pos = -1
輸出：false
```
:::

這題看似很複雜，其實可以想像成龜兔賽跑——兔子跑得比較快，烏龜比較慢，如果跑完一圈之後兔子還可以遇到烏龜，就表示他們陷入迴圈了，此時串列就有環了！因此這種方法又被稱為[**龜兔賽跑算法 (tortoise and hare algorithm)**](https://zh.wikipedia.org/zh-tw/Floyd判圈算法)。

我們可以設定快指標（兔子）比慢指標（烏龜）多走一步，然後判斷是否相遇：

```python
class Solution:
    def hasCycle(self, head: ListNode | None) -> bool:
        fast, slow = head, head     # 同時出發

        while fast is not None and fast.next is not None:
            fast = fast.next.next   # 快指標多走一步
            slow = slow.next        # 慢指標僅走一步
            if slow is fast:        # 判斷是否相遇
                return True
        return False
```

此時時間複雜度為 $O(n)$。

### [LeetCode 21：合併兩個已排序的鏈結串列](https://leetcode.com/problems/merge-two-sorted-lists/)

::: {.problem}
給定兩條各自已經排序好的鏈結串列 `list1`、`list2`，將兩者合併成一條新的、依然保持排序的鏈結串列。要求直接重新接合兩條串列既有的節點，而不是另外配置新的節點，最後回傳合併後串列的頭節點。

#### 範例 1

```plaintext
輸入：list1 = [1,2,4], list2 = [1,3,4]
輸出：[1,1,2,3,4,4]
```

#### 範例 2

```plaintext
輸入：list1 = [], list2 = []
輸出：[]
```

#### 範例 3

```plaintext
輸入：list1 = [], list2 = [0]
輸出：[0]
```
:::

如同前述所提的，我們必須使用題目給定的條件：**已排序**。雖然這題是鏈結串列，但邏輯仍可借鑑前述的概念。

這題用的是**平行指標**——兩個串列從頭開始比較，若其中一個節點的值較小，則將其接到結果串列後面，然後往前移動。

迴圈停止的條件是兩個串列其中之一走到底了，`while` 則需要將其反過來（利用 De Morgan's Law），也就是兩者都還沒到底。

不過我們最後需要回傳節點，可是又沒有地方可以讓我們存節點，這時候就是**Dummy 節點**派上用場的時候了！設定 `curr` 為 Dummy 節點，符合條件的節點就接在 `curr` 後面，並將 `curr` 往後挪一格，迴圈最後回傳 `dummy.next` 即可。

另一個值得注意的是：我們無法確定兩個串列哪個長度較長，因此如果其中一個先走到底了，迴圈就會結束，剩下的串列因為是**已排序**的，因此直接接在 `curr` 後面即可。

```python
class Solution:
    def mergeTwoLists(self, list1: ListNode | None, list2: ListNode | None) -> ListNode | None:
        dummy = ListNode(0)
        curr = dummy

        while list1 is not None and list2 is not None:
            if list1.val <= list2.val:
                curr.next = list1
                list1 = list1.next
            else:
                curr.next = list2
                list2 = list2.next
            curr = curr.next

        curr.next = list1 or list2
        return dummy.next
```

## 參考文獻

[references]