import bwipjs from 'bwip-js';

const typeMap = {
  qr: 'qrcode',
  qrcode: 'qrcode',
  microqr: 'microqrcode',
  microqrcode: 'microqrcode',
  aztec: 'azteccode',
  azteccode: 'azteccode',
  aztecrunes: 'aztecrune',
  aztecrune: 'aztecrune',
  datamatrix: 'datamatrix',
  gridmatrix: 'hanxin',
  maxicode: 'maxicode',
  pdf417: 'pdf417',
  code128: 'code128',
  ean13: 'ean13',
};

function buildOptions(data, type) {
  const bcid = typeMap[(type || '').toLowerCase()];
  if (!bcid) throw new Error('Unsupported type');

  const text = data == null ? '' : String(data);
  if (!text.trim()) throw new Error('Data is required');

  if (bcid === 'aztecrune') {
    if (!/^\d+$/.test(text.trim())) throw new Error('Aztec Runes requires integer 0-255');
    const n = Number(text.trim());
    if (n < 0 || n > 255) throw new Error('Aztec Runes value must be between 0 and 255');
  }

  return {
    bcid,
    text,
    scale: 4,
    includetext: false,
    paddingwidth: 8,
    paddingheight: 8,
    backgroundcolor: 'FFFFFF',
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const data = url.searchParams.get('data') || '';
    const type = url.searchParams.get('type') || 'qrcode';
    const format = (url.searchParams.get('format') || 'svg').toLowerCase();
    const opts = buildOptions(data, type);

    if (format === 'svg') {
      let svg = bwipjs.toSVG(opts);
      svg = svg.replace(/<svg\b([^>]*)>/i, '<svg$1><rect width="100%" height="100%" fill="#ffffff"/>');

      return new Response(svg, {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Disposition': 'inline; filename="code.svg"',
        },
      });
    }

    if (format === 'png') {
      const png = await bwipjs.toBuffer({ ...opts, encoding: 'png' });
      return new Response(png, {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store',
          'Content-Disposition': 'inline; filename="code.png"',
        },
      });
    }

    return new Response('Unsupported format. Use svg or png.', {
      status: 400,
      headers: { ...corsHeaders(), 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    return new Response(err?.message || 'Bad request', {
      status: 400,
      headers: { ...corsHeaders(), 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
