# AoN image populator

A personal Pathfinder 2e GM tool that puts publicly available Demiplane creature artwork beside the stat block on Archives of Nethys. I made it so I wouldn't need to keep both sites open while preparing a session.

## Choose your browser

| Browser | Extension folder | Installation |
| --- | --- | --- |
| Chrome, Edge, Brave, other Chromium browsers | [chromium](chromium) | [Chrome / Edge instructions](#chrome--edge) |
| Firefox 128+ | [firefox](firefox) | [Firefox instructions](#firefox) |
| Safari on macOS | [safari](safari) | [Safari instructions](#safari) |

Install **one** folder, according to your browser.

Use **Code > Download ZIP**, extract the download, and select your browser's folder when installing. This is GitHub's automatic repository download; the extension folders themselves are unpacked and ready to load. You can also clone the repository.

### Chrome / Edge

Open `chrome://extensions` or `edge://extensions`, turn on **Developer mode**, choose **Load unpacked**, and select the `chromium` folder containing `manifest.json`. Other Chromium browsers use their equivalent extensions page.

### Firefox

Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `firefox/manifest.json`. Firefox removes temporary add-ons when it restarts, so load it again afterward.

### Safari

In Safari on macOS, open **Settings > Developer > Add Temporary Extension**, then select the `safari` folder. Enable the extension and allow access to AoN and Demiplane. If the Developer tab is hidden, follow [Apple's setup instructions](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension). This requires a Safari version with folder-based temporary extensions. Safari removes them when it quits or after 24 hours. These instructions are for macOS, not iPhone or iPad.

### Updating and using it

Replace the files in your installed browser folder and reload the extension from the browser's extension page. If you move to a different folder, remove the previous installation and load the new one. Refresh any open AoN creature pages afterward.

Click the artwork to open the full image, or the caption to visit its Demiplane source. If a match is missing, paste the creature's public Demiplane link under **Artwork settings**. Source choices and lookup results are saved locally.

## About the project

The extension includes no artwork and does not host or generate images. It reads a public creature page to find an image URL, then your browser loads that image from Demiplane. It does not use a login or bypass paid or private content. Demiplane and its image host receive the requests needed to show the artwork; there is no analytics service.

I do not own the images, and I don't know whether distributing this tool is permitted. I haven't sought permission from AoN, Paizo, or Demiplane. This is an unofficial, free project for local installation. I don't plan to publish it in an extension store or make money from it. If a rights holder objects, I'll promptly stop distributing it and remove the public repository.

