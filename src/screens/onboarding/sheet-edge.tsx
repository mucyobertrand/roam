import { Image } from "expo-image";

// The sheet's top edge traced from assets/prompt-imgs/onboarding.png: a rounded top-left
// corner, a very shallow arc that dips lowest about a quarter of the way across, then a
// quick drop into the right side. Views can't express that curve (corner radii are
// circular and can't be combined with a wide arc), so it's an SVG, stretched to fill.
const sheetEdge = require("@/assets/images/onboarding/sheet-edge.svg");

export function SheetEdge() {
  return <Image source={sheetEdge} contentFit="fill" accessible={false} style={{ width: "100%", height: "100%" }} />;
}
