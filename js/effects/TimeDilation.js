// TimeDilation.js
class TimeDilationEffect {
    constructor() {
        // ชื่อเอฟเฟกต์
        this.name = 'timeDilation';
        
        // เก็บองค์ประกอบที่สร้างขึ้น
        this.elements = [];
    }
    
    // สร้างเอฟเฟกต์ในฉาก
    create(scene, position, duration = 3.0) {
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
        ring.position.copy(position);
        ring.rotation.x = Math.PI / 2;
        scene.add(ring);
        
        // สร้างเอฟเฟกต์ DOM overlay
        const dilationOverlay = document.createElement('div');
        dilationOverlay.className = 'time-dilation-overlay';
        document.body.appendChild(dilationOverlay);
        
        // เก็บองค์ประกอบที่สร้างขึ้น
        this.elements.push({
            type: 'mesh',
            object: ring,
            material: ringMaterial,
            scene: scene
        });
        
        this.elements.push({
            type: 'dom',
            object: dilationOverlay
        });
        
        // เล่นแอนิเมชัน
        this.animate(duration);
        
        return {
            ring,
            overlay: dilationOverlay
        };
    }
    
    // แอนิเมชันเอฟเฟกต์
    animate(duration) {
        // แอนิเมชันวงแหวน
        const ring = this.elements.find(e => e.type === 'mesh')?.object;
        const ringMaterial = this.elements.find(e => e.type === 'mesh')?.material;
        
        if (ring && ringMaterial) {
            gsap.to(ring.scale, {
                x: 20,
                y: 20,
                z: 1,
                duration: duration,
                ease: "power1.out"
            });
            
            gsap.to(ringMaterial, {
                opacity: 0,
                duration: duration,
                ease: "power1.out"
            });
        }
        
        // แอนิเมชัน DOM overlay
        const overlay = this.elements.find(e => e.type === 'dom')?.object;
        
        if (overlay) {
            gsap.to(overlay, {
                opacity: 0.7,
                duration: duration * 0.3,
                ease: "power1.in",
                onComplete: () => {
                    gsap.to(overlay, {
                        opacity: 0,
                        duration: duration * 0.7,
                        ease: "power3.out",
                        onComplete: () => {
                            this.dispose();
                        }
                    });
                }
            });
        }
    }
    
    // สร้างเอฟเฟกต์ใน DOM
    createDOMEffect(duration = 3.0) {
        // สร้างเอฟเฟกต์ใน DOM เท่านั้น
        const effectElement = document.createElement('div');
        effectElement.className = 'time-dilation-effect';
        document.body.appendChild(effectElement);
        
        // เก็บองค์ประกอบที่สร้างขึ้น
        this.elements.push({
            type: 'dom',
            object: effectElement
        });
        
        // แอนิเมชัน
        gsap.to(effectElement, {
            opacity: 1,
            duration: duration * 0.3,
            ease: "power2.in",
            onComplete: () => {
                gsap.to(effectElement, {
                    opacity: 0,
                    duration: duration * 0.7,
                    ease: "power2.out",
                    onComplete: () => {
                        this.dispose();
                    }
                });
            }
        });
        
        return effectElement;
    }
    
    // ล้างทรัพยากร
    dispose() {
        // ล้างวัตถุทั้งหมดที่สร้างขึ้น
        this.elements.forEach(element => {
            if (element.type === 'mesh') {
                // ลบวัตถุออกจากฉาก
                if (element.scene && element.object) {
                    element.scene.remove(element.object);
                }
                
                // ล้าง geometries และ materials
                if (element.object) {
                    if (element.object.geometry) {
                        element.object.geometry.dispose();
                    }
                    
                    if (element.material) {
                        element.material.dispose();
                    }
                }
            } else if (element.type === 'dom') {
                // ลบองค์ประกอบ DOM
                if (element.object && element.object.parentNode) {
                    element.object.parentNode.removeChild(element.object);
                }
            }
        });
        
        // ล้างรายการองค์ประกอบ
        this.elements = [];
    }
}