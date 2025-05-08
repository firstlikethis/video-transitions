// Constants.js
const CONSTANTS = {
    // ประเภทของฉาก
    SCENES: {
        EARTH: 0,
        URANUS: 1,
        GALAXY: 2,
        BLACK_HOLE: 3
    },
    
    // การตั้งค่าสำหรับแต่ละฉาก
    SCENE_SETTINGS: {
        // Earth settings
        0: {
            camera: { x: 0, y: 0, z: 15 },
            lights: {
                ambient: 0.5,
                directional: 1.0,
                blue: 0,
                purple: 0
            },
            audio: {
                ambientVolume: 0.5,
                frequency: 60,
                filterFrequency: 200
            }
        },
        
        // Uranus settings
        1: {
            camera: { x: 0, y: 3, z: 20 },
            lights: {
                ambient: 0.3,
                directional: 0.8,
                blue: 2.0,
                purple: 0.5
            },
            audio: {
                ambientVolume: 0.4,
                frequency: 50,
                filterFrequency: 150
            }
        },
        
        // Galaxy settings
        2: {
            camera: { x: 2, y: 8, z: 15 },
            lights: {
                ambient: 0.2,
                directional: 0.5,
                blue: 5.0,
                purple: 3.0
            },
            audio: {
                ambientVolume: 0.6,
                frequency: 100,
                filterFrequency: 300
            }
        },
        
        // Black Hole settings
        3: {
            camera: { x: 0, y: 5, z: 20 },
            lights: {
                ambient: 0.1,
                directional: 0.3,
                blue: 3.0,
                purple: 7.0
            },
            audio: {
                ambientVolume: 0.7,
                frequency: 40,
                filterFrequency: 80
            }
        }
    },
    
    // ระยะเวลาสำหรับแต่ละฉาก (วินาที)
    SCENE_DURATIONS: [20, 18, 22, 30],
    
    // ระยะเวลาสำหรับการเปลี่ยนฉาก (วินาที)
    TRANSITION_DURATION: 4.0,
    
    // จำนวนเฟรมต่อวินาทีขั้นต่ำที่ยอมรับได้
    MIN_ACCEPTABLE_FPS: 30,
    
    // คุณภาพเรนเดอร์ตามประสิทธิภาพอุปกรณ์
    QUALITY_LEVELS: {
        LOW: {
            pixelRatio: 1.0,
            antialias: false,
            shadows: false,
            postProcessing: false,
            particleCount: 0.3, // 30% ของจำนวนเต็ม
            textureSize: 1024   // ขนาดเท็กซ์เจอร์สูงสุด
        },
        MEDIUM: {
            pixelRatio: 1.5,
            antialias: true,
            shadows: true,
            postProcessing: true,
            particleCount: 0.6, // 60% ของจำนวนเต็ม
            textureSize: 2048   // ขนาดเท็กซ์เจอร์สูงสุด
        },
        HIGH: {
            pixelRatio: 2.0,
            antialias: true,
            shadows: true,
            postProcessing: true,
            particleCount: 1.0, // 100% ของจำนวนเต็ม
            textureSize: 4096   // ขนาดเท็กซ์เจอร์สูงสุด
        }
    },
    
    // Shader code สำหรับเอฟเฟกต์พื้นฐาน
    SHADERS: {
        // Vertex shader สำหรับ glow effect
        GLOW_VERTEX: `
            uniform vec3 viewVector;
            uniform float c;
            uniform float p;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(c - dot(vNormal, vNormel), p);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        
        // Fragment shader สำหรับ glow effect
        GLOW_FRAGMENT: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4(glow, intensity);
            }
        `
    }
};