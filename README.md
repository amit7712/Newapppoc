# Alphabet Flipper

Alphabet Flipper is being migrated from the legacy single-file HTML app to a shared React architecture.

## Targets
- React + Material UI web app for GitHub Pages
- React Native / Expo mobile app
- Shared alphabet data and Hindi phonics definitions
- Material-style Settings dialog with close button
- 52-card uppercase/lowercase learning flow
- Random or A→Z order
- Repeat Alphabets
- Auto Voice
- Voice speed 0.4×–1.1×, default 0.7×
- Letter, Word and Hindi Phonics sound actions

## Development

Web:
- `npm install`
- `npm run dev`
- `npm run build`

Mobile:
- `cd apps/mobile`
- `npm install`
- `npm start`

The legacy UI remains untouched on `main` while this migration is developed on `feature/react-mui-native`. The stable `main` branch should only be switched after web QA and mobile smoke testing pass.
