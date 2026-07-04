"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Bulwark from "../contracts/bulwark";
import { CONTRACT_ADDRESS, CONTRACT_CONFIGURED } from "../config";
import { useWallet } from "../genlayer/wallet";
import { success, error } from "../toast";
import type { Policy, Claim, ProtocolParams, PremiumQuote } from "../contracts/types";

export function useBulwarkContract(): Bulwark | null {
  const { address } = useWallet();
  return useMemo(() => {
    if (!CONTRACT_CONFIGURED) return null;
    return new Bulwark(CONTRACT_ADDRESS, address || null);
  }, [address]);
}

// ── READ HOOKS ──────────────────────────────────────────────────────────────

export function useProtocolParams() {
  const contract = useBulwarkContract();
  return useQuery<ProtocolParams | null, Error>({
    queryKey: ["protocolParams"],
    queryFn: () => (contract ? contract.getProtocolParams() : Promise.resolve(null)),
    refetchOnWindowFocus: true,
    staleTime: 3000,
    enabled: !!contract,
  });
}

export function usePolicy(policyId: string | null) {
  const contract = useBulwarkContract();
  return useQuery<Policy | null, Error>({
    queryKey: ["policy", policyId],
    queryFn: () => (contract && policyId ? contract.getPolicy(policyId) : Promise.resolve(null)),
    refetchOnWindowFocus: true,
    staleTime: 3000,
    enabled: !!contract && !!policyId,
  });
}

export function useClaim(claimId: string | null) {
  const contract = useBulwarkContract();
  return useQuery<Claim | null, Error>({
    queryKey: ["claim", claimId],
    queryFn: () => (contract && claimId ? contract.getClaim(claimId) : Promise.resolve(null)),
    refetchOnWindowFocus: true,
    staleTime: 3000,
    enabled: !!contract && !!claimId,
  });
}

export function useMyPolicies() {
  const contract = useBulwarkContract();
  const { address } = useWallet();
  return useQuery<Policy[], Error>({
    queryKey: ["myPolicies", address],
    queryFn: () =>
      contract && address ? contract.getPoliciesByOwner(address) : Promise.resolve([]),
    refetchOnWindowFocus: true,
    staleTime: 3000,
    enabled: !!contract && !!address,
  });
}

export function useMyClaims() {
  const contract = useBulwarkContract();
  const { address } = useWallet();
  return useQuery<Claim[], Error>({
    queryKey: ["myClaims", address],
    queryFn: () =>
      contract && address ? contract.getClaimsByOwner(address) : Promise.resolve([]),
    refetchOnWindowFocus: true,
    staleTime: 3000,
    enabled: !!contract && !!address,
  });
}

export function useClaimLedger(limit = 50) {
  const contract = useBulwarkContract();
  return useQuery<Claim[], Error>({
    queryKey: ["claimLedger", limit],
    queryFn: () => (contract ? contract.getClaimLedger(limit) : Promise.resolve([])),
    refetchOnWindowFocus: true,
    staleTime: 3000,
    enabled: !!contract,
  });
}

export function usePreviewPremium(coverageWei: bigint | null, durationDays: number | null) {
  const contract = useBulwarkContract();
  return useQuery<PremiumQuote | null, Error>({
    queryKey: ["previewPremium", coverageWei?.toString() ?? "", durationDays ?? 0],
    queryFn: () => {
      if (!contract || !coverageWei || !durationDays) return Promise.resolve(null);
      return contract.previewPremium(coverageWei, durationDays);
    },
    refetchOnWindowFocus: false,
    staleTime: 10000,
    enabled: !!contract && !!coverageWei && !!durationDays,
  });
}

// ── WRITE HOOKS ─────────────────────────────────────────────────────────────

export function useBuyPolicy() {
  const contract = useBulwarkContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isBuying, setIsBuying] = useState(false);

  const mutation = useMutation({
    mutationFn: async (args: {
      validatorIdentifier: string;
      chainLabel: string;
      coverageWei: bigint;
      durationDays: number;
      premiumWei: bigint;
    }) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      setIsBuying(true);
      const receipt = await contract.buyPolicy(args);
      return { receipt, payload: contract.parseReturnPayload(receipt) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["protocolParams"] });
      queryClient.invalidateQueries({ queryKey: ["myPolicies"] });
      setIsBuying(false);
      success("Policy bound!", { description: "Your coverage is now active." });
    },
    onError: (err: any) => {
      setIsBuying(false);
      error("Failed to buy policy", { description: err?.message || "Please try again." });
    },
  });

  return {
    ...mutation,
    isBuying,
    buyPolicy: mutation.mutate,
    buyPolicyAsync: mutation.mutateAsync,
  };
}

export function useFileClaim() {
  const contract = useBulwarkContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isFiling, setIsFiling] = useState(false);

  const mutation = useMutation({
    mutationFn: async (args: {
      policyId: string;
      primaryEvidenceUrl: string;
      causeEvidenceUrls: string[];
    }) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      setIsFiling(true);
      const receipt = await contract.fileClaim(args);
      return { receipt, payload: contract.parseReturnPayload(receipt) };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["protocolParams"] });
      queryClient.invalidateQueries({ queryKey: ["myPolicies"] });
      queryClient.invalidateQueries({ queryKey: ["myClaims"] });
      queryClient.invalidateQueries({ queryKey: ["claimLedger"] });
      setIsFiling(false);
      const p = data?.payload;
      if (p?.covered) {
        success("Claim approved!", {
          description: `Cause: ${p.ai_cause}. Payout: ${p.payout_wei} wei.`,
        });
      } else {
        success("Claim recorded", {
          description: `AI ruling: ${p?.ai_cause ?? "unknown"} — not covered.`,
        });
      }
    },
    onError: (err: any) => {
      setIsFiling(false);
      error("Failed to file claim", { description: err?.message || "Please try again." });
    },
  });

  return {
    ...mutation,
    isFiling,
    fileClaim: mutation.mutate,
    fileClaimAsync: mutation.mutateAsync,
  };
}

export function useOwnerSeedReserve() {
  const contract = useBulwarkContract();
  const queryClient = useQueryClient();
  const [isSeeding, setIsSeeding] = useState(false);

  const mutation = useMutation({
    mutationFn: async (amountWei: bigint) => {
      if (!contract) throw new Error("Contract not configured.");
      setIsSeeding(true);
      return contract.ownerSeedReserve(amountWei);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["protocolParams"] });
      setIsSeeding(false);
      success("Reserve topped up");
    },
    onError: (err: any) => {
      setIsSeeding(false);
      error("Failed to seed reserve", { description: err?.message || "Please try again." });
    },
  });

  return { ...mutation, isSeeding, seedReserve: mutation.mutate };
}
