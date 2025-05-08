// BaseScene.js
class BaseScene {
    constructor(scene, textures, materials) {
        this.scene = scene;
        this.textures = textures;
        this.materials = materials;
        
        // สร้างกลุ่มเพื่อเก็บวัตถุทั้งหมดสำหรับฉากนี้
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // เก็บวัตถุต่างๆ ของฉาก
        this.objects = {};
        
        // เก็บค่าเริ่มต้นสำหรับแอนิเมชันและปฏิสัมพันธ์
        this.initialRotation = new THREE.Euler(0, 0, 0);
        this.targetRotation = new THREE.Euler(0, 0, 0);
        
        // ตั้งค่าเริ่มต้น
        this.setup();
    }
    
    // ตั้งค่าเริ่มต้นของฉาก - ให้ override ในคลาสลูก
    setup() {
        // จะถูก override ในคลาสลูก
    }
    
    // สร้างวัตถุหลักของฉาก - ให้ override ในคลาสลูก
    createMainObject() {
        // จะถูก override ในคลาสลูก
    }
    
    // สร้างเอฟเฟกต์เพิ่มเติม - ให้ override ในคลาสลูก
    createEffects() {
        // จะถูก override ในคลาสลูก
    }
    
    // จัดการเมื่อผู้ใช้คลิกในฉากนี้ - ให้ override ในคลาสลูก
    handleInteraction(event) {
        // จะถูก override ในคลาสลูก
    }
    
    // ปรับตำแหน่งหรือมุมมองตามผู้ใช้
    updateViewByMousePosition(mousePosition) {
        // คำนวณการเคลื่อนที่ของกล้องเล็กน้อยตามตำแหน่งเมาส์
        const lookX = mousePosition.x * 2; // ควบคุมระยะการหมุน
        const lookY = mousePosition.y * 2;
        
        // ปรับการหมุนของกลุ่มวัตถุทั้งหมด
        gsap.to(this.group.rotation, {
            x: this.initialRotation.x + lookY * 0.1,
            y: this.initialRotation.y + lookX * 0.1,
            duration: 1.5,
            ease: "power2.out"
        });
    }
    
    // รีเซ็ตมุมมองกลับไปตำแหน่งเริ่มต้น
    resetView() {
        gsap.to(this.group.rotation, {
            x: this.initialRotation.x,
            y: this.initialRotation.y,
            z: this.initialRotation.z,
            duration: 1,
            ease: "power2.inOut"
        });
    }
    
    // อัปเดตแอนิเมชันตามเวลา - ให้ override ในคลาสลูก
    update(time) {
        // จะถูก override ในคลาสลูก
    }
    
    // ทำความสะอาดทรัพยากรเมื่อเปลี่ยนฉาก
    dispose() {
        // ล้าง geometries และ materials เพื่อลดการใช้หน่วยความจำ
        this.disposeObjects(this.group);
    }
    
    // ล้าง geometries และ materials
    disposeObjects(obj) {
        if (!obj) return;
        
        // เรียกตัวเองซ้ำสำหรับ children
        if (obj.children && obj.children.length > 0) {
            for (let i = 0; i < obj.children.length; i++) {
                this.disposeObjects(obj.children[i]);
            }
        }
        
        // ล้าง geometry
        if (obj.geometry) {
            obj.geometry.dispose();
        }
        
        // ล้าง material
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                for (let i = 0; i < obj.material.length; i++) {
                    this.disposeMaterial(obj.material[i]);
                }
            } else {
                this.disposeMaterial(obj.material);
            }
        }
    }
    
    // ล้าง material และ textures
    disposeMaterial(material) {
        if (!material) return;
        
        // ล้าง textures
        for (const key in material) {
            if (key !== 'map' && key !== 'envMap') continue;
            
            const value = material[key];
            if (value && typeof value.dispose === 'function') {
                value.dispose();
            }
        }
        
        // ล้าง material
        material.dispose();
    }
}