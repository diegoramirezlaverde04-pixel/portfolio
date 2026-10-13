# Interactive Portfolio

A personal portfolio site with no framework and no build step. Everything on it is interactive:

- **Particle background** that reacts to your cursor
- **Hero name** whose letters lift as you hover over them, plus a typewriter tagline
- **Filterable project grid** with 3D tilt cards, a cursor spotlight and detail modals
- **Working terminal**: try `help`, `projects`, `open 1`, `filter web`, `theme`, `contact` (Tab completes, ↑/↓ steps through history)
- **Command palette** on `Ctrl/⌘ + K` to jump to any project or section
- Light/dark theme, custom cursor, magnetic buttons and scroll reveals
- Honors `prefers-reduced-motion` and works on phones

## Make it yours

All the content lives in **`assets/data.js`**: your name, taglines, about text, skills, links and projects. Add an entry to `projects` and it shows up as a card, in the terminal and in the command palette.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deploy (GitHub Pages)

Settings → Pages → Source: *Deploy from a branch* → pick `main` and the `/ (root)` folder.
