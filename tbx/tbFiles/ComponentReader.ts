/*
enumerate and read tbc/ tbcm files from 'components' directory into data ready for export
 */

import * as fs from "fs"
import * as path from 'path'
import * as convert from 'xml-js'
import {ComponentInfo} from "./ComponentInfo";
import {writeRiotFile} from "./ComponentWriterRiot";
import {writeNativeScriptFile} from "./ComponentWriterNS";

enum ParsedState {
    none,
    component,
    bind,
    layout,
    methods,
    beforeLayout,
    afterLayout,
    style,
}

/**
 * Read the component common file and ingest it into an info object
 * @param filepath
 */
function readComponent(filepath:string): ComponentInfo {
    const info = new ComponentInfo()
    let state:ParsedState = ParsedState.none
    let layoutXml = ''
    let bindDeclarations = ''

    try {
        const str = fs.readFileSync(filepath).toString()
        const lines = str.split('\n')
        for(let i = 0; i<lines.length; i++) {
            let line = lines[i]
            let cn = line.indexOf('//')
            if(cn !== -1) line = line.substring(0, cn)
            line = line.trim()
            if(!line.length) continue
            if(line.charAt(0) === '#') {
                // changing state
                let n = line.indexOf(' ', 1)
                if (n === -1) n = line.length
                let tag = line.substring(1, n).toLowerCase()
                if(tag.charAt(tag.length-1) === ':') tag = tag.substring(0,tag.length-1)
                let value = line.substring(n).trim()
                if(value.charAt(0) === value.charAt(value.length-1)) {
                    if(value.charAt(0) === "'" || value.charAt(0) === '"') {
                        value = value.substring(1, value.length-1)
                    }
                }
                switch (tag) {
                    case 'component':
                        if (state !== ParsedState.none) {
                            console.error('"#component statement must occur first')
                        } else {
                            info.id = value
                            state = ParsedState.component
                        }
                        break;
                    case 'bind':
                        if (state === ParsedState.none) {
                            console.error('"#component expected as first statement')
                        } else {
                            bindDeclarations = value
                            state = ParsedState.bind
                        }
                        break;
                    case 'layout':
                        if (state === ParsedState.none) {
                            console.error('"#component expected as first statement')
                        } else {
                            state = ParsedState.layout
                        }
                        break
                }
            } else if(line.charAt(0) === '$') {
                let en = line.indexOf('(', 1)
                if (en !== -1) {
                    let mtg = line.substring(0, en).trim()
                    let pe = line.indexOf(')', en)
                    let pm = line.substring(en+1, pe)
                    let pos = str.indexOf(mtg)+mtg.length
                    pos = str.indexOf('{', pos)
                    let blkend = str.indexOf('\n$', pos)
                    if (blkend === -1) blkend = str.indexOf('\n#', pos)
                    if (blkend === -1) blkend = str.indexOf('\nbeforeLayout', pos)
                    if (blkend === -1) blkend = str.indexOf('\nafterLayout', pos)
                    if (blkend === -1) blkend = str.indexOf('\n<', pos)
                    if (blkend === -1) blkend = str.length
                    blkend = str.lastIndexOf('}', blkend)+1
                    let code = str.substring(pos, blkend).trim()
                    let name = mtg.substring(1, mtg.length)
                    info.methods[name] = code
                    info.params[name] = pm
                    state = ParsedState.methods
                }
            } else if(line.substring(0,12) === 'beforeLayout' || line.substring(0,11) === 'afterLayout') {
                let en = line.indexOf('(', 1)
                if (en !== -1) {
                    let mtg = line.substring(0, en).trim()
                    let pe = line.indexOf(')', en)
                    let pm = line.substring(en+1, pe)
                    let pos = str.indexOf(mtg)+mtg.length
                    pos = str.indexOf('{', pos)
                    let blkend = str.indexOf('\n$', pos)
                    if (blkend === -1) blkend = str.indexOf('\n#', pos)
                    if (blkend === -1) blkend = str.indexOf('\nbeforeLayout', pos)
                    if (blkend === -1) blkend = str.indexOf('\nafterLayout', pos)
                    if (blkend === -1) blkend = str.indexOf('\n<', pos)
                    if (blkend === -1) blkend = str.length
                    blkend = str.lastIndexOf('}', blkend)+1
                    let code = str.substring(pos, blkend).trim()
                    let name = line.substring(0,12)
                    if(line.substring(0, 11) === 'afterLayout') name = 'afterLayout'
                    info.methods[name] = code
                    info.params[name] = pm
                    state = ParsedState.methods
                }
            }
            else {
                if(state === ParsedState.layout) {
                    layoutXml += line
                }
                else if(state === ParsedState.bind) {
                    bindDeclarations += line
                }
            }
        }
        let sn = str.indexOf('<style>')+7
        let sen = str.lastIndexOf('</style>')
        if(sen === -1) sen = str.length
        sn = str.indexOf('\n', sn)
        let style = str.substring(sn+1, sen).trim()
        // now parse the xml
        const xmlResult = convert.xml2js(layoutXml, {compact:true})
        info.layout = setupAction(xmlResult)
        for(let i=0; i<actionMethods.length; i++) {
            let am = actionMethods[i]
            info.methods[am.name] = am.method
            info.params[am.name] = 'ev'
        }
        info.bind = bindDeclarations
        info.scss = style

    } catch(e) {
        console.error("Error", e)
    }

    return info
}
let actionMethods:any[] = []
function setupAction(data) {
    Object.getOwnPropertyNames(data).forEach(p => {
        if(p === '_attributes') {
            data[p] = checkAction(data[p])
        }
        if(typeof data[p] === 'object') {
            setupAction(data[p])
        }
    })
    return data
}
function checkAction(obj) {
    let actions = obj.action
    if(actions) {
        const list = actions.split(',')
        for(let i=0; i< list.length; i++) {
            let act = list[i]
            let actC = act.charAt(0).toUpperCase()+act.substring(1).toLowerCase()
            let actor = "handle"+actC
            obj[act] = '!'+actor
            let actMethod = {
                name: actor,
                method: `{try{this.com.getApp().callPageAction(this.props.action, ev)}catch(e) {console.error("Error in ${act} handler '"+this.props.action+"':",e)}}`
            }
            actionMethods.push(actMethod)
        }
        delete obj.action
    }
    return obj
}

class PropDef {
    name:string
    value:string
}
class ElementDefinition {
    tag: string
    props:PropDef[]
    children: ElementDefinition[]
}

/**
 * Enumerate all the component files and read them into info blocks
 * then export them as the desired type
 * @param dirpath
 * @param outType
 */
export function enumerateAndConvert(dirpath:string, outType:string, outDir:string) {
    const files = fs.readdirSync(dirpath)
    files.forEach(file => {
        if(file.match(/.tbcm?$/)) {
            const info = readComponent(path.join(dirpath, file))
            const fileOut = path.join(outDir, file.substring(0, file.lastIndexOf('.')) + outType === 'riot'? '.riot' : '.js')

            if(outType === 'riot') {
                writeRiotFile(info,fileOut)
            } else {
                writeNativeScriptFile(info,fileOut)
            }
        } else {
            let subdir = path.join(dirpath, file)
            let stat = fs.lstatSync(subdir)
            if(stat.isDirectory()) {
                enumerateAndConvert(subdir, outType, path.join(outDir, file))
            }
        }
    })
}
