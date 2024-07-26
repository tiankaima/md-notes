# CNN 卷积神经网络

Convolutional Neural Network，卷积神经网络。

!!! notes "前置知识"

    - [深度学习](../index.md)
    - [神经网络](../nn)

!!! notes "参考资料"

    -   [Convolutional Neural Networks (LeNet)](http://yann.lecun.com/exdb/lenet/)
    -   [Gradient-Based Learning Applied to Document Recognition](http://yann.lecun.com/exdb/publis/pdf/lecun-01a.pdf)
    -   [ImageNet Classification with Deep Convolutional Neural Networks](https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks.pdf)
    -   [Very Deep Convolutional Networks for Large-Scale Image Recognition](https://arxiv.org/abs/1409.1556)
    -   [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385)
    -   [Densely Connected Convolutional Networks](https://arxiv.org/abs/1608.06993)
    -   [MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications](https://arxiv.org/abs/1704.04861)
    -   [SqueezeNet: AlexNet-level accuracy with 50x fewer parameters and <0.5MB model size](https://arxiv.org/abs/1602.07360)

## TL;DR

卷积神经网络（Convolutional Neural Network, CNN）是一种专门用于处理图像的神经网络。它通过卷积层提取图像的特征，通过池化层减小特征图的大小，通过全连接层进行分类。

与一般的神经网络相比，CNN 的特点是：

-   卷积层：提取图像的特征
-   池化层：减小特征图的大小
-   全连接层：进行分类
-   参数共享：卷积核在整个图像上滑动，共享参数
-   局部感受野：每个神经元只关注局部区域的特征
-   稀疏连接：每个神经元只与一小部分神经元连接

## 卷积层 Convolutional Layer

### 卷积操作 Convolution Operation

<!-- 既然是侧重数学方向的内容，不如回顾一下 $L_1$ 函数的卷积的性质 -->
