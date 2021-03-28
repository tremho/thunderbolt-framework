
import {environment, check} from './EnvCheck'

import Log from './Log'

import {AppModel} from "./AppModel";

import {setupMenu} from "../application/MenuDef"
import {MenuApi} from "../application/MenuApi";
import * as Imr from './InfoMessageRecorder'

let StringParser, riot, ComBinder
let getInfoMessageRecorder, InfoMessageRecorder
let coreApp
if(!check.mobile) {
    try {
        getInfoMessageRecorder = Imr.getInfoMessageRecorder;
        InfoMessageRecorder = Imr.InfoMessageRecorder
        riot = require('riot')
        ComBinder = require('./ComBinder').ComBinder
        StringParser = require('../general/StringParser')
    } catch(e) {}

    try {
        coreApp = require('../core/app/main')
    }catch(e) {}
}

// TODO: dynamically build this mapping with a config or an enumerating tool.extension
import {ExampleIndicator} from "../extension/ExampleIndicator"
const extensionTypes = {
    Example: ExampleIndicator
}

let imrSingleton
if(getInfoMessageRecorder) {
    imrSingleton = getInfoMessageRecorder()
}

function writeMessage(subject:string, message:string) {
    imrSingleton.write(subject, message)
}
const mainApi = check.mobile ? null : (window as any).api;

export class EventData {
    public app:AppCore
    public sourceComponent:any
    public eventType:string
    public tag:string
    public platEvent:any
}

export class HistoryRecord {
    public pageId: string
    public context: object
}

// Singleton (used only by mobile side)
let theApp:any;
let theFrame:any;
export function setTheApp(app:any, frame:any) {
    theApp = app;
    theFrame = frame;
    // console.log('app and frame set', theApp, theFrame)
}
export function getTheApp() {
    return theApp
}

let componentGateCleared
let keyListenerBind;

/**
 *  Core object of the application.  Contains the app model and gateway functions for actions, which are
 *  mostly handled by action modules.
 */
export class AppCore {
    private appModel:AppModel = new AppModel()
    private rootPath:string;
    private menuApi:MenuApi;
    private activeMenu:any
    private currentActivity:any = null
    private history:HistoryRecord[] = []
    private menuHandlers:any = {}
    private pageMount:any // used only with riot
    // the gate items below are used only in the mobile version
    private componentGate:Promise<void>
    private modelGate:Promise<void>
    private componentGateResolver:any
    private modelGateResolver:any

    constructor() {
        this.menuApi = new MenuApi(this)
        this.modelGate = new Promise(resolve => {
            this.modelGateResolver = resolve
        })
        this.componentGate = new Promise(resolve => {
            this.componentGateResolver = resolve
        })

    }
    /**
     * get the model used for binding to the UI.
     */
    public get model() {
        return this.appModel
    }
    public get MenuApi() {
        return this.menuApi
    }
    public get MainApi() {
        return mainApi
    }

    public waitForModel() {
        return this.modelGate
    }
    public componentIsReady() {
        this.componentGateResolver()
        componentGateCleared = true
    }
    public waitReady() {
        // console.log('waiting for ready...')
        if(componentGateCleared) return this.modelGate
        return Promise.all([this.componentGate, this.modelGate])
    }

    public setupUIElements(appFront:any) {
        // console.log('>>> setupUIElements >>>')

        // set the infomessage log handling
        if(!check.mobile) {
            this.componentIsReady() // not used in riot, so clear the gate

            mainApi.messageInit().then(() => {
                // console.log('messages wired')
                this.model.addSection('infoMessage', {messages: []})
                mainApi.addMessageListener('IM', data => {
                    writeMessage(data.subject, data.message)
                })
                mainApi.addMessageListener('EV', data => {
                    // console.log('event info incoming:', data)
                    let evName = data.subject;
                    let evData = data.data;
                    if (evName === 'resize') {
                        const env = this.model.getAtPath('environment')
                        if (!env.screen) env.screen = {}
                        env.screen.width = evData[0]
                        env.screen.height = evData[1]
                        this.model.setAtPath('environment', env)
                    }
                    if(evName === 'menuAction') {
                        this.onMenuAction({id:evData})
                    }

                })
                imrSingleton.subscribe(msgArray => {
                    this.model.setAtPath('infoMessage.messages', msgArray)
                })
            })
        }
        this.model.addSection('navigation', {pageId: '', context:{}})


        // Set environment items
        // this will allow us to do platform branching and so on
        this.model.addSection('environment', environment)

        // Set up app models and menus
        this.model.addSection('menu', {})
        if(appFront) {
            Promise.resolve(appFront.appStart(this)).then(() => {
                this.modelGateResolver()
            })
        } else {
            // default app start
            setupMenu(this).then(()=> {
                this.modelGateResolver()
            })
        }

        // if(coreApp) coreApp.setupModel(this.model)
        // Set up our app display
        // // TODO: remove when done with initial setup testing
        // this.model.addSection('testValues', {mainLabel: 'Hello, World! This is ThunderBolt!'})

        // console.log('<<<setupUIElements<<<')

        // console.log('model gate cleared')
        return this.waitReady()

    }

    setupMenu(menuPath:string) {
        const menuData = require('Assets/'+( menuPath ) ).replace('/front', '/front/')

        console.log('menu data', menuData)
        return setupMenu(this, menuData)
    }

    // public setupDesktopMenu(desktopMenu) {
    //     for(let i=0; i<desktopMenu.length; i++) {
    //         mainApi.addMenuItem(null, desktopMenu[i])
    //     }
    //     mainApi.realiseMenu()
    //
    // }


    public setActiveMenu(menuComp) {
        this.activeMenu = menuComp
    }

    public onMenuAction(props) {

        const menuEvent = {
            id: props.id,
            app: this
        }

        if(this.activeMenu) {
            this.activeMenu.update({open:false})
        }


        // TODO: Handle anything framework global here

        // dispatch to current page activity.  include app instance in props
        let handled = false
        if(this.currentActivity) {
            if(typeof this.currentActivity.onMenuAction === 'function') {
                handled = this.currentActivity.onMenuAction(menuEvent)
            }
        }
        // now call any app registered menu handlers (not page bound)
        if(!handled) {
            const handler = this.menuHandlers[props.id]
            if (handler) {
                handler(menuEvent)
            }
        }
    }
    public onToolAction(props) {

        const menuEvent = {
            id: props.id,
            app: this
        }
        // dispatch to current activity.  include app instance in props
        if(this.currentActivity) {
            if(typeof this.currentActivity.onToolAction === 'function') {
                this.currentActivity.onToolAction(menuEvent)
            }
        }
        const handler = this.menuHandlers[props.id]
        if(handler) {
            handler(menuEvent)
        }
    }

    /**
     * Register a global-scope handler for a menu or a tool action
     * or pass null instead of the handler function to clear it
     * @param menuId  menu action identifier
     * @param handler function to handle menu event
     */
    registerMenuHandler(menuId, handler) {
        if(handler) this.menuHandlers[menuId] = handler
        else delete this.menuHandlers[menuId]
    }


    // TODO: make part of a more defined util section
    public makeStringParser(string:string) {
        return StringParser && new StringParser(string)
    }


    private keyListener(event) {
        // console.log('key event seen '+event.key)
        if(event.isComposing || event.code === "229") {
            return;
        }
        if(event.key === "Backspace" || event.key === "Delete") {
            event.stopPropagation()
            event.preventDefault()
            this.navigateBack()
        }
    }

    private attachPageKeyListener() {
        if(!keyListenerBind) {
            keyListenerBind = this.keyListener.bind(this)
        }
        document.addEventListener('keydown', keyListenerBind)
    }
    private removePageKeyListener() {
        document.removeEventListener('keydown', keyListenerBind)
    }

    /**
     * Replaces the currently mounted page markup with the markup of the named page
     * and starts the associated activity.
     *
     * @param {string} pageId
     * @param {object} [context]
     */
    public navigateToPage(pageId:string, context?:object, skipHistory?:boolean) {

        if(!pageId) return;

        // set the page in the model.  For Riot, this forces the page to change on update
        // for mobile, we need to do that through native navigation, but we still want the model to be the same
        // these next two lines is what actually triggers the display of the page
        // so let's do it async
        let prevActivityId = this.currentActivity && this.currentActivity.activityId
        if(prevActivityId === pageId) skipHistory = true;
        console.log('$$$$$$$$$$ navigate to page '+pageId)
        this.model.setAtPath('navigation.context', context || {})
        this.model.setAtPath('navigation.pageId', pageId, true)

        // note that this isn't used on the mobile side, but we record it anyway.
        // this may be useful later if we have any history-related functionality in common.
        let curActivityId = this.currentActivity && this.currentActivity.activityId
        let curContext = this.currentActivity && this.currentActivity.context
        if(!skipHistory) {
            this.history.push({
                pageId: curActivityId,
                context: curContext
            })
        }

        if(check.mobile) {
            let pageref = '~/pages/' + pageId

            const navigationEntry = {
                moduleName: pageref,
                backstackVisible: !skipHistory
            };
            theFrame && theFrame.navigate(navigationEntry)

            // apparently, we can pass a function instead of a navigationEntry to construct a Page
            // which might be something to look at later if we want to work from our own common page definition
            // instead of writing out {N} syntax files.
            // Function needs to build full page including the layout stack and any event handlers.
            // not sure what effect this has on back history, since there's nothing passed for that.

        } else {
            const pageComponent = findPageComponent(pageId)
            if(!pageComponent) {
                throw Error('No page component for '+ pageId)
            }
            const activity = pageComponent.activity;
            if(!activity) {
                throw Error('No exported activity for '+ pageId)
            }
            activity.context = context;
            console.log('$$$$ Starting page', pageId)
            this.startPageLogic(pageId, activity, context)
            this.model.setAtPath('navigation.pageId', '', true)
            this.model.setAtPath('navigation.pageId', pageId || '', true)

        }

    }

    /**
     * Sets the data for a page
     * accessed via `bound.data` in page markup
     * There are two forms for this.
     * 1: Call with a single object argument following the page name to set all the properties of the 'data' object.
     * 2: Call with the property name, value to set an individual property of the page data object
     *
     * @param pageName - may pass with or without the '-page' suffix
     * @param item
     * @param value
     */
    public setPageData(pageName:string, item:object | string, value?:any) {
        let fullPageName, pageId
        if(pageName.substring(pageName.length -5) === '-page') {
            fullPageName = pageName
            pageId = pageName.substring(0, pageName.length - 5)
        } else {
            pageId = pageName
            fullPageName = pageName + '-page'
        }

        let data
        try {
            data = this.model.getAtPath('page-data.' + fullPageName) || {}
        } catch(e) {
            const pgs:any = {}
            pgs[pageName] = {}
            const pages = this.model.addSection('page-data', pgs)
        }
        if(typeof item === 'object') {
            this.model.setAtPath('page-data.'+fullPageName, item)
        } else {
            data[item] = value
            this.model.setAtPath('page-data.'+fullPageName, data )
        }

        let curActivityId = this.currentActivity && this.currentActivity.activityId

        const pageComp = curActivityId && findPageComponent(curActivityId)
        if(pageComp && pageComp.comBinder) {
            pageComp.comBinder.applyComponentBindings(pageComp, 'page-data.' + fullPageName, (component, name, value, updateAlways) => {
                // Handle the update to the component itself
                // console.log('updating page')
                if (check.riot) {
                    try {
                        component.bound.data = value
                        component.update()
                    } catch (e) {
                    }
                } else {
                    component.bound.set(name, value)
                }
            })
            pageComp.reset()
        }

    }


    /**
     * Returns the data object for the named page, if one exists
     * @param pageName
     */
    public getPageData(pageName:string) {
        return  this.model.getAtPath('page-data.' + pageName)
    }


    /**
     * Called by mobile side to start the first activity only ('main')
     *
     * @param activity
     * @param context
     */
    public startPageLogic(id:string, activity:any, context?:object) {
        activity.activityId = id;
        this.currentActivity = activity;

        if(!check.mobile) {

            activity.onBeforeUpdate = (props, state) => {

                console.log('Announcement that the page will update', this, activity, props, state)

            }

            this.attachPageKeyListener()
        }

        activity.appStart(this, context)
    }

    public navigateBack() {
        let popBack = this.history.pop()
        if(popBack) {
            // console.log(popBack)
            this.navigateToPage(popBack.pageId, popBack.context, true)
        }
    }

    /**
     * Dispatch an event to the current activity by name
     *
     * @param name
     * @param domEvent
     */
    public callEventHandler(tag:string, platEvent:any) {
        const act = this.currentActivity;
        const ed = new EventData()
        ed.app = this
        ed.platEvent = platEvent
        ed.sourceComponent = this.getComponent(platEvent.target as HTMLElement)
        ed.eventType = (platEvent as Event).type
        ed.tag = tag
        let name = ed.sourceComponent.state[tag]
        if(typeof act[name] === 'function') {
            act[name](ed)
        } else {
            Log.error(`${name} is not a function exposed on current activity ${act.activityId}`)
        }
    }

    // same as the one in ComCommon, but duplicated here for use with eventData
    private getComponent(el:HTMLElement):any {
        try {
            let syms;
            do {
                if(el) {
                    syms = Object.getOwnPropertySymbols(el)
                    if (syms.length === 0) {
                        el = el.parentElement
                    }
                } else {
                    return null;
                }
            } while (syms && syms.length === 0)

            return el[syms[0]]
        } catch(e) {
            Log.warn(e.message || e)
            return null;
        }
    }

    // ----------------- File API access --------------------------
    // todo: Put into separate API space

    fileExists(filePath) {
        if(!check.mobile) {
            return mainApi.fileExists(filePath)
        } else {
            return false
        }
    }

    readFileText(filePath) {
        if(!check.mobile) {
            return mainApi.readFileText(filePath)
        } else {
            throw Error("File APIs not implemented for mobile yet")
        }
    }
    // ------- Extension for indicators / tools
    createExtensionType(name:string) {
        const EType = extensionTypes[name]
        if(EType) {
            return new EType()
        }
    }


}

// as it is from ComCommon
function getComponent(el) {
    try {
        let syms;
        do {
            if(el) {
                syms = Object.getOwnPropertySymbols(el)
                if (syms.length === 0) {
                    el = el.parentElement
                }
            } else {
                return null;
            }
        } while (syms && syms.length === 0)

        return el[syms[0]]
    } catch(e) {
        console.warn(e.message || e)
        return null;
    }
}
function findPageComponent(pageId) {
    const tag = pageId+'-page'
    // console.log('finding page with tag',tag)
    const el = document.getElementById('root')
    const appComp = getComponent(el)
    const pageCompEl = appComp.$$(tag)[0]
    const pageComp = getComponent(pageCompEl)
    // console.log('found page', pageComp)
    return pageComp
}

