"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronRight, Globe } from "lucide-react";

interface Country {
  id: string;
  name: string;
  flag: string;
}

const countries: Country[] = [
  {
    id: "tanzania",
    name: "Tanzania",
    flag: "🇹🇿",
  },
  {
    id: "nigeria",
    name: "Nigeria",
    flag: "🇳🇬",
  },
  {
    id: "kenya",
    name: "Kenya",
    flag: "🇰🇪",
  },
  {
    id: "uganda",
    name: "Uganda",
    flag: "🇺🇬",
  },
];

interface DepositTabProps {
  walletAddress?: string;
}

export default function DepositTab({ walletAddress }: DepositTabProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  // Coming Soon View
  if (selectedCountry) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedCountry(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to country selection</span>
        </button>

        <Card className="bg-slate-800/60 border-slate-700/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-slate-700/30 rounded-full flex items-center justify-center mb-2">
              <span className="text-5xl">{selectedCountry.flag}</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Feature Coming Soon</h2>
              <p className="text-slate-400 max-w-xs mx-auto">
                Deposits for <span className="text-white font-medium">{selectedCountry.name}</span> are currently under development. Please check back later!
              </p>
            </div>

            <button
              onClick={() => setSelectedCountry(null)}
              className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full text-sm font-medium transition-colors"
            >
              Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Country Selection View
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl !rounded-3xl overflow-hidden">
        <CardContent className="p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Select Country</h1>
              <p className="text-xs text-slate-400">Choose where you are depositing from</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {countries.map((country) => (
              <button
                key={country.id}
                onClick={() => setSelectedCountry(country)}
                className="group relative p-4 rounded-2xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800/80 hover:border-emerald-500/50 transition-all duration-300 text-left flex items-center justify-center active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl drop-shadow-md">{country.flag}</span>
                  <span className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {country.name}
                  </span>
                </div>
                {/* <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" /> */}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
