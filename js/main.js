/**
 * Space Journey - Interactive Transition Experience
 * main.js - ไฟล์หลักในการจัดการการทำงานของแอพพลิเคชัน
 */

// ตัวแปรหลัก
let currentScene = CONSTANTS.SCENES.EARTH;
let isTransitioning = false;
let sceneObjects = {};
let journeyStarted = false;
let autoTransitionEnabled = true;
let mousePosition = { x: 0, y: 0 };
let lastMousePosition = { x: 0, y: 0 };
let mouseIdle = true;
let idleTimer = null;
let qualityLevel = 'HIGH';

// Manager objects
let sceneManager;
let textureManager;
let transitionManager;
let audioManager;
let overlayManager;
let eventManager;
let deviceDetector;
let postProcessingManager;

// เริ่มต้นการทำงาน
window.addEventListener('DOMContentLoaded', initialize);

/**
 * เริ่มต้นการทำงานของแอพพลิเคชัน
 */
function initialize() {
    console.log('Initializing Space Journey Experience...');
    
    // ตรวจสอบอุปกรณ์และกำหนดคุณภาพ
    deviceDetector = new DeviceDetector();
    qualityLevel = deviceDetector.qualityLevel;
    console.log(`Detected device capability: ${qualityLevel}`);
    
    // สร้าง Loading Manager เพื่อติดตามการโหลด assets
    const loadingManager = new THREE.LoadingManager();
    setupLoadingManager(loadingManager);
    
    // สร้าง Managers
    textureManager = new TextureManager(loadingManager);
    audioManager = new AudioManager();
    overlayManager = new OverlayManager();
    
    // เริ่มการโหลด textures
    textureManager.loadTextures().then(() => {
        console.log('All textures loaded successfully');
        
        // สร้าง SceneManager หลังจากโหลด textures เสร็จสิ้น
        sceneManager = new SceneManager(textureManager.textures, textureManager.materials);
        
        // สร้าง post-processing effects
        postProcessingManager = new PostProcessingManager(
            sceneManager.renderer, 
            sceneManager.scene, 
            sceneManager.camera
        );
        
        // ปรับแต่ง quality ตามอุปกรณ์
        applyQualitySettings();
        
        // สร้าง managers อื่นๆ
        transitionManager = new TransitionManager(sceneManager, postProcessingManager, audioManager);
        eventManager = new EventManager(sceneManager, audioManager);
        
        // เพิ่ม event listeners
        setupEventListeners();
        
        // สร้าง UI และหน้าจอเริ่มต้น
        setupUI();
        
        // เริ่มการ render loop
        animate();
        
    }).catch(error => {
        // แสดงข้อความผิดพลาดหากโหลด assets ไม่สำเร็จ
        console.error('Failed to load textures:', error);
        showErrorMessage('Failed to load assets. Please try again later.');
    });
}

/**
 * ตั้งค่า Loading Manager
 * @param {THREE.LoadingManager} loadingManager - THREE.js Loading Manager
 */
function setupLoadingManager(loadingManager) {
    const loadingElement = document.getElementById('loading');
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    
    // แสดงความคืบหน้าการโหลด
    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        const progress = (itemsLoaded / itemsTotal) * 100;
        loadingBar.style.width = `${progress}%`;
        
        // อัปเดตข้อความตามความคืบหน้า
        if (progress < 33) {
            loadingText.textContent = 'Loading textures...';
        } else if (progress < 66) {
            loadingText.textContent = 'Creating celestial objects...';
        } else {
            loadingText.textContent = 'Preparing universe simulation...';
        }
    };
    
    // เมื่อโหลดเสร็จทั้งหมด
    loadingManager.onLoad = () => {
        console.log('All assets loaded');
        
        // ซ่อนหน้าจอโหลดและแสดงหน้าจอเริ่มต้น
        gsap.to(loadingElement, {
            opacity: 0,
            duration: 1.5,
            ease: "power2.inOut",
            onComplete: () => {
                loadingElement.style.display = 'none';
                showStartScreen();
            }
        });
    };
    
    loadingManager.onError = (url) => {
        console.error('Error loading:', url);
        loadingText.textContent = `Error loading: ${url.split('/').pop()}`;
        loadingText.style.color = '#ff5555';
    };
}

/**
 * ปรับแต่งคุณภาพตามประสิทธิภาพของอุปกรณ์
 */
function applyQualitySettings() {
    const settings = CONSTANTS.QUALITY_LEVELS[qualityLevel];
    
    // ปรับขนาด pixel ratio
    sceneManager.renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatio));
    
    // เปิด/ปิด anti-aliasing
    if (!settings.antialias) {
        sceneManager.renderer.antialias = false;
    }
    
    // เปิด/ปิดเงา
    sceneManager.renderer.shadowMap.enabled = settings.shadows;
    
    // ปรับแต่ง post-processing
    if (postProcessingManager) {
        if (!settings.postProcessing) {
            postProcessingManager.disableEffects();
        } else {
            postProcessingManager.adjustQuality(qualityLevel);
        }
    }
    
    // ปรับลดจำนวนอนุภาคหากจำเป็น
    sceneManager.setParticleMultiplier(settings.particleCount);
    
    // ติดตามประสิทธิภาพต่อเนื่องและปรับแต่งอัตโนมัติ
    deviceDetector.monitorPerformance((newSettings) => {
        console.log('Performance issue detected, reducing quality...');
        qualityLevel = deviceDetector.qualityLevel;
        applyQualitySettings();
    });
}

/**
 * ตั้งค่า Event Listeners
 */
function setupEventListeners() {
    // การเคลื่อนไหวของเมาส์
    window.addEventListener('mousemove', handleMouseMove);
    
    // คลิกเมาส์
    window.addEventListener('click', handleClick);
    
    // กดปุ่มคีย์บอร์ด
    window.addEventListener('keydown', handleKeyDown);
    
    // ปรับขนาดหน้าจอ
    window.addEventListener('resize', handleResize);
    
    // Touch events สำหรับอุปกรณ์มือถือ
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    
    // Visibility change เพื่อหยุดหรือเล่นเสียงเมื่อเปลี่ยน tab
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Info button
    document.querySelector('.info-button').addEventListener('click', toggleInfoPopup);
    document.querySelector('.close-info').addEventListener('click', closeInfoPopup);
}

/**
 * จัดการการเคลื่อนไหวของเมาส์
 * @param {MouseEvent} event 
 */
function handleMouseMove(event) {
    // คำนวณตำแหน่งเมาส์แบบ normalized (-1 to 1)
    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -((event.clientY / window.innerHeight) * 2 - 1);
    
    // รีเซ็ต idle timer
    mouseIdle = false;
    resetIdleTimer();
    
    // อัปเดตมุมมองตามตำแหน่งเมาส์
    if (journeyStarted && !isTransitioning && sceneObjects[currentScene]) {
        sceneObjects[currentScene].updateViewByMousePosition(mousePosition);
    }
}

/**
 * จัดการการคลิกเมาส์
 * @param {MouseEvent} event 
 */
function handleClick(event) {
    // ไม่ทำงานหากกำลัง transition
    if (isTransitioning) return;
    
    // สร้างเอฟเฟกต์ ripple ที่ตำแหน่งคลิก
    createRippleEffect(event.clientX, event.clientY);
    
    // ถ้าการเดินทางเริ่มแล้ว และคลิกที่ฉากปัจจุบัน
    if (journeyStarted && sceneObjects[currentScene]) {
        // สร้างเอฟเฟกต์การโต้ตอบกับฉากปัจจุบัน
        sceneObjects[currentScene].handleInteraction(event);
        
        // เล่นเสียงคลิก
        if (audioManager && audioManager.enabled) {
            audioManager.playEffect('click');
        }
    }
}

/**
 * จัดการการกดปุ่มคีย์บอร์ด
 * @param {KeyboardEvent} event 
 */
function handleKeyDown(event) {
    switch (event.code) {
        case 'Space': 
            // Toggle automatic transitions
            toggleAutoTransition();
            break;
        case 'Escape':
            // Toggle UI visibility
            toggleUIVisibility();
            break;
        case 'ArrowRight':
            // Move to next scene
            if (journeyStarted && !isTransitioning && currentScene < CONSTANTS.SCENES.BLACK_HOLE) {
                transitionManager.transitionToScene(currentScene, currentScene + 1);
                updateProgressBar(currentScene + 1);
            }
            break;
        case 'ArrowLeft':
            // Move to previous scene
            if (journeyStarted && !isTransitioning && currentScene > CONSTANTS.SCENES.EARTH) {
                transitionManager.transitionToScene(currentScene, currentScene - 1);
                updateProgressBar(currentScene - 1);
            }
            break;
    }
}

/**
 * จัดการการปรับขนาดหน้าจอ
 */
function handleResize() {
    if (sceneManager) {
        sceneManager.handleResize();
    }
    
    if (postProcessingManager) {
        postProcessingManager.resize(window.innerWidth, window.innerHeight);
    }
}

/**
 * จัดการเมื่อเริ่ม touch บนอุปกรณ์มือถือ
 * @param {TouchEvent} event 
 */
function handleTouchStart(event) {
    if (event.touches.length === 1) {
        // Single touch - save position
        lastMousePosition.x = event.touches[0].clientX;
        lastMousePosition.y = event.touches[0].clientY;
    }
}

/**
 * จัดการการเคลื่อนไหว touch บนอุปกรณ์มือถือ
 * @param {TouchEvent} event 
 */
function handleTouchMove(event) {
    if (event.touches.length === 1) {
        // คำนวณการเคลื่อนที่ของ touch
        const x = event.touches[0].clientX;
        const y = event.touches[0].clientY;
        
        // คำนวณความแตกต่าง
        const deltaX = (x - lastMousePosition.x) / window.innerWidth;
        const deltaY = (y - lastMousePosition.y) / window.innerHeight;
        
        // ปรับตำแหน่งเมาส์
        mousePosition.x += deltaX * 2;
        mousePosition.y -= deltaY * 2;
        
        // จำกัดค่าให้อยู่ในช่วง -1 ถึง 1
        mousePosition.x = Math.max(-1, Math.min(1, mousePosition.x));
        mousePosition.y = Math.max(-1, Math.min(1, mousePosition.y));
        
        // อัปเดตตำแหน่งล่าสุด
        lastMousePosition.x = x;
        lastMousePosition.y = y;
        
        // รีเซ็ต idle timer
        mouseIdle = false;
        resetIdleTimer();
        
        // อัปเดตมุมมองตามตำแหน่ง touch
        if (journeyStarted && !isTransitioning && sceneObjects[currentScene]) {
            sceneObjects[currentScene].updateViewByMousePosition(mousePosition);
        }
        
        // ป้องกันการเลื่อนหน้าเว็บ
        event.preventDefault();
    }
}

/**
 * จัดการเมื่อยกนิ้วออกจากหน้าจอ
 * @param {TouchEvent} event 
 */
function handleTouchEnd(event) {
    // สร้างเอฟเฟกต์คล้ายการคลิกเมื่อยกนิ้วออก
    if (journeyStarted && !isTransitioning && sceneObjects[currentScene]) {
        // ตรวจสอบว่าเป็นการแตะสั้นๆ ไม่ใช่การลาก
        const touchDuration = event.timeStamp - event.changedTouches[0].startTimeStamp;
        if (touchDuration < 200) {
            // สร้างเอฟเฟกต์ ripple ที่ตำแหน่งสุดท้าย
            createRippleEffect(lastMousePosition.x, lastMousePosition.y);
            sceneObjects[currentScene].handleInteraction({
                clientX: lastMousePosition.x,
                clientY: lastMousePosition.y
            });
        }
    }
}

/**
 * จัดการเมื่อ visibility ของหน้าเว็บเปลี่ยน (เช่น เปลี่ยน tab)
 */
function handleVisibilityChange() {
    if (document.hidden) {
        // หยุดเสียงเมื่อเปลี่ยน tab
        if (audioManager && audioManager.enabled) {
            audioManager.pause();
        }
    } else {
        // เล่นเสียงเมื่อกลับมาที่ tab
        if (audioManager && audioManager.enabled) {
            audioManager.resume();
        }
    }
}

/**
 * สร้างเอฟเฟกต์ ripple เมื่อคลิก
 * @param {number} x - พิกัด X ของการคลิก
 * @param {number} y - พิกัด Y ของการคลิก
 */
function createRippleEffect(x, y) {
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
 * รีเซ็ต timer สำหรับการตรวจจับ idle mouse
 */
function resetIdleTimer() {
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
 * สลับการเปลี่ยนฉากอัตโนมัติ
 */
function toggleAutoTransition() {
    autoTransitionEnabled = !autoTransitionEnabled;
    
    // อัปเดตไอคอนปุ่ม
    const icon = document.querySelector('.auto-icon');
    if (icon) {
        icon.textContent = autoTransitionEnabled ? '▶' : '❚❚';
    }
    
    // เริ่มการเปลี่ยนฉากอัตโนมัติหากเปิดใช้งาน
    if (autoTransitionEnabled) {
        startAutomaticTransition();
    }
    
    // แสดงข้อความแจ้งเตือน
    showNotification(autoTransitionEnabled ? 'Auto-navigation enabled' : 'Auto-navigation paused');
}

/**
 * สลับการแสดง UI
 */
function toggleUIVisibility() {
    const journeyProgress = document.querySelector('.journey-progress');
    const sceneLabel = document.querySelector('.scene-label');
    
    // สลับการแสดง progress bar
    if (journeyProgress.style.opacity === '0' || journeyProgress.style.opacity === '') {
        gsap.to(journeyProgress, { opacity: 1, duration: 0.5 });
        gsap.to(sceneLabel, { opacity: 1, duration: 0.5 });
    } else {
        gsap.to(journeyProgress, { opacity: 0, duration: 0.5 });
        gsap.to(sceneLabel, { opacity: 0, duration: 0.5 });
    }
}

/**
 * สลับการแสดง info popup
 */
function toggleInfoPopup() {
    const infoPopup = document.querySelector('.info-popup');
    infoPopup.classList.toggle('active');
}

/**
 * ปิด info popup
 */
function closeInfoPopup() {
    const infoPopup = document.querySelector('.info-popup');
    infoPopup.classList.remove('active');
}

/**
 * แสดงข้อความแจ้งเตือน
 * @param {string} message - ข้อความที่ต้องการแสดง
 * @param {number} duration - ระยะเวลาที่แสดง (วินาที)
 */
function showNotification(message, duration = 2) {
    // ตรวจสอบว่ามี notification อยู่แล้วหรือไม่
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        // สร้าง notification ใหม่
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // อัปเดตข้อความ
    notification.textContent = message;
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    
    // แสดง notification ด้วย animation
    gsap.to(notification, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        onComplete: () => {
            // ซ่อน notification หลังจากผ่านไปตามเวลาที่กำหนด
            gsap.to(notification, {
                opacity: 0,
                y: -20,
                delay: duration,
                duration: 0.3,
                onComplete: () => {
                    notification.remove();
                }
            });
        }
    });
}

/**
 * แสดงข้อความผิดพลาด
 * @param {string} message - ข้อความผิดพลาด
 */
function showErrorMessage(message) {
    const loadingElement = document.getElementById('loading');
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    
    // แสดงข้อความผิดพลาดในหน้าจอโหลด
    loadingBar.style.background = '#ff5555';
    loadingText.textContent = message;
    loadingText.style.color = '#ff5555';
    
    // เพิ่มปุ่มลองใหม่
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Try Again';
    retryButton.className = 'retry-button';
    retryButton.style.marginTop = '20px';
    retryButton.style.padding = '10px 20px';
    retryButton.style.background = '#555';
    retryButton.style.border = 'none';
    retryButton.style.borderRadius = '5px';
    retryButton.style.color = 'white';
    retryButton.style.cursor = 'pointer';
    
    loadingElement.appendChild(retryButton);
    
    // Reload หน้าเมื่อกดปุ่มลองใหม่
    retryButton.addEventListener('click', () => {
        window.location.reload();
    });
}

/**
 * สร้าง UI สำหรับแอพพลิเคชัน
 */
function setupUI() {
    // สร้าง notification สไตล์
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(10, 10, 30, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            backdrop-filter: blur(5px);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            transition: opacity 0.3s, transform 0.3s;
            border: 1px solid rgba(74, 158, 255, 0.3);
        }
    `;
    document.head.appendChild(style);
    
    // เตรียมหน้าจอเริ่มต้น
    const startOverlay = overlayManager.createStartOverlay();
    
    // เตรียมหน้าจอจบการเดินทาง
    overlayManager.createEndOverlay();
}

/**
 * แสดงหน้าจอเริ่มต้น
 */
function showStartScreen() {
    // ซ่อน journey progress เมื่อเริ่มต้น
    document.querySelector('.journey-progress').style.opacity = '0';
    
    // แสดงหน้าจอเริ่มต้น
    overlayManager.showOverlay('start');
    
    // เตรียมกล้องสำหรับฉากเริ่มต้น - มองโลกจากระยะไกล
    sceneManager.camera.position.set(0, 0, 50);
    sceneManager.camera.lookAt(0, 0, 0);
    
    // เคลื่อนกล้องเข้าใกล้โลกช้าๆ
    gsap.to(sceneManager.camera.position, {
        z: 30,
        duration: 5,
        ease: "power1.inOut"
    });
    
    // Event listener สำหรับปุ่มเริ่มการเดินทาง
    document.getElementById('start-journey').addEventListener('click', startJourney);
    
    // Event listener สำหรับ checkbox เปิด/ปิดเสียง
    document.getElementById('enable-audio').addEventListener('change', (e) => {
        if (e.target.checked) {
            audioManager.enable();
        } else {
            audioManager.disable();
        }
    });
}

/**
 * เริ่มการเดินทาง
 */
function startJourney() {
    // ซ่อนหน้าจอเริ่มต้น
    overlayManager.hideOverlay('start', () => {
        // แสดง UI ควบคุม
        showJourneyControls();
        
        // เริ่มการเดินทาง
        journeyStarted = true;
        
        // แสดงฉากเริ่มต้น (โลก)
        sceneManager.showScene(CONSTANTS.SCENES.EARTH);
        
        // อัปเดต progress bar
        updateProgressBar(CONSTANTS.SCENES.EARTH);
        
        // เริ่มเล่นเสียงพื้นหลัง
        if (audioManager && audioManager.enabled) {
            audioManager.playBackgroundSound();
        }
        
        // เริ่ม automatic transition หลังจากผ่านไป 8 วินาที
        setTimeout(() => {
            if (autoTransitionEnabled) {
                startAutomaticTransition();
            }
        }, 8000);
    });
}

/**
 * แสดง UI ควบคุมการเดินทาง
 */
function showJourneyControls() {
    const progressContainer = document.querySelector('.journey-progress');
    const sceneLabel = document.querySelector('.scene-label');
    
    if (progressContainer) {
        // แสดง progress bar และ scene label ด้วย animation
        gsap.to(progressContainer, {
            opacity: 1,
            duration: 1,
            delay: 0.5,
            ease: "power2.inOut"
        });
        
        gsap.to(sceneLabel, {
            opacity: 1,
            duration: 1,
            delay: 0.5,
            ease: "power2.inOut"
        });
    }
    
    // เพิ่ม event listeners สำหรับ markers
    document.querySelectorAll('.progress-marker').forEach(marker => {
        marker.addEventListener('click', (e) => {
            if (isTransitioning) return;
            
            const targetScene = parseInt(e.currentTarget.dataset.scene);
            if (targetScene !== currentScene) {
                jumpToScene(targetScene);
            }
        });
    });
    
    // เพิ่ม event listener สำหรับปุ่มสลับการเปลี่ยนฉากอัตโนมัติ
    document.getElementById('toggle-auto').addEventListener('click', toggleAutoTransition);
}

/**
 * เริ่มการเปลี่ยนฉากอัตโนมัติ
 */
function startAutomaticTransition() {
    if (!journeyStarted || isTransitioning || !autoTransitionEnabled) return;
    
    // กำหนดเวลาสำหรับแต่ละฉาก (วินาที)
    const sceneDurations = CONSTANTS.SCENE_DURATIONS;
    
    // ตั้งเวลาเปลี่ยนฉากถัดไป
    setTimeout(() => {
        if (autoTransitionEnabled && !isTransitioning) {
            if (currentScene < CONSTANTS.SCENES.BLACK_HOLE) {
                // เปลี่ยนไปยังฉากถัดไป
                transitionManager.transitionToScene(currentScene, currentScene + 1);
                updateProgressBar(currentScene + 1);
            } else {
                // สิ้นสุดการเดินทาง - แสดงหน้าจบ
                showJourneyEnd();
            }
        }
    }, sceneDurations[currentScene] * 1000);
}

/**
 * อัปเดต progress bar
 * @param {number} newSceneIndex - ฉากใหม่ที่จะแสดง
 */
function updateProgressBar(newSceneIndex) {
    const progressLine = document.querySelector('.progress-completed');
    const totalScenes = Object.keys(CONSTANTS.SCENES).length;
    const progressPercentage = (newSceneIndex / (totalScenes - 1)) * 100;
    
    // อัปเดตแถบความคืบหน้า
    gsap.to(progressLine, {
        width: `${progressPercentage}%`,
        duration: 1,
        ease: "power1.inOut"
    });
    
    // อัปเดต active marker
    document.querySelectorAll('.progress-marker').forEach((marker, index) => {
        if (index <= newSceneIndex) {
            marker.classList.add('active');
        } else {
            marker.classList.remove('active');
        }
    });
    
    // อัปเดตฉากปัจจุบัน
    currentScene = newSceneIndex;
}

/**
 * ข้ามไปยังฉากที่ต้องการ
 * @param {number} targetScene - ฉากที่ต้องการไป
 */
function jumpToScene(targetScene) {
    if (isTransitioning) return;
    
    // หยุดการเปลี่ยนฉากอัตโนมัติชั่วคราว
    const wasAutoEnabled = autoTransitionEnabled;
    autoTransitionEnabled = false;
    
    // เปลี่ยนฉาก
    transitionManager.transitionToScene(currentScene, targetScene);
    updateProgressBar(targetScene);
    
    // คืนค่าสถานะการเปลี่ยนฉากอัตโนมัติ
    setTimeout(() => {
        autoTransitionEnabled = wasAutoEnabled;
        if (autoTransitionEnabled) {
            startAutomaticTransition();
        }
    }, CONSTANTS.TRANSITION_DURATION * 1000 + 500);
}

/**
 * แสดงหน้าจอจบการเดินทาง
 */
function showJourneyEnd() {
    overlayManager.showOverlay('end');
    
    // เพิ่ม event listener สำหรับปุ่มเริ่มใหม่
    document.getElementById('restart-journey').addEventListener('click', restartJourney);
    
    // หยุดเสียงพื้นหลัง
    if (audioManager && audioManager.enabled) {
        audioManager.fadeOutBackgroundSound();
    }
}

/**
 * เริ่มการเดินทางใหม่
 */
function restartJourney() {
    // ซ่อนหน้าจอจบการเดินทาง
    overlayManager.hideOverlay('end', () => {
        // รีเซ็ตฉากทั้งหมด
        sceneManager.resetAllScenes();
        
        // กลับไปที่ฉากแรก
        transitionManager.transitionToScene(currentScene, CONSTANTS.SCENES.EARTH);
        updateProgressBar(CONSTANTS.SCENES.EARTH);
        
        // เริ่มเล่นเสียงพื้นหลังใหม่
        if (audioManager && audioManager.enabled) {
            audioManager.playBackgroundSound();
        }
        
        // เริ่ม automatic transition ใหม่
        autoTransitionEnabled = true;
        document.querySelector('.auto-icon').textContent = '▶';
        
        setTimeout(() => {
            if (autoTransitionEnabled) {
                startAutomaticTransition();
            }
        }, 8000);
    });
}

/**
 * Animation loop หลัก
 */
function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now() * 0.001; // เวลาในหน่วยวินาที
    
    // อัปเดตฉากที่แสดงอยู่
    if (sceneManager && journeyStarted) {
        sceneManager.update(time);
    }
    
    // อัปเดต managers
    if (audioManager && audioManager.enabled) {
        audioManager.update(time);
    }
    
    if (textureManager) {
        textureManager.update(time);
    }
    
    // เรนเดอร์ด้วย post-processing ถ้ามี
    if (postProcessingManager && CONSTANTS.QUALITY_LEVELS[qualityLevel].postProcessing) {
        postProcessingManager.render();
    } else if (sceneManager) {
        // เรนเดอร์ปกติถ้าไม่มี post-processing
        sceneManager.renderer.render(sceneManager.scene, sceneManager.camera);
    }
}