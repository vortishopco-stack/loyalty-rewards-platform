'use client'

import { useAuthStore } from '@/store/auth-store'
import { useAppStore, type CustomerView } from '@/store/app-store'
import { useT } from '@/lib/i18n'
import { api } from '@/lib/api'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Gamepad2, Gift, Clock, Target, Star,
  LogOut, Coins, Flame, UtensilsCrossed, ChevronRight, BookOpen
} from 'lucide-react'
import { toast } from 'sonner'

import { PointsOverview } from './points-overview'
import { GamesHub } from './games-hub'
import { RewardsStore } from './rewards-store'
import { HistoryView } from './history-view'
import { MissionsView } from './missions-view'
import { MenuView } from './menu-view'
import { DailySignIn } from './daily-sign-in'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

export function CustomerDashboard() {
  const { user, logout, updateUser } = useAuthStore()
  const { customerView, setCustomerView } = useAppStore()
  const { t } = useT()
  const [missions, setMissions] = useState<any[]>([])

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.getMe()
      const u = data.user
      updateUser({
        ...u,
        totalVisits: u.total_visits ?? u.totalVisits ?? 0,
        createdAt: u.created_at ?? u.createdAt,
        updatedAt: u.updated_at ?? u.updatedAt,
      })
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [updateUser])

  useEffect(() => {
    refreshUser()
    api.getMissions().then(data => setMissions(data.missions)).catch(console.error)
  }, [refreshUser])

  const activeMissions = missions.filter(m => !m.completed).length

  const handleLogout = () => {
    logout()
    toast.success(t('loggedOut'))
  }

  const navItems: { key: CustomerView; label: string; icon: any }[] = [
    { key: 'dashboard', label: t('home'), icon: Star },
    { key: 'menu', label: t('menu'), icon: BookOpen },
    { key: 'games', label: t('games'), icon: Gamepad2 },
    { key: 'rewards', label: t('rewards'), icon: Gift },
    { key: 'missions', label: t('missions'), icon: Target },
  ]

  const renderContent = () => {
    switch (customerView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Welcome & Points */}
            <PointsOverview onRefresh={refreshUser} />

            {/* Daily Sign-In */}
            <DailySignIn onRefresh={refreshUser} />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 glass-card-hover cursor-pointer" onClick={() => setCustomerView('games')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('games')}</p>
                    <p className="text-sm font-semibold">{t('playWin')}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto mt-2 rtl-flip" />
              </div>

              <div className="glass-card p-4 glass-card-hover cursor-pointer" onClick={() => setCustomerView('rewards')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-rose-500/30 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('rewards')}</p>
                    <p className="text-sm font-semibold">{t('redeem')}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto mt-2 rtl-flip" />
              </div>

              <div className="glass-card p-4 glass-card-hover cursor-pointer" onClick={() => setCustomerView('menu')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-500/30 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('menu')}</p>
                    <p className="text-sm font-semibold">{t('browse')}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto mt-2 rtl-flip" />
              </div>

              <div className="glass-card p-4 glass-card-hover cursor-pointer" onClick={() => setCustomerView('missions')}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('missions')}</p>
                    <p className="text-sm font-semibold">{activeMissions} {t('active')}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto mt-2 rtl-flip" />
              </div>
            </div>

            {/* Active Missions Preview */}
            {missions.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  {t('activeMissions')}
                </h3>
                <div className="space-y-3">
                  {missions.filter(m => !m.completed).slice(0, 3).map(mission => (
                    <div key={mission.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{mission.title}</span>
                        <span className="text-emerald-400">{mission.progress}/{mission.target}</span>
                      </div>
                      <Progress value={(mission.progress / mission.target) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      case 'games':
        return <GamesHub onRefresh={refreshUser} />
      case 'menu':
        return <MenuView />
      case 'rewards':
        return <RewardsStore onRefresh={refreshUser} />
      case 'history':
        return <HistoryView />
      case 'missions':
        return <MissionsView missions={missions} setMissions={setMissions} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-main flex flex-col">
      {/* Header */}
      <header className="glass-card rounded-none border-x-0 border-t-0 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9  flex items-center justify-center">
            <img src="logo.png" alt="Logo" className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold">{t('appName')}</h1>
            <p className="text-[10px] text-muted-foreground">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="glass-card px-3 py-1.5 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">{user?.points || 0}</span>
          </div>
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 text-muted-foreground hover:text-white">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-x-0 border-b-0 px-2 py-2 z-50">
        <div className="flex items-center justify-around">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = customerView === item.key
            return (
              <button
                key={item.key}
                onClick={() => setCustomerView(item.key)}
                className={`mobile-nav-item relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive ? 'active text-emerald-400' : 'text-muted-foreground hover:text-white/70'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
