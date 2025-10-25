"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const BridgePage = dynamic(() => import("../page").then((mod) => mod.BridgePageContent), {
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  ),
  ssr: false
});

interface BridgeTabProps {
  walletAddress?: string;
}

export default function BridgeTab({ walletAddress }: BridgeTabProps) {
  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <BridgePage />
      </motion.div>
    </div>
  );
}
