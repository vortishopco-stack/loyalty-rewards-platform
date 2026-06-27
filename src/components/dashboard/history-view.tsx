'use client'

import { useState, useEffect } from 'react'
import { useT } from '@/lib/i18n'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, ShoppingBag, Gamepad2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

export function HistoryView() {
  const { t, locale } = useT()
  const [visits, setVisits] = useState<any[]>([])
  const [gameHistory, setGameHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getVisits(),
      api.getGameHistory(),
    ])
      .then(([visitsData, gamesData]) => {
        setVisits(visitsData.visits)
        setGameHistory(gamesData.history)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const dateFormat = locale === 'ar' ? 'ar-SA' : 'en-US'

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          {t('history')}
        </h2>
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-4 animate-pulse">
            <div className="h-4 bg-white/5 rounded mb-2" />
            <div className="h-3 bg-white/5 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Clock className="w-5 h-5 text-emerald-400" />
        {t('history')}
      </h2>

      <Tabs defaultValue="visits" className="w-full">
        <TabsList className="w-full bg-white/5 border border-white/10 rounded-xl h-11 p-1">
          <TabsTrigger
            value="visits"
            className="flex-1 rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-white text-muted-foreground text-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
            {t('visits')}
          </TabsTrigger>
          <TabsTrigger
            value="games"
            className="flex-1 rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-white text-muted-foreground text-sm"
          >
            <Gamepad2 className="w-3.5 h-3.5 mr-1.5" />
            {t('games')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="mt-4 space-y-3">
          {visits.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('noVisitsYet')}</p>
            </div>
          ) : (
            visits.map(visit => (
              <Card key={visit.id} className="glass-card border-0">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('visit')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(visit.createdAt).toLocaleDateString(dateFormat, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <ArrowUpCircle className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-sm font-bold text-green-400">+{visit.pointsEarned}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">${visit.invoiceAmount.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="games" className="mt-4 space-y-3">
          {gameHistory.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Gamepad2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('noGamesPlayedYet')}</p>
            </div>
          ) : (
            gameHistory.map(game => (
              <Card key={game.id} className="glass-card border-0">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                      game.gameType === 'burger_catch' ? 'from-amber-500/20 to-orange-500/20' :
                      game.gameType === 'coffee_shooter' ? 'from-amber-700/20 to-yellow-600/20' :
                      'from-emerald-500/20 to-amber-500/20'
                    } flex items-center justify-center`}>
                      <Gamepad2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{game.gameType.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(game.playedAt).toLocaleDateString(dateFormat, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <ArrowDownCircle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs text-red-400">-{game.entryCost}</span>
                    </div>
                    {game.winnings > 0 && (
                      <div className="flex items-center gap-1">
                        <ArrowUpCircle className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs font-bold text-green-400">+{game.winnings}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
