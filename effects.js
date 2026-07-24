/* ============================================================
   PARTICLES
   ============================================================ */

const particles = [];

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

/* ============================================================
   SOUND
   ============================================================ */

const sfx = {
    summon: new Audio("assets/sfx/summon.wav"),
    hit: new Audio("assets/sfx/hit.wav"),
    death: new Audio("assets/sfx/death.wav"),
    upgrade: new Audio("assets/sfx/upgrade.wav")
};

function playSfx(name) {
    const snd = sfx[name];
    if (!snd) return;
    snd.currentTime = 0;
    snd.play();
}

/* ============================================================
   ABILITIES
   ============================================================ */

const abilities = {
    dash: { cooldown: 2000, lastUsed: 0, duration: 150, active: false },
    shield: { cooldown: 5000, lastUsed: 0, duration: 2000, active: false },
    slowTime: { cooldown: 8000, lastUsed: 0, duration: 2000, active: false }
};

let timeScale = 1;

function useAbility(name) {
    const a = abilities[name];
    const now = performance.now();
    if (!a) return;
    if (now - a.lastUsed < a.cooldown) return;

    a.lastUsed = now;
    a.active = true;
    a.endAt = now + a.duration;

    if (name === "dash") {
        p.inv = true;
        p.speedBoost = 3;
        spawnParticles(p.x, p.y, "#66ffff", 30);
    } else if (name === "shield") {
        p.shield = true;
        spawnParticles(p.x, p.y, "#88ff88", 40);
    } else if (name === "slowTime") {
        timeScale = 0.4;
        spawnParticles(p.x, p.y, "#ff88ff", 40);
    }
}

function updateAbilities() {
    const now = performance.now();
    for (const name in abilities) {
        const a = abilities[name];
        if (a.active && now >= a.endAt) {
            a.active = false;

            if (name === "dash") {
                p.inv = false;
                p.speedBoost = 1;
            } else if (name === "shield") {
                p.shield = false;
            } else if (name === "slowTime") {
                timeScale = 1;
            }
        }
    }
}

window.addEventListener("keydown", e => {
    if (e.code === "KeyQ") useAbility("dash");
    if (e.code === "KeyE") useAbility("shield");
    if (e.code === "KeyR") useAbility("slowTime");
});

/* ============================================================
   SUMMON EVOLUTION
   ============================================================ */

function onSummonKill(s) {
    s.kills++;
    if (s.kills >= s.level * 10) {
        s.level++;
        s.damage += 5;
        s.range += 10;
        spawnParticles(s.x, s.y, "#ffff66", 20);
        playSfx("upgrade");
    }
}

/* ============================================================
   LOOT
   ============================================================ */

let shards = 0;

function dropLoot(e) {
    if (Math.random() < 0.4) {
        shards++;
        spawnParticles(e.x, e.y, "#00ffcc", 10);
    }
}

/* ============================================================
   ENEMY WAVES (UPGRADED)
   ============================================================ */

function spawnEnemyWave() {
    const count = difficulty * 8; // higher spawn rate

    for (let i = 0; i < count; i++) {
        enemy.push({
            x: Math.random() * c.width,
            y: Math.random() * c.height,

            hp: 20 + difficulty * 5, // stronger enemies

            size: 20,

            vx: (Math.random() - 0.5) * (2 + difficulty * 0.2), // faster enemies
            vy: (Math.random() - 0.5) * (2 + difficulty * 0.2)
        });
    }
}

function spawnBoss() {
    boss = {
        x: c.width / 2,
        y: -80,
        hp: 500 + difficulty * 50,
        maxHp: 500 + difficulty * 50,
        size: 40,
        vx: 0,
        vy: 2 + difficulty * 0.1
    };
}

function updateWaveSystem() {
    if (!boss && enemy.length === 0) {

        difficulty++;

        if (difficulty % 5 === 0) {
            spawnBoss();
        } else {
            spawnEnemyWave();
        }
    }
}

/* ============================================================
   HUD
   ============================================================ */

function drawHUD() {
    const hpW = 150;

    x.fillStyle = "#222";
    x.fillRect(20, 20, hpW, 10);

    x.fillStyle = "#44ff44";
    x.fillRect(20, 20, hpW * (p.hp / p.maxHp), 10);

    x.fillStyle = "#00ffcc";
    x.font = "14px Arial";
    x.fillText("Shards: " + shards, 20, 50);

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

    x.fillStyle = "#ff4444";
    x.fillRect(xPos, yPos, w * (boss.hp / boss.maxHp), 10);
}
