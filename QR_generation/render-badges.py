#!/usr/bin/env python3
"""
qr_generation/render-badges.py

Step 2 of 2. Draws each QR matrix from dump-matrices.js as a 1000x1000
PNG that is fully transparent apart from the black modules and the black
ID label beneath them.

The geometry is measured off the approved reference badge rather than
guessed: 731x731 QR at (135, 110) on a 1000x1000 canvas, with the label's
cap-height top sitting at y=883 and centred horizontally. The QR is drawn
at its true module resolution and scaled up with NEAREST so the modules
stay perfectly crisp with no anti-aliased grey fringing -- important
because a grey edge pixel on a transparent background prints as a halo.

The label is positioned by measuring each string's actual ink bbox and
aligning its top edge, not by using the font baseline. Every ID here is
caps + digits + hyphen with no descenders, so aligning the ink top gives
an identical optical baseline on every badge.

Usage:
  python3 render-badges.py <matrices.json> <font.ttf> <outDir>
"""
import json
import os
import sys
from PIL import Image, ImageDraw, ImageFont

CANVAS = 1000
QR_PX = 731          # measured from the reference badge
QR_X, QR_Y = 135, 110
TEXT_TOP = 883       # y of the label's cap-height top
TEXT_CAP_H = 42      # measured cap height of the reference label
BLACK = (0, 0, 0, 255)


def fit_font(font_path, cap_target):
    """Pick the px size whose cap height matches the reference label."""
    best, best_err = None, None
    for size in range(20, 140):
        f = ImageFont.truetype(font_path, size)
        # "H" is a flat-topped cap with no overshoot -- a clean cap-height probe.
        box = f.getbbox("H")
        cap = box[3] - box[1]
        err = abs(cap - cap_target)
        if best_err is None or err < best_err:
            best, best_err = (size, f), err
    return best


def render(code, entry, font, out_path):
    img = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))

    # --- QR modules -> crisp black-on-transparent ---
    n = entry["size"]
    bits = entry["bits"]
    mask = Image.new("L", (n, n), 0)
    mask.putdata([255 if b == "1" else 0 for b in bits])
    mask = mask.resize((QR_PX, QR_PX), Image.NEAREST)
    black = Image.new("RGBA", (QR_PX, QR_PX), BLACK)
    img.paste(black, (QR_X, QR_Y), mask)

    # --- ID label ---
    draw = ImageDraw.Draw(img)
    box = draw.textbbox((0, 0), code, font=font)
    w = box[2] - box[0]
    x = round((CANVAS - w) / 2) - box[0]
    y = TEXT_TOP - box[1]
    draw.text((x, y), code, font=font, fill=BLACK)

    img.save(out_path, "PNG")


def main():
    if len(sys.argv) != 4:
        print("Usage: python3 render-badges.py <matrices.json> <font.ttf> <outDir>")
        sys.exit(1)
    matrices_path, font_path, out_dir = sys.argv[1:4]

    with open(matrices_path, encoding="utf-8") as f:
        matrices = json.load(f)

    size, font = fit_font(font_path, TEXT_CAP_H)
    print(f"Font: {os.path.basename(font_path)} @ {size}px  (cap height ~{TEXT_CAP_H}px)")

    os.makedirs(out_dir, exist_ok=True)
    for i, (code, entry) in enumerate(sorted(matrices.items()), 1):
        render(code, entry, font, os.path.join(out_dir, f"{code}.png"))
        if i % 50 == 0:
            print(f"  {i}/{len(matrices)}")
    print(f"Done - wrote {len(matrices)} badges to {out_dir}")


if __name__ == "__main__":
    main()
