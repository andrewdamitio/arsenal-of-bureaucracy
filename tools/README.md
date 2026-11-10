# Test tools

Scripts that drive the game in a real browser. They need Node, Google Chrome and `playwright-core`:

    cd tools
    npm install --no-save playwright-core

Set `CHROME` to the browser's path if it is not in the default Windows location.

| Script | What it does |
|---|---|
| `node smoke.js` | Opens every view, item page and dialog in each scenario, plays a year, and fails on any page error. Run it after every change. |
| `node bots.js <none\|builder\|reformer> <seed> [scenario] [years]` | The standing test. An automated player runs the game on a seeded random stream and reports the share of the requirement met at the deadline and at the end, plants finished, build times and targets met. `none` takes no action, `builder` plays competently under today's rules, `reformer` also passes the reform agenda. Results land in `out/`. |
| `node regress.js <html or -> [seed] [weeks] [scenario] [v] [tag]` | Plays a fixed script on a seeded random stream and prints a digest of the end state. Two builds with the same digest behave identically. |
| `node cmp.js <tagA> <tagB> [tolerance]` | Compares two `regress.js` outputs number by number. |

The model's design target, checked with `bots.js`: under today's rules a competent player misses the real scenario targets; a player who passes the major reforms can reach them.
