/**
 * EventManager.js
 * ระบบจัดการอีเวนต์ทั้งหมดในแอพพลิเคชัน
 * รับผิดชอบการประสานงานระหว่างการโต้ตอบของผู้ใช้และคอมโพเนนต์ต่างๆ
 */
class EventManager {
    /**
     * สร้าง EventManager
     * @param {SceneManager} sceneManager - ตัวจัดการฉาก
     * @param {AudioManager} audioManager - ตัวจัดการเสียง
     */
    constructor(sceneManager, audioManager) {
        this.sceneManager = sceneManager;
        this.audioManager = audioManager;
        
        // เก็บอีเวนต์ที่ลงทะเบียนไว้
        this.eventListeners = {};
        
        // เก็บรายการคีย์ที่กำลังถูกกด
        this.keysPressed = {};
        
        // จุดเริ่มต้นของการสัมผัส (touch)
        this.touchStartPosition = { x: 0, y: 0 };
        
        // เวลาเริ่มต้นของการสัมผัส
        this.touchStartTime = 0;
        
        // ตั้งค่า throttle สำหรับอีเวนต์ที่เกิดบ่อย
        this.throttled = {
            mousemove: false,
            scroll: false
        };
        
        // ตั้งค่าเริ่มต้น
        this.setupBaseEvents();
    }
    
    /**
     * ตั้งค่าอีเวนต์พื้นฐาน
     */
    setupBaseEvents() {
        // ลงทะเบียนอีเวนต์การคลิกทั่วไป
        this.addDocumentEventListener('click', (event) => {
            this.handleClick(event);
        });
        
        // ลงทะเบียนอีเวนต์การเคลื่อนที่ของเมาส์
        this.addDocumentEventListener('mousemove', (event) => {
            if (this.throttled.mousemove) return;
            this.throttled.mousemove = true;
            
            setTimeout(() => {
                this.throttled.mousemove = false;
            }, 16); // ~60fps
            
            this.handleMouseMove(event);
        });
        
        // ลงทะเบียนอีเวนต์การกดปุ่มคีย์บอร์ด
        this.addDocumentEventListener('keydown', (event) => {
            this.keysPressed[event.code] = true;
            this.handleKeyDown(event);
        });
        
        // ลงทะเบียนอีเวนต์การปล่อยปุ่มคีย์บอร์ด
        this.addDocumentEventListener('keyup', (event) => {
            this.keysPressed[event.code] = false;
            this.handleKeyUp(event);
        });
        
        // ลงทะเบียนอีเวนต์การปรับขนาดหน้าจอ
        this.addWindowEventListener('resize', () => {
            this.handleResize();
        });
        
        // ลงทะเบียนอีเวนต์ touch สำหรับมือถือ
        this.addDocumentEventListener('touchstart', (event) => {
            this.handleTouchStart(event);
        });
        
        this.addDocumentEventListener('touchmove', (event) => {
            this.handleTouchMove(event);
        });
        
        this.addDocumentEventListener('touchend', (event) => {
            this.handleTouchEnd(event);
        });
        
        // ลงทะเบียนอีเวนต์การเปลี่ยน visibility
        this.addDocumentEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // ลงทะเบียนอีเวนต์การเลื่อนหน้าจอ
        this.addDocumentEventListener('wheel', (event) => {
            if (this.throttled.scroll) return;
            this.throttled.scroll = true;
            
            setTimeout(() => {
                this.throttled.scroll = false;
            }, 50);
            
            this.handleScroll(event);
        });
    }
    
    /**
     * เพิ่ม event listener ที่ document
     * @param {string} type - ประเภทของอีเวนต์
     * @param {Function} callback - ฟังก์ชันที่จะเรียกเมื่อเกิดอีเวนต์
     * @param {Object} options - ตัวเลือกเพิ่มเติม
     */
    addDocumentEventListener(type, callback, options) {
        document.addEventListener(type, callback, options);
        
        // เก็บไว้เพื่อให้สามารถลบได้ภายหลัง
        if (!this.eventListeners[type]) {
            this.eventListeners[type] = [];
        }
        
        this.eventListeners[type].push({
            target: document,
            callback: callback,
            options: options
        });
    }
    
    /**
     * เพิ่ม event listener ที่ window
     * @param {string} type - ประเภทของอีเวนต์
     * @param {Function} callback - ฟังก์ชันที่จะเรียกเมื่อเกิดอีเวนต์
     * @param {Object} options - ตัวเลือกเพิ่มเติม
     */
    addWindowEventListener(type, callback, options) {
        window.addEventListener(type, callback, options);
        
        // เก็บไว้เพื่อให้สามารถลบได้ภายหลัง
        if (!this.eventListeners[type]) {
            this.eventListeners[type] = [];
        }
        
        this.eventListeners[type].push({
            target: window,
            callback: callback,
            options: options
        });
    }
    
    /**
     * เพิ่ม event listener ที่ element ใดๆ
     * @param {HTMLElement} element - Element ที่ต้องการเพิ่ม listener
     * @param {string} type - ประเภทของอีเวนต์
     * @param {Function} callback - ฟังก์ชันที่จะเรียกเมื่อเกิดอีเวนต์
     * @param {Object} options - ตัวเลือกเพิ่มเติม
     */
    addElementEventListener(element, type, callback, options) {
        if (!element) return;
        
        element.addEventListener(type, callback, options);
        
        // สร้าง key เฉพาะสำหรับ element
        const key = `${type}_${element.id || 'unknown'}`;
        
        // เก็บไว้เพื่อให้สามารถลบได้ภายหลัง
        if (!this.eventListeners[key]) {
            this.eventListeners[key] = [];
        }
        
        this.eventListeners[key].push({
            target: element,
            callback: callback,
            options: options
        });
    }
    
    /**
     * ลบ event listener
     * @param {string} type - ประเภทของอีเวนต์
     */
    removeEventListener(type) {
        if (!this.eventListeners[type]) return;
        
        this.eventListeners[type].forEach(listener => {
            listener.target.removeEventListener(type, listener.callback, listener.options);
        });
        
        // ลบรายการ listener
        delete this.eventListeners[type];
    }
    
    /**
     * จัดการเมื่อมีการคลิก
     * @param {MouseEvent} event - อีเวนต์การคลิก
     */
    handleClick(event) {
        // ตรวจสอบว่าคลิกที่ UI หรือไม่
        if (this.isClickOnUI(event)) {
            return; // ไม่ทำอะไรถ้าคลิกที่ UI
        }
        
        // สร้างเอฟเฟกต์ ripple
        this.createRippleEffect(event.clientX, event.clientY);
        
        // เล่นเสียงคลิก
        if (this.audioManager && this.audioManager.enabled) {
            this.audioManager.playEffect('click');
        }
        
        // ส่งไปยังฉากปัจจุบัน
        if (journeyStarted && !isTransitioning && sceneObjects[currentScene]) {
            sceneObjects[currentScene].handleInteraction(event);
        }
        
        // Emit custom event
        this.emitCustomEvent('app-click', {
            x: event.clientX,
            y: event.clientY,
            target: event.target
        });
    }
    
    /**
     * จัดการเมื่อเมาส์เคลื่อนที่
     * @param {MouseEvent} event - อีเวนต์การเคลื่อนที่ของเมาส์
     */
    handleMouseMove(event) {
        // คำนวณตำแหน่งเมาส์แบบ normalized (-1 to 1)
        const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
        const normalizedY = -((event.clientY / window.innerHeight) * 2 - 1);
        
        // อัปเดตตำแหน่งเมาส์
        mousePosition.x = normalizedX;
        mousePosition.y = normalizedY;
        
        // รีเซ็ต idle timer
        mouseIdle = false;
        this.resetIdleTimer();
        
        // อัปเดตมุมมองตามตำแหน่งเมาส์
        if (journeyStarted && !isTransitioning && sceneObjects[currentScene]) {
            sceneObjects[currentScene].updateViewByMousePosition(mousePosition);
        }
        
        // ตรวจสอบว่าเมาส์อยู่เหนือปุ่มหรือไม่
        const hoveredButtons = document.querySelectorAll('button:hover, .control-btn:hover, .progress-marker:hover');
        if (hoveredButtons.length > 0 && !this.lastHoveredElement) {
            // เล่นเสียง hover
            if (this.audioManager && this.audioManager.enabled) {
                this.audioManager.playEffect('hover');
            }
            
            this.lastHoveredElement = hoveredButtons[0];
        } else if (hoveredButtons.length === 0) {
            this.lastHoveredElement = null;
        }
        
        // Emit custom event
        this.emitCustomEvent('app-mousemove', {
            x: normalizedX,
            y: normalizedY,
            originalEvent: event
        });
    }
    
    /**
     * จัดการเมื่อมีการกดปุ่มคีย์บอร์ด
     * @param {KeyboardEvent} event - อีเวนต์การกดปุ่ม
     */
    handleKeyDown(event) {
        switch (event.code) {
            case 'Space': 
                // สลับการเปลี่ยนฉากอัตโนมัติ
                if (journeyStarted) {
                    toggleAutoTransition();
                }
                break;
                
            case 'Escape':
                // สลับการแสดง UI
                toggleUIVisibility();
                break;
                
            case 'ArrowRight':
                // ไปยังฉากถัดไป
                if (journeyStarted && !isTransitioning && currentScene < CONSTANTS.SCENES.BLACK_HOLE) {
                    transitionManager.transitionToScene(currentScene, currentScene + 1);
                    updateProgressBar(currentScene + 1);
                }
                break;
                
            case 'ArrowLeft':
                // ไปยังฉากก่อนหน้า
                if (journeyStarted && !isTransitioning && currentScene > CONSTANTS.SCENES.EARTH) {
                    transitionManager.transitionToScene(currentScene, currentScene - 1);
                    updateProgressBar(currentScene - 1);
                }
                break;
                
            case 'KeyI':
                // แสดง/ซ่อนข้อมูล
                toggleInfoPopup();
                break;
        }
        
        // Emit custom event
        this.emitCustomEvent('app-keydown', {
            code: event.code,
            key: event.key,
            originalEvent: event
        });
    }
    
    /**
     * จัดการเมื่อมีการปล่อยปุ่มคีย์บอร์ด
     * @param {KeyboardEvent} event - อีเวนต์การปล่อยปุ่ม
     */
    handleKeyUp(event) {
        // Emit custom event
        this.emitCustomEvent('app-keyup', {
            code: event.code,
            key: event.key,
            originalEvent: event
        });
    }
    
    /**
     * จัดการเมื่อมีการปรับขนาดหน้าจอ
     */
    handleResize() {
        // อัปเดต SceneManager
        if (this.sceneManager) {
            this.sceneManager.handleResize();
        }
        
        // อัปเดต PostProcessingManager
        if (postProcessingManager) {
            postProcessingManager.resize(window.innerWidth, window.innerHeight);
        }
        
        // ตรวจสอบขนาดหน้าจอเพื่อปรับ UI
        this.adjustUIForScreenSize();
        
        // Emit custom event
        this.emitCustomEvent('app-resize', {
            width: window.innerWidth,
            height: window.innerHeight
        });
    }
    
    /**
     * จัดการเมื่อเริ่มการสัมผัส (touch)
     * @param {TouchEvent} event - อีเวนต์การสัมผัส
     */
    handleTouchStart(event) {
        if (event.touches.length === 1) {
            // บันทึกตำแหน่งเริ่มต้น
            this.touchStartPosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            
            // บันทึกเวลาเริ่มต้น
            this.touchStartTime = event.timeStamp;
            
            // เพิ่มข้อมูลเวลาเริ่มต้นให้กับ touch
            event.changedTouches[0].startTimeStamp = event.timeStamp;
        }
        
        // Emit custom event
        this.emitCustomEvent('app-touchstart', {
            position: this.touchStartPosition,
            originalEvent: event
        });
    }
    
    /**
     * จัดการเมื่อมีการเคลื่อนที่ของการสัมผัส
     * @param {TouchEvent} event - อีเวนต์การสัมผัส
     */
    handleTouchMove(event) {
        if (event.touches.length === 1) {
            // คำนวณตำแหน่งปัจจุบัน
            const currentPosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            
            // คำนวณระยะทางที่เคลื่อนที่
            const deltaX = (currentPosition.x - this.touchStartPosition.x) / window.innerWidth;
            const deltaY = (currentPosition.y - this.touchStartPosition.y) / window.innerHeight;
            
            // อัปเดตตำแหน่งเมาส์ (สำหรับการหมุนฉาก)
            mousePosition.x = Math.max(-1, Math.min(1, deltaX * 2));
            mousePosition.y = Math.max(-1, Math.min(1, -deltaY * 2));
            
            // รีเซ็ต idle timer
            mouseIdle = false;
            this.resetIdleTimer();
            
            // อัปเดตมุมมองตามตำแหน่ง touch
            if (journeyStarted && !isTransitioning && sceneObjects[currentScene]) {
                sceneObjects[currentScene].updateViewByMousePosition(mousePosition);
            }
            
            // เลื่อนฉากหากมีการ swipe ที่ชัดเจน
            const swipeThreshold = 0.2; // 20% ของความกว้างหน้าจอ
            
            if (Math.abs(deltaX) > swipeThreshold && this.canSwipe) {
                this.canSwipe = false;
                
                if (deltaX > 0 && currentScene > CONSTANTS.SCENES.EARTH) {
                    // Swipe ไปทางขวา - ไปฉากก่อนหน้า
                    transitionManager.transitionToScene(currentScene, currentScene - 1);
                    updateProgressBar(currentScene - 1);
                } else if (deltaX < 0 && currentScene < CONSTANTS.SCENES.BLACK_HOLE) {
                    // Swipe ไปทางซ้าย - ไปฉากถัดไป
                    transitionManager.transitionToScene(currentScene, currentScene + 1);
                    updateProgressBar(currentScene + 1);
                }
                
                // ป้องกันการ swipe ซ้ำ
                setTimeout(() => {
                    this.canSwipe = true;
                }, 1000);
            }
            
            // อัปเดตตำแหน่งเริ่มต้น
            this.touchStartPosition = currentPosition;
            
            // ป้องกันการเลื่อนหน้าเว็บ
            event.preventDefault();
        }
        
        // Emit custom event
        this.emitCustomEvent('app-touchmove', {
            originalEvent: event
        });
    }
    
    /**
     * จัดการเมื่อสิ้นสุดการสัมผัส
     * @param {TouchEvent} event - อีเวนต์การสัมผัส
     */
    handleTouchEnd(event) {
        if (event.changedTouches.length > 0) {
            // คำนวณระยะเวลาและระยะทาง
            const touchDuration = event.timeStamp - this.touchStartTime;
            const touch = event.changedTouches[0];
            const touchX = touch.clientX;
            const touchY = touch.clientY;
            
            // ตรวจสอบว่าเป็นการแตะแบบสั้นๆ (tap)
            if (touchDuration < 200) {
                // ตรวจสอบว่าแตะที่ UI หรือไม่
                const element = document.elementFromPoint(touchX, touchY);
                if (element && !this.isUIElement(element)) {
                    // สร้างเอฟเฟกต์ ripple
                    this.createRippleEffect(touchX, touchY);
                    
                    // ส่งไปยังฉากปัจจุบัน
                    if (journeyStarted && !isTransitioning && sceneObjects[currentScene]) {
                        sceneObjects[currentScene].handleInteraction({
                            clientX: touchX,
                            clientY: touchY
                        });
                        
                        // เล่นเสียงคลิก
                        if (this.audioManager && this.audioManager.enabled) {
                            this.audioManager.playEffect('click');
                        }
                    }
                }
            }
        }
        
        // Emit custom event
        this.emitCustomEvent('app-touchend', {
            originalEvent: event
        });
    }
    
    /**
     * จัดการเมื่อมีการเปลี่ยน visibility
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // หยุดเสียงเมื่อเปลี่ยน tab
            if (this.audioManager && this.audioManager.enabled) {
                this.audioManager.pause();
            }
            
            // หยุดแอนิเมชันที่ไม่จำเป็น
            if (autoTransitionEnabled) {
                // เก็บสถานะไว้
                this.wasAutoEnabled = true;
                autoTransitionEnabled = false;
            }
        } else {
            // เล่นเสียงเมื่อกลับมาที่ tab
            if (this.audioManager && this.audioManager.enabled) {
                this.audioManager.resume();
            }
            
            // เริ่มแอนิเมชันที่หยุดไว้
            if (this.wasAutoEnabled) {
                autoTransitionEnabled = true;
                this.wasAutoEnabled = false;
                
                // เริ่มการเปลี่ยนฉากอัตโนมัติ
                startAutomaticTransition();
            }
        }
        
        // Emit custom event
        this.emitCustomEvent('app-visibilitychange', {
            isHidden: document.hidden
        });
    }
    
    /**
     * จัดการเมื่อมีการเลื่อนหน้าจอ
     * @param {WheelEvent} event - อีเวนต์การเลื่อน
     */
    handleScroll(event) {
        // ตรวจสอบทิศทางการเลื่อน
        const direction = Math.sign(event.deltaY);
        
        // ตรวจสอบว่าการเดินทางเริ่มแล้วและไม่อยู่ในระหว่างการเปลี่ยนฉาก
        if (journeyStarted && !isTransitioning) {
            if (direction > 0 && currentScene < CONSTANTS.SCENES.BLACK_HOLE) {
                // เลื่อนลง - ไปฉากถัดไป
                transitionManager.transitionToScene(currentScene, currentScene + 1);
                updateProgressBar(currentScene + 1);
            } else if (direction < 0 && currentScene > CONSTANTS.SCENES.EARTH) {
                // เลื่อนขึ้น - ไปฉากก่อนหน้า
                transitionManager.transitionToScene(currentScene, currentScene - 1);
                updateProgressBar(currentScene - 1);
            }
        }
        
        // ป้องกันการเลื่อนหน้าเว็บ
        event.preventDefault();
        
        // Emit custom event
        this.emitCustomEvent('app-scroll', {
            direction: direction,
            originalEvent: event
        });
    }
    
    /**
     * รีเซ็ต timer สำหรับการตรวจจับ idle mouse
     */
    resetIdleTimer() {
        clearTimeout(idleTimer);
        
        idleTimer = setTimeout(() => {
            mouseIdle = true;
            
            // รีเซ็ตมุมมองการหมุนของฉากกลับไปตำแหน่งเริ่มต้น
            if (journeyStarted && !isTransitioning && sceneObjects[currentScene]) {
                sceneObjects[currentScene].resetView();
            }
        }, 5000); // 5 วินาทีไม่ขยับเมาส์จะถือว่า idle
    }
    
    /**
     * สร้างเอฟเฟกต์ ripple
     * @param {number} x - พิกัด X
     * @param {number} y - พิกัด Y
     */
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
    
    /**
     * ตรวจสอบว่าการคลิกอยู่บน UI หรือไม่
     * @param {MouseEvent} event - อีเวนต์การคลิก
     * @returns {boolean} true ถ้าคลิกบน UI
     */
    isClickOnUI(event) {
        return this.isUIElement(event.target);
    }
    
    /**
     * ตรวจสอบว่าเป็น UI element หรือไม่
     * @param {HTMLElement} element - element ที่ต้องการตรวจสอบ
     * @returns {boolean} true ถ้าเป็น UI element
     */
    isUIElement(element) {
        // จัดการการคลิก element ที่เป็น UI
        const isUI = element.closest('.overlay') || 
                     element.closest('.journey-progress') ||
                     element.closest('.info-button') || 
                     element.closest('.info-popup') ||
                     element.tagName === 'BUTTON';
        
        return isUI;
    }
    
    /**
     * ปรับ UI ตามขนาดหน้าจอ
     */
    adjustUIForScreenSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // ปรับขนาด progress bar
        const progressBar = document.querySelector('.journey-progress');
        if (progressBar) {
            if (width < 480) {
                progressBar.style.width = '90%';
                progressBar.style.padding = '0.6rem 1rem';
            } else if (width < 768) {
                progressBar.style.width = '90%';
                progressBar.style.padding = '0.8rem 1.2rem';
            } else {
                progressBar.style.width = '31.25rem';
                progressBar.style.padding = '1.25rem 1.563rem';
            }
        }
        
        // ปรับขนาด scene label
        const sceneLabel = document.querySelector('.scene-label');
        if (sceneLabel) {
            if (width < 480) {
                sceneLabel.style.fontSize = '1.25rem';
                sceneLabel.style.padding = '0.375rem 1.25rem';
            } else if (width < 768) {
                sceneLabel.style.fontSize = '1.5rem';
                sceneLabel.style.padding = '0.5rem 1.5rem';
            } else {
                sceneLabel.style.fontSize = '2rem';
                sceneLabel.style.padding = '0.625rem 2.5rem';
            }
        }
        
        // ปรับตำแหน่งปุ่มข้อมูล
        const infoButton = document.querySelector('.info-button');
        if (infoButton) {
            if (height < 500) {
                infoButton.style.top = '0.5rem';
                infoButton.style.right = '0.5rem';
            } else {
                infoButton.style.top = '1.25rem';
                infoButton.style.right = '1.25rem';
            }
        }
    }
    
    /**
     * เพิ่ม event listeners ให้ปุ่มที่มีการเปลี่ยนฉาก
     */
    setupSceneNavigation() {
        // เพิ่ม event listeners สำหรับ markers
        document.querySelectorAll('.progress-marker').forEach(marker => {
            this.addElementEventListener(marker, 'click', (e) => {
                if (isTransitioning) return;
                
                const targetScene = parseInt(e.currentTarget.dataset.scene);
                if (targetScene !== currentScene) {
                    jumpToScene(targetScene);
                }
            });
            
            // เพิ่ม event listener สำหรับ hover
            this.addElementEventListener(marker, 'mouseenter', () => {
                if (this.audioManager && this.audioManager.enabled) {
                    this.audioManager.playEffect('hover');
                }
            });
        });
        
        // เพิ่ม event listener สำหรับปุ่มสลับการเปลี่ยนฉากอัตโนมัติ
        const autoButton = document.getElementById('toggle-auto');
        if (autoButton) {
            this.addElementEventListener(autoButton, 'click', toggleAutoTransition);
            
            // เพิ่ม event listener สำหรับ hover
            this.addElementEventListener(autoButton, 'mouseenter', () => {
                if (this.audioManager && this.audioManager.enabled) {
                    this.audioManager.playEffect('hover');
                }
            });
        }
    }
    
    /**
     * สร้างและเรียก custom event
     * @param {string} name - ชื่ออีเวนต์
     * @param {Object} detail - รายละเอียดอีเวนต์
     */
    emitCustomEvent(name, detail) {
        const event = new CustomEvent(name, { detail });
        document.dispatchEvent(event);
    }
    
    /**
     * ล้างทรัพยากรและ event listeners
     */
    dispose() {
        // ล้าง event listeners ทั้งหมด
        for (const type in this.eventListeners) {
            this.removeEventListener(type);
        }
        
        // ล้าง idle timer
        clearTimeout(idleTimer);
    }
}