---
name: Alma & Sanjin
description: Two paintings of Järvsö in late summer, one set of words. Klimt's landscapes at the root, a Carl Larsson pop-up watercolour at /larsson/.
colors:
  # Klimt variant (main, `/`): assets/css/klimt.css
  print-ground: "#f6f7f3"
  painting-ground: "#e8ece4"
  slate: "#44524f"
  slate-soft: "#5f6c69"
  slate-rule: "color-mix(in srgb, #44524f 22%, transparent)"
  violet: "#4f569c"
  lime-select: "#c9dc5a"
  brick-error: "#9a3a2a"
  brick-invalid: "#a8402e"
  # Larsson variant (`/larsson/`): assets/css/site.css
  falu: "#b23b2c"
  falu-shade: "#8b2d22"
  leaf: "#6f8f45"
  leaf-deep: "#4f6b37"
  gold: "#c9a043"
  gold-deep: "#9a7426"
  peony: "#e58ea4"
  path: "#f0d9cc"
  paper: "#f2efe5"
  paper-deep: "#efe6d3"
  card-paper: "#fbf8f1"
  stage-mist: "#e9ece4"
  ink: "#2e2420"
  ink-soft: "#5b4a40"
typography:
  # Klimt
  k-names:
    fontFamily: "Tenor Sans, Gill Sans, Segoe UI, sans-serif"
    fontSize: "clamp(1.7rem, 1rem + 2.3vw, 2.9rem)"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "0.3em"
  k-heading:
    fontFamily: "Tenor Sans, Gill Sans, Segoe UI, sans-serif"
    fontSize: "clamp(1.15rem, 1rem + 0.6vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.3em"
  k-year:
    fontFamily: "Tenor Sans, Gill Sans, Segoe UI, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.32em"
  k-place:
    fontFamily: "Tenor Sans, Gill Sans, Segoe UI, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.24em"
  k-link:
    fontFamily: "Tenor Sans, Gill Sans, Segoe UI, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.22em"
  k-label:
    fontFamily: "Tenor Sans, Gill Sans, Segoe UI, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.18em"
  k-subtitle:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "clamp(1.15rem, 1rem + 0.5vw, 1.45rem)"
    fontWeight: 400
  k-body:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "clamp(1.05rem, 0.98rem + 0.3vw, 1.2rem)"
    fontWeight: 400
    lineHeight: 1.6
  k-hint:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.3
  # Larsson
  display:
    fontFamily: "Della Respira, Alegreya, Georgia, serif"
    fontSize: "clamp(3.2rem, 1.6rem + 5.4vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.01em"
  numeral:
    fontFamily: "Della Respira, Alegreya, Georgia, serif"
    fontSize: "clamp(1.9rem, 1.3rem + 2vw, 3rem)"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "lnum"
  headline:
    fontFamily: "Alegreya, Georgia, Times New Roman, serif"
    fontSize: "clamp(2.1rem, 1.5rem + 2.2vw, 3.4rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.012em"
  title:
    fontFamily: "Alegreya, Georgia, Times New Roman, serif"
    fontSize: "1.3rem"
    fontWeight: 500
  lede:
    fontFamily: "Alegreya, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.25rem, 1.05rem + 0.7vw, 1.65rem)"
    fontWeight: 400
  body:
    fontFamily: "Alegreya, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.0625rem, 0.98rem + 0.35vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "onum, pnum"
  label:
    fontFamily: "Alegreya, Georgia, Times New Roman, serif"
    fontSize: "1.02rem"
    fontWeight: 500
  hint:
    fontFamily: "Alegreya, Georgia, Times New Roman, serif"
    fontSize: "0.92rem"
    fontWeight: 400
rounded:
  square: "0"
  field: "3px 3px 0 0"
  tab: "3px"
  round: "50%"
spacing:
  # Klimt
  k-gutter: "clamp(1.25rem, 5vw, 4rem)"
  k-section: "clamp(4rem, 11vh, 7.5rem)"
  k-column: "36rem"
  k-print-gap: "clamp(2rem, 6vw, 6rem)"
  k-painting: "min(76svh, 54vw)"
  k-field-gap: "1.5rem"
  # Larsson
  gutter: "clamp(1rem, 4vw, 3.5rem)"
  measure: "34rem"
  room: "clamp(4.5rem, 11vh, 8rem)"
  split-gap: "clamp(2rem, 6vw, 6rem)"
  field-gap: "1.35rem"
  card-pad: "clamp(1.75rem, 4vw, 3rem)"
components:
  # Klimt
  k-link:
    textColor: "{colors.slate}"
    typography: "{typography.k-link}"
    height: "44px"
  k-link-hover:
    textColor: "{colors.violet}"
  k-send:
    textColor: "{colors.slate}"
    typography: "{typography.k-link}"
    padding: "0.9rem 0.2rem"
    height: "44px"
  k-send-hover:
    textColor: "{colors.violet}"
  k-input:
    textColor: "{colors.slate}"
    rounded: "{rounded.square}"
    padding: "0.6rem 0 0.5rem"
    height: "2.9rem"
  k-radio:
    textColor: "{colors.slate}"
    typography: "{typography.k-subtitle}"
    height: "44px"
  k-radio-selected:
    backgroundColor: "{colors.violet}"
    rounded: "{rounded.round}"
    size: "0.8rem"
  k-lang:
    textColor: "{colors.slate-soft}"
    padding: "0 0.45rem"
    height: "44px"
  k-lang-active:
    textColor: "{colors.slate}"
  k-painting:
    backgroundColor: "{colors.painting-ground}"
    rounded: "{rounded.square}"
    size: "{spacing.k-painting}"
  # Larsson
  quiet-link:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "44px"
  quiet-link-hover:
    textColor: "{colors.falu}"
  send-link:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "0.6rem 0"
    height: "44px"
  send-link-hover:
    textColor: "{colors.falu}"
  choice-radio:
    textColor: "{colors.ink}"
    padding: "0.35rem 0"
    height: "3rem"
  choice-radio-selected:
    backgroundColor: "{colors.leaf-deep}"
    rounded: "{rounded.round}"
    size: "0.85rem"
  input-field:
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.7rem 0.75rem 0.6rem"
    height: "3rem"
  card-rsvp:
    backgroundColor: "{colors.card-paper}"
    rounded: "{rounded.square}"
    padding: "{spacing.card-pad}"
  lang-toggle:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.tab}"
    height: "44px"
  lang-toggle-active:
    textColor: "{colors.ink}"
---

# Design System: Alma & Sanjin

## Overview

**Creative North Star: "Two Paintings of Järvsö"**

The site ships the same two pages (Save the Date, wedding page) twice, in two painted worlds that share one set of words, one language switch and one RSVP. Each world is a painting of the Järvsö valley in late summer, and in each the painting leads the first viewport while the interface sits quietly beside it or inside it. Neither world has a button: every action is an underlined text link. Secondary voice in both is Alegreya italic. Motion is slow, eases out, and has a still state under reduced motion.

**Klimt, the main version (`index.html`, `wedding.html`; North Star "The Museum Print").** Klimt's landscapes, not his gold. A square painting made of thousands of small dabs (after *Litzlberg on the Attersee* and *Pear Tree*) is drawn live in canvas by `assets/js/klimt.js`, laid down dab by dab, and hung on cool near-white print paper. Beside it, a label set like a museum print: spaced Tenor Sans capitals for names, headings and links, one Alegreya italic line, the date. Grey-green slate lettering; one violet accent taken from the shadow dabs; all other colour stays inside the paintings. Flat, square, hairline-ruled. Refuses the gold-and-ornament Klimt cliché.

**Larsson, the kept version (`larsson/index.html`, `larsson/wedding.html`; North Star "The Pop-up Larsson").** A full-bleed watercolour of Järvsö in Carl Larsson's manner, cut into paper layers (sky, hills, river, garden, flower bed, swaying flowers) that fold up from the page back to front and then drift with depth. Words are lettered into the unpainted sky. Below the stage the wedding page reads like a book of Larsson plates on textured watercolour paper. Falu red letters numerals and underlines actions; gold survives only as thin threads. Refuses the framed-gallery page, the ivory card with a script font, and the photo hero with centred names.

**Key Characteristics:**
- One painting leads every first viewport; the interface is set beside it (Klimt) or into its sky (Larsson), never on a panel.
- No buttons anywhere: actions are underlined text links, including the RSVP send.
- Alegreya italic is the shared aside voice; each world adds one lettering face (Tenor Sans capitals for Klimt, Della Respira for Larsson).
- Colour lives in the painting; the UI keeps to ink and one accent per world (violet for Klimt, falu for Larsson).
- Motion is the painting making itself (dabs laid down; paper folding up), then a slow drift. Reduced motion shows the finished, still painting.
- Content sections are never boxed into grids.

## Colors

Klimt: a cool print-paper ground, slate lettering and one violet. Larsson: warm watercolour paper, ink-brown text, falu red, leaf green and gold threads.

### Primary
- **Violet** (Klimt): the shadow dab in Klimt's greens, used for schedule times, the terminus station, link and send hover, the chosen radio, the focus underline and the input caret.
- **Falu Red** (Larsson): the lettering red, shared exactly with the painting's falu houses. Date numerals, the signature, schedule times, the terminus, the underline of every action link (at 70% on the Save the Date links, full on the send link), link hover colour, the input caret, the invalid-field underline.

### Secondary
- **Falu Shade** (Larsson): error text and the terminus dot's rim.
- **Deep Leaf** (Larsson): the chosen radio dot and the focus underline on fields. Green means "chosen".
- **Birch Leaf** (Larsson): scrollbar thumb only.

### Tertiary
- **Gold** and **Gold, Deep** (Larsson): thin threads only. The 2px active-language underline (gold), the 1px inset rule on the RSVP card (gold, 80%), the terminus halo ring (gold), the 1px section-nav underline (gold-deep) and the date's separator dots (gold-deep).
- **Garden Path** (Larsson): the RSVP section's ground, the one coloured band on the wedding page.
- **Peony Pink** (Larsson): text selection.
- **Lime Select** (Klimt): text selection, a light dab from the meadow.
- **Brick Error** / **Brick Invalid** (Klimt): error text (italic) and the invalid-field underline; the painting's red farmhouse, darkened.

### Neutral
- **Print Ground** (Klimt): the page; flat, untextured.
- **Painting Ground** (Klimt): the square's fill before the first dab lands.
- **Slate** (Klimt): all lettering and text, focus outlines, route line and stations.
- **Slate, Soft** (Klimt): the italic subtitle, notes, schedule descriptions, hints, credits, inactive languages, field underlines.
- **Slate Rule** (Klimt): schedule hairlines.
- **Watercolour Paper** (Larsson): page ground, tiled with the paper-tooth texture (`assets/img/paper.svg`, 300px).
- **Paper, Deep** (Larsson): scrollbar track.
- **Card Paper** (Larsson): the RSVP card, also textured; the inner ring of the chosen radio.
- **Stage Mist** (Larsson): the stage before the painting loads.
- **Ink** (Larsson): primary text, focus rings, hairlines, the bird.
- **Ink, Soft** (Larsson): secondary text, italic asides, field underlines.

The painting palettes are not UI tokens. Klimt's dab palettes (yellow-greens, greens, violet-blue shadow, white church, red farms) live per scene in `assets/js/klimt.js` (`SCENES.jarvso`, `SCENES.orchard`); Larsson's live in `tools/paint/scene.js`. Larsson UI tokens that share a name with a paint colour (falu, leaf, gold, path, peony) use the same value.

### Named Rules
**The Colour Stays In The Painting Rule.** Each world's UI uses its ink and a single accent; the painting palettes never become fills, panels or backgrounds outside the canvas or the painted layers.

**The One Violet Rule (Klimt).** Violet marks only times, the destination, hover, the chosen answer and focus. Nothing is filled with violet larger than a radio dot.

**The Falu Underline Rule (Larsson).** Falu red letters the numbers and underlines the actions; it is never a fill. A link is ink text over a falu underline that turns falu on hover.

**The Gold Thread Rule (Larsson).** Gold appears only as lines of 1 to 2px and as the date's separator dots. Never a fill, a texture, lettering, or a gradient.

## Typography

**Klimt Lettering Font:** Tenor Sans (with Gill Sans, Segoe UI, sans-serif), always uppercase and tracked
**Larsson Lettering Font:** Della Respira (with Alegreya, Georgia, serif)
**Shared Text Font:** Alegreya (with Georgia, Times New Roman, serif)

**Character:** Klimt's label is a museum caption: open, evenly spaced capitals in one weight with an italic serif line beneath. Larsson's is hand-lettered: Della Respira for names and numbers, wide and calm, with Alegreya as a warm book serif.

### Hierarchy (Klimt)
- **Names** (Tenor Sans 400, clamp 1.7rem to 2.9rem, 1.25, 0.3em): uppercase; "Alma" and "& Sanjin" stack as two lines when the label sits beside the painting. A negative right margin equal to the tracking keeps the centred line optically centred.
- **Heading** (Tenor Sans 400, clamp 1.15rem to 1.5rem, 1.3, 0.3em): uppercase, centred section titles (left-aligned beside a painting).
- **Year** (Tenor Sans 400, 1.15rem, 0.32em): "27 · 08 · 2027".
- **Place** (Tenor Sans 400, 0.9rem, 0.24em): "Järvsö · Hälsingland", uppercase, a step above the year.
- **Link** (Tenor Sans 400, 0.8rem, 0.22em): uppercase action links; the top bar runs at 0.78rem, 0.24em; the send link at 0.85rem, 0.26em.
- **Label** (Tenor Sans 400, 0.8rem, 0.18em): form labels and legends, uppercase. Schedule item names 0.92rem at 0.14em; travel headings 0.85rem at 0.2em; route stations 0.72rem.
- **Time** (Tenor Sans 1rem, 0.14em, tabular figures): schedule times in violet.
- **Subtitle** (Alegreya italic 400, clamp 1.15rem to 1.45rem): "are getting married", in slate soft.
- **Body** (Alegreya 400, clamp 1.05rem to 1.2rem, 1.6): running text in a 36rem column.
- **Hint** (Alegreya italic 400, 0.95rem, 1.3): optional-field hints, errors; radio labels run Alegreya italic at 1.08rem; credits 0.92rem.

### Hierarchy (Larsson)
- **Display** (Della Respira 400, clamp 3.2rem to 6rem, 0.98): the couple's names in the sky, one line on wide screens. The ampersand is ink at 0.78em.
- **Numeral** (Della Respira 400, clamp 1.9rem to 3rem, 1, lining figures): the date as 27 · 08 · 2027 in falu with gold-deep dots; schedule times at 1.6rem with tabular figures; the terminus at 1.35rem; the signature at clamp 1.9rem to 2.5rem; the thank-you word at clamp 3.4rem to 6rem.
- **Headline** (Alegreya 500, clamp 2.1rem to 3.4rem, 1.05): section titles. The RSVP title runs larger (clamp 2.4rem to 4rem, 1).
- **Title** (Alegreya 500, 1.3rem): "By train / by car / by air"; schedule item names at 1.15rem.
- **Lede** (Alegreya italic 400, clamp 1.25rem to 1.65rem): "are getting married", in ink soft.
- **Body** (Alegreya 400, clamp 1.0625rem to 1.25rem, 1.55, old-style figures): paragraphs at a 34rem measure; narrow sections at 38rem. Letter paragraphs step up to clamp 1.15rem to 1.35rem at 1.6.
- **Label** (Alegreya 500, 1.02rem): form labels and legends; the send link at 1.08rem; Save the Date links at 1.05rem, 400.
- **Hint** (Alegreya italic 400, 0.92rem): optional hints, durations (0.88rem), errors (0.95rem), credits (0.88rem); radio labels in Alegreya italic 400.

### Named Rules
**The Italic Aside Rule.** In both worlds the secondary voice is Alegreya italic in the soft ink (slate soft or ink soft): subtitles, notes, descriptions, hints, credits, radio answers.

**The Spaced Capitals Rule (Klimt).** Everything that names or labels (names, headings, place, year, nav, links, form labels) is Tenor Sans uppercase, tracked between 0.12em and 0.32em, in a single weight. Everything that is read is Alegreya. Tenor Sans is never set in lowercase or bold.

**The Lettered Numbers Rule (Larsson).** Dates, times and the station terminus are Della Respira with lining figures; running text keeps Alegreya's old-style figures.

## Layout

**Klimt.** The first viewport is a print: a square painting (min(76svh, 54vw)) in the left column and its label centred in the right (max 30rem), gap clamp 2rem to 6rem, filling the viewport below a thin top bar (sections left, languages right; the Save the Date has languages only). Below 820px wide, or on any portrait screen, the square goes on top (min(100%, 62svh)), centred, with the label beneath. The wedding page then runs as a single centred column (36rem) of sections padded clamp 4rem to 11vh to 7.5rem, with one exception: "Where to stay" pairs a second painting (the orchard, max 26rem) with its text in two columns (max 64rem), stacking below 820px. The railway is a six-stop horizontal route line inside the column, vertical below 820px. The section nav hides below 760px and form rows stack.

**Larsson.** The first viewport is a stage: 100svh (min 34rem), the painting anchored to the bottom and covering the frame at a 1.6 ratio, swapped for a 0.5-ratio tall composition below an aspect ratio of 4/5. Words sit top-left in the open sky (max 44rem) over a blurred radial wash of unpainted paper on desktop, centred at the top on tall screens. Nav and languages sit together at the top right. Below the stage, rooms pad clamp 4.5rem to 11vh to 8rem; welcome and stay are a narrow 38rem column, the day is a two-column split of the chairs vignette beside the schedule (max 74rem), travel adds a full-width railway line and three columns of ways, RSVP is a 4:7 split of intro and card (max 72rem). Below 960px all splits stack; below 760px the nav hides, form rows stack and the railway turns vertical. Short landscape screens shrink the names to keep them out of the hills.

## Elevation & Depth

**Klimt is flat.** No shadows, no textures. Depth lives only inside the painting: its canvas layers (hill, village, water; canopy, trunks) shift a few pixels against each other with the pointer. The only shadow-like value is the 1px violet focus underline.

**Larsson's depth comes from the painting**, a pop-up book in CSS 3D (perspective 1800px) with per-layer parallax. The UI is nearly flat; one warm paper shadow lifts the RSVP card off the garden path.

### Shadow Vocabulary
- **Card sheet** (Larsson; `box-shadow: 0 1px 2px rgb(60 30 20 / .12), 0 24px 40px -26px rgb(60 30 20 / .5)`): the RSVP card lying on the path.
- **Terminus halo** (Larsson; `box-shadow: 0 0 0 4px var(--paper), 0 0 0 5.5px var(--gold)`): a paper gap and a gold ring around the destination dot.
- **Focus underline** (Larsson `0 2px 0 var(--leaf-deep)`; Klimt `0 1px 0 var(--violet)`): doubles the bottom rule of a focused field.

### Named Rules
**The Flat Print Rule (Klimt).** Nothing outside the canvas casts a shadow or carries a texture. Separation is whitespace and 1px slate lines.

**The Paper Shadow Rule (Larsson).** The one shadow is warm brown (rgb 60 30 20), soft and negatively spread so it sits under the sheet. No grey, no hard offsets, no glow.

## Shapes

**Klimt** is square throughout: the paintings, fields (bare underline, radius 0) and the page. Circles are reserved for radio dots and route stations. Lines are 1px slate: the route, field underlines (slate soft), schedule rules (slate at 22%).

**Larsson** keeps paper geometry: fields are open at the bottom (3px top corners, square bottom) with a translucent white wash and only an ink-soft underline; the RSVP card is square with a 1px gold rule inset 10px; language buttons take a 3px radius for their focus ring. Circles are reserved for radio dots and railway stations. Hairlines are ink at 18% (schedule) or double ink rails at 60% (railway). The bird is the only drawn line art, a 1.4-stroke round-cap SVG.

## Components

### Text Links (shared pattern; no buttons)
Every action, including "Add to calendar", "The wedding page", section nav and the RSVP send, is a text link or a link-styled button with a 44px target.
- **Klimt:** Tenor Sans capitals in slate with a 1px underline at 45% strength and a generous 0.35em offset (0.6em on send); hover turns text and underline violet (0.3s).
- **Larsson:** Alegreya in ink with a 1.5px falu underline (70% on Save the Date links, full on send) at 0.3em offset; hover turns the text falu. Running-text links use a 1px half-strength underline at 0.22em that goes full on hover.
- **Focus:** Klimt 1.5px slate outline at 4px offset; Larsson 2px ink outline at 3px offset.
- **Disabled send:** 0.55 (Klimt) or 0.6 (Larsson) opacity with a progress cursor.

### Radios (yes/no)
Plain italic answers, not chips.
- **Style:** Alegreya italic beside a small hollow circle (Klimt 0.8rem, 1px slate; Larsson 0.85rem, 1.5px current colour), gap 0.4rem 1.8rem between answers.
- **Selected:** the circle fills (violet in Klimt, deep leaf in Larsson) with a 2 to 2.5px inner ring of the ground colour; the text does not change colour.
- **Focus:** the variant's focus outline around the answer.

### Inputs / Fields
- **Klimt:** transparent, square, a 1px slate-soft underline, min height 2.9rem, violet caret; selects carry a drawn slate chevron. Focus turns the underline violet and doubles it (1px violet shadow). Invalid fields take a brick underline; errors are italic brick at 0.95rem.
- **Larsson:** translucent white wash (55%), a 1.5px ink-soft underline, 3px top corners, min height 3rem, falu caret, drawn ink-soft chevron on selects. Hover darkens the underline to ink; focus turns it deep leaf, doubles it with a 2px leaf shadow, and the field goes solid white. Invalid fields take a falu underline; errors are italic falu shade.

### Cards / Containers
- **Klimt:** none. The RSVP form sits directly in the column on the print ground.
- **Larsson:** one card only, for the RSVP form. Card paper with the paper-tooth texture, square corners, the card-sheet shadow, a 1px gold rule at 80% inset 10px, padding clamp 1.75rem to 3rem, laid on the garden-path band.

### Navigation
- **Klimt:** a top bar in Tenor Sans capitals (0.78rem, 0.24em): section links left, EN/SV/BS right. Inactive languages are slate soft; the active one is slate with a 1px underline at 0.5em offset. Nav hides below 760px.
- **Larsson:** Alegreya links at body size in ink, no underline; a 1px gold-deep rule draws in from the left on hover and focus (0.5s ease-out). Language buttons in ink soft (full names on the Save the Date, EN/SV/BS on the wedding page); the active one turns ink with a 2px gold underline. Nav hides below 760px.

### The Dab Painting (Klimt signature)
A square canvas painting generated by `assets/js/klimt.js` from a seeded scene (`jarvso`: Järvsöklack across the Ljusnan, crowns of trees, a hay meadow, white church and farms on the shore, the river reflection; `orchard`: a pear-tree canopy with violet only in shadow, trunks and a birch in strokes). Flat shapes first, then thousands of elliptical dabs in jittered colours, ordered back to front. The first painting lays itself down over 2.6s (ease 1 − (1 − p)^2.2); later ones paint over 2s once a quarter of them is in view. The water layer keeps shimmering on a slow sine. Layers shift up to a few pixels with the pointer (scale 1.03). Reduced motion: painted at once, no shimmer, no parallax. Resizing repaints instantly.

### The Painted Stage (Larsson signature)
Paper layers rendered by `tools/paint` (sky, hills, river, garden, bed, flower sprites) in wide and tall compositions. On load each non-sky layer folds up from rotateX(82deg) over 1.6s with a 0.18s back-to-front stagger; the words settle in from 0.55 opacity, 6px down and a 2.5px blur, staggered 0.12s. Afterwards the layers drift with pointer and scroll by depth (sky 0 to sprites 1), idling on a slow sine without a pointer; flowers sway 1.2 to 2deg; one line-drawn bird glides across. Reduced motion: no fold, no drift, no bird.

### Railway Route (shared pattern)
Getting there is drawn as the line north from Stockholm: six stations, Järvsö last. Klimt: one 1px slate line with 0.7rem hollow stations in tiny capitals; the terminus filled violet and lettered violet. Larsson: double ink rails, 1.15rem paper stations ringed in 2px ink, the terminus a larger falu dot with the gold halo and its name in falu Della Respira, the duration in italic beneath. Both turn vertical on phones.

### Schedule (shared pattern)
Times and items between hairlines, a 5.5rem time column. Klimt: violet Tenor Sans times, capitals item names, italic slate-soft descriptions. Larsson: falu Della Respira times, Alegreya 500 item names, italic ink-soft descriptions.

## Do's and Don'ts

### Do:
- **Do** let one painting lead every first viewport: the Klimt square beside its label, or the Larsson stage with words in its unpainted sky.
- **Do** make every action an underlined text link with a 44px target, including the RSVP send.
- **Do** set asides, hints, notes and radio answers in Alegreya italic in the soft ink.
- **Do** keep each world to its ink and single accent: violet for Klimt, falu red for Larsson.
- **Do** set Klimt names, headings, labels and links in Tenor Sans uppercase, tracked 0.12em to 0.32em, in one weight.
- **Do** keep Klimt flat and square: no shadows, no radii, 1px slate lines.
- **Do** keep Larsson gold to 1 to 2px lines and the date's separator dots.
- **Do** ease motion out (cubic-bezier(.16, 1, .3, 1)), keep it slow, and give every animation a still state under reduced motion.
- **Do** keep text at full legibility over its ground: slate on print ground, ink or ink soft on paper.

### Don't:
- **Don't** put a photo hero with centred names, an ivory card with a script font, or a framed-gallery layout on any page.
- **Don't** add filled buttons, pills or chips to either world.
- **Don't** box content sections into card grids; Larsson's paper card is reserved for the RSVP form and Klimt has none.
- **Don't** bring Klimt's gold, mosaics or ornament into the Klimt world; its Klimt is the landscapes.
- **Don't** use the painting palettes as UI fills or backgrounds.
- **Don't** introduce a third typeface in either world; in Larsson, don't introduce a sans serif or uppercase tracked labels (those belong to Klimt).
- **Don't** fill anything with flat gold, gold-leaf texture or gold gradients in Larsson.
- **Don't** use grey, glowing or hard-offset shadows.
