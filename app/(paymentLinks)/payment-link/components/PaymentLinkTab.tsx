"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PaymentLinkForm } from "./PaymentLinkForm";

interface PaymentLinkTabProps {
  walletAddress?: string;
}

export default function PaymentLinkTab({ walletAddress }: PaymentLinkTabProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isClient && <PaymentLinkForm />}
      </motion.div>
    </div>
  );
}
