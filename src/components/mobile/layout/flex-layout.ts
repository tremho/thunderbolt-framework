
import ComponentBase from '../ComponentBase'

import {FlexboxLayout} from '@nativescript/core'

export class FlexLayout extends ComponentBase {
    private flex:FlexboxLayout
    å
    // Override to create our button
    public createControl() {
        this.flex = new FlexboxLayout()
        // todo: all the props:
        // orientation, wrap, justify(content), align(items)

        this.container.addChild(this.flex)
    }

}


