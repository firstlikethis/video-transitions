/**
 * BaseScene.js
 * คลาสพื้นฐานสำหรับทุกฉากในแอพพลิเคชัน
 * กำหนดโครงสร้างและฟังก์ชันการทำงานพื้นฐานที่ทุกฉากต้องมี
 */
class BaseScene {
    /**
     * สร้าง BaseScene
     * @param {THREE.Scene} scene - Scene หลักของแอพพลิเคชัน
     * @param {Object} textures - เก็บเท็กซ์เจอร์ทั้งหมด
     * @param {Object} materials - เก็บวัสดุที่สร้างจากเท็กซ์เจอร์
     */
    constructor(scene, textures, materials) {
        this.scene = scene;
        this.textures = textures;
        this.materials = materials;
        
        // สร้างกลุ่มเพื่อเก็บวัตถุทั้งหมดสำหรับฉากนี้
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // เก็บวัตถุต่างๆ ของฉาก
        this.objects = {};
        
        // เก็บค่าเริ่มต้นสำหรับแอนิเมชันและปฏิสัมพันธ์
        this.initialRotation = new THREE.Euler(0, 0, 0);
        this.targetRotation = new THREE.Euler(0, 0, 0);
        
        // เก็บอนุภาคและระบบอนุภาค
        this.particles = [];
        this.particleSystems = [];
        
        // เก็บค่าตัวคูณจำนวนอนุภาค
        this.particleMultiplier = 1.0;
        
        // ตั้งค่าเริ่มต้น
        this.setup();
    }
    
    /**
     * ตั้งค่าเริ่มต้นของฉาก - ให้ override ในคลาสลูก
     */
    setup() {
        // จะถูก override ในคลาสลูก
        console.log("BaseScene setup - override this method in child class");
    }
    
    /**
     * สร้างวัตถุหลักของฉาก - ให้ override ในคลาสลูก
     */
    createMainObject() {
        // จะถูก override ในคลาสลูก
        console.log("BaseScene createMainObject - override this method in child class");
    }
    
    /**
     * สร้างเอฟเฟกต์เพิ่มเติม - ให้ override ในคลาสลูก
     */
    createEffects() {
        // จะถูก override ในคลาสลูก
        console.log("BaseScene createEffects - override this method in child class");
    }
    
    /**
     * จัดการเมื่อผู้ใช้คลิกในฉากนี้ - ให้ override ในคลาสลูก
     * @param {Event} event - Event object จากการคลิก
     */
    handleInteraction(event) {
        // จะถูก override ในคลาสลูก
        console.log("BaseScene handleInteraction - override this method in child class");
        
        // สร้างเอฟเฟกต์การคลิกพื้นฐาน
        this.createBasicClickEffect(event);
    }
    
    /**
     * สร้างเอฟเฟกต์การคลิกพื้นฐาน
     * @param {Event} event - Event object จากการคลิก
     */
    createBasicClickEffect(event) {
        // แปลงตำแหน่งเมาส์เป็นตำแหน่งในพื้นที่ 3D
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // สร้าง raycaster เพื่อตรวจสอบการคลิกกับวัตถุในฉาก
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, sceneManager.camera);
        
        // ตรวจสอบการชนกับวัตถุในฉาก
        const intersects = raycaster.intersectObjects(this.group.children, true);
        
        if (intersects.length > 0) {
            // สร้างเอฟเฟกต์ที่ตำแหน่งที่คลิก
            const position = intersects[0].point;
            
            // สร้างแสงที่จุดที่คลิก
            const light = new THREE.PointLight(0x4a9eff, 2, 10);
            light.position.copy(position);
            
            // สร้างวัตถุเรืองแสงเล็กๆ ที่จุดที่คลิก
            const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x4a9eff,
                transparent: true,
                opacity: 0.7
            });
            
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            glowMesh.position.copy(position);
            
            // เพิ่มแสงและวัตถุเรืองแสงลงในฉาก
            this.group.add(light);
            this.group.add(glowMesh);
            
            // แอนิเมชันเอฟเฟกต์
            gsap.to(light, {
                intensity: 0,
                duration: 1.5,
                ease: "power2.out",
                onComplete: () => {
                    // ลบแสง
                    this.group.remove(light);
                }
            });
            
            gsap.to(glowMesh.scale, {
                x: 3,
                y: 3,
                z: 3,
                duration: 1.5,
                ease: "power2.out"
            });
            
            gsap.to(glowMaterial, {
                opacity: 0,
                duration: 1.5,
                ease: "power2.out",
                onComplete: () => {
                    // ลบวัตถุเรืองแสง
                    this.group.remove(glowMesh);
                    glowGeometry.dispose();
                    glowMaterial.dispose();
                }
            });
        }
    }
    
    /**
     * ปรับตำแหน่งหรือมุมมองตามผู้ใช้
     * @param {Object} mousePosition - ตำแหน่งเมาส์แบบ normalized (-1 ถึง 1)
     */
    updateViewByMousePosition(mousePosition) {
        // คำนวณการเคลื่อนที่ของกล้องเล็กน้อยตามตำแหน่งเมาส์
        const lookX = mousePosition.x * 2; // ควบคุมระยะการหมุน
        const lookY = mousePosition.y * 2;
        
        // ปรับการหมุนของกลุ่มวัตถุทั้งหมด
        gsap.to(this.group.rotation, {
            x: this.initialRotation.x + lookY * 0.1,
            y: this.initialRotation.y + lookX * 0.1,
            duration: 1.5,
            ease: "power2.out"
        });
    }
    
    /**
     * รีเซ็ตมุมมองกลับไปตำแหน่งเริ่มต้น
     */
    resetView() {
        gsap.to(this.group.rotation, {
            x: this.initialRotation.x,
            y: this.initialRotation.y,
            z: this.initialRotation.z,
            duration: 1,
            ease: "power2.inOut"
        });
    }
    
    /**
     * อัปเดตจำนวนอนุภาค
     * @param {number} multiplier - ตัวคูณจำนวนอนุภาค (0.0 - 1.0)
     */
    updateParticleCount(multiplier) {
        this.particleMultiplier = multiplier;
        
        // ให้คลาสลูก override เพื่อจัดการอนุภาคตามต้องการ
    }
    
    /**
     * รีเซ็ตฉากกลับสู่สถานะเริ่มต้น
     */
    reset() {
        // รีเซ็ตการหมุน
        this.group.rotation.set(
            this.initialRotation.x, 
            this.initialRotation.y, 
            this.initialRotation.z
        );
        
        // รีเซ็ตตำแหน่ง
        this.group.position.set(0, 0, 0);
        
        // ให้คลาสลูก override เพื่อจัดการรีเซ็ตเพิ่มเติม
    }
    
    /**
     * อัปเดตแอนิเมชันตามเวลา - ให้ override ในคลาสลูก
     * @param {number} time - เวลาที่ผ่านไป (วินาที)
     */
    update(time) {
        // จะถูก override ในคลาสลูก
        console.log("BaseScene update - override this method in child class");
    }
    
    /**
     * ทำความสะอาดทรัพยากรเมื่อเปลี่ยนฉาก
     */
    dispose() {
        // ล้าง geometries และ materials เพื่อลดการใช้หน่วยความจำ
        this.disposeObjects(this.group);
        
        // ล้างอนุภาค
        this.disposeParticles();
    }
    
    /**
     * ล้าง geometries และ materials
     * @param {THREE.Object3D} obj - วัตถุที่ต้องการล้าง
     */
    disposeObjects(obj) {
        if (!obj) return;
        
        // เรียกตัวเองซ้ำสำหรับ children
        if (obj.children && obj.children.length > 0) {
            for (let i = 0; i < obj.children.length; i++) {
                this.disposeObjects(obj.children[i]);
            }
        }
        
        // ล้าง geometry
        if (obj.geometry) {
            obj.geometry.dispose();
        }
        
        // ล้าง material
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                for (let i = 0; i < obj.material.length; i++) {
                    this.disposeMaterial(obj.material[i]);
                }
            } else {
                this.disposeMaterial(obj.material);
            }
        }
    }
    
    /**
     * ล้าง material และ textures
     * @param {THREE.Material} material - วัสดุที่ต้องการล้าง
     */
    disposeMaterial(material) {
        if (!material) return;
        
        // ล้าง textures
        for (const key in material) {
            if (key !== 'map' && key !== 'envMap') continue;
            
            const value = material[key];
            if (value && typeof value.dispose === 'function') {
                value.dispose();
            }
        }
        
        // ล้าง material
        material.dispose();
    }
    
    /**
     * ล้างระบบอนุภาค
     */
    disposeParticles() {
        // ล้างอนุภาคทั้งหมด
        this.particles.forEach(particle => {
            if (particle.geometry) particle.geometry.dispose();
            if (particle.material) particle.material.dispose();
        });
        
        this.particles = [];
        
        // ล้างระบบอนุภาคทั้งหมด
        this.particleSystems.forEach(system => {
            if (system.dispose && typeof system.dispose === 'function') {
                system.dispose();
            }
        });
        
        this.particleSystems = [];
    }
    
    /**
     * สร้างเอฟเฟกต์อนุภาค
     * @param {THREE.Vector3} position - ตำแหน่งที่ต้องการสร้างอนุภาค
     * @param {Object} options - ตัวเลือกเพิ่มเติมสำหรับการสร้างอนุภาค
     * @returns {THREE.Points} ระบบอนุภาคที่สร้าง
     */
    createParticleEffect(position, options = {}) {
        // กำหนดค่าเริ่มต้น
        const defaults = {
            count: 100,
            color: 0x4a9eff,
            size: 0.1,
            duration: 2,
            speed: 1,
            spread: 1
        };
        
        // รวมค่าเริ่มต้นกับตัวเลือกที่ส่งมา
        const settings = { ...defaults, ...options };
        
        // ปรับจำนวนอนุภาคตามตัวคูณ
        const particleCount = Math.floor(settings.count * this.particleMultiplier);
        
        // สร้าง geometry สำหรับอนุภาค
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = []; // เก็บความเร็วแต่ละอนุภาค
        
        // กำหนดตำแหน่งเริ่มต้นและความเร็วสำหรับแต่ละอนุภาค
        for (let i = 0; i < particleCount; i++) {
            // กระจายตำแหน่งเริ่มต้นรอบๆ จุดกำเนิด
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * settings.spread,
                (Math.random() - 0.5) * settings.spread,
                (Math.random() - 0.5) * settings.spread
            );
            
            // กำหนดตำแหน่งเริ่มต้น
            positions[i * 3] = position.x + offset.x;
            positions[i * 3 + 1] = position.y + offset.y;
            positions[i * 3 + 2] = position.z + offset.z;
            
            // กำหนดความเร็วแบบสุ่มในทุกทิศทาง
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2 * settings.speed,
                (Math.random() - 0.5) * 2 * settings.speed,
                (Math.random() - 0.5) * 2 * settings.speed
            );
            
            velocities.push(velocity);
        }
        
        // กำหนดตำแหน่งให้กับ geometry
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // สร้าง material สำหรับอนุภาค
        const particleMaterial = new THREE.PointsMaterial({
            color: settings.color,
            size: settings.size,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // สร้างระบบอนุภาค
        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.group.add(particleSystem);
        
        // เพิ่มในรายการอนุภาค
        this.particles.push(particleSystem);
        
        // สร้างฟังก์ชันอัปเดตสำหรับแอนิเมชันอนุภาค
        let elapsedTime = 0;
        
        const updateParticles = (delta) => {
            elapsedTime += delta;
            
            // ถ้าเวลาผ่านไปเกินกำหนด ให้หยุดแอนิเมชันและลบอนุภาค
            if (elapsedTime >= settings.duration) {
                // ลบออกจากรายการอัปเดต
                const index = this.particleSystems.indexOf(updateParticles);
                if (index !== -1) {
                    this.particleSystems.splice(index, 1);
                }
                
                // ลบออกจากรายการอนุภาค
                const particleIndex = this.particles.indexOf(particleSystem);
                if (particleIndex !== -1) {
                    this.particles.splice(particleIndex, 1);
                }
                
                // ลบออกจากฉาก
                this.group.remove(particleSystem);
                particleGeometry.dispose();
                particleMaterial.dispose();
                
                return;
            }
            
            // คำนวณ fade out
            const fadeRatio = 1 - (elapsedTime / settings.duration);
            particleMaterial.opacity = fadeRatio;
            
            // อัปเดตตำแหน่งอนุภาคตามความเร็ว
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // อัปเดตตำแหน่งตามความเร็ว
                positions[i * 3] += velocities[i].x * delta;
                positions[i * 3 + 1] += velocities[i].y * delta;
                positions[i * 3 + 2] += velocities[i].z * delta;
                
                // เพิ่มแรงโน้มถ่วงเล็กน้อย
                velocities[i].y -= 0.05 * delta;
            }
            
            // แจ้ง Three.js ว่าตำแหน่งอนุภาคเปลี่ยนแปลง
            particleGeometry.attributes.position.needsUpdate = true;
        };
        
        // เพิ่มเข้าไปในรายการอัปเดต
        this.particleSystems.push(updateParticles);
        
        return particleSystem;
    }
    
    /**
     * สร้างไฟล์ shader material
     * @param {Object} uniforms - Uniforms สำหรับ shader
     * @param {string} vertexShader - Vertex shader code
     * @param {string} fragmentShader - Fragment shader code
     * @param {Object} options - ตัวเลือกเพิ่มเติม
     * @returns {THREE.ShaderMaterial} Shader material ที่สร้าง
     */
    createShaderMaterial(uniforms, vertexShader, fragmentShader, options = {}) {
        const defaults = {
            transparent: true,
            side: THREE.FrontSide,
            blending: THREE.NormalBlending,
            depthWrite: true,
            depthTest: true,
            wireframe: false
        };
        
        const settings = { ...defaults, ...options };
        
        return new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: settings.transparent,
            side: settings.side,
            blending: settings.blending,
            depthWrite: settings.depthWrite,
            depthTest: settings.depthTest,
            wireframe: settings.wireframe
        });
    }
}