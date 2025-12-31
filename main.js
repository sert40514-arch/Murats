/**
 * ROK CLONE 3D - ULTIMATE ENGINE
 * Version: 2.0 (Three.js & UI Sync)
 */

const COMMANDER_DATA = {
    MURAT: { name: "Murat", color: 0xef4444, skill: "Piyade Ustası", speed: 0.15 },
    CANSU: { name: "Cansu", color: 0xec4899, skill: "Hızlı Akıncı", speed: 0.25 },
    GOKDENIZ: { name: "Gökdeniz", color: 0x3b82f6, skill: "Kuşatma Uzmanı", speed: 0.10 },
    SERIFE: { name: "Şerife", color: 0x10b981, skill: "Bilge Savunucu", speed: 0.18 },
    CAN: { name: "Can", color: 0xf59e0b, skill: "Altın Lider", speed: 0.20 },
    SAHILIN: { name: "Sahilin", color: 0x8b5cf6, skill: "Mistik Gözcü", speed: 0.22 }
};

class Game3D {
    constructor() {
        this.units = [];
        this.selectedUnit = null;
        this.cameraZoom = 15;
        this.init();
    }

    init() {
        // Scene & Renderer
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.Fog(0x050505, 20, 100);

        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('gameCanvas'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.updateCameraPosition();

        // Lights
        const amb = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(amb);
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(5, 10, 7.5);
        this.scene.add(sun);

        // World Construction
        this.createWorld();
        this.spawnCommanders();
        this.setupInteractions();
        this.animate();
    }

    createWorld() {
        // Infinite-like Grid
        const grid = new THREE.GridHelper(200, 100, 0x444444, 0x222222);
        this.scene.add(grid);

        // Ground Plane
        const planeGeo = new THREE.PlaneGeometry(200, 200);
        const planeMat = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
        const ground = new THREE.Mesh(planeGeo, planeMat);
        ground.rotation.x = -Math.PI / 2;
        ground.name = "Ground";
        this.scene.add(ground);
    }

    spawnCommanders() {
        let i = 0;
        for (const key in COMMANDER_DATA) {
            const data = COMMANDER_DATA[key];
            // Avant-Garde Octahedron Shape for Commanders
            const geo = new THREE.OctahedronGeometry(0.8);
            const mat = new THREE.MeshPhongMaterial({ color: data.color, emissive: data.color, emissiveIntensity: 0.2 });
            const mesh = new THREE.Mesh(geo, mat);
            
            mesh.position.set(i * 4 - 10, 1, 0);
            mesh.userData = { ...data, target: mesh.position.clone() };
            mesh.name = "Unit_" + key;
            
            this.scene.add(mesh);
            this.units.push(mesh);
            i++;
        }
    }

    updateCameraPosition() {
        this.camera.position.set(0, this.cameraZoom, this.cameraZoom * 0.8);
        this.camera.lookAt(0, 0, 0);
    }

    setupInteractions() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('mousedown', (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, this.camera);

            const intersects = raycaster.intersectObjects(this.scene.children);
            if (intersects.length > 0) {
                const obj = intersects[0].object;
                
                if (e.button === 0) { // Sol Tık: SEÇİM
                    if (obj.name.startsWith("Unit_")) {
                        this.selectUnit(obj);
                    }
                } else if (e.button === 2 && this.selectedUnit) { // Sağ Tık: HAREKET
                    const groundPoint = intersects.find(i => i.object.name === "Ground");
                    if (groundPoint) {
                        this.selectedUnit.userData.target.copy(groundPoint.point);
                        this.selectedUnit.userData.target.y = 1; // Havada kalmasın
                    }
                }
            }
        });

        // Zoom Kontrolü
        window.addEventListener('wheel', (e) => {
            this.cameraZoom = Math.max(5, Math.min(50, this.cameraZoom + e.deltaY * 0.05));
            this.updateCameraPosition();
        });

        window.addEventListener('contextmenu', e => e.preventDefault());
    }

    selectUnit(unit) {
        // Reset old selection
        this.units.forEach(u => {
            u.scale.set(1, 1, 1);
            u.material.emissiveIntensity = 0.2;
        });

        this.selectedUnit = unit;
        unit.scale.set(1.4, 1.4, 1.4);
        unit.material.emissiveIntensity = 1;

        // UI SYNC
        document.getElementById('selected-name').innerText = unit.userData.name.toUpperCase();
        document.getElementById('selected-name').style.color = `#${unit.material.color.getHexString()}`;
        document.getElementById('selected-skill').innerText = unit.userData.skill;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.units.forEach(unit => {
            const data = unit.userData;
            const dist = unit.position.distanceTo(data.target);
            if (dist > 0.1) {
                const dir = new THREE.Vector3().subVectors(data.target, unit.position).normalize();
                unit.position.addScaledVector(dir, data.speed);
                unit.rotation.y += 0.05; // Hareket ederken dönsün (Görsel efekt)
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}

new Game3D();
