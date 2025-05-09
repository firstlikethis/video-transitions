/**
 * SceneManager.js
 * จัดการการสร้างและควบคุมฉากทั้งหมดในแอพพลิเคชัน
 * รองรับการเปลี่ยนฉาก การปรับขนาดหน้าจอ และการจัดการทรัพยากร
 */
class SceneManager {
    /**
     * สร้าง SceneManager
     * @param {Object} textures - เก็บเท็กซ์เจอร์ทั้งหมด
     * @param {Object} materials - เก็บวัสดุที่สร้างจากเท็กซ์เจอร์
     */
    constructor(textures, materials) {
        this.textures = textures;
        this.materials = materials;
        
        // ค้นหา container สำหรับ canvas
        this.container = document.getElementById('canvas-container');
        if (!this.container) {
            console.error('Canvas container not found');
            this.container = document.body;
        }
        
        // สร้าง renderer
        this.setupRenderer();
        
        // สร้าง scene หลัก
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.0007);
        
        // สร้างกล้อง
        this.setupCamera();
        
        // สร้างแสง
        this.setupLights();
        
        // สร้าง ResizeHandler
        this.resizeHandler = new ResizeHandler(this.camera, this.renderer);
        
        // เริ่มต้นตั้งค่า particle multiplier
        this.particleMultiplier = 1.0;
        
        // สร้างฉากทั้งหมด
        this.createScenes();
        
        // สร้างพื้นหลังดาว
        this.createStarBackground();
    }
    
    /**
     * สร้างและตั้งค่า renderer
     */
    setupRenderer() {
        // ตรวจสอบการรองรับ WebGL
        if (!this.checkWebGLSupport()) {
            this.showWebGLError();
            return;
        }
        
        // ตั้งค่า renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance'
        });
        
        // ตั้งขนาดเริ่มต้น
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // เปิดใช้งานเงา
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // ตั้งค่าการเข้ารหัสสี - แก้ไขจาก outputEncoding เป็น outputColorSpace
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        
        // เพิ่ม canvas เข้าไปใน container
        this.container.appendChild(this.renderer.domElement);
    }
    
    /**
     * ตรวจสอบการรองรับ WebGL
     * @returns {boolean} รองรับหรือไม่
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }
    
    /**
     * แสดงข้อความเมื่อไม่รองรับ WebGL
     */
    showWebGLError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'webgl-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h2>WebGL Not Supported</h2>
                <p>Your browser or device does not support WebGL, which is required for this experience.</p>
                <p>Please try a different browser or device.</p>
            </div>
        `;
        
        // เพิ่มสไตล์
        const style = document.createElement('style');
        style.textContent = `
            .webgl-error {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                text-align: center;
            }
            .error-content {
                max-width: 500px;
                padding: 30px;
                background: rgba(30, 30, 50, 0.7);
                border-radius: 10px;
                border: 1px solid rgba(74, 158, 255, 0.3);
            }
            .error-content h2 {
                color: #ff6348;
                margin-bottom: 20px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(errorDiv);
    }
    
    /**
     * สร้างและตั้งค่ากล้อง
     */
    setupCamera() {
        const fov = 60;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 10000;
        
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(0, 0, 20);
        this.camera.lookAt(0, 0, 0);
    }
    
    /**
     * สร้างและตั้งค่าแสง
     */
    setupLights() {
        // Ambient light - แสงโดยรอบ
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(this.ambientLight);
        
        // Directional light - แสงทิศทาง (เหมือนดวงอาทิตย์)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(50, 30, 50);
        this.directionalLight.castShadow = true;
        
        // ปรับแต่งคุณภาพเงา
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(this.directionalLight);
        
        // เพิ่มแสงสีสำหรับฉากอวกาศ
        this.blueLight = new THREE.PointLight(0x3498db, 0, 50);
        this.blueLight.position.set(-10, 5, 10);
        this.scene.add(this.blueLight);
        
        this.purpleLight = new THREE.PointLight(0x9b59b6, 0, 50);
        this.purpleLight.position.set(10, -5, 10);
        this.scene.add(this.purpleLight);
    }
    
    /**
     * สร้างฉากทั้งหมด
     */
    createScenes() {
        // สร้างฉากโดยใช้คลาสที่เตรียมไว้
        sceneObjects[CONSTANTS.SCENES.EARTH] = new EarthScene(this.scene, this.textures, this.materials);
        sceneObjects[CONSTANTS.SCENES.URANUS] = new UranusScene(this.scene, this.textures, this.materials);
        sceneObjects[CONSTANTS.SCENES.GALAXY] = new GalaxyScene(this.scene, this.textures, this.materials);
        sceneObjects[CONSTANTS.SCENES.BLACK_HOLE] = new BlackHoleScene(this.scene, this.textures, this.materials);
        
        // ซ่อนทุกฉากเริ่มต้น
        for (const sceneIdx in sceneObjects) {
            if (sceneObjects[sceneIdx] && sceneObjects[sceneIdx].group) {
                sceneObjects[sceneIdx].group.visible = false;
            }
        }
    }
    
    /**
     * สร้างพื้นหลังดาว
     */
    createStarBackground() {
        // ใช้ SphereGeometry ขนาดใหญ่เพื่อสร้างท้องฟ้าดาวที่อยู่รอบๆ
        const geometry = new THREE.SphereGeometry(5000, 64, 64);
        
        // เลือกเท็กซ์เจอร์ตามที่มี
        let material;
        if (this.textures.starField) {
            material = new THREE.MeshBasicMaterial({
                map: this.textures.starField,
                side: THREE.BackSide,
                fog: false
            });
        } else {
            // สร้างพื้นหลังดาวด้วยการสร้างเท็กซ์เจอร์เอง
            material = this.createFallbackStarMaterial();
        }
        
        const starSphere = new THREE.Mesh(geometry, material);
        this.scene.add(starSphere);
        this.starSphere = starSphere;
    }
    
    /**
     * สร้าง fallback material สำหรับพื้นหลังดาว
     * @returns {THREE.Material} วัสดุสำหรับพื้นหลังดาว
     */
    createFallbackStarMaterial() {
        // สร้างเท็กซ์เจอร์ดาวด้วย canvas
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // พื้นหลังสีดำ
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // วาดดาวสุ่ม
        for (let i = 0; i < 10000; i++) {
            const x = Math.floor(Math.random() * canvas.width);
            const y = Math.floor(Math.random() * canvas.height);
            const radius = Math.random() * 2;
            
            // ความสว่างสุ่ม
            const brightness = Math.random();
            
            // ความสว่างแตกต่างกัน
            let color;
            if (brightness > 0.9) {
                // ดาวสีฟ้า (ร้อนกว่า)
                color = `rgba(200, 220, 255, ${brightness})`;
            } else if (brightness > 0.8) {
                // ดาวสีขาว
                color = `rgba(255, 255, 255, ${brightness})`;
            } else if (brightness > 0.4) {
                // ดาวสีเหลือง
                color = `rgba(255, 255, 200, ${brightness})`;
            } else {
                // ดาวสีส้มแดง (เย็นกว่า)
                color = `rgba(255, 220, 180, ${brightness})`;
            }
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            
            // เพิ่ม glow สำหรับดาวสว่าง
            if (brightness > 0.85) {
                const glow = radius * 3;
                const gradient = ctx.createRadialGradient(
                    x, y, radius, x, y, glow
                );
                gradient.addColorStop(0, `rgba(155, 176, 255, ${brightness})`);
                gradient.addColorStop(1, 'rgba(0, 0, 30, 0)');
                
                ctx.beginPath();
                ctx.arc(x, y, glow, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }
        
        // สร้าง texture จาก canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        
        // สร้าง material
        return new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            fog: false
        });
    }
    
    /**
     * แสดงฉากที่ต้องการ
     * @param {number} sceneIndex - ดัชนีของฉากที่ต้องการแสดง
     */
    showScene(sceneIndex) {
        // ตรวจสอบฉากที่ต้องการแสดง
        if (!sceneObjects[sceneIndex] || !sceneObjects[sceneIndex].group) {
            console.error(`Scene ${sceneIndex} is undefined or has no group property`);
            return;
        }
        
        // ซ่อนทุกฉาก
        for (const idx in sceneObjects) {
            if (sceneObjects[idx] && sceneObjects[idx].group) {
                sceneObjects[idx].group.visible = false;
            }
        }
        
        // แสดงฉากที่ต้องการ
        sceneObjects[sceneIndex].group.visible = true;
        
        // อัปเดตชื่อฉาก
        const labels = ['Earth', 'Uranus', 'Galaxy', 'Black Hole'];
        const sceneLabel = document.getElementById('scene-label');
        if (sceneLabel) {
            sceneLabel.textContent = labels[sceneIndex];
            sceneLabel.style.opacity = '1';
        }
        
        // อัปเดตฉากปัจจุบัน
        currentScene = sceneIndex;
        
        // ปรับแต่งกล้องและแสงตามฉาก
        this.applySceneSettings(sceneIndex);
    }
    
    /**
     * ปรับแต่งกล้องและแสงตามฉาก
     * @param {number} sceneIndex - ดัชนีของฉาก
     */
    applySceneSettings(sceneIndex) {
        // ดึงการตั้งค่าจาก CONSTANTS
        const settings = CONSTANTS.SCENE_SETTINGS[sceneIndex];
        if (!settings) return;
        
        // ปรับตำแหน่งกล้อง
        gsap.to(this.camera.position, {
            x: settings.camera.x,
            y: settings.camera.y,
            z: settings.camera.z,
            duration: 2,
            ease: 'power2.inOut'
        });
        
        // ปรับความเข้มของแสง
        if (this.ambientLight && settings.lights.ambient !== undefined) {
            gsap.to(this.ambientLight, { intensity: settings.lights.ambient, duration: 2 });
        }
        
        if (this.directionalLight && settings.lights.directional !== undefined) {
            gsap.to(this.directionalLight, { intensity: settings.lights.directional, duration: 2 });
        }
        
        if (this.blueLight && settings.lights.blue !== undefined) {
            gsap.to(this.blueLight, { intensity: settings.lights.blue, duration: 2 });
        }
        
        if (this.purpleLight && settings.lights.purple !== undefined) {
            gsap.to(this.purpleLight, { intensity: settings.lights.purple, duration: 2 });
        }
    }
    
    /**
     * จัดการการปรับขนาดหน้าจอ
     */
    handleResize() {
        // ปรับขนาดกล้อง
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // ปรับขนาด renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    
    /**
     * กำหนดตัวคูณจำนวนอนุภาค
     * @param {number} multiplier - ตัวคูณจำนวนอนุภาค (0.0 - 1.0)
     */
    setParticleMultiplier(multiplier) {
        this.particleMultiplier = multiplier;
        
        // อัปเดตจำนวนอนุภาคในทุกฉาก
        for (const idx in sceneObjects) {
            if (sceneObjects[idx] && typeof sceneObjects[idx].updateParticleCount === 'function') {
                sceneObjects[idx].updateParticleCount(multiplier);
            }
        }
    }
    
    /**
     * รีเซ็ตทุกฉาก
     */
    resetAllScenes() {
        for (const idx in sceneObjects) {
            if (sceneObjects[idx] && typeof sceneObjects[idx].reset === 'function') {
                sceneObjects[idx].reset();
            }
        }
    }
    
    /**
     * อัปเดตฉากที่แสดงอยู่
     * @param {number} time - เวลาที่ผ่านไป (วินาที)
     */
    update(time) {
        // อัปเดตฉากที่แสดงอยู่
        if (sceneObjects[currentScene] && typeof sceneObjects[currentScene].update === 'function') {
            sceneObjects[currentScene].update(time);
        }
        
        // หมุนท้องฟ้าดาวช้าๆ
        if (this.starSphere) {
            this.starSphere.rotation.y = time * 0.01;
        }
    }
}