
import {MenuItem} from './application/MenuApi'
// import {Menu} from "electron";
import * as electron from 'electron'
const Menu = electron.Menu;
const EMenuItem = electron.MenuItem
import {AppGateway} from "./AppGateway";

let menus = {}

export function resetMenu() {
    menus = {}
}

export function addMenuItem(menuId:string, item:MenuItem, position?:number) {

    let n = menuId.indexOf('-')
    if(n === -1) n=menuId.length;
    const menuName = menuId.substring(0, n)
    if(!menus[menuName]) {
        menus[menuName] = Menu.buildFromTemplate([]) // create a new menu of this name
    }
    const parentItem = getSubmenuFromId(menuId)
    const curMenu = parentItem.submenu || parentItem
    if(curMenu) {
        const emi = convertMenuItem(item)

        if(position === undefined) {
            curMenu.append(emi)
        } else {
            curMenu.insert(position, emi)
        }
    }

    setToMenuBar(menuName)

}
function convertMenuItem(item) {
    const dmi:any =  {
        label: item.label,
        role: item.role,
        id: item.id,
        type: item.type,
        sublabel: item.sublabel,
        tooltip: item.tooltip, // only for mac, but I'm not seeing evidence of it working!
        enabled: !item.disabled,
        checked: item.checked,
        accelerator: item.accelerator,
        click: onMenuItem
    }
    dmi.tooltip = 'this is a tooltip' // todo: is my Electron current?
    if(item.icon) {
        console.log('setting icon to '+item.icon)
        dmi.icon = item.icon
    }
    if(item.label === '--') {
        dmi.type = 'separator'
        delete dmi.label
    }
    if(item.children) {
        dmi.type = 'submenu'
        let smpath = item.path;
        const submenu:any = []
        item.children.forEach(smi => {
            submenu.push(convertMenuItem(smi))
        })
        dmi.submenu = submenu
    }
    return new EMenuItem(dmi)
}
function getSubmenuFromId(menuId:string) {
    let n = menuId.indexOf('-')
    if(n === -1) n = menuId.length
    let menuName = menuId.substring(0, n)
    let topItem = menus[menuName]
    if(!topItem) {
        console.error('menuId may not be complete ', menuId)
        throw Error('MENU NOT FOUND: '+menuName)
    }
    const parts = menuId.split('-');
    if(!topItem.items) topItem.items = []
    let curMenu = topItem.items
    let parentItem = topItem;
    let pid = menuName
    for(let i=1; i<parts.length; i++) {
        pid = parts[i]
        for (let c = 0; c < curMenu.length; c++) {
            let cmitem = curMenu[c]
            if (cmitem.id === pid) {
                parentItem = cmitem;
                curMenu = (cmitem.submenu && cmitem.submenu.items) || cmitem.items
                break;
            }
        }
    }
    return parentItem
}

export function enableMenuItem(menuId:string, itemId:string, enabled: boolean) {
    const parentItem = getSubmenuFromId(menuId)
    const children = (parentItem.submenu && parentItem.submenu.items) || parentItem.items || []
    for(let i=0; i< children.length; i++) {
        let item = children[i]
        if(item.id === itemId) {
            item.enabled = enabled
            break;
        }
    }
}

export function deleteMenuItem(menuId:string, itemId:string) {
    const parentItem = getSubmenuFromId(menuId)
    const children = (parentItem.submenu && parentItem.submenu.items) || parentItem.items
    for(let i=0; i< children.length; i++) {
        let item = children[i]
        if(item.id === itemId) {
            item.id = '' // can't actually remove, just hide and take away it's identifier
            item.visible = false
            break;
        }
    }
}

export function changeMenuItem(menuId:string, itemId:string, updatedItem:MenuItem) {
    const parentItem = getSubmenuFromId(menuId)
    const children = (parentItem.submenu && parentItem.submenu.items) || parentItem.items || []
    for(let i=0; i< children.length; i++) {
        let item = children[i]
        if(item.id === itemId) {
            item.label = updatedItem.label
            item.id = updatedItem.id
            item.visible = true
            break;
        }
    }
}

export function clearMenu(menuId:string) {
    const parentItem = getSubmenuFromId(menuId)
    const children = (parentItem.submenu && parentItem.submenu.items) || parentItem.items
    for(let i=0; i< children.length; i++) {
        let item = children[i]
        item.id = '' // can't actually remove, just hide and take away it's identifier
        item.visible = false
    }
}

function onMenuItem(item, browserWindow, event) {
    let id = item.id
    console.log('Clicked on Desktop menu item '+id)
    AppGateway.sendMessage('EV', {subject: 'menuAction', data: id})
}

/**
 * When all items have been added to menu template, this
 * realizes it into the menu bar
 */
export function setToMenuBar(menuName) {
    const menu = menus[menuName]
    Menu.setApplicationMenu(menu)
}
