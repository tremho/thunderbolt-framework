import * as process from "process";
import * as ac from "ansi-colors";
import * as path from "path";
import * as fs from "fs";

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

export function gatherInfo() {
    resolvePaths()
    getPackageJSONInfo()

    return {
        tbxPath,  // path to the tbx script itself. This establishes where framework is within project node_modules space.
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
    }
}