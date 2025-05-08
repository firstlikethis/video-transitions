/**
 * AudioManager.js
 * จัดการเสียงทั้งหมดในแอพพลิเคชัน เช่น เสียงพื้นหลัง เสียงเอฟเฟกต์ 
 * และเสียงการเปลี่ยนฉาก โดยใช้ Web Audio API
 */
class AudioManager {
    /**
     * สร้าง AudioManager
     */
    constructor() {
        this.initialized = false;
        this.enabled = false;
        this.audioContext = null;
        this.sounds = {};
        this.analyser = null;
        this.analyserData = null;
        
        // ลองสร้าง AudioContext เพื่อตรวจสอบการรองรับ
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.initialized = true;
            
            // สร้าง analyser สำหรับ visualize เสียง
            this.setupAnalyser();
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser");
        }
    }
    
    /**
     * เปิดใช้งานเสียง
     */
    enable() {
        if (!this.initialized) return;
        
        this.enabled = true;
        
        // รีซูมเสียงหากถูกพัก
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    /**
     * ปิดใช้งานเสียง
     */
    disable() {
        if (!this.initialized) return;
        
        this.enabled = false;
        
        // พักการทำงานของ AudioContext
        if (this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
        
        // หยุดเสียงทั้งหมด
        this.stopAllSounds();
    }
    
    /**
     * สร้าง analyser สำหรับ visualize เสียง
     */
    setupAnalyser() {
        if (!this.initialized) return;
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.connect(this.audioContext.destination);
        
        // สร้าง array สำหรับเก็บข้อมูล
        this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);
    }
    
    /**
     * เล่นเสียงพื้นหลัง
     */
    playBackgroundSound() {
        if (!this.initialized || !this.enabled) return;
        
        // หยุดเสียงพื้นหลังเดิมหากมี
        if (this.sounds.background) {
            this.stopSound('background');
        }
        
        // สร้างเสียงแอมเบียนท์สำหรับอวกาศ
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // ตั้งค่าเสียงพื้นหลังเริ่มต้น (สำหรับโลก)
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(60, this.audioContext.currentTime);
        
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(63, this.audioContext.currentTime);
        oscillator2.detune.setValueAtTime(-10, this.audioContext.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
        filter.Q.setValueAtTime(10, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 3);
        
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.analyser);
        
        oscillator1.start();
        oscillator2.start();
        
        // เก็บสำหรับการจัดการภายหลัง
        this.sounds.background = {
            oscillators: [oscillator1, oscillator2],
            gainNode: gainNode,
            filter: filter,
            playing: true
        };
    }
    
    /**
     * ลดความดังเสียงพื้นหลังจนหยุด
     * @param {number} duration - ระยะเวลาในการลดความดัง (วินาที)
     */
    fadeOutBackgroundSound(duration = 2) {
        if (!this.initialized || !this.enabled || !this.sounds.background) return;
        
        const { gainNode } = this.sounds.background;
        const currentGain = gainNode.gain.value;
        
        gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(currentGain, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        // หยุดเสียงพื้นหลังหลังจากลดความดังหมด
        setTimeout(() => {
            this.stopSound('background');
        }, duration * 1000);
    }
    
    /**
     * เปลี่ยนเสียงพื้นหลังตามฉาก
     * @param {number} sceneIndex - ดัชนีของฉาก
     */
    changeSceneAudio(sceneIndex) {
        if (!this.initialized || !this.enabled || !this.sounds.background) return;
        
        // ดึงการตั้งค่าเสียงสำหรับฉาก
        const settings = CONSTANTS.SCENE_SETTINGS[sceneIndex].audio;
        if (!settings) return;
        
        const { oscillators, filter, gainNode } = this.sounds.background;
        
        // ปรับความถี่ของตัวกรองเสียง
        filter.frequency.cancelScheduledValues(this.audioContext.currentTime);
        filter.frequency.setValueAtTime(filter.frequency.value, this.audioContext.currentTime);
        filter.frequency.linearRampToValueAtTime(
            settings.filterFrequency, 
            this.audioContext.currentTime + 2
        );
        
        // ปรับความถี่ของ oscillator
        oscillators[0].frequency.cancelScheduledValues(this.audioContext.currentTime);
        oscillators[0].frequency.setValueAtTime(
            oscillators[0].frequency.value, 
            this.audioContext.currentTime
        );
        oscillators[0].frequency.linearRampToValueAtTime(
            settings.frequency, 
            this.audioContext.currentTime + 2
        );
        
        // ปรับความถี่ของ oscillator ที่สอง
        oscillators[1].frequency.cancelScheduledValues(this.audioContext.currentTime);
        oscillators[1].frequency.setValueAtTime(
            oscillators[1].frequency.value, 
            this.audioContext.currentTime
        );
        oscillators[1].frequency.linearRampToValueAtTime(
            settings.frequency * 1.05, // เพิ่มความถี่เล็กน้อยเพื่อสร้างเสียงเบี้ยว
            this.audioContext.currentTime + 2
        );
        
        // ปรับความดัง
        gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            settings.ambientVolume * 0.05, // คูณด้วย 0.05 เพื่อให้เสียงไม่ดังเกินไป
            this.audioContext.currentTime + 2
        );
        
        // ปรับแต่งเสียงเพิ่มเติมตามฉาก
        this.applySceneAudioEffects(sceneIndex);
    }
    
    /**
     * ปรับแต่งเสียงเพิ่มเติมตามฉาก
     * @param {number} sceneIndex - ดัชนีของฉาก
     */
    applySceneAudioEffects(sceneIndex) {
        if (!this.initialized || !this.enabled || !this.sounds.background) return;
        
        // ปรับแต่งเสียงตามฉาก
        switch (sceneIndex) {
            case CONSTANTS.SCENES.EARTH:
                // เสียงโลก - เสียงธรรมชาติคลื่นลมอ่อนๆ
                this.sounds.background.oscillators[0].type = 'sine';
                this.sounds.background.oscillators[1].type = 'sine';
                this.sounds.background.filter.Q.setValueAtTime(10, this.audioContext.currentTime);
                break;
                
            case CONSTANTS.SCENES.URANUS:
                // เสียงยูเรนัส - เสียงลมแรงและเย็น
                this.sounds.background.oscillators[0].type = 'triangle';
                this.sounds.background.oscillators[1].type = 'triangle';
                this.sounds.background.filter.Q.setValueAtTime(5, this.audioContext.currentTime);
                break;
                
            case CONSTANTS.SCENES.GALAXY:
                // เสียงกาแล็กซี่ - เสียงบรรยากาศกว้างขึ้น
                this.sounds.background.oscillators[0].type = 'sine';
                this.sounds.background.oscillators[1].type = 'sine';
                this.sounds.background.filter.Q.setValueAtTime(1, this.audioContext.currentTime);
                
                // เพิ่ม detune เพื่อเสียงพิเศษ
                this.sounds.background.oscillators[1].detune.setValueAtTime(-20, this.audioContext.currentTime);
                break;
                
            case CONSTANTS.SCENES.BLACK_HOLE:
                // เสียงหลุมดำ - เสียงทุ้มต่ำ น่ากลัว
                this.sounds.background.oscillators[0].type = 'sawtooth';
                this.sounds.background.oscillators[1].type = 'sawtooth';
                this.sounds.background.filter.Q.setValueAtTime(20, this.audioContext.currentTime);
                
                // เพิ่ม detune เพื่อเสียงพิเศษ
                this.sounds.background.oscillators[1].detune.setValueAtTime(-30, this.audioContext.currentTime);
                break;
        }
    }
    
    /**
     * สร้างเสียงสำหรับการเปลี่ยนฉาก
     * @param {number} fromIndex - ดัชนีฉากปัจจุบัน
     * @param {number} toIndex - ดัชนีฉากที่ต้องการไป
     */
    playTransitionSound(fromIndex, toIndex) {
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
        
        // สร้างเสียง
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
        gainNode.connect(this.analyser);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 2);
        
        // เก็บเสียงสำหรับจัดการภายหลัง
        this.sounds[`transition_${fromIndex}_${toIndex}`] = {
            oscillator,
            gainNode,
            filter,
            playing: true
        };
        
        // ลบเสียงออกหลังจากเล่นเสร็จ
        setTimeout(() => {
            delete this.sounds[`transition_${fromIndex}_${toIndex}`];
        }, 2000);
    }
    
    /**
     * เล่นเสียงเอฟเฟกต์
     * @param {string} type - ประเภทเอฟเฟกต์
     */
    playEffect(type) {
        if (!this.initialized || !this.enabled) return;
        
        // เล่นเสียงเอฟเฟกต์ตามประเภท
        switch(type) {
            case 'click':
                this.playClickSound();
                break;
                
            case 'hover':
                this.playHoverSound();
                break;
                
            case 'celestial':
                this.playCelestialSound();
                break;
                
            case 'blackhole':
                this.playBlackHoleSound();
                break;
                
            case 'button':
                this.playButtonSound();
                break;
        }
    }
    
    /**
     * เล่นเสียงคลิก
     */
    playClickSound() {
        if (!this.initialized || !this.enabled) return;
        
        const id = 'click_' + Date.now();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.analyser);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
        
        // เก็บเสียงสำหรับจัดการภายหลัง
        this.sounds[id] = {
            oscillator,
            gainNode,
            playing: true
        };
        
        // ลบเสียงออกหลังจากเล่นเสร็จ
        setTimeout(() => {
            delete this.sounds[id];
        }, 200);
    }
    
    /**
     * เล่นเสียงเมื่อ hover
     */
    playHoverSound() {
        if (!this.initialized || !this.enabled) return;
        
        const id = 'hover_' + Date.now();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(450, this.audioContext.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.05);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.analyser);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.05);
        
        // เก็บเสียงสำหรับจัดการภายหลัง
        this.sounds[id] = {
            oscillator,
            gainNode,
            playing: true
        };
        
        // ลบเสียงออกหลังจากเล่นเสร็จ
        setTimeout(() => {
            delete this.sounds[id];
        }, 100);
    }
    
    /**
     * เล่นเสียงเมื่อคลิกวัตถุทางดาราศาสตร์
     */
    playCelestialSound() {
        if (!this.initialized || !this.enabled) return;
        
        const id = 'celestial_' + Date.now();
        
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator1.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + 0.5);
        
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(303, this.audioContext.currentTime);
        oscillator2.frequency.linearRampToValueAtTime(406, this.audioContext.currentTime + 0.5);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.5);
        
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.analyser);
        
        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 0.5);
        oscillator2.stop(this.audioContext.currentTime + 0.5);
        
        // เก็บเสียงสำหรับจัดการภายหลัง
        this.sounds[id] = {
            oscillators: [oscillator1, oscillator2],
            gainNode,
            filter,
            playing: true
        };
        
        // ลบเสียงออกหลังจากเล่นเสร็จ
        setTimeout(() => {
            delete this.sounds[id];
        }, 600);
    }
    
    /**
     * เล่นเสียงหลุมดำ
     */
    playBlackHoleSound() {
        if (!this.initialized || !this.enabled) return;
        
        const id = 'blackhole_' + Date.now();
        
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
        gainNode.connect(this.analyser);
        
        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 3);
        oscillator2.stop(this.audioContext.currentTime + 3);
        
        // เก็บเสียงสำหรับจัดการภายหลัง
        this.sounds[id] = {
            oscillators: [oscillator1, oscillator2],
            gainNode,
            filter,
            playing: true
        };
        
        // ลบเสียงออกหลังจากเล่นเสร็จ
        setTimeout(() => {
            delete this.sounds[id];
        }, 3100);
    }
    
    /**
     * เล่นเสียงปุ่ม
     */
    playButtonSound() {
        if (!this.initialized || !this.enabled) return;
        
        const id = 'button_' + Date.now();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.analyser);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
        
        // เก็บเสียงสำหรับจัดการภายหลัง
        this.sounds[id] = {
            oscillator,
            gainNode,
            playing: true
        };
        
        // ลบเสียงออกหลังจากเล่นเสร็จ
        setTimeout(() => {
            delete this.sounds[id];
        }, 200);
    }
    
    /**
     * หยุดเสียงทั้งหมด
     */
    stopAllSounds() {
        if (!this.initialized) return;
        
        for (const key in this.sounds) {
            this.stopSound(key);
        }
    }
    
    /**
     * หยุดเสียงตาม ID
     * @param {string} id - ID ของเสียง
     */
    stopSound(id) {
        if (!this.initialized || !this.sounds[id]) return;
        
        const sound = this.sounds[id];
        
        // หยุด oscillators
        if (sound.oscillators) {
            sound.oscillators.forEach(oscillator => {
                try {
                    oscillator.stop();
                    oscillator.disconnect();
                } catch (e) {
                    // ละเว้นข้อผิดพลาดหากหยุดแล้ว
                }
            });
        }
        
        if (sound.oscillator) {
            try {
                sound.oscillator.stop();
                sound.oscillator.disconnect();
            } catch (e) {
                // ละเว้นข้อผิดพลาดหากหยุดแล้ว
            }
        }
        
        // ตัดการเชื่อมต่อ gains และ filters
        if (sound.gainNode) sound.gainNode.disconnect();
        if (sound.filter) sound.filter.disconnect();
        
        // ลบเสียงออกจากรายการ
        delete this.sounds[id];
    }
    
    /**
     * พักเสียง (เรียกเมื่อเปลี่ยน tab)
     */
    pause() {
        if (!this.initialized || !this.enabled) return;
        this.audioContext.suspend();
    }
    
    /**
     * เล่นเสียงต่อ (เรียกเมื่อกลับมาที่ tab)
     */
    resume() {
        if (!this.initialized || !this.enabled) return;
        this.audioContext.resume();
    }
    
    /**
     * รับข้อมูล audio analysis
     * @returns {Uint8Array} ข้อมูล frequency analysis
     */
    getAnalyserData() {
        if (!this.initialized || !this.analyser) return null;
        
        this.analyser.getByteFrequencyData(this.analyserData);
        return this.analyserData;
    }
    
    /**
     * รับค่าความดังเฉลี่ย
     * @returns {number} ค่าความดังเฉลี่ย (0.0 - 1.0)
     */
    getAverageVolume() {
        if (!this.initialized || !this.analyser) return 0;
        
        this.analyser.getByteFrequencyData(this.analyserData);
        
        let sum = 0;
        for (let i = 0; i < this.analyserData.length; i++) {
            sum += this.analyserData[i];
        }
        
        return sum / (this.analyserData.length * 255);
    }
    
    /**
     * อัปเดตเสียง
     * @param {number} time - เวลาที่ผ่านไป (วินาที)
     */
    update(time) {
        if (!this.initialized || !this.enabled) return;
        
        // อัปเดตเสียงพื้นหลังตามเวลา
        if (this.sounds.background) {
            // เพิ่มการเปลี่ยนแปลงเล็กน้อยเพื่อให้ดูมีชีวิตชีวา
            const { oscillators, filter } = this.sounds.background;
            
            if (oscillators && oscillators.length > 1) {
                // เปลี่ยนแปลง detune เล็กน้อยตามเวลา
                const detune = Math.sin(time * 0.5) * 5 - 10;
                oscillators[1].detune.setValueAtTime(detune, this.audioContext.currentTime);
            }
            
            if (filter) {
                // เปลี่ยนแปลง filter frequency เล็กน้อยตามเวลา
                const currentFreq = filter.frequency.value;
                const variation = Math.sin(time * 0.2) * 20;
                filter.frequency.setValueAtTime(currentFreq + variation, this.audioContext.currentTime);
            }
        }
    }
    
    /**
     * ทำความสะอาดทรัพยากร
     */
    dispose() {
        if (!this.initialized) return;
        
        // หยุดเสียงทั้งหมด
        this.stopAllSounds();
        
        // ปิด AudioContext
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.close();
        }
        
        this.initialized = false;
        this.enabled = false;
    }
}