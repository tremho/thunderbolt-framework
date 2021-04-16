/*
enumerate and read tbc/ tbcm files from 'components' directory into data ready for export
 */

import * as fs from "fs"
import * as path from 'path'
import * as convert from 'xml-js'

class ComponentInfo {
    id:string
    bind:string
    layout:any
    scss:string
    methods:Map<string, string> = new Map<string, string>()
}

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
                            info.bind = value
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
                let en = line.indexOf(':', 1)
                if (en !== -1) {
                    let mtg = line.substring(0, en + 1)
                    let pos = str.indexOf(mtg)+mtg.length
                    let blkend = str.indexOf('\n$', pos)
                    if (blkend === -1) blkend = str.indexOf('\n#', pos)
                    if (blkend === -1) blkend = str.indexOf('\nbeforeLayout', pos)
                    if (blkend === -1) blkend = str.indexOf('\nafterLayout', pos)
                    if (blkend === -1) blkend = str.indexOf('\n<', pos)
                    if (blkend === -1) blkend = str.length
                    blkend = str.lastIndexOf('}', blkend)+1
                    let code = str.substring(pos, blkend).trim()
                    let name = mtg.substring(1, mtg.length - 1)
                    info.methods[name] = code
                    state = ParsedState.methods
                }
            } else if(line.substring(0,12) === 'beforeLayout' || line.substring(0,11) === 'afterLayout') {
                let en = line.indexOf(':', 1)
                if (en !== -1) {
                    let mtg = line.substring(0, en + 1)
                    let pos = str.indexOf(mtg)+mtg.length
                    let blkend = str.indexOf('\n$', pos)
                    if (blkend === -1) blkend = str.indexOf('\n#', pos)
                    if (blkend === -1) blkend = str.indexOf('\nbeforeLayout', pos)
                    if (blkend === -1) blkend = str.indexOf('\nafterLayout', pos)
                    if (blkend === -1) blkend = str.indexOf('\n<', pos)
                    if (blkend === -1) blkend = str.length
                    blkend = str.lastIndexOf('}', blkend)+1
                    let code = str.substring(pos, blkend).trim()
                    let name = line.substring(0,12)
                    if(name === 'afterLayout:') name = 'afterLayout' // lame, but effective
                    info.methods[name] = code
                    state = ParsedState.methods
                }
            }
            else {
                if(state === ParsedState.layout) {
                    layoutXml += line
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
        info.layout = xmlResult
        info.scss = style

        console.log ('parsed info', info)
        // console.log('layout', layoutXml)
        // console.log('layout convert', JSON.stringify(xmlResult, null, 2))
        // console.log('scss', style)

    } catch(e) {
        console.error("Error", e)
    }

    return info
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

// Dead function.  Use xml-js module instead.
function parseElementDefinitions(line:string, currentDef:ElementDefinition): ElementDefinition[] {
    const defs = ([] as ElementDefinition[])
    let elDef = currentDef || new ElementDefinition()
    let pn = line.indexOf(' ')
    if(!elDef.tag) {
        let tn = line.indexOf('<')
        if (tn !== -1) {
            let en = line.indexOf(' ', tn)
            if (en === -1) en = line.indexOf('/', tn)
            if (en === -1) en = line.indexOf('>', tn)
            if (en == -1) en = line.length
            elDef.tag = line.substring(tn+1, en)
            pn = en
        }
    }
    while (line.charAt(pn) === ' ') {
        let en = line.indexOf('=', pn)
        if (en === -1) en = line.indexOf(' ', pn)
        if (en === -1) en = line.indexOf('/', pn)
        if (en === -1) en = line.indexOf('>', pn)
        if (en == -1) en = line.length
        let prop = line.substring(pn+1, en)
        if(line.charAt(en) === '=') {
            let vn = en+1
            en = line.indexOf(' ', vn)
            if (en === -1) en = line.indexOf('/', vn)
            if (en === -1) en = line.indexOf('>', vn)
            if (en === -1) en = line.indexOf('<', vn)
            if (en == -1) en = line.length
            elDef.props.push({name:prop, value:line.substring(vn, en)})
            pn = en
        }
    }


    return defs
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
        }
    })
}