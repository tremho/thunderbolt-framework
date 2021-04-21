import {ComponentInfo} from "./ComponentInfo";
// import * as convert from 'xml-js'
import * as fs from 'fs'


export function writeNativeScriptFile(info:ComponentInfo, pathname:string) {

    // console.log('write NS component '+info.id)
    // console.log(info)

    let parts = info.id.split('-')
    let name = ''
    let i = 0
    while(parts[i++]) {
        name += parts[0].charAt(0).toUpperCase() + parts[0].substring(1).toLowerCase()
    }
    let out = `module.exports.${name} = class extends CompnentBase {`
    out += '\n    createControl() {\n        '

    out += processContainer(info.layout)

    out = out.trim()
    out += '\n    }\n    '
    out += addMethods(info.methods, info.params)
    out += '\n}\n'
    console.log(out)
}

function mappedComponent(tag) {
    let type
    if(tag === 'div') type = 'Div'
    else if(tag === 'span') type = 'Span'
    else type = tag

    return type
}

// find attributes and text
// find child (make and add)
// loop with child

// container: fat=none, child = div
// div: fat=action, child = span
// span: fat=none, text="$Text", child= none

class Attribute {
    key:string
    value:string
}
function findAttributesAndText(obj) {
    const atts:Attribute[] = []
    let text = obj._text

    const atObj = obj._attributes
    if(atObj) {
        Object.getOwnPropertyNames(atObj).forEach(k => {
            let ar = new Attribute()
            ar.key = k
            ar.value = atObj[k]
            atts.push(ar)
        })
    }
    return {atts, text}
}
function findChildren(obj) {
    const children:any[] = []
    Object.getOwnPropertyNames(obj).forEach(p => {
        let c = obj[p]
        if(c.hasOwnProperty('_attributes') || c.hasOwnProperty('_text')) {
            children.push({name:p, data:c})
        }
    })
    return children
}

function processContainer(container, name='container', level=0) {
    let out = ''
    let cname = level ? 'this.'+name : 'this.container'
    if(name && level) {
        let tag = name
        while(tag.charAt(tag.length-1).match(/[0-9]/)) {
            tag = tag.substring(0, tag.length-1)
        }
        out += `${cname} = new ${mappedComponent(tag)}()\n`
        out += ' '.repeat(4+level*4)
    }
    let {atts, text} = findAttributesAndText(container)
    for(let i=0; i<atts.length; i++) {
        let ak = atts[i].key
        let av = atts[i].value
        // todo: translate the value from $ to a getter
        // otherwise (pass through general props) ?
        out += `${cname}.set('${ak}','${av}')\n`
        out += ' '.repeat(4+level*4)
    }
    if(text) {
        let tname = `${cname}_text`
        out += `${tname} = new Label()\n`
        out += ' '.repeat(4+level*4)
        out += `${cname}.addChild(${tname})\n`
        out += ' '.repeat(4+level*4)
    }
    let children = findChildren(container)
    for(let i=0; i<children.length; i++) {
        let {name, data} = children[i]
        name = uniqueName(name)
        out += processContainer(data, name, level+1)
        out += `${cname}.addChild(this.${name})\n`
        out += ' '.repeat(4+level*4)
    }

    return out
}

const unamecounts = {}
function uniqueName(name) {
    unamecounts[name] = (unamecounts[name] || 0) + 1
    return name + unamecounts[name]
}

function addMethods(methods, params) {
    let out = ''
    Object.getOwnPropertyNames(methods).forEach(name => {
        let param = params[name] || ''
        let code = methods[name] || '{}'
        // pretty up the code a little
        code = code.split('\n').join('\n    ')

        out += `${name}(${param}) ${code}\n    `
    })
    return out
}