import { readFileSync } from "fs";
import path from "path";
import {
  TransactionHash,
  TransactionStatus,
  GenLayerClient,
  DecodedDeployData,
  GenLayerChain,
} from "genlayer-js/types";
import { localnet } from "genlayer-js/chains";

export default async function main(client: GenLayerClient<GenLayerChain>) {
  const filePath = path.resolve(process.cwd(), "contracts/bulwark.py");
  try {
    const contractCode = new Uint8Array(readFileSync(filePath));
    await client.initializeConsensusSmartContract();

    // Deploy with the connected wallet as protocol owner. The owner can seed
    // the payout reserve after deployment via owner_seed_reserve().
    const ownerAddress = client.account?.address ?? "0x0000000000000000000000000000000000000000";

    const deployTransaction = await client.deployContract({
      code: contractCode,
      args: [ownerAddress],
    });
    const receipt = await client.waitForTransactionReceipt({
      hash: deployTransaction as TransactionHash,
      status: TransactionStatus.ACCEPTED,
      retries: 200,
    });
    if (
      receipt.status !== 5 && receipt.status !== 6 &&
      receipt.statusName !== "ACCEPTED" && receipt.statusName !== "FINALIZED"
    ) {
      throw new Error(`Deployment failed. Receipt: ${JSON.stringify(receipt)}`);
    }
    const addr =
      (client.chain as GenLayerChain).id === localnet.id
        ? receipt.data?.contract_address
        : (receipt.txDataDecoded as DecodedDeployData)?.contractAddress;
    console.log(`Bulwark deployed at: ${addr}`);
    console.log(`Owner: ${ownerAddress}`);
    console.log("Next steps:");
    console.log(`  1. Set NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env.local to ${addr}`);
    console.log("  2. Call owner_seed_reserve() with initial GEN so early policies can bind");
  } catch (error) {
    throw new Error(`Deployment error: ${error}`);
  }
}
