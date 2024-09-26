# 概率论

## Questions

### 2024-09-06 两个数互素的概率

> Also see https://math.stackexchange.com/questions/64498/probability-that-two-random-numbers-are-coprime-is-frac6-pi2
>
> 因为很有趣所以对照翻译一遍。

按照这样的思路考虑两个数互素 (_coprime_) 的概率：

-   两个数都是 $2$ 的倍数的概率：$\frac{1}{4}$.
-   两个数都是 $3$ 的倍数的概率：$\frac{1}{9}$.
-   $\cdots$
-   两个数都是 $p$ 的倍数的概率：$\frac{1}{p^2}$.

所以两个数互素的概率是：

$$
\prod_{p \in \text{prime}} \left(1-\frac{1}{p^2}\right)
$$

接下来的处理方式是：

$$
\prod_{p \in \text{prime}} \left(1-\frac{1}{p^2}\right) = \left(\prod_{p \in \text{prime}}\frac{1}{1-p^{-2}} \right)^{-1}
$$

回顾

$$
\begin{aligned}
\frac{1}{1-x} &= 1 + x + x^2 + \cdots \\
\frac{1}{1-p^{-2}} &= 1 + \frac{1}{p^2} + \frac{1}{p^4} + \cdots \\
\end{aligned}
$$

因此有：

$$
\prod_{p \in \text{prime}}\frac{1}{1-p^{-2}} = (1 + \frac{1}{2^2} + \frac{1}{2^4} + \cdots)\times (1 + \frac{1}{3^2} + \frac{1}{3^4} + \cdots) \times \cdots
$$

注意到这实际上「组合」出了所有正整数，因为这样的映射是一一对应的：

$$
x = p_1^{i_1} \cdot p_2^{i_2} \cdots p_n^{i_n}
$$

其中 $p_i$ 是素数，$i_i$ 是非负整数。因此有：

$$
\prod_{p \in \text{prime}}\frac{1}{1-p^{-2}} = \sum_{n=1}^{\infty} \frac{1}{n^2} = \zeta(2) = \frac {\pi^2}{6}
$$

$\zeta(2)$ 的计算可以 [参考](/math/analysis/fourier/#zeta2), 原问题的答案是：

$$
\left(\prod_{p \in \text{prime}}\frac{1}{1-p^{-2}} \right)^{-1} = \zeta(2)^{-1} = \frac{6}{\pi^2}
$$
