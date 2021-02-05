#! /usr/bin/env node

const program = require('commander');
const Project = require('../lib/project');

program
  .option('--name [name]', '项目名称')
  .parse(process.argv)

const { name } = program
const args = program.args

const projectName = args[0] || name

const project = new Project({
  projectName
})

project.create()