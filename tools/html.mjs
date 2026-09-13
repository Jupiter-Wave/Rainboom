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
<script src="${AFRAME_URL}" async></script>
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#d8d8d8;
user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
::selection{background:transparent;color:inherit}
#h{position:fixed;inset:0;pointer-events:none;color:#222;z-index:50;
font:700 18px/1.4 monospace;text-shadow:0 1px 0 #fff}
#h p{margin:10px 18px}
#tm{position:absolute;left:0;top:0;font-size:34px}
#g{position:absolute;right:0;top:0}
#aim{position:fixed;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;
border:2px solid #111;border-radius:50%;pointer-events:none;z-index:30;
display:none}
#aim.on{display:block}
.ind{position:fixed;top:0;height:100vh;width:52px;pointer-events:none;
z-index:40;opacity:0;transition:opacity 1.6s ease;
background:linear-gradient(#ee2222,#ee8800,#eeee00,#22cc22,
#00aaaa,#2288ee,#aa22ee,#ee2222);background-size:100% 220%}
.ind.on{opacity:.5;animation:sense 3s ease-in-out 1.4s infinite}
@keyframes sense{0%,100%{background-position:0 0}
50%{background-position:0 100%}}
#indL{left:0;border-radius:0 100% 100% 0}
#indR{right:0;border-radius:100% 0 0 100%}
#c{text-align:center;margin-top:12vh;font-size:40px;letter-spacing:.12em}
.rb,#c.flash,#menu b::before{background:linear-gradient(90deg,#ee2222,#ee8800,
#eeee00,#22cc22,#00aaaa,#2288ee,#aa22ee,#ee2222);
-webkit-background-clip:text;background-clip:text;color:transparent;
background-size:220% 100%;animation:jw 10s linear infinite}
#c.flash{font-weight:900;animation-duration:4s;text-shadow:none}
#m{text-align:center;opacity:.9}
#menu,#fog{position:fixed;inset:0;
background:linear-gradient(180deg,#eef2f8,#d8dee8)}
#menu{z-index:10000;display:flex;flex-direction:column;
align-items:center;justify-content:center;gap:3.6rem;pointer-events:none}
#fog{z-index:10001;pointer-events:none;opacity:0}
#menu::before,#fog::before{content:'';position:absolute;inset:-10%;
background:radial-gradient(70% 55% at 18% 28%,#ee222238,transparent 58%),
radial-gradient(65% 50% at 82% 22%,#2288ee30,transparent 55%),
radial-gradient(60% 48% at 72% 78%,#aa22ee28,transparent 52%),
radial-gradient(55% 45% at 28% 72%,#22cc2230,transparent 50%);
filter:blur(28px);opacity:.9;pointer-events:none}
#menu.cover b,#menu.cover #play,#menu.cover #jw{opacity:0;animation:none}
#menu b,#menu button,#jw{transition:opacity .32s ease}
#menu b{position:relative;z-index:1;isolation:isolate;
font:900 clamp(4rem,16vw,7.4rem)/.7 Impact,sans-serif;
letter-spacing:.16em;color:#181818;
transform:scaleY(1.58);transform-origin:50% 60%;
text-shadow:0 2px 0 #fff9,8px 28px 18px #ee222230,-8px 34px 16px #2288ee2a,
2px 46px 20px #aa22ee22}
#menu b::before{content:'RAINBOOM';position:absolute;left:0;top:0;z-index:-1;
pointer-events:none;white-space:nowrap;filter:blur(16px);opacity:.38;
transform:scale(1,1.5) translateY(30%);
text-shadow:0 24px 16px #ee222248,10px 38px 16px #eeee0038,
-12px 34px 16px #2288ee40,4px 50px 18px #aa22ee34}
#menu button{position:relative;z-index:1;pointer-events:auto;border:0;
background:#0000;font:700 1.05rem/1 monospace;letter-spacing:.18em;
color:#181818;cursor:pointer}
#menu #play{padding:1.15rem 1.9rem;border:2px solid #0000;
white-space:nowrap;animation:flick 4.2s infinite}
#menu #play:hover{animation:none;opacity:.28}
#menu #xrb{position:absolute;left:50%;bottom:2.2vh;transform:translateX(-50%);
padding:10px 22px;font-size:.85rem}
#jw{position:absolute;left:22px;bottom:20px;z-index:1;
font:700 .92rem/1 monospace;letter-spacing:.16em}
@keyframes jw{0%{background-position:0 50%}100%{background-position:220% 50%}}
@keyframes flick{0%,8%,12%,100%{opacity:.78}2%{opacity:.2}10%{opacity:.38}
55%,62%{opacity:.7}57%{opacity:.18}}
#menu[hidden]{display:none}
</style>
</head>
<body>
<div id=h>
<p id=tm></p><p id=g></p>
<p id=c></p><p id=m></p>
</div>
<div id=aim></div>
<a-scene id=sc background="color:#d5d5d5"
 xr-mode-ui="enabled:false"
 renderer="antialias:false" webxr="referenceSpaceType:local">
<a-entity light="type:ambient;color:#fff;intensity:0.9"></a-entity>
<a-entity id=rig position="0 1.4 0">
<a-entity id=cam camera="fov:72">
 look-controls="enabled:false" wasd-controls="enabled:false"></a-entity>
</a-entity>
</a-scene>
<div id=indL class=ind></div>
<div id=indR class=ind></div>
<div id=fog></div>
<div id=menu>
<span id=jw class=rb>Jupiter Wave</span>
<b>RAINBOOM</b>
<button id=play type=button>START</button>
<button id=xrb type=button hidden>ENTER XR</button>
</div>
${scriptTag}
</body>
</html>`;
}
