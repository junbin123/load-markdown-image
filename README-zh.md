# load-markdown-image

> 一个将 markdown 文件中的网络图片替换为本地图片的 npm 包。

[![NPM](https://nodei.co/npm/load-markdown-image.png?compact=true)](https://npmjs.org/package/load-markdown-image)

## 介绍

在 MD 文件同级目录下创建 images 文件夹，下载 MD 文件中的网络图片，并保存在 images 文件夹。

此 npm 包会修改 MD 文件的内容，注意备份！

## 安装

```shell
npm install -g load-markdwon-image
# or
yarn global add load-markdown-image
```

## 如何使用？

```shell
# 下载 test.md 文件中的图片
load-markdown-image test.md

# or
load-markdown-image "hello world.md"

# 下载 test 文件夹里面所有 markdonw 文件的图片
load-markdown-image test

# 修改保存图片文件夹的名称
load-markdown-image test.md --fileName=myImg
```

## 功能

- 支持下载单个 MD 文件的图片；
- 支持下载文件夹下所有 MD 文件的图片；
- 支持绝对路径、相对路径；
- 自动识别图片格式；
- 路径名包含空格，请添加双引号；

## 预览

![load-markdown-image](https://img-blog.csdnimg.cn/e23ef95e4696418eb5db389940a5cd83.png)

## 开发

```
npm run build
npm link
npm publish
```
