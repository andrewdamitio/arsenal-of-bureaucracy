# Arsenal of Bureaucracy

A grand strategy game of rearmament, exemptions and self-inflicted wounds, 2027–2037.

Play as the United States and try to out-build China. China's output grows every year; yours is held back by one bottleneck after another: permitting, qualification, sole-source suppliers, mineral dependence, the Jones Act and a consolidated defense-industrial base. Clear one and the next one binds. (A European Union campaign is parked for now.)

**Play it:** open `index.html` in a browser, or use the GitHub Pages link once it's set up (see below).

## How it works

- **A five-tier supply chain.** Raw minerals → processed materials and energetics → components → subsystems → end items. That's 65 nodes, each with domestic, allied and Chinese/Russian supply.
- **Sufficiency, not parity.** The Command page measures each of nine end-item lines (shells, interceptors, strike missiles, air-to-air missiles, Army precision fires, aircraft, surface ships, submarines, drones) against what the plan requires: public US targets plus the allies' own, rising as the rival out-builds its 2027 level. Your output and allied output are counted separately (Japan, South Korea and Taiwan against China; European allies against Russia), and buying from allied suppliers cuts their own production. It names what limits each line, in order, and records each bottleneck you clear. The game ends in 2037 and is judged on sufficiency.
- **Threat scenarios.** Before play starts you can pick a mandate, or play the open race to 2037. Each bundles dated targets taken from real public goals: **The Taiwan Window** (interceptors, long-range strike, two submarines and nine surface combatants a year, drones for the "hellscape"), **The Eastern Flank** (100,000 shells a month, GMLRS, a million drones) and **The Rare-Earth Cutoff** (magnets without China, half the Chinese content, output held). At the January 2030 deadline the game tests whether it would have been enough, then you choose to stop or keep building.
- **Portfolio offices.** Six portfolio offices (munitions, missiles, ships, aircraft and drones, electronics, minerals) each run every order in their sector; overload one and all its orders slow down. After a shock (Chinese export bans, a plant disaster) you can ask for an emergency supplemental: extra money, and every waiting new plant funded at once, if it does not stall.
- **Two currencies.** Your budget pays for anything that starts now. Political Capital pays for changing the law and for places in the annual NDAA request; what Congress funds there, it pays for, on top of your budget. The bill passes every 18 December and brings next year's budget.
- **Work the bill.** The FY request page funds your requests in the order you set, until the money Congress has for them that year runs out; a committee champion protects one in markup, and Congress may add a plant of its own for a member's district. The bill passes every 18 December. Markup cuts fall hardest on plants that fix nothing holding output back and lightest on the worst bottlenecks, never absolutely, and Congress's appetite for new starts swings from year to year. About seven weeks before, the committees publish their own priorities (two sectors they back, one they question) and the game pauses so you can finalize your request. Stockpile buys of raw and processed materials go in the same request.
- **Shortages are shared.** When an input runs short, every line that needs it slows, rather than the lowest-priority line stopping outright; your priority order still decides who picks first.
- **The Record.** A 📊 Record tab tallies everything since January 2027: money spent and where it went, estimated industrial jobs, PRC and Russian content, laws, rules and waivers changed, plants built, bottlenecks cleared, decisions made or timed out, and output and stocks line by line.
- **Stocks & needs.** A secondary view asks whether your stocks would last a campaign. Each theater has one: a Taiwan Strait fight of weeks, or an eastern-flank war of months. Coverage asks whether your munitions last the campaign and whether your platforms match the threat.
- **You plan on estimates.** Enemy stocks, burn rates, war length and allied help are ranges. Each game draws hidden true values inside them.
- **The US rulebook.** The ⚖ Rulebook tab lays out permitting, acquisition, domestic sourcing and import controls, and money as they stand in late 2026: which rules are statutes or court rulings (locked), which the executive can switch, which are proposed, and which bills are pending. Each step of each process shows its live odds of stopping a program.
- **History first.** The model starts in January 2025 and replays 2025–26: export bans, the Twelve-Day War and the Iran war. Then it hands you January 2027.
- **Sources.** The 📚 Sources tab has:
  - 149 citations;
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
