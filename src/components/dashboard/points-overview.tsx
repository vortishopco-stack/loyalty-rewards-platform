'use client'

import { useAuthStore } from '@/store/auth-store'
import { useT } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Coins, Star, TrendingUp, Flame } from 'lucide-react'

interface PointsOverviewProps {
  onRefresh: () => void
}

export function PointsOverview({ onRefresh }: PointsOverviewProps) {
  const { user } = useAuthStore()
  const { t, locale } = useT()

  return (
    <div className="space-y-4">
      {/* Main Points Card */}
      <Card className="glass-card border-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-teal-600/10 to-blue-600/20" />
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('yourPoints')}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 bg-clip-text text-transparent animate-count-up">
                  {user?.points || 0}
                </span>
                <Coins className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-yellow-400" />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="glass-card p-3 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-muted-foreground">{t('totalVisits')}</span>
              </div>
              <p className="text-xl font-bold">{user?.totalVisits || 0}</p>
            </div>
            <div className="glass-card p-3 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs text-muted-foreground">{t('memberSince')}</span>
              </div>
              <p className="text-sm font-bold">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', year: 'numeric' }) : t('now')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
