---
title: '30 Days of Typst | Day 08: The `#show` Rule'
date: '2026-08-22'
lang: en
permalink: articles/typst/day08-show-rules-en/
categories: &id001
- Typst
- Typesetting
tags: *id001
excerpt: A look at the `#show` rule -- its basic syntax, the selectors that pick
  out what to target, how transformation rules redefine an element, and how the
  work is split between `#show` and `#set`.
thumbnail: /images/covers/Typst_logo.png
---

[The previous post](/articles/typst/day07-set-rules-en/) introduced the `#set` rule, which changes an element's style values -- things like size, colour, and margins. But `#set` can only adjust **existing** parameters. If what you want to change is how the element itself is presented -- automatically prefixing every heading with a decorative symbol, say, or swapping list items out for a completely different layout -- `#set` can't do it.

That's where the `#show` rule comes in. `#show` doesn't just apply styles the way `#set` does; it can take over how an element gets drawn, and even rewrite its content entirely. This post starts from the basic `#show` syntax, moves on to how selectors pick out the targets you want to handle, then into how transformation `show` rules redefine an element, and finally compares how the work should be split between `#show` and `#set`. From **adjusting existing values** to **redefining the content itself**.

## `#show` Rule Basics

Like `#set`, `#show` takes a selector and a rule to change how an element is presented. The difference is how much further `#show` can go: not just adjusting existing style parameters, but taking over how an element gets drawn in the first place. This section starts with the most basic syntax.

### Syntax and How It Works

The syntax of a `#show` rule is `#show selector: rule`. The simplest selector is an element function -- `heading`, for instance, meaning the rule only affects headings and leaves every other element alone:

```typst
#show heading: set text(fill: rgb("#0074d9"))
```

This line says: **for any `heading` element, apply the rule `set text(fill: ...)`**. Just like `#set`, a `#show` rule takes effect from the line it's declared on and applies through to the end of the file (or to the end of the block, if it's wrapped in one) -- headings that appear before it are unaffected.

### Applying Styles and Transforming Content

Two kinds of things can go after the colon in a `#show` rule:

The first is a **`set` rule**, the form seen above, which scopes a single `#set` rule to a specific element instead of applying it globally.

The second is a **function**, written as `it => content`:

```typst
#show heading: it => [
    ▸ #it.body
]
```

Here `it` is the element currently matching the selector, and `it.body` is that heading's content. This form lets you decide from scratch what the element gets drawn as, not just adjust its style parameters -- which is exactly why `#show` is more flexible than `#set`. This transformation form is covered in more depth in a later section.

### A Worked Example

<figure><img src="images/show-basics-demo-output-en.png" alt="`#show` rule basics example"><figcaption>`#show` rule basics example</figcaption></figure>

## Selectors

The `heading` used in the previous section is the simplest selector, but `#show` accepts far more than that. This section covers a few common selectors that let a rule pick out its targets more precisely.

### Element Function Selectors

The most basic selector is an element function itself -- `heading`, `list`, `strong`. Anything produced by that element function gets the rule applied:

```typst
#show list: set text(fill: rgb("#0074d9"))
```

This rule turns the text of every unordered list blue, leaving all other elements completely untouched.

### Filtering on Conditions with `where`

To handle only part of an element, append `.where(...)` to the element function and filter on field values. For instance, to change only level 1 headings while leaving level 2 alone:

```typst
#show heading.where(level: 1): set text(fill: rgb("#ff4136"))
```

This rule only applies to headings whose `level` is 1; level 2 and level 3 headings keep their default style. Which fields `where` can filter on varies by element -- for the fields actually available, check that element's parameters in the Typst documentation.

### Text and Regular Expression Selectors

Beyond element functions, `#show` can also select content matching specific text. The most direct form is an exact string match:

```typst
#show "Typst": text(fill: rgb("#2ecc40"), weight: "bold")[Typst]
```

This rule turns every occurrence of the word **Typst** in the body text green and bold. To match a pattern rather than a fixed string, use `regex` instead:

```typst
#show regex("\d+"): set text(fill: rgb("#b10dc9"))
```

This rule turns every number in the body text purple, whether it's `2026` or `42`.

### A Worked Example

<figure><img src="images/show-selector-demo-output-en.png" alt="`#show` selector example"><figcaption>`#show` selector example</figcaption></figure>

## Transformation `show` Rules

The transformation form seen earlier only added a single symbol. This section looks at how much further it can go.

### Rewriting an Element's Content with a Function

The `it` that a transformation `show` rule receives is really an element carrying several fields. Besides `it.body`, properties like `it.level` can be read off it too:

```typst
#show heading: it => [
    #set text(fill: rgb("#0074d9"))
    Level #it.level: #it.body
]
```

This rule makes every heading label its own level automatically -- `it.level` is 1 for a level 1 heading, 2 for a level 2 heading -- with no need to annotate each heading by hand. Which fields are readable again depends on the field list for that element in the Typst documentation.

### Custom Numbering with `counter`

Transformation rules can also be paired with `counter` to produce numbering more customised than the built-in `numbering` parameter allows. Say you want headings numbered in a **Chapter X** format rather than as plain numbers:

```typst
#set heading(numbering: none)

#show heading: it => block[
    #counter(heading).display()
    #it.body
]

#counter(heading).step()
= First Chapter Heading
```

The key here is turning off `heading`'s built-in `numbering`, incrementing manually with `counter(heading).step()` instead, and displaying the current number with `counter(heading).display()`. The format is entirely yours to decide, unconstrained by what the `numbering` parameter can express.

### A Worked Example

<figure><img src="images/show-transform-demo-output-en.png" alt="Transformation `show` rule example"><figcaption>Transformation `show` rule example</figcaption></figure>

## `#show` vs `#set`: Differences and Choosing Between Them

Having seen what `#show` can do, it's worth going back to compare how the work should be split between `#show` and `#set`.

### When to Use `#set`, When to Use `#show`

If all you want is to adjust an element's **existing** values -- size, colour, margins -- `#set` is enough, and it's the simplest thing to write. But `#show` is what you need for any of the following:

- Changing the style of **one kind** of element only, rather than applying it globally (turning headings a different colour without touching body text, say)
- Filtering out elements matching a specific condition with `where` (changing only level 1 headings, for instance)
- Changing the **structure or content itself** rather than just style parameters (automatically adding a symbol, or a custom numbering format)

Put simply: `#set` handles adjusting **values**, while `#show` decides **whether a rule applies, where it applies, and even what the result should look like**.

### The Two Can Be Stacked

`#set` and `#show` aren't an either/or choice -- both can act on the same element at once:

```typst
#set text(
    font: ("Libertinus Serif", "PingFang TC"),
    size: 11pt
)
#show heading: set text(fill: rgb("#0074d9"))
```

Here `#set text` sets the global font and size first, and `#show heading: set text(fill: ...)` then adds blue specifically for headings. The two rules' effects stack: headings pick up the global font and size while also getting their own blue, and body text is affected only by the global settings -- the same logic as stacking multiple `#set` rules back on day seven.

### A Worked Example

<figure><img src="images/show-vs-set-demo-output-en.png" alt="`#show` and `#set` stacking example"><figcaption>`#show` and `#set` stacking example</figcaption></figure>

## Summary

This post introduced the `#show` rule: from the most basic `#show selector: rule` syntax, to picking out targets with element functions, `where`, text, or regular expressions, and on to how transformation rules get at an element's content and fields through `it` -- even pairing with `counter` for fully custom numbering. It also laid out how the work splits between `#show` and `#set`: one adjusts values, the other decides what the content is presented as, and the two can be stacked.

That covers both of the two most central rules in Typst typesetting, `#set` and `#show`. The next post moves on to handling images and figures -- how Typst arranges images, attaches captions, and numbers them automatically.

See you next time~
