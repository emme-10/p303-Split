# SplitLog

A mobile-first workout planning and logging app for hybrid athletes —
built for people training both strength and endurance who need to plan
a weekly split, follow a template mid-workout, and track progress over
time.

This is a Protogen case study project (**P303: Mobile Experience**).
See [`BRIEF.md`](./BRIEF.md) for the full project brief, and
[`/context`](./context) for design and planning notes.

## What this is

- A responsive, mobile-first web app (React Native + Expo, exported via
  react-native-web) — not a native App Store / Play Store build
- Built around a fictional persona and fictional/seeded data — no real
  user accounts, no real client or company data
- A design and product-thinking exercise first, an engineering exercise
  second

## Stack

- React Native + Expo (TypeScript)
- Expo Router for navigation
- react-native-web for browser/Vercel deployment
- Local, seeded JSON data (no backend, no auth)

## Project structure

```
splitlog/
├── BRIEF.md              # Project brief - what this is and why
├── context/               # Planning + design docs (non-AI-tool-specific)
│   ├── design-tokens.md   # Color, type, spacing decisions
│   ├── data-model.md      # Shape of the seeded dataset
│   └── decisions.md       # Running log of key product/design calls
├── .claude/                # AI tool scaffolding (context for Claude Code)
│   └── context.md
├── src/
│   ├── screens/            # Weekly Split, Template Builder, Active Workout,
│   │                        # Calendar, Progress
│   ├── components/         # Shared UI components
│   ├── navigation/          # Expo Router config
│   ├── data/                # Seeded JSON (exercises, templates, split, logs)
│   ├── theme/               # Design tokens as code
│   ├── hooks/
│   └── utils/
└── assets/
```

## Running locally

```bash
npm install
npx expo start
```

To run the web build (what gets deployed to Vercel):

```bash
npx expo start --web
```

## Status

🚧 In progress — see [`context/decisions.md`](./context/decisions.md) for
the current build log.

## License

MIT — see [`LICENSE`](./LICENSE).
