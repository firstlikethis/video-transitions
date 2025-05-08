/**
 * UranusScene.js
 * สร้างฉากยูเรนัสที่สมจริงพร้อมวงแหวนและเอฟเฟกต์
 */
class UranusScene extends BaseScene {
    /**
     * สร้างฉากยูเรนัส
     * @param {THREE.Scene} scene - Scene หลักของแอพพลิเคชัน
     * @param {Object} textures - เก็บเท็กซ์เจอร์ทั้งหมด
     * @param {Object} materials - เก็บวัสดุที่สร้างจากเท็กซ์เจอร์
     */
    constructor(scene, textures, materials) {
        super(scene, textures, materials);
    }
    
    /**
     * ตั้งค่าเริ่มต้นของฉากยูเรนัส
     */
    setup() {
        // สร้างดาวยูเรนัส
        this.createUranus();
        
        // สร้างวงแหวนยูเรนัส
        this.createRings();
        
        // สร้างชั้นบรรยากาศ
        this.createAtmosphere();
        
        // สร้างออโรร่า
        this.createAurora();
        
        // สร้างดวงจันทร์
        this.createMoons();
        
        // สร้างอนุภาคในวงแหวน
        this.createRingParticles();
        
        // บันทึกค่าเริ่มต้นสำหรับการหมุน
        this.initialRotation = this.group.rotation.clone();
        
        // บิดเอียงยูเรนัส (ในความเป็นจริงยูเรนัสเอียงประมาณ 98 องศา)
        this.group.rotation.z = Math.PI / 1.84; // ประมาณ 98 องศา
    }
    
    /**
     * สร้างดาวยูเรนัส
     */
    createUranus() {
        // สร้างพื้นผิวยูเรนัส
        const uranusGeometry = new THREE.SphereGeometry(6, 64, 64);
        
        // ใช้วัสดุที่มีหรือสร้างใหม่
        let uranusMaterial;
        
        if (this.materials && this.materials.uranus) {
            // ใช้วัสดุที่สร้างไว้แล้ว
            uranusMaterial = this.materials.uranus;
        } else if (this.textures && this.textures.uranusMap) {
            // สร้างวัสดุจากเท็กซ์เจอร์
            uranusMaterial = new THREE.MeshPhysicalMaterial({
                map: this.textures.uranusMap,
                bumpScale: 0.05,
                roughness: 0.8,
                metalness: 0.1,
                clearcoat: 0.3,
                clearcoatRoughness: 0.4,
                envMapIntensity: 0.7
            });
        } else {
            // สร้างวัสดุเริ่มต้นหากไม่มีเท็กซ์เจอร์
            uranusMaterial = new THREE.MeshPhongMaterial({
                color: CONSTANTS.COLORS.URANUS.surface,
                specular: 0x88bbff,
                shininess: 10
            });
        }
        
        const uranusMesh = new THREE.Mesh(uranusGeometry, uranusMaterial);
        uranusMesh.castShadow = true;
        uranusMesh.receiveShadow = true;
        
        this.group.add(uranusMesh);
        this.uranusMesh = uranusMesh;
        
        // เพิ่มแสงภายในเพื่อสร้างเอฟเฟกต์การส่องผ่าน
        const innerLight = new THREE.PointLight(0x88ccff, 1.5, 10);
        innerLight.position.set(0, 0, 0);
        this.group.add(innerLight);
        this.innerLight = innerLight;
    }
    
    /**
     * สร้างวงแหวนยูเรนัส
     */
    createRings() {
        // สร้างวงแหวนหลัก
        const ringGeometry = new THREE.RingGeometry(9, 11, 128, 8);
        
        // ใช้วัสดุที่มีหรือสร้างใหม่
        let ringMaterial;
        
        if (this.materials && this.materials.uranusRing) {
            // ใช้วัสดุที่สร้างไว้แล้ว
            ringMaterial = this.materials.uranusRing;
        } else if (this.textures && this.textures.uranusRing) {
            // สร้างวัสดุจากเท็กซ์เจอร์
            ringMaterial = new THREE.MeshPhongMaterial({
                map: this.textures.uranusRing,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
        } else {
            // สร้างวัสดุเริ่มต้นหากไม่มีเท็กซ์เจอร์
            ringMaterial = new THREE.MeshPhongMaterial({
                color: CONSTANTS.COLORS.URANUS.rings,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
        }
        
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = Math.PI / 2;
        this.group.add(ringMesh);
        this.ringMesh = ringMesh;
        
        // เพิ่มวงแหวนด้านนอกที่บางกว่า
        const outerRingGeometry = new THREE.RingGeometry(11.5, 12.5, 128, 4);
        const outerRingMaterial = new THREE.MeshPhongMaterial({
            color: CONSTANTS.COLORS.URANUS.rings,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const outerRingMesh = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        outerRingMesh.rotation.x = Math.PI / 2;
        this.group.add(outerRingMesh);
        this.outerRingMesh = outerRingMesh;
        
        // เพิ่มวงแหวนด้านในที่บางกว่า
        const innerRingGeometry = new THREE.RingGeometry(7.5, 8.5, 128, 4);
        const innerRingMaterial = new THREE.MeshPhongMaterial({
            color: CONSTANTS.COLORS.URANUS.rings,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const innerRingMesh = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        innerRingMesh.rotation.x = Math.PI / 2;
        this.group.add(innerRingMesh);
        this.innerRingMesh = innerRingMesh;
    }
    
    /**
     * สร้างชั้นบรรยากาศ
     */
    createAtmosphere() {
        // สร้างชั้นบรรยากาศ
        const atmosphereGeometry = new THREE.SphereGeometry(6.3, 64, 64);
        
        // ใช้วัสดุที่มีหรือสร้างใหม่
        let atmosphereMaterial;
        
        if (this.materials && this.materials.uranusAtmosphere) {
            // ใช้วัสดุที่สร้างไว้แล้ว
            atmosphereMaterial = this.materials.uranusAtmosphere;
        } else {
            // สร้าง shader material
            atmosphereMaterial = this.createShaderMaterial(
                {
                    glowColor: { value: new THREE.Color(CONSTANTS.COLORS.URANUS.atmosphere) },
                    viewVector: { value: new THREE.Vector3(0, 0, 1) },
                    c: { value: 0.7 },
                    p: { value: 3.0 },
                    time: { value: 0.0 }
                },
                // vertex shader
                `
                uniform vec3 viewVector;
                uniform float c;
                uniform float p;
                uniform float time;
                varying float intensity;
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    
                    // เพิ่มการเคลื่อนไหวเล็กน้อย
                    float noise = sin(vUv.y * 20.0 + time) * 0.05;
                    intensity = pow(c - dot(vNormal, vNormel), p) + noise;
                    
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
                    // เพิ่มลวดลายการไหลเวียนของชั้นบรรยากาศ
                    float flow = sin(vUv.x * 10.0 + vUv.y * 20.0 + time * 0.5) * 0.1 + 0.9;
                    vec3 glow = glowColor * intensity * flow;
                    gl_FragColor = vec4(glow, intensity * 0.8);
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
     * สร้างออโรร่า
     */
    createAurora() {
        // สร้างแสงออโรร่าที่ขั้วดาว
        
        // ขั้วเหนือ
        const northAuroraGeometry = new THREE.TorusGeometry(2, 0.6, 32, 64);
        const northAuroraMaterial = this.createShaderMaterial(
            {
                time: { value: 0.0 }
            },
            // vertex shader
            `
            varying vec2 vUv;
            varying vec3 vPosition;
            uniform float time;
            
            void main() {
                vUv = uv;
                vPosition = position;
                
                // เพิ่มการเคลื่อนไหวให้กับออโรร่า
                float wave = sin(vUv.x * 20.0 + time * 2.0) * 0.1;
                vec3 newPosition = position;
                newPosition.y += wave;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
            `,
            // fragment shader
            `
            uniform float time;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                // สร้างสีไล่ระดับสำหรับออโรร่า
                float wave = sin(vUv.x * 30.0 + time * 3.0) * 0.5 + 0.5;
                vec3 color1 = vec3(0.0, 0.8, 1.0); // สีฟ้า
                vec3 color2 = vec3(0.0, 0.5, 1.0); // สีน้ำเงิน
                
                vec3 finalColor = mix(color1, color2, wave);
                
                // เพิ่มความเข้มตามตำแหน่ง
                float intensity = sin(vUv.y * 3.14159) * 0.7 + 0.3;
                
                gl_FragColor = vec4(finalColor, intensity * 0.5);
            }
            `,
            {
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            }
        );
        
        const northAurora = new THREE.Mesh(northAuroraGeometry, northAuroraMaterial);
        northAurora.position.y = 5.8;
        northAurora.rotation.x = Math.PI / 2;
        this.group.add(northAurora);
        this.northAurora = northAurora;
        this.northAuroraMaterial = northAuroraMaterial;
        
        // ขั้วใต้
        const southAuroraGeometry = new THREE.TorusGeometry(2, 0.6, 32, 64);
        const southAuroraMaterial = this.createShaderMaterial(
            {
                time: { value: 0.0 }
            },
            northAuroraMaterial.vertexShader,
            northAuroraMaterial.fragmentShader,
            {
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            }
        );
        
        const southAurora = new THREE.Mesh(southAuroraGeometry, southAuroraMaterial);
        southAurora.position.y = -5.8;
        southAurora.rotation.x = Math.PI / 2;
        this.group.add(southAurora);
        this.southAurora = southAurora;
        this.southAuroraMaterial = southAuroraMaterial;
    }
    
    /**
     * สร้างดวงจันทร์
     */
    createMoons() {
        // สร้างกลุ่มสำหรับดวงจันทร์
        this.moonGroup = new THREE.Group();
        
        // สร้างดวงจันทร์ 5 ดวง
        const moonCount = 5;
        const moonRadii = [0.3, 0.5, 0.4, 0.6, 0.3]; // ขนาดดวงจันทร์
        const moonDistances = [14, 16, 18, 20, 22]; // ระยะห่างจากยูเรนัส
        const moonSpeeds = [0.03, 0.025, 0.02, 0.015, 0.01]; // ความเร็วในการหมุน
        
        for (let i = 0; i < moonCount; i++) {
            const moonGeometry = new THREE.SphereGeometry(moonRadii[i], 32, 32);
            const moonMaterial = new THREE.MeshPhongMaterial({
                color: 0xdddddd,
                specular: 0x555555,
                shininess: 5
            });
            
            const moon = new THREE.Mesh(moonGeometry, moonMaterial);
            moon.castShadow = true;
            
            // สุ่มตำแหน่งเริ่มต้น
            const angle = Math.random() * Math.PI * 2;
            moon.position.set(
                Math.cos(angle) * moonDistances[i],
                0,
                Math.sin(angle) * moonDistances[i]
            );
            
            // สร้างกลุ่มสำหรับแต่ละดวงจันทร์เพื่อการหมุน
            const moonOrbit = new THREE.Group();
            moonOrbit.add(moon);
            
            // เก็บความเร็วสำหรับแอนิเมชัน
            moonOrbit.userData.speed = moonSpeeds[i];
            
            this.moonGroup.add(moonOrbit);
        }
        
        // หมุนวงโคจรให้ขนานกับวงแหวน
        this.moonGroup.rotation.x = Math.PI / 2;
        
        this.group.add(this.moonGroup);
    }
    
    /**
     * สร้างอนุภาคในวงแหวน
     */
    createRingParticles() {
        // จำนวนอนุภาค
        const baseCount = CONSTANTS.BASE_PARTICLE_COUNTS.URANUS.ringParticles;
        const particleCount = Math.floor(baseCount * this.particleMultiplier);
        
        // สร้าง geometry สำหรับอนุภาค
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // สร้างอนุภาคในวงแหวน
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // สุ่มมุมและรัศมี
            const angle = Math.random() * Math.PI * 2;
            const radius = 9 + Math.random() * 3; // ระหว่างวงแหวนด้านในและด้านนอก
            
            // คำนวณตำแหน่ง
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = (Math.random() - 0.5) * 0.2; // ความหนาเล็กน้อย
            positions[i3 + 2] = Math.sin(angle) * radius;
            
            // สีอนุภาค - ฟ้าอมเขียวคล้ายยูเรนัส
            const brightness = 0.5 + Math.random() * 0.5;
            colors[i3] = 0.5 * brightness;
            colors[i3 + 1] = 0.8 * brightness;
            colors[i3 + 2] = 0.9 * brightness;
            
            // ขนาดอนุภาค
            sizes[i] = 0.05 + Math.random() * 0.08;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // สร้าง material สำหรับอนุภาค
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // ใช้เท็กซ์เจอร์อนุภาคหากมี
        if (this.textures && this.textures.particle) {
            particleMaterial.map = this.textures.particle;
        }
        
        // สร้างระบบอนุภาค
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        
        // หมุนให้ขนานกับวงแหวน
        particles.rotation.x = Math.PI / 2;
        
        // เพิ่มไปยังกลุ่ม
        this.group.add(particles);
        this.ringParticles = particles;
        
        // เพิ่มเข้าไปในรายการอนุภาค
        this.particles.push(particles);
    }
    
    /**
     * จัดการการคลิกในฉากยูเรนัส
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
        
        // ตรวจสอบการชนกับยูเรนัส
        const intersectsUranus = raycaster.intersectObject(this.uranusMesh, true);
        
        if (intersectsUranus.length > 0) {
            // คลิกที่ยูเรนัส - สร้างเอฟเฟกต์บนพื้นผิวยูเรนัส
            this.createUranusClickEffect(intersectsUranus[0].point);
        } else {
            // ตรวจสอบการชนกับวงแหวน
            const intersectsRing = raycaster.intersectObject(this.ringMesh, true);
            
            if (intersectsRing.length > 0) {
                // คลิกที่วงแหวน - สร้างเอฟเฟกต์บนวงแหวน
                this.createRingClickEffect(intersectsRing[0].point);
            } else {
                // คลิกที่อื่น - สร้างเอฟเฟกต์ทั่วไป
                this.createSpaceClickEffect(mouse);
            }
        }
    }
    
    /**
     * สร้างเอฟเฟกต์เมื่อคลิกที่ยูเรนัส
     * @param {THREE.Vector3} position - ตำแหน่งที่คลิก
     */
    createUranusClickEffect(position) {
        // สร้างแสงที่จุดที่คลิก
        const light = new THREE.PointLight(CONSTANTS.COLORS.URANUS.atmosphere, 2, 3);
        light.position.copy(position);
        this.group.add(light);
        
        // สร้างวัตถุเรืองแสงเล็กๆ ที่จุดที่คลิก
        const glowGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: CONSTANTS.COLORS.URANUS.atmosphere,
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
            color: CONSTANTS.COLORS.URANUS.atmosphere,
            size: 0.05,
            duration: 2,
            speed: 0.5,
            spread: 0.2
        });
        
        // เล่นเสียงเอฟเฟกต์
        if (audioManager && audioManager.enabled) {
            audioManager.playEffect('celestial');
        }
    }
    
    /**
     * สร้างเอฟเฟกต์เมื่อคลิกที่วงแหวน
     * @param {THREE.Vector3} position - ตำแหน่งที่คลิก
     */
    createRingClickEffect(position) {
        // คำนวณมุมบนวงแหวน
        const angle = Math.atan2(position.z, position.x);
        
        // สร้างเอฟเฟกต์แสงริบหรี่บนวงแหวน
        const flareGeometry = new THREE.PlaneGeometry(1.5, 0.7);
        const flareMaterial = this.createShaderMaterial(
            {
                time: { value: 0 }
            },
            // vertex shader
            `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
            // fragment shader
            `
            uniform float time;
            varying vec2 vUv;
            
            void main() {
                // แสงที่วูบวาบ
                float flicker = 0.8 + 0.2 * sin(time * 10.0);
                
                // ไล่ระดับจากจุดศูนย์กลาง
                float dist = length(vUv - vec2(0.5));
                float gradient = 1.0 - smoothstep(0.0, 0.5, dist);
                
                // สีฟ้าอมเขียวคล้ายยูเรนัส
                vec3 color = mix(vec3(0.3, 0.9, 1.0), vec3(0.5, 0.8, 1.0), vUv.y);
                
                // ปรับความสว่างตามเวลา
                color *= flicker;
                
                // ปรับความโปร่งใสตามระยะทาง
                float alpha = gradient * flicker;
                
                gl_FragColor = vec4(color, alpha);
            }
            `,
            {
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            }
        );
        
        const flare = new THREE.Mesh(flareGeometry, flareMaterial);
        
        // ตั้งตำแหน่ง
        flare.position.copy(position);
        
        // หันให้ถูกทิศทาง
        flare.lookAt(0, 0, 0);
        flare.rotateY(Math.PI / 2);
        flare.rotateX(Math.PI / 2);
        
        // เพิ่มการหมุนตามมุม
        flare.rotation.z = angle;
        
        // เพิ่มไปยังวงแหวน
        this.ringMesh.add(flare);
        
        // เพิ่มแสง
        const light = new THREE.PointLight(0x40d0ff, 2, 5);
        light.position.copy(position);
        this.ringMesh.add(light);
        
        // เก็บเวลาเริ่มต้น
        const startTime = performance.now() * 0.001;
        
        // ฟังก์ชันอัปเดตสำหรับแอนิเมชัน
        const updateFlare = (time) => {
            const elapsedTime = time - startTime;
            flareMaterial.uniforms.time.value = elapsedTime;
            
            if (elapsedTime < 3) {
                // ดำเนินการอัปเดตต่อ
                this.particleSystems.push(() => updateFlare(performance.now() * 0.001));
            } else {
                // นำวัตถุออกเมื่อแอนิเมชันเสร็จสิ้น
                this.ringMesh.remove(flare);
                this.ringMesh.remove(light);
                flare.geometry.dispose();
                flareMaterial.dispose();
            }
        };
        
        // เริ่มอัปเดต
        this.particleSystems.push(() => updateFlare(performance.now() * 0.001));
        
        // สร้างคลื่นกระเพื่อมในวงแหวน
        this.createRingRipple(position, angle);
        
        // เล่นเสียงเอฟเฟกต์
        if (audioManager && audioManager.enabled) {
            audioManager.playEffect('celestial');
        }
    }
    
    /**
     * สร้างคลื่นกระเพื่อมในวงแหวน
     * @param {THREE.Vector3} position - ตำแหน่ง
     * @param {number} angle - มุม
     */
    createRingRipple(position, angle) {
        // สร้างคลื่นกระเพื่อมในวงแหวน
        const rippleGeometry = new THREE.PlaneGeometry(2.5, 0.7);
        const rippleMaterial = new THREE.MeshBasicMaterial({
            color: 0x40d0ff,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
        ripple.position.copy(position);
        
        // หันให้ถูกทิศทาง
        ripple.lookAt(0, 0, 0);
        ripple.rotateY(Math.PI / 2);
        ripple.rotateX(Math.PI / 2);
        ripple.rotation.z = angle;
        
        this.ringMesh.add(ripple);
        
        // แอนิเมชันคลื่น
        gsap.to(ripple.scale, {
            x: 8,
            y: 2,
            z: 1,
            duration: 2,
            ease: "power1.out"
        });
        
        gsap.to(rippleMaterial, {
            opacity: 0,
            duration: 2,
            ease: "power1.out",
            onComplete: () => {
                this.ringMesh.remove(ripple);
                rippleGeometry.dispose();
                rippleMaterial.dispose();
            }
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
        const distance = 15; // ระยะห่างจากกล้อง
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
            color: 0x88ccff,
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
            color: 0x88ccff,
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
                color: 0x88ccff,
                size: 0.02,
                duration: 1.0,
                speed: 0.2,
                spread: 0.1
            });
        }
        
        // เล่นเสียงเอฟเฟกต์
        if (audioManager && audioManager.enabled) {
            audioManager.playEffect('celestial');
        }
    }
    
    /**
     * อัปเดตฉากยูเรนัส
     * @param {number} time - เวลาที่ผ่านไป (วินาที)
     */
    update(time) {
        // หมุนยูเรนัส
        if (this.uranusMesh) {
            this.uranusMesh.rotation.y += 0.001;
        }
        
        // หมุนวงแหวน
        if (this.ringMesh) {
            this.ringMesh.rotation.z += 0.0005;
        }
        
        if (this.outerRingMesh) {
            this.outerRingMesh.rotation.z += 0.0003;
        }
        
        if (this.innerRingMesh) {
            this.innerRingMesh.rotation.z += 0.0007;
        }
        
        // หมุนอนุภาควงแหวน
        if (this.ringParticles) {
            this.ringParticles.rotation.z += 0.0005;
        }
        
        // เคลื่อนที่ดวงจันทร์
        if (this.moonGroup) {
            this.moonGroup.children.forEach(moonOrbit => {
                moonOrbit.rotation.y += moonOrbit.userData.speed;
            });
        }
        
        // ทำให้แสงภายในกระพริบเล็กน้อย
        if (this.innerLight) {
            this.innerLight.intensity = 1.5 + Math.sin(time * 1.5) * 0.2;
        }
        
        // เพิ่มการโคลงเคลงเล็กน้อยสำหรับวงแหวน
        if (this.ringMesh) {
            this.ringMesh.rotation.x = Math.PI / 2 + Math.sin(time * 0.2) * 0.02;
        }
        
        // อัปเดตชั้นบรรยากาศ
        if (this.atmosphereMaterial && this.atmosphereMaterial.uniforms) {
            this.atmosphereMaterial.uniforms.time.value = time;
            
            // อัปเดต viewVector เพื่อให้ glow ปรากฏที่ขอบยูเรนัส
            const viewVector = new THREE.Vector3().subVectors(
                sceneManager.camera.position,
                this.group.position
            ).normalize();
            
            this.atmosphereMaterial.uniforms.viewVector.value = viewVector;
        }
        
        // อัปเดตออโรร่า
        if (this.northAuroraMaterial && this.northAuroraMaterial.uniforms) {
            this.northAuroraMaterial.uniforms.time.value = time;
        }
        
        if (this.southAuroraMaterial && this.southAuroraMaterial.uniforms) {
            this.southAuroraMaterial.uniforms.time.value = time;
        }
        
        // อัปเดตระบบอนุภาค
        this.particleSystems.forEach(updateFunc => {
            updateFunc(time);
        });
    }
    
    /**
     * อัปเดตจำนวนอนุภาค
     * @param {number} multiplier - ตัวคูณจำนวนอนุภาค (0.0 - 1.0)
     */
    updateParticleCount(multiplier) {
        super.updateParticleCount(multiplier);
        
        // ลบอนุภาควงแหวนเดิม
        if (this.ringParticles) {
            this.group.remove(this.ringParticles);
            
            // ลบออกจากรายการอนุภาค
            const index = this.particles.indexOf(this.ringParticles);
            if (index !== -1) {
                this.particles.splice(index, 1);
            }
            
            this.ringParticles.geometry.dispose();
            this.ringParticles.material.dispose();
            this.ringParticles = null;
        }
        
        // สร้างอนุภาคใหม่ตามตัวคูณ
        this.createRingParticles();
    }
    
    /**
     * รีเซ็ตฉากกลับสู่สถานะเริ่มต้น
     */
    reset() {
        super.reset();
        
        // รีเซ็ตการหมุนของยูเรนัส
        if (this.uranusMesh) {
            this.uranusMesh.rotation.y = 0;
        }
        
        // รีเซ็ตการหมุนของวงแหวน
        if (this.ringMesh) {
            this.ringMesh.rotation.z = 0;
        }
        
        // รีเซ็ตตำแหน่งของดวงจันทร์
        if (this.moonGroup) {
            this.moonGroup.children.forEach(moonOrbit => {
                const angle = Math.random() * Math.PI * 2;
                moonOrbit.rotation.y = angle;
            });
        }
    }
}