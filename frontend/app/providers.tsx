"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { WalletProvider } from "@/lib/genlayer/wallet";

// React Query's default queryKey hasher calls JSON.stringify, which throws on
// BigInt. u256 fields arrive as BigInts from the contract wrapper, so we
// install a global toJSON shim once — same trick used across sibling apps.
if (typeof (BigInt.prototype as any).toJSON !== "function") {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 3000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <WalletProvider>
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#0B1F3A",
              border: "1px solid rgba(201, 169, 97, 0.25)",
              color: "#F3EEDF",
            },
          }}
        />
      </WalletProvider>
    </QueryClientProvider>
  );
}
