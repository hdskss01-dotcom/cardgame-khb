"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";

// Fruits to use for the game
const FRUITS = ["🍎", "🍌", "🍒", "🍓", "🍇", "🍍", "🍑", "🥝"];

type GameState = "WELCOME" | "PLAYING" | "PAUSED" | "COMPLETED";

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("WELCOME");
  const [userName, setUserName] = useState("");
  const [cards, setCards] = useState<{ id: number; fruit: string; isFlipped: boolean; isMatched: boolean }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [timer, setTimer] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and shuffle cards
  const initializeGame = useCallback(() => {
    const pairs = [...FRUITS, ...FRUITS];
    const shuffledCards = pairs
      .sort(() => Math.random() - 0.5)
      .map((fruit, index) => ({
        id: index,
        fruit,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledCards);
    setFlippedIndices([]);
    setTimer(0);
    setElapsed(0);
    setStartTime(Date.now());
    setGameState("PLAYING");
  }, []);

  // Timer logic
  useEffect(() => {
    if (gameState === "PLAYING") {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Handle card click
  const handleCardClick = (index: number) => {
    if (gameState !== "PLAYING" || cards[index].isFlipped || cards[index].isMatched || flippedIndices.length === 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const [idx1, idx2] = newFlipped;
      if (cards[idx1].fruit === cards[idx2].fruit) {
        // Match found
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isMatched = true;
            updated[idx2].isMatched = true;
            return updated;
          });
          setFlippedIndices([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isFlipped = false;
            updated[idx2].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  // Check completion
  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.isMatched)) {
      setGameState("COMPLETED");
      setElapsed(timer);
    }
  }, [cards, timer]);

  const togglePause = () => {
    if (gameState === "PLAYING") setGameState("PAUSED");
    else if (gameState === "PAUSED") setGameState("PLAYING");
  };

  const restartGame = () => {
    initializeGame();
  };

  const goHome = () => {
    setGameState("WELCOME");
    setCards([]);
    setUserName("");
  };

  // UI rendering based on state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white font-sans p-4">
      
      {/* Welcome Screen */}
      {gameState === "WELCOME" && (
        <div className="flex flex-col items-center gap-8 bg-white/10 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-500 max-w-md w-full">
          <h1 className="text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-300">
            FRUIT MEMORY
          </h1>
          <div className="w-full space-y-4">
            <p className="text-center text-zinc-300 font-medium tracking-wide">Enter your name to start</p>
            <input
              type="text"
              placeholder="Your name..."
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-xl transition-all"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <button
              onClick={initializeGame}
              disabled={!userName.trim()}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-orange-500 rounded-2xl text-xl font-bold shadow-lg hover:shadow-pink-500/30 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200"
            >
              GAME START
            </button>
          </div>
        </div>
      )}

      {/* Play/Pause Area */}
      {(gameState === "PLAYING" || gameState === "PAUSED") && (
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
          {/* Header Stats */}
          <div className="flex justify-between items-center w-full bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
            <div className="flex flex-col">
              <span className="text-zinc-400 text-sm font-semibold uppercase tracking-widest">Player</span>
              <span className="text-2xl font-bold">{userName}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-zinc-400 text-sm font-semibold uppercase tracking-widest">Timer</span>
              <span className="text-3xl font-mono font-bold tabular-nums">
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Game Board */}
          <div className={`grid grid-cols-4 gap-3 w-full aspect-square relative ${gameState === "PAUSED" ? "filter blur-lg pointer-events-none" : ""}`}>
            {cards.map((card, i) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(i)}
                className="relative cursor-pointer transition-transform duration-500 [transform-style:preserve-3d]"
                style={{
                  transform: card.isFlipped || card.isMatched ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Card Back */}
                <div className="absolute inset-0 bg-neutral-800 rounded-xl border-2 border-white/10 shadow-lg flex items-center justify-center [backface-visibility:hidden] hover:border-pink-500/50 transition-colors">
                  <div className="w-10 h-10 border-4 border-white/5 rounded-full opacity-20" />
                </div>
                {/* Card Front */}
                <div className="absolute inset-0 bg-neutral-100 rounded-xl shadow-lg flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <span className="text-4xl md:text-5xl drop-shadow-sm select-none">{card.fruit}</span>
                </div>
              </div>
            ))}
            {/* Pause Overlay */}
            {gameState === "PAUSED" && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <span className="text-6xl font-black text-white/50 tracking-widest">PAUSED</span>
                </div>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <button
              onClick={togglePause}
              className="flex items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all border border-white/10 active:scale-95"
            >
              {gameState === "PAUSED" ? "RESUME" : "STOP"}
            </button>
            <button
              onClick={restartGame}
              className="flex items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all border border-white/10 active:scale-95"
            >
              RESTART
            </button>
            <button
                onClick={goHome}
                className="flex items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all border border-white/10 active:scale-95"
            >
                HOME
            </button>
          </div>
        </div>
      )}

      {/* Completed Screen */}
      {gameState === "COMPLETED" && (
        <div className="flex flex-col items-center gap-8 bg-white/10 backdrop-blur-3xl p-16 rounded-[40px] shadow-2xl border border-white/20 animate-in fade-in zoom-in slide-in-from-top-10 duration-700 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-2 animate-bounce">
            <span className="text-5xl">🏆</span>
          </div>
          <div>
            <h2 className="text-4xl font-extrabold mb-2">Well Done!</h2>
            <p className="text-pink-300 text-xl font-medium tracking-tight">{userName}, you matched them all!</p>
          </div>
          
          <div className="w-full bg-white/5 rounded-2xl p-6 border border-white/5">
             <span className="text-zinc-400 uppercase text-xs font-bold tracking-widest block mb-1">Total Time</span>
             <span className="text-5xl font-black tabular-nums tracking-tighter">
                {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
             </span>
          </div>

          <div className="w-full space-y-3">
              <button
                onClick={initializeGame}
                className="w-full py-5 bg-white text-indigo-900 rounded-2xl text-xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={goHome}
                className="w-full py-4 text-white/50 hover:text-white transition-colors font-bold uppercase tracking-widest text-sm"
              >
                Return to Menu
              </button>
          </div>
        </div>
      )}

    </div>
  );
}
