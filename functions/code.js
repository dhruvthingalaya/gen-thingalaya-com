import bwipjs from "bwip-js/node";
import * as QRCode from "qrcode";

const typeMap = {
  // QR
  qr: "qrcode",
  qrcode: "qrcode",

  // Micro QR
  microqr: "microqrcode",
  microqrcode: "microqrcode",

  // Aztec
  aztec: "azteccode",
  azteccode: "azteccode",

  // Aztec Rune
  aztecrunes: "aztecrune",
  aztecrune: "aztecrune",

  // Matrix Codes
  datamatrix: "datamatrix",
  gridmatrix: "hanxin",
  maxicode: "maxicode",
  pdf417: "pdf417",

  // Barcodes
  code128: "code128",
  ean13: "ean13",
};

const qrTypes = ["qrcode", "microqrcode"];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function svgResponse(svg, status = 200) {
  return new Response(svg, {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",

      // browser tab name
      "Content-Disposition": 'inline; filename="gen.thingalaya.com.svg"',
    },
  });
}

function pngResponse(buffer, status = 200) {
  return new Response(buffer, {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "image/png",
      "Cache-Control": "no-store",

      // browser tab name
      "Content-Disposition": 'inline; filename="gen.thingalaya.com.png"',
    },
  });
}

function getQrOptions(ec = "M") {
  const errorCorrectionLevel = String(ec).toUpperCase();

  if (!["L", "M", "Q", "H"].includes(errorCorrectionLevel)) {
    throw new Error("Invalid QR error correction level. Use L, M, Q, or H");
  }

  return {
    errorCorrectionLevel,
    margin: 2,
    scale: 8,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  };
}

function buildBwipOptions({ data, type }) {
  const bcid = typeMap[(type || "").toLowerCase()];

  if (!bcid) {
    throw new Error("Unsupported type");
  }

  const text = String(data ?? "").trim();

  if (!text) {
    throw new Error(
      'Missing "data" parameter. Example: ?type=qrcode&data=hello',
    );
  }

  // =================================
  // Aztec Rune Validation
  // =================================
  if (bcid === "aztecrune") {
    if (!/^\d+$/.test(text)) {
      throw new Error("Aztec Rune requires integer value 0-255");
    }

    const n = Number(text);

    if (n < 0 || n > 255) {
      throw new Error("Aztec Rune value must be between 0 and 255");
    }
  }

  // =================================
  // EAN13 Validation
  // =================================
  if (bcid === "ean13") {
    if (!/^\d+$/.test(text)) {
      throw new Error("EAN-13 accepts digits only");
    }

    if (text.length !== 12 && text.length !== 13) {
      throw new Error("EAN-13 requires 12 or 13 digits");
    }
  }

  return {
    bcid,
    text,
    scale: 4,
    includetext: false,
    paddingwidth: 8,
    paddingheight: 8,
    backgroundcolor: "FFFFFF",
  };
}

// =================================
// ERROR IMAGE GENERATORS
// =================================

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createErrorSvg(message) {
  const safeMessage = escapeXml(message);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="220" viewBox="0 0 900 220">
  <rect width="100%" height="100%" fill="#ffffff"/>

  <text
    x="40"
    y="60"
    font-size="28"
    font-family="Arial, Helvetica, sans-serif"
    fill="#d32f2f"
    font-weight="bold"
  >
    Barcode Generator Error
  </text>

  <text
    x="40"
    y="110"
    font-size="20"
    font-family="Arial, Helvetica, sans-serif"
    fill="#111111"
  >
    ${safeMessage}
  </text>

  <text
    x="40"
    y="170"
    font-size="16"
    font-family="Arial, Helvetica, sans-serif"
    fill="#666666"
  >
    Check your URL parameters and try again.
  </text>
</svg>
`.trim();
}

async function createErrorPng(message) {
  return bwipjs.toBuffer({
    bcid: "qrcode",

    text: `ERROR:\n${message}`,

    scale: 8,

    includetext: true,

    textxalign: "center",

    paddingwidth: 16,
    paddingheight: 16,

    backgroundcolor: "FFFFFF",
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  const format = (url.searchParams.get("format") || "svg").toLowerCase();

  try {
    const data = url.searchParams.get("data") || "";

    const type = url.searchParams.get("type") || "qrcode";

    const ec = url.searchParams.get("ec") || "M";

    const normalizedType = typeMap[type.toLowerCase()];

    if (!normalizedType) {
      throw new Error(`Unsupported type "${type}"`);
    }

    const text = String(data).trim();

    if (!text) {
      throw new Error('Missing "data" parameter');
    }

    // =================================
    // QR + MICRO QR
    // =================================
    if (qrTypes.includes(normalizedType)) {
      const qrOptions = getQrOptions(ec);

      // SVG
      if (format === "svg") {
        const svg = await QRCode.toString(text, {
          ...qrOptions,
          type: "svg",
        });

        return svgResponse(svg);
      }

      // PNG
      if (format === "png") {
        const png = await bwipjs.toBuffer({
          bcid: normalizedType,

          text,

          scale: 8,

          includetext: false,

          paddingwidth: 8,
          paddingheight: 8,

          backgroundcolor: "FFFFFF",

          eclevel: ec.toUpperCase(),
        });

        return pngResponse(png);
      }

      throw new Error('Unsupported format. Use "svg" or "png"');
    }

    // =================================
    // EVERYTHING ELSE
    // =================================
    const opts = buildBwipOptions({
      data,
      type,
    });

    // SVG
    if (format === "svg") {
      let svg = bwipjs.toSVG(opts);

      svg = svg.replace(
        /<svg\b([^>]*)>/i,
        '<svg$1><rect width="100%" height="100%" fill="#ffffff"/>',
      );

      return svgResponse(svg);
    }

    // PNG
    if (format === "png") {
      const png = await bwipjs.toBuffer(opts);

      return pngResponse(png);
    }

    throw new Error('Unsupported format. Use "svg" or "png"');
  } catch (err) {
    console.error("CODE API ERROR:", err);

    const message = err?.message || "Bad request";

    // =================================
    // ERROR → SVG
    // =================================
    if (format === "svg") {
      return svgResponse(createErrorSvg(message), 400);
    }

    // =================================
    // ERROR → PNG
    // =================================
    if (format === "png") {
      const png = await createErrorPng(message);

      return pngResponse(png, 400);
    }

    // Fallback
    return new Response(message, {
      status: 400,
      headers: {
        ...corsHeaders(),
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
