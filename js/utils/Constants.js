/**
 * Constants.js
 * กำหนดค่าคงที่สำหรับใช้ในทั้งระบบ
 */
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
            textureSize: 1024,  // ขนาดเท็กซ์เจอร์สูงสุด
            maxLights: 1,       // จำนวนแสงสูงสุด
            maxParticleSystems: 1 // จำนวนระบบอนุภาคสูงสุด
        },
        MEDIUM: {
            pixelRatio: 1.5,
            antialias: true,
            shadows: true,
            postProcessing: true,
            particleCount: 0.6, // 60% ของจำนวนเต็ม
            textureSize: 2048,  // ขนาดเท็กซ์เจอร์สูงสุด
            maxLights: 3,       // จำนวนแสงสูงสุด
            maxParticleSystems: 3 // จำนวนระบบอนุภาคสูงสุด
        },
        HIGH: {
            pixelRatio: 2.0,
            antialias: true,
            shadows: true,
            postProcessing: true,
            particleCount: 1.0, // 100% ของจำนวนเต็ม
            textureSize: 4096,  // ขนาดเท็กซ์เจอร์สูงสุด
            maxLights: 6,       // จำนวนแสงสูงสุด
            maxParticleSystems: 6 // จำนวนระบบอนุภาคสูงสุด
        }
    },
    
    // ค่าจำนวนอนุภาคพื้นฐานสำหรับแต่ละฉาก
    BASE_PARTICLE_COUNTS: {
        EARTH: {
            atmosphericParticles: 500,
            cloudParticles: 300
        },
        URANUS: {
            atmosphericParticles: 400,
            ringParticles: 1000,
            auroraParticles: 500
        },
        GALAXY: {
            starParticles: 5000,
            dustParticles: 3000,
            nebulaParticles: 2000
        },
        BLACK_HOLE: {
            accretionDiskParticles: 3000,
            eventHorizonParticles: 1000,
            spacetimeParticles: 2000
        }
    },
    
    // ค่าสีสำหรับวัตถุต่างๆ
    COLORS: {
        EARTH: {
            land: 0x2233ff,       // สีพื้นผิวโลก
            clouds: 0xffffff,      // สีเมฆ
            atmosphere: 0x93cfef,  // สีชั้นบรรยากาศ
            ocean: 0x1144aa,       // สีมหาสมุทร
            aurora: 0x44ffaa       // สีออโรร่า
        },
        URANUS: {
            surface: 0x45a6ed,     // สีพื้นผิวยูเรนัส
            atmosphere: 0x00aaff,  // สีชั้นบรรยากาศยูเรนัส
            rings: 0x8fd4d9,       // สีวงแหวนยูเรนัส
            aurora: 0x00ffcc       // สีออโรร่ายูเรนัส
        },
        GALAXY: {
            core: 0x6a00ff,        // สีแกนกลางกาแล็กซี่
            arms: 0x00aaff,        // สีแขนกาแล็กซี่
            stars: 0xffffff,       // สีดาว
            dust: 0x5500ff,        // สีฝุ่นดาว
            nebula: 0xff55aa       // สีเนบิวลา
        },
        BLACK_HOLE: {
            horizon: 0x000000,     // สีขอบฟ้าเหตุการณ์
            accretion: 0xff3300,   // สีจานสะสมมวล
            lensing: 0xaaaaff,     // สีการบิดเบือนแสง
            jets: 0xff6600         // สีลำแสงสองขั้ว
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
        `,
        
        // Vertex shader สำหรับ atmosphere effect
        ATMOSPHERE_VERTEX: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        
        // Fragment shader สำหรับ atmosphere effect
        ATMOSPHERE_FRAGMENT: `
            uniform vec3 atmosphereColor;
            uniform float time;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            float hash(float n) {
                return fract(sin(n) * 43758.5453);
            }
            
            float noise(vec2 p) {
                vec2 ip = floor(p);
                vec2 u = fract(p);
                u = u * u * (3.0 - 2.0 * u);
                
                float res = mix(
                    mix(hash(dot(ip, vec2(1.0, 157.0))), 
                        hash(dot(ip + vec2(1.0, 0.0), vec2(1.0, 157.0))), u.x),
                    mix(hash(dot(ip + vec2(0.0, 1.0), vec2(1.0, 157.0))), 
                        hash(dot(ip + vec2(1.0, 1.0), vec2(1.0, 157.0))), u.x), 
                    u.y);
                return res * res;
            }
            
            void main() {
                // Calculate rim lighting (stronger at edges)
                float rim = 1.0 - abs(dot(vNormal, vec3(0, 0, 1.0)));
                
                // Add some noise for cloud-like movement
                float cloudNoise = noise(vec2(vUv.x * 10.0 + time * 0.05, vUv.y * 10.0 + time * 0.1));
                
                // Calculate final color with varying opacity
                vec3 color = atmosphereColor * (rim * 2.0);
                float alpha = rim * pow(rim, 2.0) * (0.6 + cloudNoise * 0.4);
                
                gl_FragColor = vec4(color, alpha);
            }
        `,
        
        // Fragment shader สำหรับ gravity lensing effect (หลุมดำ)
        GRAVITY_LENSING_FRAGMENT: `
            uniform float time;
            uniform float lensIntensity;
            uniform sampler2D starTexture;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            #define PI 3.14159265359
            
            // Function to distort UVs for gravitational lensing effect
            vec2 lensDistortion(vec2 uv, float strength) {
                vec2 centeredUV = uv * 2.0 - 1.0;
                float distanceFromCenter = length(centeredUV);
                
                // Formula based on gravitational lensing physics
                float distortionFactor = 1.0 / (1.0 + exp(-(distanceFromCenter - 0.5) * 10.0 * strength));
                
                // Distort based on Schwarzschild radius approximation
                centeredUV *= mix(1.0, 1.0 - 1.0 / (distanceFromCenter + 0.01), distortionFactor * strength);
                
                return centeredUV * 0.5 + 0.5;
            }
            
            void main() {
                // Calculate viewing direction
                vec3 viewDirection = normalize(vPosition);
                
                // Calculate spherical coordinates
                float phi = atan(viewDirection.z, viewDirection.x);
                float theta = acos(viewDirection.y);
                
                // Convert to UV coordinates
                vec2 sphereUV = vec2(phi / (2.0 * PI) + 0.5, theta / PI);
                
                // Lensing strength increases closer to center
                float distanceToCenter = length(vPosition.xz);
                float distortionStrength = 6.0 * lensIntensity / (distanceToCenter + 0.1);
                
                // Apply distortion function
                vec2 distortedUV = lensDistortion(sphereUV, distortionStrength);
                
                // Add slight movement over time
                distortedUV.x = mod(distortedUV.x + time * 0.01, 1.0);
                
                // Sample star texture with distorted coordinates
                vec4 starColor = texture2D(starTexture, distortedUV);
                
                // Darkening near the black hole
                float blackholeProximity = smoothstep(0.15, 0.3, distanceToCenter / 15.0);
                
                // Calculate final opacity
                float edgeGlow = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1.0))), 8.0);
                float alpha = min(edgeGlow, blackholeProximity) * 0.6;
                
                // Final color
                gl_FragColor = vec4(starColor.rgb * blackholeProximity, alpha);
            }
        `
    }
};