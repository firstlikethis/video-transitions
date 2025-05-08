class InterstellarBlackHoleScene {
    constructor(scene, textures) {
        this.scene = scene;
        this.textures = textures;
        
        // สร้างกลุ่มเพื่อเก็บวัตถุทั้งหมดสำหรับฉากนี้
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // โหลด textures เพิ่มเติมสำหรับหลุมดำ
        this.loadBlackHoleTextures();
        
        // สร้างวัตถุสำหรับฉากหลุมดำ
        this.createBlackHole();
    }
    
    loadBlackHoleTextures() {
        // สร้าง texture สำหรับ accretion disk
        this.accretionDiskTexture = this.createAccretionDiskTexture();
        
        // สร้าง texture สำหรับการบิดเบือนแสง (lensing)
        this.lensingTexture = this.createLensingTexture();
    }
    
    createAccretionDiskTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // ไล่ระดับสีจากด้านในไปด้านนอก
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#ff2200');   // แดงที่ด้านใน (ร้อนที่สุด)
        gradient.addColorStop(0.2, '#ff6600');  // ส้ม-แดง
        gradient.addColorStop(0.4, '#ff9900');  // ส้ม-เหลือง
        gradient.addColorStop(0.6, '#ffcc00');  // เหลือง
        gradient.addColorStop(0.8, '#aaaaff');  // ฟ้า
        gradient.addColorStop(1, '#5555ff');   // น้ำเงิน (เย็นที่สุด)
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // เพิ่มเส้นแถบเพื่อให้มองเห็นการหมุน
        context.fillStyle = 'rgba(0, 0, 0, 0.15)';
        for (let i = 0; i < 40; i++) {
            const y = Math.random() * canvas.height;
            const height = 2 + Math.random() * 6;
            context.fillRect(0, y, canvas.width, height);
        }
        
        // เพิ่มรายละเอียดเม็ดฝุ่นและอนุภาค
        context.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = 1 + Math.random() * 2;
            context.fillRect(x, y, size, size);
        }
        
        // เพิ่มจุดสว่างเพื่อสร้างเอฟเฟกต์ hotspots
        context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = 2 + Math.random() * 3;
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
        }
        
        // สร้าง texture จาก canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }
    
    createLensingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // สร้างการไล่ระดับรัศมีจากศูนย์กลาง
        const gradient = context.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.3, 'rgba(100, 100, 255, 0.2)');
        gradient.addColorStop(0.5, 'rgba(50, 50, 100, 0.1)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // สร้าง texture จาก canvas
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createBlackHole() {
        // สร้างกลุ่มหลุมดำ
        const blackHoleGroup = new THREE.Group();
        
        // 1. Event horizon (หลุมดำตรงกลาง)
        this.createEventHorizon(blackHoleGroup);
        
        // 2. Photon sphere (แสงที่วนเวียนรอบหลุมดำ)
        this.createPhotonSphere(blackHoleGroup);
        
        // 3. Accretion disk (จานวงกลมที่ก่อตัวรอบหลุมดำ)
        this.createAccretionDisk(blackHoleGroup);
        
        // 4. Relativistic jets (ลำแสงที่พุ่งออกมาจากขั้วของหลุมดำ)
        this.createRelativisticJets(blackHoleGroup);
        
        // 5. Gravitational lensing (การบิดเบือนแสงโดยแรงโน้มถ่วง)
        this.createGravitationalLensing(blackHoleGroup);
        
        // 6. เอฟเฟกต์แสงเพิ่มเติมรอบๆ
        this.createLightEffects(blackHoleGroup);
        
        // เก็บการอ้างอิงสำหรับแอนิเมชัน
        this.blackHoleGroup = blackHoleGroup;
        
        // เพิ่มไปยังกลุ่มหลัก
        this.group.add(blackHoleGroup);
        
        // เริ่มต้นตำแหน่งนอกหน้าจอสำหรับการเปลี่ยนฉาก
        this.group.position.set(0, 0, 150);
    }
    
    createEventHorizon(parent) {
        // Event horizon - ทรงกลมสีดำสนิท
        const horizonGeometry = new THREE.SphereGeometry(4, 128, 128);
        const horizonMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.FrontSide
        });
        const horizonMesh = new THREE.Mesh(horizonGeometry, horizonMaterial);
        parent.add(horizonMesh);
        this.eventHorizon = horizonMesh;
    }
    
    createPhotonSphere(parent) {
        // Photon sphere - พื้นที่ที่แสงวนเวียนรอบหลุมดำ
        const sphereGeometry = new THREE.SphereGeometry(4.5, 128, 128);
        const sphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                intensity: { value: 1.0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUv;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                varying vec3 vNormal;
                varying vec2 vUv;
                
                // ฟังก์ชันสำหรับสร้างความสุ่ม
                float hash(float n) {
                    return fract(sin(n) * 43758.5453);
                }
                
                // ฟังก์ชันสำหรับสร้าง noise
                float noise(vec2 p) {
                    vec2 ip = floor(p);
                    vec2 u = fract(p);
                    u = u * u * (3.0 - 2.0 * u);
                    
                    float res = mix(
                        mix(hash(dot(ip, vec2(1.0, 157.0))), 
                            hash(dot(ip + vec2(1.0, 0.0), vec2(1.0, 157.0))), u.x),
                        mix(hash(dot(ip + vec2(0.0, 1.0), vec2(1.0, 157.0))), 
                            hash(dot(ip + vec2(1.0, 1.0), vec2(1.0, 157.0))), u.x), 
                        u.y);
                    return res * res;
                }
                
                void main() {
                    // คำนวณตำแหน่งที่มองเห็น - เห็นมากที่สุดเมื่อมองจากด้านข้าง
                    float rim = 1.0 - abs(dot(vNormal, vec3(0, 0, 1.0)));
                    
                    // เพิ่มการเคลื่อนไหวเล็กน้อยตามเวลา
                    float wobble = noise(vec2(vUv.x * 10.0 + time * 0.1, vUv.y * 10.0)) * 0.1;
                    
                    // สร้างแสงเรืองสีฟ้าเมื่อมองจากด้านข้าง
                    float blueGlow = pow(rim, 5.0) * 2.0 * intensity;
                    
                    // กำหนดสีตามมุมมอง
                    vec3 color = vec3(0.0, 0.0, 0.0); // เริ่มต้นด้วยสีดำ
                    
                    // เพิ่มแสงสีฟ้าที่ขอบ
                    color += vec3(0.0, 0.4, 1.0) * blueGlow * (1.0 + wobble);
                    
                    // ปรับความโปร่งใสตามมุมมอง
                    float visibility = pow(rim, 3.0) * intensity;
                    
                    gl_FragColor = vec4(color, visibility * 0.4);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        });
        
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        parent.add(sphereMesh);
        this.photonSphereMaterial = sphereMaterial;
    }
    
    createAccretionDisk(parent) {
        // Accretion disk - จานสะสมมวลรอบหลุมดำ
        const diskGeometry = new THREE.RingGeometry(5, 15, 128, 8);
        const diskMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                diskTexture: { value: this.accretionDiskTexture }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPos;
                
                void main() {
                    vUv = uv;
                    vPos = position;
                    
                    // ทำให้จานโค้งเล็กน้อย (เหมือนในภาพยนตร์ Interstellar)
                    vec3 pos = position;
                    float dist = length(position.xz);
                    
                    // โค้งมากขึ้นเมื่อใกล้ศูนย์กลาง
                    pos.y -= 0.2 * pow((15.0 - dist) / 10.0, 2.0);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform sampler2D diskTexture;
                varying vec2 vUv;
                varying vec3 vPos;
                
                float hash(float n) {
                    return fract(sin(n) * 43758.5453);
                }
                
                float noise(vec2 p) {
                    vec2 ip = floor(p);
                    vec2 u = fract(p);
                    u = u * u * (3.0 - 2.0 * u);
                    
                    float res = mix(
                        mix(hash(dot(ip, vec2(1.0, 157.0))), 
                            hash(dot(ip + vec2(1.0, 0.0), vec2(1.0, 157.0))), u.x),
                        mix(hash(dot(ip + vec2(0.0, 1.0), vec2(1.0, 157.0))), 
                            hash(dot(ip + vec2(1.0, 1.0), vec2(1.0, 157.0))), u.x), 
                        u.y);
                    return res * res;
                }
                
                void main() {
                    // คำนวณระยะทางจากศูนย์กลาง (ปรับให้เป็น 0-1)
                    float dist = length(vPos.xz);
                    float normalizedDist = (dist - 5.0) / 10.0; // 5.0 เป็นรัศมีด้านใน, 15.0 เป็นรัศมีด้านนอก
                    
                    // คำนวณมุมสำหรับแอนิเมชัน
                    float angle = atan(vPos.z, vPos.x);
                    
                    // ความเร็วการหมุนแตกต่างกันตามระยะห่างจากศูนย์กลาง (กฎของเคปเลอร์)
                    float speed = 0.5 / pow(normalizedDist + 0.5, 0.5);
                    float animatedAngle = angle + time * speed;
                    
                    // สร้าง UV coordinates สำหรับ texture
                    vec2 animatedUv = vec2(
                        normalizedDist,
                        mod(animatedAngle / (2.0 * 3.14159), 1.0)
                    );
                    
                    // เพิ่มแถบแสงเพื่อความสมจริง
                    float stripes = 0.5 + 0.5 * sin((normalizedDist * 20.0) + time + angle * 2.0);
                    
                    // อ่านสีจาก texture
                    vec4 diskColor = texture2D(diskTexture, animatedUv);
                    
                    // เพิ่มความสว่างใกล้ศูนย์กลาง (เพราะวัตถุร้อนขึ้นเมื่อเข้าใกล้หลุมดำ)
                    float innerGlow = 1.0 / (normalizedDist + 0.1);
                    diskColor.rgb *= mix(3.0, 1.0, normalizedDist);
                    
                    // เพิ่มแถบแสงและความสว่าง
                    diskColor.rgb += stripes * vec3(0.1, 0.05, 0.0);
                    
                    // เพิ่มความไม่สม่ำเสมอจาก noise
                    float turbulence = noise(vec2(
                        normalizedDist * 5.0, 
                        angle * 3.0 + time * 0.1
                    )) * 0.3;
                    
                    diskColor.rgb *= (1.0 + turbulence);
                    
                    // ปรับความโปร่งใสตามตำแหน่ง - จางลงที่ขอบนอก
                    float outerFade = 1.0 - smoothstep(0.7, 1.0, normalizedDist);
                    diskColor.a *= outerFade;
                    
                    // ทำให้ขอบด้านในสว่างขึ้น
                    float innerBrightness = smoothstep(0.0, 0.1, normalizedDist);
                    diskColor.rgb *= innerBrightness;
                    
                    gl_FragColor = diskColor;
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const diskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
        diskMesh.rotation.x = Math.PI / 2;
        parent.add(diskMesh);
        this.accretionDiskMaterial = diskMaterial;
    }
    
    createRelativisticJets(parent) {
        // Relativistic jets - ลำแสงพลังงานจากขั้วหลุมดำ
        const jetGeometry = new THREE.CylinderGeometry(0.5, 1.5, 30, 32, 10, true);
        const jetMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                intensity: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                float hash(float n) {
                    return fract(sin(n) * 43758.5453);
                }
                
                float noise(vec2 p) {
                    vec2 ip = floor(p);
                    vec2 u = fract(p);
                    u = u * u * (3.0 - 2.0 * u);
                    
                    float res = mix(
                        mix(hash(dot(ip, vec2(1.0, 157.0))), 
                            hash(dot(ip + vec2(1.0, 0.0), vec2(1.0, 157.0))), u.x),
                        mix(hash(dot(ip + vec2(0.0, 1.0), vec2(1.0, 157.0))), 
                            hash(dot(ip + vec2(1.0, 1.0), vec2(1.0, 157.0))), u.x), 
                        u.y);
                    return res * res;
                }
                
                void main() {
                    // ความโปร่งใสลดลงตามความสูง - จางลงเมื่อไกลจากศูนย์กลาง
                    float opacity = (1.0 - vUv.y) * 0.7 * intensity;
                    
                    // เพิ่มความแตกต่างด้วย noise
                    float distortion = noise(vec2(vUv.x * 5.0, vUv.y * 20.0 + time)) * 0.2;
                    
                    // เพิ่มการเคลื่อนไหวคลื่นพลังงานที่เคลื่อนที่ขึ้น
                    float wave = sin(vUv.y * 30.0 - time * 3.0) * 0.5 + 0.5;
                    
                    // สีสำหรับลำแสงด้านบน - สีฟ้าขาว
                    vec3 topColor = mix(vec3(0.5, 0.8, 1.0), vec3(1.0), vUv.y);
                    
                    // สีสำหรับลำแสงด้านล่าง - สีแดงส้ม
                    vec3 bottomColor = mix(vec3(1.0, 0.6, 0.1), vec3(1.0, 0.3, 0.1), vUv.y);
                    
                    // เลือกสีตามตำแหน่ง
                    vec3 color = (vPosition.y > 0.0) ? topColor : bottomColor;
                    
                    // ปรับความสว่างตามคลื่น
                    color *= 0.8 + wave * 0.5;
                    
                    // เพิ่มความผันผวนจาก noise
                    color += vec3(distortion) * 0.1;
                    
                    // ปรับความโปร่งใสตามหลายปัจจัย
                    gl_FragColor = vec4(color, opacity * (0.5 + wave * 0.5));
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // ลำแสงด้านบน
        const topJet = new THREE.Mesh(jetGeometry, jetMaterial);
        topJet.position.y = 15;
        parent.add(topJet);
        
        // ลำแสงด้านล่าง
        const bottomJet = new THREE.Mesh(jetGeometry, jetMaterial);
        bottomJet.position.y = -15;
        bottomJet.rotation.x = Math.PI;
        parent.add(bottomJet);
        
        this.jetMaterial = jetMaterial;
    }
    
    createGravitationalLensing(parent) {
        // Gravitational lensing - การบิดเบือนแสงโดยแรงโน้มถ่วง
        const lensGeometry = new THREE.SphereGeometry(20, 128, 128);
        const lensMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                lensIntensity: { value: 1.0 },
                starTexture: { value: this.textures.starField }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float lensIntensity;
                uniform sampler2D starTexture;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                
                #define PI 3.14159265359
                
                // ฟังก์ชันสำหรับคำนวณการบิดเบือนแสง
                vec2 lensDistortion(vec2 uv, float strength) {
                    vec2 centeredUV = uv * 2.0 - 1.0;
                    float distanceFromCenter = length(centeredUV);
                    
                    // สมการที่ใช้คล้ายกับในภาพยนตร์ Interstellar
                    float distortionFactor = 1.0 / (1.0 + exp(-(distanceFromCenter - 0.5) * 10.0 * strength));
                    
                    // บิดเบือนตาม schwarzschild radius
                    centeredUV *= mix(1.0, 1.0 - 1.0 / (distanceFromCenter + 0.01), distortionFactor * strength);
                    
                    return centeredUV * 0.5 + 0.5;
                }
                
                void main() {
                    // คำนวณทิศทางในการมอง
                    vec3 viewDirection = normalize(vPosition);
                    
                    // คำนวณมุมและ latitude/longitude บนทรงกลม
                    float phi = atan(viewDirection.z, viewDirection.x);
                    float theta = acos(viewDirection.y);
                    
                    // แปลงเป็นพิกัด UV
                    vec2 sphereUV = vec2(phi / (2.0 * PI) + 0.5, theta / PI);
                    
                    // ความแรงของการบิดเบือนเพิ่มขึ้นเมื่อใกล้ศูนย์กลาง
                    float distanceToCenter = length(vPosition.xz);
                    float distortionStrength = 6.0 * lensIntensity / (distanceToCenter + 0.1);
                    
                    // ใช้ฟังก์ชันบิดเบือน
                    vec2 distortedUV = lensDistortion(sphereUV, distortionStrength);
                    
                    // เพิ่มการเคลื่อนไหวเล็กน้อย
                    distortedUV.x = mod(distortedUV.x + time * 0.01, 1.0);
                    
                    // อ่านสีจาก texture ที่ถูกบิดเบือน
                    vec4 starColor = texture2D(starTexture, distortedUV);
                    
                    // ความมืดบริเวณใกล้หลุมดำ
                    float blackholeProximity = smoothstep(0.15, 0.3, distanceToCenter / 20.0);
                    
                    // คำนวณความโปร่งใสตามระยะห่างและทิศทาง
                    float edgeGlow = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1.0))), 8.0);
                    float alpha = min(edgeGlow, blackholeProximity) * 0.6;
                    
                    // สีสุดท้ายของ gravitational lensing
                    gl_FragColor = vec4(starColor.rgb * blackholeProximity, alpha);
                }
            `,
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const lensMesh = new THREE.Mesh(lensGeometry, lensMaterial);
        parent.add(lensMesh);
        this.lensMaterial = lensMaterial;
    }
    
    createLightEffects(parent) {
        // เพิ่มแสงรอบๆ หลุมดำ
        const light1 = new THREE.PointLight(0x3366ff, 2, 20);
        light1.position.set(8, 5, 3);
        parent.add(light1);
        this.light1 = light1;
        
        const light2 = new THREE.PointLight(0xff3300, 1.5, 15);
        light2.position.set(-7, -4, 5);
        parent.add(light2);
        this.light2 = light2;
        
        // เพิ่มเอฟเฟกต์แสงวาบ (flares)
        const flareGeometry = new THREE.PlaneGeometry(2, 2);
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
                    // ระยะห่างจากศูนย์กลาง
                    vec2 center = vUv - 0.5;
                    float dist = length(center);
                    
                    // ความเข้มลดลงตามระยะห่าง
                    float intensity = 1.0 - smoothstep(0.0, 0.5, dist);
                    
                    // เพิ่มการกระพริบ
                    float flicker = 0.8 + 0.2 * sin(time * 10.0);
                    
                    // สีน้ำเงินอมขาว
                    vec3 color = mix(vec3(0.3, 0.4, 1.0), vec3(1.0), intensity);
                    
                    // ปรับความโปร่งใส
                    float alpha = intensity * flicker * 0.7;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const flare1 = new THREE.Mesh(flareGeometry, flareMaterial);
        flare1.position.set(8, 5, 3);
        flare1.lookAt(0, 0, 0);
        parent.add(flare1);
        
        const flare2 = new THREE.Mesh(flareGeometry, flareMaterial);
        flare2.position.set(-7, -4, 5);
        flare2.lookAt(0, 0, 0);
        parent.add(flare2);
        
        this.flareMaterial = flareMaterial;
    }
    
    // เพิ่มความเข้มข้นของ gravitational lensing เมื่อคลิก
    intensifyGravitationalLensing() {
        if (this.lensMaterial && this.lensMaterial.uniforms) {
            // บันทึกค่าปัจจุบัน
            const currentIntensity = this.lensMaterial.uniforms.lensIntensity.value;
            
            // เพิ่มค่าความเข้มข้น
            gsap.to(this.lensMaterial.uniforms.lensIntensity, {
                value: currentIntensity * 3.0,
                duration: 1.5,
                ease: "elastic.out(1, 0.5)",
                onComplete: () => {
                    // กลับสู่ค่าปกติ
                    gsap.to(this.lensMaterial.uniforms.lensIntensity, {
                        value: currentIntensity,
                        duration: 3,
                        ease: "power2.inOut"
                    });
                }
            });
            
            // เพิ่มความเข้มของ photon sphere
            if (this.photonSphereMaterial && this.photonSphereMaterial.uniforms) {
                const currentPhIntensity = this.photonSphereMaterial.uniforms.intensity.value;
                
                gsap.to(this.photonSphereMaterial.uniforms.intensity, {
                    value: currentPhIntensity * 2.5,
                    duration: 1.2,
                    ease: "expo.out",
                    onComplete: () => {
                        gsap.to(this.photonSphereMaterial.uniforms.intensity, {
                            value: currentPhIntensity,
                            duration: 2.5,
                            ease: "power2.out"
                        });
                    }
                });
            }
            
            // เพิ่มความเข้มของ jets
            if (this.jetMaterial && this.jetMaterial.uniforms) {
                const currentJetIntensity = this.jetMaterial.uniforms.intensity.value;
                
                gsap.to(this.jetMaterial.uniforms.intensity, {
                    value: currentJetIntensity * 2.0,
                    duration: 1,
                    ease: "power3.out",
                    onComplete: () => {
                        gsap.to(this.jetMaterial.uniforms.intensity, {
                            value: currentJetIntensity,
                            duration: 2,
                            ease: "power2.inOut"
                        });
                    }
                });
            }
            
            // สร้างเอฟเฟกต์ time dilation
            this.createTimeDilationEffect();
        }
    }
    
    // เอฟเฟกต์ยืดเวลาแบบ Interstellar
    createTimeDilationEffect() {
        // สร้างวงแหวนแสงที่เคลื่อนที่ออกจากหลุมดำ
        const ringGeometry = new THREE.RingGeometry(4, 4.2, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        this.blackHoleGroup.add(ring);
        
        // สร้างเอฟเฟกต์ DOM overlay
        const dilationOverlay = document.createElement('div');
        dilationOverlay.className = 'time-dilation-overlay';
        document.body.appendChild(dilationOverlay);
        
        // แอนิเมชันวงแหวน
        gsap.to(ring.scale, {
            x: 20,
            y: 20,
            z: 1,
            duration: 2.5,
            ease: "power1.out"
        });
        
        gsap.to(ringMaterial, {
            opacity: 0,
            duration: 2.5,
            ease: "power1.out",
            onComplete: () => {
                this.blackHoleGroup.remove(ring);
                ring.geometry.dispose();
                ringMaterial.dispose();
            }
        });
        
        // แอนิเมชัน DOM overlay
        gsap.to(dilationOverlay, {
            opacity: 0.7,
            duration: 0.5,
            ease: "power1.in",
            onComplete: () => {
                // เอฟเฟกต์เบลอและบิดเบือน
                gsap.to(dilationOverlay, {
                    opacity: 0,
                    duration: 2,
                    ease: "power3.out",
                    onComplete: () => {
                        dilationOverlay.remove();
                    }
                });
            }
        });
    }
    
    update(time) {
        // อัปเดต shader uniforms
        if (this.photonSphereMaterial && this.photonSphereMaterial.uniforms) {
            this.photonSphereMaterial.uniforms.time.value = time;
        }
        
        if (this.accretionDiskMaterial && this.accretionDiskMaterial.uniforms) {
            this.accretionDiskMaterial.uniforms.time.value = time;
        }
        
        if (this.jetMaterial && this.jetMaterial.uniforms) {
            this.jetMaterial.uniforms.time.value = time;
        }
        
        if (this.lensMaterial && this.lensMaterial.uniforms) {
            this.lensMaterial.uniforms.time.value = time;
        }
        
        if (this.flareMaterial && this.flareMaterial.uniforms) {
            this.flareMaterial.uniforms.time.value = time;
        }
        
        // หมุนหลุมดำช้าๆ
        if (this.blackHoleGroup) {
            this.blackHoleGroup.rotation.y += 0.0005;
        }
        
        // เพิ่มการกระพริบของแสง
        if (this.light1) {
            this.light1.intensity = 2 + Math.sin(time * 1.5) * 0.3;
        }
        
        if (this.light2) {
            this.light2.intensity = 1.5 + Math.sin(time * 2.3) * 0.2;
        }
    }
}