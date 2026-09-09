# qr_generation

Generates real, scannable QR codes styled to match the INDIS badge design —
a custom module color plus a logo/graphic composited into the center — for
a given attendee `serial_code`.

This is a plain Node.js script, separate from the Next.js app. It's meant to
be run on your own laptop (or your teammate's) whenever you need to print
badges, not as part of the live web app.

## Setup (run once)

```
cd qr_generation
npm install
```

This needs your own machine's internet access. (It won't work from inside a
cloud sandbox where package registries are blocked — but your laptop is fine.)

Uses `qrcode` (pure JS) and `sharp` (ships prebuilt binaries) deliberately —
no native compiling, so no Python or Visual Studio Build Tools needed on
Windows. If `npm install` still complains about a missing prebuilt binary
for `sharp` on your specific machine, run `npm install --platform=win32
--arch=x64 sharp` to force the matching prebuilt package.

## Generate one QR code

```
node generate-qr.js test001 test001_qr.png --dark "#1b5e3c" --logo mask.png
```

- `test001` — the id to encode. **Must match `serial_code` in Supabase
  exactly** (same case, no extra spaces) or the scanner won't find the
  attendee.
- `test001_qr.png` — output file path.
- `--dark "#1b5e3c"` — module color (dark green, close to the badge). Omit
  for plain black.
- `--logo mask.png` — optional artwork to place in the center. Put the image
  file in this folder (or give a path to it) first. Skip this flag for a
  plain colored QR with no center graphic.
- `--size 800` — output size in pixels (default 800).
- `--logo-scale 0.28` — logo width as a fraction of the QR's width (default
  0.28). Keep it at or under ~0.28–0.30.

## Batch-generate for a whole attendee list

```
node batch-generate.js ../test-attendees.csv ./qr_output --logo mask.png --dark "#1b5e3c"
```

Reads the `serial_code` column of a CSV (same shape as `test-attendees.csv`)
and writes one PNG per row into `./qr_output/<serial_code>.png`.

## Why error-correction level H?

The script always encodes at ECC level H (30% error-correction budget).
That headroom is specifically what lets a logo cover part of the center
without breaking the scan — a plain/lower-ECC QR would stop working the
moment you paste something over it.

**Always test-scan a generated code with your own phone (or the app's
`/scan` page) before printing real badges.** If a code with a logo won't
scan, the two most common fixes are: shrink `--logo-scale`, or use a
simpler/higher-contrast logo image (a solid, low-detail mark works better
than a busy illustration).

## Recreating the exact badge look

The sample badge (dark green corner squares, red dotted background, a
painted mask in the center) is a fully custom illustration layered around a
QR code, not something a generator produces automatically. This script
gives you the two pieces that actually have to stay functional — the real
QR pattern (colorable) and a clean center logo slot — so if you want the
full decorative background too, design that separately (Illustrator/Canva/
Figma) and drop the QR PNG this script produces into the middle of it as a
layer, rather than trying to bake the whole illustration into the QR image
itself.
