class TextureManager {
    constructor(loadingManager) {
        this.loadingManager = loadingManager;
        this.textureLoader = new THREE.TextureLoader(loadingManager);
        this.textures = {};
        this.materials = {};
        this.assetsLoaded = false;
    }
    
    async loadTextures() {
        return new Promise(async (resolve, reject) => {
            try {
                // โหลด textures พื้นฐาน
                await Promise.all([
                    // Earth textures - ใช้ textures คุณภาพสูง
                    this.loadTextureWithFallback('earth', 
                        'https://i.imgur.com/6iIJr5N.jpg',
                        this.createDefaultTexture(0x2233ff)
                    ),
                    
                    this.loadTextureWithFallback('earthBump', 
                        'https://i.imgur.com/cJkPcGj.jpg',
                        this.createDefaultTexture(0x777777)
                    ),
                    
                    this.loadTextureWithFallback('earthNormal', 
                        'https://i.imgur.com/RIHUFSX.jpg',
                        this.createDefaultTexture(0x8888ff)
                    ),
                    
                    this.loadTextureWithFallback('earthSpecular', 
                        'https://i.imgur.com/4J7N95d.jpg',
                        this.createDefaultTexture(0xaaaaaa)
                    ),
                    
                    this.loadTextureWithFallback('earthClouds', 
                        'https://i.imgur.com/O2vVPfl.png',
                        this.createDefaultTexture(0xffffff, 0.5)
                    ),
                    
                    this.loadTextureWithFallback('earthNight',
                        'https://i.imgur.com/XN3BPju.jpg',
                        this.createDefaultTexture(0x222244)
                    ),
                    
                    // Uranus textures
                    this.loadTextureWithFallback('uranusMap', 
                        'https://i.imgur.com/UKICErk.jpg',
                        this.createDefaultTexture(0x45a6ed)
                    ),
                    
                    this.loadTextureWithFallback('uranusRing',
                        'https://i.imgur.com/UwEgRLk.png',
                        this.createDefaultTexture(0x88bbff, 0.7)
                    ),
                    
                    // Star field texture
                    this.loadTextureWithFallback('starField', 
                        'https://i.imgur.com/FS3BBHu.jpg',
                        this.createDefaultTexture(0x000000)
                    ),
                    
                    // Galaxy particle texture
                    this.loadTextureWithFallback('galaxyParticle', 
                        'https://i.imgur.com/xXs1KUw.png',
                        this.createDefaultParticleTexture()
                    ),
                    
                    // Additional textures for HDR effects
                    this.loadTextureWithFallback('lensFlareDirt',
                        'https://i.imgur.com/0TY2d2S.jpg',
                        this.createDefaultTexture(0x888888, 0.3)
                    )
                ]);
                
                // สร้าง materials จาก textures
                this.createMaterials();
                
                this.assetsLoaded = true;
                resolve();
            } catch (error) {
                console.error("Error loading textures:", error);
                reject(error);
            }
        });
    }
    
    // โหลด texture พร้อม fallback
    loadTextureWithFallback(name, url, fallbackTexture) {
        return new Promise((resolve) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    // กำหนดการตั้งค่า texture ที่เหมาะสม
                    this.configureTexture(texture);
                    this.textures[name] = texture;
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn(`Failed to load texture ${url}, using fallback`, error);
                    this.textures[name] = fallbackTexture;
                    resolve(fallbackTexture);
                }
            );
        });
    }
    
    // กำหนดการตั้งค่า texture ที่เหมาะสม
    configureTexture(texture) {
        texture.anisotropy = 16; // เพิ่มความคมชัดเมื่อมองเห็นในมุมเอียง
        
        // แก้ไขจาก encoding ใน three.js เวอร์ชันเก่า เป็น colorSpace ในเวอร์ชันใหม่
        texture.colorSpace = THREE.SRGBColorSpace; // ใช้ SRGBColorSpace เพื่อความถูกต้องของสี
        
        // กำหนดการตั้งค่า texture ที่เหมาะสม (ต่อ)
        texture.minFilter = THREE.LinearMipmapLinearFilter; // การกรองคุณภาพสูงสำหรับการย่อ
        texture.magFilter = THREE.LinearFilter; // การกรองคุณภาพสูงสำหรับการขยาย
        texture.needsUpdate = true; // บังคับให้อัปเดต
    }
    
    // สร้าง texture เริ่มต้นด้วยสีแบบง่าย (สำหรับ fallback)
    createDefaultTexture(color, opacity = 1.0) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // แปลงสีเป็นรูปแบบ hex string
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // เพิ่มลวดลายเล็กน้อยเพื่อความสมจริง
        if (color !== 0x000000) {
            context.fillStyle = `rgba(255, 255, 255, 0.1)`;
            for (let i = 0; i < 100; i++) {
                const size = Math.random() * 4 + 1;
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                context.fillRect(x, y, size, size);
            }
            
            context.fillStyle = `rgba(0, 0, 0, 0.1)`;
            for (let i = 0; i < 100; i++) {
                const size = Math.random() * 4 + 1;
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                context.fillRect(x, y, size, size);
            }
        }
        
        // เพิ่มดาวสำหรับพื้นหลังอวกาศ
        if (color === 0x000000) {
            context.fillStyle = '#FFFFFF';
            for (let i = 0; i < 500; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const size = Math.random() * 2;
                
                // สร้างดาวที่มีขนาดแตกต่างกัน
                context.beginPath();
                context.arc(x, y, size, 0, Math.PI * 2);
                context.fill();
                
                // สร้างดาวที่สว่างกว่าสำหรับบางดวง
                if (Math.random() > 0.9) {
                    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    context.beginPath();
                    context.arc(x, y, size * 1.5, 0, Math.PI * 2);
                    context.fill();
                    context.fillStyle = '#FFFFFF';
                }
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        this.configureTexture(texture);
        
        if (opacity < 1.0) {
            texture.transparent = true;
        }
        
        return texture;
    }
    
    // สร้าง texture สำหรับอนุภาค (เช่น ดาวในกาแล็กซี่)
    createDefaultParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // สร้างรูปวงกลมไล่ระดับ
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.3, 'rgba(200, 200, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(150, 150, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(100, 100, 255, 0.0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        this.configureTexture(texture);
        texture.transparent = true;
        
        return texture;
    }
    
    // สร้าง materials คุณภาพสูงจาก textures
    createMaterials() {
        // Earth materials
        this.materials.earth = new THREE.MeshPhysicalMaterial({
            map: this.textures.earth,
            bumpMap: this.textures.earthBump,
            normalMap: this.textures.earthNormal,
            roughnessMap: this.textures.earthSpecular, // เปลี่ยนจาก specularMap เป็น roughnessMap
            bumpScale: 0.1,
            normalScale: new THREE.Vector2(0.8, 0.8),
            roughness: 0.8,
            metalness: 0.1,
            envMapIntensity: 0.5,
            clearcoat: 0.2, // เพิ่มชั้นคลุมเงา
            clearcoatRoughness: 0.4
        });
        
        this.materials.earthClouds = new THREE.MeshPhongMaterial({
            map: this.textures.earthClouds,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.CustomBlending,
            blendSrc: THREE.SrcAlphaFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor
        });
        
        this.materials.earthAtmosphere = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x93cfef) },
                viewVector: { value: new THREE.Vector3(0, 0, 1) },
                c: { value: 0.5 },
                p: { value: 4.0 }
            },
            vertexShader: `
                uniform vec3 viewVector;
                uniform float c;
                uniform float p;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(c - dot(vNormal, vNormel), p);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, intensity);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        
        // Uranus materials
        this.materials.uranus = new THREE.MeshPhongMaterial({
            map: this.textures.uranusMap,
            bumpScale: 0.05,
            specular: new THREE.Color(0x77bbff),
            shininess: 10,
            envMapIntensity: 0.7
        });
        
        this.materials.uranusRing = new THREE.MeshPhongMaterial({
            map: this.textures.uranusRing,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.materials.uranusAtmosphere = new THREE.ShaderMaterial({
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
                    gl_FragColor = vec4(glow, intensity * 0.8);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        
        // Galaxy materials
        this.materials.galaxyParticles = new THREE.PointsMaterial({
            size: 0.15,
            map: this.textures.galaxyParticle,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true,
            sizeAttenuation: true
        });
        
        // Background materials
        this.materials.starField = new THREE.MeshBasicMaterial({
            map: this.textures.starField,
            side: THREE.BackSide,
            fog: false
        });
    }
    
    // อัปเดต uniforms ของ material ตามเวลา
    update(time) {
        // อัปเดต shader materials ที่มี uniform time
        if (this.materials.uranusAtmosphere && this.materials.uranusAtmosphere.uniforms) {
            this.materials.uranusAtmosphere.uniforms.time.value = time;
        }
        
        // อัปเดต viewVector สำหรับเอฟเฟกต์ชั้นบรรยากาศ
        if (this.materials.earthAtmosphere && this.materials.earthAtmosphere.uniforms) {
            const camera = this.getActiveCamera();
            if (camera) {
                const viewVector = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();
                this.materials.earthAtmosphere.uniforms.viewVector.value = viewVector;
                
                if (this.materials.uranusAtmosphere && this.materials.uranusAtmosphere.uniforms) {
                    this.materials.uranusAtmosphere.uniforms.viewVector.value = viewVector;
                }
            }
        }
    }
    
    // รับกล้องที่ใช้งานอยู่
    getActiveCamera() {
        return sceneManager ? sceneManager.camera : null;
    }
    
    // สร้าง environment map สำหรับการสะท้อนแสง
    createEnvironmentMap() {
        // สร้าง cubeMap จาก starField texture
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
            format: THREE.RGBAFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter
        });
        
        const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
        cubeCamera.position.set(0, 0, 0);
        sceneManager.scene.add(cubeCamera);
        
        // อัปเดต cubemap เมื่อต้องการ
        cubeCamera.update(sceneManager.renderer, sceneManager.scene);
        
        // ตั้งค่า environment map สำหรับวัสดุ
        this.materials.earth.envMap = cubeRenderTarget.texture;
        this.materials.uranus.envMap = cubeRenderTarget.texture;
        
        return cubeCamera;
    }
}