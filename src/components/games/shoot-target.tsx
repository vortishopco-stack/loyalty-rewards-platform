'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Crosshair, Play } from 'lucide-react'

interface ShootTargetGameProps {
  onEnd: (winnings: number) => void
  entryCost: number
}

const CANVAS_WIDTH = 360
const CANVAS_HEIGHT = 480
const TOTAL_SHOTS = 5
const POINTS_PER_GOAL = 10
const ALL_GOALS_BONUS = 25

// Goal geometry
const GOAL_LEFT = 40
const GOAL_RIGHT = 320
const CROSSBAR_Y = 90
const GOAL_LINE_Y = 380
const PENALTY_X = CANVAS_WIDTH / 2
const PENALTY_Y = 440
const KEEPER_WIDTH = 48
const KEEPER_HEIGHT = 70
const KEEPER_Y = GOAL_LINE_Y - KEEPER_HEIGHT - 4
const BALL_RADIUS = 9

const BALL_FLIGHT_MS = 500
const KEEPER_DIVE_MS = 400
const RESULT_PAUSE_MS = 800

type ShotZone = 'left' | 'center' | 'right' | 'miss'
type ShotResult = 'goal' | 'saved' | 'miss' | null
type ShotPhase = 'idle' | 'flying' | 'result'

interface Vec2 {
  x: number
  y: number
}

interface ResultMsg {
  text: string
  emoji: string
  color: string
  start: number
}

function getZoneCenterX(zone: 'left' | 'center' | 'right'): number {
  const w = GOAL_RIGHT - GOAL_LEFT
  if (zone === 'left') return GOAL_LEFT + w / 6
  if (zone === 'right') return GOAL_RIGHT - w / 6
  return GOAL_LEFT + w / 2
}

function getZoneForPoint(x: number, y: number): ShotZone {
  if (x < GOAL_LEFT || x > GOAL_RIGHT) return 'miss'
  if (y < CROSSBAR_Y || y > GOAL_LINE_Y) return 'miss'
  const w = GOAL_RIGHT - GOAL_LEFT
  if (x < GOAL_LEFT + w / 3) return 'left'
  if (x < GOAL_LEFT + (2 * w) / 3) return 'center'
  return 'right'
}

export function ShootTargetGame({ onEnd, entryCost }: ShootTargetGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready')
  const [score, setScore] = useState(0)
  const [goals, setGoals] = useState(0)
  const [shots, setShots] = useState(0)

  const scoreRef = useRef(0)
  const goalsRef = useRef(0)
  const shotsRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const runningRef = useRef(false)

  // Shot state
  const shotInProgressRef = useRef(false)
  const shotPhaseRef = useRef<ShotPhase>('idle')
  const shotStartRef = useRef(0)
  const shotFromRef = useRef<Vec2>({ x: PENALTY_X, y: PENALTY_Y })
  const shotToRef = useRef<Vec2>({ x: PENALTY_X, y: PENALTY_Y })
  const shotResultRef = useRef<ShotResult>(null)
  const resultMsgRef = useRef<ResultMsg | null>(null)
  const bonusAppliedRef = useRef(false)

  // Keeper state
  const keeperXRef = useRef(CANVAS_WIDTH / 2)
  const keeperStartXRef = useRef(CANVAS_WIDTH / 2)
  const keeperDiveZoneRef = useRef<'left' | 'center' | 'right'>('center')
  const keeperDiveStartRef = useRef(0)

  // Aim reticle (mouse/touch position over canvas)
  const aimRef = useRef<Vec2 | null>(null)

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    gradient.addColorStop(0, 'rgba(15, 12, 41, 0.95)')
    gradient.addColorStop(1, 'rgba(48, 43, 99, 0.95)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Subtle stars in the night sky above the goal
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    for (let i = 0; i < 24; i++) {
      const sx = (i * 73 + (Date.now() / 60)) % CANVAS_WIDTH
      const sy = (i * 47) % (CROSSBAR_Y - 10)
      ctx.beginPath()
      ctx.arc(sx, sy, 1, 0, Math.PI * 2)
      ctx.fill()
    }

    // Pitch / grass area below the goal line
    ctx.fillStyle = 'rgba(34, 197, 94, 0.16)'
    ctx.fillRect(0, GOAL_LINE_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GOAL_LINE_Y)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.07)'
    for (let i = 0; i < Math.ceil(CANVAS_WIDTH / 30); i++) {
      if (i % 2 === 0) {
        ctx.fillRect(i * 30, GOAL_LINE_Y, 30, CANVAS_HEIGHT - GOAL_LINE_Y)
      }
    }

    // Goal line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, GOAL_LINE_Y)
    ctx.lineTo(CANVAS_WIDTH, GOAL_LINE_Y)
    ctx.stroke()

    // Penalty spot + arc
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.beginPath()
    ctx.arc(PENALTY_X, PENALTY_Y, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(PENALTY_X, PENALTY_Y, 36, Math.PI, 0)
    ctx.stroke()
  }

  const drawGoal = (ctx: CanvasRenderingContext2D) => {
    // Net pattern inside the frame
    ctx.save()
    ctx.beginPath()
    ctx.rect(GOAL_LEFT, CROSSBAR_Y, GOAL_RIGHT - GOAL_LEFT, GOAL_LINE_Y - CROSSBAR_Y)
    ctx.clip()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 1
    const netSpacing = 14
    for (let x = GOAL_LEFT; x <= GOAL_RIGHT; x += netSpacing) {
      ctx.beginPath()
      ctx.moveTo(x, CROSSBAR_Y)
      ctx.lineTo(x, GOAL_LINE_Y)
      ctx.stroke()
    }
    for (let y = CROSSBAR_Y; y <= GOAL_LINE_Y; y += netSpacing) {
      ctx.beginPath()
      ctx.moveTo(GOAL_LEFT, y)
      ctx.lineTo(GOAL_RIGHT, y)
      ctx.stroke()
    }
    ctx.restore()

    // Posts + crossbar
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(GOAL_LEFT, CROSSBAR_Y)
    ctx.lineTo(GOAL_LEFT, GOAL_LINE_Y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(GOAL_RIGHT, CROSSBAR_Y)
    ctx.lineTo(GOAL_RIGHT, GOAL_LINE_Y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(GOAL_LEFT - 3, CROSSBAR_Y)
    ctx.lineTo(GOAL_RIGHT + 3, CROSSBAR_Y)
    ctx.stroke()
    ctx.lineCap = 'butt'
  }

  const drawKeeper = (ctx: CanvasRenderingContext2D, x: number) => {
    ctx.save()
    ctx.shadowColor = 'rgba(245, 158, 11, 0.6)'
    ctx.shadowBlur = 18
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.roundRect(x - KEEPER_WIDTH / 2, KEEPER_Y, KEEPER_WIDTH, KEEPER_HEIGHT, 10)
    ctx.fill()
    ctx.shadowBlur = 0
    // Highlight stripe
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.beginPath()
    ctx.roundRect(x - KEEPER_WIDTH / 2 + 6, KEEPER_Y + 6, KEEPER_WIDTH - 12, 8, 4)
    ctx.fill()
    // Head
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(x, KEEPER_Y - 4, 8, 0, Math.PI * 2)
    ctx.fill()
    // Gloves hint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.arc(x - KEEPER_WIDTH / 2 - 2, KEEPER_Y + 14, 4, 0, Math.PI * 2)
    ctx.arc(x + KEEPER_WIDTH / 2 + 2, KEEPER_Y + 14, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const drawBall = (ctx: CanvasRenderingContext2D, pos: Vec2) => {
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 3
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
    // Pentagon detail
    ctx.fillStyle = '#1f2937'
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y - 4)
    ctx.lineTo(pos.x + 3.8, pos.y - 1.2)
    ctx.lineTo(pos.x + 2.3, pos.y + 3.2)
    ctx.lineTo(pos.x - 2.3, pos.y + 3.2)
    ctx.lineTo(pos.x - 3.8, pos.y - 1.2)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  const drawAim = (ctx: CanvasRenderingContext2D, pos: Vec2) => {
    ctx.save()
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pos.x - 18, pos.y)
    ctx.lineTo(pos.x - 6, pos.y)
    ctx.moveTo(pos.x + 6, pos.y)
    ctx.lineTo(pos.x + 18, pos.y)
    ctx.moveTo(pos.x, pos.y - 18)
    ctx.lineTo(pos.x, pos.y - 6)
    ctx.moveTo(pos.x, pos.y + 6)
    ctx.lineTo(pos.x, pos.y + 18)
    ctx.stroke()
    ctx.restore()
  }

  const drawResultMsg = (ctx: CanvasRenderingContext2D) => {
    const msg = resultMsgRef.current
    if (!msg) return
    const elapsed = Date.now() - msg.start
    if (elapsed > RESULT_PAUSE_MS) return
    let alpha = 1
    if (elapsed < 100) alpha = elapsed / 100
    ctx.save()
    ctx.globalAlpha = Math.max(0, alpha)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, CANVAS_HEIGHT / 2 - 50, CANVAS_WIDTH, 100)
    ctx.textAlign = 'center'
    ctx.font = 'bold 36px sans-serif'
    ctx.fillStyle = msg.color
    ctx.fillText(`${msg.text} ${msg.emoji}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 12)
    ctx.restore()
  }

  useEffect(() => {
    if (gameState !== 'playing') return
    runningRef.current = true

    const loop = () => {
      if (!runningRef.current) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const now = Date.now()
      const phase = shotPhaseRef.current
      let ballPos: Vec2 = { x: PENALTY_X, y: PENALTY_Y }

      if (phase === 'idle') {
        // Keeper oscillates side-to-side while waiting
        keeperXRef.current = CANVAS_WIDTH / 2 + Math.sin(now / 500) * 80
      } else if (phase === 'flying') {
        const t = now - shotStartRef.current
        const flightProgress = Math.min(t / BALL_FLIGHT_MS, 1)
        const from = shotFromRef.current
        const to = shotToRef.current
        // Slight upward arc
        const arcLift = -Math.sin(flightProgress * Math.PI) * 20
        ballPos = {
          x: from.x + (to.x - from.x) * flightProgress,
          y: from.y + (to.y - from.y) * flightProgress + arcLift,
        }
        // Keeper dives to chosen zone
        const diveT = Math.min(t / KEEPER_DIVE_MS, 1)
        const diveTargetX = getZoneCenterX(keeperDiveZoneRef.current)
        keeperXRef.current =
          keeperStartXRef.current +
          (diveTargetX - keeperStartXRef.current) * diveT

        if (t >= BALL_FLIGHT_MS) {
          // Ball has arrived — show outcome
          shotPhaseRef.current = 'result'
          const res = shotResultRef.current
          if (res === 'goal') {
            resultMsgRef.current = {
              text: 'GOAL!',
              emoji: '⚽',
              color: '#22c55e',
              start: now,
            }
          } else if (res === 'saved') {
            resultMsgRef.current = {
              text: 'SAVED!',
              emoji: '🧤',
              color: '#ef4444',
              start: now,
            }
          } else {
            resultMsgRef.current = {
              text: 'MISS!',
              emoji: '❌',
              color: '#9ca3af',
              start: now,
            }
          }
        }
      } else if (phase === 'result') {
        const t = now - shotStartRef.current
        // Freeze ball at target, keeper at dive zone
        ballPos = { ...shotToRef.current }
        keeperXRef.current = getZoneCenterX(keeperDiveZoneRef.current)

        if (t >= BALL_FLIGHT_MS + RESULT_PAUSE_MS) {
          // Reset for next shot (or end the game)
          if (shotsRef.current >= TOTAL_SHOTS) {
            if (!bonusAppliedRef.current && goalsRef.current === TOTAL_SHOTS) {
              scoreRef.current += ALL_GOALS_BONUS
              bonusAppliedRef.current = true
            }
            setScore(scoreRef.current)
            setGoals(goalsRef.current)
            setShots(shotsRef.current)
            setGameState('ended')
            return
          }
          shotPhaseRef.current = 'idle'
          shotInProgressRef.current = false
          resultMsgRef.current = null
        }
      }

      // Render
      drawBackground(ctx)
      drawGoal(ctx)
      drawKeeper(ctx, keeperXRef.current)
      drawBall(ctx, ballPos)
      if (aimRef.current && phase === 'idle') {
        drawAim(ctx, aimRef.current)
      }
      drawResultMsg(ctx)

      // On-canvas HUD (mirrors the React HUD above)
      const displayShot = Math.min(
        shotsRef.current + (phase === 'idle' ? 1 : 0),
        TOTAL_SHOTS
      )
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`Shot ${displayShot}/${TOTAL_SHOTS}`, 12, 24)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.85)'
      ctx.font = '12px sans-serif'
      ctx.fillText(`Goals: ${goalsRef.current}  •  Score: ${scoreRef.current}`, 12, 42)

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      runningRef.current = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [gameState])

  // Periodic state sync (refs -> React state) for the HUD
  useEffect(() => {
    if (gameState !== 'playing') return
    const sync = setInterval(() => {
      setScore(scoreRef.current)
      setGoals(goalsRef.current)
      setShots(shotsRef.current)
    }, 100)
    return () => clearInterval(sync)
  }, [gameState])

  const handleShoot = (clickX: number, clickY: number) => {
    if (gameState !== 'playing' || shotInProgressRef.current) return

    const targetZone = getZoneForPoint(clickX, clickY)
    const zones: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right']
    const diveZone = zones[Math.floor(Math.random() * 3)]

    let result: ShotResult
    if (targetZone === 'miss') result = 'miss'
    else if (targetZone === diveZone) result = 'saved'
    else result = 'goal'

    shotsRef.current++
    if (result === 'goal') {
      goalsRef.current++
      scoreRef.current += POINTS_PER_GOAL
    }

    shotInProgressRef.current = true
    shotPhaseRef.current = 'flying'
    shotStartRef.current = Date.now()
    shotFromRef.current = { x: PENALTY_X, y: PENALTY_Y }
    shotToRef.current = { x: clickX, y: clickY }
    shotResultRef.current = result
    keeperStartXRef.current = keeperXRef.current
    keeperDiveZoneRef.current = diveZone
    keeperDiveStartRef.current = Date.now()
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
    const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
    handleShoot(x, y)
  }

  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
    const y = (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
    handleShoot(x, y)
  }

  const handlePointerMove = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width)
    const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
    aimRef.current = { x, y }
  }

  const startGame = () => {
    scoreRef.current = 0
    goalsRef.current = 0
    shotsRef.current = 0
    bonusAppliedRef.current = false
    shotInProgressRef.current = false
    shotPhaseRef.current = 'idle'
    resultMsgRef.current = null
    aimRef.current = null
    keeperXRef.current = CANVAS_WIDTH / 2
    keeperStartXRef.current = CANVAS_WIDTH / 2
    keeperDiveZoneRef.current = 'center'
    setScore(0)
    setGoals(0)
    setShots(0)
    setGameState('playing')
  }

  const calculateWinnings = () => {
    if (score >= 75) return 200
    if (score >= 50) return 150
    if (score >= 40) return 100
    if (score >= 30) return 70
    if (score >= 20) return 30
    if (score >= 10) return 10
    return 0
  }

  if (gameState === 'ended') {
    const winnings = calculateWinnings()
    const accuracy = Math.round((goals / TOTAL_SHOTS) * 100)
    const net = winnings - entryCost
    return (
      <div className="glass-card p-8 text-center space-y-6">
        <div className="text-6xl mb-4">{winnings > 0 ? '🏆' : '😅'}</div>
        <h2 className="text-2xl font-bold">Match Over!</h2>
        <div className="space-y-2">
          <p className="text-lg">
            Goals: <span className="text-yellow-400 font-bold">{goals}/{TOTAL_SHOTS}</span>
          </p>
          <p className="text-sm text-muted-foreground">Accuracy: {accuracy}%</p>
          <p className="text-lg">
            Score: <span className="text-yellow-400 font-bold">{score}</span>
          </p>
          <p className="text-lg">
            Winnings:{' '}
            <span className={`font-bold ${winnings > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {winnings > 0 ? `+${winnings}` : '0'} points
            </span>
          </p>
          <p className="text-sm text-muted-foreground">Entry cost: -{entryCost} points</p>
          <p className="text-lg font-bold">
            Net:{' '}
            <span className={net > 0 ? 'text-green-400' : 'text-red-400'}>
              {net > 0 ? '+' : ''}
              {net} points
            </span>
          </p>
        </div>
        <Button onClick={() => onEnd(winnings)} className="glass-button px-8">
          Collect Winnings
        </Button>
      </div>
    )
  }

  if (gameState === 'ready') {
    return (
      <div className="glass-card p-8 text-center space-y-6">
        <div className="text-5xl mb-2">⚽</div>
        <h2 className="text-2xl font-bold">Shoot on Target</h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>⚽ 5 penalty shots — aim by clicking/tapping the goal</p>
          <p>🧤 Keeper dives to a random side each shot</p>
          <p>🎯 Beat the keeper = +10 pts per goal</p>
          <p>🏆 Score 5/5 for a +25 bonus!</p>
          <p>❌ Aim outside the goal frame = MISS</p>
        </div>
        <div className="glass-card p-3 inline-block">
          <p className="text-sm text-yellow-400">Entry Cost: {entryCost} points</p>
        </div>
        <div>
          <Button onClick={startGame} className="glass-button px-8 text-lg h-12">
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <div className="glass-card px-4 py-2">
          <span className="text-yellow-400 font-bold">
            Shot {Math.min(shots + 1, TOTAL_SHOTS)}/{TOTAL_SHOTS}
          </span>
        </div>
        <div className="glass-card px-4 py-2">
          <span className="text-white font-bold">Goals: {goals}</span>
        </div>
        <div className="glass-card px-4 py-2">
          <span className="text-amber-400 font-bold">Score: {score}</span>
        </div>
      </div>
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas w-full max-w-[360px] cursor-crosshair touch-none"
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasTouch}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onTouchMove={(e) => {
            const touch = e.touches[0]
            if (touch) handlePointerMove(touch.clientX, touch.clientY)
          }}
          onMouseLeave={() => {
            aimRef.current = null
          }}
          onTouchEnd={() => {
            aimRef.current = null
          }}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        <Crosshair className="w-3 h-3" />
        Click or tap inside the goal to shoot — beat the keeper!
      </p>
    </div>
  )
}
