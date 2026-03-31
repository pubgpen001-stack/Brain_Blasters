import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toRoman } from '../utils/roman';
import './SpaceInvadersMode.css';

const LEVELS = {
  1: { max: 10, cols: 4, rows: 2, speed: 1.2 },
  2: { max: 20, cols: 5, rows: 2, speed: 1.5 },
  3: { max: 30, cols: 5, rows: 3, speed: 1.8 },
  4: { max: 40, cols: 6, rows: 3, speed: 2.2 },
  5: { max: 50, cols: 6, rows: 3, speed: 2.5 },
  6: { max: 50, cols: 7, rows: 3, speed: 3.0 },
};

const GAME_W = 800;
const GAME_H = 600;
const SHIP_W = 60;
const SHIP_H = 40;
const BULLET_W = 4;
const BULLET_H = 16;
const INVADER_W = 70;
const INVADER_H = 45;
const BULLET_SPEED = 10;

const SpaceInvadersMode = ({ onBack }) => {
  const [gameState, setGameState] = useState('playing');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [target, setTarget] = useState(null);
  const [shipX, setShipX] = useState(GAME_W / 2 - SHIP_W / 2);
  const [bullets, setBullets] = useState([]);
  const [invaders, setInvaders] = useState([]);
  const [invaderDir, setInvaderDir] = useState(1);
  const [invaderOffsetX, setInvaderOffsetX] = useState(0);
  const [invaderOffsetY, setInvaderOffsetY] = useState(0);
  const [explosions, setExplosions] = useState([]);
  const [flash, setFlash] = useState(null);

  const keysRef = useRef({});
  const gameRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Generate invaders for current level
  const generateInvaders = useCallback((lvl) => {
    const config = LEVELS[lvl];
    const inv = [];
    const usedNums = new Set();
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        let num;
        do { num = Math.floor(Math.random() * config.max) + 1; } while (usedNums.has(num) && usedNums.size < config.max);
        usedNums.add(num);
        inv.push({ id: `${r}-${c}`, num, roman: toRoman(num), row: r, col: c, alive: true });
      }
    }
    return inv;
  }, []);

  // Pick a target from alive invaders
  const pickTarget = useCallback((inv) => {
    const alive = inv.filter(i => i.alive);
    if (alive.length === 0) return null;
    const pick = alive[Math.floor(Math.random() * alive.length)];
    return { num: pick.num, roman: pick.roman };
  }, []);

  // Initialize level
  useEffect(() => {
    if (gameState !== 'playing') return;
    const inv = generateInvaders(level);
    setInvaders(inv);
    setInvaderDir(1);
    setInvaderOffsetX(0);
    setInvaderOffsetY(0);
    setBullets([]);
    const t = pickTarget(inv);
    setTarget(t);
  }, [level, gameState]);

  // Keyboard handlers
  useEffect(() => {
    const onDown = (e) => { keysRef.current[e.key] = true; if (e.key === ' ') e.preventDefault(); };
    const onUp = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  // Shoot on spacebar (with cooldown)
  const lastShotRef = useRef(0);
  const shoot = useCallback(() => {
    const now = Date.now();
    if (now - lastShotRef.current < 300) return;
    lastShotRef.current = now;
    setBullets(prev => [...prev, { id: now, x: shipX + SHIP_W / 2 - BULLET_W / 2, y: GAME_H - SHIP_H - 20 }]);
  }, [shipX]);

  // Get invader position
  const getInvaderPos = useCallback((inv) => {
    const config = LEVELS[level];
    const totalW = config.cols * (INVADER_W + 10);
    const startX = (GAME_W - totalW) / 2;
    const x = startX + inv.col * (INVADER_W + 10) + invaderOffsetX;
    const y = 60 + inv.row * (INVADER_H + 12) + invaderOffsetY;
    return { x, y };
  }, [level, invaderOffsetX, invaderOffsetY]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const loop = (time) => {
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;
      if (dt > 100) { animFrameRef.current = requestAnimationFrame(loop); return; }

      // Ship movement
      const keys = keysRef.current;
      const shipSpeed = 6;
      if (keys['ArrowLeft'] || keys['a']) setShipX(prev => Math.max(0, prev - shipSpeed));
      if (keys['ArrowRight'] || keys['d']) setShipX(prev => Math.min(GAME_W - SHIP_W, prev + shipSpeed));
      if (keys[' ']) shoot();

      // Move bullets
      setBullets(prev => prev.map(b => ({ ...b, y: b.y - BULLET_SPEED })).filter(b => b.y > -BULLET_H));

      // Move invaders
      const config = LEVELS[level];
      setInvaderOffsetX(prev => {
        const next = prev + config.speed * invaderDir;
        const totalW = config.cols * (INVADER_W + 10);
        const startX = (GAME_W - totalW) / 2;
        if (startX + next + totalW > GAME_W - 10 || startX + next < 10) {
          setInvaderDir(d => -d);
          setInvaderOffsetY(py => py + 20);
          return prev;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [gameState, shoot, level, invaderDir]);

  // Collision detection (separate effect to avoid stale closures)
  useEffect(() => {
    if (gameState !== 'playing') return;

    const checkInterval = setInterval(() => {
      setBullets(prevBullets => {
        let newBullets = [...prevBullets];
        let hitIdx = -1;
        let hitBulletId = null;

        setInvaders(prevInvaders => {
          const newInvaders = [...prevInvaders];
          for (const bullet of newBullets) {
            for (let i = 0; i < newInvaders.length; i++) {
              const inv = newInvaders[i];
              if (!inv.alive) continue;
              const pos = getInvaderPos(inv);
              if (bullet.x > pos.x && bullet.x < pos.x + INVADER_W && bullet.y > pos.y && bullet.y < pos.y + INVADER_H) {
                hitIdx = i;
                hitBulletId = bullet.id;
                break;
              }
            }
            if (hitIdx >= 0) break;
          }

          if (hitIdx >= 0) {
            const hitInv = newInvaders[hitIdx];
            const pos = getInvaderPos(hitInv);

            if (target && hitInv.num === target.num) {
              // Correct!
              newInvaders[hitIdx] = { ...hitInv, alive: false };
              setScore(s => s + 10 * level);
              setExplosions(prev => [...prev, { id: Date.now(), x: pos.x, y: pos.y, type: 'correct' }]);
              setFlash({ text: '🚀 BOOM!', type: 'pos' });
              setTimeout(() => setFlash(null), 800);
              // Pick new target or level up
              const remaining = newInvaders.filter(i => i.alive);
              if (remaining.length === 0) {
                if (level < 6) {
                  setLevel(l => l + 1);
                } else {
                  setGameState('win');
                }
              } else {
                const newTarget = remaining[Math.floor(Math.random() * remaining.length)];
                setTarget({ num: newTarget.num, roman: newTarget.roman });
              }
            } else {
              // Wrong target hit
              setExplosions(prev => [...prev, { id: Date.now(), x: pos.x, y: pos.y, type: 'wrong' }]);
              setFlash({ text: `${hitInv.roman} = ${hitInv.num}`, type: 'neg' });
              setTimeout(() => setFlash(null), 800);
              setLives(l => { if (l <= 1) { setGameState('gameover'); return 0; } return l - 1; });
            }
          }

          return newInvaders;
        });

        if (hitBulletId !== null) {
          return newBullets.filter(b => b.id !== hitBulletId);
        }
        return newBullets;
      });
    }, 50);

    return () => clearInterval(checkInterval);
  }, [gameState, target, level, getInvaderPos]);

  // Clean up explosions
  useEffect(() => {
    if (explosions.length === 0) return;
    const t = setTimeout(() => setExplosions(prev => prev.slice(1)), 600);
    return () => clearTimeout(t);
  }, [explosions]);

  // Check if invaders reached the bottom
  useEffect(() => {
    const config = LEVELS[level];
    const bottomY = 60 + (config.rows - 1) * (INVADER_H + 12) + invaderOffsetY + INVADER_H;
    if (bottomY >= GAME_H - SHIP_H - 30 && gameState === 'playing') {
      setGameState('gameover');
    }
  }, [invaderOffsetY, level, gameState]);

  // Touch controls (mobile)
  const handleAreaTap = (e) => {
    const rect = gameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tapX = e.clientX - rect.left;
    const relX = (tapX / rect.width) * GAME_W;
    setShipX(Math.max(0, Math.min(GAME_W - SHIP_W, relX - SHIP_W / 2)));
    shoot();
  };

  if (gameState === 'gameover' || gameState === 'win') {
    return (
      <div className="si-gameover glass-panel">
        <h1>{gameState === 'win' ? '🎉 YOU WIN!' : 'GAME OVER'}</h1>
        <p className="si-final-score">SCORE: {score}</p>
        <p className="si-final-level">LEVEL REACHED: {level}</p>
        <div className="si-gameover-actions">
          <button className="btn-primary" onClick={() => { setGameState('playing'); setScore(0); setLives(3); setLevel(1); }}>PLAY AGAIN</button>
          <button className="back-btn-static" onClick={onBack}>BACK TO MENU</button>
        </div>
      </div>
    );
  }

  return (
    <div className="si-wrapper">
      <button className="back-btn" onClick={onBack}>QUIT</button>

      <div className="si-hud">
        <div className="si-hud-item si-hearts">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < lives ? "heart filled" : "heart empty"}>❤️</span>
          ))}
        </div>
        <div className="si-hud-item si-target-box">
          <span className="si-find-label">SHOOT:</span>
          <span className="si-target-num">{target?.num}</span>
        </div>
        <div className="si-hud-item si-stats">
          <div>SCORE: {score}</div>
          <div className="si-level-label">LEVEL: {level}</div>
        </div>
      </div>

      <div className="si-game" ref={gameRef} onClick={handleAreaTap} style={{ width: GAME_W, height: GAME_H }}>
        {/* Invaders */}
        {invaders.filter(i => i.alive).map(inv => {
          const pos = getInvaderPos(inv);
          return (
            <div key={inv.id} className={`si-invader ${target && inv.num === target.num ? 'si-target-glow' : ''}`}
              style={{ left: pos.x, top: pos.y, width: INVADER_W, height: INVADER_H }}>
              {inv.roman}
            </div>
          );
        })}

        {/* Bullets */}
        {bullets.map(b => (
          <div key={b.id} className="si-bullet" style={{ left: b.x, top: b.y, width: BULLET_W, height: BULLET_H }} />
        ))}

        {/* Ship */}
        <div className="si-ship" style={{ left: shipX, top: GAME_H - SHIP_H - 10, width: SHIP_W, height: SHIP_H }}>
          ▲
        </div>

        {/* Explosions */}
        {explosions.map(e => (
          <div key={e.id} className={`si-explosion ${e.type}`} style={{ left: e.x, top: e.y }}>💥</div>
        ))}

        {/* Flash feedback */}
        {flash && <div className={`si-flash ${flash.type}`}>{flash.text}</div>}
      </div>

      <p className="si-controls-hint">← → to move &nbsp;|&nbsp; SPACE to shoot &nbsp;|&nbsp; Tap to aim + fire</p>
    </div>
  );
};

export default SpaceInvadersMode;
