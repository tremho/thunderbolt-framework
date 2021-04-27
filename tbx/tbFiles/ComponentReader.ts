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
            } else if(line.substring(0,12) === 'beforeLayout' ||
                      line.substring(0,11) === 'afterLayout'  ||
                      line.substring(0,8) === 'onAction') {
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
                    if (blkend === -1) blkend = str.indexOf('\nonAction', pos)
                    if (blkend === -1) blkend = str.indexOf('\n<', pos)
                    if (blkend === -1) blkend = str.length
                    blkend = str.lastIndexOf('}', blkend)+1
                    let code = str.substring(pos, blkend).trim()
                    let name = ''
                    if(line.substring(0, 12) === 'beforeLayout') name = 'beforeLayout'
                    if(line.substring(0, 11) === 'afterLayout') name = 'afterLayout'
                    if(line.substring(0, 8) === 'onAction') name = 'onAction'
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
        if(p.charAt(0) === '_') {
            if (p === '_attributes') {
                let atts = checkAction(data[p])
                Object.getOwnPropertyNames(atts).forEach(ak => {
                    if(ak === 'action') {
                        atts[ak] = '{ this.handleAction }'
                    }
                })
            }
        } else {
            setupAction(data[p])
        }
    })
    return data
}
function checkAction(obj) {
    if(obj.action) {
        let actMethod = {
            name: 'handleAction',
            method:
`
try {
      if(typeof this.onAction === 'function') {
          if(this.onAction(ev)) {
              return
          }
      }
      this.com.getApp().callPageAction(this.props.action, ev)
    } catch(e) {
      console.error("Error in action handler '"+this.props.action+"':", e)
    }
}                
`
        }
        actionMethods.push(actMethod)
        let mapped = mapAction(obj.action)
        obj[mapped] = '{handleAction}'
        delete obj.action
    }
    return obj
}

function mapAction(tag) {
    switch(tag.trim().toLowerCase()) {
        case 'onclick':
        case 'click':
        case 'tap':
        case 'press':
            return 'onclick'

        default:
            return tag
    }
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
    const locals:string[] = []
    const files = fs.readdirSync(dirpath)
    files.forEach(file => {
        if(file.match(/.tbcm?$/)) {
            const info = readComponent(path.join(dirpath, file))
            let fileout = path.join(outDir, file.substring(0, file.lastIndexOf('.')))

            if(outType === 'riot') {
                fileout += '.riot'
                writeRiotFile(info, fileout)
            } else {
                fileout += '-tb.js'
                locals.push(fileout)
                writeNativeScriptFile(info, fileout)
            }
        } else {
            let subdir = path.join(dirpath, file)
            let stat = fs.lstatSync(subdir)
            if(stat.isDirectory()) {
                enumerateAndConvert(subdir, outType, path.join(outDir, file))
            }
        }
    })
    if(outType === 'nativescript') {
        let n = outDir.lastIndexOf('components')
        if(n === -1) throw(Error('Unexpected path passed for making tb-components: '+outDir))
        let dest = outDir.substring(0, n-1)
        dest = path.join(dest, 'components')
        const tbcFile = path.join(dest, 'tb-components.js')
        let tbc = 'const {componentsExport} = require(\'thunderbolt-framework/mobile\')\n'
        tbc += 'module.exports = componentsExport\n'
        for(let i=0; i<locals.length; i++) {
            let f = locals[i]
            let nm = f.substring(f.lastIndexOf('/')+1, f.lastIndexOf('-tb.js'))
            nm = pascalCase(nm)
            tbc += 'module.exports.'+nm+' = require(\''+f+'\')\n'
        }
        if(!fs.existsSync(dest)) {
            fs.mkdirSync(dest)
        }
        fs.writeFileSync(tbcFile, tbc)
    }
}
function pascalCase(name) {
    let out = ''
    name.split('-').forEach(p => {
        out += p.charAt(0).toUpperCase()+p.substring(1).toLowerCase()
    })
    return out
}

