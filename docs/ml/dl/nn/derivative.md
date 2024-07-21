# Derivative 导数

本文讨论 Neural Network 中与导数相关的内容。

## 激活函数 _Activation Function_

我们先给出几种激活函数的导数：

???+ note "Sigmoid & Tanh"

    -   Sigmod (1)
        { .annotate }

        1.  ![](./imgs/sigmoid.png)

        $$
        f(x) = \frac{1}{1 + e^{-x}}
        $$

        $$
        f'(x) = \frac{e^{-x}}{(1 + e^{-x})^2} = f(x)(1 - f(x))
        $$

    -   Tanh (1)
        { .annotate }

        1.  ![](./imgs/tanh.png)

        $$
        f(x) = \frac{e^x - e^{-x}}{e^x + e^{-x}}
        $$

        $$
        f'(x) = \frac{4}{(e^x + e^{-x})^2} = 1 - f(x)^2
        $$

??? note "ReLU & Leaky ReLU"

    -   ReLU (1)
        { .annotate }

        1.  ![](./imgs/relu.png)

        $$
        f(x) = \max(0, x)
        $$

        $$
        f'(x) = \begin{cases}
        0 & \text{if } x < 0 \\
        1 & \text{if } x > 0 \\
        \text{undefined} & \text{if } x = 0
        \end{cases}
        $$

    -   Leaky ReLU (1)
        { .annotate }

        1.  ![](./imgs/leaky_relu.png)

        $$
        f(x) = \begin{cases}
        x & \text{if } x > 0 \\
        0.01x & \text{if } x \leq 0
        \end{cases}
        $$

        $$
        f'(x) = \begin{cases}
        1 & \text{if } x > 0 \\
        0.01 & \text{if } x < 0 \\
        \text{undefined} & \text{if } x = 0
        \end{cases}
        $$

-   Softmax: $\mathbb{R}^n \rightarrow \mathbb{R}^n$

    $$
    \mathbf{f}_i(\mathbf{x}) = \frac{e^{x_i}}{\sum_{j=1}^{n} e^{x_j}}
    $$

    $$
    \nabla_{x_j} \mathbf{f}_i(\mathbf{x}) = \mathbf{f}_i(\mathbf{x})(\delta_{i j} - \mathbf{f}_j(\mathbf{x}))
    $$

    ???+ note "Matrix format"

        Consider $\mathbf{f}(\mathbf{x}) = \{f_1(\mathbf{x}), f_2(\mathbf{x}), \ldots, f_n(\mathbf{x})\}$, then

        $$
        \begin{aligned}
        \left(\frac {\partial \mathbf{f} }{\partial \mathbf{x}}\right)_{ij} &= \mathbf{f}_i(\mathbf{x})(\delta_{ij} - \mathbf{f}_j(\mathbf{x})) \\
        &=\mathbf{f}_i(\mathbf{x})\delta_{ij} - \mathbf{f}_i(\mathbf{x})\mathbf{f}_j(\mathbf{x}) \\
        \end{aligned}
        $$

        Then we can write it in matrix form:
        $$
        \frac {\partial \mathbf{f} }{\partial \mathbf{x}} = \mathbf{f}\cdot\mathbf{I} - \mathbf{f}^T\cdot \mathbf{f}
        $$

        $$
        \mathbf{J}(\mathbf{f}) = \begin{pmatrix}
        f_1(1 - f_1) & -f_1 f_2 & -f_1 f_3 & \cdots & -f_1 f_n \\
        -f_2 f_1 & f_2(1 - f_2) & -f_2 f_3 & \cdots & -f_2 f_n \\
        -f_3 f_1 & -f_3 f_2 & f_3(1 - f_3) & \cdots & -f_3 f_n \\
        \vdots & \vdots & \vdots & \ddots & \vdots \\
        -f_n f_1 & -f_n f_2 & -f_n f_3 & \cdots & f_n(1 - f_n)
        \end{pmatrix}
        $$

## 损失函数 _Loss Function_

-   Mean Squared Error (MSE): $\mathbb{R}^n \times \mathbb{R}^n \rightarrow \mathbb{R}$

    $$
    L(\mathbf{y}, \mathbf{\hat{y}}) = \frac{1}{n} \left\lVert \mathbf{y} - \mathbf{\hat{y}} \right\rVert^2
    $$

    $$
    \frac{\partial L}{\partial \hat{y}_i} = \frac 1n \left(\hat{y}_i - y_i\right)
    $$

    Then:

    $$
    \frac{\partial L}{\partial \mathbf{\hat{y}}} = \frac 1n \left(\mathbf{\hat{y}} - \mathbf{y}\right)
    $$

-   Cross Entropy: $\mathbb{R}^n \times \mathbb{R}^n \rightarrow \mathbb{R}$

    $$
    L(\mathbf{y}, \mathbf{\hat{y}}) = -\frac{1}{n} \sum_{i=1}^{n} y_i \log(\hat{y}_i)
    $$

    $$
    \frac{\partial L}{\partial \hat{y}_i} = -\frac{y_i}{\hat{y}_i}
    $$

    Then:

    $$
    \frac{\partial L}{\partial \mathbf{\hat{y}}} = -\frac{\mathbf{y}}{\mathbf{\hat{y}}}
    $$

    !!! note ""

        哪怕在 $\mathbb{R}^3$ 上，向量的叉乘也不成立群，更不要提逆元。上面的除法只是一种形式上的写法，不能理解为向量的除法。
