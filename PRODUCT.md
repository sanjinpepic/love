# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS (two pages, shared assets, no build step) plus a small
standard-library Python server that serves the pages and stores RSVPs in SQLite.
The RSVP database is the couple's own file; an `/admin` view (password via env)
lists answers and exports CSV.

## Users

- **Guests** of Sanjin Pepic and Alma Berggren Ek: family and friends from
  Sweden, Bosnia and elsewhere, many on phones, opening a link from a message or
  email. Ages span grandparents to children's parents; three languages.
- **The couple**, who read RSVPs and export them for planning.

## Product Purpose

1. **Save the Date** — tell guests early that Sanjin & Alma marry on
   **Friday 27 August 2027** in **Järvsö** (Hälsingland, Sweden), let them put
   it in their calendar in one tap, and point to the wedding page.
2. **Wedding page** — everything a guest needs: the day, getting to Järvsö,
   staying there, and an RSVP that lands in the couple's own SQLite database.

Success: guests save the date, arrive informed, and RSVP without friction in
their own language.

## Positioning

A personal wedding site painted after Klimt's landscapes — Järvsöklack and the
Ljusnan in thousands of small dabs — because the wedding itself is in that
countryside. Not a template wedding site. (A Larsson watercolour version is
kept alongside.)

## Operating Context

Shared as a link (messaging apps, email). Opened mostly on phones, often more
than once (save the date months ahead, wedding page closer to the day).

## Capabilities and Constraints

- Languages: English, Swedish (svenska), Bosnian (bosanski) — toggle on both
  pages; Bosnian needs č ć đ š ž, Swedish å ä ö.
- Date: Friday 27 August 2027. Place: Järvsö, Hälsingland, Sweden.
- **Undecided (must not be invented as fact):** venue name, exact schedule
  times, accommodation arrangements, dress code, RSVP deadline, contact details.
  Placeholder copy is labelled as preliminary and collected in one file.

## Brand Commitments

- **Klimt is the main version** (the couple: "I love that one. focus on
  Klimt"): square paintings of small dabs after Klimt's landscapes
  (*Litzlberg on the Attersee*, *Pear Tree*), labelled like a museum print;
  minimal, no buttons, one quiet calendar link. Lives at `/`.
- The earlier **Carl Larsson** (1853–1919) version is kept at `/larsson/`. Each page should be "a full-on
  Carl-like painting as a webpage, with motion and movement", about Järvsö and
  the wedding — "calm, beautiful, Järvsö late summer, simple but grand", with
  layered pop-up-book depth. Both pages share one design language.
- Names as written: Sanjin Pepic, Alma Berggren Ek.

## Evidence on Hand

- Reference paintings the couple shared (Larsson: *Azalea*, *The Cottage*,
  *Flowers on the Windowsill*, a garden with peonies, poppies and a red chair) —
  used as inspiration only; the couple asked for an original painting of
  Järvsö and their wedding, not a gallery of Larsson's work.
- `assets/paint/` — the site's own watercolour layers and vignettes, generated
  by `tools/paint` (reproducible, seeded).
- No photos of the couple, no story text, no venue details yet — do not
  fabricate them.

## Product Principles

1. The guest's question first: when, where, how to get there, how to answer.
2. Three languages are equal citizens, not an afterthought.
3. The painting leads; the interface is set into its world, never pasted on.
4. Honest placeholders over invented facts.
5. The couple own their data: RSVPs in a file they control.

## Accessibility & Inclusion

Older guests and phone-first reading: generous type, strong contrast on text
over painted surfaces, full keyboard and screen-reader support for the RSVP
form, reduced-motion respected.
