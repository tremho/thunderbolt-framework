
# TB approach refactored

I've been going about this wrong.
making a 'build' folder that copies different
parts of the framework and app and then assembles
from there is fraught with issues, and it's
really stupid, especially considering how I've
done frameworks in the past and how frameworks
in general get done.

## Just a node project

A TB app should be just another Node project.
Thunderbolt is just another npm module that the
app index page brings in.

From there, it's a matter of the app registering
itself with the framework so the app can be
called with lifecycle methods and the framework
can be injected with api-compliant instances of
key functions.

Things that come to mind here are i18n and resource 
handling, menus, etc. 
Also any back-end injections, like file handling
or service attachments.

Other modules are avaialble to the app, like 
any other npm module.  Some of these may be
associated with the framework, but are not
necessarily a part of it.  Things that come
to mind here include logging and formatting, and
unit conversions, etc.

## Mobile express
To support mobile, we need the core framework modules
for the mobile version to be crafted in Nativesript
compatible terms.  This is basically what we have already
started.  
Creating a mobile version of the app entails exporting 
to a new project space, where files are copied and the
{N} version of modules are installed.
Riot-level code is auto-converted to Nativescript
as much as possible.  From there on, work is done
in this separate mobile app independently.

---------------
### Challenges due to dual-sided Electron structure

- app actually starts in the ElectronMain context
- so a TB app must invoke this (main.ts) as an envelope
- the webpack.config names appMain.js as the entry point,
so we need to either register our own name for this or else
accept this as the default.
- we need these as part of app space:
    - appMain.js
    - register-global-components.js
    - tsconfig.son
    - webpack.config.js
    - index.html
    
- experiment with having these be in the node_modules/thunderbolt space.
- the framework discerns their location at app registration.
- a framework binary command (tbx) invokes the build.


### Bootstrap and lifecycle

- tbx executable
- tbx build executes the webpack construction found in the node_modules/thunderbolt-framework
location and outputs to 'output' which has two sides. One is the electronMain app, which
is really the user app main that calls the EM startup stuff as an envelope.
The other is bundle.js created from the UI side from the appMain.js and others,
other webpack bundles will be made from user-supplied pages and code modules
and these will form the Riot front.
  
[Lifecycle journal detail here](lifecycle%20overview.md)

---------------
# Inevitable refactor part II
Okay, so I ran into a roadblock in part I
for whatever reason, I can't import electron APIs... <sigh>

So for a sanity check, I went back to the [basic Electron
docs]('https://www.electronjs.org/docs/tutorial/quick-start') 
and see that I may still be overcomplicating my architecture
here.

So let's do this:
- create a sanity basic-electron project and follow the
quickstart verbatim
  - okay, but it doesn't work as advertised.  'process' is not defined
  in the renderer scope, even though node integration is set to true.
  I'm not too worried about that because that's not important in our
  context, but it is disconcerting that the example doesn't work out
  of the gate like it should.  
    

- the difference now is that the index.html we want needs
to pull in a built bundle from our project.
- the other difference is that we would be invoking electron from
our app space instead of from the framework space, requiring the
  user to install electron.  No huge deal, but I'd like it better
  if we could make thunderbolt-framework the only install.
  There's also the question of riot as well...
  
- __here's a big difference:__ `npm start` calls electron . from the execution root.
We aren't doing that.  we're trying to run the node app, which is wrong.
And in fact, we get a similar failure when we run the sanity app that way.
<br/>
So back at tbTest, let's run electron and see what we get.<br/>
___Oh Crap! That was it!  I am an idiot!___   
  
#### So what I need to do is this:
- in tbx:
- need to fabricate a package.json for execution that points to main.js
- need to tsc backMain and copy to main.js (node-typescript-compiler)
- need to make an executable start script that invokes Electron from
our embedded path.  Note this is platform dependent.

---------------------
#### Current state
The Ides of March have us at basically the point our PoSPoC was at
in Pueblo, but with a better foundation and structure.

#### 3/17
- √ Imports and logging 
- √ Prove out model setup in `tbAppFront`
  
#### 3/20
- √ Refactor tbx into multiple sub modules per command
- Build environment
  - √ create BuildEnvironment.json and put into a hidden temp (.gen) off of
  projPath and alias pack it into bundle from there
  
  - √ use tbx build; tbx run instead of dev-side hack scripts
    - √ detect file-newer states / build needed
  
- ◊√ CSS / SASS
  - √ Install `sass` module
  - √ establish projPath `/src/scss` as the scss path
  - √ establish `app.scss` for scss root
  - √ process during build  
      - √ css file generated to .gen folder
  - ◊ We are going to want to make framework css too?; make a tb.css file
  as part of the framework (include FA)
  -  <del>pack css files with webpack during build</del>
      - this bit isn't working
      - √ Screw the bundle.  generate to build/front instead
  

- source mapping
  - see https://survivejs.com/webpack/building/source-maps/
  - √ Should be able to use external maps.
    - Yes. `devtool: source-map` creates bundle.js.map
  - √ use this to generate smx-info
    - smx build proc reads this and makes smx-info.js for bundle.js
    using the sources and mappings data.
    - √ works under development
    - ◊ works under production
        - <span style="color:red;">no.</span> Check [uglify option.](https://v4.webpack.js.org/plugins/uglifyjs-webpack-plugin/#sourcemap)
        - <span style="color:blue;"><b>Still No.</b></span>
          - I don't think there's a way to remedy this.
          - √ change logger to display ??? if smx unavailable
          - ◊ later, when we do mode options, don't generate smx-info if mode is production
    - √ works under none

--------------

#### ???
- Menu
    - √ Definition. __Working as expected for definition and rendering__
    - √ need to verify handling
    - Look at asset handling and images
- Toolbars and indicators
  - Menu def appears to be working
  - Not seeing controls.  Check components and CSS

---
√ Need to call appStart (or do default app start) at setupUI time
and clear the gate only after establishing any menu models.

√ Time is now: need to trap, display and break on webpack errors.

---

√ Now we need to do app.riot generation from page list
  - _Is is funky to write into node_modules space? <span style="color:green;"><b>I think OK</b>

- Make new pages for testing, etc
  - change page appStart to pageStart
  
  - ◊ File Test Page is broken and mod/messed up.
    - Failing to bind, so crashing on object resolution in riot
    - Why isn't page-level binding working?
    - can we avoid nesting with a spread op? use underscore? (obj_prop)
    
---
### Stupid bug issues 3/24
- preload.js is not generated into build properly
- weird behavior with onMenuAction responder for nav change to file. mske async?

---
### Change in page data approach
- create app function to `setPageData(pageId, obj)` and pass an object with values
- this becomes attached to 'bound' as 'data'
  - consider making simply 'data'
- set/update a value with `setPageData(pageId, prop, value)`. 
  - this will update binding (whole data object)
  
#### 3/24
 - instantiate PageComp in riot pages with boilerplate
  - is there any way to automate/simplify this?
  

---

- Remote API errors: rejection forwarding

- File API
  - BinaryAPI
      - ArrayBuffer to/from binary string
      - base-64
  - error reporting protocol

  - appFolder
  
  - Need an `updatePage(pageId)` call or setPageData does update
    - Basically, pageComp.comBinder.applyComponentBindings for
    the page-data.pageId bind directive (one time only)

--------
#### 3/25 My current dilemma
###### not updating page on setPageData
- After hacking at this in between manual labors on waterfall project,
I am both sore and confused.  Combinding is happening and there is an update,
but the new values are not reflected.  
  
----------
#### 3/26 Dilemma solved
- Since our pages are not unmounted/remounted, there is no reset to 
pick up the initial props for any of the child components
when the page updates after initial load-time mounting.  
So I created a reset functionality and worked that into the solution.
- It resets on each call to setPageData.  This gets a bit noisy, so
we could separate it for a specific update, but it seems okay IRL 
now, so let's put that off to a later decision.
  
-----
###### √ 3/28
   - file exist
   - read/write text and ArrayBuffer
   - delete
   - rename
   - move
   - copy  
   - fstat
   - mkdir / -p
   - rmdir / -fr
   - read directory

---------
 - √ Path utilities
   - tests
  

- Back-Side API additions

  - Was going to use require.context to bring in files from the user side,
  but the irony here is that we don't webpack the back end, so that obviously 
  won't pan out.
  - I don't think we really have a build-time option because I'm only
  building tb for dev purposes anyway, not for real.
  - So for runtime:
    - tbAppBack imports modules it wants to expose and calls framework to do so
    - ◊ Enumerate module and register functions with extAPI
    - ◊ Attach to the ipc at both sides
  
###### Weird dance in preload bootstrapping...
- I now have a 'gatherExtensions' call in AppGateway that preload
can call.  This occurs ~400ms after tbAppBack.appStart is called,
which implies we have time to add methods to 'exportedFunctions'.
Isn't that what we did before, though? Why didn't it work?
###### Elementary my dear, stupid Watson...
- Preload loads AppGateway in one process and appBack loads it in another.
So setting the properties of 'exportedFunctions' is limited to whatever
  is brought in at load time; the independent runtimes are oblivious to
  one another.
  
- What normally happens:
  - both sides see the same names/functions in exportedFunctions, although
  we don't use the functions on the render side.
  - The back side has wired these functions up to 'api'
  - what if we exported our module as 'name'?
    - problem here is getting the `contextBridge` out of preload
    - but I don't think we have to.
  -- let's create a BackExtensions module and let it import contextBridge
      and do basically all the same wiring, but to the module by name
      instead.
      
###### Grr. Reset again.
  switch to a more direct message system.
  ipcRenderer will send the message from front space into the back
  ipcMain will listen to this and call the function
  ipcMain will send the response to the front
  ipcRenderer will listen for the response and bind it to the responder return
  - So we have two modules
    - BackExtensions
      - runs in main (back) and handles the listeners and response sends
    - BackExtensionFront (front, appCore)
      - runs in renderer and sends message to back and awaits response
  
###### Still Grr
- closer, but it turns out that ipcRenderer is not accessible to
front-side code except in preload

- But we should be able to separate out the static responder of BackExtensionsFront
to become part of preload, and try sharing the ipcRender (messageSender) via contextBridge
  
- Really close now.  just not getting a response through for some reason.

###### Okay... past that now
 - Need to document, like so many other things, but it's working
 - test function in next page successfully exchanges information
with the back side. The test function is imported in a test module
and registered in tbAppBack.   
  
-------------

### Another refactor!

Yes, it's that time again.

This time, we need to make the page navigation switching atomic.
Currently, we have pageId and context as different props on the
navigation model object, and since each post an update, we get a
race and the second thing set is often not seen, which 
causes us some issues.

-  [X] change navigation.pageId and navigation.context to page.navInfo
where pageId and context are object properties of navInfo
    - Check behavior of PageComp and forced binding to context
-  [X] review the model and consolidate.    

-  [X] also created `b` accessor to simplify bind access. use instead of `bound`

----
----




- Replace 'appStart' with 'pageStart' in pages

- Custom Components

- Explore the idea of replacing `bound` with `state`

- The whole Nativescript export and build enchilada


- Test and handle webpack errors (e.g. missing module w/o try/catch)
- Verbosity options for build output (webpack stats)
- bundle analysers with tbx inspect <type>

- build mode option for dev or release.  Option to force sourcemap
on a release build (learn about hidden source maps and/or other indirect options)
  


- Ready for first release  (let's shoot for 4/15)
  
- tbx fineries to come as . feature updates
  - init
  - doc
  - check
  - publish
  - look into updateable code via electron  

  
  
  
  
