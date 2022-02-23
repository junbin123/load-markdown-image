/**
 * TODO:base64模式，图片重复处理
 * TODO:windows 系统路径问题
 */
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const log = require('./utils/log')
const { getImageSuffix, getTypeByUrl } = require('./utils/common')

const inputPath = process.argv[2]
const fileName =
  process.argv.find((item) => item.includes('--fileName='))?.split('=')?.[1] || 'images'

const isBase64 = process.argv.find((item) => item === '--base64') // 使用base64

let rootPath = path.resolve(inputPath)
let files = []
if (rootPath.slice(-3) === '.md') {
  const { dir, base } = path.parse(rootPath)
  rootPath = dir
  files = [base]
} else {
  files = fs.readdirSync(rootPath).filter((item) => item.slice(-3) === '.md')
}
if (files.length === 0) {
  log.info('No file')
  return
}

const timeStart = Date.parse(new Date())
log.info('Process the directory:', rootPath)
main().then(() => {
  log.success('Completed in', `${(Date.parse(new Date()) - timeStart) / 1000}s`)
  log.success('Images saved at:', `${rootPath}/${fileName}`)
})

async function main() {
  try {
    fs.mkdirSync(`${rootPath}/${fileName}`)
  } catch (e) {
    if (e.code !== 'EEXIST') {
      log.error(e)
      return
    }
  }
  for (const fileItem of files) {
    const filePath = `${rootPath}/${fileItem}`
    let content = fs.readFileSync(filePath, 'utf8')
    const pattern = /!\[(.*?)\]\((.*?)\)/gm // 匹配图片正则
    const imgList = content.match(pattern) || [] // ![img](http://hello.com/image.png)
    for (const imgStr of imgList) {
      const url = imgStr.split('](')[1].slice(0, -1) // http://hello.com/image.png
      if (!/^http/.test(url)) {
        try {
          if (isBase64) {
            // 处理本地路径图片
            const imageAbsolutePath = path.resolve(rootPath, url)
            const base64Id = `${new Date().getTime()}-lmi`
            const addBase64Str = `\n[${base64Id}]: ${getImgBase64({ filePath: imageAbsolutePath })}`
            const replaceStr = `${imgStr.split('](')[0]}][${base64Id}]`
            content = content.replace(imgStr, replaceStr) + addBase64Str
            fs.writeFileSync(filePath, content, 'utf8')
          }
        } catch (err) {
          log.error(err)
        }
        continue
      }
      log.info('Downloading:', url)
      try {
        // 匹配url的图片格式信息
        if (!getTypeByUrl(url)) {
          // 处理url没有格式的图片
          const { imageName, imagePath } = await setNoTypeImage(url)
          log.success('Download success:', imageName)
          log.info('\n')
          if (imageName) {
            if (isBase64) {
              const base64Id = imageName.split('.')[0] + '-lmi'
              const base64Code = getImgBase64({ filePath: imagePath })
              const addBase64Str = `\n[${base64Id}]: ${base64Code}`
              const replaceStr = `${imgStr.split('](')[0]}][${base64Id}]`
              content = content.replace(imgStr, replaceStr) + addBase64Str
              fs.writeFileSync(filePath, content, 'utf8')
              fs.unlinkSync(imagePath)
            } else {
              const replaceStr = imgStr.replace(url, `./${fileName}/${imageName}`)
              content = content.replace(imgStr, replaceStr)
              fs.writeFileSync(filePath, content, 'utf8')
            }
          }
          continue
        }
        const { imageName, imagePath } = await getLocalPath(url)
        log.success('Download success:', imageName)
        if (isBase64) {
          const base64Id = imageName.split('.')[0] + '-lmi'
          const addBase64Str = `\n[${base64Id}]: ${getImgBase64({ filePath: imagePath })}`
          const replaceStr = `${imgStr.split('](')[0]}][${base64Id}]`
          content = content.replace(imgStr, replaceStr) + addBase64Str
          fs.writeFileSync(filePath, content, 'utf8')
          fs.unlinkSync(imagePath)
        } else {
          const replaceStr = imgStr.replace(url, `./${fileName}/${imageName}`)
          content = content.replace(imgStr, replaceStr)
          fs.writeFileSync(filePath, content, 'utf8')
        }
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

// 先下载，再识别图片格式
async function setNoTypeImage(url) {
  const { imageName, imagePath } = await getLocalPath(url)
  const buffer = fs.readFileSync(imagePath)
  const imageType = getImageSuffix(buffer)
  if (imageType) {
    fs.renameSync(imagePath, imagePath + imageType)
    return {
      imagePath: imagePath + imageType,
      imageName: imageName + imageType,
    }
  } else {
    fs.unlinkSync(imagePath)
    return ''
  }
}

function getImgBase64({ filePath }) {
  const fileType = getTypeByUrl(filePath)
  const bitmap = fs.readFileSync(filePath)
  const base64Str = Buffer.from(bitmap, 'binary').toString('base64')
  return `data:image/${fileType};base64,${base64Str}`
}
