###TODO Roundup:

##### Countdown
- √ final getter work for pages (components)
- mobile components and pages
- tbx clean/prepare/compile and init

###### The checklist
- BackExtensions
- Tool / Indicator Extensions
- mobile equivalent PathSetters
- stringParser and other utils as /utils export from framework module
- Check Electron docs for an explicit quit event and trap there
- XX Menu tooltips
- menu shortcut display in menu item  
- Mobile ComCommon:getComponent is weak
- Review SemVer class.. Put in utils
- ‘Back’ Functions and AppGateway in mobile context — any meaning?


__tbx:__
- clean, prepare, compile / build
- filename build rule safety
- development / release
- Check buildEnvironment host in export scenario.
- doc/validate/init/etc

__Docs:__
- Getting started
- Defining pages
- Defining components
- Using the model system and binding component properties
- Page data  
- Defining a menu, toolbars, indicators
- Working with a menu
- Pages without a back control
- Pages without a title
- Back extensions
- Tool and indicator extensions
- Exporting to NativeScript
- Basic use of NativeScript


-------------
###### Journaling
##### 4/20
export to ns in progress, but binding is a question.
With Riot, we call a 'getter' that returns the bound value
on update to the local property
With NS, we need to bind the local property to the bound
value with the Observable.

These are similar and as long as the getter simply returns
the bound value, equivalent.  

But if we make the semantic refer to the bound value,
we could ditch the getter and just return the value via
the 'b()' method and use this for binding at the NS side.

So instead of `$Text` and `$Text() { return this.bound.foobar }`
we simply say `$foobar` or `$$foobar` and conversion is
`b('foobar')` or `b('data.foobar')` respectively.

Then for NS we would have a line like:
`this.addBinding(this.span2_text, 'foobar', 'text')`

I like this.  Let's
- [X] Refactor the riot work to take bind props directly.
- [ ] Refactor the NS work to add the bindings where the
property is issued.
 
```
// src .tbcm 
<div width="$fooWidth">

// riot
<div width="{b('fooWidth')}">

// ns
this.div1=new Div()
this.addBinding(this.div1, 'fooWidth', 'width')
```
This potentially leaves the sticky issue of first value.
we can get that from props, but only want to do that first 
time.  Best done in onBeforeMount and just after createControl, 
such as setLocalBinds (have it take the bind name from props and set to viewprop)








