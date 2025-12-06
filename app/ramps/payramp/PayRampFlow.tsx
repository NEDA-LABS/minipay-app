import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface PayRampFlowProps {
  walletAddress?: string;
  selectedToken?: any;
}

export function PayRampFlow({ walletAddress, selectedToken }: PayRampFlowProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-6 text-center">
        <h3 className="text-white font-semibold mb-2">PayRamp Deposit</h3>
        <p className="text-slate-400 text-sm">
          Deposit flow for {selectedToken?.symbol || 'tokens'} coming soon.
        </p>
      </CardContent>
    </Card>
  );
}
