import { studionet } from "genlayer-js/chains";

export const CHAIN = studionet;
export const CHAIN_HEX = ("0x" + studionet.id.toString(16)) as `0x${string}`;
export const CHAIN_RPC = studionet.rpcUrls.default.http[0];
export const CHAIN_NAME = studionet.name;

// Trim defensively — env vars pasted from a browser can smuggle in a trailing
// space that turns "0xabc…" into an invalid address downstream.
const RAW_ADDR = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "").trim();
export const CONTRACT_ADDRESS = RAW_ADDR as `0x${string}`;
export const CONTRACT_CONFIGURED = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);

export const NETWORK_LABEL = "Studionet";
