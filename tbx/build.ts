import * as process from "process";
import * as ac from "ansi-colors";
import * as path from "path";
import * as fs from "fs";
import {gatherInfo} from './gatherInfo'
import {createSMX} from './smx'
import * as os from "os"
import * as webpack from "webpack";
import * as UglifyPlugin from "uglifyjs-webpack-plugin"
import * as tsc from 'node-typescript-compiler'
import * as sass from 'sass'
import {mkdirSync} from "fs";

// Variables resolved and used in build functions
let tbxPath,  // path to the tbx script itself. This establishes where framework is within project node_modules space.
    packPath, // path to directory in framework that holds the sources for the app bootstrap
    projPath, // path to the project
    buildPath, // path to the project build directory space
    distPath,  // path to the project build space for publishing NOT CURRENTL USED
    modulesPath, // path to the node_modules of the framework in the project
    tbBuildSrc, // path to the framework 'src' folder
    fwcomp,  // path to the framework components folder tree
    appPages, // path to the app's pages folder
    riotMain, // path where app.riot is found
    electronExecPath, // execution path for electron, relative to project
    projName, // name of project from project package.json file
    projVersion, // version of project from project package.json file
    projDesc, // description of project from project package.json file
    frontMain, // name of entry module for the app Renderer code, from project package.json file or default (tbAppFront.ts)
    backMain  // name of entry module for the app Back (node) process code, fom project package.json file or default (tbAppBack.ts)


/**
 * Determine values of the path variables
 */
function resolvePaths() {
    tbxPath = process.argv[1]
    // console.log('tbx path = ' + tbxPath)
    let n = tbxPath.indexOf('/.bin/')
    if(n === -1) {
        console.error(ac.red('path error'))
        console.log(' at ' + tbxPath)
        throw Error()
    }
    packPath = tbxPath.substring(0, n)+ '/thunderbolt-framework/buildPack'
    n = tbxPath.indexOf('/node_modules/')
    if(n === -1) {
        console.error(ac.red('path error'))
        console.log(' at ' + tbxPath)
        throw Error()
    }
    projPath = tbxPath.substring(0, n)
    buildPath = path.join(projPath, 'build', 'front')
    distPath = path.join(projPath, 'dist', 'front')

    modulesPath = path.resolve(path.join(packPath, '..', 'node_modules'))

    tbBuildSrc = path.resolve(path.join(packPath, '..', 'build', 'src'))
    fwcomp = path.resolve(path.join(packPath, '..', 'src', 'components'))
    appPages = path.resolve(path.join(projPath, 'src', 'pages'))
    riotMain = path.resolve(path.join(fwcomp, 'global', 'main'))

    electronExecPath = path.join(projPath, 'node_modules', 'thunderbolt-framework', 'node_modules', 'electron',
        'dist', 'Electron.app', 'Contents','MacOS', 'Electron')


    // console.log('packPath = ', packPath)
    // console.log('projPath = ', projPath)
    // console.log('buildPath = ', buildPath)
    // console.log('distPath = ', distPath)
    // console.log('modulesPath = ', modulesPath)
    // console.log('tbBuildSrc = ', tbBuildSrc)
    // console.log('appPages = ', appPages)
    // console.log('riotMain = ', riotMain)
    // console.log('fwcomp = ', fwcomp)

}

function readPackageInfoAtPath(directory):any {
    const pkgFile = path.join(directory, 'package.json')
    if(!fs.existsSync(pkgFile)) {
        console.error(ac.red(`no package.json info found at ${pkgFile}`))
        throw Error()
    }
    const contents = fs.readFileSync(pkgFile).toString()
    const pkgJson = JSON.parse(contents)
    return pkgJson
}

/**
 * Get key info from project package.json
 * including custom tags
 */
function getPackageJSONInfo() {
    const pkgJson = readPackageInfoAtPath(projPath)
    projName = pkgJson.name || 'tbApp'
    projVersion = pkgJson.version || "1.0.0"
    backMain = pkgJson.backMain || 'backMain.js'
    frontMain = pkgJson.frontMain || 'frontMain.js'
    projDesc = pkgJson.description || ''

    // console.log('project name = ', projName)
    // console.log('version = ', projVersion)
    // console.log('backMain = ', backMain)
    // console.log('frontMain = ', frontMain)
}

/**
 * Use webpack to build the
 * renderer bundle
 */
function doWebpackBuild() {
    return new Promise(resolve => {
        console.log('packing...')
        const genDir = path.join(projPath, '.gen')
        const srcDir = path.join(projPath, 'src')
        /*
        TODO:
        cmd option for production/development
        also a command option for source maps (devtool option below)
         */
        webpack({
            mode: 'development', // or development or production TODO: cmd option
            context: packPath,
            entry: './appMain.js',
            output: {
                path: buildPath,
                publicPath: distPath,
                filename: 'bundle.js'
            },
            optimization: {
                minimizer: [
                    new UglifyPlugin({sourceMap:true})
                ]
            },
            // devtool: 'eval-source-map',
            devtool: 'source-map',
            resolve: {
                alias: {
                    Project: srcDir,
                    Generated: genDir,
                    Pages: appPages,
                    Framework: tbBuildSrc,
                    BuildPack: packPath,
                    FrameworkComponents: fwcomp,
                    RiotMain: riotMain
                },
                modules: [modulesPath, appPages, genDir],
                extensions: [ '.tsx', '.ts', '.js', '.riot', 'css' ],
            },
            module: {
                rules: [
                    {
                        test: /\.riot$/,
                        use: '@riotjs/webpack-loader'
                    },
                    {
                        test: /\.tsx?$/,
                        // loader: 'ts-loader', // ts loader is not working right
                        loader: 'awesome-typescript-loader',
                        options: {
                            configFileName: `${packPath}/tsconfig.json`,
                            transpileOnly: true // skip type checks
                        }
                    }
                ]
            }

        }).run((err, stats) => {
            if(err) {
                console.error('Webpack error', err)
            }
            console.log('webpack stats', stats.toString('summary'))
            resolve()
        })
    })
}

/**
 * Final steps:
 * - compile our main node module
 * - copy the index.html file
 * - create an executable in the name of the app that runs electron and points to our main module
 */
function mainAndExec() {
    try {
        tsc.compile({
                lib: 'es2015,dom',
                outdir: 'build'
            }, [`${backMain}`],
            {banner: `Compiling ${projName} ${projVersion}`}
        )
    } catch(e) {
        console.error(`Failed to compile ${backMain}`)
        throw Error()
    }
    try {
        if (!fs.existsSync(buildPath)) {
            fs.mkdirSync(buildPath, {recursive: true})
        }
    } catch(e) {
        console.error(`failed to find or create build path ${buildPath}`)
        throw Error()
    }
    try {
        fs.copyFileSync(path.join(packPath, 'index.html'), path.join(buildPath, 'index.html'))
    } catch(e) {
        console.error(`failed to copy index.html from ${packPath} to ${buildPath}`)
        throw Error()
    }

    /* Not needed ...
    // write out a package.json
    const ourPkg = {
      name: projName,
      version: projVersion,
      description: projDesc,
      main: 'tbAppBack.js'
    }
    fs.writeFileSync(path.join(buildPath, '..', 'package.json'), JSON.stringify(ourPkg))
     */

    // write out an execution script in the name of the app
    // electron tbAppBack.js

    let n = backMain.lastIndexOf('.')
    const backMainJS = backMain.substring(0, n)+".js"

    const index = backMainJS.substring(backMainJS.lastIndexOf('/')+1)
    try {
        fs.writeFileSync(path.join(buildPath, '..', projName), `#!/bin/bash\n\n${electronExecPath} ${index}\n`, {mode: '777'})
    } catch(e) {
        console.error(`failed to create executable ${projName} from ${index} using ${electronExecPath}`)
        throw Error()
    }

}

function generateBuildEnvironment() {
    const genDir = path.join(projPath, '.gen')
    if(!fs.existsSync(genDir)) {
        fs.mkdirSync(genDir)
    }

    // read version of Thunderbolt we are using from its package.json
    const tbDir = path.resolve(path.join(modulesPath, '..'))
    let pkg = readPackageInfoAtPath(tbDir)
    const tbVersion = pkg.version
    // read version of electron from its package.json
    const electronDir = path.resolve(path.join(tbDir, 'node_modules', 'electron'))
    pkg = readPackageInfoAtPath(electronDir)
    const electronVersion = pkg.version


    const environment = {
        framework: {
            name: 'ThunderBolt/Desktop',
            version: tbVersion,
        },
        platform: {
            name: os.platform(),
            version: os.release()
        },
        node: {
            version: process.versions.node
        },
        host: {
            electron: electronVersion
            // nativescript // TODO: In export or during mobile build
        },
        app: {
            name: projName,
            version: projVersion,
            description: projDesc,
            buildTime: Date.now()
        }
    }

    try {
        const str = '\n' + JSON.stringify(environment, null, 2) + '\n'
        const outPath = path.normalize(path.join(genDir, 'BuildEnvironment.json'))
        // console.log('writing to ', outPath)
        fs.writeFileSync(outPath, str)
    } catch(e) {
        console.error(`failed to create environment info`)
        throw e
    }
}

function compileScss() {
    const mainScss = 'app.scss'
    const appScss = path.join(projPath, 'src', 'scss', mainScss)
    if(!fs.existsSync(appScss)) {
        console.warn(`${ac.bgYellow('WARNING:')} missing ${ac.bold('app.scss')} file - no css will be generated.`)
        return;
    }
    const appCss = path.join(buildPath, 'app.css')
    if(!fs.existsSync(buildPath)) {
        mkdirSync(buildPath, {recursive: true})
    }
    try {
        const result = sass.renderSync({file: appScss})
        console.log(`${result.stats.includedFiles.length} files compiled to css in ${result.stats.duration} ms`)
        const cssContent = result.css.toString()
        fs.writeFileSync(appCss, cssContent)
    } catch(e) {
        console.error('Sass error', e)
        throw Error()
    }
}

function summary() {
    console.log('')
    console.log(`${projName} ${projVersion}`)
    console.log(projDesc)
}

export function doBuild() {
    console.log('building...')
    try {
        const info = gatherInfo()
        tbxPath = info.tbxPath
        packPath = info.packPath
        projPath = info.projPath
        buildPath = info.buildPath
        distPath = info.distPath
        modulesPath = info.modulesPath
        tbBuildSrc = info.tbBuildSrc
        fwcomp = info.fwcomp
        appPages = info.appPages
        riotMain = info.riotMain
        electronExecPath = info.electronExecPath
        projName = info.projName
        projVersion = info.projVersion
        projDesc = info.projDesc
        frontMain = info.frontMain
        backMain = info.backMain

        generateBuildEnvironment()
        compileScss()
        doWebpackBuild().then(() => {
            createSMX()
            mainAndExec()
            summary()
        })
    } catch(e) {
        console.error(e)
        process.exit(-1)
    }

    console.log('')
}
