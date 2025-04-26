import { detectContext, getBrowserName } from "./contextDetect";

console.info("detectContext", detectContext());
console.info("getBrowserName", getBrowserName());
console.info("navigator.userAgent", navigator.userAgent);

// Install scripts in updated tabs, and on extension [re]load
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const re = new RegExp("https://*"); // Normally, this pattern would be more restrictive
    if (changeInfo.status === "complete" && tab.url && re.test(tab.url)) {
        await installScripts(tabId);
    }
});

// Install content scripts in all existing tabs
try {
    const tabs = await chrome.tabs.query({}); // {url: "<all_urls>"} or {url: "https://example.com/*"}
    const validTabs = tabs.filter((tab) => tab.url.startsWith("https://"));
    await Promise.all(validTabs.map(async (tab) => {
        await installScripts(tab.id);
    }));
} catch (error) {
    console.error("Error querying for matching tabs:", error);
    throw error; // Unrecoverable error
}

// Inject scripts into both isolated and main contexts of a tab
async function installScripts(tabId: number): Promise<void> {
    if (chrome.scripting && chrome.scripting.executeScript) {
        await chrome.scripting.executeScript({
            target: { tabId: tabId, allFrames: false },
            files: ["./scripts/worldMain.js"],
            world: "MAIN",
        });
        await chrome.scripting.executeScript({
            target: { tabId: tabId, allFrames: false },
            files: ["./scripts/worldIsolated.js"],
            world: "ISOLATED",
        });
    } else if (typeof browser !== "undefined" && browser.tabs && browser.tabs.executeScript) {
        await browser.tabs.executeScript(tabId, {
            file: "./scripts/worldMain.js",
            allFrames: false,
        });
        await browser.tabs.executeScript(tabId, {
            file: "./scripts/worldIsolated.js",
            allFrames: false,
        });
    } else {
        throw new Error("No supported API for injecting scripts");
    }
}

// For debugging purposes, expose context-detect to the global scope.
// This is not recommended for production code, as it can expose sensitive data
// and create security vulnerabilities. Use with caution.
// globalThis._contextdetect = {};
// globalThis._contextdetect.version = "alpha 0.2.0";
