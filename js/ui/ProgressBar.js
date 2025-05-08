/**
 * ProgressBar.js
 * จัดการแถบแสดงความคืบหน้าการเดินทางในแอพพลิเคชัน
 * ควบคุมการแสดงมาร์กเกอร์ปัจจุบัน การแอนิเมชันของแถบความคืบหน้า และการโต้ตอบกับผู้ใช้
 */
class ProgressBar {
    /**
     * สร้าง ProgressBar
     * @param {HTMLElement} container - Element ที่จะใช้เป็นคอนเทนเนอร์
     * @param {number} totalScenes - จำนวนฉากทั้งหมด
     * @param {Object} options - ตัวเลือกเพิ่มเติม
     */
    constructor(container, totalScenes, options = {}) {
        this.container = container;
        this.totalScenes = totalScenes;
        this.currentScene = 0;
        
        // ตัวเลือกเพิ่มเติม
        this.options = {
            autoHide: options.autoHide || false,          // ซ่อนอัตโนมัติหลังจากไม่มีการโต้ตอบ
            hideTimeout: options.hideTimeout || 5000,     // เวลาก่อนซ่อน (มิลลิวินาที)
            showLabels: options.showLabels !== false,     // แสดงป้ายชื่อฉากหรือไม่
            showMarkers: options.showMarkers !== false,   // แสดงมาร์กเกอร์หรือไม่
            sceneNames: options.sceneNames || ['Earth', 'Uranus', 'Galaxy', 'Black Hole'], // ชื่อฉาก
            onClick: options.onClick || null,             // ฟังก์ชันเมื่อคลิกมาร์กเกอร์
            onSceneChange: options.onSceneChange || null  // ฟังก์ชันเมื่อเปลี่ยนฉาก
        };
        
        // ส่วนประกอบย่อย
        this.progressElement = null;  // แถบความคืบหน้าทั้งหมด
        this.progressTrack = null;    // ส่วนแทร็ก
        this.progressLine = null;     // เส้นแสดงความคืบหน้า
        this.progressCompleted = null; // ส่วนที่เสร็จสมบูรณ์
        this.markers = [];            // รายการมาร์กเกอร์
        this.controlButton = null;    // ปุ่มควบคุม
        
        // สถานะ
        this.visible = false;         // สถานะการแสดงผล
        this.minimized = false;       // สถานะการย่อ
        this.autoTransitionEnabled = true; // สถานะการเปลี่ยนฉากอัตโนมัติ
        this.hideTimer = null;        // ตัวจับเวลาสำหรับการซ่อนอัตโนมัติ
        this.isDragging = false;      // สถานะการลาก
        
        // สร้างแถบความคืบหน้า
        this.create();
        
        // ตั้งค่าการโต้ตอบ
        this.setupInteractions();
    }
    
    /**
     * สร้างแถบความคืบหน้า
     */
    create() {
        // สร้างคอนเทนเนอร์หลัก
        this.progressElement = document.createElement('div');
        this.progressElement.className = 'journey-progress';
        
        // สร้างแทร็ก
        this.progressTrack = document.createElement('div');
        this.progressTrack.className = 'progress-track';
        
        // สร้างเส้นความคืบหน้า
        this.progressLine = document.createElement('div');
        this.progressLine.className = 'progress-line';
        
        // สร้างส่วนที่เสร็จสมบูรณ์
        this.progressCompleted = document.createElement('div');
        this.progressCompleted.className = 'progress-completed';
        
        // เพิ่มเส้นความคืบหน้าไปยังแทร็ก
        this.progressLine.appendChild(this.progressCompleted);
        this.progressTrack.appendChild(this.progressLine);
        
        // สร้างมาร์กเกอร์แต่ละจุด
        const sceneClasses = ['earth', 'uranus', 'galaxy', 'blackhole'];
        for (let i = 0; i < this.totalScenes; i++) {
            const marker = document.createElement('div');
            marker.className = `progress-marker ${sceneClasses[i] || ''}`;
            marker.dataset.scene = i;
            
            // สร้างจุดของมาร์กเกอร์
            const point = document.createElement('div');
            point.className = 'marker-point';
            
            // สร้างป้ายชื่อ
            if (this.options.showLabels) {
                const label = document.createElement('span');
                label.className = 'marker-label';
                label.textContent = this.options.sceneNames[i] || `Scene ${i + 1}`;
                marker.appendChild(label);
            }
            
            marker.appendChild(point);
            this.progressTrack.appendChild(marker);
            this.markers.push(marker);
        }
        
        // สร้างปุ่มควบคุมการเปลี่ยนฉากอัตโนมัติ
        this.controlButton = document.createElement('button');
        this.controlButton.id = 'toggle-auto';
        this.controlButton.className = 'control-btn';
        this.controlButton.title = 'Toggle Automatic Journey';
        
        const icon = document.createElement('span');
        icon.className = 'auto-icon';
        icon.textContent = '▶';
        
        this.controlButton.appendChild(icon);
        this.progressElement.appendChild(this.progressTrack);
        this.progressElement.appendChild(this.controlButton);
        
        // เพิ่มลงในคอนเทนเนอร์
        this.container.appendChild(this.progressElement);
        
        // ตั้งค่าเริ่มต้น
        this.updateMarkers();
        this.hide(); // ซ่อนเริ่มต้น
    }
    
    /**
     * ตั้งค่าการโต้ตอบกับผู้ใช้
     */
    setupInteractions() {
        // เพิ่ม event listener สำหรับการคลิกบนมาร์กเกอร์
        this.markers.forEach(marker => {
            marker.addEventListener('click', (event) => {
                if (isTransitioning) return;
                
                const targetScene = parseInt(event.currentTarget.dataset.scene);
                if (targetScene !== this.currentScene) {
                    this.goToScene(targetScene);
                }
            });
            
            // เพิ่ม hover effect
            marker.addEventListener('mouseenter', () => {
                marker.classList.add('hovered');
                
                // เล่นเสียง hover
                if (audioManager && audioManager.enabled) {
                    audioManager.playEffect('hover');
                }
            });
            
            marker.addEventListener('mouseleave', () => {
                marker.classList.remove('hovered');
            });
        });
        
        // เพิ่ม event listener สำหรับปุ่มควบคุม
        this.controlButton.addEventListener('click', () => {
            this.toggleAutoTransition();
        });
        
        // เพิ่ม hover effect สำหรับปุ่มควบคุม
        this.controlButton.addEventListener('mouseenter', () => {
            this.controlButton.classList.add('hovered');
            
            // เล่นเสียง hover
            if (audioManager && audioManager.enabled) {
                audioManager.playEffect('hover');
            }
        });
        
        this.controlButton.addEventListener('mouseleave', () => {
            this.controlButton.classList.remove('hovered');
        });
        
        // เพิ่ม event listener สำหรับการลากบนแถบความคืบหน้า
        this.progressLine.addEventListener('mousedown', (event) => {
            if (isTransitioning) return;
            
            this.isDragging = true;
            this.handleProgressDrag(event);
        });
        
        // ติดตามการเคลื่อนที่ของเมาส์เมื่อกำลังลาก
        document.addEventListener('mousemove', (event) => {
            if (this.isDragging) {
                this.handleProgressDrag(event);
            }
        });
        
        // หยุดการลากเมื่อปล่อยเมาส์
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        // รีเซ็ตตัวจับเวลาเมื่อมีการเคลื่อนไหวของเมาส์
        document.addEventListener('mousemove', () => {
            this.resetHideTimer();
        });
        
        // ปรับขนาดเมื่อหน้าจอเปลี่ยน
        window.addEventListener('resize', () => {
            this.adjustForScreenSize();
        });
    }
    
    /**
     * จัดการการลากบนแถบความคืบหน้า
     * @param {MouseEvent} event - เหตุการณ์เมาส์
     */
    handleProgressDrag(event) {
        // คำนวณตำแหน่งเมาส์เทียบกับแถบความคืบหน้า
        const rect = this.progressLine.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const width = rect.width;
        
        // คำนวณเปอร์เซ็นต์
        let percent = x / width;
        percent = Math.max(0, Math.min(1, percent));
        
        // คำนวณฉากที่ต้องการไป
        const targetScene = Math.round(percent * (this.totalScenes - 1));
        
        // ไปยังฉากที่เลือก
        if (targetScene !== this.currentScene) {
            this.goToScene(targetScene);
        }
    }
    
    /**
     * ไปยังฉากที่กำหนด
     * @param {number} sceneIndex - ดัชนีของฉากที่ต้องการไป
     */
    goToScene(sceneIndex) {
        if (sceneIndex < 0 || sceneIndex >= this.totalScenes) return;
        
        // เรียกฟังก์ชัน callback ถ้ามี
        if (this.options.onClick) {
            this.options.onClick(sceneIndex);
        }
        
        // อัปเดตฉากปัจจุบัน
        this.setCurrentScene(sceneIndex);
    }
    
    /**
     * อัปเดตสถานะมาร์กเกอร์
     */
    updateMarkers() {
        this.markers.forEach((marker, index) => {
            // มาร์กเกอร์ทั้งหมดที่น้อยกว่าหรือเท่ากับฉากปัจจุบันจะถูกไฮไลต์
            if (index <= this.currentScene) {
                marker.classList.add('active');
            } else {
                marker.classList.remove('active');
            }
        });
    }
    
    /**
     * อัปเดตแถบความคืบหน้า
     * @param {number} progress - ค่าความคืบหน้า (0-1)
     * @param {boolean} animate - แอนิเมชันหรือไม่
     */
    updateProgressBar(progress, animate = true) {
        const percentage = progress * 100;
        
        if (animate) {
            gsap.to(this.progressCompleted, {
                width: `${percentage}%`,
                duration: 1,
                ease: "power1.inOut"
            });
        } else {
            this.progressCompleted.style.width = `${percentage}%`;
        }
    }
    
    /**
     * ตั้งค่าฉากปัจจุบัน
     * @param {number} sceneIndex - ดัชนีของฉาก
     */
    setCurrentScene(sceneIndex) {
        if (sceneIndex < 0 || sceneIndex >= this.totalScenes) return;
        
        // บันทึกดัชนีฉากปัจจุบัน
        this.currentScene = sceneIndex;
        
        // อัปเดตมาร์กเกอร์
        this.updateMarkers();
        
        // อัปเดตแถบความคืบหน้า
        const progress = sceneIndex / (this.totalScenes - 1);
        this.updateProgressBar(progress);
        
        // เรียกฟังก์ชัน callback ถ้ามี
        if (this.options.onSceneChange) {
            this.options.onSceneChange(sceneIndex);
        }
    }
    
    /**
     * แสดงแถบความคืบหน้า
     */
    show() {
        if (this.visible) return;
        
        this.visible = true;
        
        // แสดงด้วยแอนิเมชัน
        gsap.to(this.progressElement, {
            opacity: 1,
            duration: 0.5,
            ease: "power2.inOut",
            onStart: () => {
                this.progressElement.style.display = 'block';
            }
        });
        
        // ตั้งตัวจับเวลาสำหรับการซ่อนอัตโนมัติ
        this.resetHideTimer();
    }
    
    /**
     * ซ่อนแถบความคืบหน้า
     */
    hide() {
        if (!this.visible) return;
        
        this.visible = false;
        
        // ซ่อนด้วยแอนิเมชัน
        gsap.to(this.progressElement, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: () => {
                this.progressElement.style.display = 'none';
            }
        });
        
        // ยกเลิกตัวจับเวลา
        clearTimeout(this.hideTimer);
    }
    
    /**
     * รีเซ็ตตัวจับเวลาสำหรับการซ่อนอัตโนมัติ
     */
    resetHideTimer() {
        // ยกเลิกตัวจับเวลาเดิม
        clearTimeout(this.hideTimer);
        
        // ตั้งตัวจับเวลาใหม่ถ้าเปิดใช้งาน autoHide
        if (this.options.autoHide) {
            this.hideTimer = setTimeout(() => {
                this.minimize();
            }, this.options.hideTimeout);
        }
    }
    
    /**
     * สลับการแสดงผล
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * ย่อแถบความคืบหน้า
     */
    minimize() {
        if (this.minimized) return;
        
        this.minimized = true;
        
        // ย่อด้วยแอนิเมชัน
        gsap.to(this.progressElement, {
            y: 50,
            opacity: 0.5,
            duration: 0.5,
            ease: "power2.inOut"
        });
    }
    
    /**
     * ขยายแถบความคืบหน้า
     */
    maximize() {
        if (!this.minimized) return;
        
        this.minimized = false;
        
        // ขยายด้วยแอนิเมชัน
        gsap.to(this.progressElement, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.inOut"
        });
        
        // รีเซ็ตตัวจับเวลา
        this.resetHideTimer();
    }
    
    /**
     * สลับการเปลี่ยนฉากอัตโนมัติ
     */
    toggleAutoTransition() {
        this.autoTransitionEnabled = !this.autoTransitionEnabled;
        
        // อัปเดตไอคอนปุ่ม
        const icon = this.controlButton.querySelector('.auto-icon');
        if (icon) {
            icon.textContent = this.autoTransitionEnabled ? '▶' : '❚❚';
        }
        
        // เรียกฟังก์ชัน callback ถ้ามี
        if (typeof toggleAutoTransition === 'function') {
            toggleAutoTransition();
        }
    }
    
    /**
     * ปรับขนาดตามหน้าจอ
     */
    adjustForScreenSize() {
        const width = window.innerWidth;
        
        if (width < 480) {
            // ขนาดหน้าจอเล็กมาก
            this.progressElement.style.width = '90%';
            this.progressElement.style.padding = '0.6rem 1rem';
        } else if (width < 768) {
            // ขนาดหน้าจอเล็ก
            this.progressElement.style.width = '90%';
            this.progressElement.style.padding = '0.8rem 1.2rem';
        } else {
            // ขนาดหน้าจอปกติ
            this.progressElement.style.width = '31.25rem';
            this.progressElement.style.padding = '1.25rem 1.563rem';
        }
        
        // ปรับขนาดจุดมาร์กเกอร์
        const markerPoints = this.progressElement.querySelectorAll('.marker-point');
        if (width < 480) {
            markerPoints.forEach(point => {
                point.style.width = '0.875rem';
                point.style.height = '0.875rem';
            });
        } else {
            markerPoints.forEach(point => {
                point.style.width = '';
                point.style.height = '';
            });
        }
    }
    
    /**
     * ล้างทรัพยากร
     */
    dispose() {
        // ยกเลิกตัวจับเวลา
        clearTimeout(this.hideTimer);
        
        // ลบ event listeners (ตัวอย่าง)
        this.markers.forEach(marker => {
            marker.removeEventListener('click', () => {});
            marker.removeEventListener('mouseenter', () => {});
            marker.removeEventListener('mouseleave', () => {});
        });
        
        this.controlButton.removeEventListener('click', () => {});
        this.progressLine.removeEventListener('mousedown', () => {});
        
        // ลบแถบความคืบหน้าออกจาก DOM
        if (this.progressElement && this.progressElement.parentNode) {
            this.progressElement.parentNode.removeChild(this.progressElement);
        }
    }
}