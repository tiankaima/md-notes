# 3D Gaussian Splatting

> 本篇是 <https://dl.acm.org/doi/10.1145/3592433> 的阅读笔记
>
> 原文标题："3D Gaussian Splatting for Real-Time Radiance Field Rendering"

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

## Introduction

- **NeRF**: Neural Radiance Field

    Optimizing a Multi-Layer Perceptron using volumetric ray-marching for novel-view synthesis of captured scenes.

    通过 Ray-marching 优化 MLP，用于合成新视角的场景。

    ??? note "Ray-marching"
        通过沿着光线前进的方式，逐步地在场景中找到光线与物体相交的点。

