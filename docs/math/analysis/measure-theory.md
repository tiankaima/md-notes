# 测度论

## 不可测集的构造  {#unmeasurable-set}

在承认 AoC (Axiom of Choice) 的情况下，我们可以构造出不可测集：

在 $[0,1]$ 上构造这样一组等价关系：

$$
x \sim y \Leftrightarrow x - y \in \mathbb{Q}
$$

在这组等价关系的划分下：$\mathcal{A} = [0,1]/\sim$ 被分成了不可数个等价类，他们两两不交：

$$
[0,1] = \bigcup_{\alpha} \mathcal{E}_{\alpha}
$$

接下来我们构造 $\mathcal{N}$, 根据 AoC, 总存在一个 $f: \mathcal{A} \to [0,1]$, 在每个 $\mathcal{E}_{\alpha}$ 中选取一个代表元素，使得 $f$ 是一个双射，也就是说：

$$
\mathcal{N} = f(\mathcal{A})
$$

**我们证明 $\mathcal{N}$ 是不可测集：**

考虑反证，假设 $\mathcal{N}$ 是可测集，令 $\{r_k\}_{k=1}^{\infty}$, 是 $[-1,1]$ 上所有有理数的一个排列。(由于 $\mathbb{Q}$ 是可数集，这样的排列总是存在的), 然后考虑平移变换：

$$
\mathcal{N}_k = \mathcal{N} + r_k
$$

!!! note

    $$
    \forall k_1 \neq k_2, \quad \mathcal{N}_{k_1} \cap \mathcal{N}_{k_2} = \emptyset
    $$

    Proof by contradiction. Suppose $\exists r_{k_1}, r_{k_2} \in \mathbb{Q},\quad x_\alpha, x_\beta \in \mathcal{N}$, then we have:

    $$
    x = x_{\alpha} + r_{k_1} = x_{\beta} + r_{k_2} \quad\Rightarrow\quad x_{\alpha} - x_{\beta} = r_{k_2} - r_{k_1} \in \mathbb{Q}
    $$

在这样的平移变换下，我们注意到：

-   $\displaystyle\bigcup_{k=1}^{\infty} \mathcal{N}_k \subset [-1,2]$. 这是容易注意到的。
-   $\displaystyle [0,1] \subset \bigcup_{k=1}^{\infty} \mathcal{N}_k$

    证明需要重新回顾 $\mathcal{N}$ 的构造方式。对于每个 $x\in [0,1]$, 它总是在一个等价类 $\mathcal{E}_\alpha \in \mathcal{A}$ 中的，也总有一个代表元在 $\mathcal{N}$ 中，aka:

    $$
    \overline{x} = f(\mathcal{E}_\alpha) \in \mathcal{N}
    $$

    满足 $x \sim \overline{x} \Rightarrow x - \overline{x} \in \mathbb{Q}$, 也就是说 $x \in \mathcal{N} + r_k$. $\quad \square$

因此 $\displaystyle [0,1] \subset \bigcup_{k=1}^{\infty} \mathcal{N}_k \subset [-1,2]$. 有：

$$
1 \leq m\left(\bigcup_{k=1}^{\infty} \mathcal{N}_k\right) \leq 3
$$

考虑反证假设，若 $\mathcal{N}$ 是可测集，那么 $\mathcal{N}_k$ 也是可测集，有：

$$
1 \leq m\left(\bigcup_{k=1}^{\infty} \mathcal{N}_k\right) = \sum_{k=1}^{\infty} m(\mathcal{N}_k) \leq 3
$$

这是不可能的，考虑到 $\forall k, \ \ m(\mathcal{N}_k) = m(\mathcal{N})$. 对于以下两种情况都不能满足这个不等式：

-   $m(\mathcal{N}) = 0$
-   $m(\mathcal{N}) > 0$

得到矛盾，所以 $\mathcal{N}$ 是不可测集。$\quad \square$
