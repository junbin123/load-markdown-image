# load-markdown-image

[中文版](./README-zh.md)

> An npm package that replaces web images in markdown files with local images.

[![NPM](https://nodei.co/npm/load-markdown-image.png?compact=true)](https://npmjs.org/package/load-markdown-image)

## Introduction

Create an images folder in the same level as the MD file, download the web images from the MD file and save them in the images folder.

This npm package will modify the contents of the MD file, so be careful to back it up!

## Installation

```shell
npm install -g load-markdwon-image
# or
yarn global add load-markdown-image
```

## Usage

```shell
# Download the images in the test.md file
load-markdown-image test.md

# or
load-markdown-image "hello world.md"

# Download images of all MD files in the test folder
load-markdown-image test

# Change the name of the folder where the images are saved
load-markdown-image test.md --fileName=myImg
```

## Features

- Support for download images of a single MD file.
- Support for download images of all MD files under a folder.
- Support for absolute paths, relative paths.
- Automatic recognition of image formats.
- Path name contains spaces, please add double quotes, like `load-markdown-image "hello world.md"`.

## Preview
![load-markdown-image](https://img-blog.csdnimg.cn/e23ef95e4696418eb5db389940a5cd83.png)

## Development

```shell
npm run build
npm link
npm publish
```
