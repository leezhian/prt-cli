#! /usr/bin/env node
const program = require('commander') // 命令行工具

// command 添加命令
program.version('1.0.0')
  .usage('<command> [options]')
  .command('init [name]', 'init a project')
  .parse(process.argv)