class AdvancedUranusScene {
    constructor(scene, textures) {
        this.scene = scene;
        this.textures = textures;
        
        // สร้างกลุ่มเพื่อเก็บวัตถุทั้งหมดสำหรับฉากนี้
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // สร้างดาวยูเรนัสและส่วนประกอบต่างๆ
        this.createUranus();
        this.createRings();
        this.createAtmosphere();
        this.createAurora();
        this.createMoons();
        this.createStarParticles();
        
        // เก็บค่าเริ่มต้นสำหรับแอนิเมชันและปฏิสัมพันธ์
        this.initialRotation = this.group.rotation.clone();
        
        // เริ่มต้นตำแหน่งนอกหน้าจอสำหรับการเปลี่ยนฉาก
        this.group.position.set(0, 0, 50);
        
        // ตั้งค่าความเอียงของดาวยูเรนัส (ประมาณ 98 องศา)
        this.group.rotation.z = Math.PI / 1.84;
    }
    
    createUranus() {
        // สร้างพื้นผิวดาวยูเรนัส
        const uranusGeometry = new THREE.SphereGeometry(6, 128, 128);
        const uranusMaterial = new THREE.MeshPhysicalMaterial({
            map: this.textures.uranusMap,
            bumpScale: 0.05,
            roughness: 0.8,
            metalness: 0.1,
            clearcoat: 0.3,
            clearcoatRoughness: 0.4,
            envMapIntensity: 0.7
        });
        
        const uranusMesh = new THREE.Mesh(uranusGeometry, uranusMaterial);
        this.group.add(uranusMesh);
        this.uranusMesh = uranusMesh;
        
        // เพิ่มแสงภายในเพื่อสร้างเอฟเฟกต์การส่องผ่าน
        const innerLight = new THREE.PointLight(0x88ccff, 1.5, 10);
        innerLight.position.set(0, 0, 0);
        this.group.add(innerLight);
        this.innerLight = innerLight;
    }
    
    createRings() {
        // สร้างวงแหวนหลัก
        const ringGeometry = new THREE.RingGeometry(9, 11, 128, 8);
        const ringMaterial = new THREE.MeshPhongMaterial({
            map: this.textures.uranusRing,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = Math.PI / 2;
        this.group.add(ringMesh);
        this.ringMesh = ringMesh;
        
        // เพิ่มวงแหวนด้านนอกที่บางกว่า
        const outerRingGeometry = new THREE.RingGeometry(11.5, 12.5, 128, 4);
        const outerRingMaterial = new THREE.MeshPhongMaterial({
            map: this.textures.uranusRing,
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
            map: this.textures.uranusRing,
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
        
        // เพิ่มอนุภาคในวงแหวน
        this.createRingParticles();
    }
    
    createRingParticles() {
        // สร้างระบบอนุภาคสำหรับวงแหวน
        const ringParticles = new THREE.Group();
        const particleCount = 5000;
        
        // สร้างเรขาคณิตสำหรับอนุภาค
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // สร้างอนุภาคในวงแหวน
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // สุ่มมุมและรัศมี
            const angle = Math.random() * Math.PI * 2;
            const radius = 9 + Math.random() * 2; // ระหว่างวงแหวนด้านในและด้านนอก
            
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
        
        // สร้างระบบอนุภาค
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        ringParticles.add(particles);
        
        // หมุนให้ขนานกับวงแหวน
        ringParticles.rotation.x = Math.PI / 2;
        
        // เพิ่มไปยังกลุ่ม
        this.group.add(ringParticles);
        this.ringParticles = ringParticles;
    }
    
    createAtmosphere() {
        // สร้างชั้นบรรยากาศ
        const atmosphereGeometry = new THREE.SphereGeometry(6.3, 128, 128);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x00aaff) },
                viewVector: { value: new THREE.Vector3(0, 0, 1) },
                c: { value: 0.7 },
                p: { value: 3.0 },
                time: { value: 0.0 }
            },
            vertexShader: `
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
            fragmentShader: `
                uniform vec3 glowColor;
                uniform float time;
                varying float intensity;
                varying vec2 vUv;
                
                void main() {
                    // เพิ่มลวดลายการไหลเวียนของชั้นบรรยากาศ
                    float flow = sin(vUv.x * 10.0 + vUv.y * 20.0 + time * 0.5) * 0.1 + 0.9;
                    vec3 glow = glowColor * intensity * flow;
                    
                    // ปรับเปลี่ยนสีตามตำแหน่ง
                    float latitude = abs(vUv.y - 0.5) * 2.0;
                    vec3 poleColor = mix(glowColor, vec3(0.0, 0.5, 1.0), latitude);
                    
                    // ผสมสี
                    vec3 finalColor = mix(glow, poleColor * intensity, latitude * 0.5);
                    
                    gl_FragColor = vec4(finalColor, intensity * 0.8);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.group.add(atmosphere);
        this.atmosphereMaterial = atmosphereMaterial;
    }
    
    createAurora() {
        // สร้างแสงออโรร่าที่ขั้วดาว
        
        // ขั้วเหนือ
        const northAuroraGeometry = new THREE.TorusGeometry(2, 0.6, 32, 64);
        const northAuroraMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 }
            },
            vertexShader: `
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
            fragmentShader: `
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
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const northAurora = new THREE.Mesh(northAuroraGeometry, northAuroraMaterial);
        northAurora.position.y = 5.8;
        northAurora.rotation.x = Math.PI / 2;
        this.group.add(northAurora);
        this.northAuroraMaterial = northAuroraMaterial;
        
        // ขั้วใต้
        const southAuroraGeometry = new THREE.TorusGeometry(2, 0.6, 32, 64);
        const southAuroraMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 }
            },
            vertexShader: northAuroraMaterial.vertexShader,
            fragmentShader: northAuroraMaterial.fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const southAurora = new THREE.Mesh(southAuroraGeometry, southAuroraMaterial);
        southAurora.position.y = -5.8;
        southAurora.rotation.x = Math.PI / 2;
        this.group.add(southAurora);
        this.southAuroraMaterial = southAuroraMaterial;
    }
    
    createMoons() {
        // สร้างดวงจันทร์บางดวงรอบยูเรนัส
        const moonGroup = new THREE.Group();
        
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
            
            moonGroup.add(moonOrbit);
        }
        
        // หมุนวงโคจรให้ขนานกับวงแหวน
        moonGroup.rotation.x = Math.PI / 2;
        
        this.group.add(moonGroup);
        this.moonGroup = moonGroup;
    }
    
    createStarParticles() {
        // เพิ่มอนุภาคดาวรอบๆ ยูเรนัส
        const particleCount = 500;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // กระจายอนุภาคในพื้นที่รอบๆ ยูเรนัส
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // ตำแหน่งในรูปทรงกลม
            const radius = 25 + Math.random() * 15;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // สี
            const starColor = Math.random();
            if (starColor > 0.9) {
                // ดาวสีฟ้า
                colors[i3] = 0.6;
                colors[i3 + 1] = 0.8;
                colors[i3 + 2] = 1.0;
            } else if (starColor > 0.8) {
                // ดาวสีขาว
                colors[i3] = 1.0;
                colors[i3 + 1] = 1.0;
                colors[i3 + 2] = 1.0;
            } else if (starColor > 0.6) {
                // ดาวสีเหลือง
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.9;
                colors[i3 + 2] = 0.7;
            } else {
                // ดาวสีฟ้าอ่อน
                colors[i3] = 0.8;
                colors[i3 + 1] = 0.9;
                colors[i3 + 2] = 1.0;
            }
            
            // ขนาด
            sizes[i] = 0.05 + Math.random() * 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false
        });
        
        const starParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.group.add(starParticles);
        this.starParticles = starParticles;
    }
    
    // สร้างเอฟเฟกต์เมื่อคลิก
    createRingEffects(event) {
        // คำนวณตำแหน่งเมาส์ในพื้นที่ 3D
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // คำนวณตำแหน่งบนวงแหวน
        const angle = Math.atan2(mouseY, mouseX);
        const radius = 10;
        
        const position = new THREE.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        );
        
        // สร้างเอฟเฟกต์วงแหวน
        this.createRingFlare(position, angle);
    }
    
    createRingFlare(position, angle) {
        // แสงริบหรี่บนวงแหวน
        const flareGeometry = new THREE.PlaneGeometry(1.5, 0.7);
        const flareMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
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
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
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
        
        // แอนิเมชัน
        let time = 0;
        const animateFlare = () => {
            time += 0.05;
            flareMaterial.uniforms.time.value = time;
            
            if (time < 3) {
                requestAnimationFrame(animateFlare);
            } else {
                // นำวัตถุออกเมื่อแอนิเมชันเสร็จสิ้น
                this.ringMesh.remove(flare);
                this.ringMesh.remove(light);
                flareMaterial.dispose();
                flareGeometry.dispose();
            }
        };
        
        animateFlare();
        
        // สร้างคลื่นกระเพื่อมในวงแหวน
        this.createRingRipple(position, angle);
    }
    
    createRingRipple(position, angle) {
        // คลื่นกระเพื่อมในวงแหวน
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
    
    update(time) {
        // หมุนดาวยูเรนัส
        if (this.uranusMesh) {
            this.uranusMesh.rotation.y += 0.001;
        }
        
        // อัปเดตชั้นบรรยากาศ
        if (this.atmosphereMaterial && this.atmosphereMaterial.uniforms) {
            this.atmosphereMaterial.uniforms.time.value = time;
        }
        
        // อัปเดตแสงออโรร่า
        if (this.northAuroraMaterial && this.northAuroraMaterial.uniforms) {
            this.northAuroraMaterial.uniforms.time.value = time;
        }
        
        if (this.southAuroraMaterial && this.southAuroraMaterial.uniforms) {
            this.southAuroraMaterial.uniforms.time.value = time;
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
        
        // หมุนกลุ่มดาวเล็กน้อย
        if (this.starParticles) {
            this.starParticles.rotation.y += 0.0001;
        }
    }
}