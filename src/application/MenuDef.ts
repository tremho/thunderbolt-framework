
// now to parse the madness

// we need to use the file functions common to the API
// (these come from Electron back end for desktop, and directly implemented in {N}, accessible from App-Core Wrapper)
import {AppCore} from '../app-core/AppCore'
import {IndicatorItem, MenuItem, ToolItem} from "./MenuApi";
import {environment, check} from '../app-core/EnvCheck'

let appmenu:MenuItem[] = []
let appTools:ToolItem[] = []
let appIndicators: IndicatorItem[] = []

let curMenu
let smstack:any[] = []

// async
function readMenuDef(app:AppCore, menuPath?:string) {
    const menuDef = menuPath || 'src/application/menudef.txt'
    return app.MainApi.fileExists(menuDef).then(exists => {
        if(exists) {
            return app.MainApi.readFileText(menuDef).then(defText => {
                return processMenuDef(app, defText)
            })
        }
    })

}

let processing = ''
let resourcePath = ''
let menuName = ''
let toolbarName = ''
let indicatorName = ''

function processMenuDef(app, defText) {
    const lines = defText.split('\n')
    lines.forEach(ln =>  {
        processDefinition(app, ln)
        if(menuName) {
            processMenuLine(ln)
        }
        else if(toolbarName) {
            processToolLine(ln)
        }
        else if(indicatorName) {
            processIndicatorLine(ln)
        }
    })
    commuteToModel(app) // pick up last one
}

function processDefinition(app, line) {
    const tag = "DEFINE"
    const rptag = "RESOURCE PATH"
    const mntag = "MENU"
    const tbtag = "TOOLBAR"
    const intag = "INDICATORS"
    if(line.indexOf(tag) === 0) {
        // at this point we have parsed into a computable set of object maps we can translate into our model
        commuteToModel(app)
        menuName = toolbarName = indicatorName = resourcePath = ''
        let proc = line.substring(tag.length+1)
        if(proc.indexOf(rptag) !== -1) {
            let qi = proc.indexOf('"')+1
            if(qi) {
                let qe = proc.indexOf('"', qi)
                resourcePath = proc.substring(qi, qe)
            }
        } else if(proc.indexOf(mntag) !== -1) {
            let qi = proc.indexOf('"')+1
            if(qi) {
                let qe = proc.indexOf('"', qi)
                menuName = proc.substring(qi, qe)
            }
        } else if(proc.indexOf(tbtag) !== -1) {
            let qi = proc.indexOf('"')+1
            if(qi) {
                let qe = proc.indexOf('"', qi)
                toolbarName = proc.substring(qi, qe)
            }
        } else if(proc.indexOf(intag) !== -1) {
            let qi = proc.indexOf('"')+1
            if(qi) {
                let qe = proc.indexOf('"', qi)
                indicatorName = proc.substring(qi, qe)
            }
        }

    }
}

function processMenuLine(line) {
    line = line.trim()
    let target = ''
    let id = ''
    let label = ''
    let role = ''
    // check for comment
    let mi = line.indexOf('//')
    if(mi !== -1) {
        line = line.substring(0, mi).trim()
    }
    // check for @
    let ti = line.indexOf('@')
    // check for #
    let hi = line.indexOf('#')
    // check for >>
    let sm = line.indexOf('>>')
    let es = line.indexOf('<<')
    // check for :
    let ci = line.indexOf(':')
    // check for ,
    let li = line.indexOf(',')
    // check for !
    let bi = line.indexOf('!')
    let di = line.indexOf('<')
    let ai = line.indexOf('[')

    if(ti !== -1) {
        let ni
        if(!ni && hi !== -1) ni = hi
        if(!ni && ci !== -1) ni = ci
        if(!ni && li !== -1) ni = li
        if(!ni && bi !== -1) ni = bi
        target = line.substring(ti+1,ni)
    }
    if(hi !== -1) {
        let xi = ci
        if(xi == -1) xi = li
        if(xi == -1) xi = bi
        if(xi === -1) xi = line.length;
        id = line.substring(hi+1,xi)
    }
    if(sm !== -1) {
        let xi = bi
        if(xi === -1) xi = line.length;
        id = line.substring(sm+2,xi)
    }

    if( li === -1) li = bi
    if( li === -1) li = line.length;
    if(ci !==-1) role = line.substring(ci+1,li)
    let le = 0
    if(di !== -1) le = di
    if(!le && ai !== -1) le = ai
    if(!le) le = line.length
    label = line.substring(li+1, le).trim()

    let mods = []
    if(di !== -1) {
        let edi = line.indexOf('>', di)
        if(edi !== -1)  {
            mods = line.substring(di+1, edi).split(',')
        }
    }
    let accs = []
    if(ai !== -1) {
        let eai = line.indexOf(']', ai)
        if(eai !== -1)  {
            accs = line.substring(ai+1, eai).split(',')
        }
    }


    if(bi !== -1 && sm === -1) {
        // this is a menubar label definition
        let mi = new MenuItem()
        mi.label = label
        mi.id = id
        mi.role = role
        mi.accelerator = accs[0]
        mi.targetCode = target
        applyMods(mi, mods)
        curMenu = mi.children = [] // start a new menu
        appmenu.push(mi)
        return;  // we're done for now
    }

    // id, target, label, role


    if(id || es !== -1) {
        if(id == '--') {
            // separator
            // (unique key and type identifier in either key or value)
            // label = id; // --
            // id = '$SEP-'+nextSMID++ // shared with submenu id counts
            role = 'separator'
        }
        // process normal line
        let mi = new MenuItem()
        mi.label = label;
        mi.role = role;
        mi.accelerator = accs[0]
        mi.id = id;
        mi.targetCode = target
        applyMods(mi, mods)

        if (es !== -1) {
            // pop to previous submenu level
            curMenu = smstack.pop()
        } else {
            curMenu.push(mi)
        }
        if (sm !== -1) {
            //create a new submenu
            smstack.push(curMenu)
            curMenu = mi.children = []
        }
    }

}
function applyMods(item:MenuItem, mods:string[]) {
    mods.forEach(m => {
        m = m.toLowerCase()
        if(m === 'disabled') {
            item.disabled = true
        }
        if(m === 'checked') {
            item.type = 'checkbox'
            item.checked = true
        }
        if(m === 'enabled') {
            item.disabled = false
        }
        if(m === 'unchecked') {
            item.type = 'checkbox'
            item.checked = false
        }
        if(m.indexOf('icon') === 0) {
            let e = m.indexOf('=')
            item.icon = m.substring(e+1).trim()
        }

        // sublabel has no effect on mac
        if(m.indexOf('sublabel') === 0) {
            let e = m.indexOf('=')
            item.sublabel = m.substring(e+1).trim()
        }
        if(m.indexOf('tooltip') === 0) {
            let e = m.indexOf('=')
            item.tooltip = m.substring(e+1).trim()
        }
    })
}


/* Take the parsed intermediate objects and translate them into our model format

We could make the entire menu (for a page) a single object (i.e. take deskmenu/appmenu as they are)
But I like the idea of having each menu list a section.
This means submenus need to get assigned an id (parent id+[label, ordinal]?) and given their own sections.
each menu list then needs an array plus a section id, or otherwise be enumerable in proper order.
binding is then done to these section values.

we also need a menu api so we can programmatically make the menu models.
- addMenu       // to page; add means append or insert
- addSubmenu    // to menu by id, returns submenu id
- removeMenu    // by id
- removeSubmenu // by id
- addMenuItem  // add means append or insert
- deleteMenuItem // by id
- clearMenu
- changeMenuItem // by id


All of this pertains to the model.

menu-pageId-list [APP, FILE, EDIT]
menu-pageId-APP
menu-pageId-FILE
menu-pageId-EDIT
menu-pageId-submenu-1
menu-pageId-submenu-2

 */

function commuteToModel(app:AppCore) {

    const model = app.model;
    if(menuName) {
        for (let i = 0; i < appmenu.length; i++) {
            app.MenuApi.addMenuItem(menuName, appmenu[i])
        }
    }
    if(toolbarName) {
        app.MenuApi.addToolbarItems(toolbarName, appTools)
    }
    if(indicatorName) {
        app.MenuApi.addIndicatorItems(indicatorName, appIndicators)
    }
}

function processToolLine(line) {
    line = line.trim()
    console.log('tool line', line)
    let target = ''
    let id = ''
    let label = ''
    // check for comment
    let mi = line.indexOf('//')
    if(mi !== -1) {
        line = line.substring(0, mi).trim()
    }
    // check for @
    let ti = line.indexOf('@')
    // check for #
    let hi = line.indexOf('#')
    // check for ,
    let li = line.indexOf(',')
    // check for !
    let bi = line.indexOf('!')
    // check for mods
    let di = line.indexOf('<')
    // check for accelerators
    let ai = line.indexOf('[')

    if(ti !== -1) {
        let ni
        if(!ni && hi !== -1) ni = hi
        if(!ni && li !== -1) ni = li
        if(!ni && bi !== -1) ni = bi
        target = line.substring(ti+1,ni)
    }
    if(hi !== -1) {
        let xi = li
        if(xi == -1) xi = bi
        if(xi === -1) xi = line.length;
        id = line.substring(hi+1,xi)
    }

    if( li === -1) li = bi
    if( li === -1) li = line.length;
    let le = 0
    if(di !== -1) le = di
    if(!le && ai !== -1) le = ai
    if(!le) le = line.length
    label = line.substring(li+1, le).trim()

    let mods = []
    if(di !== -1) {
        let edi = line.indexOf('>', di)
        if(edi !== -1)  {
            mods = line.substring(di+1, edi).split(',')
        } else {
            console.error('Missing closing > in tool declaration '+ id)
        }
    }
    let accs = []
    if(ai !== -1) {
        let eai = line.indexOf(']', ai)
        if(eai !== -1)  {
            accs = line.substring(ai+1, eai).split(',')
        }
    }

    // target filter
    if( id ) {
        let item = new ToolItem()
        item.label = label;
        item.id = id;
        mods.forEach(m => {
            m = m.trim()
            if (m === 'disabled') {
                item.state = 'disabled'
            }
            if (m === 'enabled') {
                item.state = ''
            }
            if (m.indexOf('state') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.state = m.substring(b + 1).trim()
                }
            }
            if (m.indexOf('icon') === 0) {
                let c = m.indexOf(':')
                let e = m.indexOf('=')
                if (e === -1) e = m.length
                let state = 'default'
                if (c !== -1) {
                    state = m.substring(c + 1, e)
                }
                if (!item.icons) item.icons = {}
                item.icons[state] = m.substring(e + 1).trim()
            }
            if (m.indexOf('tooltip') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.tooltip = m.substring(b + 1).trim()
                }
            }
            if (m.indexOf('class') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.className = m.substring(b + 1).trim()
                }
            }
            if (m.indexOf('type') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.type = m.substring(b + 1).trim()
                }
            }
        })
        item.accelerator = accs[0]
        appTools.push(item)
    }
}

function processIndicatorLine(line) {
    console.log('indicator line', line)
    line = line.trim()
    console.log('tool line', line)
    let target = ''
    let id = ''
    let label = ''
    // check for comment
    let mi = line.indexOf('//')
    if(mi !== -1) {
        line = line.substring(0, mi).trim()
    }
    // check for @
    let ti = line.indexOf('@')
    // check for #
    let hi = line.indexOf('#')
    // check for ,
    let li = line.indexOf(',')
    // check for !
    let bi = line.indexOf('!')
    // check for mods
    let di = line.indexOf('<')

    if(ti !== -1) {
        let ni
        if(!ni && hi !== -1) ni = hi
        if(!ni && li !== -1) ni = li
        if(!ni && bi !== -1) ni = bi
        target = line.substring(ti+1,ni)
    }
    if(hi !== -1) {
        let xi = li
        if(xi == -1) xi = bi
        if(xi === -1) xi = line.length;
        id = line.substring(hi+1,xi)
    }

    if( li === -1) li = bi
    if( li === -1) li = line.length;
    let le = 0
    if(di !== -1) le = di
    if(!le) le = line.length
    label = line.substring(li+1, le).trim()

    let mods = []
    if(di !== -1) {
        let edi = line.indexOf('>', di)
        if(edi !== -1)  {
            mods = line.substring(di+1, edi).split(',')
        } else {
            console.error('missing closing > in indicator declaration' +id)
        }
    }

    // target filter
    if( id ) {
        let item = new IndicatorItem()
        item.label = label;
        item.id = id;
        mods.forEach(m => {
            m = m.trim()
            if (m === 'disabled') {
                item.state = 'disabled'
            }
            if (m === 'enabled') {
                item.state = ''
            }
            if (m.indexOf('state') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.state = m.substring(b + 1).trim()
                }
            }
            if (m.indexOf('icon') === 0) {
                let c = m.indexOf(':')
                let e = m.indexOf('=')
                if (e === -1) e = m.length
                let state = 'default'
                if (c !== -1) {
                    state = m.substring(c + 1, e)
                }
                if(!item.icons) item.icons = {}
                item.icons[state] = m.substring(e + 1).trim()
            }
            if (m.indexOf('tooltip') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.tooltip = m.substring(b + 1).trim()
                }
            }
            if (m.indexOf('class') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.className = m.substring(b + 1).trim()
                }
            }
            if (m.indexOf('type') === 0) {
                let b = m.indexOf('=')
                if (b !== -1) {
                    item.type = m.substring(b + 1).trim()
                }
            }
        })
        appIndicators.push(item)
    }
}


// Entry point called from AppCore::setupUIElements
export function setupMenu(app:AppCore, menuData?:string) {
    appmenu = []
    appTools = []
    appIndicators = []
    smstack = []
    if(app.MainApi && app.MainApi.resetMenu) {
        // a check to see if we are on desktop
        app.MainApi.resetMenu()
        return readMenuDef(app, menuData)
    } else {
        // mobile
        return Promise.resolve(processMenuDef(app, menuData))
        // return Promise.resolve()
    }
}