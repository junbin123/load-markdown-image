# load-markdown-image

[![NPM](https://nodei.co/npm/load-markdown-image.png?compact=true)](https://npmjs.org/package/load-markdown-image)

## 介绍

一个将 markdown 文件中的网络图片替换为本地图片的 npm 包。

在 md 文件同级目录下创建 images 文件夹，保存本地图片。

此 npm 包会修改 md 文件的内容，注意备份！

## 如何使用？

```shell
# 全局安装
npm install -g load-markdwon-image

# or
yarn global add load-markdown-image
```

```shell
# 下载文件 test.md 的图片
load-markdown-image test.md

# 下载文件夹 test 里面所有 markdonw 文件的图片
load-markdown-image test

# or
load-markdown-image "hello world.md"

# 修改图片存放文件夹名称
load-markdown-image test.md --fileName=img

```

## 说明
- 支持下载单个 md 文件的图片；
- 支持下载文件夹下所有 md 文件的图片；
- 路径名包含空格，请添加双引号；
- 支持绝对路径、相对路径；

## 例子

## 开发

```
npm run build
npm link
npm publish
```
