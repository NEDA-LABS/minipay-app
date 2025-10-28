'use client'

import { useMemo, useState, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import useSWR from 'swr'
import Shell from '@/dashboard/referrals/components/Shell'
import { StatGrid, StatCard } from '@/dashboard/referrals/components/DataCards'
// import { BarByCurrency } from '@/dashboard/referrals/components/Charts'
import InfluencerDetailsModal from './InfluencerDetailsModal'
import DisbursementDialog from './DisbursementDialog'
import { UserCheck, DollarSign } from 'lucide-react'

function formatCurrencyList(arr: Array<{ currency: string; total: number }>) {
  if (!arr?.length) return '—'
  return arr.map((x) => `${x.total} ${x.currency}`).join(' · ')
}

export default function Referrals() {
  const { getAccessToken } = usePrivy()
  
  // Authenticated fetcher for admin endpoints
  const authenticatedFetcher = async (url: string) => {
    const token = await getAccessToken()
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  }
  
  const { data, isLoading, error } = useSWR('/api/referral/analytics/all', authenticatedFetcher)
  const totals =
    data?.totals || { influencers: 0, totalReferrals: 0, offrampTxCount: 0, offrampVolumeByCurrency: [] }

  const rows = useMemo(() => data?.rows || [], [data])

  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [disbursementOpen, setDisbursementOpen] = useState(false)
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null)
  const [pendingEarnings, setPendingEarnings] = useState<any[]>([])

  const openDetails = (code: string) => {
    setSelectedCode(code)
    setModalOpen(true)
  }

  const openDisbursement = useCallback(async (influencer: any) => {
    setSelectedInfluencer(influencer)
    
    // Fetch pending earnings for this influencer
    try {
      const token = await getAccessToken()
      const res = await fetch(
        `/api/admin/disbursement/earnings?influencerProfileId=${influencer.influencerProfileId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      if (res.ok) {
        const data = await res.json()
        setPendingEarnings(data.pendingEarnings || [])
        setDisbursementOpen(true)
      } else {
        console.error('Failed to fetch earnings:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
    }
  }, [getAccessToken])

  return (
    <Shell title="Admin – Influencer Analytics">
      {error && <div className="card p-4 text-red-400">{String(error)}</div>}
      {isLoading && <div className="card p-4">Loading…</div>}

      {data && (
        <>
          <StatGrid>
            <StatCard label="Influencers" value={totals.influencers} />
            <StatCard label="Total Referrals" value={totals.totalReferrals} />
            {/* <StatCard label="Off-ramp Tx" value={totals.offrampTxCount} />
            <StatCard label="Currencies" value={totals.offrampVolumeByCurrency.length} /> */}
          </StatGrid>

          {/* <BarByCurrency data={totals.offrampVolumeByCurrency} /> */}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="py-2 pr-3">Influencer</th>
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Wallet</th>
                  <th className="py-2 pr-3">Referrals</th>
                  <th className="py-2 pr-3">Off-ramp Tx</th>
                  <th className="py-2 pr-3">Volume by Currency</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.code} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 pr-3">
                      <button
                        className="underline decoration-dotted hover:decoration-solid hover:text-white/90"
                        onClick={() => openDetails(r.code)}
                        title="View influencer details"
                      >
                        {r.influencer}
                      </button>
                    </td>
                    <td className="py-2 pr-3 font-mono">{r.code}</td>
                    <td className="py-2 pr-3 font-mono">{r.email || '—'}</td>
                    <td className="py-2 pr-3 font-mono break-all">{r.wallet || '—'}</td>
                    <td className="py-2 pr-3">{r.referrals}</td>
                    <td className="py-2 pr-3">{r.offrampTx}</td>
                    <td className="py-2 pr-3">{formatCurrencyList(r.volumeByCurrency)}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => openDisbursement({
                          influencerProfileId: r.influencerProfileId,
                          displayName: r.influencer,
                          code: r.code,
                          wallet: r.wallet
                        })}
                        disabled={!r.wallet}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title={r.wallet ? 'Pay earnings' : 'No wallet address'}
                      >
                        <DollarSign className="w-3 h-3" />
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td className="py-6 text-center text-gray-500" colSpan={8}>
                      No data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-gray-500 bg-slate-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-3 h-3" />
              <span className="font-medium">Eligibility Criteria:</span>
            </div>
            <div>Referral earnings require: (1) Referrer KYC verified, (2) Referral KYC completed, (3) Referral's first settled off-ramp transaction</div>
          </div>

          <InfluencerDetailsModal
            code={selectedCode}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
          />

          <DisbursementDialog
            open={disbursementOpen}
            onClose={() => {
              setDisbursementOpen(false)
              setSelectedInfluencer(null)
              setPendingEarnings([])
            }}
            influencer={selectedInfluencer}
            pendingEarnings={pendingEarnings}
          />
        </>
      )}
    </Shell>
  )
}
