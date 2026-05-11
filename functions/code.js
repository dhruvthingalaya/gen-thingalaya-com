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

function svgResponse(svg) {
  return new Response(svg, {
    status: 200,
    headers: {
      ...corsHeaders(),
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": 'inline; filename="code.svg"',
    },
  });
}

function pngResponse(buffer) {
  return new Response(buffer, {
    status: 200,
    headers: {
      ...corsHeaders(),
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "Content-Disposition": 'inline; filename="code.png"',
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
    throw new Error("Data is required");
  }

  // Aztec Rune validation
  if (bcid === "aztecrune") {
    if (!/^\d+$/.test(text)) {
      throw new Error("Aztec Rune requires integer 0-255");
    }

    const n = Number(text);

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

    const text = String(data).trim();

    if (!text) {
      throw new Error("Data is required");
    }

    // =================================
    // QR + MICRO QR
    // =================================
    if (qrTypes.includes(normalizedType)) {
      const qrOptions = getQrOptions(ec);

      // SVG → qrcode
      if (format === "svg") {
        const svg = await QRCode.toString(text, {
          ...qrOptions,
          type: "svg",
        });

        return svgResponse(svg);
      }

      // PNG → bwip-js/node
      if (format === "png") {
        const png = await bwipjs.toBuffer({
          bcid: normalizedType,
          text,

          scale: 8,

          includetext: false,

          paddingwidth: 8,
          paddingheight: 8,

          backgroundcolor: "FFFFFF",

          // Proper QR error correction
          eclevel: ec.toUpperCase(),
        });

        return pngResponse(png);
      }

      throw new Error("Unsupported format. Use svg or png.");
    }

    // =================================
    // Everything Else → bwip-js
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

    throw new Error("Unsupported format. Use svg or png.");
  } catch (err) {
    console.error("CODE API ERROR:", err);

    return new Response(err?.message || "Bad request", {
      status: 400,
      headers: {
        ...corsHeaders(),
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
