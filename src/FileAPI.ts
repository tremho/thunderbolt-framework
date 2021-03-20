
import * as fs from 'fs'
import * as path from 'path'

export function readFileText(filename) {
    let fpath = path.normalize(path.join(__dirname, '..','..','..','..',filename))
    // console.log('reading file at '+fpath)
    if(!fs.existsSync(fpath)) {
        console.error(fpath + ' not found')
        return ''
    }
    try {
        const contents = fs.readFileSync(fpath).toString()
        return contents
    } catch(e) {
        console.error(e)
        return ''
    }
}
export function fileExists(filename) {
    let fpath = path.normalize(path.join(__dirname, '..','..','..','..',filename))
    return fs.existsSync(fpath)
}

