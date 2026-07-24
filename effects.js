// =========================
// GLOBAL EFFECTS STATE
// =========================

const particles = [];
const lasers = [];

// =========================
// PARTICLES
// =========================

function spawnParticles(xPos, yPos, color, count = 12) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: xPos,
      y: yPos,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 20 + Math.random() * 20,
      color
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    x.globalAlpha = Math.max(p.life / 40, 0);
    x.fillStyle = p.color;
    x.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  x.globalAlpha = 1;
}

// =========================
// ENEMY TYPES
// =========================
//
// We assume you have: let enemy = [] somewhere in your main script.
// If not, add: let enemy = []; near your other arrays.
//

function createEnemy(type) {
  if (type === "normal") {
    return {
      type: "normal",
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      r: 20,
      hp: 20 + difficulty * 5,
      s: 2 + difficulty * 0.2,
      col: "orange"
    };
  }

  if (type === "elite") {
    return {
      type: "elite",
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      r: 30,
      hp: 80 + difficulty * 15,
      s: 3 + difficulty * 0.3,
      col: "purple",
      dmg: 2
    };
  }

  if (type === "god") {
    return {
      type: "god",
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      r: 40,
      hp: 200 + difficulty * 30,
      s: 4 + difficulty * 0.4,
      col: "gold",
      laserCooldown: 0
    };
  }
}

// =========================
// GOD LASERS
// =========================

function updateGodEnemy(e) {
  e.laserCooldown--;

  if (e.laserCooldown <= 0) {
    e.laserCooldown = Math.max(40, 120 - difficulty * 2);

    lasers.push({
      x: e.x,
      y: e.y,
      dx: (p.x - e.x) / 15,
      dy: (p.y - e.y) / 15,
      life: 40
    });

    spawnParticles(e.x, e.y, "#ff0000", 20);
  }
}

function updateLasers() {
  for (let i = lasers.length - 1; i >= 0; i--) {
    const l = lasers[i];
    l.x += l.dx;
    l.y += l.dy;
    l.life--;

    // Hit player
    const d = Math.hypot(l.x - p.x, l.y - p.y);
    if (d < p.r && !p.inv && !p.shield) {
      p.hp -= 10;
      spawnParticles(p.x, p.y, "#ff4444", 20);
    }

    if (l.life <= 0) lasers.splice(i, 1);
  }
}

function drawLasers() {
  x.strokeStyle = "#ff0000";
  x.lineWidth = 3;
  for (const l of lasers) {
    x.beginPath();
    x.moveTo(l.x, l.y);
    x.lineTo(l.x - l.dx * 3, l.y - l.dy * 3);
    x.stroke();
  }
}

// =========================
// WAVE SYSTEM
// =========================
//
// Uses difficulty as "wave" counter.
// Spawns mix of normal / elite / god enemies.
//

function spawnEnemyWave() {
  const count = difficulty * 10; // higher spawn rate

  for (let i = 0; i < count; i++) {
    const r = Math.random();
    let type = "normal";
    if (r > 0.95) type = "god";
    else if (r > 0.70) type = "elite";

    enemy.push(createEnemy(type));
  }
}

function updateWaveSystem() {
  // If no boss and no enemies, spawn next wave
  if (!boss && enemy.length === 0) {
    difficulty++;

    if (difficulty % 5 === 0) {
      spawnBoss(); // uses your existing boss function
    } else {
      spawnEnemyWave();
    }
  }
}

// =========================
// SUMMON EVOLUTION → TURRETS
// =========================
//
// We assume your summons live in sums[] and have x,y,r,hp, etc.
//

function evolveSummon(s) {
  if (s.level === undefined) s.level = 1;
  if (s.kills === undefined) s.kills = 0;

  if (s.level >= 3 && !s.isTurret) {
    s.isTurret = true;
    s.fireRate = 20;
    s.fireCooldown = 0;
    s.range = (s.range || 100) + 80;
    s.damage = (s.damage || p.dmg) + 10;

    spawnParticles(s.x, s.y, "#00ffff", 40);
  }
}

function onSummonKill(s) {
  if (s.kills === undefined) s.kills = 0;
  if (s.level === undefined) s.level = 1;

  s.kills++;
  if (s.kills >= s.level * 10) {
    s.level++;
    s.damage = (s.damage || p.dmg) + 5;
    s.range = (s.range || 100) + 10;

    spawnParticles(s.x, s.y, "#ffff66", 20);
    evolveSummon(s);
  }
}

function updateTurret(s) {
  if (!s.isTurret) return;
  if (s.fireCooldown === undefined) s.fireCooldown = 0;
  if (s.fireRate === undefined) s.fireRate = 20;

  s.fireCooldown--;

  if (s.fireCooldown <= 0) {
    // Find closest enemy in range
    let closest = null;
    let dist = Infinity;

    for (const e of enemy) {
      const d = Math.hypot(e.x - s.x, e.y - s.y);
      if (d < dist && d < (s.range || 150)) {
        dist = d;
        closest = e;
      }
    }

    if (closest) {
      s.fireCooldown = s.fireRate;

      shots.push({
        x: s.x,
        y: s.y,
        dx: (closest.x - s.x) / 15,
        dy: (closest.y - s.y) / 15,
        dmg: s.damage || p.dmg
      });

      spawnParticles(s.x, s.y, "#00ccff", 10);
    }
  }
}

// =========================
// HUD + BOSS BAR
// =========================

function drawHUD() {
  const hpW = 150;

  x.fillStyle = "#222";
  x.fillRect(20, 20, hpW, 10);

  x.fillStyle = "#44ff44";
  x.fillRect(20, 20, hpW * (p.hp / p.maxHp), 10);

  x.fillStyle = "#00ffcc";
  x.font = "14px Arial";
  x.fillText("Mana: " + Math.floor(p.mana) + "/" + p.maxMana, 20, 50);

  x.fillStyle = "#ffffff";
  x.fillText("Wave: " + difficulty, 20, 70);
}

function drawBossUI() {
  if (!boss) return;

  const w = 200;
  const xPos = (c.width - w) / 2;
  const yPos = 20;

  x.fillStyle = "#222";
  x.fillRect(xPos, yPos, w, 10);

  x.fillStyle = boss.col || "#ff4444";
  x.fillRect(xPos, yPos, w * (boss.hp / (boss.hp || 1)), 10);
}

// =========================
// MAIN HOOK HELPERS
// =========================
//
// Call these from your existing main loop in index.html:
//   - effectsUpdate()
//   - effectsDraw()
//

function effectsUpdate() {
  updateParticles();
  updateLasers();
  updateWaveSystem();

  // Turret behavior for evolved summons
  for (const s of sums) {
    updateTurret(s);
  }

  // God enemies laser logic
  for (const e of enemy) {
    if (e.type === "god") updateGodEnemy(e);
  }
}

function effectsDraw() {
  drawLasers();
  drawParticles();
  drawBossUI();
  drawHUD();
}
