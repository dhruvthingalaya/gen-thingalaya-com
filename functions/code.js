import bwipjs from "bwip-js";
import QRCode from "qrcode";

const typeMap = {
  qr: "qrcode",
  qrcode: "qrcode",
  microqr: "microqrcode",
  microqrcode: "microqrcode",
  aztec: "azteccode",
  azteccode: "azteccode",
  aztecrunes: "aztecrune",
  aztecrune: "aztecrune",
  datamatrix: "datamatrix",
  gridmatrix: "hanxin",
  maxicode: "maxicode",
  pdf417: "pdf417",
  code128: "code128",
  ean13: "ean13",
};

const qrTypes = ["qrcode"];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function buildBwipOptions(data, type) {
  const bcid = typeMap[(type || "").toLowerCase()];

  if (!bcid) {
    throw new Error("Unsupported type");
  }

  const text = data == null ? "" : String(data);

  if (!text.trim()) {
    throw new Error("Data is required");
  }

  // Aztec Rune validation
  if (bcid === "aztecrune") {
    if (!/^\d+$/.test(text.trim())) {
      throw new Error("Aztec Rune requires integer 0–255");
    }

    const n = Number(text.trim());

    if (n < 0 || n > 255) {
      throw new Error("Aztec Rune value must be between 0 and 255");
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

async function generateQrSvg(data, ec) {
  const errorCorrectionLevel = String(ec || "M").toUpperCase();

  if (!["L", "M", "Q", "H"].includes(errorCorrectionLevel)) {
    throw new Error("Invalid QR error correction level. Use L, M, Q, or H");
  }

  return QRCode.toString(data, {
    type: "svg",
    errorCorrectionLevel,
    margin: 2,
    scale: 8,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);

    const data = url.searchParams.get("data") || "";
    const type = url.searchParams.get("type") || "qrcode";
    const format = (url.searchParams.get("format") || "svg").toLowerCase();

    const ec = url.searchParams.get("ec") || "M";

    const normalizedType = typeMap[type.toLowerCase()];

    if (!normalizedType) {
      throw new Error("Unsupported type");
    }

    // Cloudflare Workers-safe:
    // only SVG supported reliably
    if (format !== "svg") {
      throw new Error(
        "Only SVG format is supported on Cloudflare Pages Functions",
      );
    }

    let svg;

    // QR → qrcode package
    if (qrTypes.includes(normalizedType)) {
      svg = await generateQrSvg(data, ec);
    }

    // Everything else → bwip-js
    else {
      const opts = buildBwipOptions(data, type);

      svg = bwipjs.toSVG(opts);

      // Add white background
      svg = svg.replace(
        /<svg\b([^>]*)>/i,
        '<svg$1><rect width="100%" height="100%" fill="#ffffff"/>',
      );
    }

    return new Response(svg, {
      status: 200,
      headers: {
        ...corsHeaders(),
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": 'inline; filename="code.svg"',
      },
    });
  } catch (err) {
    return new Response(err?.message || "Bad request", {
      status: 400,
      headers: {
        ...corsHeaders(),
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
