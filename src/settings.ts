import { detectContext, getBrowserName } from "./contextDetect";

console.info("detectContext", detectContext());
console.info("getBrowserName", getBrowserName());
console.info("navigator.userAgent", navigator.userAgent);
