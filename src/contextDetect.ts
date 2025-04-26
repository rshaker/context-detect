export function getBrowserName(): string {
    const ua = navigator.userAgent;
    if (/OPR\/\d+/.test(ua) || /Opera\/\d+/.test(ua)) {
        return "opera";
    }
    if (/Edg\/\d+/.test(ua)) {
        return "edge";
    }
    if (/Chrome\/\d+/.test(ua) && !/Edg\/\d+/.test(ua) && !/OPR\/\d+/.test(ua)) {
        return "chrome";
    }
    if (/Firefox\/\d+/.test(ua)) {
        return "firefox";
    }
    if (/Safari\/\d+/.test(ua) && !/Chrome\/\d+/.test(ua) && !/OPR\/\d+/.test(ua) && !/Edg\/\d+/.test(ua)) {
        return "safari";
    }
    return "unknown";
}

export enum BrowserContextType {
    BACKGROUND_WORKER = "background-worker",
    DEDICATED_WORKER = "dedicated-worker",
    SHARED_WORKER = "shared-worker",
    POPUP = "popup",
    EXTENSION_PAGE = "extension-page",
    ISOLATED_WORLD = "isolated-world",
    MAIN_WORLD = "main-world",
    UNKNOWN = "unknown",
}

export type BrowserContext =
    | BrowserContextType.BACKGROUND_WORKER
    | BrowserContextType.DEDICATED_WORKER
    | BrowserContextType.SHARED_WORKER
    | BrowserContextType.POPUP
    | BrowserContextType.EXTENSION_PAGE
    | BrowserContextType.ISOLATED_WORLD
    | BrowserContextType.MAIN_WORLD
    | BrowserContextType.UNKNOWN;

export function detectContext(): BrowserContext {
    // 1. Worker contexts
    if (typeof DedicatedWorkerGlobalScope !== "undefined" && self instanceof DedicatedWorkerGlobalScope) {
        return BrowserContextType.DEDICATED_WORKER;
    }
    if (typeof SharedWorkerGlobalScope !== "undefined" && self instanceof SharedWorkerGlobalScope) {
        return BrowserContextType.SHARED_WORKER;
    }
    if (typeof ServiceWorkerGlobalScope !== "undefined" && self instanceof ServiceWorkerGlobalScope) {
        return BrowserContextType.BACKGROUND_WORKER;
    }

    const browserName = getBrowserName();

    // 2. Chromium-based
    if (browserName === "chrome" || browserName === "edge" || browserName === "opera") {
        // Background Service Worker
        if (typeof ServiceWorkerGlobalScope !== "undefined" && self instanceof ServiceWorkerGlobalScope) {
            return BrowserContextType.BACKGROUND_WORKER;
        }
        // Extension Page (chrome-extension:)
        if (location.protocol.startsWith("chrome-extension:")) {
            // Popup (Action)
            if (typeof chrome !== "undefined" && chrome.extension?.getViews) {
                const popups = chrome.extension.getViews({ type: "popup" });
                if (popups && Array.isArray(popups) && popups.includes(window)) {
                    return BrowserContextType.POPUP;
                }
            }
            return BrowserContextType.EXTENSION_PAGE;
        }
        // Content Script (Isolated World)
        if (typeof chrome !== "undefined" && chrome.runtime?.id) {
            return BrowserContextType.ISOLATED_WORLD;
        }
        // Main World (Web Page)
        return BrowserContextType.MAIN_WORLD;
    }

    // 3. Firefox
    if (browserName === "firefox") {
        // Background Service Worker
        if (typeof ServiceWorkerGlobalScope !== "undefined" && self instanceof ServiceWorkerGlobalScope) {
            return BrowserContextType.BACKGROUND_WORKER;
        }
        // Extension Page (moz-extension:)
        if (location.protocol.startsWith("moz-extension:")) {
            // Popup (Action)
            if (typeof chrome !== "undefined" && chrome.extension?.getViews) {
                const popups = chrome.extension.getViews({ type: "popup" });
                if (popups && Array.isArray(popups) && popups.includes(window)) {
                    return BrowserContextType.POPUP;
                }
            }
            // Background Page
            if (typeof chrome !== "undefined" && chrome.extension?.getBackgroundPage) {
                try {
                    if (chrome.extension.getBackgroundPage && chrome.extension.getBackgroundPage() === window) {
                        return BrowserContextType.BACKGROUND_WORKER;
                    }
                } catch (e) {
                    /* ignore */
                }
            }
            return BrowserContextType.EXTENSION_PAGE;
        }
        // Content Script (Isolated World)
        if (
            typeof window !== "undefined" &&
            typeof (globalThis as any).browser !== "undefined" &&
            (globalThis as any).browser.runtime?.id
        ) {
            return BrowserContextType.ISOLATED_WORLD;
        }
        // Main World (Web Page)
        return BrowserContextType.MAIN_WORLD;
    }

    // 4. Safari (Basic)
    if (browserName === "safari") {
        if (location.protocol.startsWith("safari-web-extension:")) {
            return BrowserContextType.EXTENSION_PAGE;
        }
        return BrowserContextType.MAIN_WORLD;
    }

    // Unknown
    return BrowserContextType.UNKNOWN;
}
