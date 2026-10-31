# Alma & Sanjin — 27 August 2027, Järvsö

Two versions of the same two pages (Save the Date + wedding page), sharing the
words, the language switch and the RSVP:

| Version | Save the Date | Wedding page | Look |
|---|---|---|---|
| **Klimt** (main) | `/` | `/wedding.html` | a square painting of small dabs, after Klimt's *Litzlberg* and *Pear Tree*, labelled like a museum print |
| Larsson | `/larsson/` | `/larsson/wedding.html` | a watercolour garden by the Ljusnan, paper layers that fold up like a pop-up book |

The Larsson pages:

- **`larsson/index.html`**: the Save the Date. The page is a watercolour of a garden by
  the Ljusnan in Järvsö, built from paper layers that fold up like a pop-up
  book and drift with depth as you move. One quiet *Add to calendar* link
  (an `.ics` file that Apple, Google and Outlook calendars all open).
- **`larsson/wedding.html`**: the wedding page. The same painted opening, then the day,
  getting to Järvsö, where to stay, and an **RSVP form that saves to SQLite**.

English, Swedish and Bosnian throughout (switch at the top right).

## Run it

```bash
ADMIN_PASSWORD=choose-a-password python3 server/server.py
```

- Save the Date: <http://localhost:8000/> (Larsson: <http://localhost:8000/larsson/>)
- Wedding page: <http://localhost:8000/wedding.html> (Larsson: <http://localhost:8000/larsson/wedding.html>)
- RSVPs: <http://localhost:8000/admin>. The username can be anything; the
  password is `ADMIN_PASSWORD`. There's a CSV download there too.

Answers are stored in `data/rsvp.sqlite3`, a file you own (it's gitignored).
If a guest answers twice, the newest answer counts (older rows show
struck through). Python 3.9+ standard library only, no installs.

| Env var | Default | |
|---|---|---|
| `PORT` | `8000` | |
| `RSVP_DB` | `data/rsvp.sqlite3` | put this on a persistent disk when deployed |
| `ADMIN_PASSWORD` | unset | `/admin` stays closed until set |
| `ALLOWED_ORIGIN` | unset | set if the pages are hosted elsewhere (see below) |

### Hosting on Railway

The repo is ready for [Railway](https://railway.com): `railway.json` starts
`server/server.py` and checks `/` for health; the server reads Railway's `PORT`.

1. In Railway: **New Project → Deploy from GitHub repo →** `sanjinpepic/love`
   (branch `main`).
2. On the service: **Add Volume**, mount path `/data`. The RSVP database is
   saved there (`/data/rsvp.sqlite3`), so it survives redeploys. Without a
   volume, answers are lost on every deploy.
3. **Variables:** add `ADMIN_PASSWORD` (anything you like; it guards `/admin`).
4. **Settings → Networking → Generate Domain** (or add your own domain).
5. Open the domain for the Save the Date, `/wedding.html` for the wedding
   page, and `/admin` for the answers and the CSV download.

Every push to `main` redeploys. GitHub Pages can show the pages but cannot
save RSVPs, so Railway is the host.

## Edit the words

All copy for all three languages is in `assets/js/i18n.js`. These are
**placeholders until you decide them**:

- The schedule times (shown as "preliminary" on the page)
- The venue (not named anywhere yet)
- Where to stay (the page says a list comes with the invitation)
- An RSVP deadline and a contact for "tell us directly" (not set)

## The painting

Nothing here is a photo or a copy of a Larsson painting. The scene is painted
in code, in his manner: ink contours, watercolour washes, lots of paper. It
lives in `tools/paint/`:

- `brush.js`: seeded watercolour/ink primitives and SVG filters (washes,
  ink wobble, gold leaf, cut-paper edges)
- `scene.js`: the things in the picture (Järvsöklack, the church, the river,
  the white fence and gate, birches, two red chairs, peonies, poppies,
  globeflowers)
- `compose.js`: the composition for wide and tall screens, split into layers
- `render.js` → `publish.py`: rasterise to WebP in `assets/paint/` and write
  `assets/js/scene-data.js`

```bash
node tools/paint/render.js && python3 tools/paint/publish.py
```

(Needs Playwright with Chromium, and Pillow.)

## The Klimt walk and its assets

The Klimt pages open with a walk through a birch forest (`assets/js/journey.js`).
The trees, the deep wood and the valley are **painted once, offline**, with a
fuller brush than a browser could afford, and saved in `assets/klimt/`. The site
only places and moves those images, so it is light and looks the same everywhere.
To repaint them after changing the painting code:

```bash
PORT=8077 python3 server/server.py &
node tools/klimt/export.js http://localhost:8077
```

If an image ever fails to load, that piece is painted live instead.

Devices set to reduce motion get the still print plus a quiet "Walk through the
forest" link that turns the walk on.

## The Klimt paintings

`assets/js/klimt.js` paints both Klimt squares live in the browser: thousands
of small, seeded dabs, laid down one by one when the page opens, with the
river reflection drifting afterwards. Scenes are plain data in that file
(`jarvso`: Järvsöklack across the river; `orchard`: a late-summer orchard
with a birch), so no images are downloaded for them.

## Tests

```bash
python3 server/test_server.py
```
