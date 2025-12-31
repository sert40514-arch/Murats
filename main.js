/**
 * ROK CLONE 3D ENGINE - FINAL ARCHITECTURE
 * Features: Floating Labels, 3D Buildings, Movement
 */

const DATA = {
    COMMANDERS: {
        MURAT: { name: "Murat", color: 0xef4444, desc: "Piyade birimlerine %20 saldırı bonusu verir." },
        CANSU: { name: "Cansu", color: 0xec4899, desc: "Birlik hareket hızını %35 artırır." },
        GOKDENIZ: { name: "Gökdeniz", color: 0x3b82f6, desc: "Kuşatma hasarını %40 artırır." },
        SERIFE: { name: "Şerife", color: 0x10b981, desc: "Şehir savunmasını %25 güçlendirir." },
        CAN: { name: "Can", color: 0xf59e0b, desc: "Toplama hızını %30 artırır." },
        SAHILIN: { name: "Sahilin", color: 0x8b5cf6, desc: "Keşif menzilini %50 artırır." }
    },
    BUILDINGS: [
        { name: "City Hall", x: 0, z: -15, size: 5, color: 0xffffff },
        { name: "Barracks", x: 12, z: -10, size: 3, color: 0xaaaaaa },
        { name: "Academy", x: -12, z: -10, size: 3, color: 0xaaaaaa }
    ]
};

class Game3D {
    constructor() {
        this.units = [];
        this.labels = [];
        this.selectedUnit = null;
        this.init();
    }

    async init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.Fog(0x050505, 15, 90);

        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(25, 25, 35);
        this.camera.lookAt(0, 0, 0);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(20, 30, 10);
        this.scene.add(sun);

        this.createWorld();
        this.spawnBuildings();
        this.spawnCommanders();
        this.setupEvents();
        this.handleLoading();
    }

    createWorld() {
        const grid = new THREE.GridHelper(200, 40, 0x222222, 0x111111);
        this.scene.add(grid);
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(500,500), new THREE.MeshPhongMaterial({color: 0x070707}));
        ground.rotation.x = -Math.PI / 2;
        ground.name = "Ground";
        this.scene.add(ground);
    }

    spawnBuildings() {
        DATA.BUILDINGS.forEach(b => {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(b.size, b.size * 1.5, b.size),
                new THREE.MeshStandardMaterial({ color: b.color, metalness: 0.5, roughness: 0.2 })
            );
            mesh.position.set(b.x, (b.size * 1.5)/2, b.z);
            mesh.name = "Building_" + b.name;
            this.scene.add(mesh);
        });
    }

    spawnCommanders() {
        let i = 0;
        const container = document.getElementById('label-container');
        for (const key in DATA.COMMANDERS) {
            const d = DATA.COMMANDERS[key];
            const mesh = new THREE.Mesh(
                new THREE.IcosahedronGeometry(1.2),
                new THREE.MeshStandardMaterial({ color: d.color, emissive: d.color, emissiveIntensity: 0.3 })
            );
            mesh.position.set(i * 8 - 20, 1.5, 10);
            mesh.userData = { ...d, target: mesh.position.clone() };
            mesh.name = "Unit_" + key;
            
            // Create Label
            const label = document.createElement('div');
            label.className = 'floating-label';
            label.innerText = d.name.toUpperCase();
            label.style.color = `#${mesh.material.color.getHexString()}`;
            container.appendChild(label);
            
            this.units.push({ mesh, label });
            this.scene.add(mesh);
            i++;
        }
    }

    handleLoading() {
        const progressEl = document.getElementById('progress');
        const loaderEl = document.getElementById('loader');
        let val = 0;
        const timer = setInterval(() => {
            val += Math.random() * 25;
            progressEl.style.width = `${Math.min(val, 100)}%`;
            if (val >= 100) {
                clearInterval(timer);
                loaderEl.style.opacity = '0';
                setTimeout(() => { loaderEl.style.display = 'none'; this.animate(); }, 800);
            }
        }, 100);
    }

    setupEvents() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const card = document.getElementById('selection-card');

        window.addEventListener('mousedown', (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.scene.children);

            if (intersects.length > 0) {
                const obj = intersects[0].object;
                if (e.button === 0 && obj.name.startsWith("Unit_")) {
                    this.select(obj, card);
                } else if (e.button === 2 && this.selectedUnit) {
                    const g = intersects.find(i => i.object.name === "Ground");
                    if (g) this.selectedUnit.userData.target.copy(g.point).y = 1.5;
                } else if (e.button === 0 && obj.name === "Ground") {
                    this.deselect(card);
                }
            }
        });

        window.addEventListener('contextmenu', e => e.preventDefault());
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    select(unit, card) {
        this.units.forEach(u => { u.mesh.scale.set(1, 1, 1); u.mesh.material.emissiveIntensity = 0.3; });
        this.selectedUnit = unit;
        unit.scale.set(1.4, 1.4, 1.4);
        unit.material.emissiveIntensity = 1;

        document.getElementById('commander-name').innerText = unit.userData.name;
        document.getElementById('commander-name').style.color = `#${unit.material.color.getHexString()}`;
        document.getElementById('commander-desc').innerText = unit.userData.desc;
        document.getElementById('coords-ui').innerText = `LOC: ${Math.round(unit.position.x)}, ${Math.round(unit.position.z)}`;
        card.classList.replace('hide-card', 'show-card');
    }

    deselect(card) {
        this.selectedUnit = null;
        this.units.forEach(u => u.mesh.scale.set(1, 1, 1));
        card.classList.replace('show-card', 'hide-card');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.units.forEach(u => {
            const m = u.mesh;
            const d = m.userData;
            // Movement Logic
            if (m.position.distanceTo(d.target) > 0.1) {
                const dir = new THREE.Vector3().subVectors(d.target, m.position).normalize();
                m.position.addScaledVector(dir, 0.2);
                m.rotation.y += 0.05;
            }
            m.position.y = 1.5 + Math.sin(Date.now() * 0.003) * 0.2;

            // Update Label Position
            const vector = m.position.clone();
            vector.y += 2.5; // Label height offset
            vector.project(this.camera);
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
            u.label.style.left = `${x}px`;
            u.label.style.top = `${y}px`;
        });
        this.renderer.render(this.scene, this.camera);
    }
}

new Game3D();
