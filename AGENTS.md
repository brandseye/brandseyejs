# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development commands

### Environment
- Node version is pinned in `.nvmrc`:
  - `nvm use`

### Install dependencies
- Canonical install command (matches lockfile):
  - `yarn install`

### Build
- Build distributable bundles into `dist/`:
  - `yarn build`
- What this runs:
  - `webpack --mode development --progress`

### Local development
- Start webpack dev server (configured on port `8000`, opens `dist/examples/fantastic.html`):
  - `yarn dev`

### Tests and linting
- There is currently no working automated test or lint command configured:
  - `yarn test` is a placeholder that exits with an error by design.
  - No ESLint/Prettier config is present in this repository.
- As a result, there is no built-in single-test command in the current codebase.

## Architecture overview

### What this repository is
- `brandseyejs` is a charting library built on top of D3.
- Build output is distributed as UMD bundles in `dist/` (`b3js.js` and `b3js.min.js`).
- D3 is treated as an external dependency in `webpack.config.js`, so consumers are expected to provide `d3`.

### Public API surface
- `src/index.js` exports two chart APIs:
  1. **Class-based charts** (`ColumnChart`, `BarChart`, `LineChart`, `PieChart`) implemented in `src/*.js`.
  2. **Composable “FantasticChart” API** from `src/chart/*` (`chart()`, `histogram()`, `barChart()`, `line()`, `pie()`, `points()`, scale helpers).

### Class-based chart path (`src/*.js`)
- `src/Chart.js` is the shared base class (dispatch events, legend rendering, common defaults).
- Each concrete chart class (for example `src/ColumnChart.js`, `src/BarChart.js`) follows a fluent configuration style:
  - configure getters/formatters/appearance (`x`, `y`, `width`, `height`, `showLegend`, etc.),
  - call `render()` to mutate/create SVG under the configured DOM element.
- These classes are largely self-contained per chart type and duplicate some behaviour across files.

### FantasticChart path (`src/chart/*`)
- `src/chart/FantasticChart.js` is the orchestration layer:
  - stores shared chart-level configuration,
  - manages one or more geometries,
  - computes layout (margins, legend, axes, facets),
  - delegates drawing to geometry instances in priority order.
- `src/chart/Geometry.js` is the base abstraction for geometries:
  - normalises raw data via `prepareData()` into internal fields (`_x`, `_y`, `_colour`, `_size`, etc.),
  - provides shared config plumbing (scales, formatters, colours, labels, faceting, animation flags).
- Concrete geometries implement rendering:
  - `src/chart/Histogram.js` / `src/chart/BarChart.js` (vertical/horizontal histogram-style bars),
  - `src/chart/Line.js`,
  - `src/chart/Pie.js`,
  - `src/chart/Points.js`.
- Scale/bucketing behaviour is central to geometry output:
  - `src/chart/Scales.js` chooses discrete/continuous/time scale behaviour,
  - `src/chart/Bucket.js` consolidates values into buckets (including Freedman–Diaconis logic via `src/Statistics.js`).
- Axes and legend are shared utilities:
  - `src/chart/Axes.js` for axis/grid rendering and tick collision handling,
  - `src/Legend.js` for colour-domain bucketing and legend rendering.

### Data flow mental model (FantasticChart)
1. Configure chart (`chart()`) and add one or more geometries.
2. On `render()`, chart-level settings are pushed into each geometry (`setupGeom`).
3. Each geometry transforms and groups source data (`prepareData`) using configured scales/getters.
4. Chart renders axes/legend/facets, then each geometry renders into its facet group.
5. Interaction events from geometries are re-dispatched through chart-level dispatch.

## Important implementation notes
- The code expects D3 to be available at runtime and uses `d3.*` directly in modules.
- The source is plain ES modules transpiled by Babel+Webpack; no TypeScript.
- Many visual behaviours (label trimming, tick overlap handling, legend grouping) are implemented in shared helpers rather than in app-level code, so prefer reusing those modules before adding new ad-hoc rendering logic.
