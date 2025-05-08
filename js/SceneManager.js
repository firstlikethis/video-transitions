class SceneManager {
    constructor(loadingManager) {
        this.loadingManager = loadingManager;
        this.container = document.getElementById('canvas-container');
        this.sceneLabel = document.getElementById('scene-label');
        
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLights();
        
        // Setup resize handler
        this.resizeHandler = new ResizeHandler(this.camera, this.renderer);
        
        // Create texture loader
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        this.textures = {};
        
        // Flag to track if we've successfully loaded assets
        this.assetsLoaded = false;
        
        // Load assets and initialize
        this.loadAssets().then(() => {
            this.assetsLoaded = true;
            this.createScenes();
            this.animate();
            this.showScene(SCENES.EARTH);
        }).catch(error => {
            console.error("Failed to load assets:", error);
            // Show error message to user
            alert("Failed to load textures. Loading backup simple version.");
            // Create scenes with default textures as fallback
            this.createSimpleScenes();
            this.animate();
            this.showScene(SCENES.EARTH);
        });
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.0007);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(0, 0, 20);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun-like)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 30, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        // Add some point lights for galaxy and black hole scenes
        const blueLight = new THREE.PointLight(0x3498db, 0, 50);
        blueLight.position.set(-10, 5, 10);
        this.scene.add(blueLight);
        this.blueLight = blueLight;
        
        const purpleLight = new THREE.PointLight(0x9b59b6, 0, 50);
        purpleLight.position.set(10, -5, 10);
        this.scene.add(purpleLight);
        this.purpleLight = purpleLight;
    }
    
    async loadAssets() {
        return new Promise(async (resolve, reject) => {
            try {
                // ใช้ URL ที่ทำงานได้จริงจากบริการที่เชื่อถือได้ (Imgur)
                const texturePromises = [
                    // Earth textures
                    this.loadTextureWithFallback('earth', 
                        'https://i.imgur.com/6iIJr5N.jpg', // Earth texture
                        this.createDefaultTexture(0x2233ff) // Blue fallback
                    ),
                    
                    this.loadTextureWithFallback('earthBump', 
                        'https://i.imgur.com/cJkPcGj.jpg', // Earth bump map
                        this.createDefaultTexture(0x777777) // Grey fallback
                    ),
                    
                    this.loadTextureWithFallback('earthClouds', 
                        'https://i.imgur.com/O2vVPfl.png', // Earth clouds
                        this.createDefaultTexture(0xffffff, 0.5) // White transparent fallback
                    ),
                    
                    // Uranus texture
                    this.loadTextureWithFallback('uranusMap', 
                        'https://i.imgur.com/UKICErk.jpg', // Uranus texture
                        this.createDefaultTexture(0x45a6ed) // Light blue fallback
                    ),
                    
                    // Star field texture
                    this.loadTextureWithFallback('starField', 
                        'https://i.imgur.com/FS3BBHu.jpg', // Star field
                        this.createDefaultTexture(0x000000) // Black fallback with white dots
                    ),
                    
                    // Galaxy particle texture
                    this.loadTextureWithFallback('galaxy', 
                        'https://i.imgur.com/xXs1KUw.png', // Particle texture
                        this.createDefaultParticleTexture() // White circle fallback
                    )
                ];
                
                // Wait for all textures to load
                await Promise.all(texturePromises);
                resolve();
            } catch (error) {
                console.error("Error loading textures:", error);
                reject(error);
            }
        });
    }
    
    // Create a default texture with a solid color (for fallback)
    createDefaultTexture(color, opacity = 1.0) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.fillRect(0, 0, 128, 128);
        
        // Add some random dots for star field if it's black
        if (color === 0x000000) {
            context.fillStyle = '#FFFFFF';
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * 128;
                const y = Math.random() * 128;
                const size = Math.random() * 2;
                context.beginPath();
                context.arc(x, y, size, 0, Math.PI * 2);
                context.fill();
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        if (opacity < 1.0) {
            texture.transparent = true;
        }
        return texture;
    }
    
    // Create a default particle texture (white dot with soft edges)
    createDefaultParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        
        // Create circular gradient
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    // Load texture with fallback to handle failures
    loadTextureWithFallback(name, url, fallbackTexture) {
        return new Promise((resolve) => {
            this.textureLoader.load(
                url,
                (texture) => {
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
    
    createScenes() {
        // Create star background
        this.createStarBackground();
        
        // Create scene objects using the imported classes
        sceneObjects[SCENES.EARTH] = new EarthScene(this.scene, this.textures);
        sceneObjects[SCENES.URANUS] = new UranusScene(this.scene, this.textures);
        sceneObjects[SCENES.GALAXY] = new GalaxyScene(this.scene, this.textures);
        sceneObjects[SCENES.BLACK_HOLE] = new BlackHoleScene(this.scene, this.textures);
        
        // Initially hide all scenes except Earth
        for (const sceneIdx in sceneObjects) {
            sceneObjects[sceneIdx].group.visible = false;
        }
    }
    
    // Fallback to create very simple scenes if textures fail to load
    createSimpleScenes() {
        // Create a simple starry background
        this.createSimpleStarBackground();
        
        // Create simple scene objects without textures
        sceneObjects[SCENES.EARTH] = new SimpleEarthScene(this.scene);
        sceneObjects[SCENES.URANUS] = new SimpleUranusScene(this.scene);
        sceneObjects[SCENES.GALAXY] = new SimpleGalaxyScene(this.scene);
        sceneObjects[SCENES.BLACK_HOLE] = new SimpleBlackHoleScene(this.scene);
        
        // Initially hide all scenes except Earth
        for (const sceneIdx in sceneObjects) {
            if (sceneObjects[sceneIdx]) {
                sceneObjects[sceneIdx].group.visible = false;
            }
        }
    }
    
    createSimpleStarBackground() {
        // Create a simple star background with a black sphere and particle stars
        const geometry = new THREE.SphereGeometry(1000, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.BackSide
        });
        const starSphere = new THREE.Mesh(geometry, material);
        this.scene.add(starSphere);
        
        // Add some stars as points
        const starCount = 1000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            // Random positions on a sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 900 + Math.random() * 80;
            
            starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            starPositions[i3 + 2] = radius * Math.cos(phi);
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            sizeAttenuation: true
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }
    
    createStarBackground() {
        const geometry = new THREE.SphereGeometry(5000, 64, 64);
        const material = new THREE.MeshBasicMaterial({
            map: this.textures.starField,
            side: THREE.BackSide
        });
        const starSphere = new THREE.Mesh(geometry, material);
        this.scene.add(starSphere);
    }
    
    showScene(sceneIndex) {
        if (isTransitioning) return;
        
        // Safety check for undefined scenes
        if (!sceneObjects[sceneIndex] || !sceneObjects[sceneIndex].group) {
            console.error(`Scene ${sceneIndex} is undefined or has no group property`);
            return;
        }
        
        // Hide all scenes first
        for (const sceneIdx in sceneObjects) {
            if (sceneObjects[sceneIdx] && sceneObjects[sceneIdx].group) {
                sceneObjects[sceneIdx].group.visible = false;
            }
        }
        
        // Show the requested scene
        sceneObjects[sceneIndex].group.visible = true;
        
        // Update scene label
        const labels = ['Earth', 'Uranus', 'Galaxy', 'Black Hole'];
        this.sceneLabel.textContent = labels[sceneIndex];
        this.sceneLabel.style.opacity = '1';
        
        // Update current scene
        currentScene = sceneIndex;
        
        // Apply camera and lighting settings for each scene
        this.applySceneSettings(sceneIndex);
    }
    
    applySceneSettings(sceneIndex) {
        // Special handling for each scene
        if (sceneIndex === SCENES.EARTH) {
            // Position camera for Earth scene
            gsap.to(this.camera.position, {
                x: 0, y: 0, z: 15,
                duration: 2,
                ease: 'power2.inOut'
            });
            
            // Turn off special lights
            gsap.to(this.blueLight, { intensity: 0, duration: 1 });
            gsap.to(this.purpleLight, { intensity: 0, duration: 1 });
        } 
        else if (sceneIndex === SCENES.URANUS) {
            // Position camera for Uranus scene
            gsap.to(this.camera.position, {
                x: 0, y: 3, z: 20,
                duration: 2,
                ease: 'power2.inOut'
            });
            
            // Add some ambient lighting
            gsap.to(this.blueLight, { intensity: 2, duration: 1 });
            gsap.to(this.purpleLight, { intensity: 0.5, duration: 1 });
        } 
        else if (sceneIndex === SCENES.GALAXY) {
            // Position camera for Galaxy scene
            gsap.to(this.camera.position, {
                x: 2, y: 8, z: 15, 
                duration: 2,
                ease: 'power2.inOut'
            });
            
            // Colorful lighting for galaxy
            gsap.to(this.blueLight, { intensity: 5, duration: 1 });
            gsap.to(this.purpleLight, { intensity: 3, duration: 1 });
        } 
        else if (sceneIndex === SCENES.BLACK_HOLE) {
            // Position camera for Black Hole scene
            gsap.to(this.camera.position, {
                x: 0, y: 5, z: 20,
                duration: 2,
                ease: 'power2.inOut'
            });
            
            // Dramatic lighting for black hole
            gsap.to(this.blueLight, { intensity: 3, duration: 1 });
            gsap.to(this.purpleLight, { intensity: 7, duration: 1 });
        }
    }
    
    transitionToScene(fromIndex, toIndex) {
        if (isTransitioning) return;
        
        // Safety check for undefined scenes
        if (!sceneObjects[fromIndex] || !sceneObjects[fromIndex].group || 
            !sceneObjects[toIndex] || !sceneObjects[toIndex].group) {
            console.error(`Scene ${fromIndex} or ${toIndex} is undefined or has no group property`);
            return;
        }
        
        isTransitioning = true;
        
        // Use the Transition utility with safety checks
        Transition.performTransition(
            sceneObjects[fromIndex].group,
            sceneObjects[toIndex].group,
            fromIndex,
            toIndex,
            this.camera,
            this.blueLight,
            this.purpleLight,
            this.sceneLabel,
            () => {
                // Reset after transition completes
                if (sceneObjects[fromIndex] && sceneObjects[fromIndex].group) {
                    sceneObjects[fromIndex].group.visible = false;
                }
                currentScene = toIndex;
                isTransitioning = false;
            }
        );
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const time = performance.now() * 0.001; // time in seconds
        
        // Update each visible scene with safety checks
        for (const sceneIdx in sceneObjects) {
            if (sceneObjects[sceneIdx] && 
                sceneObjects[sceneIdx].group && 
                sceneObjects[sceneIdx].group.visible && 
                typeof sceneObjects[sceneIdx].update === 'function') {
                
                sceneObjects[sceneIdx].update(time);
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Simple scene classes for fallback when textures fail to load

class SimpleEarthScene {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Simple Earth with blue material
        const earthGeometry = new THREE.SphereGeometry(5, 32, 32);
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0x2244dd,
            shininess: 15
        });
        this.earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
        this.group.add(this.earthMesh);
    }
    
    update(time) {
        if (this.earthMesh) {
            this.earthMesh.rotation.y += 0.002;
        }
    }
}

class SimpleUranusScene {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Simple Uranus with light blue material
        const uranusGeometry = new THREE.SphereGeometry(6, 32, 32);
        const uranusMaterial = new THREE.MeshPhongMaterial({
            color: 0x88bbff,
            shininess: 5
        });
        this.uranusMesh = new THREE.Mesh(uranusGeometry, uranusMaterial);
        this.group.add(this.uranusMesh);
        
        // Simple ring
        const ringGeometry = new THREE.RingGeometry(9, 11, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaddff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4
        });
        this.ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ringMesh.rotation.x = Math.PI / 2;
        this.group.add(this.ringMesh);
        
        // Position off-screen initially
        this.group.position.set(0, 0, 50);
        this.group.rotation.z = Math.PI / 7; // Tilt
    }
    
    update(time) {
        if (this.uranusMesh) {
            this.uranusMesh.rotation.y += 0.001;
        }
    }
}

class SimpleGalaxyScene {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Create simple galaxy with particles
        this.galaxyParticles = new THREE.Group();
        const particleCount = 5000;
        const galaxyGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const radius = Math.random() * 5;
            const angle = Math.random() * Math.PI * 2;
            
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = (Math.random() - 0.5) * 0.5;
            positions[i3 + 2] = Math.sin(angle) * radius;
            
            // Color gradient from center to edge
            const color = new THREE.Color();
            color.setHSL(0.6 + (radius / 10), 1.0, 0.5);
            
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const galaxyMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial);
        this.galaxyParticles.add(galaxyPoints);
        this.group.add(this.galaxyParticles);
        
        // Position off-screen initially
        this.group.position.set(0, 0, 100);
        this.group.rotation.x = Math.PI / 4;
    }
    
    update(time) {
        if (this.galaxyParticles) {
            this.galaxyParticles.rotation.y += 0.0005;
        }
    }
}

class SimpleBlackHoleScene {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Black hole center
        const blackHoleGeometry = new THREE.SphereGeometry(4, 32, 32);
        const blackHoleMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000
        });
        const blackHoleMesh = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
        this.group.add(blackHoleMesh);
        
        // Simple accretion disk
        const diskGeometry = new THREE.RingGeometry(5, 12, 32);
        const diskMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        this.diskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
        this.diskMesh.rotation.x = Math.PI / 2;
        this.group.add(this.diskMesh);
        
        // Position off-screen initially
        this.group.position.set(0, 0, 150);
    }
    
    update(time) {
        if (this.diskMesh) {
            this.diskMesh.rotation.z += 0.001;
        }
    }
}