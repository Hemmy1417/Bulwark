export type PolicyStatus = "ACTIVE" | "EXPIRED" | "CLAIMED" | "REJECTED";

export type ClaimStatus =
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "PENDING_PAYOUT";

export type CauseBucket = "NOT_SLASHED" | "NEGLIGENCE" | "BUG" | "UNAVOIDABLE";

export interface Policy {
  policy_id: string;
  policyholder: string;
  validator_identifier: string;
  chain_label: string;
  coverage_wei: string;
  premium_wei: string;
  duration_days: number;
  created_at_block: number;
  expires_at_block: number;
  status: PolicyStatus;
  claim_id: string | null;
}

export interface Claim {
  claim_id: string;
  policy_id: string;
  claimant: string;
  evidence_urls: string[];
  ai_slashed: boolean;
  ai_cause: CauseBucket;
  ai_confidence: number;
  ai_summary: string;
  covered: boolean;
  payout_wei: string;
  status: ClaimStatus;
  filed_at_block: number;
}

export interface ProtocolParams {
  owner: string;
  min_coverage_wei: string;
  max_coverage_wei: string;
  reserve_wei: string;
  total_premiums_wei: string;
  total_payouts_wei: string;
  active_policy_count: number;
  total_policies: number;
  total_claims: number;
  duration_rates_bps: Record<string, number>;
}

export interface PremiumQuote {
  coverage_wei: string;
  duration_days: number;
  rate_bps: number;
  premium_wei: string;
}

export interface TransactionReceipt {
  status?: string;
  consensus_data?: any;
  txDataDecoded?: any;
  data?: any;
}
