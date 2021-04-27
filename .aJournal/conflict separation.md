### Breaking into multiple modules

So, I don't know why this didn't come up before this last minute timing,
but it turns out I can't npm install thunderbolt-framework into 
the nativescript side because of its node dependencies even though
they aren't referenced there.

So -

##### thunderbolt-framework-electron
wraps 
###### thunderbolt-framework-common

and 
#### thunderbolt-framework-nativescript
wraps
###### thunderbolt-framework-common

and we need to make bridge API modules to either/or functionality

like this:

commonFS = {
    readFile
    mkdir
    whatever
}

and then inject these api namespaces with implementation functionality
from the wrapper level

`<sigh>`

but it will be worth it in the end.



    