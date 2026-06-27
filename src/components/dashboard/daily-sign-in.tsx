'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { useT } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Coins, Flame, Check, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DailySignInProps {
  onRefresh: () => void
}

export function DailySignIn({ onRefresh }: DailySignInProps) {
  const { updateUser } = useAuthStore()
  const { t, locale } = useT()
  const [status, setStatus] = useState<{
    claimedToday: boolean
    streak: number
    pointsAwarded: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [justClaimed, setJustClaimed] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getDailySignInStatus()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch daily sign-in status:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleClaim = async () => {
    if (claiming || status?.claimedToday) return
    setClaiming(true)
    try {
      const data = await api.claimDailySignIn()
      setJustClaimed(true)
      setShowAnimation(true)
      setStatus(prev => prev ? {
        ...prev,
        claimedToday: true,
        streak: data.streak || prev.streak + 1,
      } : { claimedToday: true, streak: data.streak || 1, pointsAwarded: data.points_awarded || 5 })

      // Refresh user data to update points
      const me = await api.getMe()
      const u = me.user
      updateUser({
        ...u,
        totalVisits: u.total_visits ?? u.totalVisits ?? 0,
        createdAt: u.created_at ?? u.createdAt,
        updatedAt: u.updated_at ?? u.updatedAt,
      })
      onRefresh()

      const streak = data.streak || 1
      toast.success(t('dailyPointsAwarded', { points: data.points_awarded || 5 }), {
        description: streak > 1 ? t('streakMessage', { streak }) : t('dailySignInClaimed'),
      })

      setTimeout(() => setShowAnimation(false), 2000)
    } catch (error: any) {
      toast.error(error.message || t('alreadyClaimed'))
    } finally {
      setClaiming(false)
    }
  }

  // Generate the 7-day week dots
  const renderWeekDots = () => {
    const isAr = locale === 'ar'
    const days = isAr ? ['إ', 'ث', 'أ', 'ر', 'خ', 'ج', 'س'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    const today = new Date()
    const dayOfWeek = today.getDay()
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    return (
      <div className="flex items-center justify-between gap-1">
        {days.map((day, i) => {
          const isPastOrToday = i <= adjustedDay
          const isToday = i === adjustedDay
          const filled = status ? (isToday ? status.claimedToday : isPastOrToday) : false

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  filled
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                    : isToday
                    ? 'border-2 border-dashed border-amber-400/60 text-amber-400'
                    : 'bg-white/5 text-muted-foreground'
                }`}
              >
                {filled ? (
                  <Check className="w-4 h-4" />
                ) : isToday ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  day
                )}
              </div>
              <span className={`text-[10px] ${isToday ? 'text-amber-400 font-bold' : 'text-muted-foreground'}`}>
                {day}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="glass-card border-0 overflow-hidden relative">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card border-0 overflow-hidden relative">
      {/* Animated background glow on claim */}
      {showAnimation && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-green-400/10 to-teal-500/20 animate-pulse pointer-events-none" />
      )}

      <CardContent className="relative p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/30 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{t('dailySignIn')}</h3>
              <p className="text-xs text-muted-foreground">{t('claimDailyReward')}</p>
            </div>
          </div>

          {/* Streak badge */}
          {(status?.streak || 0) > 1 && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500/20 to-amber-500/20 px-2.5 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">{t('dayStreak', { count: status?.streak })}</span>
            </div>
          )}
        </div>

        {/* Points reward display */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-4 py-2 rounded-full">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-lg font-bold text-yellow-400">+{status?.pointsAwarded || 5}</span>
            <span className="text-xs text-muted-foreground">{t('ptsPerDay')}</span>
          </div>
        </div>

        {/* Week progress */}
        {renderWeekDots()}

        {/* Claim button */}
        <Button
          onClick={handleClaim}
          disabled={status?.claimedToday || claiming}
          className={`w-full font-bold transition-all duration-300 ${
            status?.claimedToday || justClaimed
              ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30'
              : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-600/30'
          }`}
          size="lg"
        >
          {claiming ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : status?.claimedToday || justClaimed ? (
            <Check className="w-5 h-5 mr-2" />
          ) : (
            <Sparkles className="w-5 h-5 mr-2" />
          )}
          {claiming ? t('claiming') : (status?.claimedToday || justClaimed) ? t('claimedToday') : t('claimPoints', { points: status?.pointsAwarded || 5 })}
        </Button>
      </CardContent>
    </Card>
  )
}
