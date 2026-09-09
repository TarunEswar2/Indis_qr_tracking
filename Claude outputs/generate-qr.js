#!/usr/bin/env node
/**
 * qr_generation/generate-qr.js
 *
 * Generates a "designer" QR code for a given attendee serial code: a real,
 * scannable QR (encoded at error-correction level H) with a custom module
 * color and an optional logo/artwork composited into the center — the same
 * look as the printed conference badge (colored modules + a center graphic).
 *
 * Usage:
 *   node generate-qr.js <id> <output.png> [options]
 *
 * Options:
 *   --logo <path>        PNG/JPG to place in the center (optional)
 *   --dark <hex>         Module color, e.g. "#1b5e3c" (default black)
 *   --light <hex>        Background color (default white)
 *   --size <px>          Output image size in pixels (default 800)
 *   --logo-scale <0-1>   Logo width as a fraction of QR width (default 0.28)
 *
 * Example (matches the sample badge's dark-green style):
 *   node generate-qr.js ICORD25IN519 out.png --logo mask.png --dark "#1b5e3c"
 */

const QRCode = require("qrcode");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

function parseArgs(argv) {
  const [id, output, ...rest] = argv;
  const opts = { dark: "#000000", light: "#ffffff", size: 800, logoScale: 0.28, logo: null };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--logo") opts.logo = rest[++i];
    else if (a === "--dark") opts.dark = rest[++i];
    else if (a === "--light") opts.light = rest[++i];
    else if (a === "--size") opts.size = parseInt(rest[++i], 10);
    else if (a === "--logo-scale") opts.logoScale = parseFloat(rest[++i]);
  }
  return { id, output, opts };
}

async function main() {
  const { id, output, opts } = parseArgs(process.argv.slice(2));
  if (!id || !output) {
    console.error(
      "Usage: node generate-qr.js <id> <output.png> [--logo path] [--dark #hex] [--light #hex] [--size px] [--logo-scale 0-1]"
    );
    process.exit(1);
  }

  if (opts.logo && opts.logoScale > 0.3) {
    console.warn(
      `Warning: --logo-scale ${opts.logoScale} is above the safe ~0.30 cap for error-correction level H — the code may stop scanning. Recommend 0.28 or lower.`
    );
  }

  const canvas = createCanvas(opts.size, opts.size);

  // ECC level H (30% error-correction budget) is what makes it safe to
  // cover part of the center with a logo without breaking the scan.
  await QRCode.toCanvas(canvas, id, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: opts.size,
    color: {
      dark: opts.dark,
      light: opts.light,
    },
  });

  if (opts.logo) {
    const ctx = canvas.getContext("2d");
    const logoImg = await loadImage(opts.logo);
    const logoW = opts.size * opts.logoScale;
    const logoH = logoW * (logoImg.height / logoImg.width);
    const x = (opts.size - logoW) / 2;
    const y = (opts.size - logoH) / 2;

    // white backing plate behind the logo so it reads cleanly against the QR
    const pad = opts.size * 0.02;
    ctx.fillStyle = opts.light;
    ctx.fillRect(x - pad, y - pad, logoW + pad * 2, logoH + pad * 2);

    ctx.drawImage(logoImg, x, y, logoW, logoH);
  }

  const buf = canvas.toBuffer("image/png");
  fs.writeFileSync(output, buf);
  console.log(`Wrote ${output}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
