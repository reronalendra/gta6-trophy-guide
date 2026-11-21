# Platinum Roadmap — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/reronalendra/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/reronalendra/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5: the official names, descriptions and grades, own-words guides that cite their sources, a three-step roadmap to the platinum, the one missable trophy flagged, and a checklist saved in the browser with export, import, kind filters and a spoiler setting.

## The list at a glance

55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze. 0 online trophies. About 200 hours to the platinum at 4/10 difficulty (PowerPyx), in one playthrough, with no mission replay and free-roam after the story. Only one trophy is potentially missable: **Positive Mental Attitude**, because of a Chapter 1 meditation at Jason's house — do it before leaving Chapter 1.

## Run it

Serve `app/` with any static server and open `index.html` in desktop Chrome. It works with the network off: every file it loads lives under `app/`, and progress is saved in `localStorage` only.

```sh
node serve.ts
# then open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library in `vendor/makefun-frontend.ts`, which is the kit's copy unchanged.

## Sources

- Official trophy list: Exophase (`exophase.com/game/grand-theft-auto-vi-psn/trophies/`) and PSNProfiles (`psnprofiles.com/trophies/43531-grand-theft-auto-vi`), who agree on all 55 names, descriptions and grades.
- Roadmap, difficulty, time estimate, missable warning and 100%-checklist details: PowerPyx, GTA 6 Trophy Guide & Roadmap (`powerpyx.com/gta-6-grand-theft-auto-vI-trophy-guide-roadmap/`).
- The Chapter 1 meditation detail is also covered by KeenGamer's GTA 6 trophy guide.

All guide text is written in our own words for this entry. Where an official description is deliberately vague, the guide says the exact trigger is still being confirmed instead of inventing a location or a step.

---

<sub>Entered on [make.fun](https://make.fun/?ref={referral_code}&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
