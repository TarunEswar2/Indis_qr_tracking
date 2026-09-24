#!/usr/bin/env node
/**
 * qr_generation/generate-qr.js
 *
 * Generates a "designer" QR code for a given attendee serial code: a real,
 * scannable QR (encoded at error-correction level H) with a custom module
 * color and an optional logo/artwork composited into the center — the same
 * look as the printed conference badge (colored modules + a center graphic).
 *
 * The serial_code ID is rendered below the QR in OpenSans-Regular on a
 * transparent background by default.
 *
 * Usage:
 *   node generate-qr.js <id> <output.png> [options]
 *
 * Options:
 *   --logo <path>        PNG/JPG to place in the center (optional)
 *   --dark <hex>         Module color, e.g. "#1b5e3c" (default black)
 *   --light <hex>        Background color (default transparent)
 *   --size <px>          QR image size in pixels (default 800)
 *   --logo-scale <0-1>   Logo width as a fraction of QR width (default 0.28)
 *   --font <path>        Path to .ttf font for the label (default OpenSans-Regular.ttf)
 *   --font-size <px>     Label font size in pixels (default auto ~6% of size)
 *   --no-label           Skip the text label below the QR
 *
 * Example:
 *   node generate-qr.js INDIS2026-2253 out.png
 *   node generate-qr.js ICORD25IN519 out.png --logo mask.png --dark "#1b5e3c"
 *
 * Uses `qrcode` (pure JS, no native build step) for the QR itself and
 * `sharp` (ships prebuilt binaries — no Python/Visual Studio needed) only
 * for compositing the optional logo and text label on top.
 */

const QRCode = require("qrcode");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const [id, output, ...rest] = argv;
  const opts = {
    dark: "#000000",
    light: "#00000000", // transparent
    size: 800,
    logoScale: 0.28,
    logo: null,
    font: path.join(__dirname, "OpenSans-Regular.ttf"),
    fontSize: 0, // 0 = auto
    noLabel: false,
  };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--logo") opts.logo = rest[++i];
    else if (a === "--dark") opts.dark = rest[++i];
    else if (a === "--light") opts.light = rest[++i];
    else if (a === "--size") opts.size = parseInt(rest[++i], 10);
    else if (a === "--logo-scale") opts.logoScale = parseFloat(rest[++i]);
    else if (a === "--font") opts.font = rest[++i];
    else if (a === "--font-size") opts.fontSize = parseInt(rest[++i], 10);
    else if (a === "--no-label") opts.noLabel = true;
  }
  if (!opts.fontSize) opts.fontSize = Math.round(opts.size * 0.06);
  return { id, output, opts };
}

// Escape XML special characters for safe SVG embedding.
function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function main() {
  const { id, output, opts } = parseArgs(process.argv.slice(2));
  if (!id || !output) {
    console.error(
      "Usage: node generate-qr.js <id> <output.png> [--logo path] [--dark #hex] [--light #hex] [--size px] [--logo-scale 0-1] [--no-label]"
    );
    process.exit(1);
  }

  if (opts.logo && opts.logoScale > 0.3) {
    console.warn(
      `Warning: --logo-scale ${opts.logoScale} is above the safe ~0.30 cap for error-correction level H — the code may stop scanning. Recommend 0.28 or lower.`
    );
  }

  // ECC level H (30% error-correction budget) is what makes it safe to
  // cover part of the center with a logo without breaking the scan.
  const qrBuffer = await QRCode.toBuffer(id, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 1,
    width: opts.size,
    color: {
      dark: opts.dark,
      light: opts.light,
    },
  });

  // --- Optional logo compositing (same as before) ---
  let qrWithLogo = qrBuffer;
  if (opts.logo) {
    const logoW = Math.round(opts.size * opts.logoScale);
    const pad = Math.round(opts.size * 0.02);

    const resizedLogo = await sharp(opts.logo).resize({ width: logoW }).toBuffer();
    const logoMeta = await sharp(resizedLogo).metadata();
    const logoH = logoMeta.height;

    const backing = await sharp({
      create: {
        width: logoW + pad * 2,
        height: logoH + pad * 2,
        channels: 4,
        background: opts.light,
      },
    })
      .composite([{ input: resizedLogo, left: pad, top: pad }])
      .png()
      .toBuffer();

    const backingMeta = await sharp(backing).metadata();
    const left = Math.round((opts.size - backingMeta.width) / 2);
    const top = Math.round((opts.size - backingMeta.height) / 2);

    qrWithLogo = await sharp(qrBuffer)
      .composite([{ input: backing, left, top }])
      .png()
      .toBuffer();
  }

  // --- No label: just write the QR and exit ---
  if (opts.noLabel) {
    fs.writeFileSync(output, qrWithLogo);
    console.log(`Wrote ${output}`);
    return;
  }

  // --- Render the serial_code label below the QR ---
  const fontData = fs.readFileSync(opts.font);
  const fontBase64 = fontData.toString("base64");

  const textBlockHeight = Math.round(opts.fontSize * 2.5);
  const totalHeight = opts.size + textBlockHeight;

  const svgText = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${opts.size}" height="${textBlockHeight}">
  <style>
    @font-face {
      font-family: 'OpenSans';
      src: url('data:font/truetype;base64,${fontBase64}');
    }
  </style>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle"
        font-family="OpenSans, sans-serif" font-size="${opts.fontSize}" fill="${opts.dark}">
    ${escapeXml(id)}
  </text>
</svg>`);

  const finalBuffer = await sharp({
    create: {
      width: opts.size,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: qrWithLogo, top: 0, left: 0 },
      { input: svgText, top: opts.size, left: 0 },
    ])
    .png()
    .toBuffer();

  fs.writeFileSync(output, finalBuffer);
  console.log(`Wrote ${output}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
