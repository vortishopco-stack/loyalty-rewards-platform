'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Crosshair } from 'lucide-react'

interface CoffeeShooterGameProps {
  onEnd: (winnings: number) => void
  entryCost: number
}

const CANVAS_WIDTH = 360
const CANVAS_HEIGHT = 500
const GAME_DURATION = 25

interface CoffeeCup {
  x: number
  y: number
  size: number
  speed: number
  type: 'coffee' | 'latte' | 'steaming'
  hit: boolean
  hitTime: number
}

export function CoffeeShooterGame({ onEnd, entryCost }: CoffeeShooterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [accuracy, setAccuracy] = useState(0)
  const [totalShots, setTotalShots] = useState(0)
  const [totalHits, setTotalHits] = useState(0)

  const cupsRef = useRef<CoffeeCup[]>([])
  const scoreRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const lastSpawnRef = useRef(0)
  const shotsRef = useRef(0)
  const hitsRef = useRef(0)
  const runningRef = useRef(false)

  useEffect(() => {
    if (gameState !== 'playing') return

    runningRef.current = true

    const spawnCup = () => {
      const types: CoffeeCup['type'][] = ['coffee', 'latte', 'steaming']
      const type = types[Math.floor(Math.random() * types.length)]
      const size = 35 + Math.random() * 15
      cupsRef.current.push({
        x: Math.random() * (CANVAS_WIDTH - size * 2) + size,
        y: -size,
        size,
        speed: 1.5 + Math.random() * 2.5,
        type,
        hit: false,
        hitTime: 0,
      })
    }

    const loop = (timestamp: number) => {
      if (!runningRef.current) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Spawn cups
      if (timestamp - lastSpawnRef.current > 800) {
        spawnCup()
        lastSpawnRef.current = timestamp
      }

      // Move cups
      const newCups: CoffeeCup[] = []
      for (let i = 0; i < cupsRef.current.length; i++) {
        const cup = { ...cupsRef.current[i] }
        if (cup.hit) {
          if (Date.now() - cup.hitTime < 500) newCups.push(cup)
          continue
        }
        cup.y += cup.speed
        if (cup.y < CANVAS_HEIGHT + cup.size) {
          newCups.push(cup)
        }
      }
      cupsRef.current = newCups

      // Draw background
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      gradient.addColorStop(0, 'rgba(15, 12, 41, 0.95)')
      gradient.addColorStop(1, 'rgba(48, 43, 99, 0.95)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Counter
      ctx.fillStyle = 'rgba(139, 92, 246, 0.15)'
      ctx.fillRect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60)
      ctx.fillStyle = 'rgba(139, 92, 246, 0.1)'
      ctx.fillRect(0, CANVAS_HEIGHT - 62, CANVAS_WIDTH, 2)

      // Draw cups
      for (const cup of cupsRef.current) {
        if (cup.hit) {
          const elapsed = Date.now() - cup.hitTime
          if (elapsed > 500) continue
          const progress = elapsed / 500
          ctx.globalAlpha = 1 - progress
          ctx.font = `${cup.size * (1 + progress)}px Arial`
          ctx.fillText('💥', cup.x - cup.size / 2, cup.y + cup.size / 4)
          ctx.globalAlpha = 1
        } else {
          const emoji = cup.type === 'coffee' ? '☕' : cup.type === 'latte' ? '🥛' : '🍵'
          ctx.font = `${cup.size}px Arial`
          ctx.fillText(emoji, cup.x - cup.size / 2, cup.y + cup.size / 4)
        }
      }

      // Crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(CANVAS_WIDTH / 2, 0)
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
      ctx.moveTo(0, CANVAS_HEIGHT / 2)
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2)
      ctx.stroke()

      // Score
      ctx.fillStyle = 'white'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText(`Score: ${scoreRef.current}`, 15, 30)

      // Accuracy
      const accuracy = shotsRef.current > 0 ? Math.round((hitsRef.current / shotsRef.current) * 100) : 0
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '11px sans-serif'
      ctx.fillText(`Accuracy: ${accuracy}%`, CANVAS_WIDTH - 100, 60)

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      runningRef.current = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [gameState])

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Capture stats before ending
          const acc = shotsRef.current > 0 ? Math.round((hitsRef.current / shotsRef.current) * 100) : 0
          setAccuracy(acc)
          setTotalShots(shotsRef.current)
          setTotalHits(hitsRef.current)
          setGameState('ended')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameState])

  // Score sync
  useEffect(() => {
    if (gameState === 'playing') {
      const sync = setInterval(() => setScore(scoreRef.current), 100)
      return () => clearInterval(sync)
    }
  }, [gameState])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
    const clickY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)

    shotsRef.current++

    let hitSomething = false
    const newCups = cupsRef.current.map(cup => {
      if (cup.hit) return cup
      const dx = clickX - cup.x
      const dy = clickY - cup.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < cup.size) {
        hitSomething = true
        hitsRef.current++
        const newCup = { ...cup, hit: true, hitTime: Date.now() }
        if (cup.type === 'steaming') scoreRef.current += 15
        else if (cup.type === 'latte') scoreRef.current += 10
        else scoreRef.current += 5
        return newCup
      }
      return cup
    })
    cupsRef.current = newCups

    if (!hitSomething) {
      scoreRef.current = Math.max(0, scoreRef.current - 2)
    }
  }

  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
    const clickY = (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)

    shotsRef.current++

    let hitSomething = false
    const newCups = cupsRef.current.map(cup => {
      if (cup.hit) return cup
      const dx = clickX - cup.x
      const dy = clickY - cup.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < cup.size * 1.2) {
        hitSomething = true
        hitsRef.current++
        const newCup = { ...cup, hit: true, hitTime: Date.now() }
        if (cup.type === 'steaming') scoreRef.current += 15
        else if (cup.type === 'latte') scoreRef.current += 10
        else scoreRef.current += 5
        return newCup
      }
      return cup
    })
    cupsRef.current = newCups

    if (!hitSomething) {
      scoreRef.current = Math.max(0, scoreRef.current - 2)
    }
  }

  const startGame = () => {
    scoreRef.current = 0
    setScore(0)
    setTimeLeft(GAME_DURATION)
    cupsRef.current = []
    shotsRef.current = 0
    hitsRef.current = 0
    setGameState('playing')
  }

  const calculateWinnings = () => {
    if (score >= 100) return 200
    if (score >= 80) return 150
    if (score >= 60) return 100
    if (score >= 40) return 70
    if (score >= 20) return 30
    if (score >= 10) return 10
    return 0
  }

  if (gameState === 'ended') {
    const winnings = calculateWinnings()
    return (
      <div className="glass-card p-8 text-center space-y-6">
        <div className="text-6xl mb-4">{winnings > 0 ? '🎯' : '😅'}</div>
        <h2 className="text-2xl font-bold">Time&apos;s Up!</h2>
        <div className="space-y-2">
          <p className="text-lg">Score: <span className="text-yellow-400 font-bold">{score}</span></p>
          <p className="text-sm text-muted-foreground">Accuracy: {accuracy}% ({totalHits}/{totalShots})</p>
          <p className="text-lg">
            Winnings: <span className={`font-bold ${winnings > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {winnings > 0 ? `+${winnings}` : '0'} points
            </span>
          </p>
          <p className="text-sm text-muted-foreground">Entry cost: -{entryCost} points</p>
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
        <div className="text-5xl mb-2">☕</div>
        <h2 className="text-2xl font-bold">Coffee Shooter</h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>🎯 Click/Tap the falling cups to score</p>
          <p>☕ Regular = +5 pts</p>
          <p>🥛 Latte = +10 pts</p>
          <p>🍵 Special = +15 pts</p>
          <p>❌ Miss = -2 pts</p>
          <p>⏱️ You have {GAME_DURATION} seconds!</p>
        </div>
        <div className="glass-card p-3 inline-block">
          <p className="text-sm text-yellow-400">Entry Cost: {entryCost} points</p>
        </div>
        <div>
          <Button onClick={startGame} className="glass-button px-8 text-lg h-12">
            <Crosshair className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="glass-card px-4 py-2">
          <span className="text-yellow-400 font-bold">Score: {score}</span>
        </div>
        <div className="glass-card px-4 py-2">
          <span className={`${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'} font-bold`}>
            ⏱️ {timeLeft}s
          </span>
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
        />
      </div>
    </div>
  )
}
