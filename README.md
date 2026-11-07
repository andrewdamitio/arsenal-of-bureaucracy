# Arsenal of Bureaucracy

A grand strategy game of rearmament, exemptions and self-inflicted wounds, 2027–2037.

Play as the United States and try to out-build China. China's output grows every year; yours is held back by one bottleneck after another: permitting, qualification, sole-source suppliers, mineral dependence, the Jones Act and a consolidated defense-industrial base. Clear one and the next one binds. (A European Union campaign is parked for now.)

**Play it:** open `index.html` in a browser, or use the GitHub Pages link once it's set up (see below).

## How it works

- **A five-tier supply chain.** Raw minerals → processed materials and energetics → components → subsystems → end items. That's 65 nodes, each with domestic, allied and Chinese/Russian supply.
- **The race with China.** The Command page puts your output next to China's on each of nine end-item lines (shells, interceptors, strike missiles, air-to-air missiles, Army precision fires, aircraft, surface ships, submarines, drones), names what limits each line, and records each bottleneck you clear. The game ends in 2037 and is judged on the race.
- **Threat scenarios.** Before play starts you can pick a mandate, or play the open race to 2037. Each bundles three dated targets taken from real public goals: **The Taiwan Window** (interceptors, long-range strike, two submarines and nine surface combatants a year, drones for the "hellscape"), **The Eastern Flank** (100,000 shells a month, GMLRS, a million drones) and **The Rare-Earth Cutoff** (magnets without China, half the Chinese content, output held). At the January 2030 deadline the game tests whether it would have been enough, then you choose to stop or keep building.
- **The Record.** A 📊 Record tab tallies everything since January 2027: money spent and where it went, estimated industrial jobs, PRC and Russian content, laws, rules and waivers changed, plants built, bottlenecks cleared, decisions made or timed out, and output and stocks line by line.
- **Stocks & needs.** A secondary view asks whether your stocks would last a campaign. Each theater has one: a Taiwan Strait fight of weeks, or an eastern-flank war of months. Coverage asks whether your munitions last the campaign and whether your platforms match the threat.
- **You plan on estimates.** Enemy stocks, burn rates, war length and allied help are ranges. Each game draws hidden true values inside them.
- **The US rulebook.** The ⚖ Rulebook tab lays out permitting, acquisition, domestic sourcing and import controls, and money as they stand in late 2026: which rules are statutes or court rulings (locked), which the executive can switch, which are proposed, and which bills are pending. Each step of each process shows its live odds of stopping a program.
- **History first.** The model starts in January 2025 and replays 2025–26: export bans, the Twelve-Day War and the Iran war. Then it hands you January 2027.
- **Sources.** The 📚 Sources tab has:
  - 138 citations;
  - a model check comparing the 2025–26 replay with observed data;
  - real-project timelines;
  - every assumption the game makes where sources run out.

## Controls

Space pauses. Keys 1–4 set the speed. Tab cycles through the views. Click any supply node or end item to open its page.

## Technical

One self-contained HTML file with no dependencies, no build step and no server. Plain HTML, CSS and JavaScript.

## Publishing on GitHub Pages

1. Upload `index.html` and `README.md` to the repository.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Pick `main` and `/ (root)`, then click **Save**.
5. After a minute or two, the game is live at `https://<your-username>.github.io/<repo-name>/`.

## Disclaimer

This is a game. Figures marked as estimates or assumptions in the Sources tab are not data.
