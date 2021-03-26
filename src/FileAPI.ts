
import * as fs from 'fs'
import * as path from 'path'

function PathNotFound(path) {
    class PathNotFound extends Error {
        constructor(path) {
            super(`Path ${path} does not exist`)
        }
    }
    return new PathNotFound(path)
}

export function getAppPath() {
    let appPath = process.cwd()
    if(!appPath) {
        return './'
    }
    return appPath.substring(0, appPath.lastIndexOf('/'))
}



export function readFileText(pathName) {
    const contents = fs.readFileSync(pathName).toString()
    console.log(contents)
    return contents
}
export function fileExists(pathName) {
    return fs.existsSync(pathName)
}

