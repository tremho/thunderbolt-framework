
let fs, path, os

try {
    fs = require('fs')
    path = require('path')
    os = require('os')
} catch(e) {
    console.warn('FileAPI unavailable -- make a forking solution for this')
}

function PathNotFound(path:string) {
    class PathNotFound extends Error {
        constructor(path) {
            super(`Path ${path} does not exist`)
        }
    }
    return new PathNotFound(path)
}

export function getAppPath():string {
    let appPath = process.cwd()
    if(!appPath) {
        return './'
    }
    return appPath.substring(0, appPath.lastIndexOf('/'))
}



export function readFileText(pathName:string):string {
    try {
        return fs.readFileSync(pathName).toString()
    } catch(e) {
        throw e
    }
}
export function fileExists(pathName:string):boolean {
    return fs.existsSync(pathName)
}

export function readFileArrayBuffer(pathName:string):ArrayBuffer {
    return fs.readFileSync(pathName).buffer
}

export function writeFileText(pathName:string, text:string) {
    try {
        fs.writeFileSync(pathName, text)
    } catch(e) {
        throw e
    }
}

export function writeFileArrayBuffer(pathName:string, data:ArrayBuffer) {
    try {
        fs.writeFileSync(pathName, new Uint8Array(data))
    } catch(e) {
        throw e
    }
}

export function fileDelete(pathName:string) {
    try {
        fs.unlinkSync(pathName)
    } catch(e) {
        throw e
    }
}

export function fileMove(pathName:string, newPathName:string) {
    try {
        fs.renameSync(pathName, newPathName)
    } catch(e) {
        throw e
    }
}

export function fileRename(pathName:string, newBase:string) {
    newBase = newBase.substring(newBase.lastIndexOf(path.sep)+1)
    const atPath = pathName.substring(0, pathName.lastIndexOf(path.sep)+1)
    const newPath = path.join(atPath, newBase)
    fileMove(pathName, newPath)
}

export function fileCopy(pathName:string, toPathName:string) {
    try {
        fs.copyFileSync(pathName, toPathName)
    } catch(e) {
        throw e
    }
}

// TODO: should have a better fix for this overall
// export type FileInfo = fs.Stats

export class FileDetails  {
    parentPath: string
    fileName:string
    info:any // FileInfo
}

export function fileStats(pathName:string) /*:FileInfo*/ {
    try {
        return fs.lstatSync(pathName)
    } catch(e) {
        throw e
    }
}

export function createFolder(pathName:string) {
    try {
        fs.mkdirSync(pathName, {recursive: true})
    } catch(e) {
        throw e
    }
}

export function removeFolder(pathName:string, andClear:boolean) {

    try {
        fs.rmdirSync(pathName, {recursive:andClear})
    } catch(e) {
        throw e
    }
}

export function readFolder(pathName:string):FileDetails[] {
    const details:FileDetails[] = []

    const entries = fs.readdirSync(pathName, {withFileTypes: true})
    entries.forEach(entry => {
        const det = new FileDetails()
        det.parentPath = pathName
        det.fileName = entry.name
        det.info = fileStats(path.join(pathName, entry.name))
        details.push(det)
    })
    return details
}

class UserPathInfo {
    home:string
    cwd:string
    userName:string
    uid:Number
    gid:Number
}
export function getUserAndPathInfo(): UserPathInfo {
    const userInfo = os.userInfo()
    const out = new UserPathInfo()
    out.home = userInfo.homedir
    out.cwd =  process.cwd()
    out.userName = userInfo.username
    out.uid = userInfo.uid
    out.gid = userInfo.gid
    return out
}