# 泛函分析

## 常见空间

### $l_p$ 空间 {#countable-lp-norm}

$l_p$ 空间的定义：

$$
l_p = \left\{\mathbf{x} = (x_1, x_2, \ldots) \left| \sum_{i=1}^{\infty} \left| x_i \right|^p < \infty\right.\right\}
$$

### $L^p$ 空间 {#lp-space}

$L^p$ 空间的定义：

$$
\mathcal{L}ƒ^p(X,\mu) = \left\{f: X \to \mathbb{R} \left| \int_X \left| f(x) \right|^p \mathrm{d}x < \infty\right.\right\}
$$

???+ note "等价关系"

    严格来说，上面的定义并不是 $L^p(X,\mu)$, 而是 $\mathcal{L}^p(X,\mu)$, 因为 $\lVert \cdot \rVert_p$ 只构成一个半范数，而不是范数。采取一个较为标准的拓扑方法，只需要考虑 $\mathcal{L}^p(X,\mu)$ 满足 $\lVert f \rVert_p = 0$ 的全部函数：

    $$
    N = \left\{f: X \to \mathbb{R} \left| \int_X \left| f(x) \right|^p \mathrm{d}x = 0\right.\right\}
    $$

    即 $f \rightarrow \lVert f \rVert_p$ 的零空间。对于可测函数来说 $\lVert f\rVert_p = 0 \Leftrightarrow \mu \left(f\neq 0\right) = 0$. 只需要将 $L_p(X,\mu)$ 定义为 $\mathcal{L}^p(X,\mu)/N$ 即可。

## Fubini / Tonelli 定理

-   Fubini 定理：考虑 $f(x,y)$ 在 $X\times Y$ 的一个矩形区域上 Lebesgue 可积，即

$$
\int_{X\times Y} \left| f(x,y) \right| \mathrm{d}(x,y) < \infty
$$

那么：

$$
\int_{X\times Y} f(x,y) \mathrm{d}(x,y) = \int_X \left(\int_Y f(x,y) \mathrm{d}y\right) \mathrm{d}x = \int_Y \left(\int_X f(x,y) \mathrm{d}x\right) \mathrm{d}y
$$

-   Tonelli 定理：考虑 $f(x,y)$ 在 $X\times Y$ 的一个矩形区域上非负可测，即：$f: X\times Y \to [0, \infty]$, 那么：

$$
\int_{X\times Y} f(x,y) \mathrm{d}x\mathrm{d}y = \int_X \left(\int_Y f(x,y) \mathrm{d}y\right) \mathrm{d}x = \int_Y \left(\int_X f(x,y) \mathrm{d}x\right) \mathrm{d}y
$$

## 卷积 Convolution

### 定义

-   连续情况：

    考虑 $L^1$ 上的两个函数 $f(x)$ 和 $g(x)$，它们的卷积定义为：

    $$
    (f * g)(x) = \int_{-\infty}^{\infty} f(x - t) g(t) \mathrm{d} t
    $$

    !!! note ""

        考虑定义域限制 $f, g: [0,\infty) \to \mathbb{R}$，则卷积操作变为：

        $$
        (f * g)(x) = \int_{0}^{x} f(x - t) g(t) \mathrm{d}t
        $$

        > 实际上是上面定义的自然推广，只需补充 $f, g: (-\infty,0) \to \{0\}$ 即可。

    一般的，对于 $L^1\left(\mathbb{R}^n\right)$ 上的函数，卷积定义为：

    $$
    (f * g)(\mathbf{x}) = \int_{\mathbb{R}^n} f(\mathbf{x} - \mathbf{t}) g(\mathbf{t}) \mathrm{d}\mathbf{t}
    $$

-   离散情况：

    考虑 $l^1$ 上的两个序列 $\{f_n\}$ 和 $\{g_n\}$，它们的卷积定义为：

    $$
    (f * g)_n = \sum_{k=-\infty}^{\infty} f_{n-k} \cdot g_k
    $$

### 性质

-   交换性，即 $(f * g)(x) = (g * f)(x)$

-   对 $f, g\in L^1\left(\mathbb{R}^n\right)$, $f*g$ 存在，而且 $f*g \in L^1\left(\mathbb{R}^n\right)$

    -   更一般的， $f\in L^1\left(\mathbb{R}^n\right)$, $g\in L^p\left(\mathbb{R}^n\right)$, $1\leq p\leq \infty$, 则 $f*g \in L^p\left(\mathbb{R}^n\right)$, 且有：

        $$
        \left\| f*g \right\|_p \leq \left\| f \right\|_1 \left\| g \right\|_p
        $$

-   与 Fourier 变换 之间的联系：

    $$
    \mathcal{F}\left[f*g\right] = \mathcal{F}\left[f\right] \cdot \mathcal{F}\left[g\right]
    $$

-   微分/积分特性，下面 $h = f * g$

    $$
    h'(t) = \left(f * g\right)'(t) = f'(t) * g(t) = f(t) * g'(t)
    $$

    $$
    \int_{-\infty}^{\infty} h(t) \mathrm{d}t = \left(\int_{-\infty}^{\infty} f(t) \mathrm{d}t\right) * g(t) = f(t) * \left(\int_{-\infty}^{\infty} g(t) \mathrm{d}t\right)
    $$

    $$
    h(t) = f'(t) * \left(\int_{-\infty}^{\infty} g(t) \mathrm{d}t\right) = \left(\int_{-\infty}^{\infty} f(t) \mathrm{d}t\right) * g'(t)
    $$

-   特别的，考虑 $\delta (t)$:

    -   $f(t) * \delta(t) = f(t)$
    -   $f(t) * \delta(t - t_0) = f(t - t_0)$
    -   $f(t) * \delta'(t) = f'(t) * \delta(t) = f'(t)$
    -   $f(t) * \delta^{(n)}(t) = f^{(n)}(t) * \delta(t) = f^{(n)}(t)$
    -   $\displaystyle f(t) * \int_{-\infty}^{t} \delta(t) \mathrm{d}t = \int_{-\infty}^{t} f(t) \mathrm{d}t = F(t)$
