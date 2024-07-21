# Backward Propagation

本文讨论神经网络中的反向传播算法 _Backward Propagation_ 的相关内容。

???+ note "记号约定"

    下文中, 除 $n_k$ 用下标表示第 $k$ 层的神经元个数外, 矩阵、函数等均以上标以示区分, 并不代表幂次; 下表用于表示向量值函数的第 $i$ 个元素。

    使用粗体强调的, 例如 $\mathbf{W}$ 意在提醒读者处理的是向量/矩阵, 对应为偏导/Jacobian, 而单独的元素, 例如 $W_{a b}$, 不加粗体以示区分。

## 推导 _Derivation_

对于一个简单的神经网络，我们可以使用链式法则 _Chain Rule_ 来推导反向传播算法。

!!! warning "偏置项"

    为计算方便, 我们下面不讨论偏置项 _bias_，为符合下面的讨论, 对含有偏置项的层 $k$, 做如下处理即可:

    - 在 $k-1$ 层引入一个额外的神经元 $x_{n_{k-1}+1} = 1$，对应的权重 $W_{n_{k-1}+1, j} = b\quad \forall j$，其中 $b$ 是偏置项。

考虑第 $k$ 层的计算，包含两部分：线性算子 $\mathbf{W}^k \in \mathbb{L}\left(\mathbb{R}^{n_{k-1}}, \mathbb{R}^{n_k}\right)$ 和激活函数 $f^k: \mathbb{R}\rightarrow \mathbb{R}$。

-   输入是从上一层 ($k-1$ 层) 拿到的结果 $\mathbf{y}^{k-1} = (x_1, x_2, \ldots, x_{n_{k-1}}) \in \mathbb{R}^{n_{k-1}}$, 输入层记为 $\mathbf{y}^0=\mathbf{x}$。
-   输出则是 $\mathbf{y}^k = (x_1, x_2, \ldots, x_{n_k}) \in \mathbb{R}^{n_k}$。

即：

$$
\mathbf{y}^k = f^k\left(\mathbf{W}^k \mathbf{y}^{k-1}\right)
$$

???+ note "维数问题"

    这里 $\mathbf{W} \in \mathbf{R}^{n_k \times n_{k-1}}$ 线性算子, 也是变换矩阵.

    $f^k: \mathbb{R}^{n_k} \rightarrow \mathbb{R}^{n_k}$ 仅仅是对每个元素应用激活函数 $f$ 的简写。可以依次考虑 $y_i$:

    $$
    y_i^k = f^k\left(\sum_{j=1}^{n_{k-1}} W_{ij}^k y_j^{k-1}\right)
    $$

逐层合并到一起，形式如下：

!!! note "变量的更改"

    按照上面的计算过程, 我们从 $y^0 \rightarrow y^1, \ldots \rightarrow y^k\rightarrow \ldots \rightarrow y^K$ 这样依次得到的, 结果上看是一个 $y^K(y^0)$ 的函数. 考虑到 $y^0$ 是输入, 接下来要对参数求导, 我们重新以参数作为变量整理这个式子.

考虑共 $K$ 层，最后一层的结果是 $y^K$, 损失函数是 $g(\cdot)$. 我们接下来尝试把 $g(y^K)$ 用 $W^0, W^1, \ldots, W^K$ 表示出来。

从最后一层向前倒退，考虑到：

$$
g(y^K) = g\left[f^K\left(\mathbf{W}^k y^{k-1}\right)\right]
$$

我们定义：

$$
g^{K}(\mathbf{W}^K, y^{K-1}) = g\left[f^K\left(\mathbf{W}^K y^{K-1}\right)\right]
$$

类似的，我们继续向前定义：

$$
g^{K-1}(\mathbf{W}^{K-1}, \mathbf{W}^{K}, y^{K-2}) = g^{K}(\mathbf{W}^K, y^{K-1})
$$

其中 $y^{K-1}=f^{K-1}\left(\mathbf{W}^{K-1} y^{K-2}\right)$, 所以也可以写成：

$$
g^{K-1}(\mathbf{W}^{K-1}, \mathbf{W}^{K}, y^{K-2}) = g^{K}(\mathbf{W}^K, \underbrace{f^{K-1}(\mathbf{W}^{K-1} y^{K-2})}_{y^{K-1}})
$$

拓展到一般的情况，对于任意的 $1\leq k\leq K$:

$$
g^k = g^k(\mathbf{W}^k, \mathbf{W}^{k+1}, \ldots, \mathbf{W}^{K}, y^{k-1})
$$

注意到更一般的类推关系：

$$
g^k = g^k(\mathbf{W}^k, \ldots, y^{k-1}) = g^{k+1}(\mathbf{W}^{k+1}, \ldots, \underbrace{f^k(\mathbf{W}^{k}\cdot y^{k})}_{y^{k}})
$$

分别计算 $\displaystyle\frac{\partial g^k}{\partial W^k_{a b}}$ 和 $\displaystyle\frac{\partial g^k}{\partial y^{k-1}_a}$:

$$
\begin{aligned}
\frac{\partial g^k}{\partial W^k_{a b}} &= \sum_{i=1}^{n_k} \frac{\partial g^{k+1}}{\partial y^k_i} \frac{\partial y^{k}_i}{\partial W^k_{a b}} \\\\
\text{Consider} \quad &\left(
    y^{k}_i = f^k\left(\sum_{j=1}^{n_{k-1}} W^k_{ij} y^{k-1}_j
\right) \Rightarrow \frac{\partial y^{k}_i}{\partial W^k_{a b}} = \delta_{i a}\cdot \frac{\textrm{d} f^k}{\textrm{d}x} y^{k-1}_b \right)\\\\
&= \frac{\partial g^{k+1}}{\partial y^k_a} \frac{\textrm{d} f^k}{\textrm{d}x} y^{k-1}_b\\\\
\frac{\partial g^k}{\partial y^{k-1}_a} &= \sum_{i=1}^{n_k} \frac{\partial g^{k+1}}{\partial y^{k}_i} \frac{\partial y^{k}_i}{\partial y^{k-1}_a}\\\\
\text{Consider} \quad &\left(
    \frac{\partial y^{k}_i}{\partial y^{k-1}_a} = \frac{\textrm{d} f^k}{\textrm{d}x} W^k_{ia}\right)\\\\
&= \sum_{i=1}^{n_k} \frac{\partial g^{k+1}}{\partial y^{k}_i} \frac{\textrm{d} f^k}{\textrm{d}x} W^k_{ia}
\end{aligned}
$$

因此我们得到了：

$$
\left(\underbrace{\cancel{\frac{\partial g^{k+1}}{\partial W^{k+1}_{a b}}}}, \frac{\partial g^{k+1}}{\partial y^{k}_a}\right)\Rightarrow\left(\underbrace{\frac{\partial g^k}{\partial W^k_{a b}}}, \frac{\partial g^k}{\partial y^{k-1}_a}\right)
$$

也即反向传播的过程。

!!! note "上界 $g^{K+1}$ 的处理"

    需要补充定义 $\displaystyle g^{K+1} = g(y^K)$，并且 $\displaystyle\frac{\partial g^{K+1}}{\partial y^K_i} = \frac{\partial g}{\partial y^K_i}$, $\displaystyle\frac{\partial g^{K+1}}{\partial W^{K+1}_{a b}}$ 不存在也无需处理, 注意观察上面的递推过程, 并不依赖于这个量。

## 梯度下降算法 _Gradient Descent_
