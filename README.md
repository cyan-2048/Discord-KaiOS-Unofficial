# Discord-KaiOS-Unofficial

Unofficial Discord client for KaiOS devices (tested on Cingular Flip IV on 2.5.3). Also technically works in the browser (briefly tested in Firefox 45 on Windows XP, hewo cyan here; because of the changes i made this may or may no longer work), but such configurations are unsupported.

Note that using this is technically against Discord's TOS, and that ~~I~~ we take no responsibility for what they do about it.

### Changes made by Cyan:

-   migrate to ES6 classes(syntactic sugar ftw!!!)
-   support node.js (require and import should work, install the dependecies...)
-   use async code
-   if you create a `token.txt` file in the app package(where the manifest.webapp is located), the app will automatically use that...

### How?

Last year, there was like 2 unofficial discord clients one was open-sourced but was barely finished and one was closed-source but somewhat finished... I wanted to help Frank128 with the development so I created a UI which he can use so that the app would work properly, unfortunately he has been busy and yeah i'm also busy... so the app was abandoned for a few months... I decided to read the code again since it was not too bad and improved a few things. And then I added the UI, now here we are!

### what does this all mean?

the fact that the discord api is kinda simple and all it takes is your token to ruin everything is kinda scary... This also means discord themselves could definitely have just made their own client for KaiOS devices....

### What works:

-   sending messages in dms and servers
-   reading messages in dms and servers
-   seeing channels(even the hidden ones)
-   server folders

### What doesn't:

-   a lot of things doesn't work _yet_

### installation:

-   download the zip file of this [repo]()
-   unzip and create a `token.txt` file in the main directory, the file must contain your discord token, to make this easier use [discordo](https://cyan-2048.github.io/discordo/).
-   install the app using WebIDE ([guide1](https://martinkaptein.com/blog/sideloading-and-deploying-apps-to-kai-os/), [guide2](https://wiki.bananahackers.net/install-omnisd), or ask for help in the official discord server of r/KaiOS)

### HELP needed!!!

Frank128 is still busy with his life, I barely have any experience with the Discord API (specially the Gateway/WebSocket api)... I cannot do much without anybody working on the backend side of the app...

### Future:

-   ~~if the backend still works i'll make more ui, will also try to implement discord servers/guilds~~ dun-dun-da-dan, dun-dun-da-dan, dun-dun, da-ra-ra-ra
-   i will use this api to abuse a few things in discord
-   markdown support, discord emoji support, @mentions, #channel mentions, links, redirect discord links to the app, qrcode scanner you can use with the [discordo](https://cyan-2048.github.io/discordo/) website, see attachments, options
-   if backend dev help arrives: unread/mentions, status, rich presence, push notifs

### Nodejs:

-   you must create a `token.txt` which contains your discord token.
-   running `npm run test` will console.log the names found in your DMs.
-   I have no idea how WebSockets work so if you use that you must terminate the script yourself...

### Discord Server:

I made a [discord server](https://discord.gg/W9DF2q3Vv2)!
