# Premium Home Guide + Theme + Watch Fix V4
# Run from project root:
# powershell -ExecutionPolicy Bypass -File .\patches\apply-premium-home-theme-watch-fix.ps1

$ErrorActionPreference = "Stop"

function Resolve-FrontendRoot {
  $here = Get-Location
  if (Test-Path "frontend/src") { return (Join-Path $here "frontend") }
  if (Test-Path "src") { return $here }
  throw "frontend/src folder not found. Run this script from project root or frontend folder."
}

$frontend = Resolve-FrontendRoot
$src = Join-Path $frontend "src"
$styles = Join-Path $src "styles.css"
$indexHtml = Join-Path $frontend "index.html"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

if (!(Test-Path $styles)) { throw "frontend/src/styles.css not found." }
if (!(Test-Path $indexHtml)) { throw "frontend/index.html not found." }

Write-Host "Frontend found: $frontend" -ForegroundColor Cyan
$backupDir = Join-Path $frontend "premium-v4-backup-$stamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item $styles (Join-Path $backupDir "styles.css") -Force
Copy-Item $indexHtml (Join-Path $backupDir "index.html") -Force
Get-ChildItem -Path $src -Recurse -Include *.jsx,*.js,*.tsx,*.ts -File | ForEach-Object { Copy-Item $_.FullName (Join-Path $backupDir $_.Name) -Force -ErrorAction SilentlyContinue }
Write-Host "Backup created: $backupDir" -ForegroundColor Yellow

# 1) Remove bad Home Guide text from source files.
$badReplacements = @(
  @{p='Use\s+Home\s+Guide\s*(?:-&gt;|→|->|&rarr;)\s*Question\s+Bank\s*(?:-&gt;|→|->|&rarr;)\s*AI\s+Mentor\s*(?:-&gt;|→|->|&rarr;)\s*Career\s+Prep\.?'; r=''},
  @{p='Question\s+Bank\s*(?:-&gt;|→|->|&rarr;)\s*AI\s+Mentor\s*(?:-&gt;|→|->|&rarr;)\s*Career\s+Prep\.?'; r=''},
  @{p='Use Home Guide -> Question Bank -> AI Mentor -> Career Prep\.?'; r=''}
)

Get-ChildItem -Path $src -Recurse -Include *.jsx,*.js,*.tsx,*.ts,*.css -File | ForEach-Object {
  $path = $_.FullName
  $content = Get-Content $path -Raw
  $old = $content
  foreach ($item in $badReplacements) {
    $content = [regex]::Replace($content, $item.p, $item.r, 'IgnoreCase')
  }
  if ($content -ne $old) {
    Set-Content -Path $path -Value $content -Encoding UTF8
    Write-Host "Cleaned bad text in: $($_.Name)" -ForegroundColor Green
  }
}

# 2) Inject runtime fix. This handles text generated from saved state/localStorage also.
$runtimeFile = Join-Path $src "premium-runtime-fix-v4.js"
@'
(function () {
  const THEME_KEY = 'sfdc_premium_theme_mode_v4';
  const WATCH_KEY = 'sfdc_premium_watch_visible_v4';
  const badTextPattern = /use\s+home\s+guide\s*(?:->|→|>)\s*question\s+bank\s*(?:->|→|>)\s*ai\s+mentor\s*(?:->|→|>)\s*career\s+prep\.?/i;

  function cleanBadGuideText() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const targets = [];
    let node;
    while ((node = walker.nextNode())) {
      if (badTextPattern.test(node.nodeValue || '')) targets.push(node);
    }
    targets.forEach(node => {
      const parent = node.parentElement;
      node.nodeValue = (node.nodeValue || '').replace(badTextPattern, '').trim();
      if (parent && !parent.textContent.trim()) parent.style.display = 'none';
    });

    document.querySelectorAll('p,span,div,h1,h2,h3,h4,small,strong,b').forEach(el => {
      if (badTextPattern.test(el.textContent || '')) {
        el.textContent = (el.textContent || '').replace(badTextPattern, '').trim();
        if (!el.textContent.trim()) el.style.display = 'none';
      }
    });
  }

  function applyTheme(mode) {
    const next = ['blue', 'night', 'purple'].includes(mode) ? mode : 'night';
    const root = document.documentElement;
    root.dataset.premiumTheme = next;
    root.dataset.theme = next;
    root.classList.remove('theme-blue', 'theme-night', 'theme-purple', 'light', 'dark');
    root.classList.add('theme-' + next);
    document.body.classList.remove('theme-blue', 'theme-night', 'theme-purple', 'light', 'dark');
    document.body.classList.add('theme-' + next);
    localStorage.setItem(THEME_KEY, next);
    document.querySelectorAll('[data-premium-theme]').forEach(btn => btn.classList.toggle('active', btn.dataset.premiumTheme === next));
  }

  function ensureDock() {
    if (document.getElementById('premiumFixDockV4')) return;
    const dock = document.createElement('div');
    dock.id = 'premiumFixDockV4';
    dock.innerHTML = '<button type="button" data-premium-theme="blue" title="Blue Mode">🔵</button><button type="button" data-premium-theme="night" title="Night Mode">🌙</button><button type="button" data-premium-theme="purple" title="Purple Mode">🟣</button><button type="button" id="premiumWatchBtnV4" title="Career Watch">⌚</button>';
    document.body.appendChild(dock);
    dock.addEventListener('click', function (e) {
      const themeBtn = e.target.closest('[data-premium-theme]');
      if (themeBtn) applyTheme(themeBtn.dataset.premiumTheme);
      if (e.target.closest('#premiumWatchBtnV4')) setWatchVisible(!isWatchVisible());
    });
  }

  function ensureWatch() {
    if (document.getElementById('premiumWatchV4')) return;
    const box = document.createElement('div');
    box.id = 'premiumWatchV4';
    box.innerHTML = '<div class="pw4-head"><span>⌚ Career Watch</span><button type="button" id="pw4Close">×</button></div><div id="pw4Time" class="pw4-time">--:--</div><div id="pw4Date" class="pw4-date">Loading...</div><div class="pw4-actions"><button type="button" data-focus="25">25m Focus</button><button type="button" data-focus="45">45m Sprint</button><button type="button" id="pw4Reset">Reset</button></div><div id="pw4Timer" class="pw4-timer">Ready for study sprint</div>';
    document.body.appendChild(box);
    box.querySelector('#pw4Close').addEventListener('click', () => setWatchVisible(false));
    box.querySelector('#pw4Reset').addEventListener('click', () => { window.__premiumWatchEndV4 = 0; updateWatch(); });
    box.querySelectorAll('[data-focus]').forEach(btn => btn.addEventListener('click', () => {
      const mins = Number(btn.dataset.focus || '25');
      window.__premiumWatchEndV4 = Date.now() + mins * 60000;
      updateWatch();
    }));
  }

  function isWatchVisible() {
    const box = document.getElementById('premiumWatchV4');
    return !!box && box.style.display !== 'none';
  }

  function setWatchVisible(visible) {
    const box = document.getElementById('premiumWatchV4');
    if (box) box.style.display = visible ? 'block' : 'none';
    localStorage.setItem(WATCH_KEY, visible ? '1' : '0');
  }

  function updateWatch() {
    const time = document.getElementById('pw4Time');
    const date = document.getElementById('pw4Date');
    const timer = document.getElementById('pw4Timer');
    if (!time || !date || !timer) return;
    const now = new Date();
    time.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    date.textContent = now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    const end = window.__premiumWatchEndV4 || 0;
    if (!end) { timer.textContent = 'Ready for study sprint'; return; }
    const left = Math.max(0, end - Date.now());
    if (!left) { timer.textContent = 'Sprint complete. Take 5 min break.'; window.__premiumWatchEndV4 = 0; return; }
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    timer.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + ' remaining';
  }

  function hookExistingThemeButtons() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('button,a,[role="button"],.theme-btn,.themeButton,.chip,.toggle');
      if (!btn) return;
      const label = ((btn.innerText || btn.textContent || btn.title || btn.getAttribute('aria-label') || '') + '').toLowerCase();
      if (label.includes('🔵') || label.includes('blue')) { applyTheme('blue'); return; }
      if (label.includes('🌙') || label.includes('night') || label.includes('dark')) { applyTheme('night'); return; }
      if (label.includes('🟣') || label.includes('purple')) { applyTheme('purple'); return; }
      if (label.includes('⌚') || label.includes('watch')) setWatchVisible(!isWatchVisible());
    }, true);
  }

  function init() {
    cleanBadGuideText();
    ensureDock();
    ensureWatch();
    applyTheme(localStorage.getItem(THEME_KEY) || 'night');
    setWatchVisible(localStorage.getItem(WATCH_KEY) !== '0');
    updateWatch();
    hookExistingThemeButtons();
    setInterval(updateWatch, 1000);
    setInterval(cleanBadGuideText, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
'@ | Set-Content -Path $runtimeFile -Encoding UTF8

# 3) Ensure index.html loads the runtime fix.
$html = Get-Content $indexHtml -Raw
$html = [regex]::Replace($html, '\s*<script[^>]+premium-theme-watch-fix\.js[^>]*></script>\s*', "`r`n", 'IgnoreCase')
$html = [regex]::Replace($html, '\s*<script[^>]+premium-runtime-fix-v4\.js[^>]*></script>\s*', "`r`n", 'IgnoreCase')
$html = $html -replace '</body>', '  <script type="module" src="/src/premium-runtime-fix-v4.js"></script>' + "`r`n</body>"
Set-Content -Path $indexHtml -Value $html -Encoding UTF8

# 4) Premium V4 CSS. Remove old V3 block if present, then append V4.
$css = Get-Content $styles -Raw
$css = [regex]::Replace($css, '/\* === PREMIUM HOME THEME WATCH FIX V3 === \*/[\s\S]*$', '', 'IgnoreCase')
$css = [regex]::Replace($css, '/\* === PREMIUM HOME THEME WATCH FIX V4 === \*/[\s\S]*$', '', 'IgnoreCase')
@'

/* === PREMIUM HOME THEME WATCH FIX V4 === */
:root,html.theme-night{--premium-bg-1:#020617;--premium-bg-2:#101036;--premium-card:rgba(8,14,30,.84);--premium-card-2:rgba(255,255,255,.08);--premium-border:rgba(148,163,184,.22);--premium-text:#f8fafc;--premium-muted:#b8c4dd;--premium-accent:#22d3ee;--premium-accent-2:#6366f1;--premium-glow:rgba(34,211,238,.24)}
html.theme-blue{--premium-bg-1:#ecf7ff;--premium-bg-2:#f8fbff;--premium-card:rgba(255,255,255,.90);--premium-card-2:rgba(37,99,235,.09);--premium-border:rgba(37,99,235,.22);--premium-text:#0f172a;--premium-muted:#475569;--premium-accent:#0284c7;--premium-accent-2:#2563eb;--premium-glow:rgba(37,99,235,.20)}
html.theme-purple{--premium-bg-1:#12051f;--premium-bg-2:#2a0a43;--premium-card:rgba(27,12,48,.88);--premium-card-2:rgba(216,180,254,.11);--premium-border:rgba(216,180,254,.24);--premium-text:#fff7ff;--premium-muted:#dcc6ff;--premium-accent:#c084fc;--premium-accent-2:#ec4899;--premium-glow:rgba(192,132,252,.26)}
html[data-premium-theme],html[data-premium-theme] body{background:radial-gradient(circle at 25% 10%,var(--premium-glow),transparent 34%),linear-gradient(135deg,var(--premium-bg-1),var(--premium-bg-2))!important;color:var(--premium-text)!important;transition:background .25s ease,color .25s ease}
#premiumFixDockV4{position:fixed;right:22px;bottom:22px;z-index:2147483600;display:flex;gap:10px;padding:10px;border:1px solid var(--premium-border);border-radius:999px;background:var(--premium-card);backdrop-filter:blur(18px);box-shadow:0 24px 70px var(--premium-glow)}
#premiumFixDockV4 button{width:42px;height:42px;border:1px solid var(--premium-border);border-radius:999px;background:var(--premium-card-2);color:var(--premium-text);cursor:pointer;font-size:18px;transition:.18s ease;display:grid;place-items:center}
#premiumFixDockV4 button:hover,#premiumFixDockV4 button.active{transform:translateY(-2px) scale(1.04);box-shadow:0 12px 26px var(--premium-glow);border-color:var(--premium-accent)}
#premiumWatchV4{position:fixed;right:22px;bottom:88px;z-index:2147483599;width:min(315px,calc(100vw - 44px));padding:17px;border:1px solid var(--premium-border);border-radius:26px;background:var(--premium-card);backdrop-filter:blur(22px);box-shadow:0 26px 80px var(--premium-glow);color:var(--premium-text)}
.pw4-head{display:flex;align-items:center;justify-content:space-between;font-weight:900;letter-spacing:.02em}.pw4-head button{border:0;background:transparent;color:var(--premium-muted);font-size:24px;cursor:pointer}.pw4-time{font-size:36px;font-weight:950;margin-top:10px;line-height:1}.pw4-date{font-size:13px;color:var(--premium-muted);margin:7px 0 13px}.pw4-actions{display:flex;gap:8px;flex-wrap:wrap}.pw4-actions button{border:1px solid var(--premium-border);border-radius:999px;padding:8px 10px;background:linear-gradient(135deg,var(--premium-accent),var(--premium-accent-2));color:white;font-weight:850;cursor:pointer}.pw4-timer{margin-top:13px;color:var(--premium-muted);font-size:13px;font-weight:750}.card,.panel,.dashboard-card,.home-card,.guide-card,section{border-color:var(--premium-border)!important}button,a,.card,.panel,.dashboard-card,.home-card,.guide-card{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}button:hover,a:hover{filter:brightness(1.04)}
@media(max-width:640px){#premiumFixDockV4{right:10px;bottom:10px;gap:6px;padding:8px}#premiumFixDockV4 button{width:36px;height:36px}#premiumWatchV4{right:10px;bottom:70px;width:calc(100vw - 20px)}}
'@ | Add-Content -Path $styles -Encoding UTF8

Write-Host "Premium V4 fix applied successfully." -ForegroundColor Green
Write-Host "Run: cd frontend; npm run build; npm run dev" -ForegroundColor Cyan
