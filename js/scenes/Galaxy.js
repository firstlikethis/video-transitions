class GalaxyScene {
    constructor(scene, textures) {
        this.scene = scene;
        this.textures = textures;
        
        // Create a group to hold all objects for this scene
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Create Galaxy scene objects
        this.createGalaxy();
    }
    
    createGalaxy() {
        // Create galaxy particles system
        const galaxyParticles = new THREE.Group();
        const particleCount = 10000;
        const galaxyGeometry = new THREE.BufferGeometry();
        const galaxyMaterial = new THREE.PointsMaterial({
            size: 0.15,
            map: this.textures.galaxy,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);
        
        const arms = 5;
        const arm_length = 5; // Length of each arm
        const arm_width = 0.5; // Width of each arm
        
        const colorInside = new THREE.Color(0x6a00ff);
        const colorOutside = new THREE.Color(0x00aaff);
        
        for (let i = 0; i < particleCount; i++) {
            // Distribute particles in a spiral galaxy pattern
            const arm = Math.floor(Math.random() * arms);
            const angle = (arm / arms) * Math.PI * 2;
            const distance = Math.random() * arm_length;
            const spiralFactor = 0.6; // How tightly the spiral wraps
            const finalAngle = angle + distance * spiralFactor;
            
            const x = Math.cos(finalAngle) * distance;
            const y = (Math.random() - 0.5) * arm_width * (distance * 0.2);
            const z = Math.sin(finalAngle) * distance;
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // Color gradient from center to edge
            const mixRatio = distance / arm_length;
            const color = new THREE.Color().lerpColors(colorInside, colorOutside, mixRatio);
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Vary particle sizes
            scales[i] = Math.random() * 2.5;
        }
        
        galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        galaxyGeometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
        
        const galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial);
        galaxyParticles.add(galaxyPoints);
        
        // Add a glow in the center
        const glowGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x6a00ff) }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                    gl_FragColor = vec4(glowColor, 1.0) * intensity;
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        galaxyParticles.add(glowMesh);
        
        // Store for animation
        this.galaxyParticles = galaxyParticles;
        
        // Add to group
        this.group.add(galaxyParticles);
        
        // Tilt galaxy for better viewing angle
        this.group.rotation.x = Math.PI / 4;
        
        // Position off-screen initially for transitions
        this.group.position.set(0, 0, 100);
    }
    
    update(time) {
        // Rotate galaxy
        if (this.galaxyParticles) {
            this.galaxyParticles.rotation.y += 0.0005;
            
            // Add subtle motion in z-axis to create more dynamic feeling
            this.galaxyParticles.position.z = Math.sin(time * 0.2) * 0.15;
        }
    }
}