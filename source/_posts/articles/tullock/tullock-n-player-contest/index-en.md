---
title: 'Equilibrium and Comparative Statics of Tullock Contests: From Two Players to Many'
date: '2026-11-13'
lang: en
permalink: articles/tullock/tullock-n-player-contest-en/
categories:
- Economics
- Game Theory
tags:
- Economics
- Game Theory
- Rent-Seeking
excerpt: We extend the Tullock contest from two players to n players and relax the contest intensity r, and look at how equilibrium spending, the conditions for existence, and rent dissipation change.
mathjax: true
tullock_sim: true
---

In September 2017, Amazon announced that it would open a second headquarters, HQ2, promising 50,000 new jobs and more than 5 billion US dollars in investment @citep[cbs2017proposals]. A month later it said it had received 238 proposals, from 43 US states, Washington D.C., Puerto Rico, 3 Mexican states and 6 Canadian provinces @citep[cbs2017proposals].

The race was not cheap. Take Philadelphia, which made the list of 20 finalists: by August 2018, its city agencies had spent about 545,000 dollars on research, marketing and advertising @citep[marin2018philly]. In November 2018, Amazon chose New York City and Arlington, Virginia @citep[silverstein2018hq2]. Philadelphia was not selected, and the money it had spent was not refunded.

This situation is close to the Tullock contest in [the previous post](/articles/tullock/tullock-introduction-en/): many players spend costly resources to win the same prize, and the cost is sunk whether they win or lose[^hq2-fit]. The previous post covered only two players, but HQ2 had far more than two, which leads to the central question of this post:

> When the number of players grows from 2 to $n$, does each player spend more or less? And what happens to total spending?

## The $N$-Player Lottery Contest

In [the previous post](/articles/tullock/tullock-introduction-en/#The-Contest-Success-Function) we introduced the general form of the contest success function, but for convenience we simplified it to a two-player Tullock contest and derived the Nash equilibrium.

In reality, though, contests often have more than two players. A government may offer one exclusive operating license and attract five or even ten firms; a research grant may draw dozens of teams at the same time.

This raises a new question: when more players enter, does each of them spend more, or does the contest as a whole simply become fiercer?

This post relaxes two assumptions, the number of players and the contest intensity, and uses derivations to analyze equilibrium spending, the conditions under which an equilibrium exists, and how rent dissipation changes.

### Model Setup

The model is much like the two-player Tullock contest. The main difference is that the contest now has $n \geq 2$ players, with the set of players $N = \{1, 2, \cdots, n\}$. All other assumptions stay the same.

In this section we first fix the contest intensity at $r = 1$, so the CSF is

::: {.equation #eq:general-csf}
p_i(x_1, \cdots, x_n) = \dfrac{x_i}{\sum_{j = 1}^{n} x_j}
:::

where the denominator is the total spending of all players. When everyone spends zero, we define each player's probability of winning as $\frac{1}{n}$.

To simplify the derivations that follow, for player $i$ let the total spending of the other players be

$$
X_{-i} = \sum_{j \neq i} x_{j}
$$

Player $i$'s expected payoff can then be written as

::: {.equation #eq:general-expected-payoff}
\pi_i(x_i, X_{-i}) = \dfrac{x_i}{x_i + X_{-i}} V - cx_i
:::

### The Symmetric Nash Equilibrium

Pure-strategy equilibria of the $N$-player lottery contest, along with their existence and uniqueness, have already been discussed in the literature @citep[konrad2009strategy,szidarovszky1997existence]. Here we rederive the symmetric equilibrium in a teaching style.

The method is the same as in the two-player model. First, taking the other players' spending as given, we find each player's optimal spending. Then we require these optimal choices to be identical across players. This gives the **symmetric Nash equilibrium**, in which everyone spends the same amount.

For player $i$, $X_{-i}$ is given, so the optimization problem is:

$$
\max_{x_i \geq 0} \ \pi_i(x_i, X_{-i}) = \dfrac{x_i}{x_i + X_{-i}} V - cx_i
$$

Consider $X_{-i} > 0$ first. The derivative of the winning probability with respect to own spending is:

$$
\dfrac{\partial}{\partial x_i} \left( \dfrac{x_i}{x_i + X_{-i}} \right) = \dfrac{X_{-i}}{(x_i + X_{-i})^2}
$$

So, from @eq:general-expected-payoff, the first partial derivative of the expected payoff with respect to $x_i$ is:

$$
\dfrac{\partial \pi_i}{\partial x_i} = \underbrace{\dfrac{VX_{-i}}{(x_i + X_{-i})^2}}_{\text{marginal expected benefit}} - \underbrace{c}_{\text{marginal cost}}
$$

Setting it to zero gives the **first-order condition (FOC)**:

::: {.equation #eq:n-foc}
\dfrac{VX_{-i}}{(x_i + X_{-i})^2} = c
:::

This has the same form as the first-order condition of the two-player model. The only difference is that the opponent's spending $x_j$ is replaced by the total spending $X_{-i}$ of the other $n - 1$ players.

Next, we differentiate once more with respect to $x_i$ to check the **second-order condition (SOC)**:

$$
\dfrac{\partial^2 \pi_i}{\partial x_i^2} = -\dfrac{2VX_{-i}}{(x_i + X_{-i})^3} < 0
$$

So when $X_{-i} > 0$, the expected payoff is strictly concave in $x_i$. If @eq:n-foc has a positive solution, it is the unique optimal spending; if not, the optimum is the corner solution $x_i = 0$.

Now we look for a symmetric equilibrium by setting

$$
x_1^* = x_2^* = \cdots = x_n^* = x^*
$$

The other players' total spending is then $X_{-i} = (n - 1)x^*$. Substituting into @eq:n-foc:

$$
\dfrac{V(n - 1)x^*}{\left[ x^* + (n - 1)x^* \right]^2} = \dfrac{V(n - 1)}{n^2 x^*} = c
$$

Solving gives:

::: {.equation #eq:n-eq-input}
x_i^* = \dfrac{(n - 1)V}{cn^2}, \quad i = 1, \cdots, n
:::

When $n = 2$, $x_i^* = \frac{V}{4c}$, which is the two-player equilibrium from [the previous post](/articles/tullock/tullock-introduction-en/).

::: {.proposition}
# Symmetric Nash equilibrium of the $N$-player lottery contest

In a Tullock contest with $n \geq 2$ players, complete information, simultaneous moves, the same valuation $V > 0$ of the prize, the same linear cost $cx_i$ and $r = 1$, there is a unique pure-strategy Nash equilibrium:

$$
(x_1^*, \cdots, x_n^*) = \left( \dfrac{(n - 1)V}{cn^2}, \cdots, \dfrac{(n - 1)V}{cn^2} \right)
$$
:::

::: {.proof}
Consider first the case where every player spends a positive amount. Let $X = \sum_j x_j$ be total spending, so $X_{-i} = X - x_i$ and each player's first-order condition is:

$$
\dfrac{V(X - x_i)}{X^2} = c, \quad i = 1, \cdots, n
$$

These equations differ only in $x_i$, and the left side is strictly decreasing in $x_i$, so all the $x_i$ must be equal. In other words, any pure-strategy equilibrium in which everyone spends a positive amount must be symmetric, and it is uniquely determined by @eq:n-eq-input.

Next we rule out the boundary cases:

- If only one player spends a positive amount, that player wins with probability 1. They could cut their spending and still win for sure at a lower cost, so their spending is not a best response
- If at least two players spend a positive amount and at least one spends zero, let total spending be $X > 0$. For a player who spends a positive amount, the first-order condition is $\frac{V(X - x_i)}{X^2} = c$, and since $X - x_i < X$, we have $\frac{V}{X} > c$. For a player who spends zero, the marginal expected payoff is then $\frac{V}{X} - c > 0$, so spending a small enough positive amount raises their expected payoff. This is not an equilibrium
- If nobody spends anything, each player's expected payoff is $\frac{V}{n}$. If any one player spends a small $\varepsilon > 0$, their probability of winning becomes 1 and their expected payoff is $V - c\varepsilon > \frac{V}{n}$. So zero spending by everyone is not an equilibrium

Finally, we verify that the candidate is indeed an equilibrium. When the others all spend $x^* = \frac{(n - 1)V}{cn^2} > 0$, we have $X_{-i} = (n - 1)x^* > 0$, $\pi_i$ is strictly concave in $x_i$, and $x_i = x^*$ satisfies the first-order condition. It is therefore the unique global maximum over $x_i \geq 0$, and $(x_1^*, \cdots, x_n^*)$ is a Nash equilibrium. $\blacksquare$
:::

With the equilibrium spending in hand, we can compute the winning probability in equilibrium. Since everyone spends the same amount:

::: {.equation #eq:n-win}
p_i^* = \dfrac{x^*}{nx^*} = \dfrac{1}{n}
:::

Even though every player spends a positive amount, the individual winning probability in equilibrium depends only on the number of players.

Substituting the equilibrium spending back into @eq:general-expected-payoff gives each player's expected payoff in equilibrium:

::: {.equation #eq:n-payoff}
\pi_i^* = p_i^* V - cx_i^* = \dfrac{V}{n} - \dfrac{(n - 1)V}{n^2} = \dfrac{V}{n^2}
:::

When $n = 2$, $\pi_i^* = \frac{V}{4}$, again the same as the result in [the previous post](/articles/tullock/tullock-introduction-en/).

### The Effect of the Number of Players

For how the number of players affects the equilibrium, see @citet[konrad2009strategy].

Now that we have the equilibrium, we can answer the question at the start of the post: how does the equilibrium change as the number of players $n$ grows?

Look at an individual player first. From @eq:n-eq-input, individual equilibrium spending is:

$$
x_i^* = \dfrac{V}{c} \cdot \dfrac{n - 1}{n^2}
$$

To see the effect of $n$, we temporarily treat $n$ as a continuous variable and differentiate:

::: {.equation #eq:n-dx}
\dfrac{\partial x_i^*}{\partial n} = \dfrac{V}{c} \cdot \dfrac{n^2 - 2n(n - 1)}{n^4} = -\dfrac{V(n - 2)}{cn^3}
:::

When $n > 2$, the derivative is strictly negative. In other words, starting from $n = 2$, every additional player lowers individual equilibrium spending, and the individual spending $\frac{V}{4c}$ at $n = 2$ is the largest among all $n \geq 2$.

We can read this result from another angle. In equilibrium, each player's expected prize is $p_i^* V = \frac{V}{n}$, and the cost they actually pay is:

$$
cx_i^* = \dfrac{(n - 1)V}{n^2} = \dfrac{n - 1}{n} \cdot \dfrac{V}{n}
$$

So each player is willing to spend a fraction $\frac{n - 1}{n}$ of their expected prize on trying to win. As $n$ grows, this fraction rises, but the expected prize $\frac{V}{n}$ shrinks even faster, so individual spending still falls.

But lower individual spending does not mean lower total cost for the contest. Total spending of all players is:

::: {.equation #eq:n-total}
X^* = \sum_{i=1}^{n} x_i^* = nx_i^* = \dfrac{(n - 1)V}{cn}
:::

Differentiating with respect to $n$:

::: {.equation #eq:n-dtotal}
\dfrac{\partial X^*}{\partial n} = \dfrac{V}{cn^2} > 0
:::

Total spending rises with the number of players. Measured as the cost that all players actually pay:

::: {.equation #eq:n-tc}
TC^* = cX^* = \dfrac{n - 1}{n} V
:::

When $n = 2$, $TC^* = \frac{V}{2}$, which agrees with the two-player contest in [the previous post](/articles/tullock/tullock-introduction-en/).

::: {.proposition}
# Number of players and equilibrium outcomes

In an $N$-player lottery contest with $n \geq 2$, as the number of players $n$ increases:

1. Individual equilibrium spending $x_i^*$ decreases
2. Total equilibrium spending $X^*$ and total contest cost $TC^*$ increase
3. Individual expected payoff $\pi_i^* = \frac{V}{n^2}$ decreases
:::

Take $V = 100$ and $c = 1$ as an example:

| Number of players $n$ | Individual spending $x_i^*$ | Total contest cost $TC^*$ | Individual expected payoff $\pi_i^*$ |
| --- | --- | --- | --- |
| 2 | 25.00 | 50.00 | 25.00 |
| 3 | 22.22 | 66.67 | 11.11 |
| 4 | 18.75 | 75.00 | 6.25 |
| 5 | 16.00 | 80.00 | 4.00 |
| 10 | 9.00 | 90.00 | 1.00 |
| 20 | 4.75 | 95.00 | 0.25 |

As the number of players goes from 2 to 20, each player's spending falls from 25 to 4.75, yet the total cost of all players rises from 50 to 95.

Now consider a very large $n$. As $n$ approaches infinity:

::: {.equation #eq:n-limit}
\lim_{n \to \infty} x_i^* = 0, \qquad \lim_{n \to \infty} TC^* = V
:::

Each player spends almost nothing, but the total cost of all players gets closer and closer to the value of the prize $V$. For any finite $n$, $TC^* = \frac{n - 1}{n}V < V$, so the prize is never exactly used up.

This result echoes the **rent dissipation** mentioned in [the previous post](/articles/tullock/tullock-introduction-en/#Rent-Dissipation). The ratio of total contest cost to the value of the prize, $\frac{TC^*}{V}$, is called the rent dissipation rate. When $r = 1$ it equals $\frac{n - 1}{n}$ and approaches 1 as the number of players grows. In other words, each player seems to spend only a small share of resources, yet together they may use up resources worth almost the whole prize just to decide who gets a fixed reward.

So far we have considered only $r = 1$. If spending has a more sensitive effect on the winning probability, will players spend more? And does an equilibrium always exist? That is the subject of the next section.

## Contest Intensity and Existence of Equilibrium

Not every contest links spending to winning probability the way a lottery does.

Take research funding as an example. The Australian National Health and Medical Research Council (NHMRC) received 3,727 applications in its March 2012 project grant round, and 731 of them (21%) were funded. The researchers estimated that preparing these applications took about 550 working years of researcher time in total (95% confidence interval: 513 to 589 years), which is equivalent to roughly 66 million Australian dollars a year in salary costs, and that each new application took 38 working days on average @citep[herbert2013time]. Under such a system, applicants have a reason to polish their proposals as much as they can, because the more they put in, the better their chance of being selected.

Some funding agencies, however, have tried moving the rules in the opposite direction. Since 2013, the Health Research Council of New Zealand (HRC) has used a modified lottery in its Explorer Grants: a committee first reviews the applications, only those with two or more positive assessments are put on a shortlist, and then a random number decides who gets the funding @citep[liu2020lottery]. Within the shortlist, spending more time on a better application does not raise the chance of being drawn[^hrc-time].

The difference between the two systems is **how sensitive the outcome is to spending**. In a Tullock contest, the parameter that describes this sensitivity is the contest intensity $r$, which appears in the general contest success function introduced at the start of [the previous post](/articles/tullock/tullock-introduction-en/#The-Contest-Success-Function). So far we have fixed it at $r = 1$ for simplicity. In this section we relax that assumption and answer two questions:

1. How does equilibrium spending change when the contest intensity $r$ rises?
2. Is there a symmetric pure-strategy equilibrium with positive spending by everyone for every $r$?

### The General Contest Success Function

For the general contest success function and the discussion of contest intensity $r$, see @citet[konrad2009strategy] and @citet[corchon2007theory].

Going back to the general form from the start of [the previous post](/articles/tullock/tullock-introduction-en/#The-Contest-Success-Function), we drop the assumption $r = 1$ and consider the CSF for $n$ players:

::: {.equation #eq:n-r-csf}
p_i(x_1, \cdots, x_n) = \dfrac{x_i^r}{\sum_{j = 1}^{n} x_j^r}, \quad r > 0
:::

Here $r$ is called the **contest intensity**, and it measures how sensitive the winning probability is to differences in spending. When everyone spends zero, we still define each player's probability of winning as $\frac{1}{n}$.

Different values of $r$ describe different kinds of contests:

| Contest intensity | What it means |
| --- | --- |
| $r \to 0$ | Winning probability approaches $\frac{1}{n}$ whatever the spending, close to a pure lottery |
| $0 < r < 1$ | Spending matters less than proportionally |
| $r = 1$ | Winning probability is proportional to relative spending, the lottery contest above |
| $r > 1$ | Differences in spending are amplified |
| $r \to \infty$ | The highest spender almost surely wins |

This matches the HRC example: a lottery means winning probability does not depend on spending, which is the end of the scale where $r$ is very small.

Take two players with $x_1 = 60$ and $x_2 = 40$. The winning probabilities change with $r$ as follows:

| Contest intensity $r$ | $p_1$ | $p_2$ |
| --- | --- | --- |
| 0.5 | 0.5505 | 0.4495 |
| 1 | 0.6000 | 0.4000 |
| 2 | 0.6923 | 0.3077 |
| 5 | 0.8836 | 0.1164 |

With spending unchanged, the higher $r$ is, the higher the winning probability of the player who spends more.

Two things need to be kept apart, though. A higher $r$ amplifies **the winning advantage for a given difference in spending**, but this does not mean equilibrium spending increases without limit. Players adjust their strategies to the new rules, and when $r$ is too large, an equilibrium in which everyone spends a positive amount may even stop existing. These are the questions of the next two subsections.

Keeping the earlier notation, let the other players' spending, raised to the power $r$, be summed:

$$
S_{-i} = \sum_{j \neq i} x_j^r
$$

Player $i$'s expected payoff is then:

::: {.equation #eq:n-r-payoff}
\pi_i(x_i, x_{-i}) = \dfrac{x_i^r}{x_i^r + S_{-i}} V - cx_i
:::

When $r = 1$, $S_{-i} = X_{-i}$, and @eq:n-r-payoff reduces to @eq:general-expected-payoff.

### Candidate for the Symmetric Equilibrium

The steps are the same as for $r = 1$: first find an individual player's first-order condition, then substitute the symmetry condition. Given $S_{-i}$, the derivative of the winning probability with respect to own spending is:

$$
\dfrac{\partial}{\partial x_i} \left( \dfrac{x_i^r}{x_i^r + S_{-i}} \right) = \dfrac{rx_i^{r - 1}(x_i^r + S_{-i}) - x_i^r \cdot rx_i^{r - 1}}{(x_i^r + S_{-i})^2} = \dfrac{rx_i^{r - 1}S_{-i}}{(x_i^r + S_{-i})^2}
$$

So, from @eq:n-r-payoff, setting the first partial derivative of the expected payoff with respect to $x_i$ to zero gives the first-order condition:

::: {.equation #eq:n-r-foc}
\dfrac{Vrx_i^{r - 1}S_{-i}}{(x_i^r + S_{-i})^2} = c
:::

Next we look for a symmetric interior solution. Again let $x_1^* = \cdots = x_n^* = x^* > 0$, so that $S_{-i} = (n - 1)(x^*)^r$, and substitute into @eq:n-r-foc:

$$
\dfrac{Vr(x^*)^{r - 1} \cdot (n - 1)(x^*)^r}{\left[ n(x^*)^r \right]^2} = \dfrac{Vr(n - 1)(x^*)^{2r - 1}}{n^2 (x^*)^{2r}} = \dfrac{Vr(n - 1)}{n^2 x^*} = c
$$

Solving gives:

::: {.equation #eq:n-r-eq-input}
x_i^* = \dfrac{r(n - 1)V}{cn^2}, \quad i = 1, \cdots, n
:::

When $r = 1$ this returns to @eq:n-eq-input. When $n = 2$, $x_i^* = \frac{rV}{4c}$, which agrees with the observation in the footnote of [the previous post](/articles/tullock/tullock-introduction-en/).

In the symmetric candidate, equilibrium spending is linear in $r$:

$$
\dfrac{\partial x_i^*}{\partial r} = \dfrac{(n - 1)V}{cn^2} > 0
$$

That is, the higher the contest intensity, the more each player is willing to spend in the candidate solution.

However, @eq:n-r-eq-input is for now only a **candidate** that satisfies the first-order condition, and we cannot yet call it an equilibrium. The first-order condition is only necessary; to be sure that it gives the optimal spending, we also have to check the second-order condition. Differentiating the expected payoff twice with respect to $x_i$:

$$
\dfrac{\partial^2 \pi_i}{\partial x_i^2} = \dfrac{Vrx_i^{r - 2}S_{-i} \left[ (r - 1)S_{-i} - (r + 1)x_i^r \right]}{(x_i^r + S_{-i})^3}
$$

- When $0 < r \leq 1$, the expression in square brackets is always negative, so the expected payoff is strictly concave in $x_i$ and the solution of the first-order condition is the best response
- When $r > 1$, the expression in brackets becomes positive once $x_i$ is small enough. The expected payoff is no longer globally concave, and the solution of the first-order condition is only guaranteed to be a local optimum

So for $r > 1$ we also need to compare the candidate with other strategies, above all with leaving the contest entirely, $x_i = 0$.

### Conditions for Existence

For the conditions under which a symmetric pure-strategy equilibrium with positive spending by everyone exists, see @citet[konrad2009strategy] and @citet[perezcastrillo1992general]. For the mixed-strategy equilibrium of the two-player contest when $r$ exceeds the limit, see @citet[baye1994solution].

The bidding for the 2024 Summer Olympics is an example of players dropping out because the cost was too high. In September 2015, the International Olympic Committee (IOC) announced five candidate cities: Budapest, Hamburg, Los Angeles, Paris and Rome. Hamburg then withdrew after a referendum on November 29, 2015, Rome withdrew on September 21, 2016, citing financial difficulties, and Budapest withdrew on February 22, 2017, because the number of signatures against the bid exceeded what was needed to force a referendum. That left only Paris and Los Angeles @citep[wikipedia2024bids]. In July 2017, the IOC decided to award the 2024 and 2028 Games at the same time @citep[bloomberg2017ioc], and in September in Lima it announced that Paris would host in 2024 and Los Angeles in 2028 @citep[wikipedia2024bids].

<figure id="fig-olympic-2024"><svg viewBox="0 0 720 290" role="img" aria-labelledby="fig-olympic-2024-title" style="display:block;margin:0 auto;max-width:100%;height:auto;font-family:inherit"><title id="fig-olympic-2024-title">Number of candidate cities for the 2024 Summer Olympics: 5, 4, 3, 2, 2</title><g fill="currentColor" text-anchor="middle"><text x="12" y="22" text-anchor="start" font-size="13" opacity="0.7">Candidate cities</text><line x1="20" y1="210" x2="700" y2="210" stroke="currentColor" stroke-width="1" opacity="0.5"/><rect x="50" y="70" width="100" height="140" opacity="0.85"/><rect x="180" y="98" width="100" height="112" opacity="0.7"/><rect x="310" y="126" width="100" height="84" opacity="0.55"/><rect x="440" y="154" width="100" height="56" opacity="0.4"/><rect x="570" y="154" width="100" height="56" opacity="0.4"/><text x="100" y="60" font-size="20" font-weight="700">5</text><text x="230" y="88" font-size="20" font-weight="700">4</text><text x="360" y="116" font-size="20" font-weight="700">3</text><text x="490" y="144" font-size="20" font-weight="700">2</text><text x="620" y="144" font-size="20" font-weight="700">2</text><g font-size="13"><text x="100" y="232" font-weight="700">2015/9</text><text x="100" y="250">5 cities</text><text x="100" y="267">announced</text><text x="230" y="232" font-weight="700">2015/11</text><text x="230" y="250">Hamburg out</text><text x="230" y="267">after referendum</text><text x="360" y="232" font-weight="700">2016/9</text><text x="360" y="250">Rome out over</text><text x="360" y="267">finances</text><text x="490" y="232" font-weight="700">2017/2</text><text x="490" y="250">Budapest out</text><text x="490" y="267">over petition</text><text x="620" y="232" font-weight="700">2017/9</text><text x="620" y="250">Paris: 2024</text><text x="620" y="267">LA: 2028</text></g></g></svg><figcaption>Figure 1: Number of candidate cities for the 2024 Summer Olympics</figcaption></figure>

The cities dropped out because the cost of hosting was out of proportion to the expected benefit[^olympic-fit]. The same logic appears in the Tullock contest: whenever the expected net payoff of staying in is negative, players would rather leave. This is exactly the key to whether a symmetric equilibrium exists.

To decide whether @eq:n-r-eq-input is a Nash equilibrium, we first compute each player's payoff at the candidate. Everyone spends the same amount, so the winning probability is still $\frac{1}{n}$, and from @eq:n-r-payoff we get:

::: {.equation #eq:n-r-payoff-star}
\pi_i^* = \dfrac{V}{n} - cx_i^* = \dfrac{V}{n} - \dfrac{r(n - 1)V}{n^2} = \dfrac{\left[ n - r(n - 1) \right] V}{n^2}
:::

Now consider a deviation: player $i$ leaves the contest entirely, $x_i = 0$. The others still spend $x^* > 0$, so the player's winning probability is zero, but they also bear no cost, and their payoff is:

$$
\pi_i(0, x_{-i}^*) = 0
$$

If the candidate is an equilibrium, nobody can raise their payoff by leaving, so we need $\pi_i^* \geq 0$. By @eq:n-r-payoff-star, this is equivalent to $n - r(n - 1) \geq 0$, that is:

::: {.equation #eq:n-r-condition}
r \leq \dfrac{n}{n - 1}
:::

This is only a necessary condition. Next we show that it is also sufficient.

::: {.proposition}
# Existence of a symmetric pure-strategy equilibrium

In a Tullock contest with $n \geq 2$ players, the same valuation $V > 0$ of the prize and the same linear cost $cx_i$, a symmetric pure-strategy Nash equilibrium in which everyone spends a positive amount exists if and only if:

$$
0 < r \leq \dfrac{n}{n - 1}
$$

In that case equilibrium spending is $x_i^* = \frac{r(n - 1)V}{cn^2}$.
:::

::: {.proof}
**Necessity.** In a symmetric equilibrium where everyone spends a positive amount, each player's spending is an interior optimum and must satisfy @eq:n-r-foc, so it can only be @eq:n-r-eq-input. If $r > \frac{n}{n - 1}$, then $\pi_i^* < 0 = \pi_i(0, x_{-i}^*)$, so leaving is a profitable deviation, the candidate is not an equilibrium, and no such equilibrium exists.

**Sufficiency.** Let $r \leq \frac{n}{n - 1}$ and let all other players spend $x^*$. Let player $i$ spend $x_i = tx^*$ with $t \geq 0$, and divide their payoff by $V$. Since $\frac{cx^*}{V} = \frac{r(n - 1)}{n^2}$, we get:

$$
f(t) = \dfrac{\pi_i(tx^*, x_{-i}^*)}{V} = \dfrac{t^r}{t^r + n - 1} - \dfrac{r(n - 1)}{n^2}t
$$

We want to show that $t = 1$ is the maximum of $f$ over $t \geq 0$. Differentiating with respect to $t$:

$$
f'(t) = r(n - 1) \left[ h(t) - \dfrac{1}{n^2} \right], \qquad h(t) = \dfrac{t^{r - 1}}{(t^r + n - 1)^2}
$$

One can verify that $h(1) = \frac{1}{n^2}$, so $f'(1) = 0$. Differentiating $h$ once more, its sign depends on:

$$
(r - 1)(n - 1) - (r + 1)t^r
$$

- If $0 < r \leq 1$: the expression above is negative for all $t > 0$, so $h$ is strictly decreasing. Then $f'(t)$ is positive for $t < 1$ and negative for $t > 1$, and $t = 1$ is the global maximum
- If $1 < r \leq \frac{n}{n - 1}$: the expression changes sign only once, from positive to negative at $t_m = \left[ \frac{(r - 1)(n - 1)}{r + 1} \right]^{1/r}$, so $h$ first rises and then falls, with $h(0^+) = 0$ and $h(t) \to 0$ as $t \to \infty$. Also, $t_m < 1$ is equivalent to $r(n - 2) < n$, which holds when $r \leq \frac{n}{n - 1}$ (and always for $n = 2$), so $t = 1$ lies on the decreasing part of $h$, and $h(t_m) > h(1) = \frac{1}{n^2}$. The equation $h(t) = \frac{1}{n^2}$ therefore has exactly two roots: $t = 1$ and some $t_0 \in (0, t_m)$. Then $f$ is decreasing on $(0, t_0)$, increasing on $(t_0, 1)$ and decreasing on $(1, \infty)$, so its maximum over $t \geq 0$ must be $\max \{ f(0), f(1) \}$

In the second case, $f(0) = 0$, and $f(1) = \frac{n - r(n - 1)}{n^2} \geq 0$ is exactly @eq:n-r-condition, so the maximum is attained at $t = 1$. In both cases $x^*$ is a best response to all non-negative spending levels, and the candidate is a Nash equilibrium. $\blacksquare$
:::

The proof also shows why the first-order condition alone is not enough when $r > 1$: on the interval $(0, t_0)$ the payoff is decreasing, $t = t_0$ is a local minimum, and on this side of it the best choice is to leave, $t = 0$.

In equilibrium, each player's expected prize is $\frac{V}{n}$, and the cost they pay is:

$$
cx_i^* = \dfrac{r(n - 1)}{n} \cdot \dfrac{V}{n}
$$

That is, each player spends $\frac{r(n - 1)}{n}$ times their expected prize on competing. @eq:n-r-condition says that this ratio cannot exceed 1: nobody spends more than the expected prize to win it. The larger $r$ is, the more spending decides the outcome, and the less anyone dares to spend less; the larger $n$ is, the more the opponents spend in total, and the more one has to spend to keep up. Both push spending up, and once it exceeds the expected prize, staying in the contest loses money, so leaving is better, just like the cities that withdrew from the bidding.

So the more players there are, the lower the contest intensity at which everyone can still stay in:

| Number of players $n$ | Maximum contest intensity $\frac{n}{n - 1}$ |
| --- | --- |
| 2 | 2.000 |
| 3 | 1.500 |
| 4 | 1.333 |
| 5 | 1.250 |
| 10 | 1.111 |
| 20 | 1.053 |

For example, when $r = 1.4$, the three-player contest satisfies $1.4 \leq 1.5$, and each player's equilibrium payoff is $\frac{[3 - 1.4 \times 2]V}{9} = \frac{0.2V}{9} > 0$. The four-player contest does not satisfy $1.4 \leq 1.333$, and the same calculation gives $\frac{[4 - 1.4 \times 3]V}{16} = -\frac{0.2V}{16} < 0$, so every player would rather leave.

Finally, note that what we have proved is only the condition for the existence of a **symmetric pure-strategy equilibrium in which everyone spends a positive amount**. When $r > \frac{n}{n - 1}$, such an equilibrium does not exist, but that does not mean there is no equilibrium at all: equilibria of other forms, such as mixed-strategy ones, may exist. For the two-player case, see the literature cited above.

## Rent Dissipation

Bitcoin mining is a real-world Tullock contest. Miners commit computing power to compete for the reward of the next block, and the chance of finding the block is proportional to a miner's share of the network's total computing power @citep[schar2020cryptocurrencies]. The block reward is set by the protocol and does not depend on how much miners spend, so the electricity and equipment they use are resources spent to win the reward. The Cambridge Centre for Alternative Finance (CCAF) estimates that Bitcoin mining used about 95.5 TWh of electricity in 2022, roughly 0.38% of global electricity consumption @citep[neumueller2023cbeci].

Whether this amount of electricity is large or small compared with the reward is exactly the question of this section[^btc-fit].

### The Rent Dissipation Rate

[The previous post](/articles/tullock/tullock-introduction-en/#Rent-Dissipation) defined the **rent dissipation rate** as the ratio of total contest cost to the value of the prize. In a contest with $n$ players, it is:

$$
D = \dfrac{\sum_{i = 1}^{n} cx_i}{V}
$$

In the symmetric equilibrium, each player spends $x^* = \frac{r(n - 1)V}{cn^2}$, so:

::: {.equation #eq:n-dissipation}
D^* = \dfrac{n \cdot cx^*}{V} = \dfrac{n}{V} \cdot \dfrac{r(n - 1)V}{n^2} = \dfrac{r(n - 1)}{n}
:::

From @eq:n-dissipation we see that the rent dissipation rate depends only on the contest intensity $r$ and the number of players $n$, not on the value of the prize $V$ or the unit cost $c$. This is because changes in $V$ and $c$ are offset by proportional changes in equilibrium spending, which agrees with the result of @citet[schar2020cryptocurrencies] for $r = 1$.

Substituting @eq:n-dissipation back into @eq:n-r-payoff-star gives each player's equilibrium payoff:

$$
\pi_i^* = \dfrac{V}{n} - cx^* = \dfrac{V}{n} - D^* \cdot \dfrac{V}{n} = \dfrac{(1 - D^*)V}{n}
$$

That is, of the prize $V$, an amount $D^*V$ is spent on the contest, and only $(1 - D^*)V$ is left to be shared among the $n$ players. Here is $D^*$ for a few parameter values:

| Number of players $n$ | $r = 0.5$ | $r = 1$ | $r = 1.5$ |
| --- | --- | --- | --- |
| 2 | 0.250 | 0.500 | 0.750 |
| 3 | 0.333 | 0.667 | 1.000 |
| 5 | 0.400 | 0.800 | — |
| 10 | 0.450 | 0.900 | — |
| $\infty$ | 0.500 | 1.000 | — |

A dash in the table means $r > \frac{n}{n - 1}$, where no symmetric pure-strategy equilibrium with positive spending by everyone exists (see the previous section).

Two trends are visible in the table:

- For fixed $r$, $D^*$ increases with $n$. The more players, the larger the share spent on competing
- For fixed $n$, $D^*$ increases with $r$. The more spending decides the outcome, the more resources are spent on competing

### The Boundary of Full Dissipation

Can the rent dissipation rate exceed 1? In other words, can all the players together spend more than the prize itself?

Look at @eq:n-dissipation first. If we ignore the existence condition and treat the candidate as an equilibrium, then for $r > \frac{n}{n - 1}$ we would get $D^* = \frac{r(n - 1)}{n} > 1$, which looks like overdissipation.

But the previous section showed that in this case each player's expected payoff is negative (@eq:n-r-payoff-star), and leaving the contest is better. So this candidate is not an equilibrium at all. The overdissipation here is just an illusion that comes from mistaking the solution of the first-order condition for an equilibrium. Restricted to the range where the equilibrium exists, @eq:n-r-condition immediately gives:

$$
D^* = \dfrac{r(n - 1)}{n} \leq 1
$$

So **a rent dissipation rate of at most 1 and the existence of the equilibrium are in fact the same condition**: nobody spends more than the expected prize to win it, because they can always choose not to take part. The boundary $D^* = 1$ occurs at $r = \frac{n}{n - 1}$, that is, $n = \frac{r}{r - 1}$ (for $r > 1$). There each player's equilibrium payoff is zero, and the prize is fully dissipated.

For the two-player contest this conclusion has a more complete version. @citet[baye1994solution] point out that when $r > 2$, the solution of the symmetric first-order condition gives a negative expected payoff, which is worse than not spending, while total spending exceeds the prize, so this is only the illusion of overdissipation. They further prove that when $r > 2$ there is no symmetric pure-strategy equilibrium of this kind, but there is a symmetric mixed-strategy equilibrium, and overdissipation does not occur in any Nash equilibrium. For $n = 2$, the limit in @eq:n-r-condition is exactly $r \leq 2$, which matches their dividing line. This post deals only with symmetric pure-strategy equilibria, and dissipation under mixed-strategy equilibria is outside its scope.

The other extreme is free entry. With $r = 1$, however many players take part, each player's equilibrium payoff is $\pi_i^* = \frac{V}{n^2} > 0$, so as long as entry has no barrier, new players keep joining. Then $n \to \infty$, and:

$$
\lim_{n \to \infty} D^* = \lim_{n \to \infty} \dfrac{n - 1}{n} = 1
$$

This is **full rent dissipation**: under free entry, the whole prize is used up by the cost of competing for it. @citet[schar2020cryptocurrencies] also notes that in a model of Bitcoin mining, the dissipation rate approaches 1 as the number of potential miners grows.

One last point: $D^* \leq 1$ holds only when each player bears their own cost. The analysis of @citet[schar2020cryptocurrencies] shows that if part of the computing power is not paid for by the decision maker (for example, botnets of hacked computers), the dissipation rate can exceed 1, because those players cannot avoid the loss by leaving.

## Numerical Simulation

All the results above are analytical solutions. In this section we check them in a different way: without using any formula, we compute each player's best response numerically, then let all players respond to the others' spending in turn, and repeat until nobody wants to change. The point we end at is a Nash equilibrium. Finally we compare it with the analytical solution.

The simulator below lets you change the number of players $n$, the contest intensity $r$, the prize $V$ and the unit cost $c$, and the results are computed in your browser in real time. You can also [download](https://oiebjktmnefstbzgyhdg.supabase.co/storage/v1/object/public/code/tullock-sim/tullock-sim-en.zip) the Python version of the code and run it yourself.

<div class="tullock-sim" data-kind="n-player" data-zip="https://oiebjktmnefstbzgyhdg.supabase.co/storage/v1/object/public/code/tullock-sim/tullock-sim-{lang}.zip"></div>

### Number of Players and Equilibrium Spending

Start with the **By number of players** tab. The horizontal axis is the number of players $n$, the solid line is the rent dissipation rate $D^* = \frac{r(n - 1)}{n}$, the dashed line is each player's cost as a share of the prize, $\frac{cx_i^*}{V} = \frac{r(n - 1)}{n^2}$, and the dots are equilibria computed numerically, without using the formula.

Try changing the parameters:

- With the default values $r = 1$, $V = 100$, $c = 1$, all the dots lie on the curves. For $n = 5$ the numerical equilibrium is $x_i^* = 16$, the rent dissipation rate is $0.8$, and the individual expected payoff is $4 = \frac{V}{n^2}$, which matches @eq:n-eq-input, @eq:n-dissipation and @eq:n-payoff.
- Raise $n$ and the dashed line falls while the solid line approaches 1: each player pays a smaller and smaller share, but together they get closer and closer to the whole prize.
- Push $n$ up to $1000$: $x_i^* = \frac{(n - 1)V}{cn^2} \approx 0.0999$, the rent dissipation rate is $0.999$, and the individual expected payoff is only $\frac{V}{n^2} = 0.0001$, consistent with the limit in @eq:n-limit. With such a large $n$, iterating player by player is too slow, so the simulator solves only the symmetric equilibrium, in which everyone spends the same amount, that is, it solves $BR(x) = x$, and the horizontal axis switches to a logarithmic scale.
- Switch to the **Iteration** tab. Each line is one player's spending. The starting points are deliberately set apart, but all lines end up at the same value, which confirms that the equilibrium in the proposition is symmetric.

### Contest Intensity and the Range of Existence

Set $r$ to $1.4$ and compare $n = 3$ with $n = 4$.

- With $n = 3$, $1.4 \leq 1.5$, so the existence condition holds. The numerical equilibrium is $x_i^* \approx 31.11$, and the individual expected payoff is $2.22 = \frac{0.2V}{9}$.
- With $n = 4$, $1.4 > 1.333$, so the existence condition fails. Switch to the **Deviation test** tab. The curve shows the payoff of one player who spends $tx^*$ while all the others spend the candidate $x^*$. The open dot marks $t = 1$, where the payoff is below zero, about $-0.0125V$, and the filled dot sits at $t = 0$, so leaving is the best choice. This is exactly the case where @eq:n-r-payoff-star is negative.

This does not mean there is no equilibrium at all for $n = 4$, though. Go back to the **By number of players** tab: the point at $n = 4$ has become an open circle, which means that only some of the players spend. Three players spend $31.11$ each, one stays out, and the rent dissipation rate is $0.933$, which does not exceed 1. This agrees with the earlier reminder: @eq:n-r-condition is only the existence condition for a symmetric pure-strategy equilibrium in which everyone spends a positive amount.

Now drag $n$ further to the right, and the open circles line up in a horizontal line. However large $n$ gets, the equilibrium stays the same: three players spend and the rest stay out, and the rent dissipation rate stays at $0.933$. If we forced the formula $D = \frac{r(n - 1)}{n}$ onto this case, it would exceed 1 for large $n$, but that is no longer an equilibrium, since the extra loss can be avoided by leaving. Setting $r$ to $1.05$ gives the same shape: the range where everyone is in extends to $n = 20$, after which the line again turns horizontal, with the rent dissipation rate at about $0.997$.

Finally, set $n$ to $3$ and $r$ to the boundary value $1.5$. The symmetric solution with everyone in still exists, but the payoff is exactly zero, and in the deviation test $t = 1$ and $t = 0$ are equally high. Starting from an asymmetric point, the iteration stops at $x = (0, 37.5, 37.5)$, which is another equilibrium. For $r > 1$ there is more than one equilibrium, and which one the iteration reaches depends on the starting point.

You can change the starting point yourself. The default start is far from the equilibrium; if you tick **Start near the closed form**, the start moves to within 20% of the closed-form solution. For example, with $V = 30$, $c = 2.9$, $r = 1.05$ and $n = 12$, the default start ends at an equilibrium where 11 players spend and one stays out, while the ticked option converges to the symmetric solution with everyone in, $x^* \approx 0.83$. Conversely, with $r = 1.4$ and $n = 3$, the default start converges to the symmetric solution, but the ticked option ends at $x = (0, 35, 35)$. Both results are equilibria; the different starting points just lead to different ones.

## Conclusion

[^hq2-fit]: HQ2 does not match the model perfectly. The winner was decided by Amazon's own evaluation, not by a probability function like $\frac{x_i}{\sum_j x_j}$, and the headquarters was eventually split between two sites, so the prize was not indivisible @citep[silverstein2018hq2]. The tax incentives that cities promised are transfers to Amazon, not a use of resources, so only spending such as consultants, research and marketing corresponds to the spending $x_i$ in the model.

[^hrc-time]: The lottery takes place only among applications that have passed the review, and applicants still have to write a good enough application to clear the bar, so this is not the same as $r \to 0$ in the model. In fact, in the HRC applicant survey, 75% of respondents said the lottery did not change the time they spent preparing their applications @citep[liu2020lottery].

[^olympic-fit]: The main reasons the cities withdrew were the cost of hosting and political uncertainty @citep[wikipedia2024bids], not resources spent to win a prize, so this example does not correspond directly to the model. We borrow only the intuition that players leave when the expected net payoff is negative.

[^btc-fit]: This example differs from the model in several ways: miners' costs are not only electricity but also equipment; costs vary a lot between miners; and the computing power spent on mining also protects the security of the blockchain, so not all of it is waste @citep[schar2020cryptocurrencies]. Also, 95.5 TWh is only an electricity figure. To compute a dissipation rate we would need the price of electricity and the market value of the rewards, which we do not calculate here.

## References

[references]
