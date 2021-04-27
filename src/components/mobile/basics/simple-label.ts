
import ComponentBase from '../ComponentBase'

import {Label} from '@nativescript/core'

export class SimpleLabel extends ComponentBase {
    private label:Label
å
    // Override to create our button
    public createControl() {
        // no need to call super, because it doesn't exist
        let text = this.get('text') || 'simple-label'
        console.log('in simple-label with text', text)
        this.label = new Label()
        this.label.set('text', text)
        this.container.addChild(this.label)
        this.addBinding(this.label, 'text', 'text')
    }

}


