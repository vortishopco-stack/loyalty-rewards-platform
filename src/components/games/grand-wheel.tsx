'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CircleDot } from 'lucide-react'

interface GrandWheelGameProps {
  onEnd: (winnings: number) => void
  entryCost: number
}

const CANVAS_SIZE = 360
const SPIN_DURATION = 5000

const SEGMENTS = [
  { label: '0', value: 0, color: '#374151' },
  { label: '20', value: 20, color: '#7c3aed' },
  { label: '50', value: 50, color: '#a855f7' },
  { label: '0', value: 0, color: '#1f2937' },
  { label: '100', value: 100, color: '#ec4899' },
  { label: '10', value: 10, color: '#8b5cf6' },
  { label: '0', value: 0, color: '#374151' },
  { label: '30', value: 30, color: '#6366f1' },
  { label: '200', value: 200, color: '#f59e0b' },
  { label: '0', value: 0, color: '#1f2937' },
  { label: '75', value: 75, color: '#c084fc' },
  { label: '5', value: 5, color: '#7c3aed' },
]

export function GrandWheelGame({ onEnd, entryCost }: GrandWheelGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'ready' | 'spinning' | 'ended'>('ready')
  const [winnings, setWinnings] = useState(0)
  const rotationRef = useRef(0)
  const spinStartRef = useRef(0)
  const spinSpeedRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const runningRef = useRef(false)

  const drawWheel = (ctx: CanvasRenderingContext2D, rotation: number) => {
    const cx = CANVAS_SIZE / 2
    const cy = CANVAS_SIZE / 2
    const radius = CANVAS_SIZE / 2 - 20

    ctx.fillStyle = 'rgba(15, 12, 41, 0.95)'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Outer glow
    ctx.shadowColor = '#8b5cf6'
    ctx.shadowBlur = 30
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2)
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.shadowBlur = 0

    // Draw segments
    const segAngle = (Math.PI * 2) / SEGMENTS.length
    for (let i = 0; i < SEGMENTS.length; i++) {
      const startAngle = rotation + i * segAngle
      const endAngle = startAngle + segAngle

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = SEGMENTS[i].color
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Text
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(startAngle + segAngle / 2)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(SEGMENTS[i].label, radius * 0.65, 5)
      ctx.restore()
    }

    // Center circle
    ctx.beginPath()
    ctx.arc(cx, cy, 25, 0, Math.PI * 2)
    ctx.fillStyle = '#1f2937'
    ctx.fill()
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.fillStyle = '#a855f7'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('SPIN', cx, cy + 4)

    // Pointer
    ctx.beginPath()
    ctx.moveTo(cx, 10)
    ctx.lineTo(cx - 15, 0)
    ctx.lineTo(cx + 15, 0)
    ctx.closePath()
    ctx.fillStyle = '#f59e0b'
    ctx.fill()
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  const getWinningSegment = (rotation: number) => {
    const normalized = ((2 * Math.PI) - (rotation % (2 * Math.PI))) % (2 * Math.PI)
    const segAngle = (Math.PI * 2) / SEGMENTS.length
    const index = Math.floor(normalized / segAngle) % SEGMENTS.length
    return SEGMENTS[index]
  }

  useEffect(() => {
    if (gameState !== 'spinning') return

    runningRef.current = true

    const loop = () => {
      if (!runningRef.current) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const elapsed = Date.now() - spinStartRef.current
      const progress = Math.min(elapsed / SPIN_DURATION, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const totalRotation = spinSpeedRef.current * eased
      rotationRef.current = totalRotation

      drawWheel(ctx, totalRotation)

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(loop)
      } else {
        // Spin complete
        const segment = getWinningSegment(totalRotation)
        setWinnings(segment.value)
        setTimeout(() => setGameState('ended'), 1500)
      }
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      runningRef.current = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [gameState])

  // Initial draw
  useEffect(() => {
    if (canvasRef.current && gameState === 'ready') {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) drawWheel(ctx, 0)
    }
  }, [gameState])

  const spin = () => {
    const extraRotations = 5 + Math.random() * 5
    spinSpeedRef.current = extraRotations * Math.PI * 2 + Math.random() * Math.PI * 2
    spinStartRef.current = Date.now()
    setGameState('spinning')
  }

  if (gameState === 'ended') {
    return (
      <div className="glass-card p-8 text-center space-y-6">
        <div className="text-6xl mb-4">{winnings > 0 ? '🎉' : '😌'}</div>
        <h2 className="text-2xl font-bold">Wheel Result!</h2>
        <div className="space-y-2">
          <p className="text-2xl">
            <span className={`font-bold ${winnings > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
              {winnings > 0 ? `+${winnings}` : '0'} points
            </span>
          </p>
          <p className="text-sm text-muted-foreground">Entry cost: -{entryCost} points</p>
          <p className="text-lg font-bold">
            Net: <span className={winnings - entryCost > 0 ? 'text-green-400' : 'text-red-400'}>
              {winnings - entryCost > 0 ? '+' : ''}{winnings - entryCost} points
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
      <div className="space-y-6">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="game-canvas w-full max-w-[360px]"
          />
        </div>
        <div className="text-center space-y-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>🎡 Spin the Grand Wheel for a chance at big rewards!</p>
            <p>💰 Top prize: 200 points!</p>
            <p>⚠️ Monthly cooldown applies</p>
          </div>
          <div className="glass-card p-3 inline-block">
            <p className="text-sm text-yellow-400">Entry Cost: {entryCost} points</p>
          </div>
          <div>
            <Button onClick={spin} className="glass-button px-8 text-lg h-12">
              <CircleDot className="w-5 h-5 mr-2" />
              Spin the Wheel!
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="game-canvas w-full max-w-[360px]"
        />
      </div>
      <p className="text-center text-sm text-muted-foreground animate-pulse">Spinning...</p>
    </div>
  )
}
