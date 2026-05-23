# Premium Home Guide + Theme + Watch Fix V5 ASCII Safe
$ErrorActionPreference = "Stop"
$root = Get-Location
if (Test-Path "frontend/src") { $frontend = Join-Path $root "frontend" }
elseif (Test-Path "src") { $frontend = $root }
else { throw "frontend/src not found. Run from project root or frontend folder." }
$src = Join-Path $frontend "src"
$styles = Join-Path $src "styles.css"
$index = Join-Path $frontend "index.html"
if (!(Test-Path $styles)) { throw "styles.css not found" }
if (!(Test-Path $index)) { throw "index.html not found" }
$backup = Join-Path $frontend ("premium-v5-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
New-Item -ItemType Directory -Force -Path $backup | Out-Null
Copy-Item $styles (Join-Path $backup "styles.css") -Force
Copy-Item $index (Join-Path $backup "index.html") -Force
Write-Host "Backup created: $backup" -ForegroundColor Yellow

# Remove visible bad breadcrumb text from code files.
Get-ChildItem $src -Recurse -Include *.js,*.jsx,*.ts,*.tsx,*.css -File | ForEach-Object {
  $p = $_.FullName
  $c = Get-Content $p -Raw
  $old = $c
  $c = $c -replace 'Use Home Guide -> Question Bank -> AI Mentor -> Career Prep\.?',''
  $c = $c -replace 'Use\s+Home\s+Guide\s*[-=]*>\s*Question\s+Bank\s*[-=]*>\s*AI\s+Mentor\s*[-=]*>\s*Career\s+Prep\.?',''
  $c = $c -replace 'Question\s+Bank\s*[-=]*>\s*AI\s+Mentor\s*[-=]*>\s*Career\s+Prep\.?',''
  if ($c -ne $old) { Set-Content $p $c -Encoding UTF8; Write-Host "Cleaned $($_.Name)" -ForegroundColor Green }
}

$runtime = Join-Path $src "premium-runtime-fix-v5.js"
@'
(function(){
  var TK='sfdc_theme_v5', WK='sfdc_watch_v5';
  var bad=/Use\s+Home\s+Guide\s*(?:->|>)\s*Question\s+Bank\s*(?:->|>)\s*AI\s+Mentor\s*(?:->|>)\s*Career\s+Prep\.?/i;
  function clean(){ if(!document.body)return; var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); var a=[],n; while(n=w.nextNode()){ if(bad.test(n.nodeValue||''))a.push(n); } a.forEach(function(x){x.nodeValue=(x.nodeValue||'').replace(bad,'').trim(); if(x.parentElement&&!x.parentElement.textContent.trim())x.parentElement.style.display='none';}); }
  function theme(m){m=['blue','night','purple'].indexOf(m)>=0?m:'night'; document.documentElement.dataset.premiumTheme=m; document.documentElement.classList.remove('theme-blue','theme-night','theme-purple','light','dark'); document.documentElement.classList.add('theme-'+m); document.body.classList.remove('theme-blue','theme-night','theme-purple','light','dark'); document.body.classList.add('theme-'+m); localStorage.setItem(TK,m); document.querySelectorAll('[data-p-theme]').forEach(function(b){b.classList.toggle('active',b.dataset.pTheme===m);});}
  function dock(){ if(document.getElementById('premiumDockV5'))return; var d=document.createElement('div'); d.id='premiumDockV5'; d.innerHTML='<button data-p-theme="blue">Blue</button><button data-p-theme="night">Night</button><button data-p-theme="purple">Purple</button><button id="watchToggleV5">Watch</button>'; document.body.appendChild(d); d.onclick=function(e){var b=e.target.closest('[data-p-theme]'); if(b)theme(b.dataset.pTheme); if(e.target.closest('#watchToggleV5'))show(!visible());};}
  function watch(){ if(document.getElementById('premiumWatchV5'))return; var x=document.createElement('div'); x.id='premiumWatchV5'; x.innerHTML='<div class="pw5h"><b>Career Watch</b><button id="pw5x">x</button></div><div id="pw5time" class="pw5time">--:--</div><div id="pw5date" class="pw5date"></div><div class="pw5a"><button data-min="25">25m Focus</button><button data-min="45">45m Sprint</button><button id="pw5r">Reset</button></div><div id="pw5timer" class="pw5timer">Ready for study sprint</div>'; document.body.appendChild(x); x.querySelector('#pw5x').onclick=function(){show(false)}; x.querySelector('#pw5r').onclick=function(){window.__watchEnd=0;tick()}; x.querySelectorAll('[data-min]').forEach(function(b){b.onclick=function(){window.__watchEnd=Date.now()+Number(b.dataset.min)*60000;tick();};});}
  function visible(){var x=document.getElementById('premiumWatchV5'); return x&&x.style.display!=='none';}
  function show(v){var x=document.getElementById('premiumWatchV5'); if(x)x.style.display=v?'block':'none'; localStorage.setItem(WK,v?'1':'0');}
  function tick(){var t=document.getElementById('pw5time'),d=document.getElementById('pw5date'),r=document.getElementById('pw5timer'); if(!t||!d||!r)return; var now=new Date(); t.textContent=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}); d.textContent=now.toLocaleDateString([], {weekday:'short',day:'2-digit',month:'short',year:'numeric'}); var end=window.__watchEnd||0; if(!end){r.textContent='Ready for study sprint';return;} var left=Math.max(0,end-Date.now()); if(!left){r.textContent='Sprint complete. Take 5 min break.'; window.__watchEnd=0; return;} var m=Math.floor(left/60000),s=Math.floor((left%60000)/1000); r.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+' remaining';}
  function init(){clean();dock();watch();theme(localStorage.getItem(TK)||'night');show(localStorage.getItem(WK)!=='0');tick();setInterval(tick,1000);setInterval(clean,700);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
'@ | Set-Content $runtime -Encoding UTF8

$html = Get-Content $index -Raw
$html = $html -replace '\s*<script[^>]+premium-theme-watch-fix\.js[^>]*></script>\s*',''
$html = $html -replace '\s*<script[^>]+premium-runtime-fix-v4\.js[^>]*></script>\s*',''
$html = $html -replace '\s*<script[^>]+premium-runtime-fix-v5\.js[^>]*></script>\s*',''
$html = $html -replace '</body>','  <script type="module" src="/src/premium-runtime-fix-v5.js"></script>`r`n</body>'
Set-Content $index $html -Encoding UTF8

$css = Get-Content $styles -Raw
$css = $css -replace '/\* === PREMIUM HOME THEME WATCH FIX V[345] === \*/[\s\S]*',''
Set-Content $styles $css -Encoding UTF8
@'

/* === PREMIUM HOME THEME WATCH FIX V5 === */
:root,html.theme-night{--premium-bg-1:#020617;--premium-bg-2:#101036;--premium-card:rgba(8,14,30,.86);--premium-card-2:rgba(255,255,255,.08);--premium-border:rgba(148,163,184,.22);--premium-text:#f8fafc;--premium-muted:#b8c4dd;--premium-accent:#22d3ee;--premium-accent-2:#6366f1;--premium-glow:rgba(34,211,238,.24)}
html.theme-blue{--premium-bg-1:#ecf7ff;--premium-bg-2:#f8fbff;--premium-card:rgba(255,255,255,.90);--premium-card-2:rgba(37,99,235,.09);--premium-border:rgba(37,99,235,.22);--premium-text:#0f172a;--premium-muted:#475569;--premium-accent:#0284c7;--premium-accent-2:#2563eb;--premium-glow:rgba(37,99,235,.20)}
html.theme-purple{--premium-bg-1:#12051f;--premium-bg-2:#2a0a43;--premium-card:rgba(27,12,48,.88);--premium-card-2:rgba(216,180,254,.11);--premium-border:rgba(216,180,254,.24);--premium-text:#fff7ff;--premium-muted:#dcc6ff;--premium-accent:#c084fc;--premium-accent-2:#ec4899;--premium-glow:rgba(192,132,252,.26)}
html[data-premium-theme],html[data-premium-theme] body{background:radial-gradient(circle at 25% 10%,var(--premium-glow),transparent 34%),linear-gradient(135deg,var(--premium-bg-1),var(--premium-bg-2))!important;color:var(--premium-text)!important;transition:.25s ease}
#premiumDockV5{position:fixed;right:22px;bottom:22px;z-index:2147483600;display:flex;gap:10px;padding:10px;border:1px solid var(--premium-border);border-radius:999px;background:var(--premium-card);backdrop-filter:blur(18px);box-shadow:0 24px 70px var(--premium-glow)}
#premiumDockV5 button{min-width:42px;height:42px;border:1px solid var(--premium-border);border-radius:999px;background:var(--premium-card-2);color:var(--premium-text);cursor:pointer;font-size:13px;font-weight:900;padding:0 12px}
#premiumDockV5 button:hover,#premiumDockV5 button.active{transform:translateY(-2px);box-shadow:0 12px 26px var(--premium-glow);border-color:var(--premium-accent)}
#premiumWatchV5{position:fixed;right:22px;bottom:88px;z-index:2147483599;width:min(315px,calc(100vw - 44px));padding:17px;border:1px solid var(--premium-border);border-radius:26px;background:var(--premium-card);backdrop-filter:blur(22px);box-shadow:0 26px 80px var(--premium-glow);color:var(--premium-text)}
.pw5h{display:flex;align-items:center;justify-content:space-between}.pw5h button{border:0;background:transparent;color:var(--premium-muted);font-size:22px;cursor:pointer}.pw5time{font-size:36px;font-weight:950;margin-top:10px}.pw5date,.pw5timer{color:var(--premium-muted);font-size:13px;font-weight:750;margin-top:8px}.pw5a{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.pw5a button{border:1px solid var(--premium-border);border-radius:999px;padding:8px 10px;background:linear-gradient(135deg,var(--premium-accent),var(--premium-accent-2));color:white;font-weight:850;cursor:pointer}
@media(max-width:640px){#premiumDockV5{right:10px;bottom:10px;gap:6px;padding:8px}#premiumDockV5 button{min-width:36px;height:36px;padding:0 10px}#premiumWatchV5{right:10px;bottom:70px;width:calc(100vw - 20px)}}
'@ | Add-Content $styles -Encoding UTF8

Write-Host "Premium V5 fix applied successfully." -ForegroundColor Green
Write-Host "Run: cd frontend; npm run build; npm run dev" -ForegroundColor Cyan
