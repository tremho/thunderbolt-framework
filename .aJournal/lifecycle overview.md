## The quest for a better lifecycle

### It starts with `tbx`

- create the tbx CLI as a start

- handle command and option parsing in a general way

- define the 'build' command


### Now that we're cooking with gas

- Cool build beans.  Much better than the PoSPoC before.
- bring in ts and riot loaders  
- Bring in basic riot framing for Hello World

### Let's add some artsy to our fartsy

- Read up on multi-modules

### Riot under protest
Thinking about riot components in NS terms.

What would it take to devise an intermediate format and then
a riot compiler plugin we can put into the webpack chain that
- makes the riot components
- organizes and builds the main page list of pages  
- exports NS component markup xml

We'll need to revisit this after getting to the first mobile export point.

-----------

## Back to imports and structure
Okay, so we got excited above with the webpack integration. Now let's
get back to importing the framework and using it.

# Lifecycle and registrations

##### `APP`
- __appStart__ - Allows app to set up menus, models, etc. First start notice.
- __appExit__  - Notifies app that is ending.

##### 'PAGE'
- __pageBegin__ - Page has been entered
- __pageDone__ - Page has been exited for another page

_Other page APIs may be called per event, such as `onMenuAction`, `onToolAction`, etc._

The tb app's index file is the delivery envelope for the framework back 
`main.ts` operations which establish the Electron environment and
fire up both the back and front processes.
This has the following effect:
- We are executing in the back process at this point
- We register an app class that will get the lifecycle (Start/Exit) calls.  
- Front process is created, window is opened, and index.html is loaded
  and will bring in the css, pack bundles, and sourcemap info.
- This invokes `appMain.js` from the bundle. It will call
internally to setupUI and at this point it can do the following:
    - call our registered app class with start, passing the appCore context.
    - this allows us to do our app-specific setups
    - After this, the main page is navigated to.
    - First page ___must___ be named main-page

### More build work  
- Pages are enumerated and listed in app.riot as a build process
- (navigation to a page is simply a switch on the one main page)
- Environment info is supplied at build time and bundled for early start runtime
access.

### How I intend to construct this

- framework index defines all the interface types
- when we register an app (in tbAppBack) the framework creates a new execution context (instance)
and this is what we pass as framework context (backend) [appStart, appExit]
- When appmain executes on the renderer side, we create an appCore
  reference. We need to supply a front-end instance here.
  But how do we get it?
    - tb app must supply a TbAppFront.ts file that is imported into appmain.js
    - this will get [appStart, appExit] also, but of course its a different process. 
- we should expose comfortable APIs at this level, but keep all the
implementation gore underneath.

### As I go
- more to do in build
  - modify and copy index.html
  - tsc project tbAppBack.ts to build/tbTest.js (+ dependencies, e.g. preload)
  - generate sass to build/css
  - generate smx-info.js source mapping
- remember to install any dependencies needed by pack bundles
  - do this and report
  - 
  
#### Go back to [inevitable refactor part II]('./the inevitable refactor to to it more correctly.md')




