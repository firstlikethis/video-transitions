// ตัวแปรหลักของระบบ
const SCENES = {
    EARTH: 0,
    URANUS: 1,
    GALAXY: 2,
    BLACK_HOLE: 3
};

let currentScene = SCENES.EARTH;
let isTransitioning = false;
let sceneObjects = {};
let sceneManager;
let journeyStarted = false;
let autoTransitionEnabled = true;
let mousePosition = { x: 0, y: 0 };
let lastMousePosition = { x: 0, y: 0 };
let mouseIdle = true;
let audioEnabled = false;
let audioContext;
let backgroundMusic;

// การเริ่มต้นระบบเมื่อโหลดหน้าเว็บเสร็จ
window.addEventListener('load', () => {
    const loadingManager = new THREE.LoadingManager();
    const loadingElement = document.getElementById('loading');
    const loadingBar = document.getElementById('loading-bar');
    
    // จัดการการแสดงความคืบหน้าการโหลด
    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        const progress = (itemsLoaded / itemsTotal) * 100;
        loadingBar.style.width = `${progress}%`;
    };
    
    // เมื่อโหลดเสร็จ แสดงหน้าเริ่มต้น
    loadingManager.onLoad = () => {
        gsap.to(loadingElement, {
            opacity: 0,
            duration: 1.5,
            ease: "power2.inOut",
            onComplete: () => {
                loadingElement.style.display = 'none';
                
                // สร้างหน้าจอเริ่มต้น
                createStartScreen();
                
                // เตรียมกล้องสำหรับฉากเริ่มต้น - มองโลกจากระยะไกล
                sceneManager.camera.position.set(0, 0, 50);
                sceneManager.camera.lookAt(0, 0, 0);
                gsap.to(sceneManager.camera.position, {
                    z: 30,
                    duration: 5,
                    ease: "power1.inOut"
                });
            }
        });
    };
    
    loadingManager.onError = (url) => {
        console.error('Error loading', url);
    };
    
    // สร้าง SceneManager
    sceneManager = new SceneManager(loadingManager);
    
    // ลบปุ่มควบคุมเดิม
    const controlsElement = document.querySelector('.controls');
    if (controlsElement) {
        controlsElement.remove();
    }
    
    // เพิ่ม event listeners สำหรับการควบคุม
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    
    // สร้าง progress bar สำหรับแสดงความคืบหน้า
    createJourneyProgressBar();
    
    // เพิ่ม CSS ที่ปรับปรุงแล้ว
    addEnhancedCSS();
});

// สร้างหน้าจอเริ่มต้น
function createStartScreen() {
    const startOverlay = document.createElement('div');
    startOverlay.id = 'start-overlay';
    startOverlay.innerHTML = `
        <div class="overlay-content">
            <h1>SPACE JOURNEY</h1>
            <p>เดินทางจากโลก สู่ดาวยูเรนัส กาแล็กซี่ และหลุมดำ แบบ Interstellar</p>
            <button id="start-journey">เริ่มการเดินทาง</button>
            <div class="options">
                <label>
                    <input type="checkbox" id="enable-audio"> เปิดเสียง
                </label>
            </div>
        </div>
    `;
    document.body.appendChild(startOverlay);
    
    // Event listener สำหรับปุ่มเริ่มต้น
    document.getElementById('start-journey').addEventListener('click', startJourney);
    document.getElementById('enable-audio').addEventListener('change', (e) => {
        audioEnabled = e.target.checked;
        if (audioEnabled) {
            initAudio();
        }
    });
}

// เริ่มการเดินทาง
function startJourney() {
    const startOverlay = document.getElementById('start-overlay');
    if (startOverlay) {
        gsap.to(startOverlay, {
            opacity: 0,
            duration: 1,
            ease: "power2.inOut",
            onComplete: () => {
                startOverlay.remove();
                
                // แสดง UI ควบคุม
                showJourneyControls();
                
                // เริ่มการเดินทางแบบอัตโนมัติ
                journeyStarted = true;
                
                // เริ่มเล่นเสียงหากผู้ใช้เปิดใช้งาน
                if (audioEnabled && backgroundMusic) {
                    backgroundMusic.play();
                }
                
                // เริ่ม automatic transition หลังจากผ่านไป 8 วินาที
                setTimeout(() => {
                    if (autoTransitionEnabled) {
                        startAutomaticTransition();
                    }
                }, 8000);
            }
        });
    }
}

// สร้าง progress bar สำหรับการเดินทาง
function createJourneyProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'journey-progress';
    progressContainer.innerHTML = `
        <div class="progress-track">
            <div class="progress-marker earth active" data-scene="0">
                <div class="marker-point"></div>
                <span class="marker-label">Earth</span>
            </div>
            <div class="progress-marker uranus" data-scene="1">
                <div class="marker-point"></div>
                <span class="marker-label">Uranus</span>
            </div>
            <div class="progress-marker galaxy" data-scene="2">
                <div class="marker-point"></div>
                <span class="marker-label">Galaxy</span>
            </div>
            <div class="progress-marker blackhole" data-scene="3">
                <div class="marker-point"></div>
                <span class="marker-label">Black Hole</span>
            </div>
            <div class="progress-line">
                <div class="progress-completed"></div>
            </div>
        </div>
        <button id="toggle-auto" class="control-btn" title="Toggle Automatic Journey">
            <span class="auto-icon">▶</span>
        </button>
    `;
    document.body.appendChild(progressContainer);
    
    // ซ่อนไว้ก่อน
    progressContainer.style.opacity = '0';
    
    // Event listeners สำหรับ markers
    document.querySelectorAll('.progress-marker').forEach(marker => {
        marker.addEventListener('click', (e) => {
            if (isTransitioning) return;
            
            const targetScene = parseInt(e.currentTarget.dataset.scene);
            if (targetScene !== currentScene) {
                jumpToScene(targetScene);
            }
        });
    });
    
    // ปุ่มสลับการเคลื่อนที่อัตโนมัติ
    document.getElementById('toggle-auto').addEventListener('click', () => {
        autoTransitionEnabled = !autoTransitionEnabled;
        const icon = document.querySelector('.auto-icon');
        icon.textContent = autoTransitionEnabled ? '▶' : '❚❚';
        
        if (autoTransitionEnabled) {
            startAutomaticTransition();
        }
    });
}

// แสดง UI ควบคุม
function showJourneyControls() {
    const progressContainer = document.querySelector('.journey-progress');
    if (progressContainer) {
        gsap.to(progressContainer, {
            opacity: 1,
            duration: 1,
            delay: 1,
            ease: "power2.inOut"
        });
    }
}

// เริ่ม transition อัตโนมัติ
function startAutomaticTransition() {
    if (!journeyStarted || isTransitioning || !autoTransitionEnabled) return;
    
    // กำหนดเวลาสำหรับแต่ละฉาก (วินาที)
    const sceneDurations = [20, 18, 22, 30];
    
    // ตั้งเวลาเปลี่ยนฉากถัดไป
    setTimeout(() => {
        if (autoTransitionEnabled && !isTransitioning) {
            if (currentScene < SCENES.BLACK_HOLE) {
                // เปลี่ยนไปยังฉากถัดไป
                sceneManager.transitionToScene(currentScene, currentScene + 1);
                updateProgressBar(currentScene + 1);
            } else {
                // สิ้นสุดการเดินทาง - แสดงหน้าจบ
                showJourneyEnd();
            }
        }
    }, sceneDurations[currentScene] * 1000);
}

// อัปเดต progress bar
function updateProgressBar(newSceneIndex) {
    const progressLine = document.querySelector('.progress-completed');
    const progressPercentage = (newSceneIndex / (Object.keys(SCENES).length - 1)) * 100;
    
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
}

// ข้ามไปยังฉากที่ต้องการ
function jumpToScene(targetScene) {
    if (isTransitioning) return;
    
    // หยุดการเปลี่ยนฉากอัตโนมัติชั่วคราว
    const wasAutoEnabled = autoTransitionEnabled;
    autoTransitionEnabled = false;
    
    // เปลี่ยนฉาก
    sceneManager.transitionToScene(currentScene, targetScene);
    updateProgressBar(targetScene);
    
    // คืนค่าสถานะการเปลี่ยนฉากอัตโนมัติ
    setTimeout(() => {
        autoTransitionEnabled = wasAutoEnabled;
        if (autoTransitionEnabled) {
            startAutomaticTransition();
        }
    }, 3000);
}