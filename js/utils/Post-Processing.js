class PostProcessingManager {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        
        // สร้าง composer สำหรับ post-processing
        this.composer = new THREE.EffectComposer(this.renderer);
        
        // เพิ่ม render pass พื้นฐาน
        this.renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        
        // เตรียม passes ต่างๆ
        this.setupPasses();
        
        // ตั้งค่าเริ่มต้น
        this.defaultSettings();
        
        // ปรับขนาดและ parameters ตามอุปกรณ์
        this.adaptToDevice();
        
        // เก็บการตั้งค่าสำหรับแต่ละฉาก
        this.sceneSettings = {};
        this.setupSceneSettings();
    }
    
    setupPasses() {
        // Bloom effect - เพิ่มแสงเรืองรอบวัตถุสว่าง
        this.bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.8,  // strength
            0.3,  // radius
            0.7   // threshold
        );
        this.composer.addPass(this.bloomPass);
        
        // Film grain effect - เพิ่มเม็ดฟิล์มเพื่อความสมจริง
        this.filmPass = new THREE.FilmPass(
            0.2,  // noise intensity
            0.025,  // scanline intensity
            648,    // scanline count
            false   // grayscale
        );
        this.composer.addPass(this.filmPass);
        
        // FXAA anti-aliasing - ลดขอบหยัก
        this.fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
        this.fxaaPass.uniforms['resolution'].value.set(
            1 / (window.innerWidth * window.devicePixelRatio),
            1 / (window.innerHeight * window.devicePixelRatio)
        );
        this.composer.addPass(this.fxaaPass);
        
        // Vignette effect - เพิ่มขอบมืดตรงมุมภาพ
        this.vignettePass = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                offset: { value: 1.0 },
                darkness: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float offset;
                uniform float darkness;
                varying vec2 vUv;
                
                void main() {
                    // คำนวณตำแหน่งจากศูนย์กลาง
                    vec2 uv = (vUv - 0.5) * 2.0;
                    float vignetteAmount = 1.0 - dot(uv, uv) * offset;
                    vignetteAmount = pow(vignetteAmount, darkness);
                    
                    vec4 sourceColor = texture2D(tDiffuse, vUv);
                    gl_FragColor = vec4(sourceColor.rgb * vignetteAmount, sourceColor.a);
                }
            `
        });
        this.composer.addPass(this.vignettePass);
        
        // Chromatic aberration - เพิ่มความผิดเพี้ยนของสี
        this.chromaticAberrationPass = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: 0.003 },
                angle: { value: Math.PI * 0.5 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                uniform float angle;
                varying vec2 vUv;
                
                void main() {
                    vec2 offset = amount * vec2(cos(angle), sin(angle));
                    vec4 cr = texture2D(tDiffuse, vUv + offset);
                    vec4 cg = texture2D(tDiffuse, vUv);
                    vec4 cb = texture2D(tDiffuse, vUv - offset);
                    
                    gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a);
                }
            `
        });
        this.composer.addPass(this.chromaticAberrationPass);
        
        // Gamma correction - ปรับแก้ความสว่าง
        this.gammaCorrectionPass = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                gamma: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float gamma;
                varying vec2 vUv;
                
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    gl_FragColor = vec4(pow(color.rgb, vec3(1.0 / gamma)), color.a);
                }
            `
        });
        this.composer.addPass(this.gammaCorrectionPass);
        
        // ตั้งค่าให้ pass สุดท้ายเป็นตัวแสดงผล
        this.gammaCorrectionPass.renderToScreen = true;
    }
    
    defaultSettings() {
        // ตั้งค่าเริ่มต้นที่ดูดี
        this.bloomPass.strength = 0.8;
        this.bloomPass.radius = 0.3;
        this.bloomPass.threshold = 0.7;
        
        this.filmPass.uniforms.nIntensity.value = 0.2;
        this.filmPass.uniforms.sIntensity.value = 0.025;
        
        this.vignettePass.uniforms.offset.value = 1.0;
        this.vignettePass.uniforms.darkness.value = 1.0;
        
        this.chromaticAberrationPass.uniforms.amount.value = 0.003;
        
        this.gammaCorrectionPass.uniforms.gamma.value = 1.0;
    }
    
    adaptToDevice() {
        // ตรวจสอบประสิทธิภาพของอุปกรณ์
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowPower = this.detectLowPowerDevice();
        
        if (isMobile || isLowPower) {
            // ลดคุณภาพสำหรับอุปกรณ์ประสิทธิภาพต่ำ
            this.bloomPass.strength = 0.5;
            this.bloomPass.radius = 0.2;
            
            this.filmPass.uniforms.nIntensity.value = 0.1;
            this.filmPass.uniforms.sIntensity.value = 0.01;
            
            // ปิด passes บางตัวเพื่อเพิ่มประสิทธิภาพ
            if (isLowPower) {
                this.bloomPass.enabled = false;
                this.chromaticAberrationPass.enabled = false;
            }
        } else {
            // เพิ่มคุณภาพสำหรับอุปกรณ์ประสิทธิภาพสูง
            this.bloomPass.strength = 1.0;
            this.bloomPass.radius = 0.4;
            
            this.filmPass.uniforms.nIntensity.value = 0.2;
            this.filmPass.uniforms.sIntensity.value = 0.03;
            
            this.chromaticAberrationPass.uniforms.amount.value = 0.005;
        }
    }
    
    detectLowPowerDevice() {
        // ตรวจสอบอุปกรณ์ประสิทธิภาพต่ำ
        const isSmallScreen = window.innerWidth < 768;
        const isSlowConnection = navigator.connection && (navigator.connection.effectiveType === '2g' || navigator.connection.effectiveType === '3g');
        const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
        
        // ตรวจสอบแบตเตอรี่
        let isLowBattery = false;
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                isLowBattery = battery.level < 0.2 && !battery.charging;
            }).catch(() => {});
        }
        
        return isSmallScreen && (isSlowConnection || hasLowMemory || isLowBattery);
    }
    
    setupSceneSettings() {
        // ตั้งค่าเฉพาะสำหรับแต่ละฉาก
        
        // โลก
        this.sceneSettings[SCENES.EARTH] = {
            bloom: { strength: 0.7, radius: 0.3, threshold: 0.7 },
            vignette: { offset: 1.0, darkness: 1.0 },
            chromaticAberration: { amount: 0.002 },
            gamma: { value: 1.0 }
        };
        
        // ยูเรนัส
        this.sceneSettings[SCENES.URANUS] = {
            bloom: { strength: 0.9, radius: 0.4, threshold: 0.6 },
            vignette: { offset: 1.1, darkness: 1.2 },
            chromaticAberration: { amount: 0.003 },
            gamma: { value: 0.9 }
        };
        
        // กาแล็กซี่
        this.sceneSettings[SCENES.GALAXY] = {
            bloom: { strength: 1.2, radius: 0.5, threshold: 0.5 },
            vignette: { offset: 1.2, darkness: 1.4 },
            chromaticAberration: { amount: 0.004 },
            gamma: { value: 0.85 }
        };
        
        // หลุมดำ
        this.sceneSettings[SCENES.BLACK_HOLE] = {
            bloom: { strength: 1.5, radius: 0.6, threshold: 0.4 },
            vignette: { offset: 1.5, darkness: 1.7 },
            chromaticAberration: { amount: 0.008 },
            gamma: { value: 0.8 }
        };
    }
    
    // เปลี่ยนการตั้งค่าตามฉาก
    setSceneEffects(sceneIndex, transitionDuration = 2.0) {
        if (!this.sceneSettings[sceneIndex]) return;
        
        const settings = this.sceneSettings[sceneIndex];
        
        // ใช้ GSAP เพื่อการเปลี่ยนแปลงอย่างนุ่มนวล
        gsap.to(this.bloomPass, {
            strength: settings.bloom.strength,
            radius: settings.bloom.radius,
            threshold: settings.bloom.threshold,
            duration: transitionDuration,
            ease: "power2.inOut"
        });
        
        gsap.to(this.vignettePass.uniforms.offset, {
            value: settings.vignette.offset,
            duration: transitionDuration,
            ease: "power2.inOut"
        });
        
        gsap.to(this.vignettePass.uniforms.darkness, {
            value: settings.vignette.darkness,
            duration: transitionDuration, 
            ease: "power2.inOut"
        });
        
        gsap.to(this.chromaticAberrationPass.uniforms.amount, {
            value: settings.chromaticAberration.amount,
            duration: transitionDuration,
            ease: "power2.inOut"
        });
        
        gsap.to(this.gammaCorrectionPass.uniforms.gamma, {
            value: settings.gamma.value,
            duration: transitionDuration,
            ease: "power2.inOut"
        });
    }
    
    // เพิ่มเอฟเฟกต์พิเศษสำหรับการเปลี่ยนฉาก
    addTransitionEffect(fromIndex, toIndex, duration) {
        // เพิ่มความแรงของเอฟเฟกต์ชั่วคราวระหว่างการเปลี่ยนฉาก
        
        // เพิ่ม chromatic aberration ระหว่างการเปลี่ยนฉาก
        const originalAberration = this.chromaticAberrationPass.uniforms.amount.value;
        const peakAberration = originalAberration * 5;
        
        gsap.to(this.chromaticAberrationPass.uniforms.amount, {
            value: peakAberration,
            duration: duration * 0.3,
            ease: "power2.in",
            onComplete: () => {
                gsap.to(this.chromaticAberrationPass.uniforms.amount, {
                    value: originalAberration * 2,
                    duration: duration * 0.7,
                    ease: "power2.out"
                });
            }
        });
        
        // เพิ่ม bloom ระหว่างการเปลี่ยนฉาก
        const originalBloomStrength = this.bloomPass.strength;
        const peakBloomStrength = originalBloomStrength * 3;
        
        gsap.to(this.bloomPass, {
            strength: peakBloomStrength,
            duration: duration * 0.3,
            ease: "power2.in",
            onComplete: () => {
                gsap.to(this.bloomPass, {
                    strength: originalBloomStrength * 1.5,
                    duration: duration * 0.7,
                    ease: "power2.out"
                });
            }
        });
        
        // เปลี่ยนเอฟเฟกต์พิเศษตามฉากที่เปลี่ยน
        if (toIndex === SCENES.BLACK_HOLE) {
            // เอฟเฟกต์พิเศษเมื่อเข้าสู่หลุมดำ
            this.addBlackHoleTransitionEffect(duration);
        } else if (fromIndex === SCENES.BLACK_HOLE) {
            // เอฟเฟกต์พิเศษเมื่อออกจากหลุมดำ
            this.addExitBlackHoleTransitionEffect(duration);
        }
    }
    
    // เอฟเฟกต์พิเศษสำหรับการเข้าสู่หลุมดำ
    addBlackHoleTransitionEffect(duration) {
        // เพิ่ม radial blur ชั่วคราว
        const radialBlurPass = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                center: { value: new THREE.Vector2(0.5, 0.5) },
                strength: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 center;
                uniform float strength;
                varying vec2 vUv;
                
                void main() {
                    vec2 uv = vUv;
                    vec2 dir = uv - center;
                    float dist = length(dir);
                    
                    // ทำให้เกิดความบิดเบือนแบบวงกลม
                    float factor = strength * dist;
                    vec2 offset = normalize(dir) * factor * factor;
                    
                    vec4 color = vec4(0.0);
                    
                    // ผสมหลายตัวอย่างเพื่อสร้างเอฟเฟกต์เบลอ
                    const int samples = 10;
                    for(int i = 0; i < samples; i++) {
                        float t = float(i) / float(samples - 1);
                        vec2 sampleUv = uv - offset * t;
                        color += texture2D(tDiffuse, sampleUv);
                    }
                    
                    color /= float(samples);
                    gl_FragColor = color;
                }
            `
        });
        
        // เพิ่ม pass ชั่วคราว
        this.composer.addPass(radialBlurPass);
        
        // แอนิเมชันความแรงของเอฟเฟกต์
        gsap.to(radialBlurPass.uniforms.strength, {
            value: 0.5,
            duration: duration * 0.4,
            ease: "power2.in",
            onComplete: () => {
                gsap.to(radialBlurPass.uniforms.strength, {
                    value: 0.0,
                    duration: duration * 0.6,
                    ease: "power2.out",
                    onComplete: () => {
                        // ลบ pass ออกเมื่อเสร็จสิ้น
                        this.composer.removePass(radialBlurPass);
                    }
                });
            }
        });
    }
    
    // เอฟเฟกต์พิเศษสำหรับการออกจากหลุมดำ
    addExitBlackHoleTransitionEffect(duration) {
        // เพิ่ม brightness flash ชั่วคราว
        const brightnessPass = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                brightness: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float brightness;
                varying vec2 vUv;
                
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    gl_FragColor = vec4(color.rgb * brightness, color.a);
                }
            `
        });
        
        // เพิ่ม pass ชั่วคราว
        this.composer.addPass(brightnessPass);
        
        // แอนิเมชันความสว่าง
        gsap.to(brightnessPass.uniforms.brightness, {
            value: 5.0,
            duration: duration * 0.2,
            ease: "power2.in",
            onComplete: () => {
                gsap.to(brightnessPass.uniforms.brightness, {
                    value: 1.0,
                    duration: duration * 0.8,
                    ease: "power2.out",
                    onComplete: () => {
                        // ลบ pass ออกเมื่อเสร็จสิ้น
                        this.composer.removePass(brightnessPass);
                    }
                });
            }
        });
    }
    
    // ปรับขนาดเมื่อหน้าจอเปลี่ยนขนาด
    resize(width, height) {
        this.composer.setSize(width, height);
        
        // อัปเดต parameters ที่ขึ้นกับขนาดหน้าจอ
        this.fxaaPass.uniforms['resolution'].value.set(
            1 / (width * window.devicePixelRatio),
            1 / (height * window.devicePixelRatio)
        );
        
        this.bloomPass.resolution = new THREE.Vector2(width, height);
    }
    
    // เรนเดอร์ scene ด้วย composer
    render() {
        this.composer.render();
    }
}