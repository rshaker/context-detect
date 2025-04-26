import path from "path"
import { BrowserContext, Page, test, Worker } from "@playwright/test";
import { chromium, firefox, webkit } from "playwright";
import fs from 'fs';
import bcd from '@mdn/browser-compat-data' with { type: 'json' };

const extensionPath = path.join(__dirname, "../../webext/chrome");
// const userDataDir = path.join(__dirname, "../.user-data");
const userDataDir = ""; // Use a temporary directory
const testUrl = "https://example.com";

let context: BrowserContext;
let extensionId: string;
let page: Page;

let serviceWorker: Worker;

test.describe("Test with extension", () => {
    test.beforeAll(async () => {
        context = await chromium.launchPersistentContext(userDataDir, {
            headless: false, // Extension can't be loaded in headless mode
            viewport: { width: 1200, height: 800 },
            screen: { width: 1200, height: 800 },
            args: [
                `--window-size=1600,1000`, 
                `--disable-extensions-except=${extensionPath}`, 
                `--load-extension=${extensionPath}`,
                "--disable-web-security",
                "--disable-site-isolation-trials",
            ],
        });

        // Get the extensionId from the background page (works in Chromium browsers only)
        [serviceWorker] = context.serviceWorkers();
        if (!serviceWorker) {
            serviceWorker = await context.waitForEvent("serviceworker");
        }
        extensionId = serviceWorker.url().split("/")[2];
    });

    test.beforeEach(async ({}, testInfo) => {
        page = await context.newPage();
        await page.goto(`${testUrl}`);
        await page.waitForURL(`${testUrl}`);
        await page.waitForLoadState("networkidle");
    });

    test.afterEach(async () => {
        await page.close();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test("Browser compat data", async () => {
        console.log(bcd.webextensions.__compat?.support);

        // Pause (for debugging)
        test.setTimeout(0);
        await page.pause();
    });

    test("Test getBrowserContext()", async () => {
        // await page.evaluate(async () => {
        //     console.log("Maintenance script running");
        //     //# sourceURL=page.evaluate
        // });

        /**************************************************************** 
        THIS IS NOW WORKING: Background context is detected, and both page
        contexts are detected via the service worker's executeScript.
        Tools are first attached to globalThis in MAIN and ISOLATED worlds,
        then the context is read from the page by calling 
        globalThis.getBrowserContext()
        *****************************************************************/

        // Read the file contents (could be a compiled JS file)
        const scriptPath = path.join(__dirname, "../../webext/chrome/playwright/harness/testBrowserContexts.js");
        const scriptContent = fs.readFileSync(scriptPath, "utf8");

        // Check the context types of the background worker and all open pages
        const workers = context.serviceWorkers();
        workers.forEach(async (worker) => {
            // Find the background service worker
            if (worker.url() === `chrome-extension://${extensionId}/background.js`) {
                // Install the script in the service worker
                await worker.evaluate(scriptContent);
                const result = await serviceWorker.evaluate(async () => {
                    // return await globalThis.getBrowserContext();
                    return await globalThis.getCurrentAndPageContexts();
                });
                console.log("Service worker result:", result);
            }
        });

        // Pause (for debugging)
        test.setTimeout(0);
        await page.pause();
    });
});