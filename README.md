# context-detect

![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![License](https://img.shields.io/github/license/rshaker/context-detect)

## Overview

Suppose you're a piece of code running in some context of some browser's javascript engine, and you need to determine what your API options are. This won't tell you your specific options, but it will tell you what type of environment (context) you're saddled with. That's the sole purpose of this library, to tell you in which browser and context you are currently executing.

## Installation

### npm

```bash
npm install @rshaker/context-detect
```

### unpkg

```html
<script src="https://unpkg.com/@rshaker/context-detect/dist/contextDetect.js"></script>
```

## Usage

### Node
```js
import { detectContext, getBrowserName } from "@rshaker/context-detect";

console.info("detectContext", detectContext()); // "main-world"
console.info("getBrowserName", getBrowserName()); // "chrome"
console.info("navigator.userAgent", navigator.userAgent);
```

### Browser

```html
<head>
    <script src="../../dist/contextDetect.js"></script>
</head>

<body>
    Open the console to see the results
    <script>
        console.info("detectContext", contextDetect.detectContext());
        console.info("getBrowserName", contextDetect.getBrowserName());
        console.info("navigator.userAgent", navigator.userAgent);
    </script>
</body>
```

## Building

The library built by this project is intended for use by web extension developers, and is best integrated into projects via the npm package manager.

```bash
# Clone the private repo
git clone git@github.com:rshaker/context-detect.git
cd context-detect

# Requires node v22.12.0+ 
nvm use
npm install

# Hermetic browser installation requires `PLAYWRIGHT_BROWSERS_PATH=0`
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install

# Build library
npm run build:dev

# Build all browser extensions (chrome, firefox)
npm run build:webext:dev
```

## Basic detection logic

<small>

| Browser      | Service Worker? | Extension Protocol? | getViews Popup? | Extension API? | Result Context         |
|--------------|-----------------|--------------------|-----------------|---------------|-----------------------|
| Chromium     | Yes             | -                  | -               | -             | Background Worker     |
| Chromium     | No              | Yes                | Yes             | -             | Popup (Action)        |
| Chromium     | No              | Yes                | No              | -             | Extension Page        |
| Chromium     | No              | No                 | -               | Yes           | Isolated World        |
| Chromium     | No              | No                 | -               | No            | Main World            |
| Firefox      | Yes             | -                  | -               | -             | Background Worker     |
| Firefox      | No              | Yes                | Yes             | -             | Popup (Action)        |
| Firefox      | No              | Yes                | No              | -             | Extension/Background  |
| Firefox      | No              | No                 | -               | Yes           | Isolated World        |
| Firefox      | No              | No                 | -               | No            | Main World            |
| Safari       | -               | Yes                | -               | -             | Extension Page        |
| Safari       | -               | No                 | -               | -             | Web Page              |

</small>

---

## Prerequisites

- Node.js (22.12.0+)
- npm (10.9.0+)

## License

MIT