import * as fs from "fs";
import * as path from "path";

try {
  const absolutePlanCompassMain = "/plan-compass-main";
  if (fs.existsSync(absolutePlanCompassMain)) {
    const contents = fs.readdirSync(absolutePlanCompassMain);
    console.log(`=== Contents of ${absolutePlanCompassMain} ===`);
    console.log(contents);
  } else {
    console.log(`${absolutePlanCompassMain} does not exist at absolute system root.`);
  }
} catch (e: any) {
  console.error("Error reading absolute folder:", e.message);
}
