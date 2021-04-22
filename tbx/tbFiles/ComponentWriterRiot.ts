
import {ComponentInfo} from "./ComponentInfo";
import * as convert from 'xml-js'
import * as fs from 'fs'

let actMethods = {}

export function writeRiotFile(info:ComponentInfo, pathname:string) {

    const layin = Object.assign({}, info.layout)
    const xml = convert.js2xml(layin, {
        compact:true,
        spaces: 4,
        attributeValueFn:riotProp,
        textFn:riotProp
    })
    Object.getOwnPropertyNames(actMethods).forEach(p => {
        info.methods[p] = actMethods[p]
        info.params[p] = 'ev'
    })

    let page = `<${info.id} bind="${info.bind}">\n`
    page += xml
    page += '\n<style>\n'
    page += info.scss
    page += '\n</style>\n'
    page += `<script>`
    page += scriptInnards(info.methods, info.params)
    page += `</script>`
    page += `\n</${info.id}>\n`
    fs.writeFileSync(pathname, page)
}

function scriptInnards(methods:any, params: any) {
    let tagCode = ''
    Object.getOwnPropertyNames(methods).forEach(key => {
        let prm = params[key]
        let code = methods[key]
        let lines = code.split('\n')
        code = lines.join('\n            ').trim()
        let value = ''
        if(key === 'handleAction') {
            value = '{\n        ' +lines.join('\n      ').trim()
        } else {
            value = '{\n        try ' + code + ' catch(e) {\n                console.error("error executing \'' + key + '\':",e)\n          }\n    }'
        }
        tagCode += `${key}(${prm}) ${value},\n    `
    })
    let script =
`    
import {newCommon} from 'Framework/app-core/ComCommon'
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

function riotProp(val, key) {
    if(val.charAt(0) === val.charAt(val.length-1) && val.charAt(0) === '"' || val.charAt(0) === "'") {
        val = val.substring(1, val.length-1)
    }
    if(val.charAt(0) === '$') {
        if(val.charAt(1) === '$') {
            let name = val.substring(2)
            val = `{b('data.${name}')}`
        } else {
            let name = val.substring(1)
            val = `{b('${name}')}`
        }
    }
    return val
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

