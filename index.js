const colorDict = {
  green: '\x1B[32m',
  red: '\x1B[31m',
  white: '\x1B[37m',
}
const log = {
  success: (...msg) => {
    console.log(colorDict.green, '✔', ...msg)
  },
  error: (...msg) => {
    console.log(colorDict.red, '✗', ...msg)
  },
  info: (...msg) => {
    console.log(colorDict.white, ' ', ...msg)
  },
}

const path = require('path')
const fs = require('fs')
const axios = require('axios')

const inputPath = process.argv[2]
const fileName =
  process.argv.find((item) => item.includes('--fileName='))?.split('=')?.[1] || 'images'

let rootPath = path.resolve(inputPath)
let files = []
if (rootPath.slice(-3) === '.md') {
  // 文件
  const { dir, base } = path.parse(rootPath)
  rootPath = dir
  files = [base]
} else {
  files = fs.readdirSync(rootPath).filter((item) => item.slice(-3) === '.md')
}

if (files.length === 0) {
  log.info('No file')
  process.exit(1)
}

const timeStart = Date.parse(new Date())
log.info('Process the directory:', rootPath)
work().then(() => {
  log.success('Completed in', `${(Date.parse(new Date()) - timeStart) / 1000}s`)
  log.success('Images saved at:', `${rootPath}/${fileName}`)
})

async function work() {
  try {
    fs.mkdirSync(`${rootPath}/${fileName}`)
  } catch (e) {
    if (e.code === 'EEXIST') {
    } else {
      log.error(e)
      return
    }
  }
  for (const fileItem of files) {
    const filePath = `${rootPath}/${fileItem}`
    let originContent = fs.readFileSync(filePath, 'utf8')
    // 过滤掉code
    let { content, placeholderDict } = filterCode(originContent)
    const pattern = /!\[(.*?)\]\((.*?)\)/gm // 匹配图片正则
    const imgList = content.match(pattern) || [] // ![img](http://hello.com/image.png)
    for (const match of imgList) {
      const url = match.split('](')[1].slice(0, -1) // http://hello.com/image.png
      if (!/^http/.test(url)) {
        continue
      }
      try {
        log.info('Downloading:', url)
        // 匹配url的图片格式信息
        if (!getTypeByUrl(url)) {
          // 处理url没有格式的图片
          const imageName = await setNoTypeImage(url)
          log.success('Download success:', imageName)
          log.info('\n')
          if (imageName) {
            const replaceStr = match.replace(url, `./${fileName}/${imageName}`)
            content = content.replace(match, replaceStr)
            fs.writeFileSync(filePath, getOriginContent({ content, placeholderDict }), 'utf8')
          }
          continue
        }
        const { imageName } = await getLocalPath(url)
        log.success('Download success:', imageName)
        const replaceStr = match.replace(url, `./${fileName}/${imageName}`)
        content = content.replace(match, replaceStr)
        fs.writeFileSync(filePath, getOriginContent({ content, placeholderDict }), 'utf8')
      } catch (e) {
        log.error('Download failed:', 'code:', e.code + '')
      }
      log.info('\n')
    }
  }
}

// 下载图片
function getLocalPath(url) {
  const fileType = getTypeByUrl(url)
  const imageName = `${new Date().getTime()}${fileType ? `.${fileType}` : ''}`
  return axios({
    url: encodeURI(url),
    responseType: 'stream',
    timeout: 10000,
  }).then((response) => {
    return new Promise((resolve, reject) => {
      const imagePath = `${rootPath}/${fileName}/${imageName}`
      response.data
        .pipe(fs.createWriteStream(imagePath))
        .on('finish', () => resolve({ imageName, imagePath }))
        .on('error', (e) => reject(e))
    })
  })
}

// 通过URL获取图片格式
function getTypeByUrl(url) {
  const res = url
    .toLowerCase()
    .replace(/\s*/g, '') // 清除空格
    .replace(/[?#]*$/g, '') // 清除结尾的?#字符
    .match(/\.[a-z]{3,5}$/g) // 匹配类型
  return res ? res[0].slice(1) : ''
}

// 先下载，再识别图片格式
async function setNoTypeImage(url) {
  const { imageName, imagePath } = await getLocalPath(url)
  const buffer = fs.readFileSync(imagePath)
  const imageType = getImageSuffix(buffer)
  if (imageType) {
    fs.renameSync(imagePath, imagePath + imageType)
    return imageName + imageType
  } else {
    fs.unlinkSync(imagePath)
    return ''
  }
}

function getImageSuffix(fileBuffer) {
  // 将上文提到的 文件标识头 按 字节 整理到数组中
  const imageBufferHeaders = [
    { bufBegin: [0xff, 0xd8], bufEnd: [0xff, 0xd9], suffix: '.jpg' },
    { bufBegin: [0x00, 0x00, 0x02, 0x00, 0x00], suffix: '.tga' },
    { bufBegin: [0x00, 0x00, 0x10, 0x00, 0x00], suffix: '.rle' },
    {
      bufBegin: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      suffix: '.png',
    },
    { bufBegin: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], suffix: '.gif' },
    { bufBegin: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], suffix: '.gif' },
    { bufBegin: [0x42, 0x4d], suffix: '.bmp' },
    { bufBegin: [0x0a], suffix: '.pcx' },
    { bufBegin: [0x49, 0x49], suffix: '.tif' },
    { bufBegin: [0x4d, 0x4d], suffix: '.tif' },
    {
      bufBegin: [0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x20, 0x20],
      suffix: '.ico',
    },
    {
      bufBegin: [0x00, 0x00, 0x02, 0x00, 0x01, 0x00, 0x20, 0x20],
      suffix: '.cur',
    },
    { bufBegin: [0x46, 0x4f, 0x52, 0x4d], suffix: '.iff' },
    { bufBegin: [0x52, 0x49, 0x46, 0x46], suffix: '.ani' },
  ]
  for (const imageBufferHeader of imageBufferHeaders) {
    let isEqual
    // 判断标识头前缀
    if (imageBufferHeader.bufBegin) {
      const buf = Buffer.from(imageBufferHeader.bufBegin)
      isEqual = buf.equals(
        //使用 buffer.slice 方法 对 buffer 以字节为单位切割
        fileBuffer.slice(0, imageBufferHeader.bufBegin.length)
      )
    }
    // 判断标识头后缀
    if (isEqual && imageBufferHeader.bufEnd) {
      const buf = Buffer.from(imageBufferHeader.bufEnd)
      isEqual = buf.equals(fileBuffer.slice(-imageBufferHeader.bufEnd.length))
    }
    if (isEqual) {
      return imageBufferHeader.suffix
    }
  }
  // 未能识别到该文件类型
  return ''
}

function filterCode(content = '') {
  let tempContent = content
  const placeholderDict = {}
  const regex1 = /\s?\`\`\`\n?([^`]+)\`\`\`/gm
  const list = content.match(regex1) || []
  list.forEach((item) => {
    const id = 'placeholder-' + uuid()
    tempContent = tempContent.replace(item, id)
    placeholderDict[id] = item
  })
  tempContent = tempContent
    .split('\n')
    .map((item) => {
      if (/^\s{4,}/g.test(item) || /\`([\s\S]*)\`/g.test(item)) {
        const id = 'placeholder-' + uuid()
        placeholderDict[id] = item
        return id
      }
      return item
    })
    .join('\n')
  return { content: tempContent, placeholderDict }
}

function getOriginContent({ content, placeholderDict }) {
  return Object.keys(placeholderDict).reduce((res, item, index) => {
    return res.replace(item, placeholderDict[item])
  }, content)
}

function uuid() {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  }
  const res = S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4()
  return res
}
