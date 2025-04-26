import { openOrActivateTab } from './util/misc';
import { detectContext, getBrowserName } from "./contextDetect";

console.info("detectContext", detectContext());
console.info("getBrowserName", getBrowserName());
console.info("navigator.userAgent", navigator.userAgent);

document.querySelector("#actionSettings")?.addEventListener("click", (_event: any) => {
    openOrActivateTab('settings.html');
});
