const colorDict = {
  green: '\x1B[32m',
  red: '\x1B[31m',
  white: '\x1B[37m',
}

module.exports = {
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
