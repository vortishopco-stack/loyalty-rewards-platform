'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Play } from 'lucide-react'

interface LuckyScratchGameProps {
  onEnd: (winnings: number) => void
  entryCost: number
}

const CANVAS_WIDTH = 320
const CANVAS_HEIGHT = 360
const SCRATCH_THRESHOLD = 0.55
const SCRATCH_RADIUS = 22
const FADE_DURATION = 500
const PERCENT_CHECK_INTERVAL = 150

interface Prize {
  emoji: string
  label: string
  value: number
  weight: number
}

const PRIZES: Prize[] = [
  { emoji: '🏆', label: 'Jackpot!', value: 300, weight: 3 },
  { emoji: '🎉', label: 'Big Win!', value: 100, weight: 10 },
  { emoji: '☕', label: 'Free Coffee!', value: 50, weight: 20 },
  { emoji: '🍪', label: 'Small Treat!', value: 20, weight: 30 },
  { emoji: '😊', label: 'Try Again', value: 0, weight: 37 },
]

function pickPrize(): Prize {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0)
  let r = Math.random() * total
  for (const p of PRIZES) {
    r -= p.weight
    if (r <= 0) return p
  }
  return PRIZES[PRIZES.length - 1]
}

export function LuckyScratchGame({ onEnd, entryCost }: LuckyScratchGameProps) {
  const prizeCanvasRef = useRef<HTMLCanvasElement>(null)
  const foilCanvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready')
  const [scratchPercent, setScratchPercent] = useState(0)
  const [prize, setPrize] = useState<Prize>(PRIZES[PRIZES.length - 1])
  const [foilOpacity, setFoilOpacity] = useState(1)

  // Interaction refs (avoid stale closures in event handlers)
  const isPressedRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const prizeRef = useRef<Prize>(PRIZES[PRIZES.length - 1])
  const autoRevealStartedRef = useRef(false)
  const fadeStartRef = useRef(0)
  const fadeAnimRef = useRef<number>(0)
  const percentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ---------- Drawing ----------

  const drawPrize = useCallback((ctx: CanvasRenderingContext2D, p: Prize) => {
    // Dark gradient background (matches other games)
    const bg = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    bg.addColorStop(0, 'rgba(15, 12, 41, 0.95)')
    bg.addColorStop(1, 'rgba(48, 43, 99, 0.95)')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Rounded-rect decorative border (amber accent — no indigo/blue)
    const r = 16
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.6)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(r, 0.5)
    ctx.lineTo(CANVAS_WIDTH - r, 0.5)
    ctx.quadraticCurveTo(CANVAS_WIDTH, 0.5, CANVAS_WIDTH, r + 0.5)
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - r - 0.5)
    ctx.quadraticCurveTo(CANVAS_WIDTH, CANVAS_HEIGHT - 0.5, CANVAS_WIDTH - r, CANVAS_HEIGHT - 0.5)
    ctx.lineTo(r, CANVAS_HEIGHT - 0.5)
    ctx.quadraticCurveTo(0.5, CANVAS_HEIGHT - 0.5, 0.5, CANVAS_HEIGHT - r - 0.5)
    ctx.lineTo(0.5, r + 0.5)
    ctx.quadraticCurveTo(0.5, 0.5, r, 0.5)
    ctx.closePath()
    ctx.stroke()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Top decorative label
    ctx.font = 'bold 13px sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fillText('★ LUCKY SCRATCH ★', CANVAS_WIDTH / 2, 32)

    // Big prize emoji centered
    ctx.font = '120px sans-serif'
    ctx.fillText(p.emoji, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 18)

    // Prize label
    ctx.font = 'bold 22px sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(p.label, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 72)

    // Points sub-label
    if (p.value > 0) {
      ctx.font = 'bold 18px sans-serif'
      ctx.fillStyle = '#fbbf24'
      ctx.fillText(`+${p.value} points`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100)
    } else {
      ctx.font = '13px sans-serif'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
      ctx.fillText('No points this time', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100)
    }
  }, [])

  const drawFoil = useCallback((ctx: CanvasRenderingContext2D) => {
    // Metallic silver/grey diagonal gradient
    const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    grad.addColorStop(0, '#4a5568')
    grad.addColorStop(0.5, '#718096')
    grad.addColorStop(1, '#4a5568')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Subtle hatched pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    for (let i = -CANVAS_HEIGHT; i < CANVAS_WIDTH; i += 12) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + CANVAS_HEIGHT, CANVAS_HEIGHT)
      ctx.stroke()
    }

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Decorative top label
    ctx.font = 'bold 13px sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fillText('★ LUCKY SCRATCH ★', CANVAS_WIDTH / 2, 32)

    // "SCRATCH HERE" text
    ctx.font = 'bold 28px sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillText('🪙 SCRATCH HERE 🪙', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 18)

    ctx.font = '14px sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
    ctx.fillText('Drag to reveal your prize', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 24)
  }, [])

  // ---------- Scratch interaction ----------

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = foilCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 }
    const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width)
    const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
    return {
      x: Math.max(0, Math.min(CANVAS_WIDTH, x)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT, y)),
    }
  }, [])

  const scratchAt = useCallback((x: number, y: number) => {
    const canvas = foilCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // destination-out erases existing pixels where we draw
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = SCRATCH_RADIUS * 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)'
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'

    const last = lastPosRef.current
    if (last) {
      // Connect last position with a thick line for a smooth scratch trail
      ctx.beginPath()
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    } else {
      // First tap: erase a disc
      ctx.beginPath()
      ctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalCompositeOperation = 'source-over'
    lastPosRef.current = { x, y }
  }, [])

  const calcScratchPercent = useCallback(() => {
    const canvas = foilCanvasRef.current
    if (!canvas) return 0
    const ctx = canvas.getContext('2d')
    if (!ctx) return 0
    try {
      const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      const data = imageData.data
      let cleared = 0
      let total = 0
      // Sample every 4th pixel (stride = 16 bytes) for speed
      for (let i = 3; i < data.length; i += 16) {
        total++
        if (data[i] < 64) cleared++
      }
      return total > 0 ? cleared / total : 0
    } catch {
      return 0
    }
  }, [])

  const startAutoReveal = useCallback(() => {
    if (autoRevealStartedRef.current) return
    autoRevealStartedRef.current = true

    // Stop sampling once auto-reveal has begun
    if (percentIntervalRef.current) {
      clearInterval(percentIntervalRef.current)
      percentIntervalRef.current = null
    }

    fadeStartRef.current = Date.now()
    const animate = () => {
      const elapsed = Date.now() - fadeStartRef.current
      const progress = Math.min(elapsed / FADE_DURATION, 1)
      setFoilOpacity(1 - progress)
      if (progress < 1) {
        fadeAnimRef.current = requestAnimationFrame(animate)
      } else {
        setGameState('ended')
      }
    }
    fadeAnimRef.current = requestAnimationFrame(animate)
  }, [])

  // ---------- Pointer handlers ----------

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || autoRevealStartedRef.current) return
    isPressedRef.current = true
    lastPosRef.current = null
    const { x, y } = getCanvasCoords(e.clientX, e.clientY)
    scratchAt(x, y)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPressedRef.current || autoRevealStartedRef.current) return
    const { x, y } = getCanvasCoords(e.clientX, e.clientY)
    scratchAt(x, y)
  }

  const handleMouseUp = () => {
    isPressedRef.current = false
    lastPosRef.current = null
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || autoRevealStartedRef.current) return
    e.preventDefault()
    const touch = e.touches[0]
    if (!touch) return
    isPressedRef.current = true
    lastPosRef.current = null
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY)
    scratchAt(x, y)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPressedRef.current || autoRevealStartedRef.current) return
    e.preventDefault()
    const touch = e.touches[0]
    if (!touch) return
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY)
    scratchAt(x, y)
  }

  const handleTouchEnd = () => {
    isPressedRef.current = false
    lastPosRef.current = null
  }

  // ---------- Game state effect ----------

  useEffect(() => {
    if (gameState !== 'playing') return

    // Draw the prize layer once (it stays put underneath the foil)
    const prizeCanvas = prizeCanvasRef.current
    if (prizeCanvas) {
      const ctx = prizeCanvas.getContext('2d')
      if (ctx) drawPrize(ctx, prizeRef.current)
    }

    // Draw the foil layer once (gets erased as the player scratches)
    const foilCanvas = foilCanvasRef.current
    if (foilCanvas) {
      const ctx = foilCanvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.globalCompositeOperation = 'source-over'
        drawFoil(ctx)
      }
    }

    // Periodically compute scratch percentage (throttled)
    percentIntervalRef.current = setInterval(() => {
      const pct = calcScratchPercent()
      setScratchPercent(pct)
      if (pct >= SCRATCH_THRESHOLD && !autoRevealStartedRef.current) {
        startAutoReveal()
      }
    }, PERCENT_CHECK_INTERVAL)

    return () => {
      if (percentIntervalRef.current) {
        clearInterval(percentIntervalRef.current)
        percentIntervalRef.current = null
      }
      if (fadeAnimRef.current) {
        cancelAnimationFrame(fadeAnimRef.current)
      }
    }
  }, [gameState, drawPrize, drawFoil, calcScratchPercent, startAutoReveal])

  // ---------- Actions ----------

  const startGame = () => {
    const newPrize = pickPrize()
    prizeRef.current = newPrize
    setPrize(newPrize)
    setScratchPercent(0)
    setFoilOpacity(1)
    autoRevealStartedRef.current = false
    lastPosRef.current = null
    isPressedRef.current = false
    setGameState('playing')
  }

  // ---------- Render ----------

  if (gameState === 'ended') {
    const isWin = prize.value > 0
    const net = prize.value - entryCost
    return (
      <div className="glass-card p-8 text-center space-y-6">
        <div className="text-7xl mb-2">{prize.emoji}</div>
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400" />
          {isWin ? `You won ${prize.value} points!` : 'Better luck next time!'}
        </h2>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{prize.label}</p>
          <p className="text-sm text-muted-foreground">Entry cost: -{entryCost} points</p>
          <p className="text-lg font-bold">
            Net:{' '}
            <span className={net > 0 ? 'text-green-400' : 'text-red-400'}>
              {net > 0 ? '+' : ''}
              {net} points
            </span>
          </p>
        </div>
        <Button onClick={() => onEnd(prize.value)} className="glass-button px-8">
          Collect Winnings
        </Button>
      </div>
    )
  }

  if (gameState === 'ready') {
    return (
      <div className="glass-card p-8 text-center space-y-6">
        <div className="text-5xl mb-2">🎟️</div>
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400" />
          Lucky Scratch
        </h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Scratch the card to reveal your prize!</p>
          <p>Prizes: 🏆300 / 🎉100 / ☕50 / 🍪20 / 😊0</p>
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

  // playing
  const pctDisplay = Math.round(scratchPercent * 100)
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-amber-500/30"
          style={{
            width: '100%',
            maxWidth: `${CANVAS_WIDTH}px`,
            aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          }}
        >
          <canvas
            ref={prizeCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="absolute inset-0 w-full h-full"
          />
          <canvas
            ref={foilCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="absolute inset-0 w-full h-full cursor-pointer touch-none"
            style={{ opacity: foilOpacity }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>
      </div>
      <div className="text-center space-y-2">
        {scratchPercent < SCRATCH_THRESHOLD ? (
          <p className="text-sm text-muted-foreground animate-pulse">Keep scratching...</p>
        ) : (
          <p className="text-sm text-amber-400 font-bold">Revealing your prize!</p>
        )}
        <p className="text-xs text-muted-foreground">Scratched: {pctDisplay}%</p>
        <div className="w-full max-w-[320px] mx-auto bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-150"
            style={{ width: `${Math.min(100, pctDisplay)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
