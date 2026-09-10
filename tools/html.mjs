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
html,body{margin:0;height:100%;overflow:hidden;background:#d8d8d8}
#h{position:fixed;inset:0;pointer-events:none;color:#222;
font:700 18px/1.4 monospace;text-shadow:0 1px 0 #fff}
#h p{margin:10px 18px}
#s{position:absolute;left:0;top:0}
#g{position:absolute;right:0;top:0}
#tm{position:absolute;left:50%;top:0;transform:translateX(-50%);
font-size:28px;color:#222}
#c{text-align:center;margin-top:12vh;font-size:40px;letter-spacing:.12em}
#m{text-align:center;opacity:.9}
#menu{position:fixed;inset:0;z-index:10000;display:flex;flex-direction:column;
align-items:center;justify-content:center;gap:12px;pointer-events:none}
#menu b{font:700 52px/1 monospace;letter-spacing:.18em;color:#222}
#menu i{font:600 14px monospace;color:#555}
#menu button{pointer-events:auto;border:0;padding:12px 28px;font:700 18px monospace;
background:#222;color:#f4f4f4;cursor:pointer}
#menu button:hover{background:#444}
#menu[hidden]{display:none}
</style>
</head>
<body>
<div id=h>
<p id=s></p><p id=g></p><p id=tm></p>
<p id=c></p><p id=m></p>
</div>
<a-scene id=sc background="color:#d5d5d5"
 vr-mode-ui="enabled:false" xr-mode-ui="enabled:false"
 device-orientation-permission-ui="enabled:false"
 renderer="antialias:false" webxr="referenceSpaceType:local">
<a-entity light="type:ambient;color:#fff;intensity:0.9"></a-entity>
<a-entity id=rig position="0 3.1 7">
<a-entity id=cam camera="active:true;fov:68"
 look-controls="enabled:false;magicWindowTrackingEnabled:false;touchEnabled:false"
 wasd-controls="enabled:false"></a-entity>
</a-entity>
</a-scene>
<div id=menu>
<b>RAINBOOM</b>
<i id=det>Checking device...</i>
<button id=play type=button>PLAY</button>
<button id=xrb type=button hidden>ENTER XR</button>
</div>
${scriptTag}
</body>
</html>`;
}
