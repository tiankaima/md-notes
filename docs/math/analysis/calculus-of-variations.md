# Calculus of variations 变分法

看到一个很经典的变分法的问题，来 Review 一下基本方法：

**证明：在所有定义在 $\mathbb{R}$ 上的分布中，对于一个固定的方差 $\sigma^2$，高斯分布 $\mathcal{N}(0, \sigma^2)$ 是使得熵最大的分布。**

熵的定义：

$$
H(X) = -\int f(x) \log f(x) \, dx
$$

分布函数应该满足的特征：

$$
\int f(x) \, dx = 1
$$

同时方差：

$$
\int x^2 f(x) \, dx = \sigma^2
$$

定义拉格朗日函数：

$$
L(p, \lambda, \mu) = -\int f(x) \log f(x) \, dx + \lambda \left( \int f(x) \, dx - 1 \right) + \mu \left( \int x^2 f(x) \, dx - \sigma^2 \right)
$$

应用变分法，即考虑 $f(x) = f_0(x) + \varepsilon\eta (x)$：

$$
\begin{aligned}
L(f_0 + \varepsilon\eta, a,b) &= \int -(f_0 + \varepsilon\eta) \log (f_0 + \varepsilon\eta) \, dx + a (f_0 + \varepsilon\eta) + b x^2 (f_0 + \varepsilon\eta) \, dx \\
\left.\frac{\partial L}{\partial \varepsilon}\right|_{\varepsilon = 0} &= \int \left(-\log (f_0 + \varepsilon\eta) - 1 + a + b x^2\right) \cdot \eta \, dx = 0 \\
&= \int \left(-\log f_0 - 1 + a + b x^2\right) \cdot \eta \, dx = 0
\end{aligned}
$$

由于 $\eta$ 是任意的，我们容易证明（例如考虑 $\eta(x) \to \delta(x_0)$）即可说明：

$$
\forall x, \quad -\log f_0(x) - 1 + a + b x^2 = 0
$$

即：

$$
f_0(x) = \exp(-1 + a + b x^2)
$$

再考虑约束条件，我们可以得到：

$$
f_0(x) = \sqrt{\frac{1}{2\pi\sigma^2}} \exp\left(-\frac{x^2}{2\sigma^2}\right)
$$

这就是高斯分布。
