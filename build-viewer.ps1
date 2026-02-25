## build-viewer.ps1 — Generates a self-contained HTML viewer for the Tharp Case Manager
## Combines React CDN + Babel standalone + Supabase + JSX source into one openable HTML file.

$jsxPath = Join-Path $PSScriptRoot "tharp-case-manager.jsx"
$outPath = Join-Path $PSScriptRoot "tharp-viewer.html"
$configPath = Join-Path $PSScriptRoot "supabase-config.json"

# Read the JSX source
$jsx = Get-Content $jsxPath -Raw -Encoding UTF8

# Replace ES module import with global destructuring (React is loaded as UMD global)
$jsx = $jsx -replace "import \{ useState, useEffect, useCallback \} from `"react`";", "const { useState, useEffect, useCallback } = React;"

# Remove "export default " prefix from function App — make it a plain function
$jsx = $jsx -replace "export default function App\(\)", "function App()"

# Read Supabase config (if it exists and is configured)
$supabaseUrl = ""
$supabaseKey = ""
if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    if ($config.supabaseUrl -and $config.supabaseUrl -ne "YOUR_SUPABASE_URL") {
        $supabaseUrl = $config.supabaseUrl
        $supabaseKey = $config.supabaseAnonKey
        Write-Host "Supabase: ENABLED ($supabaseUrl)"
    } else {
        Write-Host "Supabase: DISABLED (using localStorage only — edit supabase-config.json to enable)"
    }
    # Read OpenAI key
    if ($config.openaiApiKey -and $config.openaiApiKey -ne "YOUR_OPENAI_KEY") {
        $openaiKey = $config.openaiApiKey
        Write-Host "OpenAI: ENABLED"
    } else {
        Write-Host "OpenAI: DISABLED (no API key — edit supabase-config.json to enable)"
    }
} else {
    Write-Host "Supabase: DISABLED (no config file found)"
}

$openaiKey = if ($openaiKey) { $openaiKey } else { "" }

# Determine Supabase script tag
$supabaseScript = ""
if ($supabaseUrl) {
    $supabaseScript = '<script src="https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>'
}

# Build the HTML
$html = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tharp Case Manager — Montana Contracting v. Tharp/Bumgardner</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { height: 100%; width: 100%; }
    body { background: #FAFAF8; }
  </style>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  $supabaseScript
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>if(window.pdfjsLib)pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";</script>
  <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
</head>
<body>
  <div id="root"></div>

  <!-- Storage layer: Supabase cloud + localStorage fallback -->
  <script>
    (function() {
      // Supabase config (injected at build time)
      var SUPABASE_URL = "$supabaseUrl";
      var SUPABASE_KEY = "$supabaseKey";
      var sb = null;

      // Initialize Supabase if configured
      if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("[Storage] Supabase cloud storage ACTIVE");
      } else {
        console.log("[Storage] Using localStorage only (offline mode)");
      }

      // In-memory write cache to avoid redundant cloud writes
      var writeCache = {};

      window.storage = {
        get: function(key) {
          // Try Supabase first, fall back to localStorage
          if (sb) {
            return sb.from("app_data").select("value").eq("key", key).single()
              .then(function(res) {
                if (res.data && res.data.value) {
                  // Also cache in localStorage for offline access
                  try { localStorage.setItem(key, JSON.stringify(res.data.value)); } catch(e) {}
                  return { value: JSON.stringify(res.data.value) };
                }
                // Fall back to localStorage if not in cloud yet
                var v = localStorage.getItem(key);
                return v != null ? { value: v } : null;
              })
              .catch(function(err) {
                console.warn("[Storage] Cloud read failed, using localStorage:", err.message);
                var v = localStorage.getItem(key);
                return v != null ? { value: v } : null;
              });
          }
          var v = localStorage.getItem(key);
          return Promise.resolve(v != null ? { value: v } : null);
        },

        set: function(key, value) {
          // Always save to localStorage immediately (fast, offline-capable)
          try { localStorage.setItem(key, value); } catch(e) {}

          // Also persist to Supabase cloud
          if (sb) {
            var parsed;
            try { parsed = JSON.parse(value); } catch(e) { parsed = value; }
            return sb.from("app_data").upsert({ key: key, value: parsed }, { onConflict: "key" })
              .then(function(res) {
                if (res.error) {
                  console.warn("[Storage] Cloud write failed:", res.error.message);
                }
              })
              .catch(function(err) {
                console.warn("[Storage] Cloud write error:", err.message);
              });
          }
          return Promise.resolve();
        }
      };

      // Expose connection status and Supabase client for the UI
      window._storageMode = sb ? "cloud" : "local";
      window._sb = sb;

      // OpenAI key loaded from localStorage at runtime (not embedded in build)
      window._openaiKey = localStorage.getItem("tharp-openai-key") || "";
    })();
  </script>

  <script type="text/babel" data-type="module">
$jsx

// Mount the app
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
"@

# Write output
[System.IO.File]::WriteAllText($outPath, $html, [System.Text.UTF8Encoding]::new($false))
Write-Host "Built: $outPath"
Write-Host "Size: $([math]::Round((Get-Item $outPath).Length / 1024)) KB"
