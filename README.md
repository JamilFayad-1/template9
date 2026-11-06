# SOLË

SOLË is a concept website for an independent creative production company. It is a static, multi-page portfolio built with HTML, CSS, and vanilla JavaScript.

## Stack

- HTML, CSS, and browser JavaScript for the site
- Python 3 for generating the Work, Studio, and Contact pages from the shared homepage shell
- Lenis for smooth scrolling
- Node.js and npm for build scripts and dependency management

Python runs only during the build. The published website does not need a Python or JavaScript application server.

## Setup and build

Install dependencies:

```sh
npm install
```

Build the site:

```sh
npm run build
```

The build copies the editable source in `src/` into a clean `dist/`, generates the Work, Studio, and Contact pages, and adds the local Lenis files. `dist/` is generated output. Edit files in `src/`, not in `dist/`.

Preview the generated site:

```sh
npm run dev
```

Then open <http://localhost:4173>.

Check JavaScript syntax:

```sh
npm run check
```

## Netlify

For a manual deploy, run `npm run build` and upload the `dist/` directory. For a Git-connected Netlify site, use:

- Build command: `npm run build`
- Publish directory: `dist`

## Project files

- `src/index.html`: shared homepage shell and homepage content
- `src/style.css`, `src/pages.css`, and `src/effects.css`: site styles and motion
- `src/app.js` and `src/disclosures.js`: interaction code
- `src/assets/`: images, video, fonts, and grain texture
- `scripts/build-pages.py`: copies source into `dist/` and generates the additional pages
- `scripts/templates/brief-form.html`: contact form template
- `scripts/build-vendor.mjs`: copies Lenis and its license into `dist/vendor/`

The contact form creates a project brief in the browser. It does not send submissions to email or a backend.

## Concept credits

SOLË, its project names, and its clients are fictional. Reference imagery and supplied film remain the property of their respective creators; confirm usage rights before using them commercially.
