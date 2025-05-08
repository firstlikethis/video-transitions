class EarthScene {
    constructor(scene, textures) {
        this.scene = scene;
        this.textures = textures;
        
        // Create a group to hold all objects for this scene
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Create Earth scene objects
        this.createEarth();
    }
    
    createEarth() {
        // Earth
        const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: this.textures.earth,
            bumpMap: this.textures.earthBump,
            bumpScale: 0.1,
            specular: new THREE.Color(0x333333),
            shininess: 15
        });
        const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
        earthMesh.rotation.y = Math.PI;
        
        // Clouds
        const cloudGeometry = new THREE.SphereGeometry(5.1, 64, 64);
        const cloudMaterial = new THREE.MeshPhongMaterial({
            map: this.textures.earthClouds,
            transparent: true,
            opacity: 0.4
        });
        const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        this.group.add(earthMesh);
        this.group.add(cloudMesh);
        
        // Add atmosphere glow
        const atmosphereGeometry = new THREE.SphereGeometry(5.3, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x5588aa) },
                viewVector: { value: new THREE.Vector3(0, 0, 20) }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.6 - dot(vNormal, vNormel), 2.0);
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
        this.group.add(atmosphere);
        
        // Store references for animation
        this.earthMesh = earthMesh;
        this.cloudMesh = cloudMesh;
        
        // Set initial position
        this.group.position.set(0, 0, 0);
    }
    
    update(time) {
        // Earth rotation
        if (this.earthMesh) {
            this.earthMesh.rotation.y += 0.002;
        }
        
        // Cloud rotation (slightly faster than Earth)
        if (this.cloudMesh) {
            this.cloudMesh.rotation.y += 0.003;
        }
    }
}