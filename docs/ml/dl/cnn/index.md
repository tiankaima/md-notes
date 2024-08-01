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

输入数据的形状通常为 $(N, H, W, C)$，其中 $N$ 为批大小，$H$ 和 $W$ 分别为高和宽，$C$ 为通道数。

## 卷积层 Convolutional Layer

在全连接层中，因为不能与先假设特征之间的先验结构，因此必须使用大量的学习参数。但是这样的办法处理图像是几乎不可能实现的。考虑一张 1MP (1 million pixels) 的图像，如果第一个隐藏层有 1000 个神经元，那么就有 1 billion 个连接。这样的连接数目是不可接受的。

!!! note ""

    一个反驳的观点是，保留 1MP 是不必要的，只需要预先将图片降采样到更小的尺寸。但与下文中利用图像本身的结构相比，这种方法无疑会丢失大量的特征信息。

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

    上面的定义实际上是互相关 _Cross-Correlation_ 而不是卷积 _Convolution_。这两者相差一个反转操作, 如果预先将核翻转定义 $(i,j) \rightarrow (-i, -j)$, 那么上面的定义就是卷积操作。
