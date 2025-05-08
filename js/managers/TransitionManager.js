class TransitionManager {
    constructor() {
        // เก็บตัวแปรสำหรับเอฟเฟกต์ transition
        this.transitionOverlays = {};
        this.transitionTimelines = {};
        this.transitionSounds = {};
    }
    
    // การ transition หลักระหว่างฉาก
    performTransition(fromGroup, toGroup, fromIndex, toIndex, camera, lights, sceneLabel, onCompleteCallback) {
        if (isTransitioning) return;
        
        isTransitioning = true;
        
        // ทำให้ทั้งสองฉากมองเห็นได้
        fromGroup.visible = true;
        toGroup.visible = true;
        
        // เล่นเสียงการเปลี่ยนฉาก
        this.playTransitionSound(fromIndex, toIndex);
        
        // อัปเดตชื่อฉาก
        const labels = ['Earth', 'Uranus', 'Galaxy', 'Black Hole'];
        sceneLabel.textContent = labels[toIndex];
        sceneLabel.style.opacity = '1';
        
        // สร้างเอฟเฟกต์ transition visual
        this.createTransitionVisual(fromIndex, toIndex);
        
        // กำหนดระยะเวลาและอีซซิ่งสำหรับการเปลี่ยนฉาก
        const duration = 4; // วินาที
        const ease = "power3.inOut";
        
        // คำนวณเส้นทางกล้องตามฉาก
        const cameraPath = this.calculateCameraPath(fromIndex, toIndex, duration);
        
        // แอนิเมชันออบเจ็กต์ฉาก
        if (toIndex > fromIndex) {
            // เคลื่อนที่ไปข้างหน้า
            this.animateForwardTransition(fromGroup, toGroup, duration, ease);
        } else {
            // เคลื่อนที่ย้อนกลับ
            this.animateBackwardTransition(fromGroup, toGroup, duration, ease);
        }
        
        // แอนิเมชันกล้อง
        this.animateCamera(camera, cameraPath);
        
        // แอนิเมชันแสง
        this.animateLights(lights, toIndex, duration);
        
        // เมื่อ transition เสร็จสิ้น
        setTimeout(() => {
            onCompleteCallback();
            isTransitioning = false;
            this.cleanupTransition(fromIndex, toIndex);
            
            // อัปเดตฉากปัจจุบัน
            currentScene = toIndex;
            
            // เริ่มการเปลี่ยนฉากอัตโนมัติใหม่หากเปิดใช้งาน
            if (autoTransitionEnabled) {
                startAutomaticTransition();
            }
        }, duration * 1000);
    }
    
    // สร้างเอฟเฟกต์ transition visual
    createTransitionVisual(fromIndex, toIndex) {
        // สร้างเอฟเฟกต์แตกต่างกันตามฉาก
        const overlay = document.createElement('div');
        overlay.className = 'transition-overlay';
        
        if (toIndex === SCENES.BLACK_HOLE) {
            // เอฟเฟกต์พิเศษเมื่อเข้าสู่หลุมดำ
            overlay.classList.add('blackhole-transition');
        } else if (fromIndex === SCENES.BLACK_HOLE) {
            // เอฟเฟกต์เมื่อออกจากหลุมดำ
            overlay.classList.add('exit-blackhole');
        } else if (toIndex === SCENES.GALAXY) {
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
        
        if (toIndex === SCENES.BLACK_HOLE) {
            timeline.to(overlay, {
                opacity: 0.7,
                duration: 1.5,
                ease: "power2.in"
            }).to(overlay, {
                opacity: 0,
                duration: 2.5,
                ease: "power3.out"
            });
        } else {
            timeline.to(overlay, {
                opacity: 0.5,
                duration: 1,
                ease: "power1.in"
            }).to(overlay, {
                opacity: 0,
                duration: 3,
                ease: "power2.out"
            });
        }
        
        this.transitionTimelines[`${fromIndex}-${toIndex}`] = timeline;
    }
    
    // คำนวณเส้นทางกล้องตามฉาก
    calculateCameraPath(fromIndex, toIndex, duration) {
        const cameraPath = [];
        
        switch(toIndex) {
            case SCENES.EARTH:
                // เส้นทางกล้องสำหรับโลก - วงโคจรรอบโลก
                cameraPath.push(
                    { x: 5, y: 3, z: 20, duration: duration * 0.3 },
                    { x: 2, y: 1, z: 17, duration: duration * 0.3 },
                    { x: 0, y: 0, z: 15, duration: duration * 0.4 }
                );
                break;
                
            case SCENES.URANUS:
                // เส้นทางกล้องสำหรับยูเรนัส - โค้งรอบดาว
                cameraPath.push(
                    { x: -5, y: 8, z: 25, duration: duration * 0.3 },
                    { x: -2, y: 5, z: 22, duration: duration * 0.3 },
                    { x: 0, y: 3, z: 20, duration: duration * 0.4 }
                );
                break;
                
            case SCENES.GALAXY:
                // เส้นทางกล้องสำหรับกาแล็กซี่ - มุมมองจากด้านบน
                cameraPath.push(
                    { x: 5, y: 12, z: 20, duration: duration * 0.3 },
                    { x: 3, y: 10, z: 17, duration: duration * 0.3 },
                    { x: 2, y: 8, z: 15, duration: duration * 0.4 }
                );
                break;
                
            case SCENES.BLACK_HOLE:
                // เส้นทางกล้องสำหรับหลุมดำ - ค่อยๆ ดึงดูดเข้าไป
                cameraPath.push(
                    { x: 2, y: 8, z: 25, duration: duration * 0.2 },
                    { x: 1, y: 7, z: 22, duration: duration * 0.3 },
                    { x: 0, y: 5, z: 20, duration: duration * 0.5 }
                );
                break;
        }
        
        return cameraPath;
    }
    
    // แอนิเมชันกล้อง
    animateCamera(camera, cameraPath) {
        let timeline = gsap.timeline();
        
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
        if (cameraPath.length > 0 && cameraPath[cameraPath.length - 1].z === 20) {
            setTimeout(() => {
                this.addCameraShake(camera, 0.8);
            }, cameraPath[0].duration * 1000);
        }
    }
    
    // แอนิเมชัน objects สำหรับ transition ไปข้างหน้า
    animateForwardTransition(fromGroup, toGroup, duration, ease) {
        // จากฉากปัจจุบันไปฉากถัดไป
        
        // แอนิเมชันฉากปัจจุบัน - เคลื่อนที่ออกไป
        gsap.to(fromGroup.position, {
            z: -100,
            duration: duration,
            ease: ease
        });
        
        // เพิ่มการหมุนระหว่าง transition
        gsap.to(fromGroup.rotation, {
            x: -0.2,
            y: 0.5,
            z: 0.1,
            duration: duration * 0.7,
            ease: "power2.inOut"
        });
        
        // แอนิเมชันฉากใหม่ - เคลื่อนที่เข้ามา
        toGroup.position.set(0, 0, 100); // ตั้งตำแหน่งเริ่มต้น
        toGroup.rotation.set(0.1, -0.3, 0); // ตั้งการหมุนเริ่มต้น
        
        gsap.to(toGroup.position, {
            x: 0,
            y: 0,
            z: 0,
            duration: duration,
            ease: ease
        });
        
        gsap.to(toGroup.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: duration,
            ease: "power2.inOut"
        });
    }
    
    // แอนิเมชัน objects สำหรับ transition ย้อนกลับ
    animateBackwardTransition(fromGroup, toGroup, duration, ease) {
        // จากฉากปัจจุบันไปฉากก่อนหน้า
        
        // แอนิเมชันฉากปัจจุบัน - เคลื่อนที่ออกไป
        gsap.to(fromGroup.position, {
            z: 100,
            duration: duration,
            ease: ease
        });
        
        // เพิ่มการหมุนระหว่าง transition
        gsap.to(fromGroup.rotation, {
            x: 0.3,
            y: -0.2,
            z: 0.1,
            duration: duration * 0.7,
            ease: "power2.inOut"
        });
        
        // แอนิเมชันฉากใหม่ - เคลื่อนที่เข้ามา
        toGroup.position.set(0, 0, -100); // ตั้งตำแหน่งเริ่มต้น
        toGroup.rotation.set(-0.3, 0.2, -0.1); // ตั้งการหมุนเริ่มต้น
        
        gsap.to(toGroup.position, {
            x: 0,
            y: 0,
            z: 0,
            duration: duration,
            ease: ease
        });
        
        gsap.to(toGroup.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: duration,
            ease: "power2.inOut"
        });
    }
    
    // เพิ่มการเขย่ากล้อง (เฉพาะฉากหลุมดำ)
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
    
    // แอนิเมชันแสง
    animateLights(lights, toIndex, duration) {
        // ปรับแสงตามฉาก
        switch(toIndex) {
            case SCENES.EARTH:
                // แสงสำหรับโลก
                gsap.to(lights.ambient, { intensity: 0.5, duration: duration * 0.7 });
                gsap.to(lights.directional, { intensity: 1.0, duration: duration * 0.7 });
                gsap.to(lights.blue, { intensity: 0, duration: duration * 0.7 });
                gsap.to(lights.purple, { intensity: 0, duration: duration * 0.7 });
                break;
                
            case SCENES.URANUS:
                // แสงสำหรับยูเรนัส
                gsap.to(lights.ambient, { intensity: 0.3, duration: duration * 0.7 });
                gsap.to(lights.directional, { intensity: 0.8, duration: duration * 0.7 });
                gsap.to(lights.blue, { intensity: 2, duration: duration * 0.7 });
                gsap.to(lights.purple, { intensity: 0.5, duration: duration * 0.7 });
                break;
                
            case SCENES.GALAXY:
                // แสงสำหรับกาแล็กซี่
                gsap.to(lights.ambient, { intensity: 0.2, duration: duration * 0.7 });
                gsap.to(lights.directional, { intensity: 0.5, duration: duration * 0.7 });
                gsap.to(lights.blue, { intensity: 5, duration: duration * 0.7 });
                gsap.to(lights.purple, { intensity: 3, duration: duration * 0.7 });
                break;
                
            case SCENES.BLACK_HOLE:
                // แสงสำหรับหลุมดำ
                gsap.to(lights.ambient, { intensity: 0.1, duration: duration * 0.7 });
                gsap.to(lights.directional, { intensity: 0.3, duration: duration * 0.7 });
                gsap.to(lights.blue, { intensity: 3, duration: duration * 0.7 });
                gsap.to(lights.purple, { intensity: 7, duration: duration * 0.7 });
                break;
        }
    }
    
    // เล่นเสียงการเปลี่ยนฉาก
    playTransitionSound(fromIndex, toIndex) {
        if (!audioEnabled || !audioContext) return;
        
        // ตั้งค่าโทนเสียงตามฉาก
        let frequency = 300;
        let type = 'sine';
        
        if (toIndex === SCENES.BLACK_HOLE) {
            frequency = 80;
            type = 'sawtooth';
        } else if (toIndex === SCENES.GALAXY) {
            frequency = 200;
            type = 'triangle';
        } else if (toIndex === SCENES.URANUS) {
            frequency = 150;
            type = 'sine';
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 2);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 2);
        
        this.transitionSounds[`${fromIndex}-${toIndex}`] = {
            oscillator,
            gainNode,
            filter
        };
    }
    
    // ทำความสะอาดหลัง transition
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
        
        // ล้างเสียง
        if (this.transitionSounds[overlayKey]) {
            delete this.transitionSounds[overlayKey];
        }
    }
}