// app/page.tsx
"use client";

import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function HomePage() {
  const { user } = useUser();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-3xl font-bold mb-6">Crossword Battle Arena</h1>

      {/* When signed out */}
      <SignedOut>
        <p className="mb-4 text-lg">Please sign in to start playing.</p>
        <SignInButton mode="modal">
          <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition">
            Sign In
          </button>
        </SignInButton>
      </SignedOut>

      {/* When signed in */}
      <SignedIn>
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg">Welcome back, {user?.firstName || "Player"}!</p>
          <UserButton afterSignOutUrl="/" />
          <Link href="/game">
            <button className="px-6 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition">
              Start New Game
            </button>
          </Link>
        </div>
      </SignedIn>
    </main>
  );
}
