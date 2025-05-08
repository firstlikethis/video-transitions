/**
 * GalaxyScene.js
 * สร้างฉากกาแล็กซี่ที่สมจริงพร้อมเอฟเฟกต์แสงและอนุภาค
 */
class GalaxyScene extends BaseScene {
    /**
     * สร้างฉากกาแล็กซี่
     * @param {THREE.Scene} scene - Scene หลักของแอพพลิเคชัน
     * @param {Object} textures - เก็บเท็กซ์เจอร์ทั้งหมด
     * @param {Object} materials - เก็บวัสดุที่สร้างจากเท็กซ์เจอร์
     */
    constructor(scene, textures, materials) {
        super(scene, textures, materials);
    }
    
    /**
     * ตั้งค่าเริ่มต้นของฉากกาแล็กซี่
     */
    setup() {
        // สร้างกาแล็กซี่หลัก
        this.createGalaxy();
        
        // สร้างแกนกลางกาแล็กซี่
        this.createGalaxyCore();
        
        // สร้างเนบิวลา
        this.createNebulae();
        
        // สร้างดาวฤกษ์พิเศษ
        this.createSpecialStars();
        
        // สร้างฝุ่นดาว
        this.createGalacticDust();
        
        // เพิ่มแสงกาแล็กซี่
        this.createGalacticLights();
        
        // บันทึกค่าเริ่มต้นสำหรับการหมุน
        this.initialRotation = new THREE.Euler(Math.PI / 4, 0, 0);
        
        // กำหนดการหมุนเริ่มต้น (เอียงให้มองจากด้านบนเล็กน้อย)
        this.group.rotation.copy(this.initialRotation);
    }
    
    /**
     * สร้างกาแล็กซี่หลัก
     */
    createGalaxy() {
        // จำนวนอนุภาคพื้นฐาน
        const baseCount = CONSTANTS.BASE_PARTICLE_COUNTS.GALAXY.starParticles;
        const particleCount = Math.floor(baseCount * this.particleMultiplier);
        
        // สร้างกลุ่มอนุภาคกาแล็กซี่
        this.galaxyParticles = new THREE.Group();
        
        // สร้าง geometry สำหรับอนุภาค
        const galaxyGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // กำหนดค่าสำหรับรูปทรงกาแล็กซี่
        const arms = 5; // จำนวนแขนกาแล็กซี่
        const armWidth = 0.5; // ความกว้างของแขน
        const armLength = 8; // ความยาวของแขน
        const spiralFactor = 0.6; // ความเข้มของการบิดเป็นเกลียว
        
        // กำหนดสี
        const colorInside = new THREE.Color(CONSTANTS.COLORS.GALAXY.core);
        const colorOutside = new THREE.Color(CONSTANTS.COLORS.GALAXY.arms);
        
        // สร้างอนุภาคตามรูปแบบกาแล็กซี่ทรงเกลียว
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // กระจายอนุภาคในแขนกาแล็กซี่
            const arm = Math.floor(Math.random() * arms);
            const angle = (arm / arms) * Math.PI * 2;
            
            // ระยะห่างจากแกนกลาง
            let distance;
            
            // แบ่งอนุภาคบางส่วนไว้ที่แกนกลาง
            if (Math.random() < 0.1) {
                // อนุภาคที่แกนกลาง (10%)
                distance = Math.random() * 1.0;
            } else {
                // อนุภาคในแขนกาแล็กซี่ (90%)
                distance = 1.0 + Math.random() * (armLength - 1.0);
            }
            
            // คำนวณมุมสุดท้ายตามระยะทางและการบิดเกลียว
            const finalAngle = angle + distance * spiralFactor;
            
            // คำนวณตำแหน่ง
            const x = Math.cos(finalAngle) * distance;
            const z = Math.sin(finalAngle) * distance;
            
            // เพิ่มความหนาแบบแปรผันตามระยะทาง
            const thickness = (1.0 - Math.min(1.0, distance / armLength)) * 0.5 + 0.1;
            const y = (Math.random() - 0.5) * armWidth * distance * 0.3 * thickness;
            
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
            
            // กำหนดสีตามระยะห่างจากแกนกลาง
            const mixRatio = Math.min(1.0, distance / armLength);
            const color = new THREE.Color().lerpColors(colorInside, colorOutside, mixRatio);
            
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // กำหนดขนาดอนุภาค (ดาวใกล้กลางใหญ่กว่า)
            const centralFactor = 1.0 - Math.min(1.0, distance / (armLength * 0.5));
            const baseSize = Math.random() * 0.1 + 0.05;
            const sizeFactor = baseSize * (1.0 + centralFactor * 2.0);
            sizes[i] = sizeFactor;
        }
        
        // กำหนดค่าให้กับ geometry
        galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        galaxyGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // สร้าง material สำหรับอนุภาค
        const galaxyMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // ใช้เท็กซ์เจอร์ถ้ามี
        if (this.textures && this.textures.galaxyParticle) {
            galaxyMaterial.map = this.textures.galaxyParticle;
        }
        
        // สร้างระบบอนุภาค
        const galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial);
        this.galaxyParticles.add(galaxyPoints);
        
        // เพิ่มกลุ่มอนุภาคลงในฉาก
        this.group.add(this.galaxyParticles);
        this.particles.push(galaxyPoints);
    }
    
    /**
     * สร้างแกนกลางกาแล็กซี่
     */
    createGalaxyCore() {
        // สร้างแกนกลางเรืองแสง
        const coreGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        
        // สร้าง shader material สำหรับแกนกลาง
        const coreMaterial = this.createShaderMaterial(
            {
                time: { value: 0 },
                coreColor: { value: new THREE.Color(CONSTANTS.COLORS.GALAXY.core) }
            },
            // vertex shader
            `
            varying vec2 vUv;
            varying vec3 vNormal;
            
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
            // fragment shader
            `
            uniform float time;
            uniform vec3 coreColor;
            varying vec2 vUv;
            varying vec3 vNormal;
            
            // ฟังก์ชัน noise
            float noise(vec2 p) {
                return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            void main() {
                // คำนวณความเข้มแสงตามมุมมอง
                float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                
                // เพิ่มลายบนพื้นผิวแกนกลาง
                float grain = noise(vUv * 100.0 + time);
                float fluctuation = sin(time * 0.5 + vUv.x * 10.0) * 0.1 + 0.9;
                
                // สีไล่ระดับ
                vec3 color = mix(coreColor, vec3(1.0, 0.8, 1.0), intensity * 0.5) * fluctuation;
                
                // เพิ่มความสว่างที่ขอบ
                float rim = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1.0))), 3.0) * 0.5;
                color += vec3(1.0, 0.8, 1.0) * rim;
                
                // ความโปร่งใสเพิ่มขึ้นตามขอบ
                float alpha = intensity + rim + 0.4;
                
                gl_FragColor = vec4(color, alpha);
            }
            `,
            {
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.FrontSide
            }
        );
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.group.add(core);
        this.galaxyCore = core;
        this.coreMaterial = coreMaterial;
        
        // เพิ่ม glow รอบแกนกลาง
        const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const glowMaterial = this.createShaderMaterial(
            {
                glowColor: { value: new THREE.Color(CONSTANTS.COLORS.GALAXY.core) }
            },
            CONSTANTS.SHADERS.GLOW_VERTEX,
            CONSTANTS.SHADERS.GLOW_FRAGMENT,
            {
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false
            }
        );
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.group.add(glow);
    }
    
    /**
     * สร้างเนบิวลา
     */
    createNebulae() {
        // สร้างกลุ่มเนบิวลา
        this.nebulae = new THREE.Group();
        
        // สร้างเนบิวลาหลายแห่งรอบกาแล็กซี่
        const nebulaCount = 3;
        
        for (let i = 0; i < nebulaCount; i++) {
            // ตำแหน่งในกาแล็กซี่
            const distance = 3 + Math.random() * 4; // ห่างจากศูนย์กลาง
            const angle = Math.random() * Math.PI * 2;
            
            const position = new THREE.Vector3(
                Math.cos(angle) * distance,
                (Math.random() - 0.5) * 0.5,
                Math.sin(angle) * distance
            );
            
            // ขนาดเนบิวลา
            const size = 0.8 + Math.random() * 1.2;
            
            // สีเนบิวลาแตกต่างกันไป
            const nebulaMaterials = [
                // สีม่วงแดง
                new THREE.Color(CONSTANTS.COLORS.GALAXY.nebula),
                // สีฟ้าอมม่วง
                new THREE.Color(0x4455ff),
                // สีเขียวอมฟ้า
                new THREE.Color(0x00ffaa)
            ];
            
            const color = nebulaMaterials[i % nebulaMaterials.length];
            
            // สร้างเนบิวลา
            this.createNebula(position, size, color, i);
        }
        
        this.group.add(this.nebulae);
    }
    
    /**
     * สร้างเนบิวลาแต่ละแห่ง
     * @param {THREE.Vector3} position - ตำแหน่ง
     * @param {number} size - ขนาด
     * @param {THREE.Color} color - สี
     * @param {number} index - ลำดับ
     */
    createNebula(position, size, color, index) {
        // จำนวนอนุภาค
        const baseCount = 500;
        const particleCount = Math.floor(baseCount * this.particleMultiplier);
        
        // สร้าง geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // กำหนดรูปทรงของเนบิวลา
        let shape;
        
        // เนบิวลาหลายรูปแบบตามลำดับ
        if (index % 3 === 0) {
            // เนบิวลารูปวงรี
            shape = (t) => {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random();
                const x = Math.cos(angle) * radius * 1.5;
                const y = (Math.random() - 0.5) * 0.5;
                const z = Math.sin(angle) * radius;
                return new THREE.Vector3(x, y, z);
            };
        } else if (index % 3 === 1) {
            // เนบิวลารูปก้อนเมฆ
            shape = (t) => {
                // สร้างรูปร่างคล้ายก้อนเมฆ
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const radius = Math.pow(Math.random(), 0.3); // ให้มีความหนาแน่นสูงตรงกลาง
                
                const x = radius * Math.sin(phi) * Math.cos(theta) * 1.5;
                const y = radius * Math.sin(phi) * Math.sin(theta) * 0.5;
                const z = radius * Math.cos(phi);
                
                return new THREE.Vector3(x, y, z);
            };
        } else {
            // เนบิวลารูปหางยาว
            shape = (t) => {
                const length = 2.0;
                const width = 0.7;
                
                // ให้มีรูปร่างคล้ายหาง
                const x = (Math.random() - 0.5) * width;
                const y = (Math.random() - 0.5) * width * 0.5;
                const z = Math.random() * length;
                
                return new THREE.Vector3(x, y, z);
            };
        }
        
        // สร้างอนุภาคเนบิวลา
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // สร้างตำแหน่งตามรูปทรง
            const point = shape(i / particleCount);
            
            // ปรับขนาดและตำแหน่ง
            point.multiplyScalar(size);
            point.add(position);
            
            positions[i3] = point.x;
            positions[i3 + 1] = point.y;
            positions[i3 + 2] = point.z;
            
            // กำหนดสีและความโปร่งใส
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // กำหนดขนาดอนุภาค (กระจายแบบสุ่ม)
            sizes[i] = Math.random() * 0.15 + 0.05;
        }
        
        // กำหนดค่าให้กับ geometry
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // สร้าง material
        const material = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.7,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // ใช้เท็กซ์เจอร์ถ้ามี
        if (this.textures && this.textures.galaxyParticle) {
            material.map = this.textures.galaxyParticle;
        }
        
        // สร้างเนบิวลา
        const nebula = new THREE.Points(geometry, material);
        
        // เก็บข้อมูลเพิ่มเติมสำหรับแอนิเมชัน
        nebula.userData = {
            initialPosition: position.clone(),
            phase: Math.random() * Math.PI * 2,
            speed: 0.1 + Math.random() * 0.2
        };
        
        this.nebulae.add(nebula);
        this.particles.push(nebula);
    }
    
    /**
     * สร้างดาวฤกษ์พิเศษ
     */
    createSpecialStars() {
        // สร้างดาวฤกษ์พิเศษเช่นซูเปอร์โนวา ดาวนิวตรอน ฯลฯ
        const specialStarCount = 5;
        
        for (let i = 0; i < specialStarCount; i++) {
            // ตำแหน่งในกาแล็กซี่
            const distance = 2 + Math.random() * 5;
            const angle = Math.random() * Math.PI * 2;
            
            const position = new THREE.Vector3(
                Math.cos(angle) * distance,
                (Math.random() - 0.5) * 0.5,
                Math.sin(angle) * distance
            );
            
            // สีดาวฤกษ์พิเศษ
            const colors = [
                0x00ffff, // สีฟ้าอมเขียว (ดาวนิวตรอน)
                0xffaa00, // สีส้ม (ดาวยักษ์แดง)
                0xaaaaff, // สีฟ้าอ่อน (ดาวขาวแคระ)
                0xff00ff, // สีม่วงแดง (ดาวแปลก)
                0xffff00  // สีเหลือง (ซูเปอร์โนวา)
            ];
            
            const color = colors[i % colors.length];
            const size = 0.15 + Math.random() * 0.15;
            
            // สร้างดาวฤกษ์
            this.createSpecialStar(position, size, color, i);
        }
    }
    
    /**
     * สร้างดาวฤกษ์พิเศษแต่ละดวง
     * @param {THREE.Vector3} position - ตำแหน่ง
     * @param {number} size - ขนาด
     * @param {number} color - สี
     * @param {number} index - ลำดับ
     */
    createSpecialStar(position, size, color, index) {
        // สร้างดาวฤกษ์
        const starGeometry = new THREE.SphereGeometry(size, 16, 16);
        const starMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.copy(position);
        
        // สร้างแสงเรือง
        const light = new THREE.PointLight(color, 2, 3);
        light.position.copy(position);
        
        // เก็บข้อมูลเพิ่มเติมสำหรับแอนิเมชัน
        star.userData = {
            initialPosition: position.clone(),
            phase: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 0.5,
            light: light
        };
        
        this.group.add(star);
        this.group.add(light);
        
        // เพิ่ม glow รอบดาว
        const glowSize = size * 3;
        const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
        const glowMaterial = this.createShaderMaterial(
            {
                glowColor: { value: new THREE.Color(color) }
            },
            CONSTANTS.SHADERS.GLOW_VERTEX,
            CONSTANTS.SHADERS.GLOW_FRAGMENT,
            {
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false
            }
        );
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(position);
        this.group.add(glow);
        
        // กำหนดชนิดดาวตามลำดับ
        let starType;
        
        if (index % 5 === 0) {
            starType = 'neutron'; // ดาวนิวตรอน
        } else if (index % 5 === 1) {
            starType = 'red_giant'; // ดาวยักษ์แดง
        } else if (index % 5 === 2) {
            starType = 'white_dwarf'; // ดาวขาวแคระ
        } else if (index % 5 === 3) {
            starType = 'strange'; // ดาวแปลก
        } else {
            starType = 'supernova'; // ซูเปอร์โนวา
        }
        
        // เพิ่มไว้ในรายการ
        if (!this.specialStars) {
            this.specialStars = [];
        }
        
        this.specialStars.push({
            star: star,
            glow: glow,
            light: light,
            type: starType
        });
    }
    
    /**
     * สร้างฝุ่นดาว
     */
    createGalacticDust() {
        // จำนวนอนุภาค
        const baseCount = CONSTANTS.BASE_PARTICLE_COUNTS.GALAXY.dustParticles;
        const particleCount = Math.floor(baseCount * this.particleMultiplier);
        
        // สร้าง geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // กำหนดค่าสำหรับรูปทรงกาแล็กซี่
        const arms = 5;
        const armLength = 8;
        const spiralFactor = 0.6;
        
        // กำหนดสี
        const dustColor = new THREE.Color(CONSTANTS.COLORS.GALAXY.dust);
        
        // สร้างอนุภาค
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // กระจายอนุภาคในแขนกาแล็กซี่
            const arm = Math.floor(Math.random() * arms);
            const angle = (arm / arms) * Math.PI * 2;
            const distance = 1.0 + Math.random() * (armLength - 1.0);
            
            // คำนวณมุมสุดท้ายตามระยะทางและการบิดเกลียว
            const finalAngle = angle + distance * spiralFactor;
            
            // คำนวณตำแหน่ง
            const x = Math.cos(finalAngle) * distance;
            const z = Math.sin(finalAngle) * distance;
            
            // ฝุ่นจะอยู่ในระนาบที่หนากว่าอนุภาคดาว
            const y = (Math.random() - 0.5) * 0.8;
            
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
            
            // สีฝุ่น
            const brightness = 0.3 + Math.random() * 0.4;
            colors[i3] = dustColor.r * brightness;
            colors[i3 + 1] = dustColor.g * brightness;
            colors[i3 + 2] = dustColor.b * brightness;
            
            // ขนาดอนุภาค
            sizes[i] = Math.random() * 0.05 + 0.02;
        }
        
        // กำหนดค่าให้กับ geometry
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // สร้าง material
        const material = new THREE.PointsMaterial({
            size: 0.05,
            transparent: true,
            opacity: 0.5,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // ใช้เท็กซ์เจอร์ถ้ามี
        if (this.textures && this.textures.galaxyParticle) {
            material.map = this.textures.galaxyParticle;
        }
        
        // สร้างระบบอนุภาค
        const dust = new THREE.Points(geometry, material);
        this.group.add(dust);
        this.galacticDust = dust;
        this.particles.push(dust);
    }
    
    /**
     * สร้างแสงกาแล็กซี่
     */
    createGalacticLights() {
        // แสงกลางกาแล็กซี่
        const coreLight = new THREE.PointLight(CONSTANTS.COLORS.GALAXY.core, 2, 10);
        coreLight.position.set(0, 0, 0);
        this.group.add(coreLight);
        this.coreLight = coreLight;
        
        // แสงสีฟ้าจากด้านบน
        const blueLight = new THREE.PointLight(0x0066ff, 1.5, 15);
        blueLight.position.set(0, 5, 0);
        this.group.add(blueLight);
        this.blueLight = blueLight;
        
        // แสงสีม่วงจากด้านล่าง
        const purpleLight = new THREE.PointLight(0xaa00ff, 1, 15);
        purpleLight.position.set(0, -5, 0);
        this.group.add(purpleLight);
        this.purpleLight = purpleLight;
    }
    
    /**
     * จัดการการคลิกในฉากกาแล็กซี่
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
        
        // ตรวจสอบการชนกับดาวฤกษ์พิเศษ
        let hitSpecialStar = false;
        
        if (this.specialStars) {
            for (let i = 0; i < this.specialStars.length; i++) {
                const starObj = this.specialStars[i];
                const intersects = raycaster.intersectObject(starObj.star);
                
                if (intersects.length > 0) {
                    // คลิกที่ดาวฤกษ์พิเศษ
                    hitSpecialStar = true;
                    this.createSpecialStarEffect(starObj, intersects[0].point);
                    break;
                }
            }
        }
        
        if (!hitSpecialStar) {
            // คลิกที่อื่น - สร้างเอฟเฟกต์ทั่วไป
            this.createGalacticClickEffect(mouse);
        }
    }
    
    /**
     * สร้างเอฟเฟกต์เมื่อคลิกที่ดาวฤกษ์พิเศษ
     * @param {Object} starObj - ข้อมูลดาวฤกษ์
     * @param {THREE.Vector3} position - ตำแหน่งที่คลิก
     */
    createSpecialStarEffect(starObj, position) {
        // สร้างเอฟเฟกต์ตามประเภทดาว
        switch (starObj.type) {
            case 'neutron':
                // ดาวนิวตรอน - สร้างคลื่นพลังงานกระจายออก
                this.createNeutronStarEffect(starObj, position);
                break;
                
            case 'red_giant':
                // ดาวยักษ์แดง - สร้างการระเบิดของไฮโดรเจน
                this.createRedGiantEffect(starObj, position);
                break;
                
            case 'white_dwarf':
                // ดาวขาวแคระ - สร้างแสงสว่างจ้า
                this.createWhiteDwarfEffect(starObj, position);
                break;
                
            case 'strange':
                // ดาวแปลก - สร้างเอฟเฟกต์หลอมรวมสสาร
                this.createStrangeStarEffect(starObj, position);
                break;
                
            case 'supernova':
                // ซูเปอร์โนวา - สร้างการระเบิดขนาดใหญ่
                this.createSupernovaEffect(starObj, position);
                break;
                
            default:
                // สร้างเอฟเฟกต์ทั่วไป
                this.createGenericStarEffect(starObj, position);
        }
        
        // เล่นเสียงเอฟเฟกต์
        if (audioManager && audioManager.enabled) {
            audioManager.playEffect('celestial');
        }
    }
    
    /**
     * สร้างเอฟเฟกต์ดาวนิวตรอน
     * @param {Object} starObj - ข้อมูลดาวฤกษ์
     * @param {THREE.Vector3} position - ตำแหน่งที่คลิก
     */
    createNeutronStarEffect(starObj, position) {
        // สร้างคลื่นพลังงานกระจายออก
        for (let i = 0; i < 3; i++) {
            // สร้างวงแหวนพลังงาน
            const radius = 0.3 + i * 0.2;
            const ringGeometry = new THREE.RingGeometry(radius, radius + 0.05, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(position);
            ring.lookAt(this.group.position);
            this.group.add(ring);
            
            // แอนิเมชันกระจายออก
            gsap.to(ring.scale, {
                x: 5,
                y: 5,
                z: 1,
                duration: 1.5,
                delay: i * 0.2,
                ease: "power1.out"
            });
            
            gsap.to(ringMaterial, {
                opacity: 0,
                duration: 1.5,
                delay: i * 0.2,
                ease: "power1.out",
                onComplete: () => {
                    if (i === 2) {
                        this.group.remove(ring);
                        ringGeometry.dispose();
                        ringMaterial.dispose();
                    }
                }
            });
        }
        
        // เพิ่มความสว่างให้ดาวและแสงชั่วคราว
        const originalIntensity = starObj.light.intensity;
        gsap.to(starObj.light, {
            intensity: originalIntensity * 3,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                gsap.to(starObj.light, {
                    intensity: originalIntensity,
                    duration: 1.0,
                    ease: "power2.out"
                });
            }
        });
        
        // สร้างอนุภาคกระจายออก
        this.createParticleEffect(position, {
            count: 100,
            color: 0x00ffff,
            size: 0.03,
            duration: 1.5,
            speed: 0.8,
            spread: 0.3
        });
    }
    
    /**
     * สร้างเอฟเฟกต์ดาวยักษ์แดง
     * @param {Object} starObj - ข้อมูลดาวฤกษ์
     * @param {THREE.Vector3} position - ตำแหน่งที่คลิก
     */
    createRedGiantEffect(starObj, position) {
        // สร้างการระเบิดของไฮโดรเจน
        
        // เพิ่มขนาดดาวชั่วคราว
        const originalScale = starObj.star.scale.clone();
        gsap.to(starObj.star.scale, {
            x: originalScale.x * 1.5,
            y: originalScale.y * 1.5,
            z: originalScale.z * 1.5,
            duration: 0.5,
            ease: "elastic.out(1, 0.3)",
            onComplete: () => {
                gsap.to(starObj.star.scale, {
                    x: originalScale.x,
                    y: originalScale.y,
                    z: originalScale.z,
                    duration: 0.8,
                    ease: "bounce.out"
                });
            }
        });
        
        // เพิ่มความสว่างให้ดาวและแสงชั่วคราว
        const originalIntensity = starObj.light.intensity;
        gsap.to(starObj.light, {
            intensity: originalIntensity * 2.5,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
                gsap.to(starObj.light, {
                    intensity: originalIntensity,
                    duration: 1.0,
                    ease: "power2.out"
                });
            }
        });
        
        // สร้างอนุภาคกระจายออก
        this.createParticleEffect(position, {
            count: 150,
            color: 0xffaa00,
            size: 0.05,
            duration: 2.0,
            speed: 0.5,
            spread: 0.5
        });
    }
    
    /**
     * สร้างเอฟเฟกต์ดาวขาวแคระ
     * @param {Object} starObj - ข้อมูลดาวฤกษ์
     * @param {THREE.Vector3} position - ตำแหน่งที่คลิก
     */
    createWhiteDwarfEffect(starObj, position) {
        // สร้างแสงสว่างจ้า
        
        // แฟลชแสงสว่างจ้า
        const flashGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.group.add(flash);
        
        // แอนิเมชันแฟลช
        gsap.to(flash.scale, {
            x: 8,
            y: 8,
            z: 8,
            duration: 0.8,
            ease: "expo.out"
        });
        
        gsap.to(flashMaterial, {
            opacity: 0,
            duration: 0.8,
            ease: "expo.out",
            onComplete: () => {
                this.group.remove(flash);
                flashGeometry.dispose();
                flashMaterial.dispose();
            }
        });
        
        // เพิ่มความสว่างให้ดาวและแสงชั่วคราว
        const originalIntensity = starObj.light.intensity;
        gsap.to(starObj.light, {
            intensity: originalIntensity * 4,
            duration: 0.2,
            ease: "power2.in",
            onComplete: () => {
                gsap.to(starObj.light, {
                    intensity: originalIntensity,
                    duration: 0.8,
                    ease: "power2.out"
                });
            }
        });
        
        // สร้างอนุภาคกระจายออก
        this.createParticleEffect(position, {
            count: 80,
            color: 0xaaaaff,
            size: 0.04,
            duration: 1.2,
            speed: 1.0,
            spread: 0.3
        });
    }
    
    /**
     * สร้างเอฟเฟกต์ดาวแปลก
     * @param {Object} starObj - ข้อมูลดาวฤกษ์
     * @param {THREE.Vector3} position - ตำแหน่งที่คลิก
     */
    createStrangeStarEffect(starObj, position) {
        // สร้างเอฟเฟกต์หลอมรวมสสาร
        
        // สร้างเส้นพลังงานดึงดูดเข้าหาดาว
        const lineCount = 8;
        const lines = [];
        
        for (let i = 0; i < lineCount; i++) {
            // สร้างจุดเริ่มต้นรอบๆ ดาว
            const angle = (i / lineCount) * Math.PI * 2;
            const radius = 2.5;
            
            const startPoint = new THREE.Vector3(
                position.x + Math.cos(angle) * radius,
                position.y + (Math.random() - 0.5) * 0.5,
                position.z + Math.sin(angle) * radius
            );
            
            // สร้างเส้นพลังงาน
            const points = [];
            points.push(startPoint);
            
            // สร้างจุดระหว่างทาง (เส้นโค้ง)
            const midPoints = 5;
            for (let j = 1; j < midPoints; j++) {
                const t = j / midPoints;
                const randomOffset = 0.2 * (1 - t); // ความสุ่มลดลงเมื่อใกล้ปลายทาง
                
                const point = new THREE.Vector3(
                    startPoint.x * (1 - t) + position.x * t + (Math.random() - 0.5) * randomOffset,
                    startPoint.y * (1 - t) + position.y * t + (Math.random() - 0.5) * randomOffset,
                    startPoint.z * (1 - t) + position.z * t + (Math.random() - 0.5) * randomOffset
                );
                
                points.push(point);
            }
            
            // เพิ่มจุดปลายทาง (ดาว)
            points.push(position.clone());
            
            // สร้างเส้น
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0xff00ff,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending
            });
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.group.add(line);
            lines.push({ line, material: lineMaterial });
        }
        
        // แอนิเมชันเส้นพลังงาน (จางหายไป)
        gsap.to({}, {
            duration: 1.5,
            onComplete: () => {
                lines.forEach(({ line, material }) => {
                    this.group.remove(line);
                    line.geometry.dispose();
                    material.dispose();
                });
            }
        });
        
        // เพิ่มความสว่างให้ดาวและแสงชั่วคราว
        const originalIntensity = starObj.light.intensity;
        gsap.to(starObj.light, {
            intensity: originalIntensity * 3,
            duration: 0.8,
            ease: "power2.in",
            onComplete: () => {
                gsap.to(starObj.light, {
                    intensity: originalIntensity,
                    duration: 1.0,
                    ease: "power2.out"
                });
            }
        });
        
        // สร้างอนุภาคดึงดูดเข้าหาดาว
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.5 + Math.random();
            
            const particlePosition = new THREE.Vector3(
                position.x + Math.cos(angle) * radius,
                position.y + (Math.random() - 0.5) * 0.5,
                position.z + Math.sin(angle) * radius
            );
            
            // สร้างอนุภาคที่เคลื่อนที่เข้าหาดาว
            const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xff00ff,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(particlePosition);
            this.group.add(particle);
            
            // แอนิเมชันเคลื่อนที่เข้าหาดาว
            gsap.to(particle.position, {
                x: position.x,
                y: position.y,
                z: position.z,
                duration: 1.0,
                ease: "power2.in",
                delay: i * 0.1,
                onComplete: () => {
                    this.group.remove(particle);
                    particleGeometry.dispose();
                    particleMaterial.dispose();
                }
            });
        }
    }
    
    /**
     * สร้างเอฟเฟกต์ซูเปอร์โนวา
     * @param {Object} starObj - ข้อมูลดาวฤกษ์
     * @param {THREE.Vector3} position - ตำแหน่งที่คลิก
     */
    createSupernovaEffect(starObj, position) {
        // สร้างการระเบิดขนาดใหญ่
        
        // สร้างแฟลชแสงสว่างจ้า
        const flashGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.group.add(flash);
        
        // แอนิเมชันแฟลช
        gsap.to(flash.scale, {
            x: 15,
            y: 15,
            z: 15,
            duration: 1.5,
            ease: "expo.out"
        });
        
        gsap.to(flashMaterial, {
            opacity: 0,
            duration: 1.5,
            ease: "expo.out",
            onComplete: () => {
                this.group.remove(flash);
                flashGeometry.dispose();
                flashMaterial.dispose();
            }
        });
        
        // สร้างคลื่นกระแทก
        for (let i = 0; i < 3; i++) {
            const ringDelay = i * 0.3;
            
            // สร้างวงแหวนคลื่นกระแทก
            const ringGeometry = new THREE.RingGeometry(0.5, 0.7, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(position);
            ring.lookAt(this.group.position);
            this.group.add(ring);
            
            // แอนิเมชันวงแหวนขยายออก
            gsap.to(ring.scale, {
                x: 20,
                y: 20,
                z: 1,
                duration: 2.0,
                delay: ringDelay,
                ease: "power1.out"
            });
            
            gsap.to(ringMaterial, {
                opacity: 0,
                duration: 2.0,
                delay: ringDelay,
                ease: "power1.out",
                onComplete: () => {
                    if (i === 2) {
                        this.group.remove(ring);
                        ringGeometry.dispose();
                        ringMaterial.dispose();
                    }
                }
            });
        }
        
        // เพิ่มความสว่างให้ดาวและแสงชั่วคราว
        const originalIntensity = starObj.light.intensity;
        gsap.to(starObj.light, {
            intensity: originalIntensity * 5,
            duration: 0.3,
            ease: "power3.in",
            onComplete: () => {
                gsap.to(starObj.light, {
                    intensity: originalIntensity * 0.5,
                    duration: 1.5,
                    ease: "power2.out"
                });
            }
        });
        
        // สร้างอนุภาคกระจายออก
        this.createParticleEffect(position, {
            count: 300,
            color: 0xffff00,
            size: 0.1,
            duration: 2.5,
            speed: 2.0,
            spread: 1.0
        });
        
        // สั่นกล้องเล็กน้อย
        const camera = sceneManager.camera;
        const originalPosition = camera.position.clone();
        const shakeIntensity = 0.05;
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
    }
    
    /**
     * สร้างเอฟเฟกต์ดาวทั่วไป
     * @param {Object} starObj - ข้อมูลดาวฤกษ์
     * @param {THREE.Vector3} position - ตำแหน่งที่คลิก
     */
    createGenericStarEffect(starObj, position) {
        // เพิ่มความสว่างให้ดาวและแสงชั่วคราว
        const originalIntensity = starObj.light.intensity;
        gsap.to(starObj.light, {
            intensity: originalIntensity * 2,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
                gsap.to(starObj.light, {
                    intensity: originalIntensity,
                    duration: 1.0,
                    ease: "power2.out"
                });
            }
        });
        
        // สร้างอนุภาคกระจายออก
        this.createParticleEffect(position, {
            count: 100,
            color: starObj.star.material.color.getHex(),
            size: 0.05,
            duration: 1.5,
            speed: 0.5,
            spread: 0.3
        });
    }
    
    /**
     * สร้างเอฟเฟกต์เมื่อคลิกในกาแล็กซี่
     * @param {THREE.Vector2} mouse - ตำแหน่งเมาส์แบบ normalized
     */
    createGalacticClickEffect(mouse) {
        // สร้างตำแหน่งในอวกาศโดยยิงรังสีจากกล้อง
        const ray = new THREE.Ray();
        ray.origin.setFromMatrixPosition(sceneManager.camera.matrixWorld);
        ray.direction.set(mouse.x, mouse.y, 0.5).unproject(sceneManager.camera).sub(ray.origin).normalize();
        
        // คำนวณตำแหน่งในอวกาศ
        const distance = 8; // ระยะห่างจากกล้อง
        const position = new THREE.Vector3();
        position.copy(ray.origin).add(ray.direction.multiplyScalar(distance));
        
        // สร้างฝูงอนุภาคในตำแหน่งที่คลิก
        this.createGalacticSwirl(position);
    }
    
    /**
     * สร้างเอฟเฟกต์การหมุนวนของกาแล็กซี่
     * @param {THREE.Vector3} position - ตำแหน่ง
     */
    createGalacticSwirl(position) {
        // จำนวนอนุภาค
        const particleCount = 100;
        
        // สร้าง geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // สร้างอนุภาคในแถบวงกลม
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 0.5 + Math.random() * 0.5;
            
            positions[i3] = position.x + Math.cos(angle) * radius;
            positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.2;
            positions[i3 + 2] = position.z + Math.sin(angle) * radius;
            
            // สุ่มสีระหว่างสีม่วงและสีฟ้า
            const colorMix = Math.random();
            if (colorMix > 0.7) {
                // สีฟ้า
                colors[i3] = 0.0;
                colors[i3 + 1] = 0.5;
                colors[i3 + 2] = 1.0;
            } else if (colorMix > 0.4) {
                // สีม่วง
                colors[i3] = 0.5;
                colors[i3 + 1] = 0.0;
                colors[i3 + 2] = 1.0;
            } else {
                // สีขาว
                colors[i3] = 1.0;
                colors[i3 + 1] = 1.0;
                colors[i3 + 2] = 1.0;
            }
            
            // ขนาดอนุภาค
            sizes[i] = Math.random() * 0.05 + 0.02;
        }
        
        // กำหนดค่าให้กับ geometry
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // สร้าง material
        const material = new THREE.PointsMaterial({
            size: 0.05,
            transparent: true,
            opacity: 0.7,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // ใช้เท็กซ์เจอร์ถ้ามี
        if (this.textures && this.textures.galaxyParticle) {
            material.map = this.textures.galaxyParticle;
        }
        
        // สร้างระบบอนุภาค
        const swirl = new THREE.Points(geometry, material);
        this.group.add(swirl);
        
        // เพิ่มแสงชั่วคราว
        const light = new THREE.PointLight(0x5500ff, 2, 5);
        light.position.copy(position);
        this.group.add(light);
        
        // แอนิเมชันการหมุน
        let angle = 0;
        const angularSpeed = 0.03;
        
        // เก็บข้อมูลเริ่มต้น
        const initialPositions = new Float32Array(positions.length);
        initialPositions.set(positions);
        
        // ฟังก์ชันอัปเดตการหมุน
        const updateSwirl = () => {
            angle += angularSpeed;
            
            // หมุนอนุภาคตามมุม
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const originalAngle = Math.atan2(
                    initialPositions[i3 + 2] - position.z,
                    initialPositions[i3] - position.x
                );
                
                const originalRadius = Math.sqrt(
                    Math.pow(initialPositions[i3] - position.x, 2) +
                    Math.pow(initialPositions[i3 + 2] - position.z, 2)
                );
                
                // คำนวณตำแหน่งใหม่
                positions[i3] = position.x + Math.cos(originalAngle + angle) * originalRadius;
                positions[i3 + 2] = position.z + Math.sin(originalAngle + angle) * originalRadius;
            }
            
            // แจ้ง Three.js ว่าตำแหน่งอนุภาคเปลี่ยนแปลง
            swirl.geometry.attributes.position.needsUpdate = true;
        };
        
        // เพิ่มเข้าไปในรายการอัปเดต
        this.particleSystems.push(updateSwirl);
        
        // ลดความสว่างของแสงและเอฟเฟกต์หลังจากผ่านไป 2 วินาที
        gsap.to(light, {
            intensity: 0,
            duration: 2,
            ease: "power1.out"
        });
        
        gsap.to(material, {
            opacity: 0,
            duration: 2,
            ease: "power1.out",
            onComplete: () => {
                // ลบออกจากฉาก
                this.group.remove(swirl);
                this.group.remove(light);
                
                // ลบออกจากรายการอัปเดต
                const index = this.particleSystems.indexOf(updateSwirl);
                if (index !== -1) {
                    this.particleSystems.splice(index, 1);
                }
                
                // ล้างทรัพยากร
                geometry.dispose();
                material.dispose();
            }
        });
        
        // เล่นเสียงเอฟเฟกต์
        if (audioManager && audioManager.enabled) {
            audioManager.playEffect('celestial');
        }
    }
    
    /**
     * อัปเดตฉากกาแล็กซี่
     * @param {number} time - เวลาที่ผ่านไป (วินาที)
     */
    update(time) {
        // หมุนกาแล็กซี่
        if (this.galaxyParticles) {
            this.galaxyParticles.rotation.y += 0.0005;
        }
        
        // หมุนฝุ่นดาวช้ากว่าเล็กน้อย
        if (this.galacticDust) {
            this.galacticDust.rotation.y += 0.0003;
        }
        
        // อัปเดตแกนกลางกาแล็กซี่
        if (this.coreMaterial && this.coreMaterial.uniforms) {
            this.coreMaterial.uniforms.time.value = time;
        }
        
        // อัปเดตแสงแกนกลาง
        if (this.coreLight) {
            this.coreLight.intensity = 2 + Math.sin(time * 0.8) * 0.3;
        }
        
        // อัปเดตตำแหน่งเนบิวลา
        if (this.nebulae) {
            this.nebulae.children.forEach(nebula => {
                // ทำให้เนบิวลาเคลื่อนที่ช้าๆ
                const { initialPosition, phase, speed } = nebula.userData;
                
                // เคลื่อนที่เป็นวงรอบตำแหน่งเริ่มต้น
                nebula.position.x = initialPosition.x + Math.sin(time * speed + phase) * 0.1;
                nebula.position.y = initialPosition.y + Math.cos(time * speed * 0.7 + phase) * 0.05;
                nebula.position.z = initialPosition.z + Math.sin(time * speed * 0.5 + phase) * 0.1;
            });
        }
        
        // อัปเดตดาวฤกษ์พิเศษ
        if (this.specialStars) {
            this.specialStars.forEach(starObj => {
                const { star, light, phase, speed } = starObj;
                
                // ทำให้ความเข้มของแสงเปลี่ยนแปลงตามเวลา
                if (light) {
                    light.intensity = 1.5 + Math.sin(time * speed + phase) * 0.5;
                }
                
                // ทำให้ดาวกะพริบ (เฉพาะบางประเภท)
                if (starObj.type === 'neutron' || starObj.type === 'strange') {
                    const scale = 1 + Math.sin(time * speed * 2 + phase) * 0.1;
                    star.scale.set(scale, scale, scale);
                }
            });
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
        
        // ล้างอนุภาคเดิมทั้งหมด
        this.disposeParticles();
        
        // สร้างกาแล็กซี่ใหม่ด้วยอนุภาคตามตัวคูณ
        this.createGalaxy();
        
        // สร้างฝุ่นดาวใหม่
        this.createGalacticDust();
    }
}