# Diego Ramirez · Urban Planning Portfolio

An interactive portfolio built around a **modern isometric planning studio**. Each glowing object in the room is a project: hover it for a label, click it to open the full project with images. No framework and no build step; the room is drawn in SVG by `assets/room.js`.

| Object in the room | Project |
| --- | --- |
| UC campus model on the center table | 01 Campus Analysis Mapping (opens an interactive 3D figure-ground model) |
| Pathway integration map on the wall | 02 Inclusive vs. Compliant Pathways |
| Monitor with a street render | 03 Hopkins St & Dalton Ave Redevelopment |
| Tiny house model on the shelf | 04 ADA Tiny House · Magdalena Homes |
| Glowing cardboard leaf by the window | 05 BLINK Festival: "Future City" |

Also: project cards with galleries and a lightbox, About with education and experience, a working terminal (`help`, `open 1`, `lamp`), a `Ctrl/⌘ + K` command palette, and light/dark themes. Respects `prefers-reduced-motion`.

## Editing content

- **Text, projects, links:** `assets/data.js`. Each project's `room` value picks its object (or a list of objects); `gallery` lists its images.
- **Images:** `assets/img/` (cropped from the print portfolio).
- **3D campus model:** `assets/campus3d.js` is generated from the AutoCAD black-on-white figure-ground map: each grid cell holds a building id and an illustrative height (scaled by footprint, not surveyed). `assets/campus3d-viewer.js` renders it with three.js (bundled in `assets/vendor/`, MIT license).

## Run locally

Serve the folder (the 3D viewer needs a web server; opening the file directly falls back to the CDN and skips the map texture):

```bash
npx serve .
```

## Deploy (GitHub Pages)

Settings → Pages → Source: *Deploy from a branch*, then pick your branch and the `/ (root)` folder.
