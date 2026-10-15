---
name: Team PPA Links
description: A self-hosted link-in-bio page staged as a mechanic's workshop (a truck head-unit radio on a powder-coated tool chest against a pegboard wall), with an admin editor built as the workshop's service bench.
colors:
  paint: "#b0281f"
  paint-hi: "#c0534c"
  paint-lo: "#6d1913"
  paint-edge: "#430f0c"
  gap: "#200706"
  glow: "#5ef2c8"
  glow-dim: "#172d28"
  glow-soft: "#398b74"
  metal-krom-1: "#f7f8fa"
  metal-krom-2: "#b6bdc5"
  metal-krom-3: "#5d646d"
  metal-hitam-1: "#5b5f66"
  metal-hitam-2: "#303338"
  metal-hitam-3: "#151618"
  vfd-glass: "#060708"
  radio-body: "#1b1c1f"
  wall: "#4c3b2b"
  wall-hole: "#1c140d"
  wall-malam: "#1b2430"
  lamp-light: "#ffe6b8"
  lamp-malam: "#bcd6ff"
  floor: "#3b3a37"
  tool-silhouette: "#20170f"
  peg: "#b9b2a6"
  card: "#f5f5f0"
  card-ink: "#1f2023"
  card-ink-soft: "#4b4d52"
  rubber: "#222326"
  rubber-hi: "#3a3c40"
  preset-ink: "#d9dadc"
  preset-number: "#a4a7ad"
  dymo-tape: "#121314"
  dymo-ink: "#f2f2ef"
  masking-tape: "#e8dcb6"
  marker-ink: "#1d1d1f"
  sticker-vinyl: "#fbfbf8"
  bench-ground: "#1b1e21"
  bench-hole: "#0b0c0e"
  bench-strip: "#141619"
  bench-plate-hi: "#d2d7dc"
  bench-plate: "#bfc6cd"
  bench-plate-lo: "#a9b1b9"
  bench-edge: "#5d646d"
  bench-ink: "#14171a"
  bench-ink-soft: "#30363c"
  bench-card: "#fbfaf5"
  bench-rubber-hi: "#3b4046"
  bench-rubber: "#2a2e33"
  bench-rubber-lo: "#111316"
  bench-key-ink: "#f1f3f5"
  bench-tape: "#17191c"
  bench-tape-ink: "#f3f3ef"
  bench-led: "#3ddc84"
  bench-led-off: "#3c4248"
  bench-amber: "#ffb547"
  bench-danger: "#8c1d17"
  bench-danger-hot: "#ff7a6e"
  bench-vfd: "#090b0c"
  bench-vfd-glow: "#5ef2c8"
typography:
  display:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "clamp(1.45rem, 6.4vw, 1.95rem)"
    fontWeight: 700
    lineHeight: 1.32
    letterSpacing: "0.09em"
  vfd:
    fontFamily: "Doto, monospace"
    fontSize: "1.3rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.04em"
  vfd-small:
    fontFamily: "Doto, monospace"
    fontSize: "0.72rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.06em"
  title:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "1.22rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  body:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
  tape:
    fontFamily: "Permanent Marker, cursive"
    fontSize: "0.98rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
  bench-headline:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.14em"
  bench-title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
  bench-label:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
  bench-body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.4
  bench-hint:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontFeature: "tnum"
rounded:
  card: "3px"
  drawer: "3.5px"
  cab: "4px"
  field: "5px"
  key: "6px"
  vfd: "6px"
  plate: "6px"
  bench-key: "8px"
  lid: "10px"
  radio: "10px"
  save: "10px"
  round: "50%"
spacing:
  hairline: "5px"
  tight: "8px"
  sm: "10px"
  md: "14px"
  gutter: "16px"
  panel: "18px"
  section: "22px"
components:
  drawer:
    backgroundColor: "{colors.paint}"
    textColor: "{colors.card-ink}"
    rounded: "{rounded.drawer}"
    padding: "28px 14px 12px"
    height: "82px"
  drawer-lit:
    backgroundColor: "{colors.paint}"
    textColor: "{colors.card-ink}"
    typography: "{typography.title}"
    height: "104px"
  label-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "7px 14px 7px 10px"
    height: "40px"
  preset-key:
    backgroundColor: "{colors.rubber}"
    textColor: "{colors.preset-ink}"
    rounded: "{rounded.key}"
    padding: "0 6px 6px"
    height: "46px"
  dymo-name:
    backgroundColor: "{colors.dymo-tape}"
    textColor: "{colors.dymo-ink}"
    typography: "{typography.display}"
    padding: "1px 10px 2px"
  masking-tape-bio:
    backgroundColor: "{colors.masking-tape}"
    textColor: "{colors.marker-ink}"
    typography: "{typography.tape}"
    padding: "7px 14px 8px"
  vfd-display:
    backgroundColor: "{colors.vfd-glass}"
    textColor: "{colors.glow}"
    typography: "{typography.vfd}"
    rounded: "{rounded.vfd}"
    height: "76px"
  sticker-avatar:
    backgroundColor: "{colors.sticker-vinyl}"
    rounded: "{rounded.round}"
    padding: "4px"
    size: "78px"
  bench-plate:
    backgroundColor: "{colors.bench-plate}"
    textColor: "{colors.bench-ink}"
    rounded: "{rounded.plate}"
    padding: "22px 20px 24px"
  bench-tape:
    backgroundColor: "{colors.bench-tape}"
    textColor: "{colors.bench-tape-ink}"
    typography: "{typography.bench-headline}"
    padding: "5px 14px 6px"
  bench-key:
    backgroundColor: "{colors.bench-rubber}"
    textColor: "{colors.bench-key-ink}"
    typography: "{typography.bench-label}"
    rounded: "{rounded.bench-key}"
    padding: "0 16px"
    height: "48px"
  bench-key-save:
    backgroundColor: "{colors.bench-rubber}"
    textColor: "{colors.bench-key-ink}"
    rounded: "{rounded.save}"
    padding: "0 24px 0 18px"
    height: "56px"
  bench-field:
    backgroundColor: "{colors.bench-card}"
    textColor: "{colors.bench-ink}"
    typography: "{typography.bench-body}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
    height: "48px"
  bench-status:
    backgroundColor: "{colors.bench-vfd}"
    textColor: "{colors.bench-vfd-glow}"
    rounded: "{rounded.vfd}"
    padding: "4px 14px 4px 12px"
    height: "40px"
  bench-row:
    backgroundColor: "{colors.bench-plate}"
    textColor: "{colors.bench-ink}"
    rounded: "{rounded.field}"
    padding: "16px 14px 14px"
---

# Design System: Team PPA Links

## Overview

**Creative North Star: "The Workshop Wall"**

The public page is a single, lit corner of a mechanic's workshop seen from the front. A truck head-unit radio stands on a powder-coated roll cab; the cab's drawers are the links, each with an aluminium pull and a white label card in a chrome holder. The owner's name is punched in Dymo tape on the lid, the bio is written in marker on a strip of masking tape, and the avatar is a vinyl sticker slapped on a little crooked. Behind the chest hangs a pegboard with tool silhouettes, a work lamp pools warm light from above, and the casters stand on concrete. Every layer stands for a physical object; nothing is a decorative panel.

The radio is the page's voice. Its VFD shows the owner's name in a dot-matrix glow and, while a drawer or preset key is hovered or focused, names that link with its channel number (`CH03`, `P2`), like a radio naming the station you just tuned to. The six rubber preset keys are the social accounts. The admin's whole palette is two picks (cabinet paint and display glow); `themeVars` derives every other surface from them so a pick can't break contrast.

The admin editor is the same workshop's service bench: riveted, brushed-steel plates screwed to a dark pegboard, each section labelled with a strip of Dymo tape, controls built from rubber keys, truck toggle switches, mixer faders and paint-sample chips, and a VFD status strip on a black anodized rail. The bench runs on its own fixed palette and never wears the page's paint. Density is low and touch-first: one column on phones, 46–104px targets, a centred rig at most 460px wide.

**Key Characteristics:**
- One physical scene: pegboard wall, work lamp, radio, tool chest, concrete floor.
- Links are drawers; link text always sits on a white label card, never on paint.
- Two admin picks (paint, glow) drive every derived color; materials (card, rubber, tape, chrome) are fixed.
- The VFD names whatever you point at or focus.
- Motion plays once and settles: the lamp swings to rest, the display warms up, drawers settle home.
- The admin bench is a separate, fixed steel-and-rubber palette with Dymo section tapes.

## Colors

A workshop palette: one saturated powder-coat paint and one display glow over fixed materials (white card, black rubber, chrome, Dymo, masking tape, brown pegboard, concrete).

### Primary
- **Merah Bengkel Powder Coat** (paint): the cabinet. Lid, roll cab and every drawer front. Five presets ship (merah, hitam, biru, hijau, kuning) plus a custom color input; the frontmatter values are the default merah preset.
- **Paint Lip Highlight** (paint-hi): the lit top 3–9px of the lid and each drawer front, and the tab pull. Mixed 20% toward white (35% on light paints).
- **Paint Underside** (paint-lo): the bottom edge of lid, cab and drawers. Mixed 38% toward black.
- **Paint Edge Seam** (paint-edge): 1px inset outlines, the lid seam, and the whole wall in the `polos` scene. Mixed 62% toward black.

### Secondary
- **Toska VFD Glow** (glow): VFD text, knob indicator notch, lit pull LED, preset LED on press/focus, text selection, and the 3px focus ring on drawers and keys. Defaults to the preset's `led`, lifted toward white until it reaches 4.5:1 on the VFD glass and 3:1 on the drawer gap.
- **Unlit VFD Cell** (glow-dim): the 4px dot-matrix grid of unlit cells behind the VFD text.
- **VFD Halo** (glow-soft): the outer 12px text-shadow halo and the lit pull LED's outer glow.

### Tertiary
- **Chrome trim (krom)** (metal-krom-1 → metal-krom-3): pulls, label-card holder rings, lock, knob caps, side handle, caster brackets. Three-stop ramp, light top to dark bottom.
- **Black trim (hitam)** (metal-hitam-1 → metal-hitam-3): the alternate trim. The admin's "Logam" choice swaps all three stops at once.

### Neutral
- **Label Card** (card) with **Card Ink** (card-ink) and **Card Glyph Ink** (card-ink-soft): the white card on each drawer. Ink 14.9:1, glyph 7.7:1.
- **Rubber Key** (rubber) / **Rubber Key Crown** (rubber-hi): preset key body gradient. **Key Glyph** (preset-ink) for icons, **Engraved Number** (preset-number) for the 1–6 numerals (4.58:1 on the crown).
- **Dymo Tape** (dymo-tape) / **Dymo Emboss** (dymo-ink): the name label, 12.5:1.
- **Masking Tape** (masking-tape) / **Marker Ink** (marker-ink): the bio, 12.3:1.
- **Vinyl Sticker** (sticker-vinyl): the avatar's white border.
- **Smoked VFD Glass** (vfd-glass) and **Head-Unit Fascia** (radio-body): the display and the radio's black body (gradient #2b2d31 → #151618).
- **Pegboard Brown** (wall) / **Pegboard Hole** (wall-hole), **Tool Silhouette**, **Steel Peg**: the `garasi` wall. **Night Corrugated Steel** (wall-malam) and **Moonlight** (lamp-malam) replace wall and lamp in the `malam` scene; `polos` paints the wall `paint-edge` and the floor `gap`.
- **Work-Lamp Warm** (lamp-light): the lamp's pool, blended soft-light.
- **Concrete Floor** (floor): the strip the casters stand on.
- **Bench palette** (bench-*): the admin's fixed palette. Brushed steel plates (bench-plate-hi/plate/plate-lo) carry bench-ink (8.3:1 on the darkest plate tone) and bench-ink-soft (≥ 5.6:1 on every plate tone). Rubber keys carry bench-key-ink (12.3:1). The status strip glows bench-vfd-glow, turns bench-amber when unsaved or busy, and lights bench-led green when saved. bench-danger (5.3:1 on steel, 8.7:1 on card) marks errors on light surfaces; bench-danger-hot (5.4:1 on rubber, 7.1:1 on the rail) marks them on dark ones.

### Named Rules
**The Two Picks Rule.** The admin chooses exactly two colors, paint and glow. Every other page color is either derived by `themeVars` from those two or is a fixed material. No new surface takes a raw admin color.

**The Label Card Rule.** Link text is printed on the white label card (card-ink on card, 14.9:1), never on the paint. That is why the bright kuning paint and the near-black hitam paint both stay legible without changing the ink.

**The Glow Floor Rule.** Whatever glow the admin picks, the rendered glow is lifted toward white until it reaches 4.5:1 on #060708 and 3:1 on the drawer gap. It is text, LED and focus ring at once, so it may never go dark.

**The Fixed Bench Rule.** The bench palette is fixed and prefixed `--b-`. The admin's draft colors live only inside the preview; no bench control ever wears them.

## Typography

**Display Font:** Barlow Condensed (default page face, also every bench label and tape)
**VFD Font:** Doto (dot matrix, only on display glass)
**Tape Font:** Permanent Marker (only on masking tape)
**Body Font (bench):** Archivo
**Alternate page faces:** Big Shoulders and Archivo, chosen in the admin's "Huruf" keys; they load only when picked (`preload: false`).

**Character:** Condensed workshop lettering for everything stamped or printed, a glowing dot matrix for everything on glass, and a hand marker for the one thing a person wrote. Each face belongs to a material.

### Hierarchy
- **Display** (Barlow Condensed 700, clamp(1.45rem, 6.4vw, 1.95rem), line-height 1.32, 0.09em, uppercase): the owner's name on Dymo tape. Each wrapped line is its own strip (`box-decoration-break: clone`), rotated -1.2deg.
- **VFD** (Doto 900, 1.3rem / 1.15rem under 421px, 0.04em, uppercase): the display line. **VFD small** (Doto 900, 0.72rem, 0.06em) for the channel slot and clock.
- **Title** (Barlow Condensed 700, 1.22rem): the label on a lit (primary) drawer.
- **Body** (Barlow Condensed 600, 1.12rem, line-height 1.2, 0.01em): drawer labels.
- **Tape** (Permanent Marker 400, 0.98rem, line-height 1.4, max 32ch): the bio.
- **Label** (Barlow Condensed 700, 0.72rem): engraved preset numbers.
- **Bench headline** (Barlow Condensed 700, 1.1875rem, 0.14em, uppercase): Dymo section tapes (Profil, Link, Sosial, Tampilan). 1.375rem on the login tape.
- **Bench title** (Barlow Condensed 700, 1.375rem): "Editor halaman" on the top rail.
- **Bench label** (Barlow Condensed 600, 1.0625rem): field labels, legends, keys, toggles.
- **Bench body** (Archivo, 1rem, 16px in inputs so iOS never zooms) and **bench hint** (Archivo 0.9375rem, tabular numerals) for counts and hints.

### Named Rules
**The Material Face Rule.** Doto appears only on smoked glass (the VFD, the bench readouts and status strip), Permanent Marker only on masking tape. Neither is used as a general heading or body face.

**The Dymo Caps Rule.** Uppercase belongs to embossed or glowing things: Dymo tapes and VFD text. Labels, drawer cards, keys and body copy stay in sentence case. On the bench, the Dymo tape is the only uppercase.

**The Plain Error Rule.** When the bench status reports an error it drops the dot matrix and the glow, switching to Barlow Condensed 700 in bench-danger-hot so the problem reads plainly.

## Layout

The public page is one vertical rig, centred: `.shop` fills at least 100svh as a flex column justified to the bottom, so the chest always stands on the floor and short pages still read as a scene. The rig is a centred grid with `clamp(28px, 8vh, 96px)` top padding, a 16px side gutter, and 96px plus the bottom safe-area inset at the foot. The radio is at most 400px wide and sits 2px into the chest's lid; the chest is at most 460px. Behind it, the scene is `position: fixed` and the pegboard SVG uses a 1440×900 viewBox with `xMidYMin slice`, so on phones the chest covers the middle and on desktop the tools frame its sides.

Inside the chest: lid (20px 18px 18px padding) with the name plate (sticker + text, 14px gap, 30px clear on the right for the lock), then the roll cab (8px padding) holding the drawer stack (5px gaps over the dark gap color, 5px padding), then a 30px diamond-plate kick with casters. Drawers are at least 82px tall, 104px when lit. The radio fascia is a three-column grid (58px vol knob, VFD, 48px tune knob) over a six-key row.

Under 421px the radio tightens (50px / 40px knobs, 70px VFD, 9–10px gaps), the sticker drops to 66px and label cards take the full drawer width. Under 360px the six preset keys wrap to two rows of three so each stays at least 85×46.

The admin bench is a grid of top rail, controls and save bar. Below 900px it shows one pane at a time, switched by the "Atur | Lihat" keys in the top rail. From 900px the controls take a fixed 460px column and the preview is pinned on the right at 100svh, scrolling on its own. Bench sections are steel plates with 18px internal gaps, stacked 22px apart. Both rails are sticky and respect safe-area insets.

## Elevation & Depth

Depth is physical, not ambient. Each object is lit from above: a 1px inset highlight on its top lip, a dark fold or inset edge below, and a cast shadow on whatever it rests on. The chest casts a 30px drop shadow onto the wall; drawers sit in a recessed dark gap; the VFD and fader grooves are inset wells; rubber keys have a visible skirt below them that collapses when pressed. The scene adds atmosphere with a soft-light lamp pool, a fine fractal-noise grain on every painted and steel surface (160px tile, soft-light), and a vignette that darkens the corners of the garage.

### Shadow Vocabulary
- **Chest cast** (`filter: drop-shadow(0 30px 30px rgb(0 0 0 / 0.55))`): the whole chest on the wall.
- **Radio body** (`inset 0 1px 0 rgb(255 255 255 / 0.14), inset 0 -1px 0 rgb(0 0 0 / 0.6), inset 0 0 0 1px #0c0d0e, 0 2px 0 #0a0a0b, 0 18px 24px -10px rgb(0 0 0 / 0.75)`): the head unit's moulded fascia.
- **Drawer gap** (`inset 0 2px 4px rgb(0 0 0 / 0.8)`): the dark recess the drawers sit in.
- **Drawer rest / hover / pulled** (`0 1px 0 rgb(0 0 0 / 0.5)` → `0 8px 10px -4px rgb(0 0 0 / 0.65)` → `0 14px 14px -6px rgb(0 0 0 / 0.75)`, each with a 1px paint-edge inset): the drawer coming toward you.
- **Card holder** (`0 0 0 2px metal-2, 0 0 0 3px metal-3, inset 0 1px 2px rgb(0 0 0 / 0.18), 0 3px 3px rgb(0 0 0 / 0.3)`): the chrome frame around each label card.
- **Rubber key skirt** (`inset 0 1px 0 rgb(255 255 255 / 0.14), 0 3px 0 #0b0b0c, 0 4px 6px rgb(0 0 0 / 0.5)`): the key's side wall. On press the 3px skirt goes to 0 as the key travels 3px down.
- **VFD well** (`inset 0 2px 6px rgb(0 0 0 / 0.9), inset 0 0 0 1px #000, 0 1px 0 rgb(255 255 255 / 0.08)`) plus a 165deg glass reflection at 13% white.
- **Bench plate** (`inset 0 2px 0 rgb(255 255 255 / 0.55), inset 0 -3px 0 bench-edge, inset 2px 0 0 rgb(255 255 255 / 0.25), inset -2px 0 0 rgb(0 0 0 / 0.15), 0 10px 22px -10px rgb(0 0 0 / 0.85), 0 2px 3px rgb(0 0 0 / 0.5)`): folded steel with a lit top lip, plus four chrome rivets.
- **Bench key skirt** (`inset 0 1px 0 rgb(255 255 255 / 0.14), 0 3px 0 bench-rubber-lo, 0 4px 8px rgb(0 0 0 / 0.35)`): collapses to 1px with a 2px travel on press.

### Named Rules
**The Lit From Above Rule.** Every object takes its highlight on the top edge and its shadow below. A surface with no top lip and no cast shadow is not part of the workshop.

**The Travel Rule.** Pressable things move the way the real part does: drawers come out toward you (lift and scale), keys go down into the fascia (translate down, skirt collapses), toggles flip their lever. Nothing presses by fading.

## Shapes

Corners are small and mechanical. The admin's "Radius sudut" fader (0–28px, default 10px) sets the lid's top corners directly and the drawer fronts at 0.35× (3.5px by default); everything else is a fixed part radius: 3px label cards and gap well, 4px cab and pull bars, 6px VFD glass, rubber keys and bench plates, 8px bench keys, 10px radio fascia and save key. Round things are truly round: knobs (knurled conic ring around a turned metal cap), the lock, the avatar sticker (rotated -5deg), casters, LEDs and the toggle's hex-nut bezel.

Three pull shapes are offered: **bar** (default, a full-width brushed aluminium bar with black rubber end caps and an LED at the right end), **cup** (a 96px recessed finger cup), and **tab** (a folded steel lip across the drawer's top edge in paint colors). Tapes have their own silhouettes: the bio's masking tape has torn, ragged ends cut with a CSS mask; the bench's Dymo tapes have notched ends (clip-path chevrons) and sit rotated -0.6deg. The bench fields are white label cards with a 3px chrome gradient border.

## Components

### Drawer (link)
Each link is a drawer front that slides out a hair when you reach for it.
- **Shape:** paint-colored front, radius 0.35× the theme radius, at least 82px tall (104px when lit), 28px top padding to clear the pull.
- **Pull:** bar, cup or tab (see Shapes), colored by the metal trim; the pull's LED is unlit (#2a2b2d) at rest and glows when the link is lit, hovered (60% glow) or focused.
- **Label card:** white card in a chrome holder with a 20px Phosphor bold glyph in card-ink-soft and the label in card-ink.
- **Lit:** the primary link is taller, its label goes to 700/1.22rem, its LED glows, and screen readers hear "(utama)".
- **Hover (fine pointers only):** `translateY(-1px) scale(1.012)` over 180ms ease-out, deeper shadow, raised above its neighbour.
- **Press:** `translateY(-2px) scale(1.03)` over 110ms, the deepest shadow.
- **Focus:** 3px glow outline, 3px offset, z-index 1 so the next drawer can't paint over it; the LED lights.
- **Empty state:** a non-link drawer reading "Belum ada link yang ditampilkan." with no hover or press.

### Preset keys (socials)
Six rubber keys under the display, always six slots.
- **Style:** rubber gradient (rubber-hi → rubber → #18191b), 6px radius, at least 46px tall, engraved number top-left in preset-number, an 18px bold Phosphor glyph in preset-ink, a 14×3px LED strip at the bottom.
- **Blank slot:** number only, glyph color #6c6e73, not focusable and hidden from assistive tech.
- **Press:** 3px down travel over 100ms ease-out, the skirt collapses, the LED lights in glow. Focus lights the LED too and draws the 3px glow ring.
- **Hover:** glyph goes to white (fine pointers only).

### Radio and VFD
- **Fascia:** black moulded body with feet, a knurled volume knob and a tune knob (both decorative and hidden from assistive tech), the display between them.
- **VFD:** 76px smoked glass with a 4px unlit dot grid, a 13% reflection, three rows: channel slot plus clock (updates every 15s; renders `--:--` until hydrated), the main line, and a 16-cell level meter resting at 5 lit cells.
- **Tuning:** pointer-over or focus on any drawer or key replaces the line with that link's label and its slot (`CH01`… for drawers, `P1`…`P6` for keys); the meter jumps while tuned; 900ms after leaving, it returns to the owner's name. Each new text tunes in over 260ms (opacity and a 1.5px blur). Text wider than the glass scrolls across once and back, then rests on its start.
- **Off:** the admin's "Radio di atas lemari" toggle removes the whole head unit.

### Name plate
- **Dymo name:** see Typography; white embossed caps on black tape, each line its own strip.
- **Masking-tape bio:** marker on translucent tan tape (92%), torn ends, rotated 0.8deg.
- **Sticker avatar:** 78px (66px on phones) white vinyl disc, 4px border, rotated -5deg; falls back to initials (card on card-ink, 1.5rem 700) when there is no image or it fails to load.

### Bench: steel plates and Dymo tapes
- **Plate:** brushed steel gradient (plate-hi → plate → plate-lo) with four chrome rivets, 6px radius, 22px 20px 24px padding, 18px internal gaps.
- **Section tape:** each section's `h2` is a strip of Dymo tape with notched ends, stuck slightly crooked to the plate.

### Bench: rubber keys
- **Shape:** 48px minimum, 8px radius, rubber gradient, bench-key-ink Barlow 600 1.0625rem; icon keys are 48×48.
- **Press:** 2px down travel over 120ms ease-out, skirt collapses to 1px. **Hover (fine pointers):** the crown lightens to #474d54. **Disabled:** 50% opacity, flat.
- **Add key at its limit:** goes flat (transparent, inset outline) but keeps its reason readable in bench-ink-soft.
- **Danger icon key:** glyph in bench-danger-hot.
- **Save key ("Simpan"):** larger (56px, 10px radius, 1.25rem 700) with an amber lamp that lights and breathes while there are unsaved changes.

### Bench: fields
- **Style:** white label card (bench-card) inside a 3px chrome gradient border, 5px radius, 48px minimum, a 7px inner shade at the top, placeholder #5b6168.
- **Focus:** one 3px outline everywhere, 2px offset: bench-ink on steel, bench-tape-ink on the dark rails and glass.
- **Error:** the chrome border turns solid bench-danger and a 600-weight message in bench-danger appears below.

### Bench: toggles, faders, segmented keys, paint chips
- **Truck toggle:** a chrome hex-nut bezel with a bat lever that points down for off and flips up for on (140ms rotate; keyboard toggles snap), plus an LED beside it so state never relies on lever position alone.
- **Mixer fader:** native range on a dark 8px groove with quarter tick marks, a ridged rubber cap with a white index line, and a Doto VFD readout (e.g. "10 px").
- **Segmented keys:** latching rubber keys in a dark inset tray; the chosen key sits 2px lower with its LED lit. Used for Atur/Lihat, pull shape, scene, trim and font (each font key set in its own face).
- **Paint chips:** sample cards (44px color band, name below, LED top-right); the chosen chip lifts 3px with a 2px ink ring. Glow choices are dots on a strip of smoked glass; the chosen dot grows and glows. Each row also has a native color input in a chrome frame for a custom pick.
- **Rows (links and socials):** lighter steel drawer fronts (#c8ced4 → #b4bcc4) with a 3px dark frame; hidden rows go a step darker; social rows show which preset key (1–6) they sit on.

### Bench: rails and status
- **Rails:** top and bottom bars in black anodized gradient (#1d2024 → bench-strip), sticky.
- **Status strip:** a VFD strip with an LED. Saved: glow text, green LED, one 600ms flash on a fresh save. Unsaved or busy: amber text and LED. Error: plain Barlow text in bench-danger-hot.
- **Undo toast:** a light steel strip (bench-plate-hi) with an inline key.

### Motion (system-wide)
- **Boot (public page, once):** the lamp flickers on once (900ms, stepped), the radio drops in (520ms ease-out, 120ms delay), the VFD warms up (900ms, 350ms delay, brief brightness bloom), drawers settle home one by one (560ms drawer curve, 380ms + 55ms × index, capped at the 8th). Not played in the admin preview.
- **Lamp swing:** one 7s swing that decays to rest, as if just switched on.
- **Scroll drift (where `animation-timeline` is supported):** the wall drifts 5%, the lamp 14%, and the volume knob turns 280deg across the page's scroll. Unsupported browsers keep a static scene.
- **Reduced motion:** every keyframe sits inside `prefers-reduced-motion: no-preference`; with reduce, drawer and key transitions drop to 0ms and the bench removes all transitions and travel, keeping state visible through shadow and LEDs (the save lamp stays lit, still).
- **Contrast:** under `prefers-contrast: more` or forced colors, drawers, keys, plates and rows gain a 1px outline, cards a 2px black ring, glyphs go to full card ink, and focus rings thicken to 4px.

## Do's and Don'ts

### Do:
- **Do** put every link label on the white label card (card-ink on card) so contrast holds on all five paints and any custom paint.
- **Do** derive new page colors from paint and glow through `themeVars`; keep card, rubber, tape and chrome as fixed materials.
- **Do** light new objects from above: a top-lip highlight, a dark lower edge, a cast shadow.
- **Do** make presses travel like the real part: drawers out toward you (`translateY(-2px) scale(1.03)`), keys down (2–3px with the skirt collapsing).
- **Do** give every hovered or focused link a `data-vfd` label and `data-slot` so the display can name it.
- **Do** play motion once and let it settle; loop only while a state holds (the meter while tuned, the save lamp while unsaved).
- **Do** gate hover styles behind `(hover: hover) and (pointer: fine)` and keep `:active` feedback for touch.
- **Do** keep touch targets at 46px or more and wrap the preset keys to two rows under 360px.
- **Do** use the 3px glow focus ring on the page and the 3px bench-ink / bench-tape-ink ring on the bench.

### Don't:
- **Don't** print text directly on the powder-coat paint.
- **Don't** let the admin's draft paint or glow reach a bench control; the bench palette is fixed.
- **Don't** use Doto off the glass or Permanent Marker off the tape.
- **Don't** add idle loops: the lamp, the meter and the marquee were bounded because they moved forever while visitors read.
- **Don't** give hover or press feedback to things that do nothing (the knobs are decorative; the empty-state drawer is not a link).
- **Don't** add a surface that isn't a workshop object (a floating card, a generic panel, a gradient banner).
