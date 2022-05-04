# Discord-KaiOS-Unofficial

Unofficial Discord client for KaiOS devices (tested on Cingular Flip IV on 2.5.3). Also technically works in the browser (briefly tested in Firefox 45 on Windows XP), but such configurations are unsupported.

Note that using this is technically against Discord's TOS, and that I take no responsibility for what they do about it.

Changes made by Cyan:

-   migrate to ES6 classes(syntactic sugar ftw!!!)
-   support node.js (require and import should work, install dependecies...)
-   use async code

Future:

-   if the backend still works i'll make more ui, will also try to implement discord servers/guilds
-   i will use this api to abuse a few things in discord

Nodejs:

-   you must create a `token.txt` which contains your discord token.
-   running `npm run test` will console.log the names found in your DMs.
-   I have no idea how WebSockets work so you must terminate the script yourself...
