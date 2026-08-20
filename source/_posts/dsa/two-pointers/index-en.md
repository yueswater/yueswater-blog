---
title: Two Pointers
date: '2026-08-19'
lang: en
permalink: dsa/two-pointers-en/
categories: &id001
- Data Structures & Algorithms
- Two Pointers
tags: *id001
excerpt: An introduction to the two-pointer technique — left/right pointers,
  fast/slow pointers, and parallel pointers — with worked LeetCode solutions
  covering sorted-array search, cycle detection, and merging sorted linked
  lists.
thumbnail: /images/covers/DSA_cover.png
mathjax: true
---

Before getting into two pointers, let's look at an example: suppose we're given two already-**sorted** arrays, and we need to merge them into a single sorted array. For instance:

```plaintext
list1 = [1, 3, 7]
list2 = [1, 2, 5]
```

After merging, it should become:

```plaintext
merged = [1, 1, 2, 3, 5, 7]
```

The intuitive approach is to concatenate the two arrays directly, then sort the result with `sorted`:

```python
def merge(list1: list[int], list2: list[int]) -> list[int]:
    return sorted(list1 + list2)
```

This looks convenient, but it comes with two problems:

1. It makes no use of the fact that both arrays are **already sorted**
2. Its time complexity is $O((m + n)\log (m + n))$

The idea behind **two pointers** is this: since both arrays are already sorted, we can place one pointer at the front of each. At each step, we compare the two values the pointers point to, put the smaller one into the result, and move that pointer forward by one — no re-sorting required!

## Two Pointers

@citet[saad2017twopointers] defines two pointers as a technique that uses two mutually constrained indices to traverse data, where how one pointer moves can be limited by where the other one currently sits.

Two pointers isn't a specific algorithm on its own, though — it's a general idea that works well for certain kinds of problems, commonly showing up with **sorted arrays**, **prefix-sum arrays of positive numbers**, and **variable-size sliding windows**. Each pointer moves at most $O(n)$ steps across the structure, so the total number of operations is $O(n)$.

As the name suggests, two pointers means exactly that — two pointers. Based on how they behave on the underlying structure, they split into **left/right pointers**, **fast/slow pointers**, and **parallel pointers**.

### Left/Right Pointers

Given two pointers — a left pointer `left` and a right pointer `right` — `left` starts from the very front and `right` starts from the very end. The two pointers **move toward each other**, until they meet or cross.

Along the way (usually inside a loop), how the pointers move depends on whatever condition the problem requires — you might move only `left`, only `right`, or both at once.

```plaintext
Algorithm 1 Two Pointers (Left/Right)
    procedure TwoPointerLeftRight(A)
        left = 1
        right = A.length
        while left < right do
            ▷ Do the actual work
            ▷ Decide how to move the pointers based on the condition
        end while
end procedure
```

::: {#fig-left-right-pointers}
![Left/right pointers diagram](images/left-right-pointers.png)
:::

| Use Case | LeetCode |
| --- | --- |
| Find a combination in sorted data that meets a condition | [167](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/), [15](https://leetcode.com/problems/3sum/), [16](https://leetcode.com/problems/3sum-closest/) |
| Compare front and back to verify symmetry | [125](https://leetcode.com/problems/valid-palindrome/), [344](https://leetcode.com/problems/reverse-string/) |
| Find an extremum between two boundaries | [11](https://leetcode.com/problems/container-with-most-water/) |
| Compare front and back values, filling the result from the back forward | [977](https://leetcode.com/problems/squares-of-a-sorted-array/) |

### Fast/Slow Pointers

Given two pointers — a fast pointer `fast` and a slow pointer `slow` — the two move at different step sizes. Picture it as two people of different heights setting off from the same starting point and walking forward together.

The stopping condition for fast/slow pointers is a bit unusual: it stops once the fast pointer can't move anymore. Suppose the structure being traversed has total length $L$, and it takes $k$ rounds, with the fast pointer moving $n$ times as fast as the slow pointer. Once the fast pointer reaches the end, we get $nk = L$. Solving for $k$ gives us

$$
k^{*} = \dfrac{L}{n}
$$

and $k^{*}$ is exactly the distance the slow pointer has covered — meaning it ends up at the $1/n$ mark.

```plaintext
Algorithm 2 Two Pointers (Fast/Slow)
    procedure TwoPointerFastSlow(head)
        slow = head
        fast = head
        while fast ≠ NIL and fast.next ≠ NIL do
            ▷ Do the actual work
            slow = slow.next
            fast = fast.next.next
        end while
end procedure
```

::: {#fig-fast-slow-pointers}
![Fast/slow pointers diagram](images/fast-slow-pointers.png)
:::

| Use Case | LeetCode |
| --- | --- |
| Find the midpoint in a single traversal | [876](https://leetcode.com/problems/middle-of-the-linked-list/) |
| Detect whether a cycle exists | [141](https://leetcode.com/problems/linked-list-cycle/), [142](https://leetcode.com/problems/linked-list-cycle-ii/), [202](https://leetcode.com/problems/happy-number/) |
| In-place filtering and deduplication on an array | [26](https://leetcode.com/problems/remove-duplicates-from-sorted-array/), [283](https://leetcode.com/problems/move-zeroes/) |

### Parallel Pointers

Given two pointers — `i` and `j` — each traversing a **different** structure (say, two arrays, or two linked lists), both starting from the front and advancing in the same direction. At each step, depending on whatever condition the problem requires, you compare the two values the pointers currently point to and decide which pointer to move — or move both at once.

The difference from left/right pointers: left/right pointers are two pointers on the *same* structure closing in on each other; parallel pointers are pointers on *two separate* structures, each advancing independently — there's no "closing in" or "meeting" involved.

```plaintext
Algorithm 3 Two Pointers (Parallel)
    procedure TwoPointerParallel(A, B)
        i = 1
        j = 1
        while i ≤ A.length and j ≤ B.length do
            ▷ Do the actual work
            ▷ Decide whether to move i, j, or both, based on the condition
        end while
end procedure
```

| Use Case | LeetCode |
| --- | --- |
| Merge two already-sorted sources moving in the same direction | [21](https://leetcode.com/problems/merge-two-sorted-lists/), [88](https://leetcode.com/problems/merge-sorted-array/) |
| Find the intersection of two sets | [350](https://leetcode.com/problems/intersection-of-two-arrays-ii/), [986](https://leetcode.com/problems/interval-list-intersections/) |

## Solutions

### [LeetCode 167: Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/)

::: {.problem}
You're given a 1-indexed integer array `numbers` that's already sorted in non-decreasing order, along with an integer `target`. Find two numbers in the array that add up to `target`, and return their indices (1-indexed, with `index1 < index2`). Each input is guaranteed to have exactly one solution, and you may not use the same element twice.

#### Example 1

```plaintext
Input: numbers = [2,7,11,15], target = 9
Output: [1,2]
```

#### Example 2

```plaintext
Input: numbers = [2,3,4], target = 6
Output: [1,3]
```

#### Example 3

```plaintext
Input: numbers = [-1,0], target = -1
Output: [1,2]
```
:::

The intuitive approach uses two nested loops: the outer loop walks through every number in the array, and the inner loop walks through every number that comes after it:

```python
class Solution:
    def twoSum(self, numbers: list[int], target: int) -> list[int]:
        N = len(numbers)

        for i in range(N):
            for j in range(i + 1, N):
                if numbers[i] + numbers[j] == target:
                    return [i + 1, j + 1]
```

Running this directly runs into a timeout, though, for a simple reason: the algorithm above has time complexity $O(n^{2})$. Given an array with a huge number of elements, the computer would be crunching away forever.

Notice that the problem already tells us the array is **sorted**, so we can use left/right pointers, closing in from both ends, summing the two values and comparing against the target:

- If the sum is **too small**: `left` needs to move right, swapping in a larger number
- If the sum is **too large**: `right` needs to move left, swapping in a smaller number

```python
class Solution:
    def twoSum(self, numbers: list[int], target: int) -> list[int]:
        left, right = 0, len(numbers) - 1

        while left < right:
            tmp_sum = numbers[left] + numbers[right]
            if tmp_sum < target:    # too small
                left += 1           # move left pointer right
            elif tmp_sum > target:  # too large
                right -= 1          # move right pointer left
            else:
                return [left + 1, right + 1]
```

### [LeetCode 141: Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/)

::: {.problem}
Given the head node `head` of a linked list, determine whether the list contains a cycle — that is, whether starting from some node and repeatedly following the `next` pointer can eventually bring you back to that same node. Return `true` if a cycle exists, `false` otherwise.

#### Example 1

```plaintext
Input: head = [3,2,0,-4], pos = 1
Output: true
```

#### Example 2

```plaintext
Input: head = [1,2], pos = 0
Output: true
```

#### Example 3

```plaintext
Input: head = [1], pos = -1
Output: false
```
:::

This problem looks complicated, but you can picture it as a race between a tortoise and a hare — the hare runs faster, the tortoise is slower, and if the hare ever catches up to the tortoise again after a while, that means the two of them are stuck going in circles — which means the list has a cycle! This is why the technique is also called the [**tortoise and hare algorithm**](https://en.wikipedia.org/wiki/Cycle_detection).

We can make the fast pointer (the hare) move one extra step compared to the slow pointer (the tortoise), then check whether they meet:

```python
class Solution:
    def hasCycle(self, head: ListNode | None) -> bool:
        fast, slow = head, head     # start together

        while fast is not None and fast.next is not None:
            fast = fast.next.next   # fast takes the extra step
            slow = slow.next        # slow takes just one step
            if slow is fast:        # check whether they've met
                return True
        return False
```

The time complexity here is $O(n)$.

### [LeetCode 21: Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/)

::: {.problem}
Given two linked lists `list1` and `list2`, each already sorted, merge them into a single new list that's still sorted. You should splice the existing nodes from both lists together directly, rather than allocating new nodes, and return the head of the merged list.

#### Example 1

```plaintext
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]
```

#### Example 2

```plaintext
Input: list1 = [], list2 = []
Output: []
```

#### Example 3

```plaintext
Input: list1 = [], list2 = [0]
Output: [0]
```
:::

As mentioned earlier, we need to make use of the condition the problem gives us: the lists are already **sorted**. Even though this problem uses linked lists, the same underlying logic still applies.

This problem uses **parallel pointers** — we compare the two lists from the front: whichever node has the smaller value gets attached to the back of the result list, and that pointer moves forward.

The loop should stop once either list runs out. Written as a `while` condition, that means flipping it around (via De Morgan's Law) into: **both lists still have nodes left**.

We eventually need to return a node, but there's nowhere to hold onto the result as we build it up — this is where the **dummy node** comes in! We start `curr` pointing at the dummy node, attach whichever node wins the comparison right after `curr`, and move `curr` forward by one each time. At the end, we return `dummy.next`.

One more thing worth noting: we don't know ahead of time which list is longer. So once one of them runs out and the loop ends, the remainder of the other list — which is already sorted — can just be spliced onto `curr` directly.

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

## References

[references]
