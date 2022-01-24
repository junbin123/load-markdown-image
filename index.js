if (process.argv.length !== 3) {
  console.log("命令行：load-markdown-image hello.md");
  process.exit(0);
}

const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");

const inputPath = process.argv[2];
let rootPath = path.resolve(inputPath);
let files = [];
if (rootPath.slice(-3) === ".md") {
  // 文件
  const { dir, base } = path.parse(rootPath);
  rootPath = dir;
  files = [base];
} else {
  files = fs.readdirSync(rootPath).filter((item) => item.slice(-3) === ".md");
}

if (files.length === 0) {
  process.exit(0);
}

const timeStart = Date.parse(new Date());
console.log("目录：", rootPath);
work().then(() => {
  console.log(`下载完成，耗时 ${(Date.parse(new Date()) - timeStart) / 1000}s`);
});

async function work() {
  try {
    fs.mkdirSync(`${rootPath}/images`);
  } catch (e) {
    if (e.code === "EEXIST") {
    } else {
      console.log(e);
      process.exit(1);
    }
  }
  for (const fileName of files) {
    const filePath = `${rootPath}/${fileName}`;
    let content = fs.readFileSync(filePath, "utf8");
    const pattern = /!\[(.*?)\]\((.*?)\)/gm; // 匹配图片正则
    const imgList = content.match(pattern) || []; // ![img](http://hello.com/image.png)
    for (const match of imgList) {
      const url = match.split("](")[1].slice(0, -1); // http://hello.com/image.png
      if (!/^http/.test(url)) {
        continue;
      }
      if (!url.toLowerCase().match(/.(png|jpg|jpeg|gif|webp)$/)) {
        continue;
      }
      console.log("正在下载:", url);
      try {
        const localFileName = await getLocalPath(url);
        console.log("下载完成:", localFileName);
        const replaceStr = match.replace(url, `./images/${localFileName}`);
        content = content.replace(match, replaceStr);
        fs.writeFileSync(filePath, content, "utf8");
      } catch (e) {
        console.log({ code: e.code });
      }
      console.log("\n");
    }
  }
}

function getLocalPath(url) {
  const fileType = url.toLowerCase().match(/.(png|jpg|jpeg|gif|webp)$/)[1];
  const fileName = `${new Date().getTime()}.${fileType}`;

  const promise = new Promise((resolve, reject) => {
    const api = /^https/.test(url) ? https : http;
    api.get(encodeURI(url), { timeout: 10000 }, (res) => {
      const path = `${rootPath}/images/${fileName}`;
      res
        .pipe(fs.createWriteStream(path))
        .on("finish", () => resolve(fileName))
        .on("error", (e) => reject(e));
    });
  });
  return promise;
}
