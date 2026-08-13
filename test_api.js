import { getPartnerStatus, getServices } from "./lib/services.js";

async function test() {
  console.log("Fetching services...");
  try {
    const services = await getServices();
    console.log("Services:", JSON.stringify(services).substring(0, 500));
  } catch (e) {
    console.error("Services error", e);
  }

  console.log("\nFetching partners...");
  try {
    const partners = await getPartnerStatus(1, 100, "status=ACTIVE");
    console.log("Partners:", JSON.stringify(partners).substring(0, 500));
  } catch (e) {
    console.error("Partners error", e.message || e);
  }
}

test();
