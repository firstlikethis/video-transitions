/**
 * EarthScene.js
 * สร้างฉากโลกที่สมจริงพร้อมเอฟเฟกต์
 */
class EarthScene extends BaseScene {
    /**
     * สร้างฉากโลก
     * @param {THREE.Scene} scene - Scene หลักของแอพพลิเคชัน
     * @param {Object} textures - เก็บเท็กซ์เจอร์ทั้งหมด
     * @param {Object} materials - เก็บวัสดุที่สร้างจากเท็กซ์เจอร์
     */
    constructor(scene, textures, materials) {
        super(scene, textures, materials);
    }
    
    /**
     * ตั้งค่าเริ่มต้นของฉากโลก
     */
    setup() {
        // สร้างโลก
        this.createEarth();
        
        // สร้างชั้นบรรยากาศ
        this.createAtmosphere();
        
        // สร้างเมฆ
        this.createClouds();
        
        // เพิ่มดวงจันทร์
        this.createMoon();
        
        // เพิ่มแสงเรือง
        this.createGlow();
        
        // สร้างอนุภาคในชั้นบรรยากาศ
        this.createAtmosphericParticles();
        
        // บันทึกค่าเริ่มต้นสำหรับการหมุน
        this.initialRotation = this.group.rotation.clone();
    }
    
    /**
     * สร้างโลก
     */
    createEarth() {
        // สร้างพื้นผิวโลก
        const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
        
        // ใช้วัสดุที่มีหรือสร้างใหม่
        let earthMaterial;
        
        if (this.materials && this.materials.earth) {
            // ใช้วัสดุที่สร้างไว้แล้ว
            earthMaterial = this.materials.earth;
        } else if (this.textures) {
            // สร้างวัสดุใหม่จากเท็กซ์เจอร์
            earthMaterial = new THREE.MeshPhysicalMaterial({
                map: this.textures.earth,
                bumpMap: this.textures.earthBump,
                normalMap: this.textures.earthNormal,
                specularMap: this.textures.earthSpecular,
                bumpScale: 0.1,
                normalScale: new THREE.Vector2(0.8, 0.8),
                roughness: 0.8,
                metalness: 0.1,
                envMapIntensity: 0.5,
                clearcoat: 0.2,
                clearcoatRoughness: 0.4
            });
        } else {
            // สร้างวัสดุเริ่มต้นหากไม่มีเท็กซ์เจอร์
            earthMaterial = new THREE.MeshPhongMaterial({
                color: 0x2233ff,
                specular: 0x555555,
                shininess: 30
            });
        }
        
        // สร้างโลก
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.castShadow = true;
        earth.receiveShadow = true;
        
        // เพิ่มโลกเข้าไปในกลุ่ม
        this.group.add(earth);
        this.earth = earth;
        
        // บิดเอียงโลกเล็กน้อยเหมือนในความเป็นจริง (23.5 องศา)
        earth.rotation.z = 23.5 * Math.PI / 180;
    }
    
    /**
     * สร้างชั้นบรรยากาศ
     */
    createAtmosphere() {
        // สร้างชั้นบรรยากาศรอบโลก (ขนาดใหญ่กว่าโลกเล็กน้อย)
        const atmosphereGeometry = new THREE.SphereGeometry(5.2, 64, 64);
        
        // ใช้วัสดุที่มีหรือสร้างใหม่
        let atmosphereMaterial;
        
        if (this.materials && this.materials.earthAtmosphere) {
            // ใช้วัสดุที่สร้างไว้แล้ว
            atmosphereMaterial = this.materials.earthAtmosphere;
        } else {
            // สร้าง shader material สำหรับชั้นบรรยากาศแบบเรืองแสง
            atmosphereMaterial = this.createShaderMaterial(
                {
                    glowColor: { value: new THREE.Color(0x93cfef) },
                    viewVector: { value: new THREE.Vector3(0, 0, 1) },
                    c: { value: 0.5 },
                    p: { value: 4.0 },
                    time: { value: 0.0 }
                },
                // vertex shader
                `
                uniform vec3 viewVector;
                uniform float c;
                uniform float p;
                varying float intensity;
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(c - dot(vNormal, vNormel), p);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
                `,
                // fragment shader
                `
                uniform vec3 glowColor;
                uniform float time;
                varying float intensity;
                varying vec2 vUv;
                
                void main() {
                    // ปรับความเข้มของชั้นบรรยากาศตามละติจูด
                    float latitude = abs(vUv.y - 0.5) * 2.0;
                    float poleEffect = mix(1.0, 0.4, pow(latitude, 2.0));
                    
                    // เพิ่มการเคลื่อนไหวตามเวลา
                    float timeEffect = sin(time * 0.5 + vUv.x * 10.0) * 0.05 + 0.95;
                    
                    // รวมเอฟเฟกต์ทั้งหมด
                    float finalIntensity = intensity * poleEffect * timeEffect;
                    
                    // ไล่ระดับสีจากขั้วโลกไปยังเส้นศูนย์สูตร
                    vec3 finalColor = mix(glowColor, vec3(0.7, 0.9, 1.0), latitude * 0.3);
                    
                    gl_FragColor = vec4(finalColor * finalIntensity, finalIntensity);
                }
                `,
                {
                    side: THREE.BackSide,
                    blending: THREE.AdditiveBlending,
                    transparent: true,
                    depthWrite: false
                }
            );
        }
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.group.add(atmosphere);
        this.atmosphere = atmosphere;
        this.atmosphereMaterial = atmosphereMaterial;
    }
    
    /**
     * สร้างเมฆ
     */
    createClouds() {
        // สร้างเมฆรอบโลก (ขนาดใหญ่กว่าโลกเล็กน้อย)
        const cloudsGeometry = new THREE.SphereGeometry(5.1, 64, 64);
        
        // ใช้วัสดุที่มีหรือสร้างใหม่
        let cloudsMaterial;
        
        if (this.materials && this.materials.earthClouds) {
            // ใช้วัสดุที่สร้างไว้แล้ว
            cloudsMaterial = this.materials.earthClouds;
        } else if (this.textures && this.textures.earthClouds) {
            // สร้างวัสดุจากเท็กซ์เจอร์
            cloudsMaterial = new THREE.MeshPhongMaterial({
                map: this.textures.earthClouds,
                transparent: true,
                opacity: 0.7,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.CustomBlending,
                blendSrc: THREE.SrcAlphaFactor,
                blendDst: THREE.OneMinusSrcAlphaFactor
            });
        } else {
            // สร้างวัสดุเริ่มต้นหากไม่มีเท็กซ์เจอร์
            cloudsMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3,
                depthWrite: false
            });
        }
        
        const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        this.group.add(clouds);
        this.clouds = clouds;
    }
    
    /**
     * สร้างดวงจันทร์
     */
    createMoon() {
        // สร้างดวงจันทร์
        const moonGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        
        // ใช้วัสดุที่มีหรือสร้างใหม่
        let moonMaterial;
        
        if (this.materials && this.materials.moon) {
            // ใช้วัสดุที่สร้างไว้แล้ว
            moonMaterial = this.materials.moon;
        } else if (this.textures && this.textures.moon) {
            // สร้างวัสดุจากเท็กซ์เจอร์
            moonMaterial = new THREE.MeshPhongMaterial({
                map: this.textures.moon,
                bumpMap: this.textures.moonBump,
                bumpScale: 0.05,
                specular: 0x222222,
                shininess: 5
            });
        } else {
            // สร้างวัสดุเริ่มต้นหากไม่มีเท็กซ์เจอร์
            moonMaterial = new THREE.MeshPhongMaterial({
                color: 0xaaaaaa,
                specular: 0x222222,
                shininess: 5
            });
        }
        
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        
        // กำหนดตำแหน่งและวงโคจร
        moon.position.set(12, 0, 0);
        
        // สร้างกลุ่มสำหรับการหมุนของดวงจันทร์
        this.moonOrbit = new THREE.Group();
        this.moonOrbit.add(moon);
        this.moonOrbit.rotation.y = Math.random() * Math.PI * 2; // มุมเริ่มต้นแบบสุ่ม
        
        this.group.add(this.moonOrbit);
        this.moon = moon;
    }
    
    /**
     * สร้างแสงเรือง
     */
    createGlow() {
        // สร้างแสงเรืองบริเวณทิศทางของดวงอาทิตย์
        const sunDirection = new THREE.Vector3(1, 0.5, 1).normalize();
        const sunPosition = sunDirection.clone().multiplyScalar(20);
        
        // สร้างแสงเรือง
        const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(sunPosition);
        
        this.group.add(glow);
        this.glow = glow;
        
        // สร้าง lens flare
        if (this.textures && this.textures.lensFlare) {
            // TODO: สร้าง lens flare หากมี textures
        }
    }
    
    /**
     * สร้างอนุภาคในชั้นบรรยากาศ
     */
    createAtmosphericParticles() {
        // จำนวนอนุภาค (ปรับตามประสิทธิภาพอุปกรณ์)
        const baseCount = 500;
        const particleCount = Math.floor(baseCount * this.particleMultiplier);
        
        // สร้าง geometry สำหรับอนุภาค
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // สร้างอนุภาครอบโลก
        for (let i = 0; i < particleCount; i++) {
            // กระจายอนุภาคเป็นทรงกลมรอบโลก
            const radius = 5.2 + Math.random() * 0.4;
            const angle = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            // คำนวณตำแหน่ง
            const x = radius * Math.sin(phi) * Math.cos(angle);
            const y = radius * Math.sin(phi) * Math.sin(angle);
            const z = radius * Math.cos(phi);
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // สีอนุภาค
            const latitude = Math.abs(z / radius);
            const pole = latitude > 0.8;
            
            if (pole) {
                // สีสำหรับชั้นบรรยากาศขั้วโลก (ออโรร่า)
                colors[i * 3] = Math.random() * 0.2 + 0.4; // R
                colors[i * 3 + 1] = Math.random() * 0.3 + 0.6; // G
                colors[i * 3 + 2] = Math.random() * 0.2 + 0.8; // B
            } else {
                // สีสำหรับชั้นบรรยากาศทั่วไป
                colors[i * 3] = Math.random() * 0.2 + 0.3; // R
                colors[i * 3 + 1] = Math.random() * 0.2 + 0.7; // G
                colors[i * 3 + 2] = Math.random() * 0.2 + 0.8; // B
            }
            
            // ขนาดอนุภาค
            sizes[i] = Math.random() * 0.03 + (pole ? 0.04 : 0.02);
        }
        
        // กำหนดค่าให้กับ geometry
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // สร้าง material สำหรับอนุภาค
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.7,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false
        });
        
        // ถ้ามีเท็กซ์เจอร์ ให้ใช้เท็กซ์เจอร์
        if (this.textures && this.textures.particle) {
            particleMaterial.map = this.textures.particle;
        }
        
        // สร้างระบบอนุภาค
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.group.add(particles);
        this.atmosphericParticles = particles;
        
        // เพิ่มเข้าไปในรายการอนุภาค
        this.particles.push(particles);
    }
    
    /**
     * จัดการการคลิกในฉากโลก
     * @param {Event} event - Event object จากการคลิก
     */
    handleInteraction(event) {
        // แปลงตำแหน่งเมาส์เป็นตำแหน่งในพื้นที่ 3D
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // สร้าง raycaster เพื่อตรวจสอบการคลิกกับวัตถุในฉาก
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, sceneManager.camera);
        
        // ตรวจสอบการชนกับโลก
        const intersects = raycaster.intersectObject(this.earth, true);
        
        if (intersects.length > 0) {
            // คลิกที่โลก - สร้างเอฟเฟกต์บนพื้นผิวโลก
            this.createEarthClickEffect(intersects[0].point);
        } else {
            // คลิกที่อื่น - สร้างเอฟเฟกต์ทั่วไป
            this.createSpaceClickEffect(mouse);
        }
    }
    
    /**
     * สร้างเอฟเฟกต์เมื่อคลิกที่โลก
     * @param {THREE.Vector3} position - ตำแหน่งที่คลิก
     */
    createEarthClickEffect(position) {
        // สร้างเอฟเฟกต์คล้ายเมฆหรือออโรร่าเมื่อคลิกที่โลก
        
        // สร้างแสงที่จุดที่คลิก
        const light = new THREE.PointLight(0x4a9eff, 2, 3);
        light.position.copy(position);
        this.group.add(light);
        
        // สร้างวัตถุเรืองแสงเล็กๆ ที่จุดที่คลิก
        const glowGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a9eff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.copy(position);
        this.group.add(glowMesh);
        
        // แอนิเมชันแสง
        gsap.to(light, {
            intensity: 0,
            duration: 2,
            ease: "power2.out",
            onComplete: () => {
                this.group.remove(light);
            }
        });
        
        // แอนิเมชันวัตถุเรืองแสง
        gsap.to(glowMesh.scale, {
            x: 5,
            y: 5,
            z: 5,
            duration: 2,
            ease: "power2.out"
        });
        
        gsap.to(glowMaterial, {
            opacity: 0,
            duration: 2,
            ease: "power2.out",
            onComplete: () => {
                this.group.remove(glowMesh);
                glowGeometry.dispose();
                glowMaterial.dispose();
            }
        });
        
        // สร้างอนุภาคออกจากจุดที่คลิก
        this.createParticleEffect(position, {
            count: 100,
            color: 0x4a9eff,
            size: 0.05,
            duration: 2,
            speed: 0.5,
            spread: 0.2
        });
    }
    
    /**
     * สร้างเอฟเฟกต์เมื่อคลิกในอวกาศ
     * @param {THREE.Vector2} mouse - ตำแหน่งเมาส์แบบ normalized
     */
    createSpaceClickEffect(mouse) {
        // สร้างตำแหน่งในอวกาศโดยยิงรังสีจากกล้อง
        const ray = new THREE.Ray();
        ray.origin.setFromMatrixPosition(sceneManager.camera.matrixWorld);
        ray.direction.set(mouse.x, mouse.y, 0.5).unproject(sceneManager.camera).sub(ray.origin).normalize();
        
        // คำนวณตำแหน่งในอวกาศ
        const distance = 10; // ระยะห่างจากกล้อง
        const position = new THREE.Vector3();
        position.copy(ray.origin).add(ray.direction.multiplyScalar(distance));
        
        // สร้างดาวตกหรือเอฟเฟกต์อื่นๆ ในอวกาศ
        this.createShootingStarEffect(position, ray.direction);
    }
    
    /**
     * สร้างเอฟเฟกต์ดาวตก
     * @param {THREE.Vector3} position - ตำแหน่งเริ่มต้น
     * @param {THREE.Vector3} direction - ทิศทาง
     */
    createShootingStarEffect(position, direction) {
        // สร้างเส้นทางดาวตก
        const points = [];
        const length = 5; // ความยาวของดาวตก
        const trailCount = 15; // จำนวนจุดในเส้นทาง
        
        // จุดเริ่มต้น
        points.push(position.clone());
        
        // จุดตามเส้นทาง
        for (let i = 1; i < trailCount; i++) {
            const t = i / (trailCount - 1);
            const pos = position.clone().add(direction.clone().multiplyScalar(-length * t));
            points.push(pos);
        }
        
        // สร้าง geometry สำหรับเส้นทาง
        const trailGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // สร้าง material สำหรับเส้นทาง
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        // สร้างเส้นทาง
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        this.group.add(trail);
        
        // สร้างดาวตก
        const starGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const starMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.copy(position);
        this.group.add(star);
        
        // แอนิเมชันดาวตก
        gsap.to(star.position, {
            x: position.x + direction.x * -length * 2,
            y: position.y + direction.y * -length * 2,
            z: position.z + direction.z * -length * 2,
            duration: 1.5,
            ease: "power2.in"
        });
        
        gsap.to(starMaterial, {
            opacity: 0,
            duration: 1.5,
            ease: "power2.in"
        });
        
        gsap.to(trailMaterial, {
            opacity: 0,
            duration: 1.8,
            ease: "power2.in",
            onComplete: () => {
                // ลบดาวตกและเส้นทาง
                this.group.remove(star);
                this.group.remove(trail);
                
                starGeometry.dispose();
                starMaterial.dispose();
                trailGeometry.dispose();
                trailMaterial.dispose();
            }
        });
        
        // สร้างอนุภาคตามเส้นทาง
        for (let i = 0; i < 3; i++) {
            const t = Math.random();
            const pos = position.clone().add(direction.clone().multiplyScalar(-length * t));
            
            this.createParticleEffect(pos, {
                count: 20,
                color: 0xffffff,
                size: 0.02,
                duration: 1.0,
                speed: 0.2,
                spread: 0.1
            });
        }
    }
    
    /**
     * อัปเดตฉากโลก
     * @param {number} time - เวลาที่ผ่านไป (วินาที)
     */
    update(time) {
        // หมุนโลก
        if (this.earth) {
            this.earth.rotation.y += 0.001;
        }
        
        // หมุนเมฆช้ากว่าโลกเล็กน้อย
        if (this.clouds) {
            this.clouds.rotation.y += 0.0012;
        }
        
        // ทำให้ดวงจันทร์โคจรรอบโลก
        if (this.moonOrbit) {
            this.moonOrbit.rotation.y += 0.0002;
        }
        
        // ทำให้ดวงจันทร์หมุนรอบตัวเอง
        if (this.moon) {
            this.moon.rotation.y += 0.0005;
        }
        
        // อัปเดตชั้นบรรยากาศ
        if (this.atmosphereMaterial && this.atmosphereMaterial.uniforms) {
            this.atmosphereMaterial.uniforms.time.value = time;
            
            // อัปเดต viewVector เพื่อให้ glow ปรากฏที่ขอบโลก
            const viewVector = new THREE.Vector3().subVectors(
                sceneManager.camera.position,
                this.group.position
            ).normalize();
            
            this.atmosphereMaterial.uniforms.viewVector.value = viewVector;
        }
        
        // อัปเดตอนุภาค
        if (this.atmosphericParticles) {
            // ทำให้อนุภาคเคลื่อนไหวเล็กน้อย
            const positions = this.atmosphericParticles.geometry.attributes.position.array;
            const count = positions.length / 3;
            
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const x = positions[i3];
                const y = positions[i3 + 1];
                const z = positions[i3 + 2];
                
                // คำนวณระยะห่างจากศูนย์กลาง
                const radius = Math.sqrt(x * x + y * y + z * z);
                
                // คำนวณตำแหน่งแบบทรงกลม
                const theta = Math.atan2(y, x);
                const phi = Math.acos(z / radius);
                
                // เพิ่มการเคลื่อนไหวแบบ sine wave
                const newTheta = theta + 0.002 * Math.sin(time + i * 0.01);
                const newPhi = phi + 0.001 * Math.cos(time + i * 0.01);
                
                // คำนวณตำแหน่งใหม่
                positions[i3] = radius * Math.sin(newPhi) * Math.cos(newTheta);
                positions[i3 + 1] = radius * Math.sin(newPhi) * Math.sin(newTheta);
                positions[i3 + 2] = radius * Math.cos(newPhi);
            }
            
            this.atmosphericParticles.geometry.attributes.position.needsUpdate = true;
        }
        
        // อัปเดตระบบอนุภาค
        this.particleSystems.forEach(updateFunc => {
            updateFunc(0.016); // ถ้าเป็น 60fps จะเท่ากับ 1/60 = 0.016 วินาที
        });
    }
    
    /**
     * อัปเดตจำนวนอนุภาค
     * @param {number} multiplier - ตัวคูณจำนวนอนุภาค (0.0 - 1.0)
     */
    updateParticleCount(multiplier) {
        super.updateParticleCount(multiplier);
        
        // ลบอนุภาคชั้นบรรยากาศเดิม
        if (this.atmosphericParticles) {
            this.group.remove(this.atmosphericParticles);
            
            // ลบออกจากรายการอนุภาค
            const index = this.particles.indexOf(this.atmosphericParticles);
            if (index !== -1) {
                this.particles.splice(index, 1);
            }
            
            this.atmosphericParticles.geometry.dispose();
            this.atmosphericParticles.material.dispose();
            this.atmosphericParticles = null;
        }
        
        // สร้างอนุภาคใหม่ตามตัวคูณ
        this.createAtmosphericParticles();
    }
    
    /**
     * รีเซ็ตฉากกลับสู่สถานะเริ่มต้น
     */
    reset() {
        super.reset();
        
        // รีเซ็ตการหมุนของโลก
        if (this.earth) {
            this.earth.rotation.y = 0;
        }
        
        // รีเซ็ตการหมุนของเมฆ
        if (this.clouds) {
            this.clouds.rotation.y = 0;
        }
        
        // รีเซ็ตตำแหน่งของดวงจันทร์
        if (this.moonOrbit) {
            this.moonOrbit.rotation.y = Math.random() * Math.PI * 2;
        }
    }
}