'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

interface BurgerCatchGameProps {
  onEnd: (winnings: number) => void
  entryCost: number
}

const CANVAS_WIDTH = 360
const CANVAS_HEIGHT = 500
const GAME_DURATION = 30
const PLATE_WIDTH = 70
const PLATE_HEIGHT = 15
const BURGER_SIZE = 30

interface Burger {
  x: number
  y: number
  speed: number
  type: 'burger' | 'golden' | 'rotten'
}

export function BurgerCatchGame({ onEnd, entryCost }: BurgerCatchGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)

  const plateXRef = useRef(CANVAS_WIDTH / 2 - PLATE_WIDTH / 2)
  const burgersRef = useRef<Burger[]>([])
  const scoreRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const lastSpawnRef = useRef(0)
  const keysRef = useRef<Set<string>>(new Set())
  const runningRef = useRef(false)

  useEffect(() => {
    if (gameState !== 'playing') return

    runningRef.current = true

    const spawnBurger = () => {
      const rand = Math.random()
      const type: Burger['type'] = rand < 0.1 ? 'golden' : rand < 0.2 ? 'rotten' : 'burger'
      burgersRef.current.push({
        x: Math.random() * (CANVAS_WIDTH - BURGER_SIZE),
        y: -BURGER_SIZE,
        speed: 2 + Math.random() * 3,
        type,
      })
    }

    const loop = (timestamp: number) => {
      if (!runningRef.current) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Move plate
      const keys = keysRef.current
      if (keys.has('ArrowLeft') || keys.has('a')) {
        plateXRef.current = Math.max(0, plateXRef.current - 6)
      }
      if (keys.has('ArrowRight') || keys.has('d')) {
        plateXRef.current = Math.min(CANVAS_WIDTH - PLATE_WIDTH, plateXRef.current + 6)
      }

      // Spawn burgers
      if (timestamp - lastSpawnRef.current > 600) {
        spawnBurger()
        lastSpawnRef.current = timestamp
      }

      // Move and check burgers
      const newBurgers: Burger[] = []
      for (let i = 0; i < burgersRef.current.length; i++) {
        const burger = { ...burgersRef.current[i] }
        burger.y += burger.speed

        const plateY = CANVAS_HEIGHT - 40
        if (
          burger.y + BURGER_SIZE >= plateY &&
          burger.y + BURGER_SIZE <= plateY + PLATE_HEIGHT + burger.speed &&
          burger.x + BURGER_SIZE > plateXRef.current &&
          burger.x < plateXRef.current + PLATE_WIDTH
        ) {
          if (burger.type === 'golden') {
            scoreRef.current += 15
          } else if (burger.type === 'burger') {
            scoreRef.current += 5
          } else {
            scoreRef.current = Math.max(0, scoreRef.current - 10)
          }
          continue
        }

        if (burger.y < CANVAS_HEIGHT + BURGER_SIZE) {
          newBurgers.push(burger)
        }
      }
      burgersRef.current = newBurgers

      // Draw
      ctx.fillStyle = 'rgba(15, 12, 41, 0.9)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      for (let i = 0; i < 30; i++) {
        const sx = (i * 73 + Date.now() / 50) % CANVAS_WIDTH
        const sy = (i * 47) % CANVAS_HEIGHT
        ctx.beginPath()
        ctx.arc(sx, sy, 1, 0, Math.PI * 2)
        ctx.fill()
      }

      // Burgers
      for (const burger of burgersRef.current) {
        if (burger.type === 'burger') {
          ctx.font = `${BURGER_SIZE}px Arial`
          ctx.fillText('🍔', burger.x, burger.y + BURGER_SIZE)
        } else if (burger.type === 'golden') {
          ctx.font = `${BURGER_SIZE + 5}px Arial`
          ctx.fillText('⭐', burger.x, burger.y + BURGER_SIZE)
        } else {
          ctx.font = `${BURGER_SIZE}px Arial`
          ctx.fillText('🥬', burger.x, burger.y + BURGER_SIZE)
        }
      }

      // Plate
      const px = plateXRef.current
      const py = CANVAS_HEIGHT - 40
      ctx.fillStyle = '#c084fc'
      ctx.shadowColor = '#8b5cf6'
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.roundRect(px, py, PLATE_WIDTH, PLATE_HEIGHT, 8)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.beginPath()
      ctx.roundRect(px + 5, py + 2, PLATE_WIDTH - 10, 5, 4)
      ctx.fill()

      // Score
      ctx.fillStyle = 'white'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText(`Score: ${scoreRef.current}`, 15, 30)

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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) e.preventDefault()
    }
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Touch controls
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
    plateXRef.current = Math.max(0, Math.min(CANVAS_WIDTH - PLATE_WIDTH, x - PLATE_WIDTH / 2))
  }

  const startGame = () => {
    scoreRef.current = 0
    setScore(0)
    setTimeLeft(GAME_DURATION)
    burgersRef.current = []
    plateXRef.current = CANVAS_WIDTH / 2 - PLATE_WIDTH / 2
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
        <div className="text-6xl mb-4">{winnings > 0 ? '🎉' : '😅'}</div>
        <h2 className="text-2xl font-bold">Game Over!</h2>
        <div className="space-y-2">
          <p className="text-lg">Score: <span className="text-yellow-400 font-bold">{score}</span></p>
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
        <div className="text-5xl mb-2">🍔</div>
        <h2 className="text-2xl font-bold">Burger Catch</h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>🎮 Use ← → arrow keys or touch to move the plate</p>
          <p>🍔 Catch burgers = +5 pts</p>
          <p>⭐ Catch golden stars = +15 pts</p>
          <p>🥬 Avoid veggies = -10 pts</p>
          <p>⏱️ You have {GAME_DURATION} seconds!</p>
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
          className="game-canvas w-full max-w-[360px] touch-none"
          onTouchMove={handleTouchMove}
        />
      </div>
      <div className="flex gap-4 justify-center md:hidden">
        <Button
          className="glass-button w-20 h-14"
          onTouchStart={() => keysRef.current.add('ArrowLeft')}
          onTouchEnd={() => keysRef.current.delete('ArrowLeft')}
          onMouseDown={() => keysRef.current.add('ArrowLeft')}
          onMouseUp={() => keysRef.current.delete('ArrowLeft')}
        >
          ←
        </Button>
        <Button
          className="glass-button w-20 h-14"
          onTouchStart={() => keysRef.current.add('ArrowRight')}
          onTouchEnd={() => keysRef.current.delete('ArrowRight')}
          onMouseDown={() => keysRef.current.add('ArrowRight')}
          onMouseUp={() => keysRef.current.delete('ArrowRight')}
        >
          →
        </Button>
      </div>
    </div>
  )
}
