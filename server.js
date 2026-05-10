const http = require("http");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");
const bwipjs = require("bwip-js");
const QRCode = require("qrcode");

const PORT = process.env.PORT || 5500;

const HOST = process.env.HOST || "0.0.0.0";

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

function buildBwipOptions(data, type) {
  const bcid = typeMap[(type || "").toLowerCase()];

  if (!bcid) {
    throw new Error("Unsupported type");
  }

  const text = data == null ? "" : String(data);

  if (!text.trim()) {
    throw new Error("Data is required");
  }

  if (bcid === "aztecrune") {
    if (!/^\d+$/.test(text.trim())) {
      throw new Error("Aztec Runes requires integer 0-255");
    }

    const n = Number(text.trim());

    if (n < 0 || n > 255) {
      throw new Error("Aztec Runes value must be between 0 and 255");
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

async function generateQr(data, format, ec) {
  const errorCorrectionLevel = String(ec || "M").toUpperCase();

  if (!["L", "M", "Q", "H"].includes(errorCorrectionLevel)) {
    throw new Error("Invalid QR error correction level. Use L, M, Q, or H");
  }

  console.log("QR EC:", errorCorrectionLevel);

  if (format === "png") {
    return QRCode.toBuffer(data, {
      errorCorrectionLevel,
      margin: 2,
      scale: 8,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  }

  if (format === "svg") {
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

  throw new Error("Unsupported format. Use svg or png.");
}

async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === "/") {
    res.writeHead(302, {
      Location: "/index.html",
    });

    res.end();
    return;
  }

  const staticFiles = {
    "/index.html": {
      file: "index.html",
      type: "text/html; charset=utf-8",
    },

    "/style.css": {
      file: "style.css",
      type: "text/css; charset=utf-8",
    },

    "/site.webmanifest": {
      file: "site.webmanifest",
      type: "application/manifest+json; charset=utf-8",
    },
  };

  if (staticFiles[url.pathname]) {
    const config = staticFiles[url.pathname];

    const file = fs.readFileSync(path.join(__dirname, config.file));

    res.writeHead(200, {
      "Content-Type": config.type,
    });

    res.end(file);
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    const filePath = path.join(__dirname, url.pathname);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8",
      });

      res.end("Not found");

      return;
    }

    const ext = path.extname(filePath);

    const mime =
      ext === ".ico"
        ? "image/x-icon"
        : ext === ".svg"
          ? "image/svg+xml; charset=utf-8"
          : "image/png";

    const file = fs.readFileSync(filePath);

    res.writeHead(200, {
      "Content-Type": mime,
    });

    res.end(file);
    return;
  }

  if (url.pathname !== "/code") {
    res.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
    });

    res.end("Not found");

    return;
  }

  try {
    const data = url.searchParams.get("data") || "";

    const type = url.searchParams.get("type") || "qrcode";

    const format = (url.searchParams.get("format") || "svg").toLowerCase();

    const ec = url.searchParams.get("ec") || "M";

    const normalizedType = typeMap[type.toLowerCase()];

    // Use dedicated QR engine
    if (["qrcode", "microqrcode"].includes(normalizedType)) {
      const output = await generateQr(data, format, ec);

      res.writeHead(200, {
        "Content-Type":
          format === "svg" ? "image/svg+xml; charset=utf-8" : "image/png",

        "Cache-Control": "no-store",

        "Content-Disposition": `inline; filename="code.${format}"`,
      });

      res.end(output);
      return;
    }

    // Everything else -> bwip-js
    const opts = buildBwipOptions(data, type);

    if (format === "svg") {
      let svg = bwipjs.toSVG(opts);

      svg = svg.replace(
        /<svg\b([^>]*)>/i,
        '<svg$1><rect width="100%" height="100%" fill="#ffffff"/>',
      );

      res.writeHead(200, {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
      });

      res.end(svg);
      return;
    }

    if (format === "png") {
      const png = await bwipjs.toBuffer({
        ...opts,
        encoding: "png",
      });

      res.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      });

      res.end(png);
      return;
    }

    throw new Error("Unsupported format. Use svg or png.");
  } catch (err) {
    res.writeHead(400, {
      "Content-Type": "text/plain; charset=utf-8",
    });

    res.end(err.message || "Bad request");
  }
}

const server = http.createServer((req, res) => {
  handler(req, res).catch((err) => {
    res.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8",
    });

    res.end(err.message || "Internal server error");
  });
});

server.listen(PORT, HOST, () => {
  console.log("Server running at:");

  console.log(`- http://127.0.0.1:${PORT}`);

  console.log(`- http://localhost:${PORT}`);
});
