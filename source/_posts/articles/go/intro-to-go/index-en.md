---
title: 'Go Notes Series: A First Look at Go'
date: '2026-11-11'
lang: en
permalink: articles/go/intro-to-go-en/
categories: &id001
- Go
- Programming Languages
tags: *id001
excerpt: Why I started learning Go, and what I know about the language before I write any code with it.
lang_trend: true
---

## Why Learn Go

My reason for learning Go is simple. I saw people around me using it, it looked fun, and I wanted to play with it too.

That said, I usually write Python, use FastAPI for backends, and spend the rest of my time on JavaScript. Both work well for me and I have no real complaints. Before spending time on a new language, I should at least ask myself: **is it worth it**?

Let's start with attention. The chart below shows the TIOBE Programming Community index @citep[tiobe2026], which estimates how popular each language is from search engine queries. You can change the time range and the scale, or keep only the languages you care about (the language logos come from @citet[devicon]):

<figure id="fig-lang-trend"><div class="lang-trend"></div><figcaption><strong>Figure 1</strong> TIOBE index of major programming languages, June 2001 to November 2026</figcaption></figure>

For most of the last ten years Go has stayed between 1% and 3%. In November 2026 it stands at 1.69%, the lowest of these ten mainstream languages. Python, by comparison, climbed from 3.57% to 20.86%.

What about jobs? This is the share of IT job ads in the UK that mention Go, according to [IT Jobs Watch](https://www.itjobswatch.co.uk/) @citep[itjobswatch2026]:

<figure id="fig-go-jobs"><div class="lang-trend" data-set="jobs"></div><figcaption><strong>Figure 2</strong> Share of UK IT job ads that mention Go (approximate values)</figcaption></figure>

For permanent roles the share peaked at about 3% in early 2022 and is now only about 0.45%. Of course, this is just one market, so take it with a grain of salt. One more detail is interesting: about 58.5% of the ads that mention Go also ask for Python, so Go looks more like a language that is paired with Python.

From another angle, in the Stack Overflow developer survey, the share of developers using Go rose from 9.55% in 2021 @citep[stackoverflow2021] to 16.4% in 2025 @citep[stackoverflow2025].

Go is not the most popular or the most mainstream language, but it is not going away either. For me, it is **worth the time**!

## What Is Go

Go was first sketched on a whiteboard on 21 September 2007 by Robert Griesemer, Rob Pike and Ken Thompson at Google, and it became open source on 10 November 2009 @citep[gofaq].

It came from their frustration with building large projects in the languages of the time: the programs and the build systems were too complicated, and multicore processors were becoming common while most languages did little to help @citep[gofaq]. Pike later added that Google's servers were mostly written in C++, with Java and Python for the rest, and that builds often took minutes or even hours @citep[pike2012]. The official description of the language is:

> *Go is a compiled, concurrent, garbage-collected, statically typed language developed at Google.*
>
> — Rob Pike @citep[pike2012]

For a Python programmer, the most direct differences are **compilation** and **static typing**. Python is interpreted and types are only known at run time. Go is compiled into an executable first, and types are checked at compile time. It also links statically by default, so the executable carries Go's runtime with it @citep[gofaq], and you do not need to install an interpreter on the machine first, as you do with Python.

As for the design goals, Pike is quite honest:

> *...a language that is not a breakthrough research language but is nonetheless an excellent tool for engineering large software projects.*
>
> — Rob Pike @citep[pike2012]

## Learning Plan

My goal is simple: I want to become as comfortable with Go as I am with Python, and build services that are faster and use fewer resources.

So this series has four parts: the basic syntax, concurrency and the runtime, the frameworks and databases commonly used for backends, and finally a simplified payment service.

{% go_roadmap <strong>Figure 3</strong> The learning route of the Go notes series[^gopher] %}

[^gopher]: The gopher artwork is adapted from the Go gopher designed by Renée French (CC BY 4.0) @citep[gophergo].

## References

[references]
