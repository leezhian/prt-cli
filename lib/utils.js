const path = require('path');
const fse = require('fs-extra');
const {
  EXCLUDE_FILES
} = require('./constants');

function getRootPath() {
  return path.resolve(__dirname, './..');
}

function getPackageVersion() {
  const version = require(path.join(getRootPath(), 'package.json')).version
  return version
}

// 输出脚手架版本
function logPackageVersion() {
  const msg = `pr-cli version: ${getPackageVersion()}`;
  console.log();
  console.log(msg);
  console.log();
}

exports.logPackageVersion = logPackageVersion;

/**
 * @description: 读取文件夹
 * @param {string} dir 文件夹路径
 * @return {Array} 文件数组
 */
function getDirFileName(dir) {
  try {
    // 读取文件夹
    const files = fse.readdirSync(dir)
    const filesToCopy = []
    files.forEach((file) => {
      if (EXCLUDE_FILES.includes(file)) return
      filesToCopy.push(file)
    })
    return filesToCopy
  } catch (e) {
    return []
  }
}

exports.getDirFileName = getDirFileName