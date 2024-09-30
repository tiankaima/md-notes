# Linear Regression 线性回归

$$
J(\theta) = \frac 12 \displaystyle\sum_{i=1}^{n} \left(h_\theta \left(x^{(i)}\right) - y^{(i)} \right)^2
$$

几个视角下的线性回归：

1.  (对每个参数 $\theta_j$ 的) 梯度下降：

    $$
    \frac{\partial}{\partial \theta_j} J(\theta) = \displaystyle\sum_{i=1}^{n} \left(h_\theta \left(x^{(i)}\right) - y^{(i)} \right) x_j^{(i)}
    $$

    在此基础上就有两种更新的思路：

    -   对全样本进行更新，即批量梯度下降 (Batch Gradient Descent): $\theta_j \leftarrow \theta_j - \alpha \displaystyle\sum_{i=1}^{n} \left(h_\theta \left(x^{(i)}\right) - y^{(i)} \right) x_j^{(i)}$
    -   对每个样本进行更新，即随机梯度下降 (Stochastic Gradient Descent), 随机选取一个样本 $i$ 进行更新：$\theta_j \leftarrow \theta_j - \alpha \left(h_\theta \left(x^{(i)}\right) - y^{(i)} \right) x_j^{(i)}$

2.  梯度下降实际上并不能得到闭形式 (Closed-form) 解，但是在 Linear Regression 中这样的最优参数显然是能计算得到的：

    $$
    \begin{aligned}
    \nabla_\theta J(\theta) &= \frac 12 \nabla_\theta \left(X\theta - y \right)^T\left(X\theta - y \right) \\
        &= \frac 12 \nabla_\theta \left((X\theta)^T (X \theta) - (X\theta)^T y - y^T (X\theta) + y^T y\right) \\
        &= \frac 12 \nabla_\theta \left((\theta^T (X^T X) \theta - 2  y^T (X\theta) + \cancel{y^T y}\right) \\
        &= X^TX\theta - X^Ty
    \end{aligned}
    $$

    令 $\nabla_\theta J(\theta) = 0$，解得 $\theta = (X^TX)^{-1}X^Ty$

    ??? note "$(X^T X)^{-1} X^T y$ 不展开的原因"

        推导的时候犯了迷糊，$X$ 不能保证是方阵，尤其是在这个语境下，Sample 数总是会比 Feature 多的，多出几个数量级的。 $X^T X$ 虽然是方阵，也存在欠定的可能，具体到这里的例子中，那说明两个 Feature 之间线性关系过强，所以才丢 Rank. (或者 Feature 数量多于 Sample 数量也会导致欠定)

        在这个时候才发现线代习题的实际意义... 有趣

3.  从极大似然估计的角度考虑：反推 Cost Function

    一个蛮有趣的角度，就是推导起来有点麻烦：

    我们假定 $y^{(i)} = \theta^T x^{(i)} + \epsilon^{(i)}$，其中 $\epsilon^{(i)}$ 是一个服从高斯分布的随机变量，即 $\epsilon^{(i)} \sim \mathcal{N}(0, \sigma^2)$

    也就是说：

    $$
    p(\epsilon^{(i)}) = \frac 1 {\sqrt{2\pi}\sigma} \exp\left(-\frac 1 2 \frac{(\epsilon^{(i)})^2}{\sigma^2}\right)
    $$

    代入 $\epsilon^{(i)} = y^{(i)} - \theta^T x^{(i)}$，我们就有：

    $$
    p(y^{(i)}|x^{(i)};\theta) = \frac 1 {\sqrt{2\pi}\sigma} \exp\left(-\frac 1 2 \frac{(y^{(i)} - \theta^T x^{(i)})^2}{\sigma^2}\right)
    $$

    !!! note

        考虑到 $\theta$ 并不是随机变量，而是模型参数，所以我们不写成 $\cancel{p(y^{(i)}|x^{(i)},\theta)}$，而是 $p(y^{(i)}|x^{(i)};\theta)$

    接下来是比较关键的思路转变，其实也就是什么是似然估计。上面的公式给出了在这个模型下，随机变量 $y^{(i)}$ 随输入 $x^{(i)}$ 的条件概率分布。但是我们现在缺少关于 $\theta$ 的信息，而手中已经有一些关于 $(x^{(i)}, y^{(i)})$ 的数据。

    所以我们估计一个 $\theta$，使得给定数据的条件概率最大，即极大似然估计：

    $$
    L^{(i)}(\theta) = p(y^{(i)}|x^{(i)};\theta)
    $$

    如果认为样本中独立同分布，将所有样本考虑进来：

    $$
    L(\theta) = \displaystyle\prod_{i=1}^{n} p(y^{(i)}|x^{(i)};\theta)
    $$

    为了方便计算，我们取对数：

    $$
    l(\theta) = \log L(\theta) = \displaystyle\sum_{i=1}^{n} \log p(y^{(i)}|x^{(i)};\theta)
    $$

    $L(\theta)$ 的最大值点和 $l(\theta)$ 的最大值点是一样的，所以我们只需要考虑 $l(\theta)$ 的最大值点，将上面的条件概率代入：

    $$
    \DeclareMathOperator*{\argmax}{arg\,max}
    \theta = \argmax_\theta \displaystyle\sum_{i=1}^{n} \log \left(\cdots\right) \cdot \left(-\frac 1 2 \frac{(y^{(i)} - \theta^T x^{(i)})^2}{\sigma^2}\right)
    $$

    最后就又回到优化最小的 Cost Function 上来，因此这几个思路都是统一的。
