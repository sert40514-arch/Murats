/**
 * ROK CLONE 3D - MODERN WEBGL ENGINE
 * Role: Senior Frontend Architect & 3D Engineer
 */

// 1. KOMUTAN VE DÜNYA AYARLARI
const COMMANDER_DATA = {
    MURAT: { name: "Murat", color: 0xef4444, speed: 0.1 },
    CANSU: { name: "Cansu", color: 0xec4899, speed: 0.18 },
    GOKDENIZ: { name: "Gökdeniz", color: 0x3b82f6, speed: 0.08 },
    SERIFE: { name: "Şerife", color: 0x10b981, speed: 0.12 },
    CAN: { name: "Can", color: 0xf59e0b, speed: 0.14 },
    SAHILIN: { name: "Sahilin", color: 0x8b5cf6, speed: 0.16 }
};

class Game3D {
    constructor() {
        this.units = [];
        this.selectedUnit = null;
        this.initScene();
        this.initLights();
        this.createGround();
        this.spawnCommanders();
        this.setupEvents();
        this.animate();
    }

    initScene() {
        // Scene, Camera, Renderer setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.Fog(0x050505, 10, 50);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 15, 15); // RoK stili üstten bakış
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('gameCanvas'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    initLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(10, 20, 10);
        this.scene.add(sunLight);
    }

    createGround() {
        // Dev harita gridi
        const grid = new THREE.GridHelper(100, 50, 0x333333, 0x111111);
        this.scene.add(grid);

        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    spawnCommanders() {
        let index = 0;
        for (const key in COMMANDER_DATA) {
            const data = COMMANDER_DATA[key];
            
            // 3D Temsil: Komutanları şimdilik silindir/koni olarak oluşturuyoruz
            const geometry = new THREE.ConeGeometry(0.5, 2, 8);
            const material = new THREE.MeshPhongMaterial({ color: data.color });
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(index * 3 - 7, 1, 0);
            mesh.userData = { ...data, target: mesh.position.clone() };
            
            this.scene.add(mesh);
            this.units.push(mesh);
            index++;
        }
    }

    setupEvents() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Tıklama ile Seçme ve Hareket
        window.addEventListener('mousedown', (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.scene.children);

            if (intersects.length > 0) {
                const clicked = intersects[0];
                
                if (e.button === 0) { // Sol Tık: Seçim
                    this.units.forEach(u => u.scale.set(1, 1, 1)); // Reset
                    const unit = this.units.find(u => u === clicked.object);
                    if (unit) {
                        this.selectedUnit = unit;
                        unit.scale.set(1.5, 1.5, 1.5); // Seçim efekti
                    }
                } else if (e.button === 2 && this.selectedUnit) { // Sağ Tık: Hedef
                    this.selectedUnit.userData.target.copy(clicked.point);
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

    updateUnits() {
        this.units.forEach(unit => {
            const data = unit.userData;
            const dist = unit.position.distanceTo(data.target);
            
            if (dist > 0.1) {
                const direction = new THREE.Vector3()
                    .subVectors(data.target, unit.position)
                    .normalize();
                
                unit.position.addScaledVector(direction, data.speed);
                unit.lookAt(data.target); // Gittiği yöne bak
                unit.rotation.x = 0; // Koni düz kalsın
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.updateUnits();
        this.renderer.render(this.scene, this.camera);
    }
}

// BAŞLAT
window.onload = () => new Game3D();
