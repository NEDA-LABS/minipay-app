'use client'

import * as React from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { parseUnits } from 'viem'
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  influencer: {
    id: string
    displayName: string
    wallet: string | null
    code: string
  } | null
  pendingEarnings: Array<{
    currency: string
    amount: number
    earningIds: string[]
  }>
}

export default function DisbursementDialog({ open, onClose, influencer, pendingEarnings }: Props) {
  const { user, getAccessToken, sendTransaction } = usePrivy()
  
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>('')
  const [amount, setAmount] = React.useState<string>('')
  const [notes, setNotes] = React.useState<string>('')
  const [status, setStatus] = React.useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = React.useState<string>('')
  const [txHash, setTxHash] = React.useState<string>('')

  React.useEffect(() => {
    if (open && pendingEarnings.length > 0) {
      // Auto-select first currency with pending earnings
      setSelectedCurrency(pendingEarnings[0].currency)
      setAmount(pendingEarnings[0].amount.toFixed(6))
    }
  }, [open, pendingEarnings])

  React.useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setStatus('idle')
      setErrorMsg('')
      setTxHash('')
      setNotes('')
    }
  }, [open])

  const selectedEarning = pendingEarnings.find(e => e.currency === selectedCurrency)

  const handleDisbursement = async () => {
    if (!influencer?.wallet || !selectedCurrency || !amount) {
      setErrorMsg('Missing required information')
      return
    }

    try {
      setStatus('processing')
      setErrorMsg('')

      const token = await getAccessToken()
      
      // Get token contract address and decimals
      const tokenInfoRes = await fetch(`/api/admin/disbursement/token-info?currency=${selectedCurrency}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!tokenInfoRes.ok) {
        throw new Error('Failed to get token information')
      }
      
      const tokenInfo = await tokenInfoRes.json()
      const { contractAddress, decimals, chainId } = tokenInfo

      // Send transaction using Privy
      const amountWei = parseUnits(amount, decimals)
      
      // For ERC20 transfer, we need to encode the transfer function call
      // transfer(address to, uint256 amount)
      const transferData = `0xa9059cbb${influencer.wallet.slice(2).padStart(64, '0')}${amountWei.toString(16).padStart(64, '0')}`

      const result = await sendTransaction({
        to: contractAddress,
        data: transferData as `0x${string}`,
        chainId: chainId,
      })

      const txHash = result.hash
      setTxHash(txHash)

      // Record disbursement in database
      const recordRes = await fetch('/api/admin/disbursement/record', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          influencerProfileId: influencer.id,
          amount,
          currency: selectedCurrency,
          transactionHash: txHash,
          recipientAddress: influencer.wallet,
          notes,
          earningIds: selectedEarning?.earningIds || []
        })
      })

      if (!recordRes.ok) {
        throw new Error('Failed to record disbursement')
      }

      setStatus('success')
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose()
      }, 3000)

    } catch (error: any) {
      console.error('Disbursement error:', error)
      setStatus('error')
      setErrorMsg(error.message || 'Failed to process disbursement')
    }
  }

  if (!open || !influencer) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-[101] w-[95vw] md:w-[600px] rounded-2xl bg-neutral-900 shadow-2xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-xl font-semibold text-white">Disburse Earnings</h3>
            <p className="text-sm text-gray-400 mt-1">
              Pay {influencer.displayName} ({influencer.code})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors"
            disabled={status === 'processing'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Wallet Address */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Recipient Wallet</label>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-4 py-3">
              <p className="text-sm font-mono break-all text-white">
                {influencer.wallet || 'No wallet address'}
              </p>
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Currency</label>
            <select
              value={selectedCurrency}
              onChange={(e) => {
                setSelectedCurrency(e.target.value)
                const earning = pendingEarnings.find(x => x.currency === e.target.value)
                if (earning) setAmount(earning.amount.toFixed(6))
              }}
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-4 py-3 text-white"
              disabled={status === 'processing'}
            >
              {pendingEarnings.map(e => (
                <option key={e.currency} value={e.currency}>
                  {e.currency} - {e.amount.toFixed(6)} pending
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Amount</label>
            <input
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={selectedEarning?.amount || 0}
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-4 py-3 text-white"
              placeholder="0.00"
              disabled={status === 'processing'}
            />
            {selectedEarning && (
              <p className="text-xs text-gray-500 mt-1">
                Available: {selectedEarning.amount.toFixed(6)} {selectedCurrency}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-4 py-3 text-white resize-none"
              rows={3}
              placeholder="Add any notes about this disbursement..."
              disabled={status === 'processing'}
            />
          </div>

          {/* Status Messages */}
          {status === 'error' && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Error</p>
                <p className="text-sm text-red-300 mt-1">{errorMsg}</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-400">Success!</p>
                <p className="text-sm text-green-300 mt-1">
                  Disbursement completed successfully
                </p>
                {txHash && (
                  <p className="text-xs text-gray-400 mt-2 font-mono break-all">
                    TX: {txHash}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors"
            disabled={status === 'processing'}
          >
            Cancel
          </button>
          <button
            onClick={handleDisbursement}
            disabled={status === 'processing' || !influencer.wallet || !amount || status === 'success'}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {status === 'processing' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Pay Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
