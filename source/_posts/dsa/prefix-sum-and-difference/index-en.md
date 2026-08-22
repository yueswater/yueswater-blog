---
title: Prefix Sum and Difference Array
date: '2026-08-21'
lang: en
permalink: dsa/prefix-sum-and-difference-en/
categories: &id001
- Data Structures & Algorithms
- Prefix Sum
- Difference Array
tags: *id001
excerpt: An introduction to prefix sums and difference arrays.
thumbnail: /images/covers/DSA_cover.png
mathjax: true
---

**Ranges** show up constantly in array problems -- querying the sum of a segment, updating a segment. If every operation re-scans the range from scratch, the cost stacks up linearly with the number of operations, easily going from $O(n)$ to $O(n^2)$ or worse.

**Prefix sum** and **difference array** exist to solve exactly this: spend $O(n)$ once up front, and trade away the cost of every operation that follows -- querying a range sum drops to $O(1)$, updating a range also drops to $O(1)$. It's one of the most basic **trade space for time** techniques -- roughly speaking, seeing **many repeated range-sum queries** or **many repeated range updates** should immediately bring these two to mind.

## Prefix Sum

Start with a problem (see [LeetCode 303](https://leetcode.com/problems/range-sum-query-immutable/)): given an integer array, and a series of queries, each query is a pair `[l, r]`, and you need to return the sum of `nums[l]` through `nums[r]` (inclusive). For example:

```plaintext
nums = [1, 3, 5, 7, 9, 11]
```

Example queries:

- `query(1, 3)`: `3 + 5 + 7 = 15`
- `query(0, 5)`: `1 + 3 + 5 + 7 + 9 + 11 = 36`
- `query(2, 2)`: `5 = 5`

The obvious approach uses Python's **slicing**:

```python
class NumArray:

    def __init__(self, nums: List[int]):
        self.nums = nums

    def sumRange(self, left: int, right: int) -> int:
        return sum(self.nums[left:right + 1])
```

There's a problem though: if `sumRange` gets called $q$ times during judging -- fine if $q$ is small, but the problem's constraints already allow up to $10^{4}$ calls -- the time complexity gets pulled up to $O(n \times q)$, which very likely times out.

Break the problem down: since we already know queries will keep coming in over ranges `[l, r]`, why not precompute the sum of the first `i` elements up front and store it in an array? The running total of the first `i` elements becomes:

```plaintext
prefix = [0, 1, 4, 9, 16, 25, 36]
```

Say we want `query(1, 3)`, and we already know the answer is `15` -- this value comes from `16 - 1`, i.e. `prefix[4] - prefix[1]`. Writing out the general form of `query(l, r)`:

```plaintext
query(l, r) = prefix[r + 1] - prefix[l]
```

Proof:

!!!- quote "Proof"
    Let the original `nums` be $a$, and `prefix` be $p$. First write out the two `prefix` expressions:

    $$
    p_{r + 1} = \sum_{k = 0}^{r} a_{k}, \qquad p_{\ell} = \sum_{k = 0}^{\ell - 1} a_{k}
    $$

    Subtracting the two gives:

    $$
    \begin{aligned}
        p_{r + 1} - p_{\ell} &= \sum_{k = 0}^{r} a_{k} - \sum_{k = 0}^{\ell - 1} a_{k}\\
        &= \left(\sum_{k = 0}^{\ell - 1} a_{k} + \sum_{k = \ell}^{r} a_{k}\right) - \sum_{k = 0}^{\ell - 1} a_{k}\\
        &= \sum_{k = \ell}^{r} a_{k}
    \end{aligned}
    $$

    Which is exactly `query(l, r)`.

    <p style="text-align:right;">$\square$</p>

Written as a general algorithm:

```plaintext
BuildPrefixSum(A)
    prefix[0] = 0
    for i = 1 to A.length do
        prefix[i] = prefix[i - 1] + A[i - 1]
    end for
    return prefix
```

```plaintext
RangeSum(prefix, l, r)
    return prefix[r + 1] - prefix[l]
```

`Algorithm 1` builds the table in $O(n)$, `Algorithm 2` answers each query in $O(1)$ -- together they make up the complete prefix-sum playbook.

Implementation:

```python
class NumArray:
    def __init__(self, nums: List[int]):
        n = len(nums)
        self.prefix = [0] * (n + 1)
        for i, num in enumerate(nums):
            self.prefix[i + 1] = self.prefix[i] + num

    def sumRange(self, left: int, right: int) -> int:
        return self.prefix[right + 1] - self.prefix[left]
```

## Suffix Sum

Prefix sum handles "the sum from the start up to some position"; **suffix sum** flips it around -- the sum from some position to the end of the array. Same pattern, opposite direction.

Suffix sum rarely shows up alone -- it's usually paired with prefix sum. A classic example: find a position (not counting itself) where the sums on either side are equal, i.e. find the **pivot**.

Problem (see [LeetCode 724](https://leetcode.com/problems/find-pivot-index/)): given an integer array, find an index `i` such that the sum of `nums[0]` through `nums[i - 1]` equals the sum of `nums[i + 1]` through the end. Return `-1` if no such index exists.

Brute-force approach:

```python
class Solution:
    def pivotIndex(self, nums: List[int]) -> int:
        for i in range(len(nums)):
            if sum(nums[:i]) == sum(nums[i + 1:]):
                return i
        return -1
```

Two `sum()` calls per iteration push the time complexity to $O(n^{2})$, easy to time out.

Since we're looking for a pivot, prefix sum and suffix sum become the natural fit: build two arrays -- one accumulating from the front, one from the back -- then scan through once and return the first index where the two accumulated values match. Implementation:

```python
class Solution:
    def pivotIndex(self, nums: List[int]) -> int:
        n = len(nums)
        prefix = [0] * (n + 1)
        suffix = [0] * (n + 1)

        for i, num in enumerate(nums):
            prefix[i + 1] = prefix[i] + num
        for i in range(n - 1, -1, -1):
            suffix[i] = suffix[i + 1] + nums[i]

        for i in range(n):
            if prefix[i] == suffix[i + 1]:
                return i
        return -1
```

## Difference Array

Prefix sum handles **many queries**; a **difference array** handles the opposite situation: the same array gets **many range updates** -- adding `v` to every element in `[l, r]` -- and you only need the final result once all updates are done.

Same approach: look at the problem first. Given the following integer array:

```plaintext
nums = [0, 0, 0, 0, 0]
```

Apply these updates in order:

- `update(0, 2, 5)`: add 5 to indices `0` through `2` → `[5, 5, 5, 0, 0]`
- `update(1, 3, 3)`: add 3 to indices `1` through `3` → `[5, 8, 8, 3, 0]`
- `update(2, 4, 2)`: add 2 to indices `2` through `4` → `[5, 8, 10, 5, 2]`

Final result: `[5, 8, 10, 5, 2]`.

Same as before, start with the obvious approach:

```python
class NumArray:
    def __init__(self, nums: list[int]):
        self.nums = nums

    def update(self, left: int, right: int, value: int) -> list[int]:
        for i in range(left, right + 1):
            self.nums[i] += value
        return self.nums
```

Each update loops over `r - l + 1` elements, $O(n)$ in the worst case; `m` updates cost $O(n \times m)$ total.

A difference array is really just an extension of prefix sum -- only `left` and `right + 1` need to change:

!!!- quote "Proof"
    Let the original array be $a$. After one `update(l, r, v)`, the new array $a^{\prime}$ is:

    $$
    a^{\prime}_{i} =
    \begin{cases}
        a_{i} + v, & \ell \le i \le r \\
        a_{i}, & \text{otherwise}
    \end{cases}
    $$

    Define the **difference array** of some array $c$ as $d\_{i} = c\_{i} - c\_{i-1}$ (with $c\_{-1} = 0$ by convention). This is exactly the inverse of prefix sum -- $c$ can be recovered from $d$ by taking a prefix sum:

    $$
        c_{i} = \sum_{k=0}^{i} d_{k}
    $$

    Now check which positions change in the difference array as $a$ becomes $a^{\prime}$, i.e. as $d$ becomes $d^{\prime}$:

    | Position | $a^{\prime}\_{i}$ | $a^{\prime}\_{i-1}$ | Result |
    | --- | --- | --- | --- |
    | $i < \ell$ | $a\_{i}$ (unaffected) | $a\_{i-1}$ (unaffected) | $d^{\prime}\_{i} = d\_{i}$ |
    | $i = \ell$ | $a\_{\ell} + v$ | $a\_{\ell-1}$ (unaffected) | $d^{\prime}\_{\ell} = d\_{\ell} + v$ |
    | $\ell < i \le r$ | $a\_{i} + v$ | $a\_{i-1} + v$ | $d^{\prime}\_{i} = d\_{i}$ (cancels) |
    | $i = r + 1$ | $a\_{r+1}$ (unaffected) | $a\_{r} + v$ | $d^{\prime}\_{r+1} = d\_{r+1} - v$ |
    | $i > r + 1$ | $a\_{i}$ (unaffected) | $a\_{i-1}$ (unaffected) | $d^{\prime}\_{i} = d\_{i}$ |

    A whole range update only changes two positions in the difference array: $d\_{\ell}$ gains $v$, $d\_{r+1}$ loses $v$, everything else stays the same.

    <p style="text-align:right;">$\square$</p>

Written as a general algorithm:

```plaintext
RangeUpdate(diff, l, r, v)
    diff[l] = diff[l] + v
    if r + 1 < diff.length then
        diff[r + 1] = diff[r + 1] - v
    end if
```

```plaintext
Reconstruct(diff)
    result[0] = diff[0]
    for i = 1 to diff.length - 1 do
        result[i] = result[i - 1] + diff[i]
    end for
    return result
```

`Algorithm 3` is $O(1)$ per update; `Algorithm 4` gets called **exactly once** after every update is done, spending $O(n)$ to reconstruct the whole array -- together they make up the complete difference-array playbook.

Implementation:

```python
class NumArray:
    def __init__(self, nums: list[int]):
        n = len(nums)
        self.nums = nums
        self.diff = [0] * n

    def update(self, left: int, right: int, value: int) -> list[int]:
        self.diff[left] += value
        if right + 1 < len(self.diff):
            self.diff[right + 1] -= value

    def result(self) -> list[int]:
        result = [0] * len(self.diff)
        result[0] = self.diff[0]
        for i in range(1, len(self.diff)):
            result[i] = result[i - 1] + self.diff[i]
        return result
```

## 2D Prefix Sum

Prefix sum only handles range sums on a 1D array. Switch to a 2D matrix and the problem becomes querying the sum of an **arbitrary rectangular region**, over and over. The same idea applies directly -- spend $O(r \times c)$ ($r$ rows, $c$ columns) precomputing once, and every query afterward drops to $O(1)$.

Start with the problem (see [LeetCode 304](https://leetcode.com/problems/range-sum-query-2d-immutable/)). Given a 2D matrix, `sumRegion(row1, col1, row2, col2)` gets called many times, returning the sum of all elements in the rectangle with top-left `(row1, col1)` and bottom-right `(row2, col2)`.

::: {#fig-2d-region-query}
![2D matrix region query diagram](images/2d-region-query.png)
:::

The obvious approach is just a double loop:

```python
class NumMatrix:

    def __init__(self, matrix: List[List[int]]):
        self.matrix = matrix

    def sumRegion(self, row1: int, col1: int, row2: int, col2: int) -> int:
        total = 0
        for i in range(row1, row2 + 1):
            for j in range(col1, col2 + 1):
               total += self.matrix[i][j]
        return total
```

But that same double loop is exactly why it's easy to time out -- called $q$ times, the time complexity is $O(r \times c \times q)$.

Apply the same idea to two dimensions: build a `prefix` array the same size as `matrix` but with one extra row and column around the outside (same reason as `prefix[0] = 0` in the 1D case -- so boundary queries don't need special-casing). Define `prefix[i][j]` as **the sum of the rectangle from the top-left corner `(0, 0)` to `(i - 1, j - 1)`**.

Take the matrix below as an example:

```plaintext
matrix = [
    [3, 0, 1, 4, 2],
    [5, 6, 3, 2, 1],
    [1, 2, 0, 1, 5],
    [4, 1, 0, 1, 7],
    [1, 0, 3, 0, 5],
]
```

Suppose we've already computed:

```plaintext
prefix[1][2] = 3
prefix[2][1] = 8
prefix[2][2] = 14
```

Building already-computed values like `prefix[2][3]`, `prefix[3][2]` isn't hard, but to build `prefix[3][3]`, can we combine just the already-computed `prefix` values **above** and **to the left**? The answer: `prefix[i-1][j] + prefix[i][j-1]` double-counts the top-left block `prefix[i-1][j-1]` once, so subtract it back out once, then add the newly-included cell `matrix[i-1][j-1]`:

```plaintext
prefix[i][j] = prefix[i - 1][j] + prefix[i][j - 1] 
               - prefix[i - 1][j - 1] + matrix[i - 1][j - 1]
```

!!!- quote "Proof"
    Let the matrix be $A$, and its 2D prefix sum be $P$, defined as:

    $$
    P_{i,j} = \sum_{x=0}^{i-1} \sum_{y=0}^{j-1} A_{x,y}
    $$

    Check what range each of $P\_{i-1,j} + P\_{i,j-1}$ covers:

    $$
    P_{i-1,j} = \sum_{x=0}^{i-2} \sum_{y=0}^{j-1} A_{x,y}, \qquad P_{i,j-1} = \sum_{x=0}^{i-1} \sum_{y=0}^{j-2} A_{x,y}
    $$

    Adding the two, the top-left region $x \in [0, i-2]$, $y \in [0, j-2]$ appears in both, so it's counted twice:

    $$
    P_{i-1,j} + P_{i,j-1} = \underbrace{\sum_{x=0}^{i-2} \sum_{y=0}^{j-2} A_{x,y}}_{\text{counted twice}} + \sum_{x=0}^{i-2} A_{x,j-1} + \sum_{y=0}^{j-2} A_{i-1,y}
    $$

    And $P\_{i-1,j-1} = \sum\_{x=0}^{i-2} \sum\_{y=0}^{j-2} A\_{x,y}$ is exactly that over-counted top-left block, so subtract it once:

    $$
    P_{i-1,j} + P_{i,j-1} - P_{i-1,j-1} = \sum_{x=0}^{i-2} \sum_{y=0}^{j-1} A_{x,y} + \sum_{y=0}^{j-2} A_{i-1,y}
    $$

    This is exactly $P\_{i,j} = \sum\_{x=0}^{i-1} \sum\_{y=0}^{j-1} A\_{x,y}$ minus the last cell $A\_{i-1,j-1}$, so add that back:

    $$
    P_{i,j} = P_{i-1,j} + P_{i,j-1} - P_{i-1,j-1} + A_{i-1,j-1}
    $$

    <p style="text-align:right;">$\square$</p>

With `prefix` built, querying uses the same inclusion-exclusion trick: `sumRegion(row1, col1, row2, col2)` starts from the whole large rectangle from the top-left to `(row2, col2)`, `prefix[row2+1][col2+1]`, subtracts the left strip `prefix[row2+1][col1]`, subtracts the top strip `prefix[row1][col2+1]` -- these two strips overlap once in the top-left corner (`prefix[row1][col1]`), subtracted twice, so add it back once:

```plaintext
sumRegion(row1, col1, row2, col2)
        = prefix[row2 + 1][col2 + 1] - prefix[row1][col2 + 1]
          - prefix[row2 + 1][col1] + prefix[row1][col1]
```

Written as a general algorithm:

```plaintext
Build2DPrefixSum(M)
    for i = 1 to M.rows do
        for j = 1 to M.cols do
            prefix[i][j] = prefix[i - 1][j] + prefix[i][j - 1]
                         - prefix[i - 1][j - 1] + M[i - 1][j - 1]
        end for
    end for
    return prefix
```

```plaintext
RangeSum2D(prefix, row1, col1, row2, col2)
    return prefix[row2 + 1][col2 + 1] - prefix[row1][col2 + 1]
         - prefix[row2 + 1][col1] + prefix[row1][col1]
```

`Algorithm 5` builds the table in $O(r \times c)$, `Algorithm 6` answers each query in $O(1)$ -- together they make up the complete 2D prefix-sum playbook.

Implementation:

```python
class NumMatrix:
    def __init__(self, matrix: List[List[int]]):
        rows, cols = len(matrix), len(matrix[0])
        self.prefix = [[0] * (cols + 1) for _ in range(rows + 1)]
        for i in range(rows):
            for j in range(cols):
                self.prefix[i + 1][j + 1] = (
                    self.prefix[i][j + 1] + self.prefix[i + 1][j]
                    - self.prefix[i][j] + matrix[i][j]
                )

    def sumRegion(self, row1: int, col1: int, row2: int, col2: int) -> int:
        return (
            self.prefix[row2 + 1][col2 + 1]
            - self.prefix[row1][col2 + 1]
            - self.prefix[row2 + 1][col1]
            + self.prefix[row1][col1]
        )
```

## Solutions

### [LeetCode 1732: Find the Highest Altitude](https://leetcode.com/problems/find-the-highest-altitude/)

::: {.problem}
Given an integer array `gain` of length `n`, where `gain[i]` is the net altitude change from point `i` to point `i + 1`. The starting point (point `0`) has altitude `0`. Return the highest altitude reached over the whole trip.

#### Example

```plaintext
Input: gain = [-5,1,5,0,-7]
Output: 1
```
:::

A very direct application of prefix sum. Implementation:

```python
class Solution:
    def largestAltitude(self, gain: List[int]) -> int:
        n = len(gain)
        prefix = [0] * (n + 1)
        
        for i, num in enumerate(gain):
            prefix[i + 1] = prefix[i] + gain[i]

        return max(prefix)
```

There's no real need to keep a full `prefix` array around, though -- a single running variable, updated as you go while tracking the max, gets space down to $O(1)$:

```python
class Solution:
    def largestAltitude(self, gain: List[int]) -> int:
        altitude = 0
        highest = 0
        for g in gain:
            altitude += g
            highest = max(highest, altitude)
        return highest
```

### [LeetCode 238: Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/)

::: {.problem}
Given an integer array `nums`, return an array `answer` where `answer[i]` is the product of every element in `nums` except `nums[i]`, without using division, in $O(n)$ time.

#### Example

```plaintext
Input: nums = [1,2,3,4]
Output: [24,12,8,6]
```
:::

Same idea as finding the pivot -- since it **excludes itself**, do one forward pass storing each position's **left-side** product into `result[i]`, then one backward pass multiplying in the **right-side** product. Both passes only need a single running variable (`prefix`, `suffix`) -- no need to actually keep two full arrays:

```python
class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        n = len(nums)
        result = [1] * n

        prefix = 1
        for i, num in enumerate(nums):
            result[i] = prefix
            prefix *= num

        suffix = 1
        for i in reversed(range(n)):
            result[i] *= suffix
            suffix *= nums[i]

        return result
```

### [LeetCode 1109: Corporate Flight Bookings](https://leetcode.com/problems/corporate-flight-bookings/)

::: {.problem}
There are `n` flights, numbered `1` through `n`. Given a 2D array `bookings`, where `bookings[i] = [first, last, seats]` means `seats` seats should be reserved on every flight from `first` through `last` (inclusive). Return an array of length `n` giving the total number of seats reserved on each flight.

#### Example

```plaintext
Input: bookings = [[1,2,10],[2,3,20],[2,5,25]], n = 5
Output: [10,55,45,25,25]
```
:::

Nearly identical to the difference-array example earlier -- almost a direct application. Just note that since flight numbers are 1-indexed, `left` needs to be decremented by `1` when converting to an array index.

```python
class Solution:
    def corpFlightBookings(self, bookings: List[List[int]], n: int) -> List[int]:
        diff = [0] * n
        result = [0] * n

        for booking in bookings:
            left, right, value = booking[0], booking[1], booking[2]
            diff[left - 1] += value
            if right < n:
                diff[right] -= value

        result[0] = diff[0]
        for i in range(1, len(diff)):
            result[i] = result[i - 1] + diff[i]

        return result
```

<!-- TODO: LeetCode 1314 Matrix Block Sum -- not solid on 2D yet, skipping for now, come back later
### [LeetCode 1314: Matrix Block Sum](https://leetcode.com/problems/matrix-block-sum/)

::: {.problem}
Given a matrix `mat` and an integer `k`, return a matrix `answer` of the same size, where `answer[i][j]` is the sum of all elements in `mat` within the rectangle from top-left `(i - k, j - k)` to bottom-right `(i + k, j + k)` (parts outside the matrix bounds are simply ignored).

#### Example

```plaintext
Input: mat = [[1,2,3],[4,5,6],[7,8,9]], k = 1
Output: [[12,21,16],[27,45,33],[24,39,28]]
```
:::
-->

