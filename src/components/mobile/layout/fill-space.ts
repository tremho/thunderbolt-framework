
import ComponentBase from '../ComponentBase'

import {StackLayout} from '@nativescript/core'

export class FillSpace extends ComponentBase {
    private fill:StackLayout
    å
    // Override to create our button
    public createControl() {
        this.fill = new StackLayout()
        this.fill.width = this.get('width')
        this.fill.height = this.get('height')
        this.container.addChild(this.fill)
        // this.addBinding(this.fill, 'width', 'width')
        // this.addBinding(this.fill, 'height', 'height')
    }

}


