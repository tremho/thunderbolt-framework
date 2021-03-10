#!/usr/bin/env node

import * as ac from 'ansi-colors'
import * as process from 'process'

const command = process.argv[2]
const args = process.argv.slice(3)

function processCommand() {
  switch (command) {
    case 'help':
      return doHelp(args[0] || '')
    case 'build':
      return doBuild()
    case 'run':
      return doRun()
    case 'doc':
      return doDoc()
    case 'test':
      return doTest()
    case 'nativescript':
      return doNativeScript()
    default:
      return doUnknown(command)
  }
}

function printBanner() {
    let out = '  ' + ac.green('╭───────────────────────────────────────────────────────────────╮')+'\n'
       out += '  ' + ac.green('|                                                               |')+'\n'
       out += '  ' + ac.green('|                     Thunderbolt Framework                     |')+'\n'
       out += '  ' + ac.green('|                                                               |')+'\n'
       out += '  ' + ac.green(`| ${ac.magenta(`version ${ac.gray(`1.0.0`)}`)}                                                 |`) +'\n'
       out += '  ' + ac.green('|                                                               |')+'\n'
       out += '  ' + ac.green('╰───────────────────────────────────────────────────────────────╯')+'\n'

       console.log(out)
}

function doUnknown(command) {
  printBanner()
  console.log(ac.red.bold(`Unrecognized command ${command || ''}`))
  console.log(ac.grey.dim('try'))
  console.log(ac.blue.dim('help, build, run, doc, test, nativescript'))
  console.log('')
}

function doHelp(command) {
  printBanner()
  switch(command) {
    case 'help':
      return helpHelp()
    case 'build':
      return helpBuild()
    case 'run':
      return helpRun()
    case 'doc':
      return helpDoc()
    case 'test':
      return helpTest()
    case 'nativescript':
      return helpNativeScript()
    default:
      return helpDefault()
  }
}

function helpDefault() {
  console.log('tbx is the command-line tool of the Thunderbolt framwork.')
  console.log(ac.bold(`Usage: ${ac.grey(`tbx ${ac.grey.dim(`command  [args]`)}`)}`))
  console.log(`where ${ac.grey.dim(`command`)} is one of:`)
  console.log(`  ${ac.blue.bold(`help ${ac.grey.dim(`[command]`)}`)} -- general help, or help on a given command`)
  console.log(`  ${ac.blue.bold(`build`)}  -- build the project for desktop`)
  console.log(`  ${ac.blue.bold(`run`)}  -- build and run the desktop project`)
  console.log(`  ${ac.blue.bold(`doc`)}  -- generate documentation from JavaDoc-style comment blocks`)
  console.log(`  ${ac.blue.bold(`test`)}  -- run tests`)
  console.log(`  ${ac.blue.bold(`nativescript`)}-- Export to a Nativescript Mobile project`)
  console.log('')
  console.log('zero or more arguments may follow a command, and are specific to the context of that command.')

}

function helpHelp() {
  console.log(ac.bold('help'))
  console.log(`use ${ac.bold('tbx help')} by itself to see a list of commands`)
  console.log(`use ${ac.bold(`tbx help ${ac.grey.dim('[commmand]')}`)} for help on a given command`)
}

function helpBuild() {
  console.log(ac.bold('build'))
  console.log('builds the desktop project')
}

function helpRun() {
  console.log(ac.bold('run'))
  console.log('builds and then runs the desktop project')
}

function helpDoc() {
  console.log(ac.bold('doc'))
  console.log('Generates the documentation for the project')
}

function helpTest() {
  console.log(ac.bold('test'))
  console.log('Executes the tests defined for the project')
}

function helpNativeScript() {
  console.log(ac.bold('test'))
  console.log('Exports project into a new project space for Nativescript mobile development')
}

function doBuild() {
  console.log('building...')
}
function doDoc() {
  console.log('generating documentation...')
}
function doRun() {
  console.log('running...')
}
function doTest() {
  console.log('running tests...')
}
function doNativeScript() {
  console.log('exporting to Nativescript...')
}

processCommand()