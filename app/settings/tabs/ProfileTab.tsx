'use client';

import { SettingsDto } from '../utils/types';

type Props = {
  data: Pick<SettingsDto,
    'businessName' | 'businessEmail' | 'businessPhone' |
    'businessCategory' | 'businessDescription'
  >;
  onChange: (delta: Partial<SettingsDto>) => void;
  onSave: () => void;
  isSaving: boolean;
};

export default function ProfileTab({ data, onChange, onSave, isSaving }: Props) {
  const handleSave = () => {
    // Validate required fields
    if (!data.businessName?.trim()) {
      alert('User Name is required');
      return;
    }
    onSave();
  };

  return (
    <>
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">Profile</h2>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              User Name <span className="text-red-400 text-xs">*</span>
            </label>
            <input
              type="text"
              className="w-full p-2.5 text-sm border border-slate-600 rounded-lg bg-slate-800/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="Enter your name"
              value={data.businessName}
              onChange={(e) => onChange({ businessName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Email <span className="text-slate-500 text-xs font-normal">(optional)</span>
            </label>
            <input
              type="email"
              className="w-full p-2.5 text-sm border border-slate-600 rounded-lg bg-slate-800/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="your@email.com"
              value={data.businessEmail}
              onChange={(e) => onChange({ businessEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Phone <span className="text-slate-500 text-xs font-normal">(optional)</span>
            </label>
            <input
              type="text"
              className="w-full p-2.5 text-sm border border-slate-600 rounded-lg bg-slate-800/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="+1 234 567 8900"
              value={data.businessPhone}
              onChange={(e) => onChange({ businessPhone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Business Category <span className="text-slate-500 text-xs font-normal">(optional)</span>
            </label>
            <select
              className="w-full p-2.5 text-sm border border-slate-600 rounded-lg bg-slate-800/50 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              value={data.businessCategory}
              onChange={(e) => onChange({ businessCategory: e.target.value })}
            >
              <option value="retail">Retail</option>
              <option value="food">Food & Beverage</option>
              <option value="services">Services</option>
              <option value="technology">Technology</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Business Description <span className="text-slate-500 text-xs font-normal">(optional)</span>
            </label>
            <textarea
              className="w-full p-2.5 text-sm border border-slate-600 rounded-lg bg-slate-800/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              rows={2}
              placeholder="Tell us about your business..."
              value={data.businessDescription}
              onChange={(e) => onChange({ businessDescription: e.target.value })}
            />
          </div>
          <div className="pt-4 border-t border-slate-700">
            <button
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-semibold py-2.5 px-5 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}