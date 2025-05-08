// AudioManager.js
class AudioManager {
    constructor() {
        this.initialized = false;
        this.enabled = false;
        this.audioContext = null;
        this.sounds = {};
        
        // ลองสร้าง AudioContext เพื่อตรวจสอบการรองรับ
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.initialized = true;
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser");
        }
    }
    
    // เปิดใช้งานเสียง
    enable() {
        if (!this.initialized) return;
        
        this.enabled = true;
        
        // รีซูมเสียงหากถูกพัก
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // สร้างเสียงพื้นหลัง
        this.createBackgroundSound();
    }
    
    // ปิดใช้งานเสียง
    disable() {
        if (!this.initialized) return;
        
        this.enabled = false;
        
        // พักการทำงานของ AudioContext
        if (this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }
    
    // สร้างเสียงพื้นหลัก
    createBackgroundSound() {
        if (!this.initialized || !this.enabled) return;
        
        // สร้างเสียงแอมเบียนท์สำหรับอวกาศ
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, this.audioContext.currentTime);
        filter.Q.setValueAtTime(10, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 3);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        
        this.sounds.background = {
            oscillator: oscillator,
            gainNode: gainNode,
            filter: filter,
            playing: true
        };
    }
    
    // สร้างเสียงสำหรับการเปลี่ยนฉาก
    createTransitionSound(fromIndex, toIndex) {
        if (!this.initialized || !this.enabled) return;
        
        // ตั้งค่าโทนเสียงตามฉาก
        let frequency = 300;
        let type = 'sine';
        
        if (toIndex === CONSTANTS.SCENES.BLACK_HOLE) {
            frequency = 80;
            type = 'sawtooth';
        } else if (toIndex === CONSTANTS.SCENES.GALAXY) {
            frequency = 200;
            type = 'triangle';
        } else if (toIndex === CONSTANTS.SCENES.URANUS) {
            frequency = 150;
            type = 'sine';
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 2);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 2);
        
        return {
            oscillator,
            gainNode,
            filter
        };
    }
    
    // ปรับเปลี่ยนเสียงตามฉาก
    changeSceneAudio(sceneIndex) {
        if (!this.initialized || !this.enabled || !this.sounds.background) return;
        
        const settings = CONSTANTS.SCENE_SETTINGS[sceneIndex].audio;
        
        // ปรับเสียงพื้นหลัง
        this.sounds.background.filter.frequency.linearRampToValueAtTime(
            settings.filterFrequency, 
            this.audioContext.currentTime + 1
        );
        
        this.sounds.background.oscillator.frequency.linearRampToValueAtTime(
            settings.frequency, 
            this.audioContext.currentTime + 1
        );
        
        // ปรับความดัง
        this.sounds.background.gainNode.gain.linearRampToValueAtTime(
            settings.ambientVolume * 0.05, // คูณด้วย 0.05 เพื่อให้เสียงไม่ดังเกินไป
            this.audioContext.currentTime + 1
        );
    }
    
    // เล่นเสียงเอฟเฟกต์
    playEffect(type) {
        if (!this.initialized || !this.enabled) return;
        
        // เล่นเสียงเอฟเฟกต์ตามประเภท
        switch(type) {
            case 'click':
                this.playClickSound();
                break;
            case 'transition':
                this.playTransitionSound();
                break;
            case 'blackhole':
                this.playBlackHoleSound();
                break;
            // เพิ่มเสียงเอฟเฟกต์อื่นๆ ตามต้องการ
        }
    }
    
    // เล่นเสียงคลิก
    playClickSound() {
        if (!this.initialized || !this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    // สร้างเสียงพิเศษสำหรับหลุมดำ
    playBlackHoleSound() {
        if (!this.initialized || !this.enabled) return;
        
        // สร้างเสียงต่ำที่มีความน่ากลัว
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(40, this.audioContext.currentTime);
        
        oscillator2.type = 'sawtooth';
        oscillator2.frequency.setValueAtTime(43, this.audioContext.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 3);
        
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator1.start();
        oscillator2.start();
        
        oscillator1.stop(this.audioContext.currentTime + 3);
        oscillator2.stop(this.audioContext.currentTime + 3);
    }
    
    // ทำความสะอาดทรัพยากร
    dispose() {
        if (!this.initialized) return;
        
        // หยุดเสียงทั้งหมด
        for (const key in this.sounds) {
            if (this.sounds[key].oscillator) {
                try {
                    this.sounds[key].oscillator.stop();
                    this.sounds[key].oscillator.disconnect();
                } catch (e) {
                    // ละเว้นข้อผิดพลาดหากหยุดแล้ว
                }
            }
            if (this.sounds[key].gainNode) {
                this.sounds[key].gainNode.disconnect();
            }
        }
        
        // ล้างรายการเสียง
        this.sounds = {};
        
        // ปิด AudioContext
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.close();
        }
    }
}