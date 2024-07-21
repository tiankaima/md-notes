# Backward Propagation

本文整理了神经网络中的反向传播算法 _Backward Propagation_ 的相关内容。

## 推导 _Derivation_

对于一个简单的神经网络，我们可以使用链式法则 _Chain Rule_ 来推导反向传播算法。

考虑第 $k$ 层的计算，包含两部分：线性算子 $W^k \in \mathbb{L}\left(\mathbb{R}^{n_{k-1}}, \mathbb{R}^{n_k}\right)$ 和激活函数 $f^k$。

-   输入是从上一层 ($k-1$ 层) 拿到的结果 $y^{k-1} = (x_1, x_2, \ldots, x_{n_{k-1}})$
-   输出则是 $y^k = (x_1, x_2, \ldots, x_{n_k})$。

## 梯度下降算法 _Gradient Descent_
