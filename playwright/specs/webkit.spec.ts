import path from "path"
import { BrowserContext, Page, test } from "@playwright/test";
import { webkit } from "playwright";

const extensionPath = path.join(__dirname, "../../webext/webkit");
const userDataDir = ""; // Use a temporary directory (does this work?)
const testUrl = "https://example.com";

let context: BrowserContext;
let page: Page;

test.describe("Test with extension", () => {
    test.beforeAll(async () => {
        context = await webkit.launchPersistentContext(userDataDir, {
            headless: false, // Extension can't be loaded in headless mode
        });
    });

    test.beforeEach(async ({}, _testInfo) => {
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

    test("Placeholder does nothing", async () => {
        await page.evaluate(async () => {
            console.log("Maintenance script running");
            //# sourceURL=page.evaluate
        });

        // Pause (for debugging)
        test.setTimeout(0);
        await page.pause();
    });
});