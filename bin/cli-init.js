#! /usr/bin/env node

const program = require('commander');
const Project = require('../lib/project');

// 自定义标志 options
program
  .option('--name [name]', 'project name')
  .parse(process.argv)

const { name } = program
const args = program.args

// 项目名称
const projectName = args[0] || name

// 初始化项目
const project = new Project({
  projectName
})

project.create()