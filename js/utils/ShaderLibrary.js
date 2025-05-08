// ShaderLibrary.js
class ShaderLibrary {
    constructor() {
        // เก็บ shaders ทั้งหมด
        this.shaders = {
            vertex: {},
            fragment: {}
        };
        
        // เพิ่ม shader พื้นฐาน
        this.initBaseShaders();
    }
    
    // เพิ่ม shader พื้นฐาน
    initBaseShaders() {
        // Glow effect
        this.shaders.vertex.glow = `
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
        `;
        
        this.shaders.fragment.glow = `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4(glow, intensity);
            }
        `;
        
        // Atmospheric scattering
        this.shaders.vertex.atmosphere = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        this.shaders.fragment.atmosphere = `
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
        `;
        
        // Black hole gravitational lensing
        this.shaders.vertex.blackHoleLensing = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        this.shaders.fragment.blackHoleLensing = `
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
        `;
        
        // Aurora effect
        this.shaders.vertex.aurora = `
            varying vec2 vUv;
            varying vec3 vPosition;
            uniform float time;
            
            void main() {
                vUv = uv;
                vPosition = position;
                
                // Add wave-like movement
                float wave = sin(vUv.x * 20.0 + time * 2.0) * 0.1;
                vec3 newPosition = position;
                newPosition.y += wave;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;
        
        this.shaders.fragment.aurora = `
            uniform float time;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                // Create wave pattern
                float wave = sin(vUv.x * 30.0 + time * 3.0) * 0.5 + 0.5;
                
                // Color gradient
                vec3 color1 = vec3(0.0, 0.8, 1.0); // Cyan
                vec3 color2 = vec3(0.0, 0.5, 1.0); // Blue
                
                vec3 finalColor = mix(color1, color2, wave);
                
                // Intensity based on position
                float intensity = sin(vUv.y * 3.14159) * 0.7 + 0.3;
                
                gl_FragColor = vec4(finalColor, intensity * 0.5);
            }
        `;
    }
    
    // รับ vertex shader ตามชื่อ
    getVertexShader(name) {
        return this.shaders.vertex[name] || '';
    }
    
    // รับ fragment shader ตามชื่อ
    getFragmentShader(name) {
        return this.shaders.fragment[name] || '';
    }
    
    // สร้าง shader material
    createShaderMaterial(vertexName, fragmentName, uniforms, parameters = {}) {
        const vertexShader = this.getVertexShader(vertexName);
        const fragmentShader = this.getFragmentShader(fragmentName);
        
        if (!vertexShader || !fragmentShader) {
            console.error(`Shader not found: ${vertexName} or ${fragmentName}`);
            return null;
        }
        
        // รวมค่า uniforms และ parameters
        const materialParameters = {
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            ...parameters
        };
        
        return new THREE.ShaderMaterial(materialParameters);
    }
}