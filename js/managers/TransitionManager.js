/**
 * TransitionManager.js
 * จัดการการเปลี่ยนฉากระหว่างโลก, ยูเรนัส, กาแล็กซี่, และหลุมดำ
 * รองรับเอฟเฟกต์ transition ที่แตกต่างกันตามแต่ละฉาก
 */
class TransitionManager {
    /**
     * สร้าง TransitionManager 
     * @param {SceneManager} sceneManager - ตัวจัดการฉาก
     * @param {PostProcessingManager} postProcessingManager - ตัวจัดการ post-processing
     * @param {AudioManager} audioManager - ตัวจัดการเสียง
     */
    constructor(sceneManager, postProcessingManager, audioManager) {
        this.sceneManager = sceneManager;
        this.postProcessingManager = postProcessingManager;
        this.audioManager = audioManager;
        
        // เก็บตัวแปรสำหรับเอฟเฟกต์ transition
        this.transitionOverlays = {};
        this.transitionTimelines = {};
        this.transitionEffects = {};
        
        // กำหนดระยะเวลา transition
        this.transitionDuration = CONSTANTS.TRANSITION_DURATION;
    }
    
    /**
     * เปลี่ยนไปยังฉากที่ต้องการ
     * @param {number} fromIndex - ดัชนีฉากปัจจุบัน
     * @param {number} toIndex - ดัชนีฉากที่ต้องการไป
     */
    transitionToScene(fromIndex, toIndex) {
        // ตรวจสอบว่ากำลัง transition อยู่หรือไม่
        if (isTransitioning) return;
        
        console.log(`Transitioning from scene ${fromIndex} to ${toIndex}`);
        isTransitioning = true;
        
        // ทำให้ทั้งสองฉากมองเห็นได้
        if (sceneObjects[fromIndex]) {
            sceneObjects[fromIndex].group.visible = true;
        }
        
        if (sceneObjects[toIndex]) {
            sceneObjects[toIndex].group.visible = true;
        } else {
            console.error(`Scene ${toIndex} does not exist`);
            isTransitioning = false;
            return;
        }
        
        // อัปเดตชื่อฉาก
        const labels = ['Earth', 'Uranus', 'Galaxy', 'Black Hole'];
        const sceneLabel = document.getElementById('scene-label');
        sceneLabel.textContent = labels[toIndex];
        sceneLabel.style.opacity = '1';
        
        // สร้างเอฟเฟกต์ transition ตามฉากที่กำลังเปลี่ยน
        this.createTransitionVisual(fromIndex, toIndex);
        
        // เล่นเสียงการเปลี่ยนฉาก
        if (this.audioManager && this.audioManager.enabled) {
            this.audioManager.playTransitionSound(fromIndex, toIndex);
        }
        
        // แอนิเมชันวัตถุในฉาก
        if (toIndex > fromIndex) {
            // กำลังเคลื่อนที่ไปข้างหน้า
            this.animateForwardTransition(sceneObjects[fromIndex].group, sceneObjects[toIndex].group);
        } else {
            // กำลังเคลื่อนที่ย้อนกลับ
            this.animateBackwardTransition(sceneObjects[fromIndex].group, sceneObjects[toIndex].group);
        }
        
        // เปลี่ยนเอฟเฟกต์ post-processing
        if (this.postProcessingManager) {
            this.postProcessingManager.setSceneEffects(toIndex, this.transitionDuration);
            this.postProcessingManager.addTransitionEffect(fromIndex, toIndex, this.transitionDuration);
        }
        
        // แอนิเมชันกล้อง
        this.animateCamera(fromIndex, toIndex);
        
        // แอนิเมชันแสง
        this.animateLights(toIndex);
        
        // เปลี่ยนเสียงพื้นหลัง
        if (this.audioManager && this.audioManager.enabled) {
            this.audioManager.changeSceneAudio(toIndex);
        }
        
        // กำหนดเวลาสิ้นสุดการ transition
        setTimeout(() => {
            this.completeTransition(fromIndex, toIndex);
        }, this.transitionDuration * 1000);
    }
    
    /**
     * สร้างเอฟเฟกต์ transition visual
     * @param {number} fromIndex - ดัชนีฉากปัจจุบัน
     * @param {number} toIndex - ดัชนีฉากที่ต้องการไป
     */
    createTransitionVisual(fromIndex, toIndex) {
        // สร้างเอฟเฟกต์แตกต่างกันตามฉาก
        const overlay = document.createElement('div');
        overlay.className = 'transition-overlay';
        
        if (toIndex === CONSTANTS.SCENES.BLACK_HOLE) {
            // เอฟเฟกต์พิเศษเมื่อเข้าสู่หลุมดำ
            overlay.classList.add('blackhole-transition');
        } else if (fromIndex === CONSTANTS.SCENES.BLACK_HOLE) {
            // เอฟเฟกต์เมื่อออกจากหลุมดำ
            overlay.classList.add('exit-blackhole');
        } else if (toIndex === CONSTANTS.SCENES.GALAXY) {
            // เอฟเฟกต์เมื่อเข้าสู่กาแล็กซี่
            overlay.classList.add('galaxy-transition');
        } else {
            // เอฟเฟกต์มาตรฐาน
            overlay.classList.add('standard-transition');
        }
        
        document.body.appendChild(overlay);
        this.transitionOverlays[`${fromIndex}-${toIndex}`] = overlay;
        
        // แอนิเมชันเอฟเฟกต์
        const timeline = gsap.timeline();
        
        if (toIndex === CONSTANTS.SCENES.BLACK_HOLE) {
            // เอฟเฟกต์หลุมดำแบบพิเศษ
            timeline.to(overlay, {
                opacity: 0.7,
                duration: this.transitionDuration * 0.4,
                ease: "power2.in"
            }).to(overlay, {
                opacity: 0,
                duration: this.transitionDuration * 0.6,
                ease: "power3.out"
            });
            
            // เพิ่มเอฟเฟกต์ time dilation
            this.addTimeDilationEffect(this.transitionDuration * 0.4);
        } else {
            timeline.to(overlay, {
                opacity: 0.5,
                duration: this.transitionDuration * 0.3,
                ease: "power1.in"
            }).to(overlay, {
                opacity: 0,
                duration: this.transitionDuration * 0.7,
                ease: "power2.out"
            });
        }
        
        this.transitionTimelines[`${fromIndex}-${toIndex}`] = timeline;
    }
    
    /**
     * แอนิเมชัน objects สำหรับ transition ไปข้างหน้า
     * @param {THREE.Group} fromGroup - กลุ่มวัตถุฉากปัจจุบัน
     * @param {THREE.Group} toGroup - กลุ่มวัตถุฉากที่ต้องการไป
     */
    animateForwardTransition(fromGroup, toGroup) {
        // บันทึกตำแหน่งเริ่มต้นของกลุ่มวัตถุ
        const fromPosition = fromGroup.position.clone();
        const toPosition = toGroup.position.clone();
        
        // แอนิเมชันฉากปัจจุบัน - เคลื่อนที่ออกไป
        gsap.to(fromGroup.position, {
            z: -100,
            duration: this.transitionDuration,
            ease: "power3.inOut"
        });
        
        // เพิ่มการหมุนระหว่าง transition
        gsap.to(fromGroup.rotation, {
            x: -0.2,
            y: 0.5,
            z: 0.1,
            duration: this.transitionDuration * 0.7,
            ease: "power2.inOut"
        });
        
        // แอนิเมชันฉากใหม่ - เคลื่อนที่เข้ามา
        toGroup.position.set(0, 0, 100); // ตั้งตำแหน่งเริ่มต้น
        toGroup.rotation.set(0.1, -0.3, 0); // ตั้งการหมุนเริ่มต้น
        
        gsap.to(toGroup.position, {
            x: 0,
            y: 0,
            z: 0,
            duration: this.transitionDuration,
            ease: "power3.inOut"
        });
        
        gsap.to(toGroup.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: this.transitionDuration,
            ease: "power2.inOut"
        });
    }
    
    /**
     * แอนิเมชัน objects สำหรับ transition ย้อนกลับ
     * @param {THREE.Group} fromGroup - กลุ่มวัตถุฉากปัจจุบัน
     * @param {THREE.Group} toGroup - กลุ่มวัตถุฉากที่ต้องการไป
     */
    animateBackwardTransition(fromGroup, toGroup) {
        // แอนิเมชันฉากปัจจุบัน - เคลื่อนที่ออกไป
        gsap.to(fromGroup.position, {
            z: 100,
            duration: this.transitionDuration,
            ease: "power3.inOut"
        });
        
        // เพิ่มการหมุนระหว่าง transition
        gsap.to(fromGroup.rotation, {
            x: 0.3,
            y: -0.2,
            z: 0.1,
            duration: this.transitionDuration * 0.7,
            ease: "power2.inOut"
        });
        
        // แอนิเมชันฉากใหม่ - เคลื่อนที่เข้ามา
        toGroup.position.set(0, 0, -100); // ตั้งตำแหน่งเริ่มต้น
        toGroup.rotation.set(-0.3, 0.2, -0.1); // ตั้งการหมุนเริ่มต้น
        
        gsap.to(toGroup.position, {
            x: 0,
            y: 0,
            z: 0,
            duration: this.transitionDuration,
            ease: "power3.inOut"
        });
        
        gsap.to(toGroup.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: this.transitionDuration,
            ease: "power2.inOut"
        });
    }
    
    /**
     * แอนิเมชันกล้อง
     * @param {number} fromIndex - ดัชนีฉากปัจจุบัน
     * @param {number} toIndex - ดัชนีฉากที่ต้องการไป
     */
    animateCamera(fromIndex, toIndex) {
        const camera = this.sceneManager.camera;
        const cameraPath = this.getCameraPath(fromIndex, toIndex);
        
        let timeline = gsap.timeline();
        
        // แอนิเมชันตามเส้นทางกล้อง
        cameraPath.forEach(point => {
            timeline.to(camera.position, {
                x: point.x,
                y: point.y,
                z: point.z,
                duration: point.duration,
                ease: "power2.inOut"
            });
        });
        
        // เพิ่มการเขย่ากล้องเล็กน้อยสำหรับหลุมดำ
        if (toIndex === CONSTANTS.SCENES.BLACK_HOLE) {
            setTimeout(() => {
                this.addCameraShake(camera, 0.8);
            }, cameraPath[0].duration * 1000);
        }
    }
    
    /**
     * คำนวณเส้นทางกล้องตามฉาก
     * @param {number} fromIndex - ดัชนีฉากปัจจุบัน
     * @param {number} toIndex - ดัชนีฉากที่ต้องการไป
     * @returns {Array} เส้นทางกล้อง
     */
    getCameraPath(fromIndex, toIndex) {
        const cameraPath = [];
        
        // กำหนดเส้นทางและความเร็วตามฉาก
        switch(toIndex) {
            case CONSTANTS.SCENES.EARTH:
                // เส้นทางกล้องสำหรับโลก - วงโคจรรอบโลก
                cameraPath.push(
                    { x: 5, y: 3, z: 20, duration: this.transitionDuration * 0.3 },
                    { x: 2, y: 1, z: 17, duration: this.transitionDuration * 0.3 },
                    { x: 0, y: 0, z: 15, duration: this.transitionDuration * 0.4 }
                );
                break;
                
            case CONSTANTS.SCENES.URANUS:
                // เส้นทางกล้องสำหรับยูเรนัส - โค้งรอบดาว
                cameraPath.push(
                    { x: -5, y: 8, z: 25, duration: this.transitionDuration * 0.3 },
                    { x: -2, y: 5, z: 22, duration: this.transitionDuration * 0.3 },
                    { x: 0, y: 3, z: 20, duration: this.transitionDuration * 0.4 }
                );
                break;
                
            case CONSTANTS.SCENES.GALAXY:
                // เส้นทางกล้องสำหรับกาแล็กซี่ - มุมมองจากด้านบน
                cameraPath.push(
                    { x: 5, y: 12, z: 20, duration: this.transitionDuration * 0.3 },
                    { x: 3, y: 10, z: 17, duration: this.transitionDuration * 0.3 },
                    { x: 2, y: 8, z: 15, duration: this.transitionDuration * 0.4 }
                );
                break;
                
            case CONSTANTS.SCENES.BLACK_HOLE:
                // เส้นทางกล้องสำหรับหลุมดำ - ค่อยๆ ดึงดูดเข้าไป
                cameraPath.push(
                    { x: 2, y: 8, z: 25, duration: this.transitionDuration * 0.2 },
                    { x: 1, y: 7, z: 22, duration: this.transitionDuration * 0.3 },
                    { x: 0, y: 5, z: 20, duration: this.transitionDuration * 0.5 }
                );
                break;
        }
        
        return cameraPath;
    }
    
    /**
     * แอนิเมชันแสง
     * @param {number} toIndex - ดัชนีฉากที่ต้องการไป
     */
    animateLights(toIndex) {
        // ดึงแสงจาก SceneManager
        const lights = {
            ambient: this.sceneManager.ambientLight,
            directional: this.sceneManager.directionalLight,
            blue: this.sceneManager.blueLight,
            purple: this.sceneManager.purpleLight
        };
        
        // ไม่มีแสงให้ปรับแต่ง
        if (!lights.ambient || !lights.directional) return;
        
        // ปรับแสงตามฉาก
        const settings = CONSTANTS.SCENE_SETTINGS[toIndex].lights;
        
        gsap.to(lights.ambient, { intensity: settings.ambient, duration: this.transitionDuration * 0.7 });
        gsap.to(lights.directional, { intensity: settings.directional, duration: this.transitionDuration * 0.7 });
        
        if (lights.blue) {
            gsap.to(lights.blue, { intensity: settings.blue, duration: this.transitionDuration * 0.7 });
        }
        
        if (lights.purple) {
            gsap.to(lights.purple, { intensity: settings.purple, duration: this.transitionDuration * 0.7 });
        }
    }
    
    /**
     * เพิ่มการเขย่ากล้อง
     * @param {THREE.Camera} camera - กล้อง
     * @param {number} duration - ระยะเวลาการเขย่า (วินาที)
     */
    addCameraShake(camera, duration) {
        const originalPosition = camera.position.clone();
        const shakeIntensity = 0.08;
        let elapsedTime = 0;
        
        const shakeInterval = setInterval(() => {
            const deltaTime = 0.016; // ~60fps
            elapsedTime += deltaTime;
            
            // ลดความเข้มข้นเมื่อเวลาผ่านไป
            const fadeOut = 1 - (elapsedTime / duration);
            const intensity = shakeIntensity * fadeOut;
            
            // เขย่าแบบสุ่มที่ค่อยๆ ลดลง
            camera.position.x = originalPosition.x + (Math.random() - 0.5) * intensity;
            camera.position.y = originalPosition.y + (Math.random() - 0.5) * intensity;
            
            // หยุดการเขย่าเมื่อถึงเวลากำหนด
            if (elapsedTime >= duration) {
                clearInterval(shakeInterval);
                
                // กลับสู่ตำแหน่งเดิม
                gsap.to(camera.position, {
                    x: originalPosition.x,
                    y: originalPosition.y,
                    duration: 0.5,
                    ease: "power2.out"
                });
            }
        }, 16);
    }
    
    /**
     * เพิ่มเอฟเฟกต์ time dilation แบบ Interstellar
     * @param {number} delay - ระยะเวลารอก่อนเริ่มเอฟเฟกต์ (วินาที)
     */
    addTimeDilationEffect(delay) {
        // สร้างเอฟเฟกต์ DOM overlay
        const dilationOverlay = document.createElement('div');
        dilationOverlay.className = 'time-dilation-overlay';
        document.body.appendChild(dilationOverlay);
        
        // บันทึกไว้เพื่อลบภายหลัง
        this.transitionEffects.timeDilation = dilationOverlay;
        
        // กำหนดเวลาเริ่มเอฟเฟกต์
        setTimeout(() => {
            // แอนิเมชัน DOM overlay
            gsap.to(dilationOverlay, {
                opacity: 0.7,
                duration: 0.5,
                ease: "power1.in",
                onComplete: () => {
                    // อนิเมชันจางหาย
                    gsap.to(dilationOverlay, {
                        opacity: 0,
                        duration: 2,
                        ease: "power3.out",
                        onComplete: () => {
                            dilationOverlay.remove();
                            delete this.transitionEffects.timeDilation;
                        }
                    });
                }
            });
        }, delay * 1000);
    }
    
    /**
     * ดำเนินการเมื่อการ transition เสร็จสิ้น
     * @param {number} fromIndex - ดัชนีฉากปัจจุบัน
     * @param {number} toIndex - ดัชนีฉากที่ต้องการไป
     */
    completeTransition(fromIndex, toIndex) {
        // ซ่อนฉากเดิม
        if (sceneObjects[fromIndex]) {
            sceneObjects[fromIndex].group.visible = false;
        }
        
        // ทำความสะอาดทรัพยากร transition
        this.cleanupTransition(fromIndex, toIndex);
        
        // อัปเดตฉากปัจจุบัน
        currentScene = toIndex;
        isTransitioning = false;
        
        // เริ่มการเปลี่ยนฉากอัตโนมัติสำหรับฉากถัดไป
        if (autoTransitionEnabled) {
            startAutomaticTransition();
        }
    }
    
    /**
     * ทำความสะอาดทรัพยากร transition
     * @param {number} fromIndex - ดัชนีฉากปัจจุบัน
     * @param {number} toIndex - ดัชนีฉากที่ต้องการไป
     */
    cleanupTransition(fromIndex, toIndex) {
        // ลบ overlay
        const overlayKey = `${fromIndex}-${toIndex}`;
        if (this.transitionOverlays[overlayKey]) {
            this.transitionOverlays[overlayKey].remove();
            delete this.transitionOverlays[overlayKey];
        }
        
        // ล้าง timeline
        if (this.transitionTimelines[overlayKey]) {
            this.transitionTimelines[overlayKey].kill();
            delete this.transitionTimelines[overlayKey];
        }
        
        // ล้างเอฟเฟกต์อื่นๆ
        for (const key in this.transitionEffects) {
            if (this.transitionEffects[key].parentNode) {
                this.transitionEffects[key].remove();
            }
            delete this.transitionEffects[key];
        }
    }
}