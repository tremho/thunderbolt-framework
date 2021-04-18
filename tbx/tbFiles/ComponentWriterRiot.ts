
import {ComponentInfo} from "./ComponentInfo";
import * as convert from 'xml-js'
import * as fs from 'fs'


export function writeRiotFile(info:ComponentInfo, pathname:string) {

    let srcComp = '/src/components'
    let cdn = pathname.indexOf(srcComp)+srcComp.length
    let lsn = pathname.lastIndexOf('/')
    let btwn = pathname.substring(cdn, lsn)
    let level = btwn.split('/').length
    let pfx = '../'.repeat(level+1)


    const layin = Object.assign({}, info.layout)
    const xml = convert.js2xml(layin, {
        compact:true,
        spaces: 4,
        attributeValueFn:riotProp,
        textFn:riotProp
    })
    let page = `<${info.id} bind="${info.bind}">\n`
    page += xml
    page += '\n<style>\n'
    page += info.scss
    page += '\n</style>\n'
    page += `<script>`
    page += scriptInnards(info.methods, info.params, pfx)
    page += `</script>`
    page += `\n</${info.id}>\n`
    fs.writeFileSync(pathname, page)
}

function scriptInnards(methods:any, params: any, pfx:string) {
    let tagCode = ''
    Object.getOwnPropertyNames(methods).forEach(key => {
        let prm = params[key]
        let value = '{ try { ' +methods[key] + ' } catch(e) { console.error("error executing $'+key+':",e) } }'
        tagCode += `${key}(${prm}) ${value},\n    `
    })
    let script =
`    
import {newCommon} from "${pfx}node_modules/thunderbolt-framework/component"
export default {
    onBeforeMount(props, state) {
        try {
            this.bound = new Object()
            this.com = newCommon(this)
        } catch(e) {
            console.error('Unexpected error in "'+this.root.tagName+' onBeforeMount"', e)
        } 
        try {
            this.beforeLayout && this.beforeLayout()
        } catch(e) {
            console.error('Error in  "'+this.root.tagName+' beforeLayout"', e)
        }    
    },
    onMounted(props, state) {
        try {
            this.com.bindComponent()
        } catch(e) {
            console.error('Unexpected error in "'+this.root.tagName+' while binding"', e)
        }
        try {    
            this.afterLayout && this.afterLayout()
        } catch(e) {
            console.error('Error in  "'+this.root.tagName+' afterLayout"', e)
        }    
    },
    ${tagCode}
}
`
    return script
}

function riotProp(val) {
    if(val.charAt(0) === '$') {
        let name = val.substring(1)
        val = `{${name}()}`
    } else if(val.charAt(0) === '!') {
        let name = val.substring(1)
        val = `{${name}}`
    }
    return val
}