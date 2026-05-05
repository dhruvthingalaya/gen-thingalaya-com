# Thingalaya Barcode Generator

A lightweight, URL-driven barcode generation service powering
**[https://gen.thingalaya.com](https://gen.thingalaya.com)**

This project combines a minimal Node.js API with a browser-based generator UI, allowing you to generate barcodes both programmatically and visually.

---

## Overview

This repository provides:

* **HTTP API** → Generate barcode images via URL
* **Frontend UI** → Generate + download barcodes in-browser
* **Embeddable output** → Works in `<img>`, `<iframe>`, Markdown, etc.

The system is designed to be:

* Stateless
* Fast to integrate
* Easily embeddable across platforms

---

## How It Works

### Core Flow

1. Client sends request:

   ```
   GET /code?type=...&data=...&format=...
   ```
2. Server:

   * Validates inputs
   * Maps barcode type
   * Generates image via `bwip-js`
3. Returns:

   * `image/svg+xml` or `image/png`

No sessions. No storage. Pure transformation.

---

## API Usage

### Base URL

```
https://gen.thingalaya.com
```

### Endpoint

```
GET /code
```

### Query Parameters

| Param    | Required | Description              |
| -------- | -------- | ------------------------ |
| `type`   | Yes      | Barcode type             |
| `data`   | Yes      | Data to encode           |
| `format` | No       | `svg` (default) or `png` |

---

## Examples

### SVG Output

```
https://gen.thingalaya.com/code?type=pdf417&data=Hello%20Thingalaya&format=svg
```

### PNG Output

```
https://gen.thingalaya.com/code?type=pdf417&data=Hello%20Thingalaya&format=png
```

---

## Embedding

### HTML Image

```html
<img src="https://gen.thingalaya.com/code?type=qr&data=Hello" />
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
![Barcode](https://gen.thingalaya.com/code?type=qr&data=Hello)
```

---

## Supported Barcode Types

* `qr`, `qrcode`
* `microqr`, `microqrcode`
* `aztec`, `azteccode`
* `aztecrune`
* `datamatrix`
* `gridmatrix` (Han Xin)
* `maxicode`
* `pdf417`
* `code128`
* `ean13`

---

## Frontend UI

Accessible at:

```
/index.html
```

### Features

* Input data + select barcode type
* Export as:

  * SVG
  * PNG
  * PDF *(client-side only)*
* Live preview
* Auto-generation via query params
* Clean iframe rendering mode

---

## Important Note (PDF Support)

There is a deliberate separation:

* API (`/code`) → **SVG + PNG only**
* Frontend → **SVG + PNG + PDF**

PDF generation happens entirely in the browser using `jsPDF`.

---

## Tech Stack

### Backend

* Node.js (no framework)
* `bwip-js` for barcode rendering
* Native `http` module

### Frontend

* Vanilla HTML/CSS/JS
* `bwip-js` (browser build)
* `jsPDF`

### Runtime

* `pnpm`

---

## Response Behavior

* `svg` → `image/svg+xml`
* `png` → `image/png`
* CORS enabled:

  ```
  Access-Control-Allow-Origin: *
  ```
* No caching:

  ```
  Cache-Control: no-store
  ```

---

## Run Locally

```bash
pnpm install
PORT=5500 pnpm start
```

Open:

```
http://127.0.0.1:5500/index.html
```

Test API:

```
http://127.0.0.1:5500/code?type=qr&data=LocalTest
```

---

## Project Structure

```
server.js          # API server
index.html         # UI
style.css          # Styling
site.webmanifest   # PWA config
assets/            # Icons + favicons
```

---

## Troubleshooting

| Issue                  | Cause                             |
| ---------------------- | --------------------------------- |
| Connection refused     | Server not running                |
| Blank image            | Invalid / unencoded data          |
| Markdown not rendering | Platform blocking external images |
| PDF via API fails      | Not supported (UI only)           |

---

## Design Intent

This project is built around a simple principle:

> A barcode should be generatable from a single URL.

No SDKs. No auth. No friction.