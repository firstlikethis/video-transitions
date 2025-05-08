class UranusScene {
    constructor(scene, textures) {
        this.scene = scene;
        this.textures = textures;
        
        // Create a group to hold all objects for this scene
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Create Uranus scene objects
        this.createUranus();
    }
    
    createUranus() {
        // Uranus
        const uranusGeometry = new THREE.SphereGeometry(6, 64, 64);
        const uranusMaterial = new THREE.MeshPhongMaterial({
            map: this.textures.uranusMap,
            shininess: 5
        });
        const uranusMesh = new THREE.Mesh(uranusGeometry, uranusMaterial);
        
        // Uranus ring
        const ringGeometry = new THREE.RingGeometry(9, 11, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x8fd4d9,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = Math.PI / 2;
        
        // Add atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(6.3, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x00aaff) },
                viewVector: { value: new THREE.Vector3(0, 0, 20) }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.7 - dot(vNormal, vNormel), 2.0);
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
            transparent: true
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        
        // Store references for animation
        this.uranusMesh = uranusMesh;
        this.ringMesh = ringMesh;
        
        // Add meshes to group
        this.group.add(uranusMesh);
        this.group.add(ringMesh);
        this.group.add(atmosphere);
        
        // Apply tilt to Uranus (like in real life)
        this.group.rotation.z = Math.PI / 7;
        
        // Position off-screen initially for transitions
        this.group.position.set(0, 0, 50);
    }
    
    update(time) {
        // Uranus rotation - very slow
        if (this.uranusMesh) {
            this.uranusMesh.rotation.y += 0.001;
        }
        
        // Add subtle ring wobble
        if (this.ringMesh) {
            this.ringMesh.rotation.z = Math.sin(time * 0.2) * 0.02;
        }
    }
}