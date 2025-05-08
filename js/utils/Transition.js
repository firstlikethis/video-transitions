class EnhancedTransition {
  // เมธอดที่ปรับปรุงสำหรับการเปลี่ยนฉาก
  static performEnhancedTransition(
    fromGroup,
    toGroup,
    fromIndex,
    toIndex,
    camera,
    blueLight,
    purpleLight,
    sceneLabel,
    onCompleteCallback
  ) {
    // ทำให้ทั้งสองฉากมองเห็นได้
    fromGroup.visible = true;
    toGroup.visible = true;

    // เล่นเสียงการเปลี่ยนฉาก
    if (audioEnabled && transitionSound) {
      transitionSound.play();
    }

    // ปรับเสียงพื้นหลังสำหรับฉากใหม่
    if (audioEnabled && backgroundMusic) {
      backgroundMusic.adjustForScene(toIndex);
    }

    // อัปเดตชื่อฉาก
    const labels = ["Earth", "Uranus", "Galaxy", "Black Hole"];
    sceneLabel.textContent = labels[toIndex];
    sceneLabel.style.opacity = "1";

    // คำนวณตำแหน่งสำหรับแอนิเมชัน
    const fromPos = { x: 0, y: 0, z: 0 };
    const toPos = { x: 0, y: 0, z: 100 };

    // กำหนดระยะเวลาและอีซซิ่งสำหรับการเปลี่ยนฉาก
    const duration = 4; // เพิ่มความยาวของการเปลี่ยนฉาก
    const ease = "power3.inOut";

    // เพิ่มเอฟเฟกต์ post-processing ชั่วคราว
    EnhancedTransition.addTransitionEffects(fromIndex, toIndex, duration);

    // เอฟเฟกต์ทั้งหมดนี้จะแตกต่างกันไปตามทิศทางและฉากที่กำลังเปลี่ยน
    if (toIndex > fromIndex) {
      // กำลังเคลื่อนที่ไปข้างหน้าในลำดับ

      // ซูมออกและเคลื่อนที่ไกลออกไปสำหรับฉากปัจจุบัน
      gsap.to(fromGroup.position, {
        x: fromPos.x,
        y: fromPos.y,
        z: -100,
        duration: duration,
        ease: ease,
      });

      // เพิ่มการหมุนและการเคลื่อนที่ที่เป็นธรรมชาติมากขึ้น
      let fromRotation = { x: 0, y: 0, z: 0 };
      let toRotation = { x: 0, y: 0, z: 0 };

      // ปรับการหมุนตามฉาก
      switch (fromIndex) {
        case SCENES.EARTH:
          fromRotation = { x: -0.2, y: 0.5, z: 0.1 };
          break;
        case SCENES.URANUS:
          fromRotation = { x: 0.3, y: -0.5, z: -0.2 };
          break;
        case SCENES.GALAXY:
          fromRotation = { x: -0.4, y: 0.3, z: 0.2 };
          break;
      }

      switch (toIndex) {
        case SCENES.URANUS:
          toRotation = { x: 0.1, y: -0.3, z: 0 };
          break;
        case SCENES.GALAXY:
          toRotation = { x: -0.2, y: 0.4, z: 0.2 };
          break;
        case SCENES.BLACK_HOLE:
          toRotation = { x: 0, y: 0, z: 0 };
          break;
      }

      // แอนิเมชันการหมุนของฉากปัจจุบัน
      gsap.to(fromGroup.rotation, {
        x: fromRotation.x,
        y: fromRotation.y,
        z: fromRotation.z,
        duration: duration * 0.7,
        ease: "power2.inOut",
      });

      // นำฉากใหม่เข้ามาจากระยะไกล
      gsap.fromTo(
        toGroup.position,
        { x: toPos.x, y: toPos.y, z: toPos.z },
        { x: 0, y: 0, z: 0, duration: duration, ease: ease }
      );

      // การหมุนของฉากใหม่
      gsap.fromTo(
        toGroup.rotation,
        { x: toRotation.x, y: toRotation.y, z: toRotation.z },
        { x: 0, y: 0, z: 0, duration: duration, ease: "power2.inOut" }
      );
    } else {
      // กำลังเคลื่อนที่ย้อนกลับในลำดับ

      gsap.to(fromGroup.position, {
        x: fromPos.x,
        y: fromPos.y,
        z: 100,
        duration: duration,
        ease: ease,
      });

      // ปรับการหมุนเมื่อเคลื่อนที่ย้อนกลับ
      gsap.to(fromGroup.rotation, {
        x: 0.3,
        y: -0.2,
        z: 0.1,
        duration: duration * 0.7,
        ease: "power2.inOut",
      });

      // นำฉากก่อนหน้ากลับมา
      gsap.fromTo(
        toGroup.position,
        { x: toPos.x, y: toPos.y, z: -100 },
        { x: 0, y: 0, z: 0, duration: duration, ease: ease }
      );

      gsap.fromTo(
        toGroup.rotation,
        { x: -0.3, y: 0.2, z: -0.1 },
        { x: 0, y: 0, z: 0, duration: duration, ease: "power2.inOut" }
      );
    }

    // จัดการการเปลี่ยนกล้องและแสง
    EnhancedTransition.transitionCameraAndLighting(
      toIndex,
      camera,
      blueLight,
      purpleLight,
      duration,
      ease
    );

    // ดำเนินการเมื่อการเปลี่ยนฉากเสร็จสิ้น
    setTimeout(() => {
      onCompleteCallback();

      // เริ่มการเปลี่ยนฉากอัตโนมัติสำหรับฉากถัดไป หากเปิดใช้งาน
      if (autoTransitionEnabled) {
        startAutomaticTransition();
      }
    }, duration * 1000);
  }

  // จัดการกล้องและแสงสำหรับการเปลี่ยนฉาก
  static transitionCameraAndLighting(
    toIndex,
    camera,
    blueLight,
    purpleLight,
    duration,
    ease
  ) {
    // เพิ่มความซับซ้อนในการเคลื่อนที่ของกล้อง
    let cameraPath, targetDuration;

    switch (toIndex) {
      case SCENES.EARTH:
        // เส้นทางกล้องสำหรับโลก - วงโคจรรอบโลก
        cameraPath = [
          { x: 5, y: 3, z: 20, duration: duration * 0.3 },
          { x: 0, y: 0, z: 15, duration: duration * 0.7 },
        ];

        // ปิดไฟพิเศษ
        gsap.to(blueLight, { intensity: 0, duration: duration * 0.7 });
        gsap.to(purpleLight, { intensity: 0, duration: duration * 0.7 });
        break;

      case SCENES.URANUS:
        // เส้นทางกล้องสำหรับยูเรนัส - โค้งรอบดาว
        cameraPath = [
          { x: -5, y: 8, z: 25, duration: duration * 0.4 },
          { x: 0, y: 3, z: 20, duration: duration * 0.6 },
        ];

        // เพิ่มแสงแอมเบียนท์
        gsap.to(blueLight, { intensity: 2, duration: duration * 0.7 });
        gsap.to(purpleLight, { intensity: 0.5, duration: duration * 0.7 });
        break;

      case SCENES.GALAXY:
        // เส้นทางกล้องสำหรับกาแล็กซี่ - มุมมองจากด้านบน
        cameraPath = [
          { x: 5, y: 12, z: 20, duration: duration * 0.5 },
          { x: 2, y: 8, z: 15, duration: duration * 0.5 },
        ];

        // แสงสีสันสำหรับกาแล็กซี่
        gsap.to(blueLight, { intensity: 5, duration: duration * 0.7 });
        gsap.to(purpleLight, { intensity: 3, duration: duration * 0.7 });
        break;

      case SCENES.BLACK_HOLE:
        // เส้นทางกล้องสำหรับหลุมดำ - ค่อยๆ ดึงดูดเข้าไป
        cameraPath = [
          { x: 2, y: 8, z: 25, duration: duration * 0.3 },
          { x: 0, y: 5, z: 20, duration: duration * 0.7 },
        ];

        // แสงแบบดราม่าสำหรับหลุมดำ
        gsap.to(blueLight, { intensity: 3, duration: duration * 0.7 });
        gsap.to(purpleLight, { intensity: 7, duration: duration * 0.7 });
        break;
    }

    // แอนิเมชันกล้องตามเส้นทาง
    let timeline = gsap.timeline();

    cameraPath.forEach((point) => {
      timeline.to(camera.position, {
        x: point.x,
        y: point.y,
        z: point.z,
        duration: point.duration,
        ease: "power2.inOut",
      });
    });

    // เพิ่มการเขย่ากล้องเล็กน้อย
    if (toIndex === SCENES.BLACK_HOLE) {
      // เพิ่มการสั่นสะเทือนเมื่อเข้าใกล้หลุมดำ
      EnhancedTransition.addCameraShake(camera, duration * 0.6, duration * 0.4);
    }
  }

  // เพิ่มเอฟเฟกต์การเปลี่ยนฉาก
  static addTransitionEffects(fromIndex, toIndex, duration) {
    // สร้างเอฟเฟกต์ DOM สำหรับการเปลี่ยนฉาก
    const transitionOverlay = document.createElement("div");
    transitionOverlay.className = "transition-overlay";
    document.body.appendChild(transitionOverlay);

    // ปรับเอฟเฟกต์ตามฉากที่กำลังเปลี่ยน
    if (toIndex === SCENES.BLACK_HOLE) {
      // เอฟเฟกต์พิเศษเมื่อเข้าสู่หลุมดำ - การยืดเวลา
      transitionOverlay.classList.add("blackhole-transition");

      gsap.to(transitionOverlay, {
        opacity: 0.7,
        duration: duration * 0.4,
        ease: "power2.in",
        onComplete: () => {
          gsap.to(transitionOverlay, {
            opacity: 0,
            duration: duration * 0.6,
            ease: "power3.out",
            onComplete: () => {
              transitionOverlay.remove();
            },
          });
        },
      });
    } else if (fromIndex === SCENES.BLACK_HOLE) {
      // เอฟเฟกต์เมื่อออกจากหลุมดำ
      transitionOverlay.classList.add("exit-blackhole");

      gsap.to(transitionOverlay, {
        opacity: 0.8,
        duration: duration * 0.3,
        ease: "power1.in",
        onComplete: () => {
          gsap.to(transitionOverlay, {
            opacity: 0,
            duration: duration * 0.7,
            ease: "power2.out",
            onComplete: () => {
              transitionOverlay.remove();
            },
          });
        },
      });
    } else {
      // เอฟเฟกต์มาตรฐานสำหรับการเปลี่ยนฉากอื่นๆ
      gsap.to(transitionOverlay, {
        opacity: 0.5,
        duration: duration * 0.3,
        ease: "power1.in",
        onComplete: () => {
          gsap.to(transitionOverlay, {
            opacity: 0,
            duration: duration * 0.7,
            ease: "power2.out",
            onComplete: () => {
              transitionOverlay.remove();
            },
          });
        },
      });
    }
  }

  // เพิ่มการเขย่ากล้อง
  static addCameraShake(camera, delay, duration) {
    // บันทึกตำแหน่งเริ่มต้น
    const originalPosition = camera.position.clone();

    setTimeout(() => {
      // เริ่มการเขย่ากล้อง
      let t = 0;
      const shakeIntensity = 0.08;
      const shakeSpeed = 0.01;
      const shakeInterval = setInterval(() => {
        t += shakeSpeed;

        // ลดความเข้มข้นเมื่อเวลาผ่านไป
        const fadeOut = 1 - t / duration;
        const intensity = shakeIntensity * fadeOut;

        // เพิ่มการเขย่าแบบสุ่มที่ค่อยๆ ลดลงตามเวลา
        camera.position.x =
          originalPosition.x + (Math.random() - 0.5) * intensity;
        camera.position.y =
          originalPosition.y + (Math.random() - 0.5) * intensity;

        // หยุดการเขย่าเมื่อถึงเวลาที่กำหนด
        if (t >= duration) {
          clearInterval(shakeInterval);

          // กลับสู่ตำแหน่งเดิม
          gsap.to(camera.position, {
            x: originalPosition.x,
            y: originalPosition.y,
            duration: 0.5,
            ease: "power2.out",
          });
        }
      }, 16);
    }, delay * 1000);
  }
}

// ปรับแก้ไข CSS เพื่อเพิ่มเอฟเฟกต์พิเศษและ UI ใหม่
const additionalCSS = `
/* UI สำหรับการควบคุมการเดินทาง */
.journey-progress {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    z-index: 100;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    padding: 15px;
    backdrop-filter: blur(10px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    transition: opacity 0.5s;
}

@media screen and (max-width: 768px) {
    .journey-progress {
        width: 90%;
        padding: 10px;
    }
}

.progress-track {
    position: relative;
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.progress-line {
    position: absolute;
    top: 50%;
    left: 15px;
    right: 15px;
    height: 2px;
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-50%);
    z-index: -1;
}

.progress-completed {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #4a9eff, #a855f7);
    transition: width 1s;
}

.progress-marker {
    position: relative;
    z-index: 5;
    cursor: pointer;
}

.marker-point {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #333;
    border: 2px solid rgba(255, 255, 255, 0.5);
    transition: all 0.3s;
}

.marker-label {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.3s;
    white-space: nowrap;
}

.progress-marker:hover .marker-point {
    transform: scale(1.2);
}

.progress-marker:hover .marker-label {
    color: white;
}

.progress-marker.active .marker-point {
    background: #4a9eff;
    border-color: white;
    box-shadow: 0 0 10px rgba(74, 158, 255, 0.8);
}

.progress-marker.active .marker-label {
    color: white;
    font-weight: bold;
}

.earth.active .marker-point {
    background: #4a9eff;
}

.uranus.active .marker-point {
    background: #45aaf2;
}

.galaxy.active .marker-point {
    background: #a55eea;
}

.blackhole.active .marker-point {
    background: #fa8231;
}

/* ปุ่มควบคุม */
.control-btn {
    position: absolute;
    right: -50px;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
    transition: all 0.3s;
}

.control-btn:hover {
    background: rgba(30, 30, 30, 0.8);
    transform: translateY(-50%) scale(1.1);
}

/* เอฟเฟกต์ Overlay */
#start-overlay, #end-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 1s;
}

.overlay-content {
    text-align: center;
    color: white;
    max-width: 600px;
    padding: 20px;
}

.overlay-content h1 {
    font-size: 48px;
    margin-bottom: 20px;
    background: linear-gradient(90deg, #4a9eff, #a55eea);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 20px rgba(74, 158, 255, 0.3);
}

.overlay-content p {
    font-size: 18px;
    margin-bottom: 30px;
    line-height: 1.6;
}

.overlay-content button {
    padding: 12px 25px;
    font-size: 16px;
    background: linear-gradient(90deg, #4a9eff, #a55eea);
    border: none;
    border-radius: 30px;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
    outline: none;
}

.overlay-content button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(74, 158, 255, 0.5);
}

.options {
    margin-top: 20px;
    font-size: 14px;
}

.options label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
}

.options input[type="checkbox"] {
    cursor: pointer;
}

/* เอฟเฟกต์การเปลี่ยนฉาก */
.transition-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: black;
    opacity: 0;
    pointer-events: none;
    z-index: 500;
    mix-blend-mode: overlay;
}

.blackhole-transition {
    background: radial-gradient(circle at center, transparent 10%, black 70%);
}

.exit-blackhole {
    background: radial-gradient(circle at center, white 0%, transparent 30%, black 80%);
}

/* เอฟเฟกต์ Ripple เมื่อคลิก */
.ripple-effect {
    position: fixed;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: translate(-50%, -50%) scale(0);
    animation: ripple 1s ease-out forwards;
    pointer-events: none;
    z-index: 100;
}

@keyframes ripple {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.7;
    }
    100% {
        transform: translate(-50%, -50%) scale(6);
        opacity: 0;
    }
}

/* ปรับปรุง Scene Label */
.scene-label {
    position: fixed;
    left: 50%;
    top: 40px;
    transform: translateX(-50%);
    color: white;
    font-size: 28px;
    opacity: 0;
    transition: opacity 0.8s;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
    z-index: 100;
    background: rgba(0, 0, 0, 0.4);
    padding: 8px 30px;
    border-radius: 30px;
    backdrop-filter: blur(5px);
    letter-spacing: 2px;
}

@media screen and (max-width: 768px) {
    .scene-label {
        font-size: 20px;
        top: 20px;
        padding: 6px 20px;
    }
}

/* Loader ที่ปรับปรุงแล้ว */
#loading {
    background: black;
}

#loading h2 {
    font-size: 32px;
    margin-bottom: 20px;
    letter-spacing: 2px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
}

#loading-progress {
    width: 300px;
    height: 6px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    overflow: hidden;
}

#loading-bar {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #4a9eff, #a55eea);
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(74, 158, 255, 0.5);
}
`;
