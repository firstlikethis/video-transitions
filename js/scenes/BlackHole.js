class BlackHoleScene {
    constructor(scene, textures) {
        this.scene = scene;
        this.textures = textures;
        
        // Create a group to hold all objects for this scene
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Create Black Hole scene objects
        this.createBlackHole();
    }
    
    createBlackHole() {
        // Create the black hole group
        const blackHoleGroup = new THREE.Group();
        
        // Event horizon (black sphere)
        const horizonGeometry = new THREE.SphereGeometry(4, 64, 64);
        const horizonMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.FrontSide
        });
        const horizonMesh = new THREE.Mesh(horizonGeometry, horizonMaterial);
        blackHoleGroup.add(horizonMesh);
        
        // Accretion disk
        const diskGeometry = new THREE.RingGeometry(5, 12, 64);
        const diskMaterial = new THREE.ShaderMaterial({
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
                    // Radial distance from center normalized to 0-1
                    float radius = length(vUv - 0.5) * 2.0;
                    
                    // Angle from center
                    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                    
                    // Create swirl pattern
                    float swirl = noise(vec2(radius * 5.0 + time * 0.1, angle * 3.0));
                    
                    // Orange-red gradient for the inner part of the disk
                    vec3 innerColor = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.0, 0.0), radius);
                    
                    // Blue-purple for the outer part
                    vec3 outerColor = mix(vec3(0.6, 0.0, 1.0), vec3(0.0, 0.5, 1.0), radius);
                    
                    // Blend between inner and outer colors
                    vec3 diskColor = mix(innerColor, outerColor, smoothstep(0.4, 0.6, radius));
                    
                    // Apply swirl and add some black streaks
                    diskColor = mix(diskColor, vec3(0.0), swirl * 0.7);
                    
                    // Fade opacity at inner and outer edges
                    float alpha = smoothstep(0.0, 0.2, radius) * (1.0 - smoothstep(0.8, 1.0, radius));
                    
                    // Brighten edges where matter heats up
                    diskColor *= 1.0 + 0.5 * smoothstep(0.2, 0.3, radius) * (1.0 - smoothstep(0.3, 0.4, radius));
                    
                    gl_FragColor = vec4(diskColor, alpha * 0.8);
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const diskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
        diskMesh.rotation.x = Math.PI / 2;
        blackHoleGroup.add(diskMesh);
        
        // Light beams from poles (like in Interstellar)
        const beamGeometry = new THREE.CylinderGeometry(0.5, 3, 20, 32, 1, true);
        const beamMaterial = new THREE.ShaderMaterial({
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
                    // Fade based on height
                    float opacity = (1.0 - vUv.y) * 0.5;
                    
                    // Add some variation
                    opacity *= 0.7 + 0.3 * sin(vUv.y * 30.0 + time * 2.0);
                    
                    // Blue-white color
                    vec3 color = mix(vec3(0.5, 0.8, 1.0), vec3(1.0), vUv.y);
                    
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const topBeam = new THREE.Mesh(beamGeometry, beamMaterial);
        topBeam.position.y = 10;
        blackHoleGroup.add(topBeam);
        
        const bottomBeam = new THREE.Mesh(beamGeometry, beamMaterial);
        bottomBeam.position.y = -10;
        bottomBeam.rotation.x = Math.PI;
        blackHoleGroup.add(bottomBeam);
        
        // Gravitational lensing effect (simplified)
        const lensGeometry = new THREE.SphereGeometry(6, 32, 32);
        const lensMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec3 vNormal;
                
                void main() {
                    float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                    vec3 color = vec3(0.1, 0.2, 0.3) * intensity;
                    gl_FragColor = vec4(color, intensity * 0.5);
                }
            `,
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const lensMesh = new THREE.Mesh(lensGeometry, lensMaterial);
        blackHoleGroup.add(lensMesh);
        
        // Store references for animation
        this.blackHoleGroup = blackHoleGroup;
        this.diskMaterial = diskMaterial;
        this.beamMaterial = beamMaterial;
        this.lensMaterial = lensMaterial;
        
        // Add to main group
        this.group.add(blackHoleGroup);
        
        // Position off-screen initially for transitions
        this.group.position.set(0, 0, 150);
    }
    
    update(time) {
        // Rotate black hole slowly
        if (this.blackHoleGroup) {
            this.blackHoleGroup.rotation.z += 0.001;
        }
        
        // Update shader uniforms to animate materials
        if (this.diskMaterial && this.diskMaterial.uniforms) {
            this.diskMaterial.uniforms.time.value = time;
        }
        
        if (this.beamMaterial && this.beamMaterial.uniforms) {
            this.beamMaterial.uniforms.time.value = time;
        }
        
        if (this.lensMaterial && this.lensMaterial.uniforms) {
            this.lensMaterial.uniforms.time.value = time;
        }
    }
}