import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toRoman } from '../utils/roman';
import './SpaceInvadersMode.css';

const LEVELS = {
  1: { max: 10, cols: 5, rows: 1, speed: 0.8 },
  2: { max: 15, cols: 6, rows: 1, speed: 1.0 },
  3: { max: 20, cols: 5, rows: 2, speed: 1.2 },
  4: { max: 30, cols: 6, rows: 2, speed: 1.5 },
  5: { max: 40, cols: 5, rows: 3, speed: 1.8 },
  6: { max: 50, cols: 6, rows: 3, speed: 2.2 },
};

const SHIP_SPEED = 5;
const BULLET_SPEED = 7;

const SpaceInvadersMode = ({ onBack }) => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef('playing');
  const [uiState, setUiState] = useState({ score: 0, lives: 3, level: 1, target: null, gameState: 'playing' });

  const stateRef = useRef({
    shipX: 0.5,
    bullets: [],
    invaders: [],
    invaderDir: 1,
    invaderOffX: 0,
    invaderDropped: 0,
    target: null,
    score: 0,
    lives: 3,
    level: 1,
    keys: {},
    lastShot: 0,
    explosions: [],
    flash: null,
    flashTime: 0,
  });

  const buildInvaders = (lvl) => {
    const config = LEVELS[lvl];
    const inv = [];
    const used = new Set();
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        let num;
        do { num = Math.floor(Math.random() * config.max) + 1; } while (used.has(num) && used.size < config.max);
        used.add(num);
        inv.push({ num, roman: toRoman(num), row: r, col: c, alive: true });
      }
    }
    return inv;
  };

  const pickTarget = (invaders) => {
    const alive = invaders.filter(i => i.alive);
    if (alive.length === 0) return null;
    return alive[Math.floor(Math.random() * alive.length)];
  };

  const initLevel = (lvl) => {
    const s = stateRef.current;
    s.invaders = buildInvaders(lvl);
    s.invaderDir = 1;
    s.invaderOffX = 0;
    s.invaderDropped = 0;
    s.bullets = [];
    s.explosions = [];
    s.level = lvl;
    const t = pickTarget(s.invaders);
    s.target = t ? { num: t.num, roman: t.roman } : null;
    s.shipX = 0.5;
  };

  useEffect(() => {
    initLevel(1);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const onKey = (e, down) => {
      stateRef.current.keys[e.key] = down;
      if (e.key === ' ') e.preventDefault();
    };
    const kd = (e) => onKey(e, true);
    const ku = (e) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    let animId;
    const W = canvas.width;
    const H = canvas.height;
    const SHIP_W = 50;
    const SHIP_H = 30;
    const INV_W = 60;
    const INV_H = 36;
    const INV_GAP_X = 14;
    const INV_GAP_Y = 55;
    const BULT_W = 4;
    const BULT_H = 14;

    const getInvPos = (inv, s) => {
      const config = LEVELS[s.level];
      const totalW = config.cols * (INV_W + INV_GAP_X) - INV_GAP_X;
      const startX = (W - totalW) / 2;
      const x = startX + inv.col * (INV_W + INV_GAP_X) + s.invaderOffX;
      const y = 50 + inv.row * (INV_H + INV_GAP_Y) + s.invaderDropped;
      return { x, y };
    };

    const loop = () => {
      const s = stateRef.current;
      if (gameStateRef.current !== 'playing') { animId = requestAnimationFrame(loop); return; }

      // Input
      if (s.keys['ArrowLeft'] || s.keys['a']) s.shipX = Math.max(0, s.shipX - SHIP_SPEED / W);
      if (s.keys['ArrowRight'] || s.keys['d']) s.shipX = Math.min(1, s.shipX + SHIP_SPEED / W);
      if (s.keys[' ']) {
        const now = Date.now();
        if (now - s.lastShot > 350) {
          s.lastShot = now;
          s.bullets.push({ x: s.shipX * W, y: H - SHIP_H - 15 });
        }
      }

      // Move bullets
      s.bullets = s.bullets.filter(b => { b.y -= BULLET_SPEED; return b.y > -20; });

      // Move invaders
      const config = LEVELS[s.level];
      s.invaderOffX += config.speed * s.invaderDir;
      const totalW = config.cols * (INV_W + INV_GAP_X) - INV_GAP_X;
      const startX = (W - totalW) / 2;
      const leftEdge = startX + s.invaderOffX;
      const rightEdge = leftEdge + totalW;
      if (rightEdge > W - 15 || leftEdge < 15) {
        s.invaderDir *= -1;
        s.invaderDropped += 18;
      }

      // Collision: bullets vs invaders
      for (let bi = s.bullets.length - 1; bi >= 0; bi--) {
        const b = s.bullets[bi];
        for (let ii = 0; ii < s.invaders.length; ii++) {
          const inv = s.invaders[ii];
          if (!inv.alive) continue;
          const pos = getInvPos(inv, s);
          if (b.x > pos.x - BULT_W && b.x < pos.x + INV_W && b.y > pos.y && b.y < pos.y + INV_H) {
            // Hit!
            s.bullets.splice(bi, 1);
            if (s.target && inv.num === s.target.num) {
              inv.alive = false;
              s.score += 10 * s.level;
              s.explosions.push({ x: pos.x + INV_W / 2, y: pos.y + INV_H / 2, t: Date.now(), type: 'good' });
              s.flash = '🚀 BOOM!';
              s.flashTime = Date.now();
              const remaining = s.invaders.filter(i => i.alive);
              if (remaining.length === 0) {
                if (s.level < 6) {
                  initLevel(s.level + 1);
                } else {
                  gameStateRef.current = 'win';
                  setUiState({ score: s.score, lives: s.lives, level: s.level, target: s.target, gameState: 'win' });
                }
              } else {
                const nt = remaining[Math.floor(Math.random() * remaining.length)];
                s.target = { num: nt.num, roman: nt.roman };
              }
            } else {
              s.explosions.push({ x: pos.x + INV_W / 2, y: pos.y + INV_H / 2, t: Date.now(), type: 'bad' });
              s.flash = `${inv.roman} = ${inv.num}`;
              s.flashTime = Date.now();
              s.lives--;
              if (s.lives <= 0) {
                gameStateRef.current = 'gameover';
                setUiState({ score: s.score, lives: 0, level: s.level, target: s.target, gameState: 'gameover' });
                return;
              }
            }
            break;
          }
        }
      }

      // Check if invaders reached bottom
      const bottomInv = s.invaders.filter(i => i.alive).reduce((max, inv) => {
        const pos = getInvPos(inv, s);
        return Math.max(max, pos.y + INV_H);
      }, 0);
      if (bottomInv > H - SHIP_H - 40) {
        gameStateRef.current = 'gameover';
        setUiState({ score: s.score, lives: s.lives, level: s.level, target: s.target, gameState: 'gameover' });
        return;
      }

      // Clean old explosions
      s.explosions = s.explosions.filter(e => Date.now() - e.t < 500);
      if (s.flash && Date.now() - s.flashTime > 800) s.flash = null;

      // Update UI state (throttled)
      setUiState({ score: s.score, lives: s.lives, level: s.level, target: s.target, gameState: 'playing' });

      // === DRAW ===
      ctx.clearRect(0, 0, W, H);

      // Invaders
      s.invaders.forEach(inv => {
        if (!inv.alive) return;
        const pos = getInvPos(inv, s);
        const isTarget = s.target && inv.num === s.target.num;
        // Box
        ctx.fillStyle = isTarget ? 'rgba(34, 211, 238, 0.25)' : 'rgba(168, 85, 247, 0.35)';
        ctx.strokeStyle = isTarget ? '#22d3ee' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(pos.x, pos.y, INV_W, INV_H, 8);
        ctx.fill();
        ctx.stroke();
        // Glow for target
        if (isTarget) {
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 15;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
        // Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(inv.roman, pos.x + INV_W / 2, pos.y + INV_H / 2);
      });

      // Bullets
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 8;
      s.bullets.forEach(b => {
        ctx.fillRect(b.x - BULT_W / 2, b.y, BULT_W, BULT_H);
      });
      ctx.shadowBlur = 0;

      // Ship
      const sx = s.shipX * W;
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(sx, H - SHIP_H - 10);
      ctx.lineTo(sx - SHIP_W / 2, H - 10);
      ctx.lineTo(sx + SHIP_W / 2, H - 10);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Explosions
      s.explosions.forEach(e => {
        const age = (Date.now() - e.t) / 500;
        const size = 20 + age * 30;
        ctx.globalAlpha = 1 - age;
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥', e.x, e.y);
        ctx.globalAlpha = 1;
      });

      // Flash text
      if (s.flash) {
        const age = (Date.now() - s.flashTime) / 800;
        ctx.globalAlpha = 1 - age;
        ctx.fillStyle = s.flash.includes('BOOM') ? '#22d3ee' : '#f472b6';
        ctx.font = 'bold 40px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.flash, W / 2, H / 2);
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  // Touch/click to aim and shoot
  const handleTap = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const tapX = (e.clientX - rect.left) / rect.width;
    stateRef.current.shipX = Math.max(0, Math.min(1, tapX));
    const now = Date.now();
    if (now - stateRef.current.lastShot > 200) {
      stateRef.current.lastShot = now;
      stateRef.current.bullets.push({ x: tapX * canvas.width, y: canvas.height - 45 });
    }
  };

  const restart = () => {
    const s = stateRef.current;
    s.score = 0;
    s.lives = 3;
    gameStateRef.current = 'playing';
    initLevel(1);
    setUiState({ score: 0, lives: 3, level: 1, target: s.target, gameState: 'playing' });
  };

  if (uiState.gameState === 'gameover' || uiState.gameState === 'win') {
    return (
      <div className="si-gameover glass-panel">
        <h1>{uiState.gameState === 'win' ? '🎉 YOU WIN!' : 'GAME OVER'}</h1>
        <p className="si-final-score">SCORE: {uiState.score}</p>
        <p className="si-final-level">LEVEL REACHED: {uiState.level}</p>
        <div className="si-gameover-actions">
          <button className="btn-primary" onClick={restart}>PLAY AGAIN</button>
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
            <span key={i} className={i < uiState.lives ? "heart filled" : "heart empty"}>❤️</span>
          ))}
        </div>
        <div className="si-hud-item si-target-box">
          <span className="si-find-label">SHOOT:</span>
          <span className="si-target-num">{uiState.target?.num}</span>
        </div>
        <div className="si-hud-item si-stats">
          <div>SCORE: {uiState.score}</div>
          <div className="si-level-label">LEVEL: {uiState.level}</div>
        </div>
      </div>
      <canvas ref={canvasRef} width={700} height={500} className="si-canvas" onClick={handleTap} />
      <p className="si-controls-hint">← → to move &nbsp;|&nbsp; SPACE to shoot &nbsp;|&nbsp; Tap to aim + fire</p>
    </div>
  );
};

export default SpaceInvadersMode;
