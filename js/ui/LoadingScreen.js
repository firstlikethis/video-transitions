/**
 * LoadingScreen.js
 * จัดการหน้าจอโหลดที่แสดงระหว่างโหลดทรัพยากร
 * แสดงความคืบหน้า เอฟเฟกต์แอนิเมชัน และข้อความตามสถานะการโหลด
 */
class LoadingScreen {
    /**
     * สร้าง LoadingScreen
     * @param {THREE.LoadingManager} loadingManager - Loading manager ของ THREE.js
     * @param {HTMLElement} container - Container ที่จะใช้แสดงหน้าจอโหลด
     */
    constructor(loadingManager, container = document.body) {
        this.loadingManager = loadingManager;
        this.container = container;
        
        // elements ที่เกี่ยวข้อง
        this.loadingElement = null;
        this.loadingBar = null;
        this.loadingText = null;
        
        // สถานะ
        this.isActive = false;
        this.progress = 0;
        this.loadingMessages = [
            'กำลังเริ่มการเดินทางในจักรวาล...',
            'กำลังดึงชักพลังงานจากหลุมดำ...',
            'กำลังโหลดเท็กซ์เจอร์...',
            'กำลังสร้างวัตถุท้องฟ้า...',
            'กำลังเตรียมปรับความโค้งของกาลอวกาศ...',
            'กำลังคำนวณวงโคจร...',
            'กำลังปรับแต่งระบบนำทางระหว่างดวงดาว...',
            'กำลังเตรียมเครื่องมือสำรวจอวกาศ...',
            'กำลังปรับแต่งเอฟเฟกต์แสง...',
            'เตรียมพร้อมสำหรับการออกเดินทาง...'
        ];
        
        // คืออนิเมชันสำหรับดาวที่หมุนระหว่างโหลด
        this.animation = null;
        
        // สร้าง HTML
        this.create();
        
        // ตั้งค่า loadingManager
        this.setupLoadingManager();
    }
    
    /**
     * สร้างหน้าจอโหลด
     */
    create() {
        // สร้าง container หลัก
        this.loadingElement = document.createElement('div');
        this.loadingElement.id = 'loading';
        this.loadingElement.className = 'loading';
        
        // สร้างชื่อ
        const title = document.createElement('h2');
        title.textContent = 'SPACE JOURNEY';
        title.className = 'loading-title';
        
        // สร้าง loading progress container
        const progressContainer = document.createElement('div');
        progressContainer.id = 'loading-progress';
        progressContainer.className = 'loading-progress';
        
        // สร้าง loading bar
        this.loadingBar = document.createElement('div');
        this.loadingBar.id = 'loading-bar';
        this.loadingBar.className = 'loading-bar';
        
        // สร้างข้อความสถานะ
        this.loadingText = document.createElement('div');
        this.loadingText.id = 'loading-text';
        this.loadingText.className = 'loading-text';
        this.loadingText.textContent = this.getRandomLoadingMessage();
        
        // สร้าง animation container
        const animationContainer = document.createElement('div');
        animationContainer.className = 'loading-animation';
        
        // สร้างอนิเมชัน (รูปดาวที่หมุน)
        for (let i = 0; i < 8; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.transform = `rotate(${i * 45}deg) translateX(30px)`;
            star.style.animationDelay = `${i * 0.1}s`;
            
            const innerStar = document.createElement('div');
            innerStar.className = 'inner-star';
            
            star.appendChild(innerStar);
            animationContainer.appendChild(star);
        }
        
        // ประกอบส่วนต่างๆ เข้าด้วยกัน
        progressContainer.appendChild(this.loadingBar);
        this.loadingElement.appendChild(title);
        this.loadingElement.appendChild(animationContainer);
        this.loadingElement.appendChild(progressContainer);
        this.loadingElement.appendChild(this.loadingText);
        
        // เพิ่ม CSS
        this.addStyles();
        
        // เพิ่มเข้าไปใน container
        this.container.appendChild(this.loadingElement);
    }
    
    /**
     * เพิ่ม CSS สำหรับหน้าจอโหลด
     */
    addStyles() {
        if (document.getElementById('loading-screen-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'loading-screen-styles';
        style.textContent = `
            /* ไม่ได้ใส่สไตล์ซ้ำเพราะมีอยู่ในไฟล์ style.css แล้ว 
               แต่จะเพิ่มสไตล์สำหรับอนิเมชันดาวที่ไม่มีใน style.css */
               
            .loading-animation {
                margin: 20px 0;
                position: relative;
                width: 80px;
                height: 80px;
            }
            
            .star {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 8px;
                height: 8px;
                margin: -4px 0 0 -4px;
                animation: star-pulse 1.5s infinite ease-in-out;
            }
            
            .inner-star {
                width: 100%;
                height: 100%;
                background: #4a9eff;
                border-radius: 50%;
                box-shadow: 0 0 10px 2px rgba(74, 158, 255, 0.7);
            }
            
            @keyframes star-pulse {
                0% { transform: scale(0.8); opacity: 0.5; }
                50% { transform: scale(1.5); opacity: 1; }
                100% { transform: scale(0.8); opacity: 0.5; }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * ตั้งค่า loading manager
     */
    setupLoadingManager() {
        if (!this.loadingManager) return;
        
        // แสดงความคืบหน้าการโหลด
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            this.updateProgress(progress, url);
        };
        
        // เมื่อโหลดเสร็จทั้งหมด
        this.loadingManager.onLoad = () => {
            console.log('All assets loaded');
            this.loadingComplete();
        };
        
        // เมื่อเกิดข้อผิดพลาด
        this.loadingManager.onError = (url) => {
            console.error('Error loading:', url);
            this.showError(`เกิดข้อผิดพลาดในการโหลด: ${url.split('/').pop()}`);
        };
    }
    
    /**
     * แสดงหน้าจอโหลด
     */
    show() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.loadingElement.style.display = 'flex';
        
        // เริ่มแอนิเมชันข้อความ
        this.startTextAnimation();
    }
    
    /**
     * ซ่อนหน้าจอโหลด
     * @param {Function} callback - ฟังก์ชันที่จะเรียกเมื่อเสร็จสิ้น
     */
    hide(callback) {
        if (!this.isActive) {
            if (callback) callback();
            return;
        }
        
        // ซ่อนหน้าจอโหลดด้วยแอนิเมชัน
        gsap.to(this.loadingElement, {
            opacity: 0,
            duration: 1.5,
            ease: "power2.inOut",
            onComplete: () => {
                this.loadingElement.style.display = 'none';
                this.isActive = false;
                
                // หยุดแอนิเมชันข้อความ
                clearInterval(this.animation);
                
                if (callback) callback();
            }
        });
    }
    
    /**
     * อัปเดตความคืบหน้า
     * @param {number} progress - ค่าความคืบหน้า (0-100)
     * @param {string} url - URL ที่กำลังโหลด
     */
    updateProgress(progress, url) {
        this.progress = progress;
        
        // อัปเดต loading bar
        if (this.loadingBar) {
            this.loadingBar.style.width = `${progress}%`;
        }
        
        // อัปเดตข้อความตามความคืบหน้า
        if (this.loadingText) {
            // แสดงไฟล์ที่กำลังโหลด
            const filename = url.split('/').pop();
            
            if (progress < 33) {
                this.loadingText.textContent = `กำลังโหลดเท็กซ์เจอร์: ${filename}`;
            } else if (progress < 66) {
                this.loadingText.textContent = `กำลังสร้างวัตถุท้องฟ้า: ${filename}`;
            } else {
                this.loadingText.textContent = `กำลังเตรียมการเดินทาง: ${progress.toFixed(0)}%`;
            }
        }
    }
    
    /**
     * แสดงข้อความสุ่มระหว่างโหลด
     */
    startTextAnimation() {
        // หยุดแอนิเมชันที่มีอยู่
        clearInterval(this.animation);
        
        // เริ่มแอนิเมชันใหม่
        let messageIndex = 0;
        this.animation = setInterval(() => {
            if (this.progress < 100) {
                this.loadingText.textContent = this.loadingMessages[messageIndex];
                messageIndex = (messageIndex + 1) % this.loadingMessages.length;
            } else {
                this.loadingText.textContent = 'พร้อมเริ่มการเดินทาง!';
                clearInterval(this.animation);
            }
        }, 3000);
    }
    
    /**
     * เมื่อโหลดเสร็จสมบูรณ์
     */
    loadingComplete() {
        // อัปเดตสถานะ
        this.progress = 100;
        
        // อัปเดต loading bar
        if (this.loadingBar) {
            this.loadingBar.style.width = '100%';
        }
        
        // อัปเดตข้อความ
        if (this.loadingText) {
            this.loadingText.textContent = 'การเดินทางพร้อมเริ่มต้นแล้ว!';
        }
        
        // หยุดแอนิเมชันข้อความ
        clearInterval(this.animation);
        
        // ซ่อนหน้าจอโหลดหลังจากผ่านไป 1 วินาที
        setTimeout(() => {
            this.hide();
        }, 1000);
    }
    
    /**
     * แสดงข้อความผิดพลาด
     * @param {string} message - ข้อความผิดพลาด
     */
    showError(message) {
        // แสดงข้อความผิดพลาดในหน้าจอโหลด
        if (this.loadingBar) {
            this.loadingBar.style.background = '#ff5555';
        }
        
        if (this.loadingText) {
            this.loadingText.textContent = message;
            this.loadingText.style.color = '#ff5555';
        }
        
        // หยุดแอนิเมชันข้อความ
        clearInterval(this.animation);
        
        // เพิ่มปุ่มลองใหม่
        const retryButton = document.createElement('button');
        retryButton.textContent = 'ลองใหม่';
        retryButton.className = 'retry-button';
        retryButton.style.marginTop = '20px';
        retryButton.style.padding = '10px 20px';
        retryButton.style.background = '#555';
        retryButton.style.border = 'none';
        retryButton.style.borderRadius = '5px';
        retryButton.style.color = 'white';
        retryButton.style.cursor = 'pointer';
        
        // เพิ่มเอฟเฟกต์ hover
        retryButton.addEventListener('mouseenter', () => {
            retryButton.style.background = '#777';
        });
        
        retryButton.addEventListener('mouseleave', () => {
            retryButton.style.background = '#555';
        });
        
        // Reload หน้าเมื่อกดปุ่มลองใหม่
        retryButton.addEventListener('click', () => {
            window.location.reload();
        });
        
        // เพิ่มปุ่มเข้าไปในหน้าจอโหลด
        this.loadingElement.appendChild(retryButton);
    }
    
    /**
     * รับข้อความโหลดแบบสุ่ม
     * @returns {string} ข้อความโหลด
     */
    getRandomLoadingMessage() {
        const index = Math.floor(Math.random() * this.loadingMessages.length);
        return this.loadingMessages[index];
    }
    
    /**
     * ล้างทรัพยากร
     */
    dispose() {
        // หยุดแอนิเมชันข้อความ
        clearInterval(this.animation);
        
        // ลบหน้าจอโหลด
        if (this.loadingElement && this.loadingElement.parentNode) {
            this.loadingElement.parentNode.removeChild(this.loadingElement);
        }
        
        this.isActive = false;
    }
}