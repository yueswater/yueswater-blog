---
title: Stack
date: '2026-08-22'
lang: en
permalink: dsa/stack-en/
categories: &id001
- Data Structures & Algorithms
- Stack
tags: *id001
excerpt: An introduction to the stack's definition and last-in-first-out operations.
thumbnail: /images/covers/DSA_cover.png
mathjax: true
---

The **stack** is an extremely common data structure in computer science -- everything from the everyday `Ctrl + Z`, a browser's back button, matching brackets, to a program's function calls, are all applications of a stack.

!!! info "Definition: Stack"
    A stack is a **dynamic set** in which the insertion and deletion of elements follows the **last-in-first-out (LIFO)** principle: the element removed is always the one that was most recently inserted, among those not yet removed.

    A stack supports two basic operations:

    - `push(S, x)`: inserts element $x$ onto the **top** of stack $S$
    - `pop(S)`: removes and returns the element at the top of stack $S$

    Calling `pop` on an empty stack causes an **underflow**; an insert that would push the stack past its allocated capacity causes an **overflow**[^1]. When implemented with an array, both `push` and `pop` run in $O(1)$ time.

## Basic Operations

### Push

Pushing first checks whether the stack is full, then does one of the following:

- If full: reject the insertion, optionally returning/printing a failure message
- If not full: add the element to the top of the stack, returning the updated stack

```plaintext
Push(S, x)
    if top[S] = length[S] then
        error "overflow"
    else
        top[S] = top[S] + 1
        S[top[S]] = x
    end if
```

### Pop

Popping is just a matter of checking whether the stack is empty:

- If empty: reject the pop, optionally returning/printing a failure message
- If not empty: remove the element at the top of the stack and return it

Written as pseudocode:

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

### Peek at the Top

Peeking at the top follows the same empty check first:

- If empty: reject the peek, optionally returning/printing a failure message
- If not empty: return the element at the top of the stack, without removing it

Written as pseudocode:

```plaintext
Top(S)
    if top[S] = 0 then
        error "underflow"
    else
        return S[top[S]]
    end if
```

### Time Complexity of Each Operation

`push`, `pop`, and `top` all only touch the `top[S]` pointer itself and whatever it points to, `S[top[S]]` -- whether it's a comparison, a read/write, or moving the pointer, the number of operations is fixed and never grows with however many elements are currently in the stack, so all three are $O(1)$.

| Operation | Time Complexity |
| --- | --- |
| `push` | $O(1)$ |
| `pop` | $O(1)$ |
| `top` | $O(1)$ |
| Traversal (visiting every element) | $O(n)$ |

Traversing the whole stack isn't a standard operation, though -- a stack only guarantees access to `top`. To visit every element, you have to start at `top` and walk down one by one, with no way to jump to an arbitrary position, so each element gets touched once, giving $O(n)$; traversing via `pop` also empties out the stack itself, unless you save each popped element elsewhere and `push` it back afterward.

## Stack Implementation

### Using an Array

```python
class ArrayStack:
    def __init__(self):
        """Initialize the stack"""
        self._stack: list[int] = []
    
    def is_empty(self) -> bool:
        """Check whether the stack is empty"""
        return not self._stack

    def size(self) -> int:
        """Return the stack's length"""
        return len(self._stack)
    
    def push(self, x: int) -> None:
        """Push"""
        self._stack.append(x)

    def pop(self) -> int:
        """Pop"""
        if self.is_empty():
            raise IndexError("stack is empty")
        x: int = self._stack.pop()
        return x

    def top(self) -> int:
        """Peek at the top element"""
        if self.is_empty():
            raise IndexError("stack is empty")
        return self._stack[-1]

    def __repr__(self) -> str:
        """Convert to a string"""
        return " <- ".join([str(x) for x in self._stack])
```

### Using a Linked List

First define the node:

```python
class ListNode:
    def __init__(self, data: int):
        self.data: int = data
        self.next: ListNode | None = None
```

Then implement the stack:

```python
class LinkedListStack:
    def __init__(self):
        self._top: ListNode | None = None
        self._size: int = 0

    def is_empty(self) -> bool:
        """Check whether the stack is empty"""
        return not self._top

    def size(self) -> int:
        """Return the stack's length"""
        return self._size

    def push(self, x: int) -> None:
        """Push"""
        node: ListNode = ListNode(x)
        node.next = self._top
        self._top = node
        self._size += 1

    def pop(self) -> int:
        """Pop"""
        if self.is_empty():
            raise IndexError("stack is empty")
        node = self._top
        self._top = node.next
        self._size -= 1
        return node.data

    def top(self) -> int:
        """Peek at the top"""
        if self.is_empty():
            raise IndexError("stack is empty")
        return self._top.data

    def __repr__(self) -> str:
        """Convert to a string"""
        if self.is_empty():
            return ""

        result: list[int] = []
        curr = self._top

        while curr:
            result.append(curr.data)
            curr = curr.next

        return " <- ".join([str(x) for x in result[::-1]])
```

### Complexity Comparison

Here's a table comparing the time complexity of the two stack implementations:

| | Array Stack (`ArrayStack`) | Linked List Stack (`LinkedListStack`) |
| --- | --- | --- |
| Capacity | Limited by Python `list`'s dynamic resizing mechanism | Effectively unbounded (limited only by memory) |
| Extra space overhead | Nearly none, elements are packed tightly | Each node needs extra space for a `next` pointer |
| Memory locality | Good -- elements are stored contiguously, high cache hit rate | Poor -- nodes are scattered across memory |
| `push` / `pop` / `top` | All $O(1)$ | All $O(1)$ |

The time complexity of the three core operations looks identical, but the array version is usually faster in practice, because its elements sit contiguously in memory, giving better **memory locality**[^2] and a higher cache hit rate when reading and writing; each node in the linked list version is scattered across memory, so even with the same number of operations, actual access speed ends up slower. This is also why most languages' standard libraries (like Python's `list.append`/`list.pop`) implement their stacks with arrays -- the linked list version is more useful for practicing pointer manipulation and understanding what's happening under the hood.

## Solutions

### [LeetCode 20: Valid Parentheses](https://leetcode.com/problems/valid-parentheses/)

::: {.problem}
Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[`, `]`, determine if the string is valid. An input string is valid if: open brackets must be closed by the same type of closing bracket, and open brackets must be closed in the correct order.

#### Example 1

```plaintext
Input: s = "()"
Output: true
```

#### Example 2

```plaintext
Input: s = "()[]{}"
Output: true
```

#### Example 3

```plaintext
Input: s = "(]"
Output: false
```
:::

Every opening bracket gets pushed onto the stack directly. When a closing bracket shows up, if the stack is empty, or the popped top isn't the matching opening bracket, that's a mismatch. After scanning the whole string, if the stack still has leftover opening brackets, that's also invalid:

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

### [LeetCode 155: Min Stack](https://leetcode.com/problems/min-stack/)

::: {.problem}
Design a stack that supports `push`, `pop`, `top`, and retrieving the minimum element in constant time. Implement the `MinStack` class:

- `MinStack()` initializes the stack object
- `void push(int val)` pushes the element `val` onto the stack
- `void pop()` removes the element on the top of the stack
- `int top()` gets the top element of the stack
- `int getMin()` retrieves the minimum element in the stack

#### Example

```plaintext
Input:
["MinStack","push","push","push","getMin","pop","top","getMin"]
[[],[-2],[0],[-3],[],[],[],[]]
Output:
[null,null,null,null,-3,null,0,-2]
```
:::

A single variable (say, `min`) can't track the minimum -- once an element gets popped off, there's no way to recover what the minimum was before it was added. The fix is to maintain a second `min_stack` alongside the main stack, pushing and popping both in sync: every level of `min_stack` stores **the minimum up through that level**, so once the top gets popped, the level underneath already has the correct minimum recorded, with no recomputation needed:

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

### [LeetCode 150: Evaluate Reverse Polish Notation](https://leetcode.com/problems/evaluate-reverse-polish-notation/)

::: {.problem}
Given an array of strings `tokens` that represents an arithmetic expression in Reverse Polish Notation (postfix notation), evaluate the expression. The valid operators are `+`, `-`, `*`, `/`. Each operand may be an integer or another expression. Division should always truncate toward zero.

#### Example 1

```plaintext
Input: tokens = ["2","1","+","3","*"]
Output: 9
Explanation: ((2 + 1) * 3) = 9
```

#### Example 2

```plaintext
Input: tokens = ["4","13","5","/","+"]
Output: 6
Explanation: (4 + (13 / 5)) = 6
```
:::

Scan through `tokens` from the start: push numbers as they come; when an operator shows up, `pop` the two most recent operands off the stack (the one popped second is the left operand `a`, the one popped first is the right operand `b`), compute the result, and `push` it back. After the scan, exactly one element remains on the stack -- the answer.

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

One thing worth flagging: the problem requires division to **truncate toward zero**, which differs from Python's `//`, which **floors** -- these give different results whenever the two operands have opposite signs (for example, `7 // -2` is `-4`, but truncating toward zero should give `-3`). That's why the division uses `a / b` to get a float first, then converts it with `int()`, to match what the problem requires.

[^1]: This term is actually tied to what memory allocation literally looked like. On early operating systems, the stack and the heap often shared the same block of memory, but grew in opposite directions: the heap grows from low addresses toward high addresses, while the stack grows from high addresses toward low addresses, heading toward each other. If recursion goes too deep, or a local variable allocation is too large, the stack pointer keeps marching downward until it **collides with the heap's boundary** -- that collision is where the term overflow comes from. The well-known Q&A site <a href="https://stackoverflow.com/"><img src="https://upload.wikimedia.org/wikipedia/commons/0/02/Stack_Overflow_logo.svg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original" alt="Stack Overflow" style="display:inline-block; height:1em; vertical-align:middle; margin:0;"></a> uses this term as its name, which doubles as an engineer's inside joke: it's both **the classic error that crashes your program**, and a site with a giant stack of technical Q&A piled on top of each other.

[^2]: When the CPU reads from memory, it pulls in a whole block at a time (a cache line) rather than a single value. An array's elements sit right next to each other, so reading one is likely to bring its neighbors into the cache along with it; a linked list's nodes are each scattered independently, so nearly every access has to go back out to main memory again -- this is called a **cache miss**.
