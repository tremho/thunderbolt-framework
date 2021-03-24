
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

export function readFileText(filename) {
    let fpath = path.isAbsolute(filename) ? filename : path.normalize(path.join(__dirname, '..','..','..','..',filename))
    const contents = fs.readFileSync(fpath).toString()
    console.log(contents)
    return contents
}
export function fileExists(filename) {
    let fpath = path.normalize(path.join(__dirname, '..','..','..','..',filename))
    return fs.existsSync(fpath)
}

