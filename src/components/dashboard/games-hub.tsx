'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type GameType } from '@/store/app-store'
import { useAuthStore } from '@/store/auth-store'
import { useT } from '@/lib/i18n'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Timer, Coins, ArrowLeft, Hamburger, Coffee, CircleDot, Trophy, Crosshair, Ticket } from 'lucide-react'
import { toast } from 'sonner'

import { BurgerCatchGame } from '@/components/games/burger-catch'
import { CoffeeShooterGame } from '@/components/games/coffee-shooter'
import { GrandWheelGame } from '@/components/games/grand-wheel'
import { PredictMatchGame } from '@/components/games/predict-match'
import { ShootTargetGame } from '@/components/games/shoot-target'
import { LuckyScratchGame } from '@/components/games/lucky-scratch'

interface GameStatus {
  canPlay: boolean
  entryCost: number
  cooldownRemaining: number
  lastPlayedAt: string | null
  enabled?: boolean
}

interface GamesHubProps {
  onRefresh: () => void
}

export function GamesHub({ onRefresh }: GamesHubProps) {
  const { activeGame, setActiveGame } = useAppStore()
  const { user, updateUser } = useAuthStore()
  const { t } = useT()
  const [gameStatuses, setGameStatuses] = useState<Record<GameType, GameStatus | null>>({
    burger_catch: null,
    coffee_shooter: null,
    grand_wheel: null,
    predict_match: null,
    shoot_target: null,
    lucky_scratch: null,
  })

  const GAME_INFO: Record<GameType, { name: string; icon: any; description: string; color: string; emoji: string }> = {
    burger_catch: {
      name: t('burgerCatchName'),
      icon: Hamburger,
      description: t('burgerCatchDesc'),
      color: 'from-amber-500 to-orange-500',
      emoji: '🍔',
    },
    coffee_shooter: {
      name: t('coffeeShooterName'),
      icon: Coffee,
      description: t('coffeeShooterDesc'),
      color: 'from-amber-700 to-yellow-600',
      emoji: '☕',
    },
    grand_wheel: {
      name: t('grandWheelName'),
      icon: CircleDot,
      description: t('grandWheelDesc'),
      color: 'from-emerald-500 to-amber-500',
      emoji: '🎡',
    },
    predict_match: {
      name: t('predictMatchName'),
      icon: Trophy,
      description: t('predictMatchDesc'),
      color: 'from-emerald-500 to-green-600',
      emoji: '⚽',
    },
    shoot_target: {
      name: t('shootTargetName'),
      icon: Crosshair,
      description: t('shootTargetDesc'),
      color: 'from-rose-500 to-red-600',
      emoji: '🥅',
    },
    lucky_scratch: {
      name: t('luckyScratchName'),
      icon: Ticket,
      description: t('luckyScratchDesc'),
      color: 'from-amber-500 to-emerald-600',
      emoji: '🎟️',
    },
  }

  // Only show games the admin has enabled (default to visible if status not loaded yet)
  const visibleGames = (Object.keys(GAME_INFO) as GameType[]).filter(
    gameType => gameStatuses[gameType]?.enabled !== false
  )

  const fetchGameStatuses = async () => {
    const results: Record<string, GameStatus> = {}
    for (const gameType of Object.keys(GAME_INFO) as GameType[]) {
      try {
        const data = await api.getGameStatus(gameType)
        results[gameType] = data as GameStatus
      } catch (error) {
        console.error(`Failed to fetch status for ${gameType}:`, error)
      }
    }
    setGameStatuses(prev => ({ ...prev, ...results }))
  }

  // Default entry costs (mirror api.ts defaults) used before status loads
  const DEFAULT_ENTRY_COST: Record<GameType, number> = {
    burger_catch: 50,
    coffee_shooter: 50,
    grand_wheel: 100,
    predict_match: 60,
    shoot_target: 60,
    lucky_scratch: 40,
  }

  useEffect(() => {
    const load = async () => {
      const results: Record<string, GameStatus> = {}
      for (const gameType of Object.keys(GAME_INFO) as GameType[]) {
        try {
          const data = await api.getGameStatus(gameType)
          results[gameType] = data as GameStatus
        } catch (error) {
          console.error(`Failed to fetch status for ${gameType}:`, error)
        }
      }
      setGameStatuses(prev => ({ ...prev, ...results }))
    }
    load()
  }, [])

  const formatCooldown = (ms: number) => {
    const hours = Math.ceil(ms / (60 * 60 * 1000))
    if (hours >= 24) return `${Math.ceil(hours / 24)}d ${hours % 24}h`
    return `${hours}h`
  }

  const handleGameEnd = async (gameType: GameType, winnings: number) => {
    try {
      const result = await api.playGame(gameType, winnings)
      const newBalance = result.new_points_balance ?? result.newPointsBalance ?? 0
      updateUser({ points: newBalance })
      toast.success(
        winnings > 0
          ? t('youWonPoints', { points: winnings })
          : t('betterLuckNextTime'),
        { description: t('newBalance', { points: newBalance }) }
      )
      onRefresh()
      fetchGameStatuses()
      setActiveGame(null)
    } catch (error: any) {
      toast.error(error.message || t('gameError'))
      setActiveGame(null)
    }
  }

  const handleStartGame = (gameType: GameType) => {
    const status = gameStatuses[gameType]
    if (!status?.canPlay) {
      toast.error(t('gameOnCooldown'))
      return
    }
    if ((user?.points || 0) < (status?.entryCost || 0)) {
      toast.error(t('notEnoughPoints'))
      return
    }
    setActiveGame(gameType)
  }

  // If a game is active, render the game component
  if (activeGame) {
    const gameInfo = GAME_INFO[activeGame]
    const status = gameStatuses[activeGame]
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveGame(null)} className="text-muted-foreground hover:text-white">
            <ArrowLeft className="w-5 h-5 rtl-flip" />
          </Button>
          <div>
            <h2 className="text-lg font-bold">{gameInfo.emoji} {gameInfo.name}</h2>
            <p className="text-xs text-muted-foreground">{t('entryCost', { cost: status?.entryCost || 0 })}</p>
          </div>
        </div>

        {activeGame === 'burger_catch' && (
          <BurgerCatchGame
            onEnd={(winnings) => handleGameEnd('burger_catch', winnings)}
            entryCost={status?.entryCost || 50}
          />
        )}
        {activeGame === 'coffee_shooter' && (
          <CoffeeShooterGame
            onEnd={(winnings) => handleGameEnd('coffee_shooter', winnings)}
            entryCost={status?.entryCost || 50}
          />
        )}
        {activeGame === 'grand_wheel' && (
          <GrandWheelGame
            onEnd={(winnings) => handleGameEnd('grand_wheel', winnings)}
            entryCost={status?.entryCost || 100}
          />
        )}
        {activeGame === 'predict_match' && (
          <PredictMatchGame
            onEnd={(winnings) => handleGameEnd('predict_match', winnings)}
            entryCost={status?.entryCost || DEFAULT_ENTRY_COST.predict_match}
          />
        )}
        {activeGame === 'shoot_target' && (
          <ShootTargetGame
            onEnd={(winnings) => handleGameEnd('shoot_target', winnings)}
            entryCost={status?.entryCost || DEFAULT_ENTRY_COST.shoot_target}
          />
        )}
        {activeGame === 'lucky_scratch' && (
          <LuckyScratchGame
            onEnd={(winnings) => handleGameEnd('lucky_scratch', winnings)}
            entryCost={status?.entryCost || DEFAULT_ENTRY_COST.lucky_scratch}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-emerald-400" />
          {t('arcadeGames')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('spendPointsToPlay')}</p>
      </div>

      <div className="space-y-4">
        {visibleGames.map(gameType => {
          const info = GAME_INFO[gameType]
          const status = gameStatuses[gameType]
          const Icon = info.icon

          return (
            <Card key={gameType} className="glass-card border-0 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center text-2xl shrink-0`}>
                    {info.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold">{info.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs text-yellow-400 font-medium">{status?.entryCost || '...'}</span>
                      </div>
                      {status && !status.canPlay && (
                        <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">
                          <Timer className="w-3 h-3 mr-1" />
                          {formatCooldown(status.cooldownRemaining)}
                        </Badge>
                      )}
                      {status?.canPlay && (
                        <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">
                          {t('available')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleStartGame(gameType)}
                    disabled={!status?.canPlay || (user?.points || 0) < (status?.entryCost || 0)}
                    className="glass-button shrink-0"
                    size="sm"
                  >
                    {t('play')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {visibleGames.length === 0 && (
          <Card className="glass-card border-0">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              {t('noGamesAvailable')}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
