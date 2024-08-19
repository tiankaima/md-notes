# CNN 卷积神经网络

Convolutional Neural Network，卷积神经网络。

!!! notes "前置知识"

    - [神经网络](../nn)

## 概念 {#concept}

-   卷积层 _Convolutional Layer_: 使用卷积核 _Kernel_ 对输入进行卷积操作，提取特征
    -   核 _Kernel_: 一组权重，用于卷积操作
    -   步幅 _Stride_: 卷积核每次移动的步长
    -   填充 _Padding_: 在输入周围填充 0，使得输出大小与输入大小相同
-   池化层 _Pooling Layer_: 降采样，减少特征图的大小
    -   最大池化 _Max Pooling_: 选取池化窗口中的最大值
    -   平均池化 _Average Pooling_: 选取池化窗口中的平均值

值得注意的是，与上面深度神经网络中对 MNIST 对数据集的处理不同，在 CNN 中我们不对数据进行展平处理，而是保持其原有的形状，以便卷积操作。

(对每层来说) 输入数据的形状通常为 $(N, C, H, W)$，其中 $N$ 为批大小，$C$ 为通道数，$H$ 和 $W$ 分别为高和宽。

## 卷积层 Convolutional Layer

在全连接层中，因为不能与先假设特征之间的先验结构，因此必须使用大量的学习参数。但是这样的办法处理图像是几乎不可能实现的。考虑一张 1MP (1 million pixels) 的图像，如果第一个隐藏层有 1000 个神经元，那么就有 1 billion 个连接。这样的连接数目是不可接受的。

!!! note ""

    一个反驳的观点是，保留 1MP 是不必要的，只需要预先将图片降采样到更小的尺寸。但与下文中利用图像本身的结构相比，在降低到一个可用的尺寸前，这种方法无疑会丢失大量的特征信息。

### 卷积操作 Convolution Operation

??? note "前置知识：卷积运算"

    关于卷积运算本身详见 [Functional-Analysis#convolution](/math/analysis/functional-analysis/#convolution), 下面讨论卷积在神经网络中的应用。

    tl;dr: 在下文中用到的离散卷积定义如下, 若 $f$ 和 $g$ 是长度为 $n$ 的序列, 则它们的卷积 $f * g$ 定义为

    $$
    (f * g)[t] = \sum_{i=1}^{n} f[i] \cdot g[t-i] \quad \text{for} \quad 1 \leq t \leq 2n-1
    $$

<!-- tl;dr: 通过对输入数据进行卷积操作，生成特征图 _Feature Map_。 -->

在引入数学表示之前，我们可以先总结一下一个适合处理图像的神经网络应该具有的特点：

-   平移不变性 _Translation Invariant_: 对于分类或识别任务，图像识别任务总是保持平移不变的 _Translation Invariant_。例如，一张猫的图片在左上角和右下角的猫应该被认为是相同的。为了实现这一点，我们需要一种方法来提取图像的特征，并且这些特征应该是平移不变的。
    -   参数共享 _Shared Weights_: 图像中的不同位置通常具有相同的特征，因此我们希望在提取特征时共享权重。这样可以减少参数的数量，减少过拟合的风险。
-   局部连接 _Local Connectivity_: 图像中的相邻像素之间通常是相关的，因此我们希望神经元只与输入的一小部分连接，而不是与整个输入连接。这样可以减少连接的数量，减少计算量。

---

接下来我们从全连接层的思路出发，构造一个符合这样条件的数学模型。

既然输入数据不再展平，我们接下来以 $\mathbf{X}$ 表示输入数据，$\mathbf{Y}$ 表示输出数据，$Y_{i j}$ 表示第 $(i,j)$ 位置的输出。

首先按照全连接层的思路，每个输出像素都是由输入像素的线性组合 + 偏置项得到的，即

$$
Y_{i j} = \sum_{m,n} W_{m n i j} \cdot X_{m n} + b_{i j}
$$

> $m,n$ 取值范围 即为使得 $X_{m n}$ 有意义 (在输入图像范围内) 的所有值。

为方便下文的处理，我们将 $(m,n)$ 表示成 $(i,j)+(a, b)$的形式，这样上式可以写成

$$
Y_{i j} = \sum_{a,b} W_{a b i j} \cdot X_{i+a, j+b} + b_{i j}
$$

根据上面提到的 _参数共享_, 可以把 $W_{a b i j}$ 写作 $W_{a b}$; 同时，为了限制参数量，只需要评估距离 $(i,j)$ 一定范围内的像素，即控制 $\vert a \vert, \vert b \vert \leq k$ (这里 $k$ 是一个超参数), 这样上式可以写成：

$$
Y_{i j} = \sum_{\vert a \vert, \vert b \vert \leq k} W_{a b} \cdot X_{i+a, j+b} + b_{i j}
$$

到这里我们就完整地定义了一个卷积层的操作，其中 $W_{a b}$ 是卷积核 _Kernel_, $k$ 是卷积核的大小，$b_{i j}$ 是偏置项。

写成离散卷积的形式：

$$
\mathbf{Y} = \mathbf{W} \star \mathbf{X} + \mathbf{b} = \mathbf{W}^{*} * \mathbf{X} + \mathbf{b}
$$

!!! warning ""

    <span style="color:red">上面的定义实际上是互相关 _Cross-Correlation_ ($\star$) 而不是卷积 _Convolution_ ($*$)。</span>
    在 Deep Learning 中，这两个名词经常被混用，原因是这两者相差一个反转操作，如果预先将核翻转定义 $(i,j) \rightarrow (-i, -j)$, 那么上面的定义就是卷积操作。

    在其他领域，互相关与卷积的差别也成立类似关系，考虑 $f, g: \mathbb{R} \rightarrow \mathbb{C}$, 则它们的卷积定义为

    $$
    (f * g)(t) = \int_{-\infty}^{\infty} f(\tau) g(t-\tau) d\tau
    $$

    而互相关定义为

    $$
    (f \star g)(t) = \int_{-\infty}^{\infty} \overline{f(\tau)} g(t+\tau) d\tau
    $$

    这两者的关系是

    $$
    f(t) \star g(t) = \overline{f(-t)} * g(t)
    $$

考虑输入图像尺寸 $n_h \times n_w$, Kernel 尺寸 $k_h \times k_w$, 则输出图像尺寸为：

$$
(n_h - k_h + 1) \times (n_w - k_w + 1)
$$

### 填充 Padding

注意到这样的操作会「丢失边缘像素」: 与其他像素相比，边缘像素被计算的次数更少。为了解决这个问题，我们可以在输入图像的周围填充一圈 $0$, 这样输出图像的尺寸就与输入图像相同了。这样的做法被称作 _Padding_，填充的数量通常用 $p=(p_h\times p_w)$ 表示，那么输出图像尺寸为：

$$
(n_h - k_h + 2p_h + 1) \times (n_w - k_w + 2p_w + 1)
$$

> 注：这里的填充量 $p_h, p_w$ 都是指单侧填充量。

多数情况下，我们会设置 $2p_h = k_h -1, 2p_w = k_w - 1$ 以保持输出图像尺寸与输入图像尺寸相同，为了方便，卷积核的尺寸一般也设置成奇数，保证顶部 (底部)、左侧 (右侧) 填充量相同。

### 步幅 Stride

如果滑动窗口不再以 $1$ 的步长滑动，而是以 $s$ 的步长滑动，那么输出图像尺寸为：

$$
\left\lfloor \frac{n_h - k_h + 2p_h}{s} \right\rfloor + 1 \times \left\lfloor \frac{n_w - k_w + 2p_w}{s} \right\rfloor + 1
$$

如果 $2p_h = k_h -1, 2p_w = k_w - 1$，那么输出图像尺寸为：

$$
\left\lfloor \frac{n_h - k_h + 1}{s} \right\rfloor \times \left\lfloor \frac{n_w - k_w + 1}{s} \right\rfloor
$$

进一步，如果 $k_h \vert n_h, k_w \vert n_w$，那么输出图像尺寸为：

$$
\frac{n_h}{k_h} \times \frac{n_w}{k_w}
$$

### 维数问题 {#dimension}

上面的讨论中我们仅处理了一个通道的图像，接下来我们考虑多通道的情况。

!!! warning ""

    在下面的讨论中，只需要把张量理解成一个多维数组即可。

考虑输入形状 $(N, C, H, W)$, 在其上面使用一个 $(C', C, k_h, k_w)$ 的卷积核，输出形状为 $(N, C', H', W')$，其中 $H', W'$ 由上面的公式决定。

为详细说明这一点，我们以几个例子来说明：

-   $C=1, C'=1$: 卷积核：$(1, 1, k_h, k_w)$，输出形状为 $(N, 1, H', W')$。

    这就是上面讨论的单通道图像的情况。

-   $C=3, C'=1$: 卷积核：$(1, 3, k_h, k_w)$，输出形状为 $(N, 1, H', W')$。

    相当于对每个通道的图像分别进行卷积操作，然后将结果相加。

    这实际上与一个 $n\times 3$ 的矩阵乘以一个 $3\times 1$ 的矩阵的操作是一样的，不过此时元素是二维矩阵，而其之间的乘法是互相关。

有时也称 $(1, C, k_h, k_w)$ 的卷积核为 过滤器 _Filter_, 一个 Filter 对应一个输出通道，每个 Filter 中包含一个或多个卷积核，分别对应输入通道，并相加。

### 反向传播 Backpropagation

在 [nn/bp](../nn/bp.md) 中我们已经讨论了全连接层反向传播的一般方法，在卷积层中，除了图像不再展平带来的区别 (维数，标号), 不使用激活函数 (可以看作 $f(x)=x$), 最重要的区别是一个参数的梯度是由多个输入共享的。

参照全连接层反向传播的思路，我们在下面推导由 $\displaystyle \frac{\partial g}{\partial Y_{i j}}$ 得到 $\displaystyle \frac{\partial g}{\partial W_{a b}}$ 和 $\displaystyle \frac{\partial g}{\partial X_{i j}}$。

$$
\frac{\partial g}{\partial W_{a b}}=\sum_{i, j}^{} \frac{\partial g}{\partial Y_{i j}} \cdot \frac{\partial Y_{i j}}{\partial W_{a b}}
$$

注意到 $\displaystyle \frac{\partial Y_{i j}}{\partial W_{a b}}=X_{i+a, j+b}$，所以：

$$
\frac{\partial g}{\partial W_{a b}}=\sum_{i, j}^{} \frac{\partial g}{\partial Y_{i j}} \cdot X_{i+a, j+b}
$$

也可以写成互相关的形式：

$$
\left(\frac{\partial g}{\partial W}\right) = \mathbf{X} \star \left(\frac{\partial g}{\partial Y}\right)
$$

$\displaystyle \frac{\partial g}{\partial X_{i j}}$ 的推导与上面类似，最终结果为：

$$
\left(\frac{\partial g}{\partial X}\right) = \left(\frac{\partial g}{\partial Y}\right) \star \mathbf{W}
$$

## 池化层 Pooling Layer

池化 _Pooling_ 也称为下采样 _Downsampling_，是一种减少特征图大小的方法。池化层通常紧跟在卷积层之后，用于减少特征图的大小，同时保留重要的特征。

对于一张 $n_h \times n_w$ 的特征图，池化操作通常是在一个 $k_h \times k_w$ 的窗口上进行的，步长为 $s$，输出图像的尺寸为：

$$
\left\lfloor \frac{n_h - k_h}{s} \right\rfloor + 1 \times \left\lfloor \frac{n_w - k_w}{s} \right\rfloor + 1
$$

多数情况下：

-   窗口是正方形 $k_h = k_w = k$
-   步长是 $s = k$

此时输出图像的尺寸为：

$$
\left\lfloor \frac{n_h}{k} \right\rfloor \times \left\lfloor \frac{n_w}{k} \right\rfloor
$$

### 最大池化 Max Pooling

-   正向传播：

    $$
    Y_{i j} = \max_{\vert a \vert, \vert b \vert \leq k} X_{s \cdot i+a, s \cdot j+b}
    $$

-   反向传播：

    由于只有最大值对输出有贡献，只需要将误差传递给窗口中最大值即可。

### 平均池化 Average Pooling

-   正向传播：

    $$
    Y_{i j} = \frac{1}{k^2} \sum_{\vert a \vert, \vert b \vert \leq k} X_{s \cdot i+a, s \cdot j+b}
    $$

-   反向传播：

    由于所有值对输出有贡献，只需要将误差平均传递给窗口中的值即可。
