'use client'

import { useT } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Target, CheckCircle, Flame, Gift, Star } from 'lucide-react'

interface Mission {
  id: string
  type: string
  title: string
  target: number
  progress: number
  completed: boolean
  points: number
}

interface MissionsViewProps {
  missions: Mission[]
  setMissions: (missions: Mission[]) => void
}

export function MissionsView({ missions }: MissionsViewProps) {
  const { t } = useT()
  const activeMissions = missions.filter(m => !m.completed)
  const completedMissions = missions.filter(m => m.completed)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          {t('missionsTitle')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('completeMissions')}</p>
      </div>

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            {t('active')} ({activeMissions.length})
          </h3>
          {activeMissions.map(mission => (
            <Card key={mission.id} className="glass-card border-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{mission.title}</h4>
                      <p className="text-xs text-muted-foreground">{mission.type.replace(/_/g, ' ')} {t('mission')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400 shrink-0">
                    <Gift className="w-3 h-3 mr-1" />
                    {mission.points} pts
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('progress')}</span>
                    <span className="text-emerald-400 font-medium">{mission.progress}/{mission.target}</span>
                  </div>
                  <Progress
                    value={Math.min((mission.progress / mission.target) * 100, 100)}
                    className="h-2.5"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Missions */}
      {completedMissions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-green-400" />
            {t('completed')} ({completedMissions.length})
          </h3>
          {completedMissions.map(mission => (
            <Card key={mission.id} className="glass-card border-0 opacity-60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm line-through">{mission.title}</h4>
                  <p className="text-xs text-green-400">{t('completed')}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {missions.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t('noMissionsAvailable')}</p>
        </div>
      )}
    </div>
  )
}
