# Fourier 分析

## Parseval

### $\zeta(2)$

考虑对 $f(x) = x$ 做 Fourier:

$$
c_n = \frac{1}{2\pi} \int_{-\pi}^{\pi} x \cdot \mathrm{e}^{-i n x} \mathrm{d} x = \frac{(-1)^n}{n} i \quad \forall\ n\neq 0
$$

显然有$c_0 = 0$, 因此根据 Parseval:

$$
\sum_{n=\infty}^{\infty} |c_n|^2 = \frac{1}{2\pi} \int_{-\pi}^{\pi} x^2 \mathrm{d} x = \frac{\pi^2}{3}
$$

因此

$$
\zeta(2) = \displaystyle\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$
