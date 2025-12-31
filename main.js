/**
 * ROK CLONE 3D - ENGINE v2.5 (UI BRIDGE)
 * Role: Senior Frontend Architect
 */

const COMMANDER_DATA = {
    MURAT: { name: "Murat", color: 0xef4444, skill: "Piyade Ustası", desc: "Piyade birliklerine %20 saldırı bonusu verir." },
    CANSU: { name: "Cansu", color: 0xec4899, skill: "Hızlı Akıncı", desc: "Ordu hareket hızını %35 artırır." },
    GOKDENIZ: { name: "Gökdeniz", color: 0x3b82f6, skill: "Kuşatma Uzmanı", desc: "Şehir surlarına verilen hasarı artırır." },
    SERIFE: { name: "Şerife", color: 0x10b981, skill: "Bilge Savunucu", desc: "Gelen hasarı %15 oranında azaltır." },
    CAN: { name: "Can", color: 0xf59e0b, skill: "Altın Lider", desc: "Toplanan kaynak miktarını %25 artırır." },
    SAHILIN: { name: "Sahilin", color: 0x8b5cf6, skill: "Mistik Gözcü", desc: "Harita keşif menzilini iki katına çıkarır." }
};

class Game3D {
    constructor() {
        this.units = [];
        this.selectedUnit = null;
        this.loaderProgress = 0;
        
        this.init();
    }

    async init() {
        // UI Elements
        this.loader = document.getElementById('loader');
        this.progressBar = document.getElementById('progress');
        this.selectionCard = document.getElementById('selection-card');

        // Three.js Core
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.Fog(0x050505, 20, 80);

        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('gameCanvas'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 20, 25);
        this.camera.lookAt(0, 0, 0);

        // Lights
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(10, 20, 10);
        this.scene.add(sun);

        // Assets
        this.createWorld();
        this.spawnCommanders();
        this.setupInteractions();

        // Simulate Loading
        this.simulateLoading();
    }

    simulateLoading() {
        const interval = setInterval(() => {
            this.loaderProgress += Math.random() * 15;
            this.progressBar.style.width = `${Math.min(this.loaderProgress, 100)}%`;

            if (this.loaderProgress >= 100) {
                clearInterval(interval);
                this.loader.style.opacity = '0';
                setTimeout(() => {
                    this.loader.style.display = 'none';
                    this.animate();
                }, 500);
            }
        }, 100);
    }

    createWorld() {
        const grid = new THREE.GridHelper(200, 50, 0x444444, 0x111111);
        this.scene.add(grid);

        const groundGeo = new THREE.PlaneGeometry(500, 500);
        const groundMat = new THREE.MeshPhongMaterial({ color: 0x080808 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.name = "Ground";
        this.scene.add(ground);
    }

    spawnCommanders() {
        let i = 0;
        for (const key in COMMANDER_DATA) {
            const data = COMMANDER_DATA[key];
            const geo = new THREE.IcosahedronGeometry(1.2, 0);
            const mat = new THREE.MeshStandardMaterial({ 
                color: data.color, 
                roughness: 0.3, 
                metalness: 0.8,
                emissive: data.color,
                emissiveIntensity: 0.2
            });
            const mesh = new THREE.Mesh(geo, mat);
            
            mesh.position.set(i * 6 - 15, 1.5, 0);
            mesh.userData = { ...data, target: mesh.position.clone() };
            mesh.name = "Unit_" + key;
            
            this.scene.add(mesh);
            this.units.push(mesh);
            i++;
        }
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
                
                if (e.button === 0) { // LEFT CLICK: SELECT
                    if (obj.name.startsWith("Unit_")) {
                        this.selectCommander(obj);
                    } else {
                        this.deselect();
                    }
                } else if (e.button === 2 && this.selectedUnit) { // RIGHT CLICK: MOVE
                    const ground = intersects.find(i => i.object.name === "Ground");
                    if (ground) {
                        this.selectedUnit.userData.target.copy(ground.point);
                        this.selectedUnit.userData.target.y = 1.5;
                    }
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

    selectCommander(unit) {
        this.units.forEach(u => {
            u.scale.set(1, 1, 1);
            u.material.emissiveIntensity = 0.2;
        });

        this.selectedUnit = unit;
        unit.scale.set(1.5, 1.5, 1.5);
        unit.material.emissiveIntensity = 1;

        // UI Update & Animation
        document.getElementById('commander-name').innerText = unit.userData.name.toUpperCase();
        document.getElementById('commander-name').style.color = `#${unit.material.color.getHexString()}`;
        document.getElementById('commander-skill').innerText = unit.userData.desc;
        this.selectionCard.classList.remove('translate-y-32');
        this.selectionCard.classList.add('translate-y-0');

        // Update Coords UI
        document.getElementById('coords-ui').innerText = `X: ${Math.round(unit.position.x)}, Z: ${Math.round(unit.position.z)}`;
    }

    deselect() {
        this.selectedUnit = null;
        this.units.forEach(u => u.scale.set(1, 1, 1));
        this.selectionCard.classList.add('translate-y-32');
        this.selectionCard.classList.remove('translate-y-0');
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.units.forEach(unit => {
            const data = unit.userData;
            const dist = unit.position.distanceTo(data.target);
            if (dist > 0.1) {
                const dir = new THREE.Vector3().subVectors(data.target, unit.position).normalize();
                unit.position.addScaledVector(dir, 0.15);
                unit.rotation.y += 0.02;
            }
            // Hover effect
            unit.position.y = 1.5 + Math.sin(Date.now() * 0.002) * 0.2;
        });

        this.renderer.render(this.scene, this.camera);
    }
}

window.onload = () => new Game3D();
