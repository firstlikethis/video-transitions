// DeviceDetector.js
class DeviceDetector {
    constructor() {
        this.deviceInfo = this.detectDevice();
        this.qualityLevel = this.determineQualityLevel();
    }
    
    // ตรวจสอบข้อมูลอุปกรณ์
    detectDevice() {
        const info = {
            isMobile: false,
            isTablet: false,
            isLowPower: false,
            isLowMemory: false,
            isLowBattery: false,
            browserSupportsWebGL2: false,
            maxTextureSize: 0,
            devicePixelRatio: window.devicePixelRatio || 1,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight
        };
        
        // ตรวจสอบอุปกรณ์มือถือ
        info.isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // ตรวจสอบแท็บเล็ต
        info.isTablet = /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent);
        
        // ตรวจสอบขนาดหน้าจอเล็ก
        info.isSmallScreen = window.innerWidth < 768;
        
        // ตรวจสอบการรองรับ WebGL2
        try {
            const canvas = document.createElement('canvas');
            info.browserSupportsWebGL2 = !!window.WebGL2RenderingContext && 
                !!(canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2'));
                
            // ตรวจสอบขนาด texture สูงสุด
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                info.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                
                // ตรวจสอบความสามารถของ GPU
                const ext = gl.getExtension('WEBGL_debug_renderer_info');
                if (ext) {
                    info.renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
                    info.vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
                    
                    // ตรวจสอบการ์ดจอแบบ integrated หรือประสิทธิภาพต่ำ
                    const lowGPUKeywords = ['intel', 'hd graphics', 'mesa', 'llvmpipe', 'swiftshader'];
                    info.isLowPower = lowGPUKeywords.some(keyword => 
                        info.renderer && info.renderer.toLowerCase().includes(keyword)
                    );
                }
            }
        } catch (e) {
            console.warn("Error detecting WebGL capabilities:", e);
            info.isLowPower = true;
        }
        
        // ตรวจสอบหน่วยความจำต่ำ
        info.isLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
        
        // ตรวจสอบการเชื่อมต่อช้า
        if (navigator.connection) {
            info.connectionType = navigator.connection.effectiveType;
            info.isSlowConnection = ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType);
        }
        
        // ตรวจสอบแบตเตอรี่
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                info.batteryLevel = battery.level;
                info.isCharging = battery.charging;
                info.isLowBattery = battery.level < 0.2 && !battery.charging;
            }).catch(e => {
                console.warn("Unable to access battery status:", e);
            });
        }
        
        return info;
    }
    
    // กำหนดระดับคุณภาพตามข้อมูลอุปกรณ์
    determineQualityLevel() {
        // เริ่มต้นที่คุณภาพสูง
        let quality = 'HIGH';
        
        // ลดคุณภาพตามข้อจำกัดของอุปกรณ์
        if (this.deviceInfo.isMobile || this.deviceInfo.isTablet) {
            quality = 'MEDIUM';
        }
        
        if (this.deviceInfo.isLowPower || 
            this.deviceInfo.isLowMemory || 
            this.deviceInfo.isLowBattery ||
            this.deviceInfo.isSmallScreen ||
            this.deviceInfo.isSlowConnection) {
            quality = 'LOW';
        }
        
        // จำกัดคุณภาพตามขนาด texture สูงสุด
        if (this.deviceInfo.maxTextureSize && this.deviceInfo.maxTextureSize < 4096) {
            quality = 'MEDIUM';
        }
        
        if (this.deviceInfo.maxTextureSize && this.deviceInfo.maxTextureSize < 2048) {
            quality = 'LOW';
        }
        
        return quality;
    }
    
    // รับการตั้งค่าคุณภาพที่เหมาะสมสำหรับอุปกรณ์
    getQualitySettings() {
        return CONSTANTS.QUALITY_LEVELS[this.qualityLevel];
    }
    
    // ตรวจสอบเฟรมเรตและปรับคุณภาพหากจำเป็น
    monitorPerformance(callback) {
        let frameCount = 0;
        let lastTime = performance.now();
        let fps = 0;
        
        // ตรวจสอบเฟรมเรตทุกๆ 1 วินาที
        const checkPerformance = () => {
            const currentTime = performance.now();
            const delta = currentTime - lastTime;
            
            if (delta >= 1000) {
                fps = frameCount * 1000 / delta;
                frameCount = 0;
                lastTime = currentTime;
                
                // หากเฟรมเรตต่ำเกินไป ให้ลดคุณภาพ
                if (fps < CONSTANTS.MIN_ACCEPTABLE_FPS) {
                    if (this.qualityLevel === 'HIGH') {
                        this.qualityLevel = 'MEDIUM';
                    } else if (this.qualityLevel === 'MEDIUM') {
                        this.qualityLevel = 'LOW';
                    }
                    
                    if (callback) callback(this.getQualitySettings());
                }
            }
            
            frameCount++;
            requestAnimationFrame(checkPerformance);
        };
        
        checkPerformance();
    }
}