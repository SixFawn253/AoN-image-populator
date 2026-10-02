# AoN image populator

An unofficial **Pathfinder 2e** GM tool that shows artwork from a creature's public [Demiplane](https://app.demiplane.com/nexus/pathfinder2e/creatures) page beside its [Archives of Nethys](https://2e.aonprd.com/Monsters.aspx) stat block. I made it for personal use so I wouldn't need two tabs open. If automatic matching misses a creature, paste its Demiplane page link under **Artwork settings**.

The extension includes no artwork and does not host or generate images. It reads a public creature page to find an image URL, then the browser requests that image from Demiplane. It does not use a login or bypass paid or private content. I do not own the images or know whether distributing this tool is permitted. I have not sought permission from AoN, Paizo, or Demiplane. This project is unaffiliated with them, is free, and is intended for local installation only; I do not plan to publish it in an extension store or make money from it. If a rights holder objects, I will promptly stop distributing it and remove this public repository.

The code is open source for inspection. Codex helped write it, especially the Safari version, and I reviewed it personally. I only intend to fix bugs, not expand it beyond PF2e.

## Install

- **Chrome / Edge:** Extract [the Chromium ZIP](aon-image-populator-chromium.zip). At `chrome://extensions` or `edge://extensions`, turn on Developer mode, choose **Load unpacked**, and select the extracted folder.
- **Firefox 128+:** Extract [the Firefox ZIP](aon-image-populator-firefox.zip). At `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on** and select its `manifest.json`.
- **Safari:** In Safari Settings > Developer, use **Add Temporary Extension** with [the Safari ZIP](aon-image-populator-safari.zip) where available, then allow access to AoN and Demiplane.

Refresh an AoN PF2e creature or NPC page after installing. Click the artwork for the full image, or **View on Demiplane** for the source page. Firefox and Safari temporary extensions must be loaded again after the browser removes them.

The extension saves source choices and lookup results locally. Demiplane and its image host receive the requests needed to look up and show artwork. There is no analytics service. The MIT license covers this extension's code, **not third-party artwork**.
