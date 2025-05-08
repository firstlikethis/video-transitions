class Transition {
    // Static method to handle transitions between scenes
    static performTransition(fromGroup, toGroup, fromIndex, toIndex, camera, blueLight, purpleLight, sceneLabel, onCompleteCallback) {
        // Make both scenes visible
        fromGroup.visible = true;
        toGroup.visible = true;
        
        // Update scene label
        const labels = ['Earth', 'Uranus', 'Galaxy', 'Black Hole'];
        sceneLabel.textContent = labels[toIndex];
        sceneLabel.style.opacity = '1';
        
        // Calculate positions for animation
        const fromPos = { x: 0, y: 0, z: 0 };
        const toPos = { x: 0, y: 0, z: 50 };
        
        // Set duration and easing for transitions
        const duration = 3;
        const ease = 'power2.inOut';
        
        if (toIndex > fromIndex) {
            // Moving forward in the sequence
            gsap.to(fromGroup.position, {
                x: fromPos.x, y: fromPos.y, z: -50,
                duration: duration,
                ease: ease
            });
            
            gsap.fromTo(
                toGroup.position,
                { x: toPos.x, y: toPos.y, z: toPos.z },
                { x: 0, y: 0, z: 0, duration: duration, ease: ease }
            );
        } else {
            // Moving backward in the sequence
            gsap.to(fromGroup.position, {
                x: fromPos.x, y: fromPos.y, z: 50,
                duration: duration,
                ease: ease
            });
            
            gsap.fromTo(
                toGroup.position,
                { x: toPos.x, y: toPos.y, z: -50 },
                { x: 0, y: 0, z: 0, duration: duration, ease: ease }
            );
        }
        
        // Handle camera and lighting transitions
        Transition.transitionCameraAndLighting(toIndex, camera, blueLight, purpleLight, duration, ease);
        
        // Execute callback after transition completes
        setTimeout(onCompleteCallback, duration * 1000);
    }
    
    // Handle camera and lighting transitions
    static transitionCameraAndLighting(toIndex, camera, blueLight, purpleLight, duration, ease) {
        if (toIndex === SCENES.EARTH) {
            gsap.to(camera.position, {
                x: 0, y: 0, z: 15,
                duration: duration,
                ease: ease
            });
            
            // Turn off special lights
            gsap.to(blueLight, { intensity: 0, duration: duration * 0.7 });
            gsap.to(purpleLight, { intensity: 0, duration: duration * 0.7 });
        } 
        else if (toIndex === SCENES.URANUS) {
            gsap.to(camera.position, {
                x: 0, y: 3, z: 20,
                duration: duration,
                ease: ease
            });
            
            // Add some ambient lighting
            gsap.to(blueLight, { intensity: 2, duration: duration * 0.7 });
            gsap.to(purpleLight, { intensity: 0.5, duration: duration * 0.7 });
        } 
        else if (toIndex === SCENES.GALAXY) {
            gsap.to(camera.position, {
                x: 2, y: 8, z: 15,
                duration: duration,
                ease: ease
            });
            
            // Colorful lighting for galaxy
            gsap.to(blueLight, { intensity: 5, duration: duration * 0.7 });
            gsap.to(purpleLight, { intensity: 3, duration: duration * 0.7 });
        } 
        else if (toIndex === SCENES.BLACK_HOLE) {
            gsap.to(camera.position, {
                x: 0, y: 5, z: 20,
                duration: duration,
                ease: ease
            });
            
            // Dramatic lighting for black hole
            gsap.to(blueLight, { intensity: 3, duration: duration * 0.7 });
            gsap.to(purpleLight, { intensity: 7, duration: duration * 0.7 });
        }
    }
}