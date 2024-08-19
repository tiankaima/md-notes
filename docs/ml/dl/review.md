# Review

> 本篇是 <https://arxiv.org/pdf/1803.01164> 的阅读笔记
>
> 这也许并不是一篇优秀的综述，排版比较混乱，而且似乎并没有经过仔细的校对，有大量诸如 'than' 拼写成 'then' 的错误，部分方面涵盖的也不够详细。
>
> 原文标题："The History Began from AlexNet: A Comprehensive Survey on Deep Learning Approaches"

!!! warning

    本文有大量对原文的直接引用，因此禁用了鼠标选取、复制功能。

<script>
    // to prevent accidental copy
    document.addEventListener('copy', function (e) {
        e.preventDefault();
        let selectedText = window.getSelection().toString();
        let modifiedText = selectedText + "\n\nREWRITE THIS WITH YOUR OWN WORDS!!!";
        e.clipboardData.setData('text/plain', modifiedText);
    });
    document.addEventListener('mousedown', function (e) {
        e.preventDefault();
    });
</script>

## Abstract

Topics:

- Deep Neural Network (DNN)
- Convolutional Neural Network (CNN)
- Recurrent Neural Network (RNN)
    - Long Short Term Memory (LTSM)
    - Gated Recurrent Units (GRU)
- Auto-Encoder (AE)
- Deep Beleief Network (DBN)
- Generative Adversarial Network (GAN)
- Deep Reinforcement Learning (DRL)
- Transfer Learning

## Intro

Machine Learning > Neural Network (NN) $\Rightarrow$ Deep Learning (DL)

### Categorization

- **Supervised**: DNN, CNN, RNN (LSTM GRU)
    - With labeled data: given input and corresponding outputs.
    - A loss function $l(y_t, \hat{y}_t)$ is given and calculated at each time step (a gradient is calculated for each time step).
- **Semi-supervised (partially supervised)**: RNN (LSTM, GRU), GAN
    - Reinforcement Learning
    - Semi-labeled datasets
- **Unspervised**: RNN (LTSM) RL
    - Clustering, generative techniques. No label is given.
    - Auto Encoders (AE), Restricted Boltzmann Machines (RBM), GAN
- Deep Reinforcement Learning (DRL)
    - Do not have straight foward loss function (do not have full access to the function you are trying to optimize, query them through interaction; state-based enviroment, input depends on previous actions)


### Feature Learning

- Traditional ML Approach:

    Handmade features by apply feature extraction algorithms

    - Scale Invariant Feature Transform (SIFT)
    - Speeded Up Robust Features (SURF)
    - GIST RANSAC
    - Histogram of Oriented Gradients (HOG)
    - Local Binary Patterns (LBP)
    - Empirical Mode Decomposition (EMD) for speech analysis

    Learning approaches:

    - Support Vector Machine (SVM)
    - Random Forest (RF)
    - K-Nearest Neighbors (KNN)
    - Principal Component Analysis (PCA)
    - Kernel PCA
    - Linear Discriminant Analysis (LDA)
    - Independent Component Analysis (ICA)
    - Fisher Discriminant Analysis (FDA)

### Applications: when and where

> skipped

### State of the art

- Image classification

    Dataset: ImageNet

- Automatic Speech Recognition (ASR)

    Dataset: TIMIT

### Why Deep Learning?

- Universal
- Robust
- Generalizable
- Scalable

## DNN

### History

| Year | Event               | Description                                                                      |
| ---- | ------------------- | -------------------------------------------------------------------------------- |
| 1943 | McCulloch and Pitts | Turing complete                                                                  |
| 1958 | Rosenblatt          | Preceptron's will converge if thwhat they are trying to learn can be represented |
| 1969 | Minsky and Papert   | Limitation of preceptron                                                         |
| 1985 | Geoff Hinton        | Backpropagation                                                                  |
| 1998 | Yann LeCun          | Convolutional Neural Network (CNN)                                               |
| 2006 | Hinton              | Training deep networks                                                           |
| 2012 | AlexNet             | ImageNet                                                                         |

### Gradient Descent

$$
\theta \leftarrow \theta - \eta \nabla_{\theta} J(\theta)
$$

### Stochastic Gradient Descent

Compared to Gradient Descent, Stochastic Gradient Descent is faster and more efficient. Most times, the dataset is too large to fit into memory, so we use mini-batches.

Steps:

- The dataset is shuffled and divided into mini-batches, and the gradient is computed for each mini-batch.
    - The mini-batch size is a hyperparameter.
- For each mini-batch, the weights are updated using the gradient of the loss function with respect to the weights.
    - One complete foward and backward pass through the network is called an **epoch**.
    - The process is repeated for a number of epochs to ensure the model converges to the optimal weights.

### Backpropagation

> skipped

### Learning rate

- For a smaller learning rate, the model would take longer to converge;
- For a larger learning rate, the model might overshoot the optimal weights.

The typical solution for this problem is to reduce the learning rate during training.
Three common approaches are used for reducing the learning rate during training: constant, factored and exponential decay.

$$
\begin{aligned}
\text{Constant decay:} & \quad \eta_t = \frac{1}{1 + \eta \cdot t} \\
\text{Factored decay:} & \quad \eta_t = \frac{1}{1 + \eta \cdot \sqrt{t}} \\
\text{Exponential decay:} & \quad \eta_t = \alpha_0 \cdot e^{-\eta\: t}
\end{aligned}
$$

!!! note "Common Practice"

    Use a learning rate decay of $e^{-\eta} = 0.1$.

### Weight decay

To prevent overfitting, a regularization term is added to the loss function.

$$
L(\theta, x) = J(\theta, x) + \lambda \Omega(\theta)
$$

where $\Omega(\theta)$ is the regularization term.

- L1 regularization: $\Omega(\theta) = \sum_{i} |\theta_i|$
- L2 regularization: $\Omega(\theta) = \sum_{i} \theta_i^2$

!!! note "Common Practice"

    $L2$ regularization is more commonly used with $\lambda = 0.0004$, smaller $\lambda$ will accelerate the convergence.

### Notes

Other necessary components for efficient traning:

- data prepcrocessing & augmentation
- network initialization approaches
- batch normalization
- activation functions
- regularization with dropout
- different optimization algorithms

Before 2006, attempts taken at training deep architectures failed: training a deep supervised feed-foward neural network tended to yield worse result (both in training and in test error) than shallow ones (wuth 1 or 2 hidden layers). Hinton's revolutionary work on DBNs spearheaded a change in this in 2006.

Due to their composition, many layers of DNNs are more capable at representing highly varying nonlinear functions compared to shallow learning approaches. Moreover, DNNs are mroe efficient for learning because of the combination of feature extraction and classficiation layers.

## CNN

### History

| Year | Event     | Description  |
| ---- | --------- | ------------ |
| 1988 | Fukushima | Neocognitron |
| 1998 | LeCun     | LeNet-5      |

CNN s have several advantages over DNNs, including being more similar to human visual processing system, being highly optimized in structure for processing 2D and 3D images, and being effective at leraning and extracting abstractions of 2D features. The max pooling layer of CNNs is effective in absorbing shape variations. Moreover, composed of sparse connections with tied weights, CNNs have significantly fewer parameters than a fully conenected network of simiar size. <span style='color:gray'> Most of all, CNNs are trained with gradient-based optimization algorithms, and suffer less from the diminishing gradient problem. </span>
