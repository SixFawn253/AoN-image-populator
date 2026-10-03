# AoN image populator

A personal Pathfinder 2e GM tool that puts publicly available Demiplane creature artwork beside the stat block on Archives of Nethys. I made it so I wouldn't need to keep both sites open while preparing a session.

## Choose your browser

| Browser | Extension folder | Installation |
| --- | --- | --- |
| Chrome, Edge, Brave, other Chromium browsers | [chromium](chromium) | [Chrome / Edge instructions](#chrome--edge) |
| Firefox 128+ | [firefox](firefox) | [Firefox instructions](#firefox) |
| Safari on macOS | [safari](safari) | [Safari instructions](#safari) |

Install **one** folder. There is no separate generic version: the old unnamed package was a duplicate of the Chromium extension.

To get the files, use GitHub's **Code > Download ZIP**, extract it once, and keep the folder for your browser. GitHub generates that download automatically; no ZIP packages are stored here. If you already use Git, cloning the repository gives you the same folders without an archive. GitHub's download menu cannot offer a custom browser selector, so the table above points you to the right version.

### Chrome / Edge

Open `chrome://extensions` or `edge://extensions`, turn on **Developer mode**, choose **Load unpacked**, and select the `chromium` folder containing `manifest.json`. Other Chromium browsers use their equivalent extensions page.

### Firefox

Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `firefox/manifest.json`. Firefox removes temporary add-ons when it restarts, so load it again afterward.

### Safari

In Safari on macOS, open **Settings > Developer > Add Temporary Extension**, then select the `safari` folder. Enable the extension and allow access to AoN and Demiplane. If the Developer tab is hidden, follow [Apple's setup instructions](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension). This requires a Safari version with folder-based temporary extensions. Safari removes them when it quits or after 24 hours. These instructions are for macOS, not iPhone or iPad.

### Updating and using it

Replace the files in your installed browser folder and reload the extension from the browser's extension page. If you move to a different folder, remove the previous installation and load the new one. Refresh any open AoN creature pages afterward.

Click the artwork to open the full image, or the caption to visit its Demiplane source. If a match is missing, paste the creature's public Demiplane link under **Artwork settings**. Source choices and lookup results are saved locally.

## What changed in 1.1.1

Solar and several dragons were showing no artwork even though their Demiplane pages had it. Meanwhile, creatures such as Arbiter and Astral Deva worked. There were two separate reasons for that.

**Some page data was being skipped.** Demiplane sends its page data in chunks. The extension was treating each line as a separate record, but long blocks of text use a length marker instead. The creature data can begin immediately after one of those blocks, without a new line. That meant the extension could fetch the right page and still miss its image. It now reads those length markers correctly, including text with accented characters. This fixes Solar and the adult Wish and Adamantine Dragon lookups. Arbiter and Astral Deva were checked again and still return their own artwork; they didn't need a special name mapping.

**Not every dragon age has its own portrait.** On the pages checked, Young and Ancient Wish Dragons and Ancient Adamantine Dragons had only a generic dragon icon. Young Adamantine Dragon had a small thumbnail. The adult pages had full artwork. When a dragon's own page has no portrait or only a thumbnail, the extension now checks the other ages of that same dragon type for a full image, trying Adult, Young, then Ancient and skipping the age already checked. It won't substitute a different kind of dragon. If it finds one, the caption names the creature the artwork came from—for example, **Adult Wish Dragon artwork on Demiplane**. A source you choose manually still takes priority.

**Old failed lookups are refreshed.** The update ignores the previous version's saved lookup results, so a cached “not found” won't hide the fix. Your manually chosen source links are kept.

The lookup checks returned:

| AoN creature | Artwork found |
| --- | --- |
| Solar | Solar |
| Adult Wish Dragon | Adult Wish Dragon |
| Young / Ancient Wish Dragon | Adult Wish Dragon, labeled in the caption |
| Adult Adamantine Dragon | Adult Adamantine Dragon |
| Young / Ancient Adamantine Dragon | Adult Adamantine Dragon, labeled in the caption |
| Arbiter | Arbiter |
| Astral Deva | Astral Deva |

The repository now contains the three installable browser folders, this README, and the code license. ZIP packages, the duplicate root extension, and development files are not included.

## About the project

The extension includes no artwork and does not host or generate images. It reads a public creature page to find an image URL, then your browser loads that image from Demiplane. It does not use a login or bypass paid or private content. Demiplane and its image host receive the requests needed to show the artwork; there is no analytics service.

I do not own the images, and I don't know whether distributing this tool is permitted. I haven't sought permission from AoN, Paizo, or Demiplane. This is an unofficial, free project for local installation. I don't plan to publish it in an extension store or make money from it. If a rights holder objects, I'll promptly stop distributing it and remove the public repository.

I understand why people are cautious about extensions that change web pages, so the full code is here for anyone to inspect. Codex helped write it, especially the Safari version, and I reviewed it personally. I only intend to fix bugs, not expand it beyond PF2e. The MIT license covers the extension's code, **not the artwork**.
