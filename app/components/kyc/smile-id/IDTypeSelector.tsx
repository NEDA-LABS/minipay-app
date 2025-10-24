'use client';

/**
 * ID Type Selector Component for Smile ID
 */

import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/compliance/user/lib/utils';

interface IDType {
  type: string;
  verificationMethod: 'doc_verification' | 'biometric_kyc';
}

interface IDTypeSelectorProps {
  country: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function IDTypeSelector({ country, value, onChange, disabled }: IDTypeSelectorProps) {
  const [idTypes, setIdTypes] = useState<IDType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (country) {
      fetchIdTypes();
    } else {
      setIdTypes([]);
      onChange('');
    }
  }, [country]);

  const fetchIdTypes = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/kyc/smile-id/supported-types?country=${country}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const countryData = data.data.continents
          .flatMap((continent: any) => continent.countries)
          .find((c: any) => c.code === country);

        if (countryData) {
          setIdTypes(countryData.id_types || []);
        } else {
          setIdTypes([]);
        }
      } else {
        setError('Failed to load ID types');
      }
    } catch (error) {
      console.error('Failed to fetch ID types:', error);
      setError('Failed to load ID types');
    } finally {
      setLoading(false);
    }
  };

  const formatIdTypeName = (type: string): string => {
    return type
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getVerificationMethodBadge = (method: string) => {
    if (method === 'biometric_kyc') {
      return <Badge className="ml-2 text-xs bg-purple-500/20 text-purple-200 border-purple-500/30">Biometric</Badge>;
    }
    return <Badge className="ml-2 text-xs bg-blue-500/20 text-blue-200 border-blue-500/30">Document</Badge>;
  };

  const selectedIdType = idTypes.find(t => t.type === value);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-200">ID Type</Label>
        <div className="flex items-center justify-center p-3 border border-slate-600 rounded-lg bg-slate-800/50">
          <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-400" />
          <span className="text-sm text-slate-400">Loading ID types...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-200">ID Type</Label>
        <div className="p-3 border border-red-500/30 rounded-lg bg-red-500/10 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (idTypes.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-200">ID Type</Label>
        <div className="p-3 border border-slate-600 rounded-lg bg-slate-800/50 text-sm text-slate-400">
          No ID types available for the selected country
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-slate-200">ID Type</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between bg-slate-800/50 border-slate-600 hover:bg-slate-800 hover:border-slate-500 text-slate-200"
          >
            {selectedIdType ? (
              <div className="flex items-center gap-2">
                <span>{formatIdTypeName(selectedIdType.type)}</span>
                {getVerificationMethodBadge(selectedIdType.verificationMethod)}
              </div>
            ) : (
              'Select ID type...'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-slate-800 border-slate-600" align="start">
          <div className="max-h-60 overflow-y-auto">
            {idTypes.map((idType) => (
              <button
                key={idType.type}
                onClick={() => {
                  onChange(idType.type);
                  setOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-3 text-left text-sm hover:bg-slate-700 flex items-center justify-between transition-colors border-b border-slate-700 last:border-b-0',
                  value === idType.type && 'bg-slate-700'
                )}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-slate-200">{formatIdTypeName(idType.type)}</span>
                  {getVerificationMethodBadge(idType.verificationMethod)}
                </div>
                {value === idType.type && (
                  <Check className="h-4 w-4 text-blue-400 ml-2" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
      {value && selectedIdType && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-300 mb-1">
            Verification Method
          </p>
          <p className="text-sm text-slate-400">
            {selectedIdType.verificationMethod === 'biometric_kyc' ? (
              <span>Biometric verification required <span className="text-slate-500">(document + selfie)</span></span>
            ) : (
              <span>Document verification only</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
