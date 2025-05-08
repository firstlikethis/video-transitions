// OverlayManager.js
class OverlayManager {
    constructor() {
        this.overlays = {};
        this.activeOverlay = null;
    }
    
    // สร้างโอเวอร์เลย์เริ่มต้น
    createStartOverlay() {
        // สร้างหน้าจอเริ่มต้น
        const overlay = document.createElement('div');
        overlay.id = 'start-overlay';
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="overlay-content">
                <h1>SPACE JOURNEY</h1>
                <p>เดินทางจากโลก สู่ดาวยูเรนัส กาแลคซี่ และหลุมดำ แบบ Interstellar</p>
                <button id="start-journey">เริ่มการเดินทาง</button>
                <div class="options">
                    <label>
                        <input type="checkbox" id="enable-audio"> เปิดเสียง
                    </label>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.overlays.start = overlay;
        this.activeOverlay = 'start';
        
        return overlay;
    }
    
    // สร้างโอเวอร์เลย์จบการเดินทาง
    createEndOverlay() {
        // สร้างหน้าจอจบการเดินทาง
        const overlay = document.createElement('div');
        overlay.id = 'end-overlay';
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="overlay-content">
                <h1>การเดินทางสิ้นสุดลงแล้ว</h1>
                <p>คุณได้สำรวจจากโลก ผ่านดาวยูเรนัส กาแลคซี่ และหลุมดำ</p>
                <button id="restart-journey">เริ่มการเดินทางใหม่</button>
            </div>
        `;
        
        // เริ่มต้นซ่อนไว้
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        
        document.body.appendChild(overlay);
        this.overlays.end = overlay;
        
        return overlay;
    }
    
    // สร้างโอเวอร์เลย์สำหรับการเปลี่ยนฉาก
    createTransitionOverlay(type) {
        const overlay = document.createElement('div');
        overlay.className = 'transition-overlay';
        
        // กำหนดคลาสตามประเภทการเปลี่ยนฉาก
        if (type) {
            overlay.classList.add(`${type}-transition`);
        }
        
        // เริ่มต้นซ่อนไว้
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        
        document.body.appendChild(overlay);
        this.overlays.transition = overlay;
        
        return overlay;
    }
    
    // แสดงโอเวอร์เลย์
    showOverlay(id, callback) {
        const overlay = this.overlays[id];
        if (!overlay) return;
        
        // ซ่อนโอเวอร์เลย์ที่กำลังแสดงอยู่
        if (this.activeOverlay && this.overlays[this.activeOverlay]) {
            this.hideOverlay(this.activeOverlay);
        }
        
        // แสดงโอเวอร์เลย์ใหม่
        gsap.to(overlay, {
            opacity: 1,
            duration: 1,
            ease: "power2.inOut",
            onStart: () => {
                overlay.style.display = 'flex';
                overlay.style.pointerEvents = 'auto';
            },
            onComplete: () => {
                this.activeOverlay = id;
                if (callback) callback();
            }
        });
    }
    
    // ซ่อนโอเวอร์เลย์
    hideOverlay(id, callback) {
        const overlay = this.overlays[id];
        if (!overlay) return;
        
        gsap.to(overlay, {
            opacity: 0,
            duration: 1,
            ease: "power2.inOut",
            onComplete: () => {
                overlay.style.display = 'none';
                overlay.style.pointerEvents = 'none';
                
                if (this.activeOverlay === id) {
                    this.activeOverlay = null;
                }
                
                if (callback) callback();
            }
        });
    }
    
    // แสดงเอฟเฟกต์แบบชั่วคราว
    showTemporaryEffect(type, duration, callback) {
        // สร้างเอฟเฟกต์แบบชั่วคราว
        const effect = document.createElement('div');
        effect.className = `effect ${type}-effect`;
        document.body.appendChild(effect);
        
        // แอนิเมชันแสดงและซ่อน
        gsap.to(effect, {
            opacity: 1,
            duration: duration * 0.3,
            ease: "power2.in",
            onComplete: () => {
                gsap.to(effect, {
                    opacity: 0,
                    duration: duration * 0.7,
                    ease: "power2.out",
                    onComplete: () => {
                        effect.remove();
                        if (callback) callback();
                    }
                });
            }
        });
        
        return effect;
    }
    
    // สร้างเอฟเฟกต์ ripple เมื่อคลิก
    createRippleEffect(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        document.body.appendChild(ripple);
        
        // ลบเอฟเฟกต์หลังจากแอนิเมชันเสร็จสิ้น
        setTimeout(() => {
            ripple.remove();
        }, 1000);
    }
    
    // ล้างโอเวอร์เลย์ทั้งหมด
    dispose() {
        for (const key in this.overlays) {
            if (this.overlays[key].parentNode) {
                this.overlays[key].parentNode.removeChild(this.overlays[key]);
            }
        }
        
        this.overlays = {};
        this.activeOverlay = null;
    }
}