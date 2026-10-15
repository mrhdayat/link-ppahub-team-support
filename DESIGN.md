---
name: Team PPA Links
description: A self-hosted link-in-bio page built as one piece of hi-fi audio hardware, with an admin editor styled as its service panel.
colors:
  base: "#dfe2e5"
  ground: "#cfd2d5"
  face-top: "#e6e8eb"
  face-bottom: "#d8dbde"
  hi: "#f0f1f3"
  lo: "#c0c2c5"
  ink: "#282929"
  ink-soft: "#565758"
  led: "#1fb46a"
  led-off: "#bbbec0"
  well: "#f1f2f3"
  danger: "#a3201b"
  amber: "#e89a1c"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.45rem, 5.5vw, 1.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
  label-sm:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "\"tnum\""
rounded:
  micro: "4px"
  readout: "6px"
  key: "14px"
  key-admin: "12px"
  panel: "16px"
  chassis: "26px"
  pill: "999px"
  round: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  key-gap: "14px"
  gutter: "16px"
  lg: "18px"
  section: "26px"
components:
  chassis:
    backgroundColor: "{colors.face-top}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chassis}"
    padding: "22px 20px 18px"
    width: "min(100%, 440px)"
  preset-key:
    backgroundColor: "{colors.face-top}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.key}"
    padding: "10px 18px 10px 16px"
    height: "58px"
  preset-key-recessed:
    backgroundColor: "{colors.base}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
  preset-key-pill:
    backgroundColor: "{colors.face-top}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 20px 10px 22px"
  tact-switch:
    backgroundColor: "{colors.face-top}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round}"
    size: "44px"
  driver-cone:
    backgroundColor: "{colors.base}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.round}"
    size: "104px"
  button:
    backgroundColor: "{colors.face-top}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.key-admin}"
    padding: "0 14px"
    height: "44px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.base}"
    typography: "{typography.label}"
    rounded: "{rounded.key-admin}"
    padding: "0 14px"
    height: "44px"
  button-primary-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
  input:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key-admin}"
    padding: "10px 12px"
    height: "44px"
  panel:
    backgroundColor: "{colors.face-top}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "18px 16px 20px"
  row-well:
    backgroundColor: "{colors.base}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key-admin}"
    padding: "14px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.base}"
    rounded: "{rounded.key-admin}"
    padding: "6px 6px 6px 14px"
---

# Design System: Team PPA Links

## Overview

**Creative North Star: "The Hi-Fi Faceplate"**

The public page is one piece of audio equipment sitting on a desk. It is a single molded plastic or anodized slab, lit from the top left, with a speaker grille, the owner's avatar seated as a driver cone, four screws, a column of preset keys with indicator LEDs, small round tact switches for socials, and a power lamp at the foot. The base is neumorphic: every surface is the same material, pushed out or pressed in. Skeuomorphic hardware details give the visitor objects they recognize as buttons, so the page never looks like a stack of identical pills on a gradient.

The admin editor uses the same world as a service panel. Faders stand in for range inputs, slide switches with LEDs for checkboxes, segmented keys for radios, small preset keys for color swatches, and the live faceplate preview is pinned beside them. On the admin side clarity beats costume: the hardware vocabulary shows up as tactile shape and depth, never as decorative texture.

Everything is derived at runtime. The admin picks two colors (a **base** material and an **LED** color) plus radius, depth, font, and key style. `themeVars()` in `src/lib/site.ts` computes every other shade from those picks, so a choice the admin makes cannot break contrast. The token values in this file are the default **Kapur** preset at depth 0.7.

**Key Characteristics:**
- One material per unit; every shade is a mix of the base toward white or black.
- Light comes from the top left: a highlight shadow up-left, a dark shadow down-right, and a 1px bevel on raised parts.
- State lives in LEDs and in press depth. Hue changes never carry state on their own.
- Label-first keys: LED, glyph, label, arrow, in that order.
- Text clears 4.5:1 on every surface it can sit on, enforced in code.

## Colors

All colors are tints and shades of one plastic, plus one LED color. The values below are the Kapur default (`base #dfe2e5`, `led #1fb46a`, depth 0.7).

### Primary
- **Indicator Green** (led): the only saturated color on the unit. It lights the LED on the main ("lit") key, active and focused keys, checked switches and swatches, the "saved" status lamp, the power lamp, and `::selection`. It always appears as a small glowing light, never as a fill behind text.

### Neutral
- **Kapur Chalk** (base): the material itself. Fills the grille, cone, recessed keys, switch tracks, and admin row wells.
- **Desk Shadow** (ground): the surface the unit sits on. It is the page background behind the chassis and behind the admin chrome on phones.
- **Lit Face / Shaded Face** (face-top, face-bottom): the two ends of the 170–175° gradient on every raised part (chassis, keys, tacts, panels, buttons, fader caps), so a raised part reads as catching light.
- **Highlight** (hi) / **Shade** (lo): the two shadow colors. They are not surfaces. They exist only inside shadows, bevels, the grille perforation, and screw slots.
- **Engraved Ink** (ink): primary text, icons on tacts, focus outlines, and the fill of the primary admin button and toast. It is tinted from the base hue.
- **Worn Ink** (ink-soft): bio, key glyphs and arrows, hints, placeholders, initials in the cone. It is still at least 4.5:1 on every surface.
- **Dark LED Cell** (led-off): an unlit LED. It is always drawn, so "lit" reads as a state.
- **Input Well** (well): base mixed 55% toward white. Fill for text inputs and the fader readout in the admin.

### Admin-only signals
- **Fault Red** (danger) and **Standby Amber** (amber) are fixed values that are not derived from the base. They exist only on the admin panel, which always wears a fixed Kapur plate. Red marks invalid fields, the error status LED, and delete icon buttons. Amber marks the "unsaved" status LED and the busy LED on the login button.

### Presets
| Preset | base | led | Resulting scheme |
|---|---|---|---|
| Kapur (default) | #dfe2e5 | #1fb46a | light |
| Grafit | #2c2e33 | #ffb547 | dark (ink #eaeaeb, ground #1e1f23) |
| Zaitun | #b9bca4 | #f7c548 | light |
| Baja | #a9b7c6 | #e8453c | light |

The admin can also pick any base and any LED color with native color inputs.

### Named Rules
**The One Material Rule.** No color is picked by hand except base and LED. Every other value comes from `themeVars()`: `light = luminance(base) > 0.18`; face-top mixes base toward white by 22% (6% on dark bases); face-bottom mixes toward black by 3% (12% dark); ground mixes toward black by 7% (32% dark); hi mixes toward white by 75%×depth (10%×depth dark); lo mixes toward black by 20%×depth (55%×depth dark); led-off mixes toward black by 16% (35% dark). A near-black base (luminance < 0.012) is first lifted 14% toward white so it can still cast a darker shadow.

**The Ink Floor Rule.** Ink is the base hue darkened (or lightened, on dark plastics) until it clears 4.5:1 against base, face-top, and face-bottom together. Soft ink is ink pulled back toward the base only as far as 4.5:1 still holds. New text roles take one of these two inks. Never add a third grey.

**The Panel Isolation Rule.** Admin chrome uses a fixed Kapur plate (radius 12, depth 0.6). The admin's draft colors appear only inside the preview.

## Typography

**Display Font:** Archivo (with system-ui, sans-serif)
**Alternates:** Barlow (400/600/700) and Bricolage Grotesque. The admin can switch the public faceplate to either one, and they are lazy-loaded. The admin UI is always Archivo.

**Character:** A sturdy grotesque, like the printing on equipment. It is heavy and tightly tracked for the name, and medium weight for key legends. There is no second display face and no decorative script.

### Hierarchy
- **Display** (700, clamp(1.45rem, 5.5vw, 1.75rem), 1.1, -0.025em): the owner's name under the cone. Balanced wrapping.
- **Headline** (700, 1.25rem, -0.02em): admin panel headings (Profil, Link, Sosial, Tampilan). The login title (1.375rem) and editor top bar title (1.125rem) sit on either side of it.
- **Title** (600, 1rem, 1.25, -0.005em): preset-key legends, the most important text after the name.
- **Body** (400, 0.95rem, 1.45, max 34ch): bio, in soft ink, pretty wrapping.
- **Label** (600, 0.9375rem): admin field labels, legends, buttons, switch and segmented labels, save status.
- **Label small** (0.875rem, tabular numerals): hints, counters, fader readouts, field errors (600). Swatch names go down to 0.8125rem/600.

### Named Rules
**The Legend Rule.** Every key reads label-first in sentence case. Do not use uppercase tracking, eyebrow kickers, or small caps.

**The 16px Input Rule.** Form controls never go below 16px (`max(16px, 1em)`), so iOS does not zoom the page.

## Layout

The public page is a single centered column. The desk fills the viewport (`min-height: 100svh`) with padding `clamp(20px, 6vh, 72px) 16px` and a bottom inset of 40px plus the safe area. The unit is `min(100%, 440px)` wide on every screen size: the device stays the size of a device and does not stretch on desktop. On a phone the first viewport shows the grille, cone, name, bio, tact row, and the first three or four keys.

Spacing inside the unit follows a hardware rhythm rather than a strict scale. Tacts sit 18px below the bio with 12px gaps between them, the keys start 26px below, keys are spaced 14px apart, and the power lamp sits 22px under the last key. The key grid is fixed: `8px LED | 20px glyph | 1fr label | 16px arrow`, with a 12px gap and a minimum height of 58px.

The admin uses a CSS grid with top bar, controls, and save bar. Below 900px it shows one pane at a time, switched by an "Atur | Lihat" segmented control in the sticky top bar, and the save bar is sticky at the bottom with the primary button stretched full width. At 900px and up it uses a 440px control column on the base color next to a sticky full-height preview pane. Panels stack with an 18px gap and a 16px gutter. Breakpoint: 900px.

## Elevation & Depth

Depth is the whole system. There are no flat surfaces and no colored shadows. Every part is either raised out of the base (one highlight shadow up-left, one dark shadow down-right, plus a bevel) or pressed into it (inset shadows in the reverse direction). The admin's depth slider (0–1) scales hi and lo, so the same shadow recipes run from nearly flat to deeply sculpted.

### Shadow Vocabulary
- **Chassis lift** (`-14px -14px 32px var(--hi), 18px 22px 44px var(--lo), var(--bevel)`): the unit only.
- **Raise** (`-6px -6px 14px var(--hi), 7px 8px 16px var(--lo)`): keys and the cone on the faceplate. In the admin: `-4px -4px 10px var(--hi), 5px 6px 12px var(--lo)` for panels, buttons, and swatch keys.
- **Tact lift** (`-3px -3px 7px var(--hi), 4px 4px 9px var(--lo)`): small round switches.
- **Press** (`inset 3px 3px 6px var(--lo), inset -3px -3px 6px var(--hi)`; admin uses 2px/5px): grille, cone surround, pressed keys, inputs, wells, switch tracks, empty state.
- **Bevel** (`inset 0 1px 0 hi@70%, inset 0 -1px 0 lo@45%`): a 1px molded edge on every raised part.
- **Rim** (`0 0 0 1px ink@ (0.5 − depth)×40%`): a hairline that fades in only when depth falls below 0.5, so keys keep an edge when the shadows flatten.
- **LED glow** (`0 0 0 1px rgb(0 0 0/.12), 0 0 6px led, 0 0 14px led@55%`): a lit indicator. The unlit cell is `inset 0 1px 1.5px rgb(0 0 0/.35)`.

### Named Rules
**The Press Flip Rule.** Pressing a control moves it 1–2px down and swaps its raise shadow for press over 90ms (keys, tacts) or 120ms (admin buttons). A selected swatch key stays pressed in.

**The Top-Left Light Rule.** Highlights always sit up-left and shade down-right. Never invert or rotate the light source for one component.

## Shapes

Corners follow one admin-controlled value, `--radius` (0–28px, default 14px; the admin plate uses 12px). Other radii are offsets from it: the chassis is radius + 12, admin panels radius + 4, the segmented tray radius + 2, and swatch chips radius − 6 (minimum 3px). The "pill" key style replaces key corners with 999px. Round parts are true circles: the cone (104px, with an 80px avatar in a surround inset 7px), tacts (44px), screws (9px, each slot rotated differently), LEDs (8px), and the power lamp (6px). Small hardware parts keep fixed micro radii: the fader cap and track at 4px and the readout at 6px. The grille is a dot perforation (1.3px dots on an 8px grid) recessed into the base. There are no borders anywhere. Edges come from shadow and bevel only.

## Components

### Preset Keys (signature)
A tall raised key holds the legend. An LED cell, a soft-ink glyph (20px Phosphor, regular), the label, and an up-right arrow sit in a fixed four-column grid. The admin picks one of three styles: **raised** (face gradient plus raise shadow), **recessed** (base fill with inset shadow), or **pill** (fully round). The key marked "lit" carries the glowing LED and screen-reader text "(utama)". Its fill stays the same, so the only difference is the light. On hover (fine pointers only) the LED warms to 70% and the arrow nudges 2px up-right. On press the key travels 2px down and its shadow flips inward. The focus ring is a 2px ink outline offset by 4px, and the LED lights on focus.

### Tact Switches
44px round raised buttons for social links, with a 19px bold Phosphor icon in ink and an accessible name taken from the platform. On hover the icon tints slightly toward the LED color (ink 85%). On press it travels 1px down and the shadow flips inward.

### Driver Cone and Grille
The avatar sits in a raised 104px cone with a recessed surround. When the grille is on, the cone overlaps the bottom of the 76px recessed grille by half its height (−52px). With no avatar, or when the image fails to load, the cone shows initials in soft ink on a radial face gradient.

### Power-On Sweep (motion)
On first load each key LED blinks once from top to bottom (380ms, staggered 70ms after an initial 180ms), and then the power lamp flickers and settles on. The lit key's LED stays on. Easing is `cubic-bezier(0.23, 1, 0.32, 1)`. The sweep is skipped entirely under `prefers-reduced-motion`, and the admin preview does not replay it on edits.

### Buttons (admin)
- **Shape:** gently curved (radius, 12px on the panel); minimum 44px tall, 14px horizontal padding, 8px icon gap.
- **Default:** a raised face-gradient key in ink.
- **Primary:** an ink-filled key with base-colored text and a faint inner top highlight. At rest it is the only dark slab on the panel, which marks it as the commit action. When disabled it becomes an empty pressed well in soft ink.
- **Hover / Focus:** hover deepens the raise shadow, and the primary fill lightens to 88% ink. Focus is a 2px ink outline offset by 2px. Pressing travels 1px and flips the shadow.
- **Icon button:** a 44px square in the same recipe. The danger variant colors the icon fault red.

### Inputs / Fields
- **Style:** a pressed well (`--well` fill, press shadow, no border), at least 44px tall, 16px text. The label sits above in 600 weight, and a hint or counter sits at the right in small tabular text.
- **Focus:** a 2px ink outline offset by 2px.
- **Error:** a 2px fault-red inset ring added to the press shadow, plus a 600-weight red message linked with `aria-describedby`.

### Hardware Controls (admin)
- **Slide switch:** a 52×28 pressed track with a raised 26×22 cap that carries an LED. The cap slides 20px over 140ms with a pointer and snaps when toggled from the keyboard. It is a native checkbox with `role="switch"`.
- **Fader:** a native range input with an 8px recessed track on ground, a ridged 18×32 cap, five tick marks, and an LCD-style readout well with tabular numerals.
- **Segmented keys:** a pressed tray containing raised keys with LEDs. The checked key rises and lights up. They are native radios, so arrow keys work.
- **Swatch keys:** 52px raised mini keys holding a recessed color chip and an LED. The checked swatch stays pressed and lit.

### Cards / Containers
- **Unit (chassis):** the face gradient at 170°, chassis lift, a corner screw in each of the four corners. It is reused as the login card (360px wide).
- **Panel (admin):** the face gradient, raise shadow, radius + 4, padding 18/16/20, gap 16.
- **Row well:** a link or social row in the editor, pressed into the base, radius 12, padding 14.

### Navigation and Status
The admin top bar and save bar are sticky slabs on ground (on base at 900px and up), separated by a 1px lo hairline. Save status is an LED with a label: amber means unsaved, green means saved, red means error. The toast is an ink slab with base-colored text.

## Do's and Don'ts

### Do:
- **Do** derive every new color from base and LED through `themeVars()` and `mix()`. Kapur values are examples. They are not constants.
- **Do** build new controls as raised or pressed parts of the same material, lit from the top left, with the bevel on raised parts.
- **Do** keep a native input under every hardware-styled control, and keep every touch target at least 44px.
- **Do** show state with an LED and with press depth, and mirror it in text or ARIA (switch LED plus checked state, lit key plus "(utama)").
- **Do** honor `prefers-contrast: more`: add 1px soft-ink outlines to raised parts, switch soft text to full ink, and ring the lit LED.
- **Do** keep press feedback at 90–140ms with `cubic-bezier(0.23, 1, 0.32, 1)`, and turn transitions off under reduced motion.

### Don't:
- **Don't** add borders, colored or tinted shadows, or a second accent hue on the faceplate.
- **Don't** fill a key or put text on the LED color. LED is light only. Text stays in ink or soft ink.
- **Don't** let the admin's draft colors leak into editor chrome.
- **Don't** stretch the unit beyond 440px or turn the keys into a full-width list on desktop.
- **Don't** add uppercase eyebrows or kickers above names, headings, or panels.
