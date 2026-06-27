'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useT } from '@/lib/i18n'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gift, Coins, Store, Info } from 'lucide-react'

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  imageUrl: string
  available: boolean
}

interface RewardsStoreProps {
  onRefresh: () => void
}

export function RewardsStore({ onRefresh }: RewardsStoreProps) {
  const { user } = useAuthStore()
  const { t } = useT()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.getRewards()
      .then(data => setRewards(data.rewards))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-400" />
          {t('rewardsStore')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="w-full h-20 rounded-lg bg-white/5 mb-3" />
              <div className="h-4 bg-white/5 rounded mb-2" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            {t('rewardsStore')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('youHavePoints', { points: user?.points || 0 })}
          </p>
        </div>
      </div>

      {/* Info banner: staff-only redemption */}
      <div className="glass-card p-3 flex items-start gap-3 border-emerald-500/20">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('staffOnlyRedemption')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {rewards.map(reward => {
          const canAfford = (user?.points || 0) >= reward.pointsCost
          return (
            <Card key={reward.id} className={`glass-card border-0 overflow-hidden ${canAfford ? 'glass-card-hover' : 'opacity-60'}`}>
              <CardContent className="p-4">
                {/* Reward Icon */}
                <div className="w-full h-20 rounded-xl bg-gradient-to-br from-amber-500/10 to-emerald-500/10 flex items-center justify-center mb-3">
                  <Gift className="w-10 h-10 text-amber-400/50" />
                </div>

                <h3 className="font-semibold text-sm truncate">{reward.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{reward.description}</p>

                <div className="flex items-center gap-1 mt-2">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-400">{reward.pointsCost}</span>
                </div>

                {/* Ask staff badge (view-only, no redemption) */}
                <div className={`w-full mt-3 h-8 rounded-lg flex items-center justify-center gap-1.5 text-xs ${
                  canAfford
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'glass-card text-muted-foreground'
                }`}>
                  {canAfford ? (
                    <>
                      <Store className="w-3 h-3" />
                      {t('askStaffToRedeem')}
                    </>
                  ) : (
                    <>
                      <Coins className="w-3 h-3" />
                      {t('locked')}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
