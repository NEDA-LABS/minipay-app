'use client';

/**
 * Country Selector Component for Smile ID
 */

import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/compliance/user/lib/utils';

interface Country {
  name: string;
  code: string;
}

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CountrySelector({ value, onChange, disabled }: CountrySelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/kyc/smile-id/supported-types');
      const data = await response.json();

      if (response.ok && data.success) {
        const uniqueCountries: Country[] = [];
        const countryMap = new Map<string, Country>();

        data.data.continents.forEach((continent: any) => {
          continent.countries.forEach((country: any) => {
            if (!countryMap.has(country.code)) {
              countryMap.set(country.code, {
                name: country.name,
                code: country.code,
              });
            }
          });
        });

        const sortedCountries = Array.from(countryMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );

        setCountries(sortedCountries);
      } else {
        setError('Failed to load countries');
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      setError('Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(search.toLowerCase()) ||
    country.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCountry = countries.find((c) => c.code === value);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-200">Country</Label>
        <div className="flex items-center justify-center p-3 border border-slate-600 rounded-lg bg-slate-800/50">
          <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-400" />
          <span className="text-sm text-slate-400">Loading countries...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-200">Country</Label>
        <div className="p-3 border border-red-500/30 rounded-lg bg-red-500/10 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-200">Country</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between bg-slate-800/50 border-slate-600 hover:bg-slate-800 hover:border-slate-500 text-slate-200"
          >
            {selectedCountry ? selectedCountry.name : 'Select country...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-slate-800 border-slate-600" align="start">
          <div className="p-2 border-b border-slate-700">
            <Input
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-400"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-center text-sm text-slate-400">
                No countries found.
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    onChange(country.code);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-slate-700 flex items-center justify-between transition-colors',
                    value === country.code && 'bg-slate-700'
                  )}
                >
                  <span className="text-slate-200">{country.name}</span>
                  {value === country.code && (
                    <Check className="h-4 w-4 text-blue-400" />
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
