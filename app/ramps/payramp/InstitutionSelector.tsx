'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, Smartphone, Building2 } from 'lucide-react';
import { cn } from '@/compliance/user/lib/utils';

interface Institution {
  name: string;
  code: string;
  type: string | 'mobile_money' | 'bank';
}

interface InstitutionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  institutions: Institution[];
  disabled?: boolean;
  onFocus?: () => void;
  fiat?: string;
}

export function InstitutionSelector({
  value,
  onChange,
  institutions,
  disabled = false,
  onFocus,
  fiat,
}: InstitutionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedInstitution = institutions.find((i) => i.code === value);

  // Group institutions by type
  const groupedInstitutions = institutions.reduce(
    (acc, inst) => {
      if (inst.type === 'mobile_money') {
        acc.mobile_money.push(inst);
      } else {
        acc.bank.push(inst);
      }
      return acc;
    },
    { mobile_money: [] as Institution[], bank: [] as Institution[] }
  );

  // Sort institutions
  const sortedMobileMoneyInstitutions = groupedInstitutions.mobile_money.sort((a, b) => {
    // For Kenyan institutions, put MPESA first
    if (fiat === 'KES') {
      if (a.name.toLowerCase().includes('mpesa') || a.name.toLowerCase().includes('m-pesa')) return -1;
      if (b.name.toLowerCase().includes('mpesa') || b.name.toLowerCase().includes('m-pesa')) return 1;
    }
    return a.name.localeCompare(b.name);
  });

  const sortedBankInstitutions = groupedInstitutions.bank.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Filter institutions based on search
  const filteredMobileMoneyInstitutions = sortedMobileMoneyInstitutions.filter((inst) =>
    inst.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBankInstitutions = sortedBankInstitutions.filter((inst) =>
    inst.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (code: string) => {
    onChange(code);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-100">
        Choose Bank or Mobile Network
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            onClick={onFocus}
            className="w-full justify-between bg-gray-100 border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-900 h-10 sm:h-12 rounded-xl"
          >
            <span className="truncate">
              {selectedInstitution ? selectedInstitution.name : 'Select Institution'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-slate-800 border-slate-700" align="start">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
            <Input
              placeholder="Search institutions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-400"
            />
          </div>

          {/* Institutions List */}
          <div className="max-h-72 overflow-y-auto">
            {/* Mobile Money Section */}
            {filteredMobileMoneyInstitutions.length > 0 && (
              <div>
                {/* Mobile Money Header */}
                <div className="px-3 py-2 bg-slate-800 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-semibold text-slate-300">Mobile Money</span>
                  </div>
                </div>

                {/* Mobile Money Items */}
                {filteredMobileMoneyInstitutions.map((inst) => (
                  <button
                    key={inst.code}
                    onClick={() => handleSelect(inst.code)}
                    className={cn(
                      'w-full px-3 py-3 text-left text-sm hover:bg-slate-700 flex items-center justify-between transition-colors border-b border-slate-700 last:border-b-0',
                      value === inst.code && 'bg-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Smartphone className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">{inst.name}</span>
                    </div>
                    {value === inst.code && <Check className="h-4 w-4 text-blue-400 ml-2" />}
                  </button>
                ))}
              </div>
            )}

            {/* Banks Section */}
            {filteredBankInstitutions.length > 0 && (
              <div>
                {/* Banks Header */}
                <div className="px-3 py-2 bg-slate-800 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-300">Banks</span>
                  </div>
                </div>

                {/* Banks Items */}
                {filteredBankInstitutions.map((inst) => (
                  <button
                    key={inst.code}
                    onClick={() => handleSelect(inst.code)}
                    className={cn(
                      'w-full px-3 py-3 text-left text-sm hover:bg-slate-700 flex items-center justify-between transition-colors border-b border-slate-700 last:border-b-0',
                      value === inst.code && 'bg-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Building2 className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      <span className="text-slate-200">{inst.name}</span>
                    </div>
                    {value === inst.code && <Check className="h-4 w-4 text-blue-400 ml-2" />}
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {filteredMobileMoneyInstitutions.length === 0 && filteredBankInstitutions.length === 0 && (
              <div className="p-4 text-center text-sm text-slate-400">
                No institutions found
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
