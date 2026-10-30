---
name: Sanjin & Alma
description: A Carl Larsson watercolour of Järvsö in late summer, built as a pop-up book, with a little of Klimt's gold.
colors:
  chair: "#b5402a"
  chair-deep: "#9c351d"
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
  cream: "#fbf6ec"
  stage-mist: "#e9ece4"
  ink: "#2e2420"
  ink-soft: "#5b4a40"
typography:
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
  hand-cut: "3px 5px 4px 6px / 6px 3px 5px 4px"
  hand-cut-chip: "3px 6px 4px 5px"
  field: "3px 3px 0 0"
  tab: "3px"
  round: "50%"
spacing:
  gutter: "clamp(1rem, 4vw, 3.5rem)"
  measure: "34rem"
  room: "clamp(4.5rem, 11vh, 8rem)"
  split-gap: "clamp(2rem, 6vw, 6rem)"
  field-gap: "1.35rem"
  card-pad: "clamp(1.75rem, 4vw, 3rem)"
components:
  button-primary:
    backgroundColor: "{colors.chair}"
    textColor: "{colors.cream}"
    typography: "{typography.label}"
    rounded: "{rounded.hand-cut}"
    padding: "0.7rem 1.35rem 0.75rem"
    height: "3.1rem"
  button-primary-hover:
    backgroundColor: "{colors.chair-deep}"
    textColor: "{colors.cream}"
  choice-chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.hand-cut-chip}"
    padding: "0.55rem 1.1rem"
    height: "3rem"
  choice-chip-selected:
    backgroundColor: "{colors.leaf-deep}"
    textColor: "{colors.cream}"
  input-field:
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.7rem 0.75rem 0.6rem"
    height: "3rem"
  card-rsvp:
    backgroundColor: "{colors.card-paper}"
    padding: "{spacing.card-pad}"
  monogram:
    textColor: "{colors.falu}"
    rounded: "{rounded.round}"
    size: "3.1rem"
  lang-toggle:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.tab}"
    height: "44px"
---

# Design System: Sanjin & Alma

## Overview

**Creative North Star: "The Pop-up Larsson"**

Every surface is a watercolour on cold-pressed paper. The first viewport is a full-bleed painting of Järvsö in late summer, cut into paper layers (sky, sun, hills, river, garden, flower bed, swaying flowers) that fold up from the page back to front and then drift with depth. Words are lettered into the unpainted sky, never set on a panel. Below the stage, the wedding page reads like a book of Larsson plates: one block of text on paper beside one small painted vignette, alternating sides.

The palette is Larsson's house: falu-red lettering, chair-red action, birch-leaf green for chosen states, ink-brown text, and a pale pink garden path behind the one form. Klimt arrives only as beaten gold leaf, on the ampersand, the thank-you word, the turning sun, and thin gold rules. Calm, simple, grand: generous type, a serif-only world, slow motion that eases out and settles.

The world refuses the framed-gallery page, the ivory card with a script font, the photo hero with centred names, and the card grid.

**Key Characteristics:**
- Painted paper stage first; interface set into the painting, never pasted on.
- Two serifs only: Della Respira letters names and numerals, Alegreya carries every word.
- Reds split by job: falu for lettering, chair for the one primary action.
- Gold is a material (gold-leaf texture clipped to letters, thin gold rules), not a flat fill colour.
- Hand-cut, slightly uneven corners; ink hairlines; soft paper shadows.
- Motion is paper physics: fold up, settle out of a blur, sway, drift. Reduced motion shows the still painting.

## Colors

Larsson's red-house-and-garden palette on warm paper, with gold leaf as the only metallic.

### Primary
- **Chair Red** (#b5402a): the primary action fill ("Add to calendar", "RSVP", "Send answer"). A darkened, legible relative of the painted chairs in the scene (the painting's own chair is lighter; the UI red was deepened so cream text holds contrast).
- **Chair Red, Deep** (#9c351d): button hover fill and the 1px pressed-paper lip under every button.

### Secondary
- **Falu Red** (#b23b2c): the lettering red. Date numerals, the signature, schedule times, the terminus station, the monogram letters, the input caret, invalid-field underline. Shared exactly with the painting's falu-red houses.
- **Falu Shade** (#8b2d22): error text and the terminus dot's rim; the painting's falu shadow.

### Tertiary
- **Birch Leaf** (#6f8f45): scrollbar thumb only.
- **Deep Leaf** (#4f6b37): selected choice chips, input focus underline, the travel line icons. Green means "chosen" or "here".
- **Gold** (#c9a043) and **Gold, Deep** (#9a7426): thin gold rules (card inset, language underline, monogram ring, terminus halo, nav underline in deep gold) and the date separator dots. Gilt lettering uses the painted gold-leaf texture (`assets/paint/gold-leaf.webp`) with a dark gold stroke, not a flat colour.
- **Peony Pink** (#e58ea4): text selection.
- **Garden Path** (#f0d9cc): the RSVP section's ground, the one coloured band on the wedding page.

### Neutral
- **Watercolour Paper** (#f2efe5): page ground, tiled with the paper-tooth texture (`assets/img/paper.svg`, 300px).
- **Paper, Deep** (#efe6d3): scrollbar track.
- **Card Paper** (#fbf8f1): the RSVP card, a lighter sheet laid on the path, also textured.
- **Cream** (#fbf6ec): text on chair red and on deep-leaf chips.
- **Stage Mist** (#e9ece4): the stage's fallback before the painting loads.
- **Ink** (#2e2420): all primary text, focus rings, ink hairlines, birds.
- **Ink, Soft** (#5b4a40): secondary text, italic descriptions, field underlines, chip borders.

The painting's own palette lives in `tools/paint/scene.js` (`C` for landscape and house, `G` for garden flowers). UI tokens that share a name with a paint colour (falu, leaf, gold, path, peony) use the same value; chair is the deliberate exception above.

### Named Rules
**The Two Reds Rule.** Falu red letters; chair red acts. Numerals, signatures and the monogram are falu; only a primary button is filled with chair. Never fill a non-action with chair red.

**The Gold Is Leaf Rule.** Gold appears as beaten gold-leaf texture on a few letters or as a hairline rule of 1 to 2px. Never as a flat gold fill, a gold button, or a gold gradient.

## Typography

**Display Font:** Della Respira (with Alegreya, Georgia, serif)
**Body Font:** Alegreya (with Georgia, Times New Roman, serif)

**Character:** Della Respira is the hand-lettered voice for names and numbers, wide and calm; Alegreya is a warm book serif for everything spoken, with italics doing the work of quiet asides.

### Hierarchy
- **Display** (Della Respira 400, clamp 3.2rem to 6rem, 0.98): the couple's names in the sky. Balanced, one line on wide screens. The ampersand is gilt at 0.78em.
- **Numeral** (Della Respira 400, clamp 1.9rem to 3rem, 1, lining figures): the date as 27 · 08 · 2027 in falu red with gold-deep dots; schedule times at 1.6rem with tabular figures; the thank-you word in gilt at clamp 3.4rem to 6rem.
- **Headline** (Alegreya 500, clamp 2.1rem to 3.4rem, 1.05): section titles. The RSVP title runs larger (clamp 2.4rem to 4rem, 1).
- **Title** (Alegreya 500, 1.3rem): "By train / by car / by air" with a leaf-green line icon; schedule item names at 1.15rem.
- **Lede** (Alegreya italic 400, clamp 1.25rem to 1.65rem): "are getting married", in ink soft.
- **Body** (Alegreya 400, clamp 1.0625rem to 1.25rem, 1.55, old-style figures): paragraphs held to a 34rem measure. Letter paragraphs step up to clamp 1.15rem to 1.35rem at 1.6.
- **Label** (Alegreya 500, 1.02rem): form labels, legends, button text (1.05rem, 0.01em).
- **Hint** (Alegreya italic 400, 0.92rem): optional-field hints, durations, errors (0.95rem), credits (0.88rem).

### Named Rules
**The Lettered Numbers Rule.** Dates, times and station termini are set in Della Respira with lining figures; running text keeps Alegreya's old-style figures.

**The Italic Aside Rule.** Secondary voice is Alegreya italic in ink soft, never a smaller grey sans and never uppercase tracking.

## Layout

The first viewport is a stage: 100svh (min 34rem), the painting anchored to the bottom and covering the frame at a 1.6 ratio, swapped for a 0.5-ratio tall composition below an aspect ratio of 4/5. Words sit top-left in the open sky (max 44rem) on desktop and centred at the top on tall screens, over a blurred radial wash of unpainted paper. Monogram left, nav and language right, in a single top row.

Below the stage, sections ("rooms") pad clamp(4.5rem, 11vh, 8rem) vertically and use the shared gutter horizontally. Content blocks are a two-column split (max 74rem, gap clamp 2rem to 6rem) of text beside a vignette, alternating sides; travel adds a full-width railway line and a three-column list of ways; RSVP is a 4:7 split of intro and card (max 72rem). Below 960px all splits stack and vignettes cap at 28rem; below 760px the section nav hides, form rows stack and the railway line turns vertical. Short landscape screens (height up to 760px) shrink the names to keep them out of the hills.

## Elevation & Depth

Depth comes from the painting, not from UI chrome: the stage is a pop-up book in CSS 3D (perspective 1800px), each paper layer with its own parallax depth. UI surfaces stay nearly flat and use soft, warm, paper-like shadows that read as a sheet lifted off the page.

### Shadow Vocabulary
- **Button lift** (`box-shadow: 0 1px 0 var(--chair-deep), 0 10px 20px -12px rgb(90 30 10 / .65)`): a 1px lip plus a soft warm drop under the primary button.
- **Card sheet** (`box-shadow: 0 1px 2px rgb(60 30 20 / .12), 0 24px 40px -26px rgb(60 30 20 / .5)`): the RSVP card lying on the path.
- **Monogram rings** (`box-shadow: inset 0 0 0 4px rgb(247 242 230 / .7), inset 0 0 0 5px var(--gold)`): a gold ring inside the gold-deep border.
- **Terminus halo** (`box-shadow: 0 0 0 4px var(--paper), 0 0 0 5.5px var(--gold)`): the destination dot on the railway line.
- **Focus underline** (`box-shadow: 0 2px 0 var(--leaf-deep)`): a doubled leaf-green underline on a focused field.

### Named Rules
**The Paper Shadow Rule.** Shadows are warm brown (rgb 60 30 20 or 90 30 10), soft and negatively spread so they sit under the object. No grey, no hard offsets, no glow.

## Shapes

Corners are hand-cut: buttons use an irregular elliptical radius (3px 5px 4px 6px / 6px 3px 5px 4px) and choice chips a slightly uneven one (3px 6px 4px 5px), so nothing looks machine-stamped. Fields are open at the bottom (3px top corners, square bottom) with only an ink underline. Circles are reserved for the monogram, the scroll cue and railway stations. Borders are ink hairlines of 1 to 2px; dividers are ink at 18% opacity. The RSVP card carries a 1px gold rule inset 10px, like a printed card's border. Icons are inline SVG line drawings at 1.6 stroke with round caps, matching the painting's ink contours.

## Components

### Buttons
Pressed paper in chair red, set into the painting.
- **Shape:** hand-cut corners (3px 5px 4px 6px / 6px 3px 5px 4px), min height 3.1rem.
- **Primary:** chair red with cream text, Alegreya 500 at 1.05rem, padding 0.7rem 1.35rem 0.75rem, optional leading 1.15rem line icon.
- **Hover / Focus:** deepens to chair red deep and lifts 1px (0.5s ease-out); presses down 1px on active; 2px ink outline at 3px offset on focus. Disabled drops to 0.65 opacity with a progress cursor.
- **Quiet / Arrow links:** secondary actions are italic text links or an arrow link whose arrow slides 3px on hover. Underlines are 1px at 0.22em offset, half-strength until hover.

### Chips
- **Style:** RSVP yes/no choices as outlined hand-cut chips (1.5px ink-soft border), each with a small hollow circle before the label.
- **State:** hover darkens the border to ink; selected fills deep leaf with cream text and a filled cream dot; focus draws the 2px ink outline.

### Cards / Containers
- **Corner Style:** square.
- **Background:** card paper with the paper tooth texture.
- **Shadow Strategy:** the card sheet shadow (see Elevation).
- **Border:** an inset 1px gold rule at 80% opacity, 10px in from the edge.
- **Internal Padding:** clamp(1.75rem, 4vw, 3rem). Used once, for the RSVP form; content sections are never boxed.

### Inputs / Fields
- **Style:** translucent white wash (55%), no box, a 1.5px ink-soft underline, 3px top corners, min height 3rem, falu caret. Selects carry a drawn ink-soft chevron.
- **Focus:** underline turns deep leaf, doubles with a 2px leaf shadow, and the field goes solid white.
- **Error / Disabled:** invalid fields take a falu underline; the message below is italic falu shade at 0.95rem.

### Navigation
- **Style:** Alegreya at body size in ink, no underline, 44px targets. A 1px gold-deep rule draws in from the left on hover and focus (0.5s ease-out). Hidden below 760px; the RSVP button in the sky stays.
- **Language toggle:** plain text buttons in ink soft (full language names on the Save the Date, EN/SV/BS on the wedding page); the active one turns ink with a 2px gold underline.
- **Monogram:** S·A in falu Della Respira inside a 3.1rem circle with a gold-deep border, inner gold ring and a translucent paper fill; 4.2rem in the footer.

### The Painted Stage (signature)
Paper layers rendered by `tools/paint` (sky, sun, hills, river, garden, bed, flower sprites) in wide and tall compositions. On load each non-sky layer folds up from rotateX(82deg) over 1.6s with a 0.18s back-to-front stagger, then the words settle in (from 0.55 opacity, 6px down and a 2.5px blur, staggered 0.12s). Afterward the layers drift with pointer and scroll by depth (sky 0 to sprites 1), idling on a slow sine without a pointer; flowers sway 1.2 to 2deg, the gold sun turns once every 240s, line-drawn birds glide across. Reduced motion: no fold, no drift, no birds; a still painting.

### Gilt Lettering (signature)
The ampersand, the signature ampersand and the RSVP thank-you word are clipped to the gold-leaf texture with a fine dark-gold stroke, gleaming slowly (18s, alternate) when motion is allowed.

### Railway Line (signature)
Getting-there is drawn as a Swedish railway map line: double ink rails with dashed sleepers, paper-white station dots ringed in ink, and the terminus as a larger falu dot with a gold halo, its name in falu Della Respira. Horizontal six-stop line on desktop, vertical below 760px.

### Schedule
A list of times and items between ink hairlines at 18%: Della Respira times in falu on the left (5.5rem column), Alegreya 500 item name with an italic ink-soft line beneath.

## Do's and Don'ts

### Do:
- **Do** let the painting lead every first viewport and letter the words into its unpainted sky, behind a soft radial paper wash rather than a panel.
- **Do** keep falu red for lettered names, numerals and termini, and chair red for the single primary action per view.
- **Do** use gold only as gold-leaf texture on a few letters or as 1 to 2px rules.
- **Do** pair each wedding-page section with one painted vignette from `tools/paint`, alternating sides.
- **Do** cut corners by hand (irregular radii) and keep shadows warm, soft and under the object.
- **Do** draw icons as inline SVG line art at 1.6 stroke with round caps.
- **Do** ease motion out (cubic-bezier(.16, 1, .3, 1)) and keep it slow; give every animation a still state under reduced motion.
- **Do** keep touch targets at 44px or more and text in ink or ink soft over paper.

### Don't:
- **Don't** put a photo hero with centred names, an ivory card with a script font, or a framed-gallery layout on any page.
- **Don't** box content sections into card grids; the paper card is reserved for the RSVP form.
- **Don't** introduce a sans serif or a third typeface.
- **Don't** fill buttons or large areas with flat gold, or use gold gradients.
- **Don't** use grey, glowing or hard-offset shadows (the button's 1px chair-deep lip is the only hard edge).
- **Don't** set secondary text in uppercase tracked labels; use Alegreya italic.
