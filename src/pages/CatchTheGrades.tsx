import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Heart } from "lucide-react";
import GameLoginModal from "@/components/GameLoginModal";
import GameLeaderboard from "@/components/GameLeaderboard";
import { supabase } from "@/integrations/supabase/client";

interface Item {
  id: string;
  type: 'good' | 'bad';
  text: string;
  x: number;
  y: number;
  speed: number;
}

const GOOD_ITEMS = ["A+", "সিঙ্গারা", "চপ", "B+"];
const BAD_ITEMS = ["F", "Assignment", "Class Test"];

export default function CatchTheGrades() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [items, setItems] = useState<Item[]>([]);
  const [basketX, setBasketX] = useState(50); // percentage
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("ju_game_nickname");
    if (saved) setNickname(saved);
    const savedScore = localStorage.getItem("catch_grades_highscore");
    if (savedScore) setHighScore(parseInt(savedScore, 10));
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const lastSpawnTime = useRef<number>(0);
  const gameSpeed = useRef<number>(1);

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setLives(3);
    setItems([]);
    gameSpeed.current = 1;
    lastSpawnTime.current = performance.now();
  };

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlaying || isGameOver || !containerRef.current) return;
    
    let clientX = 0;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const xPos = clientX - rect.left;
    let percentage = (xPos / rect.width) * 100;
    percentage = Math.max(5, Math.min(95, percentage)); // clamp
    setBasketX(percentage);
  }, [isPlaying, isGameOver]);

  const updateGame = useCallback((time: number) => {
    if (!isPlaying || isGameOver) return;

    // Spawn new items
    if (time - lastSpawnTime.current > 1000 / gameSpeed.current) {
      const isGood = Math.random() > 0.3; // 70% good items
      const textArr = isGood ? GOOD_ITEMS : BAD_ITEMS;
      const text = textArr[Math.floor(Math.random() * textArr.length)];
      
      const newItem: Item = {
        id: Math.random().toString(36).substr(2, 9),
        type: isGood ? 'good' : 'bad',
        text,
        x: Math.random() * 90 + 5, // 5% to 95% width
        y: -10, // start above screen
        speed: (Math.random() * 0.5 + 0.5) * gameSpeed.current,
      };
      
      setItems(prev => [...prev, newItem]);
      lastSpawnTime.current = time;
      
      // Gradually increase speed
      gameSpeed.current += 0.01;
    }

    // Update positions and check collisions
    setItems(prevItems => {
      const newItems = [];
      let currentLives = lives;
      let currentScore = score;
      let hit = false;

      for (const item of prevItems) {
        const newY = item.y + item.speed;
        
        // Collision check (Basket is around 85-95% Y, and +- 10% X of basketX)
        const inBasketX = Math.abs(item.x - basketX) < 15;
        const inBasketY = newY > 85 && newY < 95;

        if (inBasketX && inBasketY) {
          if (item.type === 'good') {
            currentScore += 10;
          } else {
            currentLives -= 1;
          }
          hit = true;
          continue; // item caught
        }

        // Missed item
        if (newY > 100) {
          if (item.type === 'good') {
            // Missing a good item doesn't hurt right now, but we could deduct points
          }
          continue; // item falls off screen
        }

        newItems.push({ ...item, y: newY });
      }

      if (hit) {
        setScore(currentScore);
        if (currentLives <= 0) {
          setLives(0);
          setIsGameOver(true);
          setIsPlaying(false);
          
          if (currentScore > highScore) {
            setHighScore(currentScore);
            localStorage.setItem("catch_grades_highscore", currentScore.toString());
          }
          if (currentScore > 0 && nickname) {
            supabase.from("game_scores").insert({
              nickname: nickname,
              game_name: "catch-grades",
              score: currentScore
            }).then();
          }
        } else {
          setLives(currentLives);
        }
      }

      return newItems;
    });

    requestRef.current = requestAnimationFrame(updateGame);
  }, [isPlaying, isGameOver, lives, score, basketX]);

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      requestRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, isGameOver, updateGame]);

  return (
    <div className="container py-8 max-w-4xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <Link to="/game">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> ফিরে যান
          </Button>
        </Link>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl text-primary font-bold">
            <Trophy className="w-5 h-5" /> {score}
          </div>
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart key={i} className={`w-6 h-6 ${i < lives ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
            ))}
          </div>
        </div>
      </div>

      <div 
        className="flex-1 relative bg-gradient-to-b from-sky-100 to-sky-300 rounded-3xl overflow-hidden shadow-inner border-4 border-sky-400 touch-none select-none cursor-none"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
      >
        {/* Game Area */}
        {isPlaying && !isGameOver && (
          <>
            {items.map(item => (
              <div
                key={item.id}
                className={`absolute text-2xl md:text-4xl font-black p-2 drop-shadow-md transition-transform`}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: 'translateX(-50%)',
                  color: item.type === 'good' ? '#10b981' : '#ef4444' // Emerald for good, Red for bad
                }}
              >
                {item.text}
              </div>
            ))}

            {/* Basket */}
            <div 
              className="absolute bottom-[5%] h-16 md:h-24 w-24 md:w-32 bg-amber-700 rounded-b-3xl rounded-t-lg border-x-8 border-b-8 border-amber-900 shadow-xl flex items-end justify-center pb-2"
              style={{
                left: `${basketX}%`,
                transform: 'translateX(-50%)',
                transition: 'left 0.05s linear' // smooth following
              }}
            >
              <div className="text-white/50 font-bold text-xs">🎒 BAG</div>
            </div>
          </>
        )}

        {/* Start / Game Over Screen */}
        <AnimatePresence>
          {(!isPlaying || isGameOver) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-white p-6 text-center overflow-y-auto"
            >
              {!nickname && !isGameOver ? (
                <GameLoginModal 
                  gameTitle="Catch the Grades" 
                  onStart={(name) => {
                    setNickname(name);
                    localStorage.setItem("ju_game_nickname", name);
                    startGame();
                  }} 
                />
              ) : isGameOver ? (
                <div className="bg-card text-card-foreground p-6 rounded-3xl w-full max-w-md border-2 border-border shadow-2xl my-auto">
                  <h2 className="text-4xl font-black mb-2 text-destructive">Game Over!</h2>
                  <p className="text-muted-foreground mb-6">আবার চেষ্টা করো, {nickname.replace(" ✅", "")}!</p>
                  
                  <div className="bg-muted rounded-xl p-4 mb-6 border border-border">
                    <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-1">তোমার স্কোর</p>
                    <p className="font-display text-5xl font-black text-primary">{score}</p>
                  </div>
                  
                  <Button size="lg" onClick={startGame} className="w-full text-lg py-6 rounded-xl bg-primary hover:bg-primary/90 mb-4 font-bold shadow-md">
                    আবার খেলো 🚀
                  </Button>

                  <div className="mt-4 border-t border-border pt-4">
                     <GameLeaderboard gameName="catch-grades" ascending={false} />
                  </div>
                </div>
              ) : (
                <div className="bg-card text-card-foreground p-8 rounded-3xl w-full max-w-md border-2 border-border shadow-2xl my-auto">
                  <h1 className="text-4xl md:text-5xl font-black mb-4">Catch the Grades</h1>
                  <p className="text-muted-foreground mb-6">
                    স্বাগতম, <strong className="text-primary text-lg">{nickname}</strong>! <br/><br/>
                    A+ এবং সিঙ্গারা গুলো ব্যাগে ভরো! Assignment আর F গ্রেড থেকে সাবধান!
                  </p>
                  <Button size="lg" onClick={startGame} className="w-full text-lg py-6 rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-md mb-6">
                    খেলা শুরু করো
                  </Button>
                  <div className="mt-2 border-t border-border pt-4">
                     <GameLeaderboard gameName="catch-grades" ascending={false} />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
