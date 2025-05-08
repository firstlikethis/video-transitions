class EnhancedEarthScene extends EarthScene {
    constructor(scene, textures) {
        super(scene, textures);
        
        // เพิ่มเมธอดสำหรับการสร้างเอฟเฟกต์เมื่อคลิก
        this.createClickEffect = this.createClickEffect.bind(this);
    }
    
    createClickEffect(event) {
        // สร้างเอฟเฟกต์คล้ายเมฆหรือออโรร่าเมื่อคลิกที่โลก
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // สร้างเอฟเฟกต์แสงที่จุดที่คลิก
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4a9eff,
            transparent: true,
            opacity: 0.7
        });
        
        const light = new THREE.PointLight(0x4a9eff, 2, 10);
        light.position.set(mouseX * 10, mouseY * 10, 5);
        
        const lightMesh = new THREE.Mesh(geometry, material);
        lightMesh.position.copy(light.position);
        
        this.group.add(light);
        this.group.add(lightMesh);
        
        // แอนิเมชันเอฟเฟกต์แสงและหายไป
        gsap.to(light, {
            intensity: 0,
            duration: 2,
            ease: "power2.out",
            onComplete: () => {
                this.group.remove(light);
                this.group.remove(lightMesh);
            }
        });
        
        gsap.to(lightMesh.scale, {
            x: 3,
            y: 3,
            z: 3,
            duration: 2,
            ease: "power2.out"
        });
        
        gsap.to(material, {
            opacity: 0,
            duration: 2,
            ease: "power2.out"
        });
    }
}