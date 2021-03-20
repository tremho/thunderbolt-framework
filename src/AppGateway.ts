
import {readFileText, fileExists} from "./FileAPI"
import {addMenuItem, enableMenuItem, deleteMenuItem, changeMenuItem, clearMenu, resetMenu, setToMenuBar} from "./DesktopMenu";
//
// function addMenuItem(a, item, target) {
//     console.log('addMenuItem ', item, target)
// }


const exportedFunctions = {
    messageInit: () => { /*console.log('message init stub hit')*/ },

    addMenuItem,
    enableMenuItem,
    deleteMenuItem,
    changeMenuItem,
    clearMenu,
    setToMenuBar,
    resetMenu,

    readFileText,
    fileExists
}

/**
 * Inter-Process Communication support for Electron
 * Supports Remote Procedure calls and messaging
 */
export class AppGateway {

    private ipcMain:any;
    private static ipcMessageSender = null;

    constructor(ipcMainIn:any) {
        this.ipcMain = ipcMainIn;
        this.attach();
    }

    public static getFunctionNames() {
        return Object.getOwnPropertyNames(exportedFunctions);
    }

    private attach() {
        Object.getOwnPropertyNames(exportedFunctions).forEach(fname => {
            const fn = exportedFunctions[fname]
            this.ipcMain.on(fname, (event, ...args) => {
                const data = args[0]
                const id = data.id
                const callArgs = data.args || []

                let response, error;
                try {
                    response = fn(...callArgs)
                } catch (e) {
                    error = e;
                }
                if(fname === 'messageInit') {
                    AppGateway.ipcMessageSender = event.sender;
                    // console.log('set ipcMessageSender to ', AppGateway.ipcMessageSender)
                    // console.log(fname, id)
                }
                event.sender.send(fname, {id, response, error})
            })
        })
    }
    public static sendMessage(name:string, data:any) {
        // console.log('sending ipc message', name, data)
        if(AppGateway.ipcMessageSender) {
            AppGateway.ipcMessageSender.send('message', {name, data})
        } else {
            // console.error('no ipcMessageSender')
            setTimeout(() => {
                AppGateway.sendMessage(name, data)
            }, 1000)
        }
    }
}