import OpengraphImage from "./opengraph-image";
import { profile } from "@/lib/content/profile";

// Same image as the Open Graph preview, so X shows a large card too.
export const alt = `${profile.name}, Developer Trainee at Sahayogi One and final-year CSE student at Bennett University`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default OpengraphImage;
