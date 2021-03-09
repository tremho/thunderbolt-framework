
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



