/**
 * LensDistortion.js
 * สร้างเอฟเฟกต์การบิดเบือนของเลนส์กล้อง
 * จำลองเอฟเฟกต์ barrel/pincushion distortion ที่เกิดขึ้นในเลนส์กล้องจริง
 */
class LensDistortionEffect {
    /**
     * สร้างเอฟเฟกต์การบิดเบือนของเลนส์
     */
    constructor() {
        // ค่าความแรงของเอฟเฟกต์
        this.intensity = 0.05;
        
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
            'intensity': { value: this.intensity },
            'distortionFactor': { value: 1.5 },  // ค่ามากกว่า 1 = barrel, น้อยกว่า 1 = pincushion
            'aspectRatio': { value: window.innerWidth / window.innerHeight }
        };
        
        // Fragment shader ที่สร้างเอฟเฟกต์
        const fragmentShader = `
            uniform sampler2D tDiffuse;
            uniform vec2 resolution;
            uniform float intensity;
            uniform float distortionFactor;
            uniform float aspectRatio;
            
            varying vec2 vUv;
            
            vec2 distort(vec2 uv) {
                // แปลงพิกัด uv เป็นช่วง -1 ถึง 1
                vec2 centered = uv * 2.0 - 1.0;
                
                // ปรับอัตราส่วนเพื่อให้ได้เอฟเฟกต์ที่เป็นวงกลม
                centered.x *= aspectRatio;
                
                // คำนวณระยะทางจากศูนย์กลาง
                float dist = length(centered);
                
                // คำนวณการบิดเบือน - barrel distortion (dist^2 * factor)
                float distortionAmount = 1.0 + intensity * (dist * dist) * distortionFactor;
                
                // ใช้การบิดเบือนกับพิกัด
                centered *= distortionAmount;
                
                // แปลงกลับไปเป็นพิกัด uv ปกติ
                centered.x /= aspectRatio;
                
                return centered * 0.5 + 0.5;
            }
            
            void main() {
                // คำนวณพิกัด UV ที่บิดเบือน
                vec2 distortedUV = distort(vUv);
                
                // ตรวจสอบว่าพิกัดที่บิดเบือนอยู่ในพื้นที่ภาพหรือไม่
                if (distortedUV.x < 0.0 || distortedUV.x > 1.0 || 
                    distortedUV.y < 0.0 || distortedUV.y > 1.0) {
                    // พิกัดอยู่นอกภาพ แสดงเป็นสีดำ
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                } else {
                    // อ่านค่าสีจากพิกัดที่บิดเบือน
                    gl_FragColor = texture2D(tDiffuse, distortedUV);
                }
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
     * @param {number} intensity - ค่าความแรง (0.0 - 0.5)
     */
    setIntensity(intensity) {
        this.intensity = Math.min(Math.max(intensity, 0), 0.5);
        
        if (this.pass.material.uniforms) {
            this.pass.material.uniforms.intensity.value = this.intensity;
        }
    }
    
    /**
     * ตั้งค่าปัจจัยการบิดเบือน
     * @param {number} factor - ปัจจัยการบิดเบือน (0.5 - 3.0)
     */
    setDistortionFactor(factor) {
        const distortionFactor = Math.min(Math.max(factor, 0.5), 3.0);
        
        if (this.pass.material.uniforms) {
            this.pass.material.uniforms.distortionFactor.value = distortionFactor;
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
        targetIntensity = Math.min(Math.max(targetIntensity, 0), 0.5);
        
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
     * แอนิเมชันแบบ pulsate (เต้นเป็นจังหวะ)
     * @param {number} baseIntensity - ค่าความแรงพื้นฐาน
     * @param {number} pulseAmount - ค่าความแรงที่เพิ่มขึ้นเมื่อเต้น
     * @param {number} duration - ระยะเวลาต่อรอบ (วินาที)
     * @param {number} cycles - จำนวนรอบ (ถ้าเป็น 0 จะเล่นไปเรื่อยๆ)
     */
    pulsate(baseIntensity, pulseAmount, duration, cycles = 0) {
        // ตรวจสอบว่า pass มีอยู่
        if (!this.pass || !this.pass.material || !this.pass.material.uniforms) return;
        
        // กำหนดค่าสูงสุดสำหรับความแรง
        baseIntensity = Math.min(Math.max(baseIntensity, 0), 0.3);
        const maxIntensity = Math.min(baseIntensity + pulseAmount, 0.5);
        
        // ลำดับการแอนิเมชัน
        const timeline = gsap.timeline({
            repeat: cycles > 0 ? cycles - 1 : -1, // -1 = ไม่จำกัด
            yoyo: true
        });
        
        // เพิ่มแอนิเมชันเข้าไปในลำดับ
        timeline.to(this.pass.material.uniforms.intensity, {
            value: maxIntensity,
            duration: duration / 2,
            ease: "sine.inOut",
            onUpdate: () => {
                // อัปเดตค่าความแรงภายใน
                this.intensity = this.pass.material.uniforms.intensity.value;
            }
        });
        
        // คืนค่าลำดับการแอนิเมชันเพื่อให้สามารถควบคุมได้ภายหลัง
        return timeline;
    }
    
    /**
     * ปรับขนาดเมื่อหน้าจอเปลี่ยน
     * @param {number} width - ความกว้างใหม่
     * @param {number} height - ความสูงใหม่
     */
    resize(width, height) {
        if (this.pass && this.pass.material && this.pass.material.uniforms) {
            this.pass.material.uniforms.resolution.value.set(width, height);
            this.pass.material.uniforms.aspectRatio.value = width / height;
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
     * สร้างเอฟเฟกต์เหมือนกล้องเคลื่อนไหว
     * @param {number} intensity - ความแรงของเอฟเฟกต์ (0.0 - 0.3)
     * @param {number} speed - ความเร็วของการเคลื่อนไหว (0.1 - 2.0)
     * @param {number} duration - ระยะเวลา (วินาที)
     */
    createCameraMovement(intensity = 0.1, speed = 1.0, duration = 2.0) {
        // สร้างเอฟเฟกต์เหมือนกล้องเคลื่อนไหว โดยเปลี่ยนแปลงความแรงและ distortion factor
        
        // ค่าเริ่มต้น
        const originalIntensity = this.intensity;
        
        // กำหนดค่าที่ใช้ในแอนิเมชัน
        intensity = Math.min(Math.max(intensity, 0), 0.3);
        
        // สร้างตัวแปรสำหรับการติดตามเวลา
        let elapsedTime = 0;
        
        // ฟังก์ชันอัปเดต
        const updateCameraMovement = (deltaTime) => {
            elapsedTime += deltaTime;
            
            // คำนวณความแรงแบบ sine wave
            const varying = Math.sin(elapsedTime * speed * 5) * intensity;
            
            // อัปเดตค่าความแรง
            if (this.pass && this.pass.material && this.pass.material.uniforms) {
                this.pass.material.uniforms.intensity.value = originalIntensity + varying;
            }
            
            // ตรวจสอบว่าถึงเวลาสิ้นสุดหรือไม่
            if (elapsedTime < duration) {
                // ยังไม่สิ้นสุด เพิ่มการอัปเดตรอบถัดไป
                requestAnimationFrame(() => updateCameraMovement(0.016)); // 60fps
            } else {
                // สิ้นสุดแล้ว กลับไปค่าเดิม
                if (this.pass && this.pass.material && this.pass.material.uniforms) {
                    this.pass.material.uniforms.intensity.value = originalIntensity;
                }
            }
        };
        
        // เริ่มแอนิเมชัน
        updateCameraMovement(0);
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