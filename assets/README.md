# Texture Assets

This directory should contain texture files organized in the following structure:

```
/assets
  /textures
    /earth
      - earth_map.jpg     (Earth texture map)
      - earth_bump.jpg    (Earth bump map for terrain)
      - earth_clouds.png  (Earth clouds with transparency)
    /uranus
      - uranus_map.jpg    (Uranus texture map)
    /galaxy
      - starfield.jpg     (Background starfield texture)
      - particle.png      (Particle texture for galaxy)
    /blackhole
      - (No textures needed - using shaders)
  /models
    - (No models needed for this project)
```

## Obtaining the Texture Files

You can obtain suitable texture files from the following sources:

1. **Earth Textures:**
   - Earth Map: https://kspatial.github.io/webglearth2-offline/examples/images/2_no_clouds_4k.jpg
   - Earth Bump Map: https://kspatial.github.io/webglearth2-offline/examples/images/elev_bump_4k.jpg
   - Earth Clouds: https://kspatial.github.io/webglearth2-offline/examples/images/fair_clouds_4k.png

2. **Uranus Textures:**
   - Uranus Map: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/uranus.jpg

3. **Galaxy Textures:**
   - Starfield: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/2k_stars.jpg
   - Particle: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprite1.png

## Alternative Approach

If you don't want to download these files, you can modify each scene file to use direct URLs:

For example, in `EarthScene.js`, you can change:

```javascript
// Using local assets
loadTexture('earth', 'assets/textures/earth/earth_map.jpg')

// To use direct URLs
loadTexture('earth', 'https://kspatial.github.io/webglearth2-offline/examples/images/2_no_clouds_4k.jpg')
```

Similarly, update the URLs in `SceneManager.js` loadAssets() method to use these direct URLs instead of local files.