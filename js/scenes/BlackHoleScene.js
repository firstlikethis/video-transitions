/**
 * BlackHoleScene.js
 * สร้างฉากหลุมดำที่สมจริงแบบ Interstellar โดยใช้เทคนิคการ render ขั้นสูง
 * จำลองผลกระทบเชิงแสงเช่น gravitational lensing และ accretion disk
 */
class BlackHoleScene extends BaseScene {
    /**
     * สร้างฉากหลุมดำ
     * @param {THREE.Scene} scene - Scene หลักของแอพพลิเคชัน
     * @param {Object} textures - เก็บเท็กซ์เจอร์ทั้งหมด
     * @param {Object} materials - เก็บวัสดุที่สร้างจากเท็กซ์เจอร์
     */
    constructor(scene, textures, materials) {
        super(scene, textures, materials);
    }
    
    /**
     * ตั้งค่าเริ่มต้นของฉากหลุมดำ
     */
    setup() {
        // สร้างหลุมดำ
        this.createBlackHole();
        
        // สร้างจานสะสมมวล (Accretion Disk)
        this.createAccretionDisk();
        
        // สร้างเอฟเฟกต์บิดเบือนแสง (Gravitational Lensing)
        this.createGravitationalLensing();
        
        // สร้างแสงจากด้านหลังหลุมดำ (photon ring)
        this.createPhotonRing();
        
        // สร้างฝุ่นและดาวรอบๆ
        this.createSpaceDust();
        
        // สร้างเอฟเฟกต์การชะลอเวลา (time dilation)
        this.createTimeDilationEffect();
        
        // บันทึกค่าเริ่มต้นสำหรับการหมุน
        this.initialRotation = this.group.rotation.clone();
    }
    
    /**
     * สร้างหลุมดำ (event horizon)
     */
    createBlackHole() {
        // สร้างทรงกลมสีดำสำหรับขอบฟ้าเหตุการณ์ (event horizon)
        const horizonGeometry = new THREE.SphereGeometry(4, 64, 64);
        const horizonMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.FrontSide
        });
        
        this.blackHole = new THREE.Mesh(horizonGeometry, horizonMaterial);
        this.group.add(this.blackHole);
        
        // สร้างผลกระทบแสงรอบๆ ขอบ (light absorption effect)
        const absorptionGeometry = new THREE.SphereGeometry(4.1, 64, 64);
        
        // สร้าง custom shader material สำหรับการดูดกลืนแสง
        const absorptionMaterial = this.createShaderMaterial(
            {
                time: { value: 0 },
                blackHoleCenter: { value: new THREE.Vector3(0, 0, 0) }
            },
            // vertex shader
            `
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                vPosition = position;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
            // fragment shader
            `
            uniform float time;
            uniform vec3 blackHoleCenter;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                // คำนวณค่าความเข้มของความมืดโดยขึ้นอยู่กับระยะทางจากขอบ
                float intensity = 1.0 - pow(length(vPosition) - 4.0, 2.0) * 2.0;
                intensity = clamp(intensity, 0.0, 1.0);
                
                // เพิ่มความมืดบริเวณขอบ
                float edge = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
                intensity *= edge;
                
                // สร้างจุดที่มองเห็นความมืดมากขึ้นที่เคลื่อนที่ช้าๆ
                float pattern = sin(vPosition.x * 10.0 + time * 0.5) * sin(vPosition.y * 10.0 + time * 0.3) * sin(vPosition.z * 10.0 + time * 0.7);
                intensity += pattern * 0.1;
                
                gl_FragColor = vec4(vec3(0.0), intensity);
            }
            `,
            {
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false
            }
        );
        
        const absorption = new THREE.Mesh(absorptionGeometry, absorptionMaterial);
        this.group.add(absorption);
        this.blackHoleAbsorption = absorption;
        this.absorptionMaterial = absorptionMaterial;
    }
    
    /**
     * สร้างจานสะสมมวล (Accretion Disk)
     */
    createAccretionDisk() {
        // สร้างจานแบบวงแหวนสำหรับ accretion disk
        const diskGeometry = new THREE.RingGeometry(6, 15, 128, 10);
        
        // สร้าง custom shader material สำหรับ accretion disk
        const diskMaterial = this.createShaderMaterial(
            {
                time: { value: 0 },
                diskColor1: { value: new THREE.Color(0xff2200) }, // สีส้มแดง
                diskColor2: { value: new THREE.Color(0xffaa00) }, // สีส้มเหลือง
                diskColor3: { value: new THREE.Color(0x0088ff) }  // สีฟ้า
            },
            // vertex shader
            `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
            // fragment shader
            `
            uniform float time;
            uniform vec3 diskColor1;
            uniform vec3 diskColor2;
            uniform vec3 diskColor3;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            // ฟังก์ชันสำหรับสร้าง noise
            float noise(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            float pattern(vec2 p, float time) {
                vec2 q = vec2(
                    noise(p + vec2(0.0, 0.0) + time * 0.1),
                    noise(p + vec2(5.2, 1.3) + time * 0.2)
                );
                
                vec2 r = vec2(
                    noise(p + 4.0 * q + vec2(1.7, 9.2) + time * 0.1),
                    noise(p + 4.0 * q + vec2(8.3, 2.8) + time * 0.2)
                );
                
                return noise(p + 4.0 * r + time * 0.1);
            }
            
            void main() {
                // คำนวณมุมและระยะห่างจากศูนย์กลาง
                float angle = atan(vPosition.z, vPosition.x);
                float dist = length(vPosition.xz);
                
                // สร้างลวดลายที่หมุนตามเวลา
                float offset = sin(10.0 * angle + time * 0.5 + dist * 0.2) * 0.2;
                
                // เพิ่มรายละเอียดด้วย fractal noise
                float detail = pattern(vec2(angle * 3.0, dist * 0.5) + time * 0.05, time);
                float flame = pattern(vec2(angle * 2.0, dist * 0.7) - time * 0.03, time);
                
                // รวมทุกเอฟเฟกต์
                float intensity = detail * 0.6 + flame * 0.4 + offset;
                
                // ปรับความสว่างตามระยะห่าง (สว่างมากขึ้นที่ใกล้หลุมดำ)
                float brightness = mix(1.0, 0.2, (dist - 6.0) / 9.0);
                intensity *= brightness;
                
                // กำหนดสีตามความเข้มและระยะห่าง
                vec3 color;
                if (dist < 8.0) {
                    color = mix(diskColor1, diskColor2, sin(dist + time * 0.2) * 0.5 + 0.5);
                } else {
                    color = mix(diskColor2, diskColor3, (dist - 8.0) / 7.0);
                }
                
                // เพิ่มความสว่างแบบ speckle
                float speckle = pow(noise(vec2(angle * 20.0, dist * 10.0) + time), 5.0) * 5.0;
                intensity += speckle;
                
                // กำหนดความโปร่งใสให้ลดลงที่ขอบนอกและขอบใน
                float alpha = sin((dist - 6.0) / 9.0 * 3.14159) * intensity;
                alpha = clamp(alpha, 0.0, 1.0);
                
                gl_FragColor = vec4(color * intensity, alpha);
            }
            `,
            {
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            }
        );
        
        const disk = new THREE.Mesh(diskGeometry, diskMaterial);
        disk.rotation.x = Math.PI / 2; // วางในแนวนอน
        this.group.add(disk);
        this.accretionDisk = disk;
        this.diskMaterial = diskMaterial;
        
        // เพิ่มจานด้านใน
        const innerDiskGeometry = new THREE.RingGeometry(4.2, 6, 64, 4);
        const innerDiskMaterial = this.createShaderMaterial(
            {
                time: { value: 0 },
                innerColor: { value: new THREE.Color(0xffffff) }
            },
            // vertex shader
            `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
            // fragment shader
            `
            uniform float time;
            uniform vec3 innerColor;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                // คำนวณระยะห่างจากศูนย์กลาง
                float dist = length(vPosition.xz);
                float angle = atan(vPosition.z, vPosition.x);
                
                // สร้างลวดลายที่หมุนเร็วกว่า
                float pattern = sin(20.0 * angle + time * 2.0 + dist * 0.5) * 0.5 + 0.5;
                
                // ความเข้มเพิ่มขึ้นเมื่อเข้าใกล้หลุมดำ
                float intensity = (1.0 - (dist - 4.2) / 1.8) * pattern * 3.0;
                
                // ความโปร่งใสลดลงที่ขอบ
                float alpha = sin((dist - 4.2) / 1.8 * 3.14159) * intensity;
                alpha = clamp(alpha, 0.0, 1.0);
                
                // สีขาวร้อนจัด
                gl_FragColor = vec4(innerColor * intensity, alpha);
            }
            `,
            {
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            }
        );
        
        const innerDisk = new THREE.Mesh(innerDiskGeometry, innerDiskMaterial);
        innerDisk.rotation.x = Math.PI / 2; // วางในแนวนอน
        this.group.add(innerDisk);
        this.innerDisk = innerDisk;
        this.innerDiskMaterial = innerDiskMaterial;
        
        // เพิ่มแสงที่ศูนย์กลาง
        const light = new THREE.PointLight(0xffa500, 2, 20);
        light.position.set(0, 0, 0);
        this.group.add(light);
        this.diskLight = light;
    }
    
    /**
     * สร้างเอฟเฟกต์แหวนโฟตอน (Photon Ring)
     */
    createPhotonRing() {
        // สร้างวงแหวนแสงรอบๆ หลุมดำ
        const photonRingGeometry = new THREE.RingGeometry(4.05, 4.2, 128, 1);
        const photonRingMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        
        const photonRing = new THREE.Mesh(photonRingGeometry, photonRingMaterial);
        photonRing.rotation.x = Math.PI / 2;
        this.group.add(photonRing);
        this.photonRing = photonRing;
    }
    
    /**
     * สร้างเอฟเฟกต์การบิดเบือนแสง (Gravitational Lensing)
     */
    createGravitationalLensing() {
        // สร้างทรงกลมขนาดใหญ่ที่จะแสดงผลการบิดเบือนดาวฤกษ์รอบๆ
        const lensingGeometry = new THREE.SphereGeometry(40, 64, 64);
        
        // กำหนดเท็กซ์เจอร์ท้องฟ้าดาว ถ้าไม่มีให้สร้างเอง
        let starTexture;
        if (this.textures && this.textures.starField) {
            starTexture = this.textures.starField;
        } else {
            starTexture = this.createStarFieldTexture();
        }
        
        // สร้าง custom shader material สำหรับเอฟเฟกต์การบิดเบือน
        const lensingMaterial = this.createShaderMaterial(
            {
                time: { value: 0 },
                lensIntensity: { value: 1.0 },
                starTexture: { value: starTexture },
                blackHolePosition: { value: new THREE.Vector3(0, 0, 0) }
            },
            // vertex shader
            `
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
            // fragment shader
            `
            uniform float time;
            uniform float lensIntensity;
            uniform sampler2D starTexture;
            uniform vec3 blackHolePosition;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            #define PI 3.14159265359
            
            // ฟังก์ชันสำหรับการบิดเบือนแสง
            vec2 lensDistortion(vec2 uv, float strength) {
                vec2 centeredUV = uv * 2.0 - 1.0;
                float distanceFromCenter = length(centeredUV);
                
                // สูตรอิงจากฟิสิกส์การบิดเบือนแสงโดยแรงโน้มถ่วง
                float distortionFactor = 1.0 / (1.0 + exp(-(distanceFromCenter - 0.5) * 10.0 * strength));
                
                // บิดเบือนตามรัศมี Schwarzschild โดยประมาณ
                centeredUV *= mix(1.0, 1.0 - 1.0 / (distanceFromCenter + 0.01), distortionFactor * strength);
                
                return centeredUV * 0.5 + 0.5;
            }
            
            void main() {
                // คำนวณทิศทางการมอง
                vec3 viewDirection = normalize(vPosition);
                
                // คำนวณพิกัดทรงกลม
                float phi = atan(viewDirection.z, viewDirection.x);
                float theta = acos(viewDirection.y);
                
                // แปลงเป็นพิกัด UV
                vec2 sphereUV = vec2(phi / (2.0 * PI) + 0.5, theta / PI);
                
                // คำนวณระยะห่างจากหลุมดำและปรับความแรงของการบิดเบือน
                vec3 dirToBlackHole = blackHolePosition - vPosition;
                float distanceToBlackHole = length(dirToBlackHole);
                vec3 normalizedDir = normalize(dirToBlackHole);
                float dotProduct = dot(viewDirection, normalizedDir);
                
                // ความแรงของการบิดเบือนเพิ่มขึ้นเมื่อทิศทางใกล้หลุมดำ
                float angleFactor = pow(max(0.0, dotProduct), 6.0);
                float distanceFactor = 100.0 / (distanceToBlackHole * distanceToBlackHole);
                float distortionStrength = lensIntensity * angleFactor * distanceFactor;
                
                // ใช้ฟังก์ชันบิดเบือน
                vec2 distortedUV = lensDistortion(sphereUV, distortionStrength);
                
                // เพิ่มการเคลื่อนไหวเล็กน้อยตามเวลา
                distortedUV.x = mod(distortedUV.x + time * 0.01, 1.0);
                
                // อ่านเท็กซ์เจอร์ดาวด้วยพิกัดที่บิดเบือน
                vec4 starColor = texture2D(starTexture, distortedUV);
                
                // ความมืดเพิ่มขึ้นเมื่อใกล้หลุมดำ
                float blackholeProximity = smoothstep(0.05, 0.3, 1.0 - angleFactor);
                
                // คำนวณความโปร่งใสสุดท้าย
                float edgeGlow = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1.0))), 8.0);
                float alpha = min(edgeGlow, blackholeProximity) * 0.8;
                
                // สีสุดท้าย
                gl_FragColor = vec4(starColor.rgb * blackholeProximity, starColor.a);
            }
            `,
            {
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false
            }
        );
        
        const lensingMesh = new THREE.Mesh(lensingGeometry, lensingMaterial);
        this.group.add(lensingMesh);
        this.lensingMesh = lensingMesh;
        this.lensingMaterial = lensingMaterial;
    }
    
    /**
     * สร้างเท็กซ์เจอร์ท้องฟ้าดาวแบบกำหนดเอง
     * @returns {THREE.Texture} เท็กซ์เจอร์ท้องฟ้าดาว
     */
    createStarFieldTexture() {
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
            
            // สีแตกต่างกัน
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
        
        // เพิ่มกลุ่มดาวและเนบิวลาในบางบริเวณ
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = 50 + Math.random() * 100;
            
            // สร้าง gradient สีสำหรับเนบิวลา
            const nebulaColors = [
                'rgba(255, 100, 100, 0.1)',
                'rgba(100, 100, 255, 0.1)',
                'rgba(100, 255, 100, 0.1)',
                'rgba(255, 100, 255, 0.1)',
                'rgba(255, 255, 100, 0.1)'
            ];
            
            const color = nebulaColors[i % nebulaColors.length];
            const gradient = ctx.createRadialGradient(
                x, y, 0, x, y, radius
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // เพิ่มดาวในเนบิวลา
            for (let j = 0; j < 50; j++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * radius;
                const starX = x + Math.cos(angle) * distance;
                const starY = y + Math.sin(angle) * distance;
                const starRadius = Math.random() * 2 + 1;
                
                ctx.beginPath();
                ctx.arc(starX, starY, starRadius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fill();
            }
        }
        
        // สร้าง texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        
        return texture;
    }
    
    /**
     * สร้างฝุ่นอวกาศรอบๆ หลุมดำ
     */
    createSpaceDust() {
        // จำนวนอนุภาค
        const baseCount = CONSTANTS.BASE_PARTICLE_COUNTS.BLACK_HOLE.spacetimeParticles;
        const particleCount = Math.floor(baseCount * this.particleMultiplier);
        
        // สร้าง geometry
        const dustGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // รัศมีของทรงกลมที่จะสร้างอนุภาค (รอบๆ หลุมดำ)
        const radius = 30;
        
        // สร้างอนุภาคในรูปทรงกลม
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // สุ่มตำแหน่งในทรงกลม
            let x, y, z;
            
            // หลีกเลี่ยงการสร้างอนุภาคใกล้หลุมดำมากเกินไป
            do {
                const phi = Math.random() * Math.PI * 2;
                const theta = Math.acos(2 * Math.random() - 1);
                const r = Math.pow(Math.random(), 0.3) * radius; // กระจายมากขึ้นที่ขอบนอก
                
                x = r * Math.sin(theta) * Math.cos(phi);
                y = r * Math.sin(theta) * Math.sin(phi);
                z = r * Math.cos(theta);
            } while (Math.sqrt(x*x + y*y + z*z) < 8); // ไม่ให้อยู่ใกล้หลุมดำเกินไป
            
            // บันทึกตำแหน่ง
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
            
            // กำหนดสีขึ้นกับระยะห่าง
            const distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
            const brightness = 0.3 + 0.7 * (distanceFromCenter / radius);
            
            // สีอ้างอิงจากระยะห่าง
            if (distanceFromCenter < 15) {
                // สีแดงส้มใกล้หลุมดำ
                colors[i3] = brightness;
                colors[i3 + 1] = brightness * 0.5;
                colors[i3 + 2] = brightness * 0.2;
            } else {
                // สีฟ้าอมขาวไกลออกไป
                colors[i3] = brightness * 0.6;
                colors[i3 + 1] = brightness * 0.8;
                colors[i3 + 2] = brightness;
            }
            
            // ขนาดอนุภาค - เล็กลงตามระยะห่าง
            sizes[i] = 0.1 + 0.3 * (1 - distanceFromCenter / radius);
        }
        
        // กำหนดค่าให้กับ geometry
        dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        dustGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        dustGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // สร้าง material สำหรับอนุภาค
        const dustMaterial = new THREE.PointsMaterial({
            size: 0.2,
            transparent: true,
            opacity: 0.6,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // ใช้เท็กซ์เจอร์ถ้ามี
        if (this.textures && this.textures.particle) {
            dustMaterial.map = this.textures.particle;
        }
        
        // สร้างระบบอนุภาค
        const dust = new THREE.Points(dustGeometry, dustMaterial);
        this.group.add(dust);
        this.spaceDust = dust;
        this.particles.push(dust);
        
        // เก็บข้อมูลเพิ่มเติมสำหรับแอนิเมชัน
        this.dustPositions = positions.slice();
        this.dustVelocities = new Array(particleCount * 3).fill(0);
        
        // กำหนดความเร็วเริ่มต้นของอนุภาค (โคจรรอบหลุมดำ)
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const x = positions[i3];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];
            
            // คำนวณระยะทางจากศูนย์กลาง
            const distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
            
            // สร้างความเร็วในการโคจรรอบหลุมดำ
            // ความเร็วจะมากขึ้นเมื่อใกล้หลุมดำ ตามกฎของเคปเลอร์
            const velocity = 0.05 * Math.sqrt(50 / distanceFromCenter);
            
            // สร้างเวกเตอร์ความเร็วที่ตั้งฉากกับเวกเตอร์ตำแหน่ง
            // ใช้การสร้างเวกเตอร์ที่ตั้งฉากในระนาบ XZ
            const vx = -z * velocity;
            const vz = x * velocity;
            
            // อนุภาคใกล้จานสะสมมวลจะโคจรในระนาบเดียวกับจาน
            if (Math.abs(y) < 5 && distanceFromCenter < 20) {
                this.dustVelocities[i3] = vx;
                this.dustVelocities[i3 + 1] = 0; // ไม่มีความเร็วแนวแกน Y
                this.dustVelocities[i3 + 2] = vz;
            } else {
                // อนุภาคอื่นๆ จะมีการโคจรแบบ 3 มิติ
                const vy = (x*x + z*z > 0) ? (-x * z * velocity / Math.sqrt(x*x + z*z)) : 0;
                this.dustVelocities[i3] = vx;
                this.dustVelocities[i3 + 1] = vy;
                this.dustVelocities[i3 + 2] = vz;
            }
        }
    }
    
    /**
     * สร้างเอฟเฟกต์การชะลอเวลา
     */
    createTimeDilationEffect() {
        // ใช้เฉพาะเมื่อต้องการแสดงเอฟเฟกต์นี้
        this.timeDilation = new TimeDilationEffect();
    }
    
    /**
     * จัดการการคลิกในฉากหลุมดำ
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
        
        // ตรวจสอบการชนกับหลุมดำ
        const intersectsBlackHole = raycaster.intersectObject(this.blackHole, true);
        
        if (intersectsBlackHole.length > 0) {
            // คลิกที่หลุมดำ - สร้างเอฟเฟกต์บิดเบือนเวลา
            this.createBlackHoleClickEffect(intersectsBlackHole[0].point);
        } else {
            // ตรวจสอบการชนกับจานสะสมมวล
            const intersectsDisk = raycaster.intersectObject(this.accretionDisk, true);
            
            if (intersectsDisk.length > 0) {
                // คลิกที่จานสะสมมวล - สร้างเอฟเฟกต์ลำแสง
                this.createDiskClickEffect(intersectsDisk[0].point);
            } else {
                // คลิกที่อื่น - สร้างเอฟเฟกต์ดาวตก
                this.createSpaceClickEffect(mouse);
            }
        }
    }
    
    /**
     * สร้างเอฟเฟกต์เมื่อคลิกที่หลุมดำ
     * @param {THREE.Vector3} position - ตำแหน่งที่คลิก
     */
    createBlackHoleClickEffect(position) {
        // สร้างเอฟเฟกต์การบิดเบือนเวลา
        if (this.timeDilation) {
            this.timeDilation.create(this.scene, position);
        }
        
        // สร้างแสงวาบสั้นๆ
        const flash = new THREE.PointLight(0xffffff, 10, 30);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // จางหายไปอย่างรวดเร็ว
        gsap.to(flash, {
            intensity: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => {
                this.scene.remove(flash);
            }
        });
        
        // เพิ่มความสว่างของขอบฟ้าเหตุการณ์ชั่วคราว
        if (this.photonRing) {
            const originalOpacity = this.photonRing.material.opacity;
            gsap.to(this.photonRing.material, {
                opacity: 1,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    gsap.to(this.photonRing.material, {
                        opacity: originalOpacity,
                        duration: 1.5,
                        ease: "power2.out"
                    });
                }
            });
        }
        
        // สั่นกล้องเล็กน้อย
        const camera = sceneManager.camera;
        const originalPosition = camera.position.clone();
        const shakeIntensity = 0.1;
        let elapsedTime = 0;
        
        const shakeInterval = setInterval(() => {
            const deltaTime = 0.016; // ~60fps
            elapsedTime += deltaTime;
            
            // ลดความเข้มข้นเมื่อเวลาผ่านไป
            const fadeOut = 1 - (elapsedTime / 1.0);
            const intensity = shakeIntensity * fadeOut;
            
            // สั่นกล้องแบบสุ่ม
            camera.position.x = originalPosition.x + (Math.random() - 0.5) * intensity;
            camera.position.y = originalPosition.y + (Math.random() - 0.5) * intensity;
            
            // หยุดการสั่นเมื่อถึงเวลากำหนด
            if (elapsedTime >= 1.0) {
                clearInterval(shakeInterval);
                
                // กลับสู่ตำแหน่งเดิม
                gsap.to(camera.position, {
                    x: originalPosition.x,
                    y: originalPosition.y,
                    duration: 0.5,
                    ease: "power2.out"
                });
            }
        }, 16);
        
        // เล่นเสียงเอฟเฟกต์
        if (audioManager && audioManager.enabled) {
            audioManager.playEffect('blackhole');
        }
    }
    
    /**
     * สร้างเอฟเฟกต์เมื่อคลิกที่จานสะสมมวล
     * @param {THREE.Vector3} position - ตำแหน่งที่คลิก
     */
    createDiskClickEffect(position) {
        // สร้างลำแสงที่พุ่งออกจากจุดที่คลิก
        const jetDirection = new THREE.Vector3().subVectors(position, new THREE.Vector3(0, 0, 0)).normalize();
        const jetLength = 10;
        const jetStart = position.clone();
        const jetEnd = position.clone().add(jetDirection.multiplyScalar(jetLength));
        
        // สร้างเส้นลำแสง
        const jetGeometry = new THREE.BufferGeometry().setFromPoints([jetStart, jetEnd]);
        const jetMaterial = new THREE.LineBasicMaterial({
            color: 0xffa500,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });
        
        const jet = new THREE.Line(jetGeometry, jetMaterial);
        this.group.add(jet);
        
        // สร้างแสงที่จุดเริ่มต้น
        const jetLight = new THREE.PointLight(0xffa500, 5, 10);
        jetLight.position.copy(jetStart);
        this.group.add(jetLight);
        
        // สร้างอนุภาคที่ลำแสง
        const jetParticleCount = 50;
        const jetParticleGeometry = new THREE.BufferGeometry();
        const jetParticlePositions = new Float32Array(jetParticleCount * 3);
        const jetParticleSizes = new Float32Array(jetParticleCount);
        
        // สร้างอนุภาคตามแนวลำแสง
        for (let i = 0; i < jetParticleCount; i++) {
            const i3 = i * 3;
            const t = Math.random();
            const pos = new THREE.Vector3().lerpVectors(jetStart, jetEnd, t);
            
            // เพิ่มการสุ่มตำแหน่งเล็กน้อย
            pos.x += (Math.random() - 0.5) * t * 0.5;
            pos.y += (Math.random() - 0.5) * t * 0.5;
            pos.z += (Math.random() - 0.5) * t * 0.5;
            
            jetParticlePositions[i3] = pos.x;
            jetParticlePositions[i3 + 1] = pos.y;
            jetParticlePositions[i3 + 2] = pos.z;
            
            // อนุภาคเล็กลงเมื่อห่างออกไป
            jetParticleSizes[i] = 0.2 + (1.0 - t) * 0.3;
        }
        
        jetParticleGeometry.setAttribute('position', new THREE.BufferAttribute(jetParticlePositions, 3));
        jetParticleGeometry.setAttribute('size', new THREE.BufferAttribute(jetParticleSizes, 1));
        
        const jetParticleMaterial = new THREE.PointsMaterial({
            color: 0xffa500,
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const jetParticles = new THREE.Points(jetParticleGeometry, jetParticleMaterial);
        this.group.add(jetParticles);
        
        // แอนิเมชันลำแสง
        gsap.to(jetMaterial, {
            opacity: 0,
            duration: 1.0,
            ease: "power1.out"
        });
        
        gsap.to(jetLight, {
            intensity: 0,
            duration: 1.0,
            ease: "power1.out"
        });
        
        gsap.to(jetParticleMaterial, {
            opacity: 0,
            duration: 1.0,
            ease: "power1.out",
            onComplete: () => {
                // ลบทุกอย่าง
                this.group.remove(jet);
                this.group.remove(jetLight);
                this.group.remove(jetParticles);
                
                // ล้างทรัพยากร
                jetGeometry.dispose();
                jetMaterial.dispose();
                jetParticleGeometry.dispose();
                jetParticleMaterial.dispose();
            }
        });
        
        // เพิ่มการรบกวนในจานสะสมมวลเล็กน้อย
        if (this.diskMaterial && this.diskMaterial.uniforms) {
            const currentTime = this.diskMaterial.uniforms.time.value;
            this.diskMaterial.uniforms.time.value = currentTime + 1.0;
        }
        
        // เล่นเสียงเอฟเฟกต์
        if (audioManager && audioManager.enabled) {
            audioManager.playEffect('celestial');
        }
    }
    
    /**
     * สร้างเอฟเฟกต์เมื่อคลิกในอวกาศ
     * @param {THREE.Vector2} mouse - ตำแหน่งเมาส์แบบ normalized
     */
    createSpaceClickEffect(mouse) {
        // สร้างเส้นทางของดาวที่ถูกดูดเข้าหลุมดำ
        const ray = new THREE.Ray();
        ray.origin.setFromMatrixPosition(sceneManager.camera.matrixWorld);
        ray.direction.set(mouse.x, mouse.y, 0.5).unproject(sceneManager.camera).sub(ray.origin).normalize();
        
        // คำนวณจุดพบกับทรงกลมขนาดใหญ่
        const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 25);
        const intersection = new THREE.Vector3();
        ray.intersectSphere(sphere, intersection);
        
        // สร้างเส้นทางโค้งเข้าหาหลุมดำ
        const curvePoints = [];
        const startPoint = intersection.clone();
        const endPoint = new THREE.Vector3(0, 0, 0);
        
        // สร้างจุดควบคุมสำหรับเส้นโค้ง
        const controlPoint1 = startPoint.clone().multiplyScalar(0.7);
        const controlPoint2 = startPoint.clone().multiplyScalar(0.3);
        
        // สร้างเส้นโค้ง Bezier
        const curve = new THREE.CubicBezierCurve3(
            startPoint,
            controlPoint1,
            controlPoint2,
            endPoint
        );
        
        // สร้างเส้นทางจากเส้นโค้ง
        const points = curve.getPoints(50);
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // สร้าง material ที่ค่อยๆ จางหายเข้าหาหลุมดำ
        const pathMaterial = new THREE.LineDashedMaterial({
            color: 0xffffff,
            scale: 1,
            dashSize: 1,
            gapSize: 0.5,
            transparent: true,
            opacity: 0.6
        });
        
        const path = new THREE.Line(pathGeometry, pathMaterial);
        path.computeLineDistances(); // สำหรับเส้นประ
        this.group.add(path);
        
        // สร้างวัตถุที่ถูกดูดเข้าหลุมดำ (ดาวเคราะห์เล็กๆ)
        const objectGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const objectMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1
        });
        
        const fallingObject = new THREE.Mesh(objectGeometry, objectMaterial);
        fallingObject.position.copy(startPoint);
        this.group.add(fallingObject);
        
        // แอนิเมชันการตกลงหลุมดำ
        gsap.to(fallingObject.position, {
            x: 0,
            y: 0,
            z: 0,
            duration: 3,
            ease: "power2.in",
            onUpdate: () => {
                // คำนวณขนาดที่เล็กลงเมื่อเข้าใกล้
                const distanceToCenter = fallingObject.position.length();
                const scale = Math.max(0.1, distanceToCenter / startPoint.length());
                
                fallingObject.scale.set(scale, scale, scale);
                
                // เพิ่มความเร็วการหมุนเมื่อเข้าใกล้
                fallingObject.rotation.x += 0.01 / scale;
                fallingObject.rotation.y += 0.01 / scale;
                
                // เพิ่มความโปร่งใสเมื่อเข้าใกล้
                if (distanceToCenter < 5) {
                    objectMaterial.opacity = distanceToCenter / 5;
                }
            },
            onComplete: () => {
                // ลบเส้นทางและวัตถุ
                this.group.remove(path);
                this.group.remove(fallingObject);
                
                // ล้างทรัพยากร
                pathGeometry.dispose();
                pathMaterial.dispose();
                objectGeometry.dispose();
                objectMaterial.dispose();
            }
        });
        
        // สร้างเอฟเฟกต์แสงวาบเมื่อวัตถุหายเข้าหลุมดำ
        setTimeout(() => {
            const flash = new THREE.PointLight(0xffffff, 5, 15);
            flash.position.set(0, 0, 0);
            this.group.add(flash);
            
            gsap.to(flash, {
                intensity: 0,
                duration: 0.5,
                ease: "power1.out",
                onComplete: () => {
                    this.group.remove(flash);
                }
            });
            
            // เอฟเฟกต์กระเพื่อมในจานสะสมมวล
            if (this.diskMaterial && this.diskMaterial.uniforms) {
                const currentTime = this.diskMaterial.uniforms.time.value;
                this.diskMaterial.uniforms.time.value = currentTime + 0.5;
            }
        }, 2800); // ใกล้จบแอนิเมชัน
        
        // เล่นเสียงเอฟเฟกต์
        if (audioManager && audioManager.enabled) {
            audioManager.playEffect('celestial');
        }
    }
    
    /**
     * คำนวณแรงโน้มถ่วงจากหลุมดำ
     * @param {THREE.Vector3} position - ตำแหน่งของอนุภาค
     * @returns {THREE.Vector3} แรงโน้มถ่วง
     */
    calculateGravity(position) {
        // คำนวณทิศทางไปยังหลุมดำ
        const direction = new THREE.Vector3(0, 0, 0).sub(position).normalize();
        
        // คำนวณระยะห่างจากหลุมดำ
        const distance = position.length();
        
        // คำนวณความแรงของแรงโน้มถ่วงตามกฎของนิวตัน (F = G * m1 * m2 / r^2)
        // สเกลให้เหมาะกับขนาดฉาก
        const gravityStrength = 0.5 / (distance * distance);
        
        // คำนวณแรงโน้มถ่วง
        return direction.multiplyScalar(gravityStrength);
    }
    
    /**
     * อัปเดตการเคลื่อนที่ของอนุภาคตามแรงโน้มถ่วง
     * @param {number} deltaTime - เวลาที่ผ่านไป (วินาที)
     */
    updateParticlePhysics(deltaTime) {
        if (!this.spaceDust || !this.dustPositions || !this.dustVelocities) return;
        
        const positions = this.spaceDust.geometry.attributes.position.array;
        const particleCount = positions.length / 3;
        
        // อัปเดตตำแหน่งและความเร็วของแต่ละอนุภาค
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // ตำแหน่งปัจจุบัน
            const position = new THREE.Vector3(
                positions[i3],
                positions[i3 + 1],
                positions[i3 + 2]
            );
            
            // ความเร็วปัจจุบัน
            const velocity = new THREE.Vector3(
                this.dustVelocities[i3],
                this.dustVelocities[i3 + 1],
                this.dustVelocities[i3 + 2]
            );
            
            // คำนวณแรงโน้มถ่วง
            const gravity = this.calculateGravity(position);
            
            // อัปเดตความเร็ว
            velocity.add(gravity.multiplyScalar(deltaTime));
            
            // อัปเดตตำแหน่ง
            position.add(velocity.clone().multiplyScalar(deltaTime));
            
            // ตรวจสอบว่าอนุภาคถูกดูดเข้าหลุมดำหรือไม่
            if (position.length() < 4) {
                // รีเซ็ตอนุภาคไปที่ตำแหน่งใหม่ห่างออกไป
                const phi = Math.random() * Math.PI * 2;
                const cosTheta = 2 * Math.random() - 1;
                const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
                const r = 30; // ระยะห่างใหม่
                
                position.set(
                    r * sinTheta * Math.cos(phi),
                    r * sinTheta * Math.sin(phi),
                    r * cosTheta
                );
                
                // รีเซ็ตความเร็วให้โคจรรอบหลุมดำ
                const orbitSpeed = 0.05 * Math.sqrt(50 / r);
                
                velocity.set(
                    -position.z * orbitSpeed,
                    (Math.random() - 0.5) * 0.02,
                    position.x * orbitSpeed
                );
            }
            
            // บันทึกค่าใหม่
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
            
            this.dustVelocities[i3] = velocity.x;
            this.dustVelocities[i3 + 1] = velocity.y;
            this.dustVelocities[i3 + 2] = velocity.z;
        }
        
        // แจ้ง Three.js ว่าตำแหน่งเปลี่ยนแปลง
        this.spaceDust.geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * อัปเดตฉากหลุมดำ
     * @param {number} time - เวลาที่ผ่านไป (วินาที)
     */
    update(time) {
        // อัปเดตการหมุนของจานสะสมมวลช้าๆ
        if (this.accretionDisk) {
            this.accretionDisk.rotation.z += 0.001;
        }
        
        if (this.innerDisk) {
            this.innerDisk.rotation.z += 0.002;
        }
        
        // อัปเดตเอฟเฟกต์จานสะสมมวล
        if (this.diskMaterial && this.diskMaterial.uniforms) {
            this.diskMaterial.uniforms.time.value = time;
        }
        
        if (this.innerDiskMaterial && this.innerDiskMaterial.uniforms) {
            this.innerDiskMaterial.uniforms.time.value = time;
        }
        
        // อัปเดตเอฟเฟกต์การดูดกลืนแสง
        if (this.absorptionMaterial && this.absorptionMaterial.uniforms) {
            this.absorptionMaterial.uniforms.time.value = time;
        }
        
        // อัปเดตเอฟเฟกต์การบิดเบือนแสง
        if (this.lensingMaterial && this.lensingMaterial.uniforms) {
            this.lensingMaterial.uniforms.time.value = time;
            
            // ตำแหน่งกล้องสำหรับการบิดเบือนแสง
            this.lensingMaterial.uniforms.blackHolePosition.value = this.group.position;
        }
        
        // อัปเดตความเข้มแสง
        if (this.diskLight) {
            this.diskLight.intensity = 2 + Math.sin(time * 0.5) * 0.3;
        }
        
        // อัปเดตการเคลื่อนที่ของอนุภาคตามแรงโน้มถ่วง
        this.updateParticlePhysics(0.016); // ที่ 60fps
        
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
        
        // ลบอนุภาคเดิม
        if (this.spaceDust) {
            this.group.remove(this.spaceDust);
            
            // ลบออกจากรายการอนุภาค
            const index = this.particles.indexOf(this.spaceDust);
            if (index !== -1) {
                this.particles.splice(index, 1);
            }
            
            this.spaceDust.geometry.dispose();
            this.spaceDust.material.dispose();
            this.spaceDust = null;
        }
        
        // สร้างอนุภาคใหม่ตามตัวคูณ
        this.createSpaceDust();
    }
    
    /**
     * รีเซ็ตฉากกลับสู่สถานะเริ่มต้น
     */
    reset() {
        super.reset();
        
        // รีเซ็ตการหมุนของจานสะสมมวล
        if (this.accretionDisk) {
            this.accretionDisk.rotation.z = 0;
        }
        
        if (this.innerDisk) {
            this.innerDisk.rotation.z = 0;
        }
    }
}