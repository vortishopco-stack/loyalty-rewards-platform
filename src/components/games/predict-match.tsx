'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trophy } from 'lucide-react'

interface PredictMatchGameProps {
  onEnd: (winnings: number) => void
  entryCost: number
}

const CANVAS_WIDTH = 360
const CANVAS_HEIGHT = 440
const MATCH_DURATION_MS = 12000
const MATCH_MINUTES = 90
const MAX_WINNINGS = 300

const PITCH_X = 20
const PITCH_Y = 40
const PITCH_W = CANVAS_WIDTH - 40
const PITCH_H = CANVAS_HEIGHT - 60

const TEAMS = [
  'Espresso FC',
  'Latte United',
  'Cappuccino City',
  'Mocha Rovers',
  'Cortado Athletic',
  'Macchiato Town',
  'Americano SC',
  'Flat White Wanderers',
]

type Prediction = 'home' | 'draw' | 'away'
type Side = 'home' | 'away'

interface GoalEvent {
  minute: number
  team: Side
  fired: boolean
}

interface Multipliers {
  home: number
  draw: number
  away: number
}

function pickTwoTeams(): [string, string] {
  const i = Math.floor(Math.random() * TEAMS.length)
  let j = Math.floor(Math.random() * TEAMS.length)
  while (j === i) j = Math.floor(Math.random() * TEAMS.length)
  return [TEAMS[i], TEAMS[j]]
}

function generateMultipliers(): Multipliers {
  let m: Multipliers
  let attempts = 0
  do {
    m = {
      home: Math.round((1.8 + Math.random() * 1.7) * 10) / 10,
      draw: Math.round((1.8 + Math.random() * 1.7) * 10) / 10,
      away: Math.round((1.8 + Math.random() * 1.7) * 10) / 10,
    }
    attempts++
  } while (m.home === m.draw && m.draw === m.away && attempts < 20)
  return m
}

function generateGoalEvents(): GoalEvent[] {
  const count = 2 + Math.floor(Math.random() * 4) // 2..5 goals
  const events: GoalEvent[] = []
  const used = new Set<number>()
  while (events.length < count) {
    const minute = 3 + Math.floor(Math.random() * 84) // 3'..86'
    if (used.has(minute)) continue
    used.add(minute)
    events.push({
      minute,
      team: Math.random() < 0.5 ? 'home' : 'away',
      fired: false,
    })
  }
  events.sort((a, b) => a.minute - b.minute)
  return events
}

function drawPitch(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
  grad.addColorStop(0, 'rgba(15, 12, 41, 0.9)')
  grad.addColorStop(1, 'rgba(48, 43, 99, 0.95)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Grass stripes
  const stripeCount = 8
  const stripeH = PITCH_H / stripeCount
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#16a34a' : '#22c55e'
    ctx.fillRect(PITCH_X, PITCH_Y + i * stripeH, PITCH_W, stripeH)
  }

  // Pitch outline
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 2
  ctx.strokeRect(PITCH_X, PITCH_Y, PITCH_W, PITCH_H)

  // Halfway line
  ctx.beginPath()
  ctx.moveTo(PITCH_X, PITCH_Y + PITCH_H / 2)
  ctx.lineTo(PITCH_X + PITCH_W, PITCH_Y + PITCH_H / 2)
  ctx.stroke()

  // Center circle + spot
  ctx.beginPath()
  ctx.arc(PITCH_X + PITCH_W / 2, PITCH_Y + PITCH_H / 2, 38, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.arc(PITCH_X + PITCH_W / 2, PITCH_Y + PITCH_H / 2, 3, 0, Math.PI * 2)
  ctx.fill()

  // Home goal (top) + penalty box
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(PITCH_X + PITCH_W / 2 - 35, PITCH_Y - 8, 70, 8)
  ctx.strokeRect(PITCH_X + PITCH_W / 2 - 35, PITCH_Y - 8, 70, 8)
  ctx.strokeRect(PITCH_X + PITCH_W / 2 - 55, PITCH_Y, 110, 36)

  // Away goal (bottom) + penalty box
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(PITCH_X + PITCH_W / 2 - 35, PITCH_Y + PITCH_H, 70, 8)
  ctx.strokeRect(PITCH_X + PITCH_W / 2 - 35, PITCH_Y + PITCH_H, 70, 8)
  ctx.strokeRect(PITCH_X + PITCH_W / 2 - 55, PITCH_Y + PITCH_H - 36, 110, 36)
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath()
  ctx.arc(x, y, 7, 0, Math.PI * 2)
  ctx.fillStyle = 'white'
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 6
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#0f0c29'
  ctx.beginPath()
  ctx.arc(x, y, 2.2, 0, Math.PI * 2)
  ctx.fill()
}

function drawGoalFlash(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  scorerName: string,
) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 40px sans-serif'
  ctx.fillStyle = '#fbbf24'
  ctx.shadowColor = '#f59e0b'
  ctx.shadowBlur = 22
  ctx.fillText('GOAL! ⚽', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10)
  ctx.font = 'bold 15px sans-serif'
  ctx.fillStyle = 'white'
  const label = scorerName.length > 22 ? scorerName.slice(0, 20) + '…' : scorerName
  ctx.fillText(label, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 24)
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
}

export function PredictMatchGame({ onEnd, entryCost }: PredictMatchGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready')
  const [teams, setTeams] = useState<[string, string]>(() => pickTwoTeams())
  const [multipliers, setMultipliers] = useState<Multipliers>(() => generateMultipliers())
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [matchClock, setMatchClock] = useState(0)
  const [winnings, setWinnings] = useState(0)
  const [finalResult, setFinalResult] = useState<Prediction | null>(null)

  const homeTeam = teams[0]
  const awayTeam = teams[1]

  // Mutable game state (avoids re-renders mid-loop)
  const animFrameRef = useRef<number>(0)
  const runningRef = useRef(false)
  const matchStartRef = useRef(0)
  const goalEventsRef = useRef<GoalEvent[]>([])
  const homeScoreRef = useRef(0)
  const awayScoreRef = useRef(0)
  const lastClockMinRef = useRef(-1)
  const ballPosRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    tx: CANVAS_WIDTH / 2,
    ty: CANVAS_HEIGHT / 2,
  })
  const goalFlashRef = useRef<{ team: Side; startTime: number } | null>(null)

  const predictionLabel = (p: Prediction | null): string => {
    if (p === 'home') return `${homeTeam} Win`
    if (p === 'draw') return 'Draw'
    if (p === 'away') return `${awayTeam} Win`
    return '—'
  }

  const startMatch = (pick: Prediction) => {
    // Fresh teams + odds for each match
    setTeams(pickTwoTeams())
    setMultipliers(generateMultipliers())
    setPrediction(pick)

    homeScoreRef.current = 0
    awayScoreRef.current = 0
    lastClockMinRef.current = -1
    goalEventsRef.current = generateGoalEvents()
    ballPosRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      tx: CANVAS_WIDTH / 2,
      ty: CANVAS_HEIGHT / 2,
    }
    goalFlashRef.current = null

    setHomeScore(0)
    setAwayScore(0)
    setMatchClock(0)
    setWinnings(0)
    setFinalResult(null)
    setGameState('playing')
  }

  useEffect(() => {
    if (gameState !== 'playing') return
    runningRef.current = true
    matchStartRef.current = Date.now()

    const loop = () => {
      if (!runningRef.current) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const elapsed = Date.now() - matchStartRef.current
      const progress = Math.min(elapsed / MATCH_DURATION_MS, 1)
      const clockMinute = Math.min(
        MATCH_MINUTES,
        Math.floor(progress * MATCH_MINUTES),
      )

      if (clockMinute !== lastClockMinRef.current) {
        lastClockMinRef.current = clockMinute
        setMatchClock(clockMinute)
      }

      // Fire scheduled goal events
      for (const ev of goalEventsRef.current) {
        if (!ev.fired && clockMinute >= ev.minute) {
          ev.fired = true
          if (ev.team === 'home') {
            homeScoreRef.current += 1
            setHomeScore(homeScoreRef.current)
          } else {
            awayScoreRef.current += 1
            setAwayScore(awayScoreRef.current)
          }
          // Aim ball at the goal that was scored on
          ballPosRef.current.tx =
            PITCH_X + PITCH_W / 2 + (Math.random() - 0.5) * 50
          ballPosRef.current.ty =
            ev.team === 'home' ? PITCH_Y + PITCH_H - 6 : PITCH_Y + 6
          goalFlashRef.current = { team: ev.team, startTime: Date.now() }
        }
      }

      // Ball movement
      const ball = ballPosRef.current
      const dx = ball.tx - ball.x
      const dy = ball.ty - ball.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const flash = goalFlashRef.current
      const inFlash = flash !== null && Date.now() - flash.startTime < 900

      if (dist < 6) {
        if (!inFlash) {
          ball.tx = PITCH_X + 20 + Math.random() * (PITCH_W - 40)
          ball.ty = PITCH_Y + 20 + Math.random() * (PITCH_H - 40)
        }
      } else {
        const speed = Math.min(7, Math.max(2, dist * 0.15))
        ball.x += (dx / dist) * speed
        ball.y += (dy / dist) * speed
      }

      // Draw frame
      drawPitch(ctx)
      drawBall(ctx, ball.x, ball.y)

      // Goal flash overlay
      if (flash) {
        const flashElapsed = Date.now() - flash.startTime
        if (flashElapsed < 900) {
          const alpha =
            flashElapsed < 600 ? 1 : 1 - (flashElapsed - 600) / 300
          const scorer = flash.team === 'home' ? homeTeam : awayTeam
          drawGoalFlash(ctx, alpha, scorer)
        } else {
          goalFlashRef.current = null
        }
      }

      // Match complete
      if (progress >= 1) {
        const hs = homeScoreRef.current
        const as = awayScoreRef.current
        const result: Prediction =
          hs > as ? 'home' : hs === as ? 'draw' : 'away'
        const correct = prediction === result
        const mult =
          result === 'home'
            ? multipliers.home
            : result === 'draw'
              ? multipliers.draw
              : multipliers.away
        const won = correct
          ? Math.min(Math.round(entryCost * mult), MAX_WINNINGS)
          : 0
        setFinalResult(result)
        setWinnings(won)
        setGameState('ended')
        return
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      runningRef.current = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [gameState, homeTeam, awayTeam, multipliers, prediction, entryCost])

  // ---------- ENDED ----------
  if (gameState === 'ended') {
    const correct = prediction === finalResult
    const net = winnings - entryCost
    return (
      <div className="glass-card p-8 text-center space-y-6">
        <div className="text-6xl mb-2">{correct ? '🏆' : '😅'}</div>
        <h2 className="text-2xl font-bold">Full Time!</h2>
        <div className="space-y-2">
          <p className="text-xl font-bold text-white">
            {homeTeam} <span className="text-yellow-400">{homeScore}</span>
            {' — '}
            <span className="text-yellow-400">{awayScore}</span> {awayTeam}
          </p>
          <p className="text-sm text-muted-foreground">
            Your prediction:{' '}
            <span
              className={
                correct
                  ? 'text-green-400 font-bold'
                  : 'text-red-400 font-bold'
              }
            >
              {predictionLabel(prediction)} {correct ? '✓' : '✗'}
            </span>
          </p>
          {correct ? (
            <p className="text-lg">
              Winnings:{' '}
              <span className="text-green-400 font-bold">+{winnings} points</span>
            </p>
          ) : (
            <p className="text-lg">
              Winnings: <span className="text-red-400 font-bold">0 points</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Entry cost: -{entryCost} points
          </p>
          <p className="text-lg font-bold">
            Net:{' '}
            <span
              className={
                net > 0
                  ? 'text-green-400'
                  : net === 0
                    ? 'text-white'
                    : 'text-red-400'
              }
            >
              {net > 0 ? '+' : ''}
              {net} points
            </span>
          </p>
        </div>
        <Button
          onClick={() => onEnd(winnings)}
          className="glass-button px-8"
        >
          <Trophy className="w-5 h-5 mr-2" />
          Collect Winnings
        </Button>
      </div>
    )
  }

  // ---------- READY ----------
  if (gameState === 'ready') {
    return (
      <div className="glass-card p-8 text-center space-y-6">
        <div className="text-5xl mb-2">⚽</div>
        <h2 className="text-2xl font-bold">Predict the Match</h2>

        {/* Matchup card */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-green-300 flex-1 truncate font-semibold text-sm sm:text-base">
              {homeTeam}
            </span>
            <span className="text-muted-foreground text-xs font-bold">VS</span>
            <span className="text-emerald-300 flex-1 truncate font-semibold text-sm sm:text-base">
              {awayTeam}
            </span>
          </div>
        </div>

        {/* How to play */}
        <div className="text-sm text-muted-foreground space-y-1 text-left mx-auto max-w-[300px]">
          <p>⚽ Pick an outcome to kick off the match simulation.</p>
          <p>📺 Watch ~12s of live action with random goals.</p>
          <p>💰 Correct pick pays entry × that outcome&apos;s multiplier.</p>
          <p>🚫 Wrong pick pays 0. Max payout capped at {MAX_WINNINGS} pts.</p>
        </div>

        {/* Prediction buttons */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Pick your outcome
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => startMatch('home')}
              className="glass-button w-full h-auto py-3 flex-col gap-0.5"
            >
              <span className="text-[11px] text-white/80">Home Win</span>
              <span className="text-lg font-bold text-green-200">
                {multipliers.home}×
              </span>
            </Button>
            <Button
              onClick={() => startMatch('draw')}
              className="glass-button w-full h-auto py-3 flex-col gap-0.5"
            >
              <span className="text-[11px] text-white/80">Draw</span>
              <span className="text-lg font-bold text-amber-200">
                {multipliers.draw}×
              </span>
            </Button>
            <Button
              onClick={() => startMatch('away')}
              className="glass-button w-full h-auto py-3 flex-col gap-0.5"
            >
              <span className="text-[11px] text-white/80">Away Win</span>
              <span className="text-lg font-bold text-emerald-200">
                {multipliers.away}×
              </span>
            </Button>
          </div>
        </div>

        <div className="glass-card p-3 inline-block">
          <p className="text-sm text-yellow-400">
            Entry Cost: {entryCost} points
          </p>
        </div>
      </div>
    )
  }

  // ---------- PLAYING ----------
  return (
    <div className="space-y-3">
      <div className="glass-card p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-center min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">
              {homeTeam}
            </div>
            <div className="text-3xl font-bold text-yellow-400">{homeScore}</div>
          </div>
          <div className="px-2 text-center">
            <div className="text-[10px] text-muted-foreground">MIN</div>
            <div className="text-xl font-bold text-green-400">{matchClock}&apos;</div>
          </div>
          <div className="flex-1 text-center min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">
              {awayTeam}
            </div>
            <div className="text-3xl font-bold text-yellow-400">{awayScore}</div>
          </div>
        </div>
        <div className="text-center text-[11px] text-muted-foreground mt-2">
          Your pick:{' '}
          <span className="text-emerald-300 font-semibold">
            {predictionLabel(prediction)}
          </span>
        </div>
      </div>
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas w-full max-w-[360px] touch-none"
        />
      </div>
      <p className="text-center text-sm text-muted-foreground animate-pulse">
        Match in progress…
      </p>
    </div>
  )
}
