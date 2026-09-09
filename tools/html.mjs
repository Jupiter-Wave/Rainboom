/** Official js13k 2026 A-Frame host (excluded from ZIP). */
export const AFRAME_URL =
    'https://play.js13kgames.com/2026/webxr/aframe.js';

/**
 * Build the page shell.
 * @param {string} scriptTag Inlined script or external src tag.
 * @return {string} Full HTML document.
 */
export function page(scriptTag) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>RAINBOOM</title>
<script src="${AFRAME_URL}"></script>
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#114}
#h{position:fixed;inset:0;pointer-events:none;color:#fff;
font:700 18px/1.4 monospace;text-shadow:0 0 8px #000}
#h p{margin:10px 18px}
#s{position:absolute;left:0;top:0}
#g{position:absolute;right:0;top:0}
#tm{position:absolute;left:50%;top:0;transform:translateX(-50%)}
#c{text-align:center;margin-top:16vh;font-size:48px;letter-spacing:.2em}
#m{text-align:center;opacity:.9}
</style>
</head>
<body>
<div id=h>
<p id=s></p><p id=g></p><p id=tm></p>
<p id=c></p><p id=m></p>
</div>
<a-scene id=sc background="color:#14102c"
 vr-mode-ui="enabled:false" xr-mode-ui="enabled:false"
 device-orientation-permission-ui="enabled:false"
 renderer="antialias:false" webxr="referenceSpaceType:local">
<a-entity light="type:ambient;color:#668;intensity:0.75"></a-entity>
<a-entity id=rig position="0 3.1 7">
<a-entity id=cam camera="active:true;fov:68"
 look-controls="enabled:false" wasd-controls="enabled:false"></a-entity>
</a-entity>
</a-scene>
${scriptTag}
</body>
</html>`;
}
