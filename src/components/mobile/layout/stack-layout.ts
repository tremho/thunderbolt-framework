
import ComponentBase from '../ComponentBase'

import {StackLayout} from '@nativescript/core'

export class TBStackLayout extends ComponentBase {
    private stack:StackLayout
    å
    public createControl() {
        this.stack = new StackLayout()
        this.stack.orientation = this.get('orientation')
        this.container.addChild(this.stack)
    }

}


