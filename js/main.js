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

window.addEventListener('load', () => {
    const loadingManager = new THREE.LoadingManager();
    const loadingElement = document.getElementById('loading');
    const loadingBar = document.getElementById('loading-bar');
    
    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        const progress = (itemsLoaded / itemsTotal) * 100;
        loadingBar.style.width = `${progress}%`;
    };
    
    loadingManager.onLoad = () => {
        loadingElement.style.opacity = '0';
        setTimeout(() => {
            loadingElement.style.display = 'none';
        }, 1000);
    };
    
    loadingManager.onError = (url) => {
        console.error('Error loading', url);
    };
    
    sceneManager = new SceneManager(loadingManager);
    
    document.getElementById('next-btn').addEventListener('click', () => {
        if (currentScene < SCENES.BLACK_HOLE && sceneManager) {
            sceneManager.transitionToScene(currentScene, currentScene + 1);
        }
    });
    
    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentScene > SCENES.EARTH && sceneManager) {
            sceneManager.transitionToScene(currentScene, currentScene - 1);
        }
    });
});