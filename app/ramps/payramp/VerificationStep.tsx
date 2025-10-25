import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, ChevronDown, UserPlus } from 'lucide-react';
import ContactPicker from './ContactPicker';
import { InstitutionSelector } from './InstitutionSelector';
import { useContacts } from '../../hooks/useContacts';

interface VerificationStepProps {
  institution: string;
  setInstitution: (value: string) => void;
  accountIdentifier: string;
  setAccountIdentifier: (value: string) => void;
  accountName: string;
  setAccountName: (value: string) => void;
  isAccountVerified: boolean;
  setIsAccountVerified: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  handleVerifyAccount: () => void;
  institutions: Array<{ name: string; code: string; type: string }>;
  fetchInstitutions: () => void;
  fiat: string;
}

// Country codes for supported African countries
const COUNTRY_CODES = [
  { code: '+255', country: 'Tanzania', flag: '🇹🇿', currency: 'TZS' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪', currency: 'KES' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬', currency: 'UGX' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', currency: 'NGN' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭', currency: 'GHS' },
];

// Get country code based on currency
const getCountryCodeByCurrency = (currency: string) => {
  return COUNTRY_CODES.find(cc => cc.currency === currency)?.code || '+255';
};

const VerificationStep: React.FC<VerificationStepProps> = ({
  institution,
  setInstitution,
  accountIdentifier,
  setAccountIdentifier,
  accountName,
  setAccountName,
  isAccountVerified,
  setIsAccountVerified,
  isLoading,
  handleVerifyAccount,
  institutions,
  fetchInstitutions,
  fiat
}) => {
  const { createContact, isCreating } = useContacts();
  const isMobileNetwork = institution && institutions.find(i => i.code === institution)?.type === "mobile_money";

  
  // Mobile number specific states
  const [selectedCountryCode, setSelectedCountryCode] = useState(() => getCountryCodeByCurrency(fiat));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputError, setInputError] = useState('');
  
  // Contact saving states
  const [loadedFromContact, setLoadedFromContact] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Format phone number as user types with country-specific formatting
  const formatPhoneNumber = (value: string, countryCode: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Country-specific formatting
    switch (countryCode) {
      case '+254': // Kenya
        if (digits.length > 3 && digits.length <= 6) {
          return digits.replace(/(\d{3})(\d+)/, '$1 $2');
        } else if (digits.length > 6) {
          return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
        }
        break;
      case '+255': // Tanzania
        if (digits.length > 3 && digits.length <= 6) {
          return digits.replace(/(\d{3})(\d+)/, '$1 $2');
        } else if (digits.length > 6) {
          return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
        }
        break;
      case '+256': // Uganda
        if (digits.length > 3 && digits.length <= 6) {
          return digits.replace(/(\d{3})(\d+)/, '$1 $2');
        } else if (digits.length > 6) {
          return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
        }
        break;
      case '+234': // Nigeria
        if (digits.length > 3 && digits.length <= 7) {
          return digits.replace(/(\d{3})(\d+)/, '$1 $2');
        } else if (digits.length > 7) {
          return digits.replace(/(\d{3})(\d{4})(\d+)/, '$1 $2 $3');
        }
        break;
      case '+233': // Ghana
        if (digits.length > 2 && digits.length <= 5) {
          return digits.replace(/(\d{2})(\d+)/, '$1 $2');
        } else if (digits.length > 5) {
          return digits.replace(/(\d{2})(\d{3})(\d+)/, '$1 $2 $3');
        }
        break;
      default:
        // Generic formatting
        if (digits.length > 3 && digits.length <= 6) {
          return digits.replace(/(\d{3})(\d+)/, '$1 $2');
        } else if (digits.length > 6) {
          return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
        }
    }
    return digits;
  };

  // Validate phone number based on country
  const validatePhoneNumber = (digits: string, countryCode: string) => {
    const minLength = countryCode === '+233' ? 9 : 8; // Ghana has 9 digits, others 8+
    const maxLength = countryCode === '+234' ? 11 : 10; // Nigeria can have 11, others max 10
    
    if (digits.length > 0 && digits.length < minLength) {
      return 'Phone number is too short';
    } else if (digits.length > maxLength) {
      return 'Phone number is too long';
    }
    return '';
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Prevent input if it would exceed reasonable length
    const digits = value.replace(/\D/g, '');
    if (digits.length > 15) return;
    
    const formatted = formatPhoneNumber(value, selectedCountryCode);
    setPhoneNumber(formatted);
    
    // Clear previous errors
    setInputError('');
    
    // Update the parent component's accountIdentifier with full number
    const cleanDigits = formatted.replace(/\D/g, '');
    const fullNumber = selectedCountryCode + cleanDigits;
    setAccountIdentifier(fullNumber);
    
    // Validate phone number
    const validationError = validatePhoneNumber(cleanDigits, selectedCountryCode);
    if (validationError) {
      setInputError(validationError);
    }
    
    // Mark as manually entered
    setLoadedFromContact(false);
  };

  const handleRegularAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountIdentifier(e.target.value);
    setInputError('');
    // Mark as manually entered
    setLoadedFromContact(false);
  };

  const handleAccountNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountName(e.target.value);
    // Mark as manually entered
    setLoadedFromContact(false);
  };

  // Handle contact selection for mobile numbers
  const handleContactSelectPhone = (data: { accountName: string; phoneNumber?: string }) => {
    if (data.phoneNumber) {
      // Set the phone number (already stripped of country code by ContactPicker)
      const formatted = formatPhoneNumber(data.phoneNumber, selectedCountryCode);
      setPhoneNumber(formatted);
      
      // Update account identifier with full number
      const cleanDigits = data.phoneNumber.replace(/\D/g, '');
      const fullNumber = selectedCountryCode + cleanDigits;
      setAccountIdentifier(fullNumber);
      
      // Validate
      const validationError = validatePhoneNumber(cleanDigits, selectedCountryCode);
      setInputError(validationError || '');
    }
    
    if (data.accountName) {
      setAccountName(data.accountName);
    }
    
    // Mark that this data came from contacts
    setLoadedFromContact(true);
  };

  // Handle contact selection for bank accounts
  const handleContactSelectBank = (data: { accountName: string; accountNumber?: string; bankDetails?: any }) => {
    if (data.accountNumber) {
      setAccountIdentifier(data.accountNumber);
      setInputError('');
    }
    
    if (data.accountName) {
      setAccountName(data.accountName);
    }
    
    // Mark that this data came from contacts
    setLoadedFromContact(true);
  };

  // Save to contacts function using cached mutation
  const handleSaveToContacts = () => {
    const institutionName = institutions.find(i => i.code === institution)?.name || '';
    
    // Map currency to country code
    const currencyToCountry: Record<string, string> = {
      'TZS': 'TZ',
      'KES': 'KE',
      'UGX': 'UG',
      'NGN': 'NG',
      'GHS': 'GH',
      'IDR': 'ID',
    };
    
    const contactData: any = {
      name: accountName,
      country: currencyToCountry[fiat] || 'TZ',
    };

    if (isMobileNetwork) {
      // Save phone number with provider (institution name)
      contactData.phoneNumbers = [{
        phoneNumber: accountIdentifier,
        provider: institutionName,
        country: currencyToCountry[fiat] || 'TZ',
        isPrimary: true,
      }];
    } else {
      // Save bank account
      contactData.bankAccounts = [{
        bankName: institutionName,
        accountNumber: accountIdentifier,
        accountName: accountName,
        isPrimary: true,
      }];
    }

    // Use cached mutation - automatically updates cache
    createContact(contactData, {
      onSuccess: () => {
        setShowSaveDialog(false);
        setLoadedFromContact(true); // Prevent showing dialog again
      },
      onError: (error) => {
        console.error('Failed to save contact:', error);
      },
    });
  };

  // Wrapper for verification that shows save dialog
  const handleVerifyWithDialog = () => {
    handleVerifyAccount();
  };

  // Watch for verification success to show save dialog
  useEffect(() => {
    if (isAccountVerified && !loadedFromContact && accountName && accountIdentifier && institution) {
      // Small delay to ensure verification UI updates first
      const timer = setTimeout(() => {
        setShowSaveDialog(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAccountVerified, loadedFromContact, accountName, accountIdentifier, institution]);

  // Update country code and rebuild full number
  const handleCountryCodeChange = (newCode: string) => {
    setSelectedCountryCode(newCode);
    setIsDropdownOpen(false);
    
    // Reformat existing phone number with new country code
    if (phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, '');
      const reformatted = formatPhoneNumber(digits, newCode);
      setPhoneNumber(reformatted);
      
      const fullNumber = newCode + digits;
      setAccountIdentifier(fullNumber);
      
      // Revalidate with new country code
      const validationError = validatePhoneNumber(digits, newCode);
      setInputError(validationError);
    }
  };

  // Auto-select country code based on currency when switching to mobile network
  useEffect(() => {
    if (isMobileNetwork) {
      // Auto-select country code based on currency
      const currencyBasedCode = getCountryCodeByCurrency(fiat);
      setSelectedCountryCode(currencyBasedCode);
      
      // If there's an existing accountIdentifier, try to parse it
      if (accountIdentifier && accountIdentifier.startsWith('+')) {
        const countryCode = COUNTRY_CODES.find(cc => accountIdentifier.startsWith(cc.code));
        if (countryCode) {
          const remainingNumber = accountIdentifier.slice(countryCode.code.length);
          setPhoneNumber(formatPhoneNumber(remainingNumber, countryCode.code));
        }
      }
    } else if (!isMobileNetwork) {
      // Reset mobile-specific states when switching to bank
      setPhoneNumber('');
      setSelectedCountryCode(getCountryCodeByCurrency(fiat));
      setInputError('');
    }
  }, [isMobileNetwork, institution, fiat]);

  // Update country code when currency changes
  useEffect(() => {
    const currencyBasedCode = getCountryCodeByCurrency(fiat);
    setSelectedCountryCode(currencyBasedCode);
    
    // If there's an existing phone number, reformat it with the new country code
    if (phoneNumber && isMobileNetwork) {
      const digits = phoneNumber.replace(/\D/g, '');
      const reformatted = formatPhoneNumber(digits, currencyBasedCode);
      setPhoneNumber(reformatted);
      
      const fullNumber = currencyBasedCode + digits;
      setAccountIdentifier(fullNumber);
      
      // Revalidate with new country code
      const validationError = validatePhoneNumber(digits, currencyBasedCode);
      setInputError(validationError);
    }
  }, [fiat]);

  // Reset states when institution changes
  const handleInstitutionChange = (value: string) => {
    setInstitution(value);
    setAccountIdentifier("");
    setPhoneNumber('');
    setInputError('');
    setLoadedFromContact(false);
    setShowSaveDialog(false);
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedCountryCode);
  console.log("isAccountVerified vvv",isAccountVerified) //debugg
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <InstitutionSelector
          value={institution}
          onChange={handleInstitutionChange}
          institutions={institutions}
          disabled={isAccountVerified}
          onFocus={fetchInstitutions}
          fiat={fiat}
        />
        
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <label
              htmlFor="accountNumber"
              className="block text-xs sm:text-sm font-semibold text-gray-100"
            >
              {isMobileNetwork ? "Mobile Number" : "Bank Account Number"}
            </label>
            <ContactPicker
              mode={isMobileNetwork ? 'phone' : 'bank'}
              onSelectContact={isMobileNetwork ? handleContactSelectPhone : handleContactSelectBank}
              disabled={isAccountVerified}
            />
          </div>

          {isMobileNetwork ? (
            <div className="space-y-2">
              {/* Country Code + Phone Number Input */}
              <div className="flex">
                {/* Country Code Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 sm:py-3 bg-gray-200 border border-gray-300 border-r-0 rounded-l-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all min-w-[80px] sm:min-w-[100px]"
                    disabled={isAccountVerified}
                  >
                    <span className="text-base sm:text-lg">{selectedCountry?.flag}</span>
                    <span className="text-gray-900 font-medium text-xs sm:text-sm">{selectedCountryCode}</span>
                    <ChevronDown size={14} className="text-gray-600" />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && !isAccountVerified && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      {COUNTRY_CODES.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => handleCountryCodeChange(country.code)}
                          className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 text-left transition-colors"
                        >
                          <span className="text-base sm:text-lg">{country.flag}</span>
                          <span className="font-medium text-gray-900 text-xs sm:text-sm">{country.code}</span>
                          <span className="text-xs text-gray-600">{country.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Number Input */}
                <input
                  type="tel"
                  id="accountNumber"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className={`flex-1 w-50 md:w-full px-3 sm:px-4 py-2 sm:py-3 text-base text-gray-900 rounded-r-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100 placeholder:text-gray-500 ${
                    inputError ? 'border-red-400 focus:ring-red-400' : ''
                  }`}
                  placeholder="123 456 789"
                  required
                  disabled={isAccountVerified}
                />
              </div>

              {/* Full Number Preview */}
              {phoneNumber && (
                <div className="bg-gray-700/50 px-3 py-2 rounded-lg border border-gray-600">
                  <span className="text-xs text-gray-300">Full Number: </span>
                  <span className="text-sm font-mono text-white">{selectedCountryCode + phoneNumber.replace(/\D/g, '')}</span>
                </div>
              )}

              {/* Error Message */}
              {inputError && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-xs text-red-400">{inputError}</p>
                </div>
              )}

              {/* Help Text */}
              {/* <p className="text-xs text-gray-300 mt-1">
                Enter your mobile number without the country code
              </p> */}
            </div>
          ) : (
            <div>
              {/* Bank Account Input */}
              <input
                type="text"
                id="accountNumber"
                value={accountIdentifier}
                onChange={handleRegularAccountChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100 placeholder:text-gray-500"
                placeholder="1234567890"
                required
                disabled={isAccountVerified}
              />
              <p className="text-xs text-gray-300 mt-1">
                Enter full account number without spaces
              </p>
            </div>
          )}
        </div>
        
        <div>
          <label
            htmlFor="accountName"
            className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-100"
          >
            Account Holder Name
          </label>
          <input
            type="text"
            id="accountName"
            value={accountName}
            onChange={handleAccountNameChange}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100 placeholder:text-gray-500"
            placeholder="As it appears on your account"
            required
            disabled={isAccountVerified}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        {!isAccountVerified ? (
          <button
            type="button"
            onClick={handleVerifyWithDialog}
            disabled={
              isLoading ||
              !institution ||
              !accountIdentifier ||
              !accountName
              // (isMobileNetwork && inputError)
            }
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-base transform hover:-translate-y-0.5 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Account Details"
            )}
          </button>
        ) : (
          <div className="p-4 bg-gradient-to-r from-emerald-900/30 to-green-900/30 rounded-xl border border-emerald-700 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-400 font-medium text-sm">
                  Account verified successfully
                </p>
                <p className="text-emerald-500 text-xs mt-1">
                  {accountName} • {accountIdentifier}
                </p>
              </div>
            </div>
          </div>
        )}

        {isAccountVerified && (
          <button
            type="button"
            onClick={() => {
              setIsAccountVerified(false);
              setShowSaveDialog(false);
            }}
            className="w-full text-sm text-gray-100 hover:text-gray-300 underline transition-colors duration-200"
          >
            Edit account details
          </button>
        )}
      </div>

      {/* Save to Contacts Dialog */}
      {showSaveDialog && isAccountVerified && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <UserPlus className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Save to Contacts?
                </h3>
                <p className="text-sm text-slate-400">
                  Would you like to save these details to your contacts for faster transactions next time?
                </p>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Name:</span>
                <span className="text-white font-medium">{accountName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {isMobileNetwork ? 'Phone:' : 'Account:'}
                </span>
                <span className="text-white font-medium font-mono text-xs">
                  {accountIdentifier}
                </span>
              </div>
              {!isMobileNetwork && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Bank:</span>
                  <span className="text-white font-medium">
                    {institutions.find(i => i.code === institution)?.name}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all"
                disabled={isCreating}
              >
                No, Thanks
              </button>
              <button
                type="button"
                onClick={handleSaveToContacts}
                disabled={isCreating}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Contact'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* {isMobileNetwork && (
        <div className="p-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-lg border border-amber-700/50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-amber-400 text-xs">
              Mobile money transfers may have additional fees from the network provider.
            </p>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default VerificationStep;