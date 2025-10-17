"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface BridgeTabProps {
  walletAddress?: string;
}

export default function BridgeTab({ walletAddress }: BridgeTabProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <iframe
          src="/accross-bridge?embedded=true"
          className="w-full h-[850px] border-0 rounded-3xl"
          title="Cross-Chain Bridge"
          style={{ colorScheme: 'dark', background: 'transparent' }}
        />
      </motion.div>
    </div>
  );
}
