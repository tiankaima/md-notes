# Logistic Regression 逻辑回归

考虑 2-Class Classification 问题，我们希望找到一个函数 $h_\theta(x)$，使得对于任意输入 $x$，我们都能够预测出 $y \in \{0, 1\}$。

我们可以使用 Logistic Function 来实现这个目标：

$$
g(z) = \frac 1 {1 + e^{-z}}
$$

!!! note

    好多参考内容在这里喜欢添油加醋的提一下它的导数计算的问题, 大概是这样:

    $$
    \frac {\mathrm{d}}{\mathrm{d}z} g(z) = g(z)(1 - g(z))
    $$

    其实也可以拿这个作为微分方程反过来推 $g(z)$ 的形式, 结果是这样:

    $$
    g(z) = \frac 1 {C \cdot e^{-z} + 1}
    $$

    考虑 $g(0) = 1 / 2$, 因此 $C=1$. 我们得到了 Sigmoid 这样一个导数容易计算, 而且性质很好的函数, 大概是这个意思。

有了 Logistic Function 之后我们将模型假设为：

$$
h_\theta(x) = g(\theta^T x) = \frac 1 {1 + e^{-\theta^T x}}
$$

这样我们就可以得到：

$$
\begin{cases}
p(y=1|x;\theta) &=h_\theta(x)\\
p(y=0|x;\theta) &=1 - h_\theta(x)
\end{cases}
$$

与 Linear Regression 的部分类似，我们同样提供两种等价的视角来得到 $\theta$ 的最优解。

-   MLE: 极大似然估计

    对于样本 $(x^{(i)}, y^{(i)})$，我们有：

    $$
    p(y^{(i)}|x^{(i)};\theta) = (h_\theta(x^{(i)}))^{y^{(i)}}(1 - h_\theta(x^{(i)}))^{1 - y^{(i)}}
    $$

    考虑所有样本，将概率视作参数的函数：

    $$
    \begin{aligned}
    L(\theta) &= \displaystyle\prod_{i=1}^{n} p(y^{(i)}|x^{(i)};\theta)\\
        &= \displaystyle\prod_{i=1}^{n} (h_\theta(x^{(i)}))^{y^{(i)}}(1 - h_\theta(x^{(i)}))^{1 - y^{(i)}}
    \end{aligned}
    $$

    为了方便计算，我们取对数：

    $$
    l(\theta) = \log L(\theta) = \displaystyle\sum_{i=1}^{n} y^{(i)} \log h_\theta(x^{(i)}) + (1 - y^{(i)}) \log (1 - h_\theta(x^{(i)}))
    $$

    得到最大化的优化目标。

-   Cost Function

    我们构造这样一个 Cost Function $l (t,y): (0,1) \times \{0, 1\} \rightarrow \left[0, +\infty \right)$, 特殊在与它衡量 $h_\theta(x) \in (0,1) $ 与标签 $y \in \{0, 1\}$ 之间的差距：

    $$
    l(t,y) \triangleq -y \log t - (1 - y) \log (1 - t)
    $$

    !!! note

        这里有的文献会以另一种角度介绍这个距离函数，将 Sigmoid 视作距离函数的一部分，而不是 $h_\theta(x)$ 的一部分，形式如下：

        $$
        l_{\text{logistic}}(t, y) \triangleq -y \log \left(\frac 1 {1 + e^{-t}}\right) - (1 - y) \log \left(1 - \frac 1 {1 + e^{-t}}\right)
        $$

然后考虑 Gradient Descent 的问题：

$$
\frac{\partial}{\partial \theta_j} l(\theta) = \displaystyle\sum_{i=1}^{n} \left(h_\theta(x^{(i)}) - y^{(i)}\right)x_j^{(i)}
$$

SGD 保持一个类似的形式：

$$
\theta_j \leftarrow \theta_j - \alpha \left(h_\theta(x^{(i)}) - y^{(i)}\right)x_j^{(i)}
$$
