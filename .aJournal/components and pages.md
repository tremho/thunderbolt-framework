
#### Component design 

##### My friends, what _is_ a Component?
A component consists of
- markup instructions that define the heirarchy of constituent elements
- SCSS Style definitions applied to elements
- Code for handling properties and behaviors

We have two different, but similar definitions for each
component in order to serve both desktop and mobile 
concerns.

###### Markup, Code, and Style

Markup for riot consists of html-style element construction
along with conditional notations so that it is a mixture
of markup and coding, in effect.

Markup for our Nativescript implementation is done in
the `createControl` portion of the component script
and establishes the parent-child relationships of 
NS elements in a procedural fashion.

Code for property and behavior handling is done via the
lifecycle methods of riot.  For NS, event listeners are
mixed in with markup.

SCSS for both could simply be exported as an scss file that gets
picked up by the build.  But we need to establish some
selector scoping that keeps similar declarations independent
of other controls.

###### Reworking createControl
- break this into  `controlLayout` and `controlProperties`
and separate via `onLayoutChanged`.

###### Rethinking riot construction
Look into the compiled version of a riot file and see
what's needed to construct a riot component with code only.

It's more complicated than I'm prepared for right now.

So we can still go with the riot file output.

#### Our own component design language
- declare element types of 'div' 'p' and 'span' (and 'button')
that make up our primitives
- these become 'StackLayout (vertical)', 'Label', 'StackLayout (horizontal)+Label', and 'Button'
for NS
  
#### Common declaration:
```
{
type: "component"
id: "our-own-control",
bind: "bind declarations",
layout: `
    <div press=$onPress>
        <span>$Foo</span>
        <span if=$HasBaz>$Baz</span>
        <span>$Bar</span>
    </div>
`,
methods: {
    Foo: () => {return props.foo}
    Bar: () = {return bind.bar}
    Baz: () => {return bind.baz}
    HasBaz: () => {return props.baz == 'true'}
    onPress: (ev) => { do your thing }

beforeLayout() {
    // anything we need to do before layout
    // we can alter state here, but not props
    // we have no bind yet, but do have the declarations.
    // we will have access to base of course, and
    // via that the comcommon and app core
    // we can do more layout and/or more binding
    // or general readiness
}
afterLayout() {
    // similar to above, but we also have bind values
    // we can set element values, but shouldn't alter
    // layout any (although that will work it will be uncontrolled)
    // we can add animations or whatever.
}

<style>
:host {
    color: 'black'
    width: '100%'
    height: '53px'
    font-size: '1em'
}
</style>

```

#### RIOT version:
```
<our-own-control bind="declarations">
    <div press={p("onPress")}>
        <span>{p("Foo")}</span>
        <span if={p("hasBaz"}>{p("Baz"}</span>
        <span>{p("Bar")}</span>
    </div>
<style>
:host {
    color: 'black'
    width: '100%'
    height: '53px'
    font-size: '1em'
}
</style>    
<script>
    import {riotCommon} from 'RiotCommon'
    export default {
        init: riotCommon.init,
        p: (n, props, bind) => {
         switch(n) {
            case 'Foo': () => {
                return props.foo
            }
            case 'Bar': () => {
                return bind.bar
            }
            case 'Baz': () => {
                return bind.baz
            }
            case 'hasBaz: () => {
                return props.baz === 'true'
            }
            case 'onPress': (ev) => {
                console.log('do your thing')
            }
            default: {
                throw Error()
            }    
         }
        },
        // called from onBeforeMount    
        beforeLayout() {
        },
        // called from onMounted
        afterLayout() {
        }
    }
</script>     
</our-own-control>
   
```  
#### Nativescript version

```
{
    controlLayout: () => {
        this.div1 = new Div() //StackLayout()
        this.span1 = new Span() // hSL+Label
        this.div1.addChild(this.span1)
        if(this.p("hasBaz")) {
            this.span2 = new Span()
            this.div1.addChild(this.span2)
        }
        this.span3 = new Span()
        this.div1.addChild(this.span3)
    },
    controlProperties: () => {
        this.div1 && this.div1.on('tap', (ev) => {return this.p("onPress")}
        this.span1 && this.span1.text = this.p("Foo")
        this.span2 && this.span2.text = this.p("Baz")
        this.span3 && this.span3.text = this.p("Bar")
    },
    p: (n, props, bind) => {
         switch(n) {
            case 'Foo': () => {
                return props.foo
            }
            case 'Bar': () => {
                return bind.bar
            }
            case 'Baz': () => {
                return bind.baz
            }
            case 'hasBaz: () => {
                return props.baz === 'true'
            }
            case 'onPress': (ev) => {
                console.log('do your thing')
            }
            default: {
                throw Error()
            }    
         }
    }
}

### our-own-control.scss
[tb-type="our-own-control"]: {
    color: 'black'
    width: '100%'
    height: '53'
    font-size: '12'
}           
```
### Pages

#### Common Page description
```Javascript
Construction
{
    type: "page",
    id: 'main',
    title: "Main Page",
    noBack: true,
    menuId: "main",
    toolbarId: "main",
    indicatorId: "main",
    content: [
    {
      type: "simpleLabel",
      props: {
        bind: "testValues.mainLabel as text"
        text: "Hello"
      } 
    },{ type:"simpleButton",
    props: {
      text: "Go to Next Page",
      action: "onClick" // names an exported function in page logic
    } }, { type: "simpleButton",
      props: {
        text: "Toggle Indicator",
        action: "onIndTest"
    } } 
    ]
}

Logic
  ... contents of main-page.ts here


```
#### Riot version
```
<main-page>
    <action-bar no-back="true" text="Main Page" menu-id="main" toolbar-id="main" indicators-id="main"/>
    <simple-label bind="testValues.mainLabel as text" text="Hello"/>
    <simple-button text="Go to Next Page" action="onClick"/>
    <simple-button text="Toggle Indicator" action="onIndTest"/>

    <script>
      import pageComp from 'Framework/app-core/PageComp'
      import * as activity from './main-page'
      const pc =  Object.assign({}, pageComp)
      pc.activity = activity
      export default pc
    </script>
</main-page>
```