# Premium Home Guide + Theme + Watch Fix Patch
# Run from project root or frontend folder:
# powershell -ExecutionPolicy Bypass -File .\patches\apply-premium-home-theme-watch-fix.ps1

$ErrorActionPreference = "Stop"

function Resolve-FrontendRoot {
  $here = Get-Location
  if (Test-Path "frontend/src") { return (Join-Path $here "frontend") }
  if (Test-Path "src") { return $here }
  throw "frontend/src folder not found. Run this script from project root folder or frontend folder."
}

$frontend = Resolve-FrontendRoot
$src = Join-Path $frontend "src"
$styles = Join-Path $src "styles.css"
$indexHtml = Join-Path $frontend "index.html"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

if (!(Test-Path $styles)) { throw "frontend/src/styles.css not found." }
if (!(Test-Path $indexHtml)) { throw "frontend/index.html not found." }

Write-Host "Frontend found: $frontend" -ForegroundColor Cyan

$backupDir = Join-Path $frontend "premium-fix-backup-$stamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item $styles (Join-Path $backupDir "styles.css") -Force
Copy-Item $indexHtml (Join-Path $backupDir "index.html") -Force
Write-Host "Backup created: $backupDir" -ForegroundColor Yellow

$removePatterns = @(
  'Use Home Guide\s*(?:-&gt;|→|->)\s*Question Bank\s*(?:-&gt;|→|->)\s*AI Mentor\s*(?:-&gt;|→|->)\s*Career Prep\.?',
  'Home Guide\s*(?:-&gt;|→|->)\s*Question Bank\s*(?:-&gt;|→|->)\s*AI Mentor\s*(?:-&gt;|→|->)\s*Career Prep\.?',
  'Question Bank\s*(?:-&gt;|→|->)\s*AI Mentor\s*(?:-&gt;|→|->)\s*Career Prep\.?' 
)

Get-ChildItem -Path $src -Recurse -Include *.jsx,*.js,*.tsx,*.ts -File | ForEach-Object {
  $path = $_.FullName
  $content = Get-Content $path -Raw
  $old = $content
  foreach ($p in $removePatterns) {
    $content = [regex]::Replace($content, $p, 'Use Home Guide for your clean daily path.', 'IgnoreCase')
  }
  if ($content -ne $old) {
    Set-Content -Path $path -Value $content -Encoding UTF8
    Write-Host "Cleaned Home Guide text in: $($_.Name)" -ForegroundColor Green
  }
}

$themeFile = Join-Path $src "premium-theme-watch-fix.js"
@'
(function () {
  const KEY = 'sfdc_premium_theme_mode_v3';
  const WATCH_KEY = 'sfdc_premium_watch_visible_v1';
  const root = document.documentElement;

  function applyTheme(mode) {
    const next = ['blue','night','purple'].includes(mode) ? mode : 'night';
    root.dataset.theme = next;
    root.classList.remove('theme-blue','theme-night','theme-purple','light','dark');
    root.classList.add('theme-' + next);
    if (document.body) {
      document.body.classList.remove('theme-blue','theme-night','theme-purple','light','dark');
      document.body.classList.add('theme-' + next);
    }
    localStorage.setItem(KEY, next);
    document.querySelectorAll('[data-premium-theme]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-premium-theme') === next);
    });
  }

  function buildControls() {
    if (document.getElementById('premiumThemeWatchDock')) return;
    const dock = document.createElement('div');
    dock.id = 'premiumThemeWatchDock';
    dock.innerHTML = '<button type="button" data-premium-theme="blue" title="Blue mode">🔵</button><button type="button" data-premium-theme="night" title="Night mode">🌙</button><button type="button" data-premium-theme="purple" title="Purple mode">🟣</button><button type="button" id="premiumWatchToggle" title="Watch">⌚</button>';
    document.body.appendChild(dock);
    dock.addEventListener('click', e => {
      const btn = e.target.closest('[data-premium-theme]');
      if (btn) applyTheme(btn.getAttribute('data-premium-theme'));
      if (e.target.closest('#premiumWatchToggle')) toggleWatch();
    });
  }

  function buildWatch() {
    if (document.getElementById('premiumWatchWidget')) return;
    const box = document.createElement('div');
    box.id = 'premiumWatchWidget';
    box.innerHTML = '<div class="premium-watch-top"><span>Career Watch</span><button type="button" id="premiumWatchClose">×</button></div><div class="premium-watch-time" id="premiumWatchTime">--:--</div><div class="premium-watch-date" id="premiumWatchDate">Loading...</div><div class="premium-watch-actions"><button type="button" data-min="25">25m Focus</button><button type="button" data-min="45">45m Sprint</button><button type="button" id="premiumWatchReset">Reset</button></div><div class="premium-watch-timer" id="premiumWatchTimer">Ready for study sprint</div>';
    document.body.appendChild(box);
    box.querySelector('#premiumWatchClose').addEventListener('click', () => setWatchVisible(false));
    box.querySelector('#premiumWatchReset').addEventListener('click', () => { window.__premiumWatchEnd = null; document.getElementById('premiumWatchTimer').textContent = 'Ready for study sprint'; });
    box.querySelectorAll('[data-min]').forEach(btn => btn.addEventListener('click', () => {
      const mins = Number(btn.getAttribute('data-min')) || 25;
      window.__premiumWatchEnd = Date.now() + mins * 60 * 1000;
      document.getElementById('premiumWatchTimer').textContent = `${mins}:00 focus started`;
    }));
  }

  function updateWatch() {
    const time = document.getElementById('premiumWatchTime');
    const date = document.getElementById('premiumWatchDate');
    const timer = document.getElementById('premiumWatchTimer');
    if (!time || !date) return;
    const now = new Date();
    time.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    date.textContent = now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    if (timer && window.__premiumWatchEnd) {
      const left = Math.max(0, window.__premiumWatchEnd - Date.now());
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      timer.textContent = left > 0 ? `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} remaining` : 'Sprint complete. Take 5 min break.';
      if (left <= 0) window.__premiumWatchEnd = null;
    }
  }

  function setWatchVisible(visible) {
    localStorage.setItem(WATCH_KEY, visible ? '1' : '0');
    const box = document.getElementById('premiumWatchWidget');
    if (box) box.style.display = visible ? 'block' : 'none';
  }

  function toggleWatch() {
    const box = document.getElementById('premiumWatchWidget');
    setWatchVisible(!(box && box.style.display !== 'none'));
  }

  function init() {
    applyTheme(localStorage.getItem(KEY) || 'night');
    buildControls();
    buildWatch();
    setWatchVisible(localStorage.getItem(WATCH_KEY) !== '0');
    updateWatch();
    setInterval(updateWatch, 1000);
    document.addEventListener('click', function (e) {
      const clickable = e.target.closest('button,a,[role="button"],.theme-btn,.themeButton,.toggle,.chip');
      const label = clickable ? (clickable.innerText || clickable.textContent || clickable.getAttribute('aria-label') || clickable.title || '').toLowerCase() : '';
      const theme = label.includes('🔵') || label.includes('blue') ? 'blue' : label.includes('🌙') || label.includes('night') || label.includes('dark') ? 'night' : label.includes('🟣') || label.includes('purple') ? 'purple' : null;
      if (theme) { applyTheme(theme); e.preventDefault(); }
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
'@ | Set-Content -Path $themeFile -Encoding UTF8

$html = Get-Content $indexHtml -Raw
if ($html -notmatch 'premium-theme-watch-fix\.js') {
  $html = $html -replace '</body>', '  <script type="module" src="/src/premium-theme-watch-fix.js"></script>`r`n</body>'
  Set-Content -Path $indexHtml -Value $html -Encoding UTF8
}

$cssMarker = '/* === PREMIUM HOME THEME WATCH FIX V3 === */'
$currentCss = Get-Content $styles -Raw
if ($currentCss -notlike "*$cssMarker*") {
@'

/* === PREMIUM HOME THEME WATCH FIX V3 === */
:root, html.theme-night{--premium-bg-1:#020617;--premium-bg-2:#08111f;--premium-card:rgba(15,23,42,.84);--premium-card-2:rgba(255,255,255,.07);--premium-border:rgba(148,163,184,.20);--premium-text:#f8fafc;--premium-muted:#a7b6d3;--premium-accent:#22d3ee;--premium-accent-2:#6366f1;--premium-glow:rgba(34,211,238,.22)}
html.theme-blue{--premium-bg-1:#eaf5ff;--premium-bg-2:#f8fbff;--premium-card:rgba(255,255,255,.88);--premium-card-2:rgba(37,99,235,.08);--premium-border:rgba(37,99,235,.20);--premium-text:#0f172a;--premium-muted:#475569;--premium-accent:#0284c7;--premium-accent-2:#2563eb;--premium-glow:rgba(37,99,235,.20)}
html.theme-purple{--premium-bg-1:#13051f;--premium-bg-2:#240b3f;--premium-card:rgba(30,13,52,.86);--premium-card-2:rgba(216,180,254,.10);--premium-border:rgba(216,180,254,.22);--premium-text:#fff7ff;--premium-muted:#d8b4fe;--premium-accent:#c084fc;--premium-accent-2:#ec4899;--premium-glow:rgba(192,132,252,.24)}
html[data-theme], html[data-theme] body{background:radial-gradient(circle at top left,var(--premium-glow),transparent 35%),linear-gradient(135deg,var(--premium-bg-1),var(--premium-bg-2))!important;color:var(--premium-text)!important;transition:background .25s ease,color .25s ease}
#premiumThemeWatchDock{position:fixed;right:18px;top:18px;z-index:99999;display:flex;gap:9px;padding:10px;border:1px solid var(--premium-border);border-radius:999px;background:var(--premium-card);backdrop-filter:blur(18px);box-shadow:0 18px 55px var(--premium-glow)}
#premiumThemeWatchDock button{width:38px;height:38px;border:1px solid var(--premium-border);border-radius:999px;background:var(--premium-card-2);color:var(--premium-text);cursor:pointer;font-size:17px;transition:.2s ease}
#premiumThemeWatchDock button:hover,#premiumThemeWatchDock button.active{transform:translateY(-2px);box-shadow:0 10px 25px var(--premium-glow);border-color:var(--premium-accent)}
#premiumWatchWidget{position:fixed;right:18px;bottom:18px;z-index:99998;width:min(300px,calc(100vw - 36px));padding:16px;border:1px solid var(--premium-border);border-radius:24px;background:var(--premium-card);backdrop-filter:blur(20px);box-shadow:0 22px 70px var(--premium-glow);color:var(--premium-text)}
.premium-watch-top{display:flex;align-items:center;justify-content:space-between;font-weight:800;letter-spacing:.02em}.premium-watch-top button{border:0;background:transparent;color:var(--premium-muted);font-size:24px;cursor:pointer}.premium-watch-time{font-size:34px;font-weight:900;margin-top:10px}.premium-watch-date{font-size:13px;color:var(--premium-muted);margin-bottom:12px}.premium-watch-actions{display:flex;gap:8px;flex-wrap:wrap}.premium-watch-actions button{border:1px solid var(--premium-border);border-radius:999px;padding:8px 10px;background:linear-gradient(135deg,var(--premium-accent),var(--premium-accent-2));color:white;font-weight:800;cursor:pointer}.premium-watch-timer{margin-top:12px;color:var(--premium-muted);font-size:13px;font-weight:700}
main,section,.card,.panel,.dashboard-card,.home-card,.guide-card{border-color:var(--premium-border)!important}.card,.panel,.dashboard-card,.home-card,.guide-card{box-shadow:0 20px 70px rgba(0,0,0,.12),0 0 0 1px var(--premium-border)!important;backdrop-filter:blur(16px)}
@media(max-width:640px){#premiumThemeWatchDock{right:10px;top:10px;gap:6px;padding:8px}#premiumThemeWatchDock button{width:34px;height:34px}#premiumWatchWidget{right:10px;bottom:10px}}
'@ | Add-Content -Path $styles -Encoding UTF8
}

Write-Host "Premium Home Guide + Theme + Watch Fix applied successfully." -ForegroundColor Green
Write-Host "Now run: cd frontend; npm run dev" -ForegroundColor Cyan
