import path from "path"
import { BrowserContext, Page, test, Worker, expect } from "@playwright/test";
import { chromium, firefox, webkit } from "playwright";
import fs from 'fs';
// import bcd from '@mdn/browser-compat-data' with { type: 'json' };

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
            args: [
                // `--window-size=1280,1000`, 
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

    // test("Browser compat data", async () => {
    //     console.log(bcd.webextensions.__compat?.support);
    //     // Pause (for debugging)
    //     test.setTimeout(0);
    //     await page.pause();
    // });

    test("Test context detection", async () => {
        // Read the file contents (could be a transpiled JS file)
        const scriptPath = path.join(__dirname, "../../webext/chrome/playwright/harness/testBrowserContexts.js");
        const scriptContent = fs.readFileSync(scriptPath, "utf8");

        // Check the context types of the background worker and all open pages
        const workers = context.serviceWorkers();
        for (const worker of workers) {
            // Find the background service worker
            if (worker.url() === `chrome-extension://${extensionId}/background.js`) {
                // Install the toolkit in the service worker, then start calling functions
                await worker.evaluate(scriptContent);
                const result = await serviceWorker.evaluate(async () => {
                    return await globalThis.getAllContexts();
                });
                // console.log("Result from getAllContexts:", result);
                // Assert that the result matches the expected structure, ignoring documentId value
                expect(Array.isArray(result)).toBe(true);
                expect(result[0]).toBe("background-worker");
                expect(Array.isArray(result[1])).toBe(true);
                expect(Array.isArray(result[2])).toBe(true);
                expect(result[1][0]).toMatchObject({
                    frameId: 0,
                    result: "main-world",
                });
                expect(typeof result[1][0].documentId).toBe("string");
                expect(result[2][0]).toMatchObject({
                    frameId: 0,
                    result: "isolated-world",
                });
                expect(typeof result[2][0].documentId).toBe("string");
            }
        }

        // Pause (for debugging)
        // test.setTimeout(0);
        // await page.pause();
    });
});