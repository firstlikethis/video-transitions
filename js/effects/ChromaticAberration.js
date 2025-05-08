/**
 * ChromaticAberration.js
 * สร้างเอฟเฟกต์ความผิดเพี้ยนของสีที่เกิดในเลนส์กล้อง
 * แยกแต่ละช่องสี (RGB) ออกจากกันเล็กน้อยเพื่อสร้างความรู้สึกเหมือนใช้กล้องคุณภาพสูง
 */
class ChromaticAberrationEffect {
    /**
     * สร้างเอฟเฟกต์ความผิดเพี้ยนของสี
     */
    constructor() {
        // ค่าความแรงของเอฟเฟกต์
        this.intensity = 0.005;
        
        // สร้าง shader pass
        this.createShaderPass();
    }
    
    /**
     * สร้าง shader pass สำหรับเอฟเฟกต์
     */
    createShaderPass() {
        // สร้าง shader uniforms
        const uniforms = {
            'tDiffuse': { value: null },
            'resolution': { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            'intensity': { value: this.intensity }
        };
        
        // Fragment shader ที่สร้างเอฟเฟกต์
        const fragmentShader = `
            uniform sampler2D tDiffuse;
            uniform vec2 resolution;
            uniform float intensity;
            
            varying vec2 vUv;
            
            void main() {
                // คำนวณค่า offset สำหรับแต่ละช่องสี
                // ความผิดเพี้ยนมากขึ้นบริเวณขอบภาพ
                vec2 uv = vUv;
                vec2 center = vec2(0.5, 0.5);
                vec2 dir = uv - center;
                float dist = length(dir);
                
                // ปรับระยะทางให้เป็นค่า exponential
                float factor = dist * intensity;
                
                // สร้าง offset ที่แตกต่างกันสำหรับแต่ละช่องสี
                vec2 redOffset = dir * factor * 1.0; // แดงเคลื่อนที่มากที่สุด
                vec2 greenOffset = dir * factor * 0.5; // เขียวเคลื่อนที่ปานกลาง
                vec2 blueOffset = dir * factor * -0.5; // น้ำเงินเคลื่อนที่ในทิศทางตรงข้าม
                
                // อ่านค่าสีจากแต่ละตำแหน่ง
                float r = texture2D(tDiffuse, uv - redOffset).r;
                float g = texture2D(tDiffuse, uv - greenOffset).g;
                float b = texture2D(tDiffuse, uv - blueOffset).b;
                
                // รวมค่าสีทั้งสามเข้าด้วยกัน
                gl_FragColor = vec4(r, g, b, 1.0);
            }
        `;
        
        // Vertex shader มาตรฐาน
        const vertexShader = `
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        // สร้าง shader material
        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
        
        // สร้าง shader pass
        this.pass = new THREE.ShaderPass(material);
        this.pass.renderToScreen = false;
        this.pass.enabled = false; // ปิดไว้เริ่มต้น
    }
    
    /**
     * รับ pass สำหรับเพิ่มเข้าไปใน effect composer
     * @returns {THREE.ShaderPass} Shader pass
     */
    getPass() {
        return this.pass;
    }
    
    /**
     * ตั้งค่าความแรงของเอฟเฟกต์
     * @param {number} intensity - ค่าความแรง (0.0 - 0.1)
     */
    setIntensity(intensity) {
        this.intensity = Math.min(Math.max(intensity, 0), 0.1);
        
        if (this.pass.material.uniforms) {
            this.pass.material.uniforms.intensity.value = this.intensity;
        }
    }
    
    /**
     * แอนิเมชันความแรงของเอฟเฟกต์
     * @param {number} targetIntensity - ค่าความแรงเป้าหมาย
     * @param {number} duration - ระยะเวลา (วินาที)
     * @param {Function} onComplete - ฟังก์ชันที่จะเรียกเมื่อเสร็จสิ้น
     */
    animate(targetIntensity, duration, onComplete) {
        // ตรวจสอบว่า pass มีอยู่
        if (!this.pass || !this.pass.material || !this.pass.material.uniforms) return;
        
        // กำหนดค่าสูงสุดสำหรับความแรง
        targetIntensity = Math.min(Math.max(targetIntensity, 0), 0.1);
        
        // แอนิเมชันด้วย GSAP
        gsap.to(this.pass.material.uniforms.intensity, {
            value: targetIntensity,
            duration: duration,
            ease: "power2.inOut",
            onUpdate: () => {
                // อัปเดตค่าความแรงภายใน
                this.intensity = this.pass.material.uniforms.intensity.value;
            },
            onComplete: () => {
                if (onComplete && typeof onComplete === 'function') {
                    onComplete();
                }
            }
        });
    }
    
    /**
     * ปรับขนาดเมื่อหน้าจอเปลี่ยน
     * @param {number} width - ความกว้างใหม่
     * @param {number} height - ความสูงใหม่
     */
    resize(width, height) {
        if (this.pass && this.pass.material && this.pass.material.uniforms) {
            this.pass.material.uniforms.resolution.value.set(width, height);
        }
    }
    
    /**
     * เปิด/ปิดเอฟเฟกต์
     * @param {boolean} enabled - สถานะเปิด/ปิด
     */
    setEnabled(enabled) {
        if (this.pass) {
            this.pass.enabled = enabled;
        }
    }
    
    /**
     * ล้างทรัพยากร
     */
    dispose() {
        if (this.pass && this.pass.material) {
            this.pass.material.dispose();
        }
    }
}