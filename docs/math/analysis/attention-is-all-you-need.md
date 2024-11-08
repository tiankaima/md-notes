# 注意力惊人

构造定积分 $\displaystyle \int_{0}^{1} f(x) \mathrm{d} x = \pi - \frac{p}{q} \geq 0$ 来比较 $\pi$ 和 $\displaystyle \frac{p}{q}$ 的大小。

不经过函数，所有能构造出来的数字：

$$
\mathbb{K} := \left\{\left( \frac{p}{q} \right)^{\dfrac{r}{s}} \Big|\ p,q,r,s \in \mathbb{Z} \right\}
$$

考虑 $\pi$ 的构造，其实也就是原函数 $F(b) - F(a)$ 能在 $\mathbb{K}$ 上给出 $\pi$。

> 因为上下限被固定在了 $[0,1]$，因此其实能选取的函数并不多，考虑反三角函数：

-   $\arcsin(x)$:

$$
\int_{0}^{1} \frac{1}{\sqrt{1-x^2}} \mathrm{d} x = \arcsin(1) = \frac{\pi}{2}
$$

-   $\arctan(x)$:

$$
\int_{-\infty}^{\infty} \frac{1}{1+x^2} \mathrm{d} x = \left[ \arctan(x) \right]_{-\infty}^{\infty} = \pi
$$

$$
\int_{0}^{1} \frac{1}{1+x^2} \mathrm{d} x = \arctan(1) = \frac{\pi}{4}
$$

额外的：

$$
\int_0^1 \sqrt{1-x^2}\ \mathrm{d} x = \frac{\pi}{4}
$$

以这个想法来先证明：

$$
\begin{aligned}
\pi - 2 &= \int_0^1 4\left(\sqrt{1-x^2} - (1-x)\right) \mathrm{d} x \\
&= \int_0^1 4\left(\sqrt{1-x}\left(\sqrt{1+x} - \sqrt{1-x}\right)\right) \mathrm{d} x
\end{aligned}
$$

不过性质不是很好（你可以尝试 Taylor Series，虽然很紧，但是 Sympy 其实难以判断大小，而且长度也不符合题目要求），回到 $\displaystyle \frac{1}{1+x^2}$，尝试一点别的：

$$
\pi - \frac{p}{q} = \int_0^1 \left(\frac{4}{1+x^2} - \frac p q \cdot g(x)\right)\mathrm{d} x
$$

启发我们考虑一个更一般的 $g(x)$：

$$
\int_0^1 g(x) \mathrm{d} x = \int_0^1 \left( a_0 + a_1 x + a_2 x^2 + a_3 x^3 + \dots \right)\mathrm{d} x = a_0 + \frac 12 a_1 + \frac 13 a_2 + \dots = 1
$$

积分内形式：

$$
\frac{4q - p(1+x^2)(a_0 + a_1 x + a_2 x^2 + ...)}{1+x^2}
$$

考虑分子：

$$
k(x) = (4q - p a_0) - p a_1 x - p (a_2 + a_0) x^2 - p(a_3 + a_1) x^3  - p(a_4 + a_2) \geq 0
$$

不妨令（真的不妨吗）：

$$
a_0 =4q/p > 4/\pi > 1\\
a_1 = 2(1- a_0) = 2 (1- 4q/p) < 0
$$

代入：

$$
k(x) = -2(p - 4q) x - 4q x^2 - 2(p - 4q) x^3 = 2x (-(p-4q) - 2q x - (p-4q)x^2)
$$

验证以后会发现实际上不能满足条件，更一般的，考虑 $a_1, a_0$ 的条件

$$
k(x) = (4q - p a_0) - 2p(1 - a_0) x - p a_0 x^2 - 2p (1-a_0)x^3\\
k(0) = 4q - p a_0 \geq 0 \\
k(1) = (4q - p a_0) - 2p + 2 pa_0 -p a_0 - 2p + 2p a_0 = 2p a_0 + 4q - 4p \geq 0
$$

即

$$
a_0 \leq 4 q/p \Rightarrow a_0 \leq 1 \\
a_0 \geq 2 - 2q/p = 2 (p - q)/p
$$

也难以满足要求，实际上也就要求更高 Taylor Series 的展开，但是盲目打开到 $a_2$ 其实是不必要的，更一般的，直接考虑构造这样一个显然更容易恒正的函数：

$$
f(x) = \frac{{x}^n {(1-x)}^m {(a+b\ x + c\ x^2)}}{1 + x^2}
$$

代入到符号计算软件可以直接得到一个关于 $\pi, \ln 2$ 的 $\mathbb{Q}$ 线性组合（我在说什么？），注意带着 $m,n$ 可能会得到一堆关于 $m,n$ 的 $\Gamma$ 函数，考虑直接代入几个值进去（比如 $m=n=3$ 进去）

接下来只需要令 $\pi, \ln 2$ 前面的系数为 $0$，然后剩余有理数的部分 $\displaystyle =\frac{p}{q}$ 即可，一元三次方程，而且均为有理数，解显然也是有理数。

其实容易注意，随着 $m,n$ 的增加，能得到的解其实更紧，接下来需要的数学准备已经差不多了，剩下的就是题目本身的限制了：

- 有部分 $a,b,c$ 的解并不能满足在 $[0,1]$ 上二次函数恒正，需要调高 $m,n$
- 有部分 $m,n$ 会超出题目长度要求
- 复制粘贴的手速大概率会超时

嘛，总之用到的脚本在这里，可以参考：

```python
import sympy as sp
import pyperclip


x = sp.symbols("x")
a = sp.symbols("a")
b = sp.symbols("b")
c = sp.symbols("c")

n = 80

while True:
    f = x**n * (1 - x) ** n * (a + b * x + c * x**2) / (1 + x**2)

    p, q = input("p/q:").split("/")
    pq = sp.Rational(int(p), int(q))

    sol = sp.solve(
        [
            sp.Rational(
                -264625355360516117450008340198714638981492191523281648346833579224158082061028,
                306437384083077799057007332399381984236948705737346929421798748875,
            )
            * a
            + sp.Rational(
                1067625583461964288587691136180185035077897741239121612103106082260802255650717,
                2801713225902425591378352753365778141594959595312886211856445704000,
            )
            * b
            + sp.Rational(
                3175504264326193409400100082384575667777906298279379780162003198829635728211061,
                3677248608996933588684087988792583810843384468848163153061584986500,
            )
            * c
            + pq,
            b,
            274877906944 * a - 274877906944 * c - 1,
        ],
        (a, b, c),
    )

    f = f.subs(sol)
    print(f)
    pyperclip.copy(str(f))

    integrate_result = sp.integrate(f, (x, 0, 1))
    print(integrate_result)
```
