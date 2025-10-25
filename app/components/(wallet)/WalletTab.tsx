"use client";

import dynamic from "next/dynamic";

// Dynamically import the wallet content component
const WalletEmbeddedContent = dynamic(
  () => import("@/components/(wallet)/WalletEmbeddedContent"),
  { ssr: false }
);

export default function WalletTab() {
  return (
    <div className="w-full px-2 sm:px-4">
      <WalletEmbeddedContent />
    </div>
  );
}
