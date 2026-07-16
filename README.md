# Password Generator

Generate secure passwords that survive the places passwords actually end up: connection strings, `.env` files, SQL and shells.

**[villcabo.github.io/passwordgen](https://villcabo.github.io/passwordgen)**

## Why another password generator

Most generators hand you `p@ss:w0rd/x` and let you find out the hard way that `@` splits a connection string, `#` starts a comment in `.env`, and `$` gets interpolated by your shell. This one knows where the password is going.

- **Database-safe by default.** The default symbol set is `-_.~`, the RFC 3986 unreserved characters — safe in connection strings, `.env`, YAML, SQL and shells.
- **It warns you.** Type a symbol that breaks a common context and it names the context, before you paste it somewhere it fails.
- **Honest strength.** The readout reports entropy for the character set you actually picked, recomputed on every change — not a fixed label attached to a length.
- **It says when an option cannot hold.** Ask for 64 distinct characters out of a 61-character set and it tells you, instead of silently generating repeats.

## Features

- Cryptographically secure randomness (`crypto.getRandomValues`, with rejection sampling for a uniform distribution)
- Length from 6 to 64, on a single scale whose track doubles as the strength meter
- Batch generation, 1 to 30 passwords at a time
- Three symbol presets: database-safe, app-compatible, full
- Optional rules: start with a letter, avoid look-alikes (`O0Il1`), avoid duplicate characters, avoid keyboard and alphabet sequences
- Digits and symbols are tinted, so you can read a password character by character when typing it by hand
- Settings persist in `localStorage`
- Light and dark themes, keyboard accessible, responsive

Everything runs in your browser. No password ever leaves the page.

## Development

Requires [Bun](https://bun.sh).

```bash
git clone https://github.com/villcabo/passwordgen.git
cd passwordgen
bun install
bun run dev
```

The app runs at [http://localhost:3000/passwordgen](http://localhost:3000/passwordgen). The `/passwordgen` path comes from `basePath` in `next.config.mjs`, which matches the GitHub Pages URL.

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` | Build and export the static site to `out/` |
| `bun run lint` | Run ESLint |
| `bunx tsc --noEmit` | Typecheck — `next build` skips this, so run it separately |

> `next.config.mjs` sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds`. A green build does not mean the types are clean; run `bunx tsc --noEmit` yourself.

## Stack

Next.js 15 (static export) · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Bun

## Deployment

Pushing to `main` builds the static export and publishes it to GitHub Pages. See `.github/workflows/gh-pages.yml`.

## Contributing

Issues and pull requests are welcome.

## License

MIT

## Author

**Bismarck Villca** — [@villcabo](https://github.com/villcabo)

[![GitHub](https://img.shields.io/badge/GitHub-villcabo-181717?logo=github)](https://github.com/villcabo)
