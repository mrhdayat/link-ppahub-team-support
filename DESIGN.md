---
name: Rambu Navigasi
description: A link-in-bio page where every link is a road sign, the profile is a vehicle HUD, and everything is drawn in neubrutalist black borders and hard shadows; the admin editor is built from the same signs.
colors:
  black: "#000000"
  yellow: "#ffd100"
  green: "#00704a"
  blue: "#0050b5"
  red: "#d7261e"
  white: "#f7f7f2"
  reflect-white: "#ffffff"
  ground: "#e7e3d8"
  ground-night: "#1c1c1c"
  grid: "rgba(0, 0, 0, 0.07)"
  grid-night: "rgba(255, 255, 255, 0.06)"
  beam: "#2b2b2b"
  beam-night: "#5a5a5a"
  ink-night: "#f7f7f2"
  focus-night: "#5c9bff"
  hud-label: "#3d3d3a"
  ink-soft: "#3a3a36"
  placeholder: "#5b5b57"
  lamp-red: "#ff4136"
  lamp-green: "#2ecc71"
  lamp-off: "#333333"
  disabled-plate: "#dcd9cf"
  disabled-ink: "#4a4a45"
typography:
  display:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "23px"
    fontWeight: 900
    lineHeight: 1.05
  headline-compact:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 900
    lineHeight: 1.05
  title:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 900
  body:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.45
  body-input:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1
  label:
    fontFamily: "Overpass Mono, monospace"
    fontSize: "13px"
    fontWeight: 700
  label-caps:
    fontFamily: "Overpass Mono, monospace"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.06em"
  note:
    fontFamily: "Overpass Mono, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  sign: "12px"
  plate: "8px"
  inner-rule: "7px"
  housing: "6px"
  chip: "4px"
  round: "50%"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "20px"
  space-6: "28px"
  tap-min: "44px"
components:
  sign-link:
    backgroundColor: "{colors.green}"
    textColor: "{colors.reflect-white}"
    typography: "{typography.headline}"
    rounded: "{rounded.sign}"
    padding: "14px 16px"
    height: "82px"
  sign-link-yellow:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.black}"
    rounded: "{rounded.sign}"
  sign-compact:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.reflect-white}"
    typography: "{typography.headline-compact}"
    rounded: "{rounded.sign}"
    padding: "12px 12px 14px"
    height: "112px"
  gantry-board:
    backgroundColor: "{colors.green}"
    textColor: "{colors.reflect-white}"
    rounded: "{rounded.sign}"
    padding: "16px 14px 14px"
    height: "132px"
  lane-plate:
    backgroundColor: "{colors.red}"
    textColor: "{colors.reflect-white}"
    typography: "{typography.title}"
    rounded: "{rounded.plate}"
    padding: "8px 14px"
  tab:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    rounded: "{rounded.plate}"
    padding: "0 12px"
    height: "{spacing.tap-min}"
  search-input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    typography: "{typography.body-input}"
    rounded: "{rounded.plate}"
    height: "56px"
  action-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.black}"
    rounded: "{rounded.plate}"
    height: "52px"
  action-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    rounded: "{rounded.plate}"
    height: "52px"
  hud-panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    padding: "20px 16px 0"
  uturn:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.reflect-white}"
    rounded: "{rounded.plate}"
    size: "56px"
  admin-button:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    rounded: "{rounded.plate}"
    padding: "8px 14px"
    height: "{spacing.tap-min}"
  admin-button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.black}"
    rounded: "{rounded.plate}"
  admin-button-danger:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    rounded: "{rounded.plate}"
  admin-button-disabled:
    backgroundColor: "{colors.disabled-plate}"
    textColor: "{colors.disabled-ink}"
    rounded: "{rounded.plate}"
  admin-input:
    backgroundColor: "{colors.reflect-white}"
    textColor: "{colors.black}"
    rounded: "{rounded.plate}"
    padding: "10px 12px"
    height: "48px"
  admin-panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    rounded: "{rounded.sign}"
    padding: "20px 16px"
---

# Design System: Rambu Navigasi

## Overview

**Creative North Star: "The Signposted Road"**

Every link is a road sign pointing to a destination, the profile is the vehicle's dashboard, and the whole page is one road read from the top (hazard tape) to the bottom (the KM 0 post). Three materials are layered, each with one job: real traffic-sign language (colour plates with a reflective inner rule, a yellow warning diamond, a red STOP octagon, a red-ringed speed-limit disc, a gantry over the road), a HUD layer (white panel with blue corner brackets, three-lamp traffic light, digital clock in the owner's zone, a one-time scan line, a gridded ground), and neubrutalism (3–4px black borders, blur-free offset shadows, flat colour, controls that sink into their own shadow when pressed).

The page is mobile-first and single-column, capped at 500px. Its shape never changes as links grow; only each lane's arrangement does (wide signs, a compact two-column grid, then a fold). Colour carries meaning (a lane's category), shape carries function (diamond = identity, octagon = chat only, red disc = time limit only), and motion happens once on arrival or in direct response to a touch. Sign colours are identical day and night; only the ground, grid, beam and ink change, and at night every bordered object gains a soft retroreflective glow so black edges do not disappear.

The admin editor (`/admin`, `/admin/login`) is built in the same sign world: hazard strip, black top bar, white panels with hard shadows, section headings as coloured plates, plate buttons that sink when pressed, and a live preview that renders the real public page.

**Key Characteristics:**
- Black 4px (signs, search, actions) and 3px (plates, tabs, panels) borders on every sign, plate and control.
- Hard offset shadows with zero blur (8/6/4px), which the element sinks into on press.
- Five sign colours (green, blue, red, yellow, white) that only ever mean a category.
- Overpass for every sign face; Overpass Mono for HUD data, notes, distances and counts.
- A 24px hairline grid on a warm grey ground (near-black at night).
- No images: every sign shape is inline SVG or CSS.

## Colors

Highway-sign primaries at full saturation on a flat warm-grey road, with black as the structural ink.

### Primary
- **Warning Yellow** (`yellow`): hazard tape stripes, the profile diamond, the primary action (Bagikan), the dialog's Tutup, the "/" key hint, the BARU/PROMO plates' ground, the admin primary button and the profile plate heading. Black text only (14.37:1).

### Secondary (the sign colours)
- **Direction Green** (`green`): petunjuk arah. Every gantry board is green regardless of category; also a category colour, the admin save toast and the "on" state of the Utama switch.
- **Information Blue** (`blue`): HUD corner brackets and scan line, the U-turn sign, the empty-state text link, the day focus ring, and a category colour.
- **Prohibition Red** (`red`): the STOP octagon, the reply-limit ring, the KM post cap, admin danger buttons, field errors and selected holiday days, and a category colour.

On green, blue and red signs the text and inner rule are Reflective White (`reflect-white`): 6.15:1, 7.46:1 and 5.02:1. Admin plates put Panel White on those colours instead (5.72, 6.94, 4.67:1).

### Neutral
- **Sign Black** (`black`): every border, every hard shadow, the tape-run strip, the lamp housing, the toast, the "dilewati" plate. It is ink in day mode (`--ink`).
- **Panel White** (`white`): the HUD, the STOP panel, the search box, tabs and fold button at rest, the QR dialog, white-category signs, admin panels. Black on it is 19.54:1.
- **Reflective White** (`reflect-white`): text and inner rules on dark sign colours, the KM face, the speed-limit disc, the road-marking dashes, admin inputs and cards.
- **Day Ground** (`ground`) with **Day Grid** (`grid`): page background and the 24px grid (28px in the admin). Black text on it is 16.38:1.
- **Night Ground** (`ground-night`) with **Night Grid** (`grid-night`): the same roles at night. Night ink (`ink-night`) on it is 15.86:1.
- **Gantry Steel** (`beam`, `beam-night`): the gantry beam and posts, lighter at night so they still read.
- **HUD Label Grey** (`hud-label`, 10.14:1 on white), **Soft Ink** (`ink-soft`, 10.63:1, admin hints and counts) and **Placeholder Grey** (`placeholder`, 6.35:1).
- **Lamp Red / Lamp Green / Lamp Off** (`lamp-red`, `lamp-green`, `lamp-off`): the HUD traffic light only. A lit lamp also glows (`0 0 8px` of its own colour); the yellow lamp uses `yellow`.
- **Night Focus Blue** (`focus-night`): the focus ring at night. `blue` is only 2.28:1 on the night ground; this lighter blue is 6.16:1.
- **Socket Grey** (`disabled-plate`, `disabled-ink`): admin disabled buttons and segmented controls (6.31:1).

### Named Rules
**The Colour Means Category Rule.** Green, blue, red, yellow and white mark a lane (`data-warna`), never decoration. A link sign always wears its category's colour; tabs and lane plates wear the same colour as their signs.

**The Fixed Sign Rule.** Sign colours never change between day and night. Only `--ground`, `--grid`, `--beam`, `--ink`, `--glow`, `--glow-drop` and `--focus` switch.

**The Ink Pairing Rule.** Green, blue and red carry white text; yellow and white carry black. No other pairing.

## Typography

**Display Font:** Overpass (with system-ui, sans-serif), loaded at 600, 800 and 900 as `--font-sign`
**Label/Mono Font:** Overpass Mono (with monospace), loaded at 500 and 700 as `--font-hud`

**Character:** Overpass descends from US highway lettering, so every sign, plate and button reads like a real roadside panel; the mono cut is the dashboard readout beside it.

### Hierarchy
- **Display** (900, 30px, 1.05, -0.01em): the profile name in the HUD; also the initials inside the diamond and CHAT on the STOP sign.
- **Headline** (900, 23px, 1.05): link sign titles in wide lanes. 18px on compact signs (`headline-compact`). Gantry board titles are 21px, stepping to 18px when two boards share a phone under 400px.
- **Title** (900, 18px): lane plates ("Jalur Nama" + count); the admin section plates use 18px/900 uppercase. The STOP heading is 20px/900, the QR heading 22px/900.
- **Body** (600, 15px, 1.45, max 36ch for the bio): bio, STOP copy, dialog copy. The empty-search message is 16px. The search input is 17px/700 so iOS never zooms.
- **Label** (Overpass Mono 700, 13px): HUD values, tape text (13px, 0.04em), lane-plate counts, the reply-limit line, the footer line.
- **Label caps** (Overpass Mono 700, 12px, 0.06em, uppercase): HUD keys (Status, Jam, Rute) and distance plates ("KM 2.3").
- **Note** (Overpass Mono 500, 13px, 1.3): sign notes (`catatan`); 12px on compact signs and gantry boards.

### Named Rules
**The Two Voices Rule.** Overpass speaks for the signs (900 for every sign face, 600 for running text); Overpass Mono speaks for data (time, counts, notes, distances, status). A value a driver would read off a dashboard is mono.

**The Heavy Sign Rule.** Anything painted on a sign or plate is weight 900. Lighter weights are for prose only.

## Layout

One column, `max-width: 500px`, centred, with 16px side padding and 28px (`space-6`) between page sections. Spacing steps are multiples of 2 and 4 (4, 8, 12, 16, 20, 28). The page order is fixed: hazard tape and lane tabs (sticky, with the day/night switch at the right of the tape), HUD profile, search, gantry (at most two main links), category lanes in CONFIG order, STOP chat with the reply limit, Bagikan and Kode QR, road marking and the KM 0 post.

**Lane layout follows link count** (`laneLayout` in `src/lib/site.ts`):
- 1–4 links: full-width signs with arrow, title, note and a "KM lane.index" distance plate.
- 5–6 links: a two-column grid of compact signs (no distance plate, up-right arrow).
- 7 or more: the compact grid shows the first 6 and a "Tampilkan n tujuan lainnya" button reveals the rest ("Ringkas jalur ini" folds it back).

Searching shows every match unfolded and hides the gantry. Picking a tab shows only that lane, including its main links. Empty categories never appear as tabs or lanes.

**Breakpoints:** under 340px the compact grid, a pair of gantry boards and the STOP panel drop to one column; under 400px the HUD stacks (diamond above name, centred) and two gantry boards use 18px titles; from 400px the HUD sits side by side and its data row becomes three cells. `pointer: coarse` hides the "/" hint; `hover: hover and pointer: fine` gets hover states and a thin tab-strip scrollbar.

**Safe areas:** the top bar, tape, tab strip, page bottom, U-turn and toast all pad with `env(safe-area-inset-*)`. The page is `100svh`, and `scroll-padding-top: calc(148px + safe-area-top)` keeps focus and anchor jumps below the sticky header.

**Admin:** one column on phones with a sticky black top bar, a sticky white action bar at the bottom and an Atur/Lihat view switch. From 900px it becomes a 460px controls column beside a sticky full-height preview separated by a 4px black rule.

## Elevation & Depth

Depth is neubrutalist: black, zero-blur, down-right offset shadows that read as the sign's own thickness. Nothing floats; a control that is pressed or selected moves by its shadow offset and loses the shadow, so it sits flush in its socket. At night every shadowed object adds `--glow`, a soft halo that stands in for retroreflection so black edges don't vanish on the dark ground; SVG shapes (STOP, KM post) get the same through `--glow-drop` in a `drop-shadow()`.

### Shadow Vocabulary
- **Panel** (`box-shadow: 8px 8px 0 #000`, `--shadow-lg`): the HUD, STOP panel and QR dialog.
- **Sign** (`box-shadow: 6px 6px 0 #000`, `--shadow-md`): link signs, the search box, Bagikan/Kode QR, admin panels.
- **Plate** (`box-shadow: 4px 4px 0 #000`, `--shadow-sm`): tabs, lane plates, gantry boards, the fold button, the empty state, the U-turn, admin buttons.
- **Small plate** (`3px 3px 0 #000`): the day/night switch, admin day toggles, row tools and colour swatches.
- **Cut-out shadow** (`filter: drop-shadow(4px 4px 0 #000)`): the STOP octagon and the KM post, whose silhouettes aren't rectangles.
- **Night glow** (`0 0 22px rgba(255,255,230,.18)`, and `0 0 11px` as a drop-shadow): added to every shadow above, night only.

### Named Rules
**The Sink Rule.** Pressing moves an element by exactly its shadow offset and sets the shadow to zero: signs 6px, actions 6px, tabs and fold 4px, the day/night switch 3px. Hover (fine pointers only) goes halfway, to a 2px shadow.

**The Hard Light Rule.** Shadows never blur. The only soft light in the system is the night glow, the lit lamp's halo and the scan line's glow.

## Shapes

Signs are rounded rectangles (12px) with an inset reflective rule: a 2.5px line 5px inside the edge, 7px radius, in the sign's text colour. Plates (tabs, lane plates, search, actions, fold, U-turn, admin buttons and inputs) are 8px; lane plates carry their own inner rule 3px in. Small chips (count chips, label plates, distance plates, the "/" key) are 4px. Panels (HUD, STOP, QR dialog) are square-cornered: they are instruments, not signs. Fixed silhouettes are reserved: the 45° yellow diamond with a black edge and inner line for identity, the eight-sided red octagon with a white and a black edge for chat, a white disc with a 6px red ring for the reply limit, a red half-round cap on a white post for KM 0. Every border is black, 4px on large signs and 3px elsewhere.

**The One Shape, One Job Rule.** The diamond is only the profile, the octagon only chat, the red disc only the time limit. No other element may borrow those silhouettes.

## Components

### Link Sign (signature)
The core unit: a colour plate pointing somewhere.
- **Shape:** 12px radius, 4px black border, inner reflective rule, 6px hard shadow.
- **Content:** a 38px arrow, the title (23px/900) with an optional label plate, the note in mono, and a "KM lane.index" distance plate (2px border in the text colour, 4px radius).
- **Compact:** in 5+ lanes the sign stacks vertically (min-height 112px, 26px up-right arrow, 18px title, 12px note, no distance plate).
- **Hover (fine pointer):** sinks 4px to a 2px shadow while a retroreflective sheen sweeps across once (520ms). **Press:** sinks the full 6px in 90ms.
- **Labels:** BARU (white plate), POPULER (black plate, yellow text and border), PROMO (yellow plate), mono 700 with 0.06em tracking. A label with an end date (`labelSampai`) disappears after that date on the owner's calendar. BARU blinks three times on arrival, then stays.
- **Visited:** a small black "dilewati" plate hangs at the top right, tilted -2°, after the visitor opens that link (stored only on their device).

### Gantry Board
- A dark steel beam (`--beam` with a light lattice) on two posts carries one or two green boards with a white inner rule, a 21px title, a mono note and a down arrow. Press and hover drop it 3px.

### Lane Tabs and Lane Plate
- **Tab:** 44px-tall plate in the lane colour (Semua is white), 15px/900 name plus a mono count chip (dark chip `rgb(0 0 0 / .3)` on green, blue and red so the white count passes 4.5:1). **Active** (`aria-pressed`): pressed 4px, no shadow, a small diamond dot before the name. The strip scrolls sideways with snap; a picked tab scrolls into view.
- **Lane plate:** an `h2` in the lane colour, "Jalur Nama" at 18px/900 with a mono count, 4px shadow and inner rule.

### HUD Profile
- **Style:** white panel, 3px border, 8px shadow, four 18px blue corner brackets (4px), a blue scan line that sweeps the panel once on arrival.
- **Content:** the 92px warning diamond with 2-letter initials, name (30px/900), bio (15px, 36ch), then a data row: Status (three-lamp light + status text), Jam (HH:MM plus WIB/WITA/WIT), Rute ("n tujuan").
- **Status lamp:** read on the owner's zone (`status.zona`). Automatic mode: red on a holiday, green inside opening hours ("dibuka sampai 21.00"), yellow outside them ("dibalas mulai 09.00"). Manual mode picks the lamp and shows "antrean penuh" or "sedang libur". Exactly one lamp is lit.

### Search
- **Style:** 56px white box, 4px border, 8px radius, 6px shadow, 17px/700 text, placeholder "Cari: toko, video, kelas…".
- **Focus:** 4px blue outline offset 3px. A clear button (44px) appears when there is text; a yellow "/" key plate shows on fine pointers, and "/" focuses the field, Esc clears it. Results are announced through a polite live region.

### STOP Chat and Reply Limit
- A white panel with an 8px shadow: the 120px red octagon (CHAT 30px/900 + "WhatsApp" in mono) beside the heading "Berhenti sebentar", the invitation line and the reply-limit row (a 52px white disc with a 6px red ring and the hour count). The octagon shifts 3px right on hover and 3px down-right on press.

### Buttons and Actions
- **Public actions:** Bagikan (yellow) and Kode QR (white), 52px, 4px border, 8px radius, 6px shadow, 17px/900; press sinks 6px. The fold button is a white mono plate (14px/700) with a 4px shadow.
- **Admin buttons:** white plates, 3px border, 8px radius, 4px shadow, 16px/900, min 44×44px. Primary is yellow and shows a black dot while there are unsaved changes; danger is red with white text. **Disabled:** already sunk 4px, socket grey, no shadow. Hover moves 2px; press sinks 4px (120ms).

### Inputs / Fields (admin)
- **Style:** white (`#ffffff`) field, 3px black border, 8px radius, min 48px, at least 16px text. Labels 15px/800; hints in mono 13px Soft Ink.
- **Focus:** the 4px blue ring. **Error:** red border, pale red fill and a red error plate with white text. **Disabled:** socket fill.
- **Segmented control:** native radios in a bordered strip; the checked segment turns black with yellow text. **Day toggles:** seven square plates; a holiday is pressed in and red. **Utama switch:** a square knob in a rectangular slot; on is green. **Colour swatches:** 44px sign-colour plates that press in when chosen.

### Navigation and Wayfinding
- **Hazard tape:** yellow/black 45° stripes (14px) carrying a black mono strip with the scrolling `teksBerjalan` (26s loop, paused on hover, still under reduced motion) and the 44px yellow day/night switch.
- **U-turn:** a 56px blue plate with a U-turn arrow, fixed bottom-right, shown after 700px of scroll; it is hidden from the tab order and screen readers until then.
- **KM 0:** a dashed road marking and a red-capped white post reading "KM 0", with "Titik awal semua rute."
- **Admin:** hazard strip, black top bar with the uppercase title, coloured section plates (Profil yellow, Status & kontak green, Kategori blue, Tautan red).

### QR Dialog and Toast
- **QR dialog:** a centred white `<dialog>` (max 340px), 4px border, 8px shadow, "Pindai untuk mampir", a 240px pixelated QR code with a 3px border and a full-width yellow Tutup. Closes with Tutup, Esc or a backdrop click.
- **Toast:** black plate, yellow 3px border, yellow mono text ("Tautan halaman disalin"); it rises 20px and fades in 160ms. The admin save toast is a green plate with white 900 text.

### Motion
- One timing curve: `--ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`).
- **Arrival (once):** signs, boards and plates are "installed", dropping 14px from a -1.5° tilt over 420ms, staggered 200ms + 50ms each (capped at 8). The HUD scan takes 1.1s. All arrival motion stops once `data-booted` is set (after 2.5s, or at the first tab, search or fold), so typing and tab switching never animate.
- **Response:** hover 140ms, press 90–120ms, toast 160ms, U-turn reveal 180ms. Hover effects only on `hover: hover and pointer: fine`.
- **Reduced motion:** every animation and transition is off (state still changes, instantly); the U-turn jumps instead of smooth-scrolling, as it also does from the keyboard.

## Do's and Don'ts

### Do:
- **Do** give every sign, plate, panel and control a black border (4px on signs, search and actions; 3px on plates, tabs and panels) and a zero-blur offset shadow from the 8/6/4px scale.
- **Do** make press feedback sink the element by its full shadow offset and remove the shadow (The Sink Rule).
- **Do** pick sign colours only from green, blue, red, yellow and white, and only to mark a category (The Colour Means Category Rule).
- **Do** put white text on green, blue and red and black text on yellow and white.
- **Do** set sign text in Overpass 900 and data, notes, counts and time in Overpass Mono.
- **Do** keep every target at least 44px (`--tap-min`) and keep the 4px blue focus ring (lighter `#5c9bff` at night).
- **Do** add `--glow` (or `--glow-drop` on SVG silhouettes) to every bordered, shadowed object so it still reads at night.
- **Do** choose a lane's layout from its link count: wide 1–4, compact 5–6, folded after 6 at 7+.
- **Do** read opening hours, label dates and the HUD clock in the owner's zone (WIB/WITA/WIT), not the visitor's.
- **Do** gate motion to arrival or a direct touch, and turn all of it off under `prefers-reduced-motion: reduce`.

### Don't:
- **Don't** blur a shadow or use one that isn't black and offset down-right; the night glow is the only soft light.
- **Don't** change a sign colour for night mode; only the ground, grid, beam, ink, glow and focus switch.
- **Don't** use the diamond, octagon or red disc for anything but profile, chat and reply limit (The One Shape, One Job Rule).
- **Don't** use colour as decoration, or add a sixth sign colour.
- **Don't** add photographs or decorative raster images; every sign is SVG or CSS (the generated QR code is the only image).
- **Don't** replay arrival motion on re-render (tab, search keystroke, fold).
- **Don't** let hover states run on touch, or animate a keyboard-initiated action.
