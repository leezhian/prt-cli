const inquirer = require('inquirer') // 用于命令交互
const fse = require('fs-extra') // 
const download = require('download-git-repo') // 用来下载远程模板
const {
  TEMPLATE_GIT_REPO,
  TEMPLATE_FILES
} = require('./constants') // 配置
const chalk = require('chalk') // 用于修改控制台输出内容样式
const ora = require('ora') // 显示loading动画
const path = require('path')
const memFs = require('mem-fs') // 用于操作模板
const editor = require('mem-fs-editor')
const {
  getDirFileName
} = require('./utils')
const {
  exec
} = require('child_process')

/**
 * @description: 创建一个项目
 * @param {object} options
 */
function Project(options) {
  this.config = Object.assign({
    projectName: ''
  }, options);
  const store = memFs.create();
  this.memFsEditor = editor.create(store);
}

/**
 * @description: 创建
 */
Project.prototype.create = function () {
  this.inquire()
    .then((answer) => {
      // 合并配置
      this.config = Object.assign(this.config, answer)
      this.generate()
    })
}

/**
 * @description: 询问
 */
Project.prototype.inquire = function () {
  const prompts = []
  const {
    projectName
  } = this.config
  if (typeof projectName !== 'string') {
    prompts.push({
      type: 'input',
      name: 'projectName',
      message: '请输入项目名：',
      validate(input) {
        if (!input) {
          return '项目名不能为空';
        }
        if (fse.existsSync(input)) {
          return '当前目录已存在同名项目，请更换项目名:';
        }
        return true;
      }
    });
  } else if (fse.existsSync(projectName)) {
    prompts.push({
      type: 'input',
      name: 'projectName',
      message: '当前目录已存在同名项目，请更换项目名:',
      validate(input) {
        if (!input) {
          return '项目名不能为空'
        }
        if (fse.existsSync(input)) {
          return '当前目录已存在同名项目，请更换项目名:'
        }
        return true
      }
    })
  }

  return inquirer.prompt(prompts)
}

/**
 * @description: 模板替换
 * @param {string} source 源文件路径
 * @param {string} dest 目标文件路径
 * @param {object} data 替换文本字段
 */
Project.prototype.injectTemplate = function (source, dest, data) {
  this.memFsEditor.copyTpl(
    source,
    dest,
    data
  )
}

/**
 * @description: 克隆模板
 */
Project.prototype.generate = function () {
  const {
    projectName
  } = this.config
  // 获取项目路径 即 x:/xxx/projectName
  const projectPath = path.join(process.cwd(), projectName)
  // 获取下载模板存放路径 即 x:/xxx/projectName/__download__
  const downloadPath = path.join(projectPath, '__download__')
  // loading
  const downloadSpinner = ora('正在初始化模板，请稍等...')
  downloadSpinner.start()
  // 下载git repo
  download(TEMPLATE_GIT_REPO, downloadPath, {
    clone: true
  }, (err) => {
    // 下载出错
    if (err) {
      downloadSpinner.color = 'red';
      downloadSpinner.fail(err.message);
      return;
    }

    downloadSpinner.color = 'green';
    downloadSpinner.succeed('下载成功');

    console.log()
    // 读取下载的文件
    const copyFiles = getDirFileName(downloadPath)

    // 复制文件
    copyFiles.forEach((file) => {
      fse.copySync(path.join(downloadPath, file), path.join(projectPath, file));
      console.log(`${chalk.green('✔ ')}${chalk.grey(`创建: ${projectName}/${file}`)}`);
    })

    // 替换模板
    Object.keys(TEMPLATE_FILES).forEach(file => {
      this.injectTemplate(path.join(downloadPath, file), path.join(projectName, TEMPLATE_FILES[file]), {
        projectName
      })
    })

    this.memFsEditor.commit(() => {
      Object.keys(TEMPLATE_FILES).forEach(file => {
        console.log(`${chalk.green('✔ ')}${chalk.grey(`创建: ${projectName}/${TEMPLATE_FILES[file]}`)}`);
      })

      // 移除临时下载文件夹
      fse.remove(downloadPath)
      // 改变工作目录，即为 项目根目录 x:/xxx/projectName
      process.chdir(projectPath)

      // git 初始化
      console.log();
      const gitInitSpinner = ora(`cd ${chalk.green.bold(projectName)}目录, 执行 ${chalk.green.bold('git init')}`);
      gitInitSpinner.start();

      const gitInit = exec('git init');
      gitInit.on('close', (code) => {
        if (code === 0) {
          gitInitSpinner.color = 'green';
          gitInitSpinner.succeed(gitInit.stdout.read());
        } else {
          gitInitSpinner.color = 'red';
          gitInitSpinner.fail(gitInit.stderr.read());
        }

        // 安装依赖
        console.log()
        const installSpinner = ora(`正在安装项目依赖 ${chalk.green.bold('npm install')}, 请稍后...`)
        installSpinner.start()
        exec('npm install', (error, stdout, stderr) => {
          if (error) {
            installSpinner.color = 'red'
            installSpinner.fail(chalk.red('安装项目依赖失败，请自行重新安装！'))
            console.log(error)
          } else {
            installSpinner.color = 'green'
            installSpinner.succeed('安装依赖成功')
            console.log(`${stderr}${stdout}`)

            console.log();
            console.log(chalk.green('创建项目成功！'))
            console.log(chalk.green('Let\'s Coding！'))
          }
        })
      })
    })
  })
}

module.exports = Project