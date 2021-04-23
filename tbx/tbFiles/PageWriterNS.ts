
import {PageInfo} from "./PageInfo";
import * as convert from 'xml-js'
import * as fs from 'fs'
import * as path from 'path'

export function writeNativeScriptPage(info:PageInfo, srcpath:string, outDir:string) {
    /*
    export class PageInfo {
    id: string
    noTitle: boolean
    noBack: boolean
    title:string
    menuId:string
    toolbarId:string
    indicatorsId: string
    content:any
    methods: any = new Object()
    params: any = new Object()
}
     */

    let out = `<Page xmlns="http://schemas.nativescript.org/tns.xsd" loaded="onLoaded" navigatedTo="onNavigatedTo"`
    out += `      xmlns:tb="~/components/tb-components"`
    out += `      actionBarHidden="true"\n`
    out += '>\n'
    if(!info.noTitle) {
        out += `    <tb:TBPage title="${info.title}"`

        if(!info.noBack) out += ' noBack = "true"'
        if(info.menuId) out +=  ` menu-id="${info.menuId}"`
        if(info.toolbarId) out +=  ` toolbar-id="${info.toolbarId}"`
        if(info.indicatorsId) out +=  ` indicators-id="${info.indicatorsId}"`

        out += '>\n'
    }
    out += `        <tb:TBContent>\n`
    out += `        <!-- we'll be putting the converted content here -->`
    out += `        </tb:TBContent>\n`
    out += `    </tb:TBPage>\n`
    out += `</Page>\n`

    if(!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, {recursive: true})
    }

    const id = info.id

    let src = path.join(srcpath, `${id}-page.ts`)
    let dest = path.join(outDir, `${id}-logic.ts`)
    copyUpdate(src,dest)

    const stub = `
    import {getTheApp} from 'thunderbolt-framework/mobile'
    import * as activity from './${id}-logic'
    export function onNavigatedTo(arg) {
        const app = getTheApp()
        app.currentActivity = activity
        activity.pageStart(app)
    }
    `
    src = path.join(srcpath, `${id}-page.tbpg`)
    dest = path.join(outDir, `${id}-page.ts`)
    if(testForUpdate(src,dest)) {
        console.log(`exporting ${id}-page`)
        fs.writeFileSync(dest, stub)
        dest = path.join(outDir, `${id}-page.xml`)
        fs.writeFileSync(dest, out)
    }
}

// todo: import these

function testForUpdate(src, dest) {
    if(!fs.existsSync(src)) {
        return false; // source does not exist; no copy
    }
    if(!fs.existsSync(dest)) {
        return true; // destination does not exist; do copy
    }
    const sstat = fs.lstatSync(src)
    const dstat = fs.lstatSync(dest)

    // return trye if source is newer
    return (sstat.mtimeMs > dstat.mtimeMs)
}

function copyUpdate(src,dest) {
    if(testForUpdate(src,dest)) {
        console.log('copying ', src, dest)
        const destdir = dest.substring(0, dest.lastIndexOf(path.sep))
        if(!fs.existsSync(destdir)) {
            fs.mkdirSync(destdir, {recursive: true})
        }

        fs.copyFileSync(src,dest)
    } else {
        console.log('skipping ', src)
    }
}