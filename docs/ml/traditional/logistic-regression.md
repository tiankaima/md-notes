# Logistic Regression 逻辑回归

考虑 2-Class Classification 问题，我们希望找到一个函数 $h_\theta(x)$，使得对于任意输入 $x$，我们都能够预测出 $y \in \{0, 1\}$。

我们可以使用 Logistic Function 来实现这个目标：

$$
g(x) = \frac 1 {1 + e^{-x}}
$$

!!! note

    好多参考内容在这里喜欢添油加醋的说一句它的导数计算的问题, 大概是这样:

    $$
    \frac {\mathrm{d}}{\mathrm{d}x} g(x) = g(x)(1 - g(x))
    $$

    其实也可以拿这个作为微分方程反过来推 $g(x)$ 的形式, 结果是这样:

    $$
    g(x) = \frac 1 {C + e^{-x}}
    $$

    <!-- Double Check, 在草纸上推的 -->

    然后只需要考虑两个极限 $x \to \infty$ 和 $x \to -\infty$，就能得到 $C = 1$。

    导数容易计算, 而且性质很好的函数, 大概是这个意思。

Logistic Function 显然并没有直接给出一个 $\{0,1\}$ 的分类结果 (不过如果有这样的东西再用 $l_1$ cost 真的能跑通吗？)，我们可以将其视为一个概率值，即：

$$
\begin{cases}
p(y=1|x;\theta) &= h_\theta(x) = g(\theta^T x)\\
p(y=0|x;\theta) &= 1 - h_\theta(x)
\end{cases}
$$

