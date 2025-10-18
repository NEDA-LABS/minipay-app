'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  DollarSign,
  Globe,
  Users,
  Wrench
} from 'lucide-react';

interface BankWithdrawalSettings {
  TZS: boolean;
  KES: boolean;
  UGX: boolean;
  NGN: boolean;
  GHS: boolean;
}

interface AdminSettingsData {
  id: string;
  allowBankWithdrawals: BankWithdrawalSettings;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  updatedAt: string;
  lastModifiedBy?: string;
}

const CURRENCIES = [
  { code: 'TZS', name: 'Tanzanian Shilling', flag: '🇹🇿', country: 'Tanzania' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪', country: 'Kenya' },
  { code: 'UGX', name: 'Ugandan Shilling', flag: '🇺🇬', country: 'Uganda' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬', country: 'Nigeria' },
  { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭', country: 'Ghana' },
];

export default function SystemSettings() {
  const [settings, setSettings] = useState<AdminSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Local state for form
  const [bankWithdrawals, setBankWithdrawals] = useState<BankWithdrawalSettings>({
    TZS: false,
    KES: true,
    UGX: true,
    NGN: true,
    GHS: true,
  });
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowNewRegistrations, setAllowNewRegistrations] = useState(true);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (data.success && data.settings) {
        setSettings(data.settings);
        setBankWithdrawals(data.settings.allowBankWithdrawals);
        setMaintenanceMode(data.settings.maintenanceMode);
        setAllowNewRegistrations(data.settings.allowNewRegistrations);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allowBankWithdrawals: bankWithdrawals,
          maintenanceMode,
          allowNewRegistrations,
          modifiedBy: 'admin', // You can replace this with actual admin user info
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  const toggleBankWithdrawal = (currency: keyof BankWithdrawalSettings) => {
    setBankWithdrawals(prev => ({
      ...prev,
      [currency]: !prev[currency],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-indigo-400" />
            System Settings
          </h2>
          <p className="text-slate-400 mt-1">
            Configure platform features and payment options
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Bank Withdrawal Controls */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <DollarSign className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Bank Withdrawal Controls</h3>
            <p className="text-sm text-slate-400">
              Enable or disable bank transfers for Payramp/Paycrest by currency
            </p>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {CURRENCIES.map((currency) => (
            <div
              key={currency.code}
              className="flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-slate-700/40 hover:border-slate-600/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currency.flag}</span>
                <div>
                  <p className="font-medium text-white">{currency.country}</p>
                  <p className="text-sm text-slate-400">
                    {currency.name} ({currency.code})
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleBankWithdrawal(currency.code as keyof BankWithdrawalSettings)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  bankWithdrawals[currency.code as keyof BankWithdrawalSettings]
                    ? 'bg-indigo-600'
                    : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    bankWithdrawals[currency.code as keyof BankWithdrawalSettings]
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              When disabled, users will only see mobile money options for that currency. 
              Bank transfer options will be hidden from the withdrawal form.
            </span>
          </p>
        </div>
      </div>

      {/* Platform Controls */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Wrench className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Platform Controls</h3>
            <p className="text-sm text-slate-400">
              General platform feature toggles
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-slate-700/40">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-medium text-white">Maintenance Mode</p>
                <p className="text-sm text-slate-400">
                  Temporarily disable platform access for maintenance
                </p>
              </div>
            </div>

            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                maintenanceMode ? 'bg-orange-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Allow New Registrations */}
          <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-slate-700/40">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-medium text-white">New Registrations</p>
                <p className="text-sm text-slate-400">
                  Allow new users to register on the platform
                </p>
              </div>
            </div>

            <button
              onClick={() => setAllowNewRegistrations(!allowNewRegistrations)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                allowNewRegistrations ? 'bg-green-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  allowNewRegistrations ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Metadata */}
      {settings && (
        <div className="text-sm text-slate-500 flex items-center gap-4">
          <span>Last updated: {new Date(settings.updatedAt).toLocaleString()}</span>
          {settings.lastModifiedBy && (
            <span>Modified by: {settings.lastModifiedBy}</span>
          )}
        </div>
      )}
    </div>
  );
}
