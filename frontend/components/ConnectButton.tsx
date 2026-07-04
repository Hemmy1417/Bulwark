"use client";

import { useState } from "react";
import { Wallet, LogOut, Copy } from "lucide-react";
import { useWallet } from "@/lib/genlayer/wallet";
import { shortAddr } from "@/lib/utils";
import { success } from "@/lib/toast";

export function ConnectButton() {
  const { address, isConnected, connecting, wallets, hasWallet, connect, disconnect } = useWallet();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <button
          className="btn btn-ghost mono text-xs"
          onClick={() => {
            navigator.clipboard.writeText(address);
            success("Address copied");
          }}
          title="Copy address"
        >
          <Copy className="w-3 h-3" />
          {shortAddr(address)}
        </button>
        <button className="btn btn-ghost" onClick={disconnect} title="Disconnect">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const doConnect = async () => {
    if (wallets.length > 1) {
      setPickerOpen(true);
      return;
    }
    try {
      await connect();
    } catch (e: any) {
      alert(e?.message ?? "Failed to connect");
    }
  };

  return (
    <>
      <button
        className="btn btn-gold"
        onClick={doConnect}
        disabled={connecting || !hasWallet}
        title={!hasWallet ? "Install MetaMask or another browser wallet" : ""}
      >
        <Wallet className="w-4 h-4" />
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>

      {pickerOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="card-strong p-5 min-w-[280px] max-w-[340px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="eyebrow mb-3">Select wallet</div>
            <div className="space-y-2">
              {wallets.map((w) => (
                <button
                  key={w.info.uuid}
                  className="btn btn-ghost w-full justify-start"
                  onClick={async () => {
                    setPickerOpen(false);
                    try {
                      await connect(w);
                    } catch (e: any) {
                      alert(e?.message ?? "Failed to connect");
                    }
                  }}
                >
                  {w.info.icon && (
                    <img src={w.info.icon} alt="" className="w-5 h-5 rounded" />
                  )}
                  {w.info.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
