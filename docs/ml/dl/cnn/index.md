# CNN 卷积神经网络

Convolutional Neural Network，卷积神经网络。

!!! notes "前置知识"

    - [深度学习](../index.md)
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

既然输入数据不再展平，我们接下来以 $\mathbf{X}$ 表示输入数据，$\mathbf{X}_{i j}$ 表示第 $(i,j)$ 位置的像素 (对于灰度图像，$\mathbf{X}_{i j}$ 是一个标量，对于彩色图像，$\mathbf{X}_{i j}$ 是一个向量), $\mathbf{Y}$ 表示输出数据，$\mathbf{Y}_{i j}$ 表示第 $(i,j)$ 位置的输出。

首先按照全连接层的思路，每个输出像素都是由输入像素的线性组合 + 偏置项得到的，即

$$
\mathbf{Y}_{i j} = \sum_{m,n} \mathbf{W}_{m n i j} \cdot \mathbf{X}_{m n} + b_{i j}
$$

> $m,n$ 取值范围 即为使得 $\mathbf{X}_{m n}$ 有意义 (在输入图像范围内) 的所有值。

为方便下文的处理，我们将 $(m,n)$ 表示成 $(i,j)+(a, b)$的形式，这样上式可以写成

$$
\mathbf{Y}_{i j} = \sum_{a,b} \mathbf{W}_{a b i j} \cdot \mathbf{X}_{i+a, j+b} + b_{i j}
$$

根据上面提到的 _参数共享_, 可以把 $\mathbf{W}_{a b i j}$ 写作 $\mathbf{W}_{a b}$; 同时，为了限制参数量，只需要评估距离 $(i,j)$ 一定范围内的像素，即控制 $\vert a \vert, \vert b \vert \leq k$ (这里 $k$ 是一个超参数), 这样上式可以写成：

$$
\mathbf{Y}_{i j} = \sum_{\vert a \vert, \vert b \vert \leq k} \mathbf{W}_{a b} \cdot \mathbf{X}_{i+a, j+b} + b_{i j}
$$

到这里我们就完整地定义了一个卷积层的操作，其中 $\mathbf{W}_{a b}$ 是卷积核 _Kernel_，$b_{i j}$ 是偏置项。

!!! warning "卷积？互相关？"

    上面的定义实际上是互相关 _Cross-Correlation_ 而不是卷积 _Convolution_。这两者相差一个反转操作，如果预先将核翻转定义 $(i,j) \rightarrow (-i, -j)$, 那么上面的定义就是卷积操作。

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
-   $C=3, C'=1$: 卷积核：$(1, 3, k_h, k_w)$，输出形状为 $(N, 1, H', W')$。

    相当于对每个通道的图像分别进行卷积操作，然后将结果相加，这实际上与一个 $n\times 3$ 的矩阵乘以一个 $3\times 1$ 的矩阵的操作是一样的。

-   $C=3, C'=3$: 卷积核：$(3, 3, k_h, k_w)$，输出形状为 $(N, 3, H', W')$。

    相当于 $N \times 3$ 的矩阵乘以一个 $3 \times 3$ 的矩阵。

有时也称 $(1, C, k_h, k_w)$ 的卷积核为 过滤器 _Filter_, 一个 Filter 对应一个输出通道，每个 Filter 中包含一个或多个卷积核，分别对应输入通道，并相加。
