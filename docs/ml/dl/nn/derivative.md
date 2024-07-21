# Derivative

本文讨论 Neural Network 中与导数相关的内容。

## 激活函数 _Activation Function_

我们先给出几种激活函数的导数：

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

-   Softmax

    $$
    f(x_i) = \frac{e^{x_i}}{\sum_{j=1}^{n} e^{x_j}}
    $$

    $$
    f'(x_i) = f(x_i)(1 - f(x_i))
    $$

## 损失函数 _Loss Function_

-   Mean Squared Error (MSE)

    $$
    L(y, \hat{y}) = \frac{1}{2} (y - \hat{y})^2
    $$

    $$
    \frac{\partial L}{\partial \hat{y}} = \hat{y} - y
    $$
