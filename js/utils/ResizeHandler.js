class ResizeHandler {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        
        // Setup resize event listener
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Initial setup
        this.handleResize();
    }
    
    handleResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size and pixel ratio
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        
        // Check for device capabilities and adjust quality if needed
        this.adjustQualityBasedOnDevice();
    }
    
    adjustQualityBasedOnDevice() {
        const dpr = window.devicePixelRatio;
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isLowPowerDevice = this.detectLowPowerDevice();
        
        // For very high resolution displays, limit pixel ratio
        if (dpr > 2 || (width * height > 2073600)) { // 1920x1080
            this.renderer.setPixelRatio(Math.min(dpr, 2));
        }
        
        // For lower power devices, reduce rendering quality
        if (isLowPowerDevice) {
            this.renderer.setPixelRatio(1);
            
            // Disable shadows for better performance
            this.renderer.shadowMap.enabled = false;
        }
    }
    
    detectLowPowerDevice() {
        // Simple heuristic to detect potentially low-power devices
        // Based on screen size, pixel ratio, and mobile detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth < 768;
        const hasLowPixelRatio = window.devicePixelRatio < 2;
        
        // Check for battery API to detect low power mode if available
        let isLowPower = false;
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                if (battery.level < 0.2 && !battery.charging) {
                    isLowPower = true;
                }
            }).catch(() => {
                // Battery API not available or error
            });
        }
        
        return (isMobile && isSmallScreen) || isLowPower;
    }
}