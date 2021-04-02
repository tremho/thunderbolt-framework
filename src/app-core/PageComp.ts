
import {newCommon} from './ComCommon'
let cm;

export default {
    onBeforeMount(props, state) {
        // console.log(this.root.tagName, 'onBeforeMount', props, state)
        // const addBind = Object.assign({bind: 'navigation.context'}, props)
        // Object.defineProperty(this,'props', {
        //     value: addBind
        // })
        cm = newCommon(this)
        this.comBinder = cm.getComBinder()
        this.reset()
        this._isReset = false;
    },
    onMounted(props, state) {
        // console.log(this.root.tagName, 'onMounted', props, state)
    },
    onBeforeUpdate(props, state) {
        // console.log(this.root.tagName, 'onBeforeUpdate', props, state)
        this.bound.data = cm.getApp().getPageData(this.root.tagName.toLowerCase())
        if(this.root.tagName.toLowerCase() === 'file-test-page') {
            // console.log('app path at page level = ', this.bound.data.appPath)
        }
    },
    onUpdated(props, state) {
        // console.log(this.root.tagName, 'onUpdated', props, state, this.bound.data)
        this._isReset = false;
    },
    onBeforeUnmount(props, state) {
        // console.log(this.root.tagName, 'onBeforeUnmount', props, state)
    },
    onUnmounted(props, state) {
        // console.log(this.root.tagName, 'onUnmounted', props, state)
    },
    reset() {
        this._isReset = true;
        this.bound = new Object()
        cm.bindComponent()
    },
    isReset() {
        return this._isReset;
    }

}

