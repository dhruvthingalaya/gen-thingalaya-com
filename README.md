# Thingalaya Barcode Generator

A lightweight, URL-driven barcode and QR generation service powering:

**https://gen.thingalaya.com**

Generate barcodes instantly from a single URL.

Designed for:

- Web apps
- Payment flows
- APIs
- Markdown
- Emails
- `<img>` embeds
- `<iframe>` embeds
- QR-based workflows

No authentication. No setup. No SDKs.

---

## Overview

Thingalaya Barcode Generator allows you to generate:

- QR Codes
- Payment QR Codes (UPI compatible)
- 1D Barcodes
- 2D Barcodes

Output formats:

- SVG
- PNG

You can:

- Generate via URL
- Embed directly into websites
- Use inside apps
- Download from the browser UI
- Control QR error correction

Everything is stateless and URL-driven.

---

## Base URL

```txt
https://gen.thingalaya.com
```

---

## API Endpoint

```txt
GET /code
```

Example:

```txt
https://gen.thingalaya.com/code?type=qr&data=Hello
```

---

## Query Parameters

| Parameter | Required | Description |
|------------|----------|-------------|
| `type` | Yes | Barcode type |
| `data` | Yes | Data to encode |
| `format` | No | `svg` (default) or `png` |
| `ec` | No | QR error correction level |

---

## QR Error Correction

QR codes support configurable error correction.

Supported values:

| Level | Recovery Capacity |
|--------|-------------------|
| `L` | ~7% |
| `M` | ~15% *(default)* |
| `Q` | ~25% |
| `H` | ~30% |

Higher error correction improves scan reliability if the QR is:

- Damaged
- Printed poorly
- Partially covered
- Displayed on reflective surfaces

Higher levels also increase QR density.

The `ec` parameter applies only to:

```txt
qr
qrcode
```

Example:

```txt
https://gen.thingalaya.com/code?type=qr&format=png&ec=H&data=Hello
```

---

## Examples

### Basic QR

```txt
https://gen.thingalaya.com/code?type=qr&data=Hello
```

### QR as PNG

```txt
https://gen.thingalaya.com/code?type=qr&format=png&data=Hello
```

### QR with High Error Correction

```txt
https://gen.thingalaya.com/code?type=qr&format=png&ec=H&data=Hello
```

### PDF417 Barcode

```txt
https://gen.thingalaya.com/code?type=pdf417&data=Hello%20Thingalaya
```

### Code128 Barcode

```txt
https://gen.thingalaya.com/code?type=code128&data=123456789
```

### UPI Payment QR

```txt
https://gen.thingalaya.com/code?type=qr&format=svg&ec=H&data=upi%3A%2F%2Fpay%3Fpa%3Dexample%40upi%26pn%3DThingalaya%26am%3D500
```

---

## Embedding

### HTML Image

```html
<img
  src="https://gen.thingalaya.com/code?type=qr&data=Hello"
/>
```

### Iframe

```html
<iframe
  src="https://gen.thingalaya.com/code?type=qr&data=Hello"
  width="300"
  height="300"
  style="border:none;">
</iframe>
```

### Markdown

```md
![QR](https://gen.thingalaya.com/code?type=qr&data=Hello)
```

---

## Supported Barcode Types

### QR Codes

```txt
qr
qrcode
microqr
microqrcode
```

### 2D Barcodes

```txt
aztec
azteccode
aztecrune
datamatrix
gridmatrix (Han Xin)
maxicode
pdf417
```

### 1D Barcodes

```txt
code128
ean13
```

---

## Browser Generator UI

A visual barcode generator is available at:

```txt
https://gen.thingalaya.com
```

Features include:

- Live preview
- Download as SVG
- Download as PNG
- Download as PDF
- QR error correction selector
- URL parameter auto-generation
- Embeddable iframe mode

Example:

```txt
https://gen.thingalaya.com/?type=qr&format=svg&ec=H&data=Hello
```

---

## Response Format

| Format | Content Type |
|--------|----------------|
| `svg` | `image/svg+xml` |
| `png` | `image/png` |

---

## Notes

### SVG vs PNG

**SVG**
- Smaller file size
- Infinite scaling
- Best for web and print

**PNG**
- Fixed raster image
- Better for some legacy systems
- Easy image compatibility

### PDF Support

PDF export is available only in the browser UI.

The `/code` API supports:

- SVG
- PNG

---

## Troubleshooting

| Issue | Cause |
|--------|-------|
| Blank image | Invalid or unencoded data |
| QR looks dense | High error correction level |
| `ec` not changing output | Only supported for QR |
| Markdown image not rendering | Platform blocks external images |

---

## Design Philosophy

> A barcode should be generatable from a single URL.

Simple. Fast. Embeddable.