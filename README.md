# Interactive Urban Planning Portfolio

A personal portfolio built around an **interactive isometric planning studio**. Each object in the room is a project: hover it to see a label, click it to open the details. No framework, no build step, no image files. The room is drawn in SVG by `assets/room.js`.

What's in it:

- **The studio** (hero): city model table, zoning map, GIS monitor, community pinboard, blueprint bin, street tree and a transit model shelf. Objects linked to a project glow and pulse, and the chips under the room highlight them too. Click the desk lamp to switch it off and on.
- **Project grid** with filters, tilt cards and detail modals
- **Working terminal**: try `help`, `projects`, `open 1`, `filter gis`, `lamp`, `theme`
- **Command palette** on `Ctrl/⌘ + K`
- Light/dark theme (the window switches between night and day), scroll progress bar, scroll reveals
- Honors `prefers-reduced-motion` and works on phones

## Make it yours

All content lives in **`assets/data.js`**: name, headline words, intro, stats, skills, links and projects.

Each project can choose its object in the room with `room`:

| `room` value | Object |
| --- | --- |
| `model` | city model table (center) |
| `map` | zoning map on the left wall |
| `gis` | GIS monitor on the desk |
| `board` | community pinboard |
| `blueprints` | blueprint bin |
| `tree` | street tree in a planter |
| `transit` | tram model on the shelf |

Projects without a `room` value fill the free objects in order. Objects with no project stay as decoration. A project's `color` also tints its object.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deploy (GitHub Pages)

Settings → Pages → Source: *Deploy from a branch*, then pick your branch and the `/ (root)` folder.
