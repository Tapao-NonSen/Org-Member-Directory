# Member Directory (ธรรมเนียบสมาชิก)

An org-chart-style member directory for [Flarum](https://flarum.org) 2.x — a curated `/members` page listing members by position, split into current and past members. Built for the NGBC forum (ngbc.kku.ac.th).

## Features

- Public `/members` page: current members grouped by position, past members grouped by cohort (รุ่น)
- Fully curated — admins add each member explicitly; no Flarum-group coupling
- Custom positions with badge colors and ordering (not Flarum groups)
- Multi-term support: a user can hold several records across terms
- Buddhist-era (พ.ศ.) date display on the frontend; Gregorian dates in the DB
- Independent `member-directory.view` permission, grantable to guests
- One-time import-from-group tool for initial setup
- Thai-first localization (English included)

## Requirements

- Flarum `^2.0`
- PHP `^8.3`

## Installation

```sh
composer require tapao/org-member-directory
```

Enable the extension in the admin panel, then create positions and add members under **Member Directory** settings.

## Development

```sh
cd js
npm install
npm run build
```

## License

[MIT](LICENSE)
