// /app/game/page.tsx
'use client'
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useUser, SignOutButton, RedirectToSignIn } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebaseClient'

export default function GamePage() {
  const { isSignedIn, user, isLoaded } = useUser()

  // Redirect to sign-in if not logged in (client side)
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      RedirectToSignIn()
    }
  }, [isLoaded, isSignedIn])

  if (!isLoaded || !isSignedIn) {
    return <div>Loading...</div>
  }

  return (
    <main style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '1rem' }}>
        <h1>Crossword Battle Arena</h1>
        <p>Logged in as: {user.firstName} {user.lastName}</p>
        <SignOutButton>
          <button style={{ padding: '0.3rem 0.8rem' }}>Sign Out</button>
        </SignOutButton>
      </header>

      <CrosswordGrid />
    </main>
  )
}

// Basic placeholder Crossword grid component
function CrosswordGrid() {
  const size = 10

  const cells = Array.from({ length: size * size }, (_, i) => i)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, 40px)`,
        gap: '2px',
        userSelect: 'none'
      }}
    >
      {cells.map((cell) => (
        <Cell key={cell} />
      ))}
    </div>
  )
}

// Basic clickable cell component placeholder
function Cell() {
  const [filled, setFilled] = React.useState(false)

  return (
    <div
      onClick={() => setFilled(!filled)}
      style={{
        width: '40px',
        height: '40px',
        backgroundColor: filled ? '#4caf50' : '#eee',
        border: '1px solid #ccc',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '1rem',
      }}
    >
      {/* For now, empty cell or mark filled */}
      {filled ? 'X' : ''}
    </div>
  )
}

type SolvedWord = {
  [wordId: string]: {
    solved_by: 'player' | 'ai'
    timestamp: any
  }
}

type GameState = {
  puzzle_id: string
  player_score: number
  ai_score: number
  solved_words: SolvedWord
  game_status: string
  winner?: string
}

export function useGameState(gameId: string) {
  const [gameState, setGameState] = useState<GameState | null>(null)

  useEffect(() => {
    if (!gameId) return

    const unsub = onSnapshot(doc(db, 'games', gameId), (docSnap) => {
      if (docSnap.exists()) {
        setGameState(docSnap.data() as GameState)
      }
    })

    return () => unsub()
  }, [gameId])

  return gameState
}