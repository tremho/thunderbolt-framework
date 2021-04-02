import {ipcMain} from 'electron'

const registeredModules = {}


// back side listener to dispatch to functions registered
ipcMain.on('extApi', (event, msg) => {
    console.log('>>> See message for extApi call', msg)
    const {moduleName, functionName, id, args} = msg
    const module = registeredModules[moduleName]
    console.log('module for '+moduleName, module)
    const fn = module[functionName]
    console.log('function for '+functionName)
    let response, error;
    try {
        response = fn(...args)
    } catch (e) {
        error = e;
    }
    event.sender.send('extApi', {id, response, error})
})

export function registerExtensionModule(moduleName, module) {
    registeredModules[moduleName] = module
}