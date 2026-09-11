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
#h{position:fixed;inset:0;pointer-events:none;color:#222;z-index:50;
font:700 18px/1.4 monospace;text-shadow:0 1px 0 #fff}
#h p{margin:10px 18px}
#tm{position:absolute;left:0;top:0;font-size:34px;letter-spacing:.04em}
#s{position:absolute;left:0;top:42px;font-size:16px}
#g{position:absolute;right:0;top:0}
a-scene,a-scene canvas{cursor:none}
#aim{position:fixed;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;
border:2px solid #111;border-radius:50%;pointer-events:none;z-index:30;
box-shadow:0 0 0 2px #fff9,inset 0 0 0 2px #fff6;display:none}
#aim.on{display:block}
#aim::after{content:'';position:absolute;left:50%;top:50%;width:4px;height:4px;
margin:-2px 0 0 -2px;background:#111;border-radius:50%}
.ind{position:fixed;top:0;height:100vh;width:52px;pointer-events:none;
z-index:40;opacity:0;display:none;
background:linear-gradient(#ee2222,#ee8800,#eeee00,#22cc22,
#00aaaa,#2288ee,#aa22ee,#ee2222);background-size:100% 220%}
.ind.on{display:block;animation:sense 2.6s ease-in-out infinite}
@keyframes sense{0%,100%{opacity:.34;background-position:0 0}
50%{opacity:.62;background-position:0 100%}}
#indL{left:0;border-radius:0 100% 100% 0}
#indR{right:0;border-radius:100% 0 0 100%}
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
<p id=tm></p><p id=s></p><p id=g></p>
<p id=c></p><p id=m></p>
</div>
<div id=aim></div>
<a-scene id=sc background="color:#d5d5d5"
 vr-mode-ui="enabled:false" xr-mode-ui="enabled:false"
 device-orientation-permission-ui="enabled:false"
 renderer="antialias:false" webxr="referenceSpaceType:local">
<a-entity light="type:ambient;color:#fff;intensity:0.9"></a-entity>
<a-entity id=rig position="0 1.4 0">
<a-entity id=cam camera="active:true;fov:72"
 look-controls="enabled:false;magicWindowTrackingEnabled:false;touchEnabled:false"
 wasd-controls="enabled:false"></a-entity>
</a-entity>
</a-scene>
<div id=indL class=ind></div>
<div id=indR class=ind></div>
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
