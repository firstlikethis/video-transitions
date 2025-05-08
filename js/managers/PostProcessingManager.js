/**
 * PostProcessingManager.js
 * จัดการเอฟเฟกต์หลังการเรนเดอร์ทั้งหมด เช่น bloom, chromatic aberration, และ lens distortion
 * ปรับแต่งเอฟเฟกต์ตามฉาก ควบคุมเอฟเฟกต์พิเศษระหว่างการเปลี่ยนฉาก และปรับคุณภาพตามระดับประสิทธิภาพ
 */
class PostProcessingManager {
    /**
     * สร้าง PostProcessingManager
     * @param {THREE.WebGLRenderer} renderer - renderer หลักของแอพพลิเคชัน
     * @param {THREE.Scene} scene - scene หลักของแอพพลิเคชัน
     * @param {THREE.Camera} camera - camera หลักของแอพพลิเคชัน
     */
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        
        // สร้าง effect composer สำหรับการรวมเอฟเฟกต์
        this.composer = new THREE.EffectComposer(this.renderer);
        
        // เก็บ passes ทั้งหมด
        this.passes = {};
        
        // เก็บเอฟเฟกต์เสริม
        this.effects = {};
        
        // เตรียมเอฟเฟกต์พื้นฐาน
        this.setupBasicPasses();
        
        // เตรียมเอฟเฟกต์ขั้นสูง
        this.setupAdvancedEffects();
    }
    
    /**
     * ตั้งค่า passes พื้นฐาน
     */
    setupBasicPasses() {
        // สร้าง render pass หลักสำหรับการเรนเดอร์ scene
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        this.passes.render = renderPass;
        
        // สร้าง bloom pass สำหรับแสงเรือง
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5,  // strength
            0.4,  // radius
            0.85  // threshold
        );
        this.composer.addPass(bloomPass);
        this.passes.bloom = bloomPass;
        
        // สร้าง FXAA anti-aliasing pass
        const fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
        fxaaPass.material.uniforms.resolution.value.set(
            1 / window.innerWidth, 
            1 / window.innerHeight
        );
        this.composer.addPass(fxaaPass);
        this.passes.fxaa = fxaaPass;
        
        // สร้าง film grain pass
        const filmPass = new THREE.FilmPass(
            0.25,  // noise intensity
            0.025, // scanline intensity
            648,   // scanline count
            false  // grayscale
        );
        filmPass.renderToScreen = true;
        this.composer.addPass(filmPass);
        this.passes.film = filmPass;
        
        // ทำให้ pass สุดท้ายเรนเดอร์ไปที่หน้าจอ
        filmPass.renderToScreen = true;
    }
    
    /**
     * ตั้งค่าเอฟเฟกต์ขั้นสูง
     */
    setupAdvancedEffects() {
        // ตั้งค่าเอฟเฟกต์ chromatic aberration
        const chromaticAberrationEffect = new ChromaticAberrationEffect();
        const chromaticAberrationPass = chromaticAberrationEffect.getPass();
        this.composer.addPass(chromaticAberrationPass);
        this.passes.chromaticAberration = chromaticAberrationPass;
        this.effects.chromaticAberration = chromaticAberrationEffect;
        
        // ตั้งค่าเอฟเฟกต์ lens distortion
        const lensDistortionEffect = new LensDistortionEffect();
        const lensDistortionPass = lensDistortionEffect.getPass();
        this.composer.addPass(lensDistortionPass);
        this.passes.lensDistortion = lensDistortionPass;
        this.effects.lensDistortion = lensDistortionEffect;
        
        // ตั้งค่าเริ่มต้น - ปิดเอฟเฟกต์พิเศษ
        this.passes.chromaticAberration.enabled = false;
        this.passes.lensDistortion.enabled = false;
    }
    
    /**
     * ปรับขนาดของเอฟเฟกต์เมื่อขนาดหน้าจอเปลี่ยน
     * @param {number} width - ความกว้างใหม่
     * @param {number} height - ความสูงใหม่
     */
    resize(width, height) {
        // ปรับขนาด composer
        this.composer.setSize(width, height);
        
        // ปรับ resolution ของ FXAA
        if (this.passes.fxaa) {
            this.passes.fxaa.material.uniforms.resolution.value.set(1 / width, 1 / height);
        }
        
        // ปรับขนาดของ bloom
        if (this.passes.bloom) {
            this.passes.bloom.resolution.set(width, height);
        }
        
        // ปรับขนาดของเอฟเฟกต์พิเศษ
        if (this.effects.chromaticAberration) {
            this.effects.chromaticAberration.resize(width, height);
        }
        
        if (this.effects.lensDistortion) {
            this.effects.lensDistortion.resize(width, height);
        }
    }
    
    /**
     * เรนเดอร์ฉากด้วยเอฟเฟกต์
     */
    render() {
        this.composer.render();
    }
    
    /**
     * ปิดเอฟเฟกต์ทั้งหมด
     */
    disableEffects() {
        // ปิด bloom
        if (this.passes.bloom) {
            this.passes.bloom.enabled = false;
        }
        
        // ปิด film grain
        if (this.passes.film) {
            this.passes.film.enabled = false;
        }
        
        // ปิดเอฟเฟกต์ขั้นสูง
        if (this.passes.chromaticAberration) {
            this.passes.chromaticAberration.enabled = false;
        }
        
        if (this.passes.lensDistortion) {
            this.passes.lensDistortion.enabled = false;
        }
    }
    
    /**
     * ปรับแต่งคุณภาพของเอฟเฟกต์ตามระดับประสิทธิภาพ
     * @param {string} qualityLevel - ระดับคุณภาพ ('LOW', 'MEDIUM', 'HIGH')
     */
    adjustQuality(qualityLevel) {
        // ปรับคุณภาพ bloom
        if (this.passes.bloom) {
            switch (qualityLevel) {
                case 'LOW':
                    this.passes.bloom.enabled = true;
                    this.passes.bloom.strength = 0.3;
                    this.passes.bloom.radius = 0.3;
                    this.passes.bloom.threshold = 0.9;
                    break;
                case 'MEDIUM':
                    this.passes.bloom.enabled = true;
                    this.passes.bloom.strength = 0.4;
                    this.passes.bloom.radius = 0.4;
                    this.passes.bloom.threshold = 0.85;
                    break;
                case 'HIGH':
                    this.passes.bloom.enabled = true;
                    this.passes.bloom.strength = 0.5;
                    this.passes.bloom.radius = 0.4;
                    this.passes.bloom.threshold = 0.85;
                    break;
            }
        }
        
        // ปรับคุณภาพ film grain
        if (this.passes.film) {
            switch (qualityLevel) {
                case 'LOW':
                    this.passes.film.enabled = true;
                    this.passes.film.uniforms.nIntensity.value = 0.15;
                    this.passes.film.uniforms.sIntensity.value = 0.015;
                    break;
                case 'MEDIUM':
                    this.passes.film.enabled = true;
                    this.passes.film.uniforms.nIntensity.value = 0.2;
                    this.passes.film.uniforms.sIntensity.value = 0.02;
                    break;
                case 'HIGH':
                    this.passes.film.enabled = true;
                    this.passes.film.uniforms.nIntensity.value = 0.25;
                    this.passes.film.uniforms.sIntensity.value = 0.025;
                    break;
            }
        }
        
        // ปรับคุณภาพเอฟเฟกต์ขั้นสูง - เปิดใช้งานเฉพาะคุณภาพสูง
        this.passes.chromaticAberration.enabled = qualityLevel === 'HIGH';
        this.passes.lensDistortion.enabled = qualityLevel === 'HIGH';
        
        // ปรับความแรงของเอฟเฟกต์
        if (this.effects.chromaticAberration) {
            this.effects.chromaticAberration.setIntensity(qualityLevel === 'HIGH' ? 0.005 : 0);
        }
        
        if (this.effects.lensDistortion) {
            this.effects.lensDistortion.setIntensity(qualityLevel === 'HIGH' ? 0.05 : 0);
        }
    }
    
    /**
     * ตั้งค่าเอฟเฟกต์ตามฉาก
     * @param {number} sceneIndex - ดัชนีของฉาก
     * @param {number} duration - ระยะเวลาการเปลี่ยน (วินาที)
     */
    setSceneEffects(sceneIndex, duration = 1.0) {
        switch (sceneIndex) {
            case CONSTANTS.SCENES.EARTH:
                this.setEarthEffects(duration);
                break;
                
            case CONSTANTS.SCENES.URANUS:
                this.setUranusEffects(duration);
                break;
                
            case CONSTANTS.SCENES.GALAXY:
                this.setGalaxyEffects(duration);
                break;
                
            case CONSTANTS.SCENES.BLACK_HOLE:
                this.setBlackHoleEffects(duration);
                break;
        }
    }
    
    /**
     * ตั้งค่าเอฟเฟกต์สำหรับโลก
     * @param {number} duration - ระยะเวลาการเปลี่ยน (วินาที)
     */
    setEarthEffects(duration) {
        // ปรับ bloom
        this.animatePass(this.passes.bloom, {
            strength: 0.3,
            radius: 0.3,
            threshold: 0.85
        }, duration);
        
        // ปรับ film grain
        this.animateFilm({
            nIntensity: 0.15,  // noise intensity
            sIntensity: 0.015  // scanline intensity
        }, duration);
        
        // ปิดเอฟเฟกต์พิเศษ
        this.setAdvancedEffects(false, duration);
    }
    
    /**
     * ตั้งค่าเอฟเฟกต์สำหรับยูเรนัส
     * @param {number} duration - ระยะเวลาการเปลี่ยน (วินาที)
     */
    setUranusEffects(duration) {
        // ปรับ bloom
        this.animatePass(this.passes.bloom, {
            strength: 0.5,
            radius: 0.4,
            threshold: 0.7
        }, duration);
        
        // ปรับ film grain
        this.animateFilm({
            nIntensity: 0.2,   // noise intensity
            sIntensity: 0.02   // scanline intensity
        }, duration);
        
        // เปิดเอฟเฟกต์พิเศษแบบอ่อนๆ
        this.setAdvancedEffects(true, duration, 0.005, 0.07);
    }
    
    /**
     * ตั้งค่าเอฟเฟกต์สำหรับกาแล็กซี่
     * @param {number} duration - ระยะเวลาการเปลี่ยน (วินาที)
     */
    setGalaxyEffects(duration) {
        // ปรับ bloom
        this.animatePass(this.passes.bloom, {
            strength: 0.7,
            radius: 0.5,
            threshold: 0.6
        }, duration);
        
        // ปรับ film grain
        this.animateFilm({
            nIntensity: 0.25,  // noise intensity
            sIntensity: 0.03   // scanline intensity
        }, duration);
        
        // เปิดเอฟเฟกต์พิเศษแบบเห็นได้ชัด
        this.setAdvancedEffects(true, duration, 0.01, 0.1);
    }
    
    /**
     * ตั้งค่าเอฟเฟกต์สำหรับหลุมดำ
     * @param {number} duration - ระยะเวลาการเปลี่ยน (วินาที)
     */
    setBlackHoleEffects(duration) {
        // ปรับ bloom
        this.animatePass(this.passes.bloom, {
            strength: 0.9,
            radius: 0.7,
            threshold: 0.5
        }, duration);
        
        // ปรับ film grain
        this.animateFilm({
            nIntensity: 0.35,  // noise intensity
            sIntensity: 0.04   // scanline intensity
        }, duration);
        
        // เปิดเอฟเฟกต์พิเศษแบบรุนแรง
        this.setAdvancedEffects(true, duration, 0.02, 0.15);
    }
    
    /**
     * เพิ่มเอฟเฟกต์พิเศษสำหรับการเปลี่ยนฉาก
     * @param {number} fromIndex - ดัชนีฉากปัจจุบัน
     * @param {number} toIndex - ดัชนีฉากที่ต้องการไป
     * @param {number} duration - ระยะเวลาการเปลี่ยน (วินาที)
     */
    addTransitionEffect(fromIndex, toIndex, duration) {
        // เพิ่มเอฟเฟกต์การบิดเบือน (distortion) ชั่วคราว
        if (this.effects.lensDistortion) {
            // เพิ่มระดับความแรงแบบชั่วคราว
            this.effects.lensDistortion.animate(0.25, duration * 0.3, () => {
                // ลดระดับกลับสู่ปกติ
                this.effects.lensDistortion.animate(0.05, duration * 0.7);
            });
        }
        
        // เพิ่มเอฟเฟกต์ความผิดเพี้ยนของสี (chromatic aberration) ชั่วคราว
        if (this.effects.chromaticAberration) {
            // เพิ่มระดับความแรงแบบชั่วคราว
            this.effects.chromaticAberration.animate(0.03, duration * 0.3, () => {
                // ลดระดับกลับสู่ปกติ
                this.effects.chromaticAberration.animate(0.01, duration * 0.7);
            });
        }
        
        // เพิ่มความเข้มของ bloom ชั่วคราว
        if (this.passes.bloom) {
            const originalStrength = this.passes.bloom.strength;
            
            gsap.to(this.passes.bloom, {
                strength: originalStrength * 1.5,
                duration: duration * 0.3,
                ease: "power2.in",
                onComplete: () => {
                    gsap.to(this.passes.bloom, {
                        strength: originalStrength,
                        duration: duration * 0.7,
                        ease: "power2.out"
                    });
                }
            });
        }
        
        // ปรับเอฟเฟกต์พิเศษสำหรับการเปลี่ยนไปยังหลุมดำ
        if (toIndex === CONSTANTS.SCENES.BLACK_HOLE) {
            this.addBlackHoleTransitionEffects(duration);
        }
        
        // ปรับเอฟเฟกต์พิเศษเมื่อออกจากหลุมดำ
        if (fromIndex === CONSTANTS.SCENES.BLACK_HOLE) {
            this.addExitBlackHoleEffects(duration);
        }
    }
    
    /**
     * เพิ่มเอฟเฟกต์พิเศษเมื่อเปลี่ยนไปยังหลุมดำ
     * @param {number} duration - ระยะเวลาการเปลี่ยน (วินาที)
     */
    addBlackHoleTransitionEffects(duration) {
        // เพิ่ม aberration อย่างรุนแรงและเร็ว
        if (this.effects.chromaticAberration) {
            this.effects.chromaticAberration.animate(0.1, duration * 0.2, () => {
                // ลดลงอย่างช้าๆ
                this.effects.chromaticAberration.animate(0.02, duration * 0.8);
            });
        }
        
        // เพิ่ม distortion อย่างรุนแรง
        if (this.effects.lensDistortion) {
            this.effects.lensDistortion.animate(0.4, duration * 0.3, () => {
                this.effects.lensDistortion.animate(0.15, duration * 0.7);
            });
        }
        
        // เพิ่ม bloom อย่างมาก
        if (this.passes.bloom) {
            gsap.to(this.passes.bloom, {
                strength: 1.5,
                radius: 1.0,
                threshold: 0.3,
                duration: duration * 0.3,
                ease: "power3.in",
                onComplete: () => {
                    gsap.to(this.passes.bloom, {
                        strength: 0.9,
                        radius: 0.7,
                        threshold: 0.5,
                        duration: duration * 0.7,
                        ease: "power2.out"
                    });
                }
            });
        }
        
        // เพิ่ม noise ชั่วคราว
        if (this.passes.film) {
            const originalNoise = this.passes.film.uniforms.nIntensity.value;
            
            gsap.to(this.passes.film.uniforms.nIntensity, {
                value: 0.8,
                duration: duration * 0.2,
                ease: "power3.in",
                onComplete: () => {
                    gsap.to(this.passes.film.uniforms.nIntensity, {
                        value: 0.35,
                        duration: duration * 0.8,
                        ease: "power2.out"
                    });
                }
            });
        }
    }
    
    /**
     * เพิ่มเอฟเฟกต์พิเศษเมื่อออกจากหลุมดำ
     * @param {number} duration - ระยะเวลาการเปลี่ยน (วินาที)
     */
    addExitBlackHoleEffects(duration) {
        // ค่อยๆ ปรับลดเอฟเฟกต์ทั้งหมด
        
        // ลด chromatic aberration
        if (this.effects.chromaticAberration) {
            this.effects.chromaticAberration.animate(0.07, duration * 0.3, () => {
                this.effects.chromaticAberration.animate(0.01, duration * 0.7);
            });
        }
        
        // ลด distortion
        if (this.effects.lensDistortion) {
            this.effects.lensDistortion.animate(0.25, duration * 0.2, () => {
                this.effects.lensDistortion.animate(0.05, duration * 0.8);
            });
        }
        
        // ปรับ bloom
        if (this.passes.bloom) {
            gsap.to(this.passes.bloom, {
                strength: 1.2,
                radius: 0.8,
                threshold: 0.4,
                duration: duration * 0.2,
                ease: "power2.in",
                onComplete: () => {
                    gsap.to(this.passes.bloom, {
                        strength: 0.5,
                        radius: 0.4,
                        threshold: 0.7,
                        duration: duration * 0.8,
                        ease: "power2.out"
                    });
                }
            });
        }
        
        // เพิ่ม flash ขาวตอนเริ่มต้น
        if (this.passes.film) {
            // บันทึกค่าเดิม
            const originalSIntensity = this.passes.film.uniforms.sIntensity.value;
            const originalNIntensity = this.passes.film.uniforms.nIntensity.value;
            
            // เพิ่มค่า scanline intensity อย่างรวดเร็ว
            gsap.to(this.passes.film.uniforms.sIntensity, {
                value: 1.0,
                duration: duration * 0.1,
                ease: "power3.in",
                onComplete: () => {
                    gsap.to(this.passes.film.uniforms.sIntensity, {
                        value: originalSIntensity,
                        duration: duration * 0.9,
                        ease: "power2.out"
                    });
                }
            });
            
            // เพิ่มค่า noise intensity
            gsap.to(this.passes.film.uniforms.nIntensity, {
                value: 0.7,
                duration: duration * 0.15,
                ease: "power3.in",
                onComplete: () => {
                    gsap.to(this.passes.film.uniforms.nIntensity, {
                        value: originalNIntensity,
                        duration: duration * 0.85,
                        ease: "power2.out"
                    });
                }
            });
        }
    }
    
    /**
     * เปิด/ปิดและปรับค่าเอฟเฟกต์ขั้นสูง
     * @param {boolean} enabled - เปิดใช้งานหรือไม่
     * @param {number} duration - ระยะเวลาการเปลี่ยน (วินาที)
     * @param {number} chromaticIntensity - ความแรงของเอฟเฟกต์ chromatic aberration
     * @param {number} distortionIntensity - ความแรงของเอฟเฟกต์ distortion
     */
    setAdvancedEffects(enabled, duration, chromaticIntensity = 0.01, distortionIntensity = 0.1) {
        // เปิด/ปิด passes
        this.passes.chromaticAberration.enabled = enabled;
        this.passes.lensDistortion.enabled = enabled;
        
        if (enabled) {
            // ปรับค่าความแรงของเอฟเฟกต์
            if (this.effects.chromaticAberration) {
                this.effects.chromaticAberration.animate(chromaticIntensity, duration);
            }
            
            if (this.effects.lensDistortion) {
                this.effects.lensDistortion.animate(distortionIntensity, duration);
            }
        }
    }
    
    /**
     * แอนิเมชันค่าของ pass ด้วย GSAP
     * @param {THREE.Pass} pass - pass ที่ต้องการแอนิเมชัน
     * @param {Object} targetValues - ค่าเป้าหมาย
     * @param {number} duration - ระยะเวลา (วินาที)
     */
    animatePass(pass, targetValues, duration) {
        gsap.to(pass, {
            ...targetValues,
            duration: duration,
            ease: "power2.inOut"
        });
    }
    
    /**
     * แอนิเมชันค่าของ film pass ด้วย GSAP
     * @param {Object} targetValues - ค่าเป้าหมาย
     * @param {number} duration - ระยะเวลา (วินาที)
     */
    animateFilm(targetValues, duration) {
        if (!this.passes.film) return;
        
        // แอนิเมชัน uniforms
        if (targetValues.nIntensity !== undefined) {
            gsap.to(this.passes.film.uniforms.nIntensity, {
                value: targetValues.nIntensity,
                duration: duration,
                ease: "power2.inOut"
            });
        }
        
        if (targetValues.sIntensity !== undefined) {
            gsap.to(this.passes.film.uniforms.sIntensity, {
                value: targetValues.sIntensity,
                duration: duration,
                ease: "power2.inOut"
            });
        }
    }
    
    /**
     * ล้างทรัพยากรเมื่อเลิกใช้งาน
     */
    dispose() {
        // ล้าง passes
        for (const key in this.passes) {
            const pass = this.passes[key];
            if (pass.dispose && typeof pass.dispose === 'function') {
                pass.dispose();
            }
        }
        
        // ล้าง effects
        for (const key in this.effects) {
            const effect = this.effects[key];
            if (effect.dispose && typeof effect.dispose === 'function') {
                effect.dispose();
            }
        }
        
        // ล้าง composer
        this.composer.renderTarget1.dispose();
        this.composer.renderTarget2.dispose();
    }
}