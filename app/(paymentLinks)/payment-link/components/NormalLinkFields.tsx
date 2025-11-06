import { DEFAULT_CHAIN } from "../utils/chains";
import { stablecoins } from "@/data/stablecoins";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { useMemo, useEffect } from 'react';

// A placeholder for the actual stablecoin type.
interface Stablecoin {
  baseToken: string;
  [key: string]: any; // Allow other properties
}

interface NormalLinkFieldsProps {
  formData: {
    specifyChain: boolean;
    chainId: number;
    specifyCurrency: boolean;
    currency: string;
  };
  onUpdate: (updates: Partial<NormalLinkFieldsProps['formData']>) => void;
}

export const NormalLinkFields: React.FC<NormalLinkFieldsProps> = ({
  formData,
  onUpdate,
}) => {
  // MiniPay only uses Celo - auto-set chain in background
  useEffect(() => {
    if (formData.chainId !== DEFAULT_CHAIN.id) {
      onUpdate({ chainId: DEFAULT_CHAIN.id, specifyChain: true });
    }
  }, []);

  // Filter stablecoins to only show those available on Celo
  const filteredStablecoins = useMemo(() => {
    return stablecoins.filter(coin => 
      Array.isArray(coin.chainIds) && coin.chainIds.includes(DEFAULT_CHAIN.id)
    );
  }, []);

  useEffect(() => {
    if (formData.currency && !filteredStablecoins.some(c => c.baseToken === formData.currency)) {
      onUpdate({ currency: '' });
    }
  }, [filteredStablecoins, formData.currency, onUpdate]);

  return (
    <div className="space-y-3">
      {/* Network info - Display only, not selectable */}
      <div className="rounded-lg border border-slate-700/30 bg-slate-900/30 p-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Image src={DEFAULT_CHAIN.icon} alt={DEFAULT_CHAIN.name} width={24} height={24} className="rounded-full"/>
          <div>
            <Label className="text-xs text-slate-400">Payment Network</Label>
            <p className="text-sm font-semibold text-white">{DEFAULT_CHAIN.name}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-700/30 bg-slate-900/30 p-3 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="specifyCurrency"
            checked={formData.specifyCurrency}
            onCheckedChange={(checked: boolean) => onUpdate({ specifyCurrency: checked })}
            className="h-5 w-5 rounded border-slate-600 bg-slate-800/50 text-blue-500 focus:ring-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
          />
          <Label htmlFor="specifyCurrency" className="text-sm font-semibold text-white">
            Specify Stablecoin?
          </Label>
        </div>
        {formData.specifyCurrency && (
          <div className="pl-6">
            <Label htmlFor="currency" className="block text-xs sm:text-sm font-semibold text-white mb-2">
              Currency
            </Label>
            <Select
              value={formData.currency}
              onValueChange={(value: string) => onUpdate({ currency: value })}
            >
              <SelectTrigger id="currency" className="w-full h-11 sm:h-12 text-sm sm:text-base bg-slate-800/50 border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white">
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/80 backdrop-blur-md border-slate-700 text-white rounded-xl">
                {filteredStablecoins.map((coin) => (
                  <SelectItem key={coin.baseToken} value={coin.baseToken} className="focus:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Image src={coin.flag} alt={coin.name} width={24} height={24} className="rounded-full"/>
                      <span>{coin.baseToken}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};