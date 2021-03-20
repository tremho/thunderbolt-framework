
import {newCommon} from './ComCommon'
let cm;

export default {
    onBeforeMount(props, state) {
        console.log(this.root.tagName, 'onBeforeMount', props, state)
        const addBind = Object.assign({bind: 'navigation.context'}, props)
        Object.defineProperty(this,'props', {
            value: addBind
        })
        this.bound = new Object()
        cm = newCommon(this)
        cm.bindComponent()
    },
    onMounted(props, state) {
        console.log(this.root.tagName, 'onMounted', props, state)
    },
    onBeforeUpdate(props, state) {
        console.log(this.root.tagName, 'onBeforeUpdate', props, state)
    },
    onUpdated(props, state) {
        console.log(this.root.tagName, 'onUpdated', props, state)
    },
    onBeforeUnmount(props, state) {
        console.log(this.root.tagName, 'onBeforeUnmount', props, state)
    },
    onUnmounted(props, state) {
        console.log(this.root.tagName, 'onUnmounted', props, state)
    }
}

