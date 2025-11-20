import { searchDealsByMapacheAssigned } from "../src/lib/pipedrive";

async function main() {
  const name = process.argv[2] ?? "Federico Iñigo";
  const deals = await searchDealsByMapacheAssigned(name);
  console.log(JSON.stringify(deals, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
