/**
 * ROK CLONE - COMMANDER & UNIT SYSTEM
 * Role: Senior Frontend Architect
 */

// 1. KOMUTAN VERİ TABANI (Registry)
const COMMANDERS = {
    MURAT:     { name: "Murat",    color: "#ef4444", skill: "Piyade Ustası", speedMod: 1.0 }, // Kırmızı
    CANSU:     { name: "Cansu",    color: "#ec4899", skill: "Hızlı Akıncı",  speedMod: 1.8 }, // Pembe
    GOKDENIZ:  { name: "Gökdeniz", color: "#3b82f6", skill: "Kuşatma Uzmanı", speedMod: 0.8 }, // Mavi
    SERIFE:    { name: "Şerife",   color: "#10b981", skill: "Bilge Savunucu", speedMod: 1.2 }, // Yeşil
    CAN:       { name: "Can",      color: "#f59e0b", skill: "Altın Lider",    speedMod: 1.4 }, // Turuncu
    SAHILIN:   { name: "Sahilin",  color: "#8b5cf6", skill: "Mistik Gözcü",  speedMod: 1.6 }  // Mor
};

// 2. ENTITY & COMMANDER CLASS
class Unit {
    constructor(id, x, y, commanderKey) {
        const config = COMMANDERS[commanderKey];
        this.id = id;
        this.x = x;
        this.y = y;
        this.name = config.name;
        this.color = config.color;
        this.skill = config.skill;
        this.speed = 3 * config.speedMod;
        
        this.targetX = x;
        this.targetY = y;
        this.isSelected = false;
        this.radius = 18;
    }

    update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw(ctx, camera) {
        const sx = this.x + camera.x;
        const sy = this.y + camera.y;

        // Avant-Garde Aura (Glow Effect)
        if (this.isSelected) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        }

        // Komutan Gövdesi
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // İsim Etiketi
        ctx.fillStyle = "white";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(this.name.toUpperCase(), sx, sy - 25);
        
        // Seçim Halkası
        if (this.isSelected) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}

// 3. CORE ENGINE (Integrated)
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.units = [];
        this.camera = { x: 0, y: 0, isDragging: false, lx: 0, ly: 0 };
        this.init();
    }

    init() {
        this.resize();
        this.setupInput();
        
        // Sahneye Komutanları Diz
        let i = 0;
        for (const key in COMMANDERS) {
            this.units.push(new Unit(i, 150 + (i * 100), 300, key));
            i++;
        }
        
        this.run();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInput() {
        this.canvas.onmousedown = (e) => {
            this.camera.isDragging = true;
            this.camera.lx = e.clientX;
            this.camera.ly = e.clientY;

            // Seçim Kontrolü
            const wx = e.clientX - this.camera.x;
            const wy = e.clientY - this.camera.y;
            this.units.forEach(u => {
                const d = Math.sqrt((u.x - wx)**2 + (u.y - wy)**2);
                u.isSelected = d < u.radius;
            });
        };

        window.onmousemove = (e) => {
            if (this.camera.isDragging) {
                this.camera.x += e.clientX - this.camera.lx;
                this.camera.y += e.clientY - this.camera.ly;
                this.camera.lx = e.clientX;
                this.camera.ly = e.clientY;
            }
        };

        window.onmouseup = () => this.camera.isDragging = false;

        // Sağ Tık: Hareket Emri
        this.canvas.oncontextmenu = (e) => {
            e.preventDefault();
            this.units.forEach(u => {
                if (u.isSelected) {
                    u.targetX = e.clientX - this.camera.x;
                    u.targetY = e.clientY - this.camera.y;
                }
            });
        };
    }

    render() {
        this.ctx.fillStyle = "#0a0a0a";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Minimalist Grid
        this.ctx.strokeStyle = "rgba(255,255,255,0.05)";
        for(let x = this.camera.x % 50; x < this.canvas.width; x += 50) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke();
        }
        for(let y = this.camera.y % 50; y < this.canvas.height; y += 50) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke();
        }

        this.units.forEach(u => { u.update(); u.draw(this.ctx, this.camera); });
        
        requestAnimationFrame(() => this.render());
    }

    run() { requestAnimationFrame(() => this.render()); }
}

new GameEngine('gameCanvas');
