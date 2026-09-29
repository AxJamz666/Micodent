param(
  [Parameter(Mandatory = $true)]
  [string]$Destination
)

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$output = [IO.Path]::GetFullPath($Destination)
if (-not (Test-Path -LiteralPath $output -PathType Container)) { throw 'El directorio de entrega no existe.' }
if (-not $env:MICODENT_SECRET_REFERENCES) { throw 'Falta la referencia privada para la comprobacion de secretos.' }
$build = Get-Content -LiteralPath (Join-Path $root 'micodent-backend\public\build-version.json') -Raw | ConvertFrom-Json
if ($build.version -ne 'rc4-e12-e13-pilot') { throw 'El frontend compilado no pertenece a este candidato E13.' }
$commit = (& git -C $root rev-parse --short=7 HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $commit -notmatch '^[a-f0-9]{7}$') { throw 'No se pudo identificar el commit de origen.' }
$name = 'MICODENT_E13_GABRIELA_E12_' + $commit + '_' + (Get-Date -Format 'yyyyMMdd_HHmmss')
$stage = Join-Path $output $name
$zip = Join-Path $output ($name + '.zip')
$hashFile = Join-Path $output ($name + '.sha256.txt')
if ((Test-Path -LiteralPath $stage) -or (Test-Path -LiteralPath $zip) -or (Test-Path -LiteralPath $hashFile)) {
  throw 'Ya existe una entrega con ese nombre. No se sobrescribio nada.'
}

function Copy-Safe([string]$relative) {
  $normalized = $relative.Replace('\', '/')
  if ($normalized -match '(^|/)(uploads|node_modules|dist|\.git|\.runtime)(/|$)' -or
      $normalized -match '(^|/)\.env($|\.)' -and $normalized -notmatch '\.env\.example$') {
    throw "Ruta privada no permitida: $relative"
  }
  $source = Join-Path $root $relative
  $target = Join-Path $stage $relative
  $item = Get-Item -LiteralPath $source -Force
  if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Enlace no permitido: $relative" }
  if ($item.PSIsContainer) {
    [IO.Directory]::CreateDirectory($target) | Out-Null
    foreach ($child in Get-ChildItem -LiteralPath $source -Force) {
      if ($child.Name -eq 'uploads') { continue }
      Copy-Safe (Join-Path $relative $child.Name)
    }
  } else {
    [IO.Directory]::CreateDirectory((Split-Path -Parent $target)) | Out-Null
    [IO.File]::Copy($source, $target, $false)
  }
}

[IO.Directory]::CreateDirectory($stage) | Out-Null
foreach ($item in @(
  'iniciar_micodent.bat', 'comprobar_micodent.bat', 'micodent-arranque.cjs',
  'configurar_piloto_gabriela.ps1', 'docs/E13_GABRIELA_PILOTO.md',
  'micodent-backend/.env.example', 'micodent-backend/package.json',
  'micodent-backend/package-lock.json', 'micodent-backend/src',
  'micodent-backend/scripts', 'micodent-backend/migrations', 'micodent-backend/tests',
  'micodent-backend/public/index.html', 'micodent-backend/public/build-version.json',
  'micodent-frontend/.env.example', 'micodent-frontend/package.json',
  'micodent-frontend/package-lock.json', 'micodent-frontend/index.html',
  'micodent-frontend/vite.config.js', 'micodent-frontend/tailwind.config.js',
  'micodent-frontend/postcss.config.js', 'micodent-frontend/eslint.config.js',
  'micodent-frontend/src', 'micodent-frontend/public', 'micodent-frontend/tests',
  'micodent-frontend/README.md'
)) { Copy-Safe $item }
foreach ($asset in $build.files) {
  if ($asset.file -notmatch '^(assets/[A-Za-z0-9_.-]+|favicon\.svg|icons\.svg|index\.html|logo\.png)$') {
    throw 'El manifiesto del frontend contiene una ruta inesperada.'
  }
  if ($asset.file -ne 'index.html') { Copy-Safe ('micodent-backend/public/' + $asset.file) }
  $copied = (Get-FileHash -LiteralPath (Join-Path $stage ('micodent-backend/public/' + $asset.file)) -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($copied -ne $asset.sha256) { throw 'Un archivo compilado no coincide con su hash.' }
}

$files = @(Get-ChildItem -LiteralPath $stage -Recurse -File | ForEach-Object {
  $relative = $_.FullName.Substring($stage.Length + 1).Replace('\', '/')
  [ordered]@{ path = $relative; bytes = $_.Length; sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
} | Sort-Object path)
$manifest = [ordered]@{
  version = $build.version
  sourceCommit = $commit
  createdAtUtc = [DateTime]::UtcNow.ToString('o')
  profile = 'fresh-local-pilot-only'
  exclusions = @('private .env', 'node_modules', 'database contents', 'clinical uploads', 'real users')
  files = $files
}
[IO.File]::WriteAllText((Join-Path $stage 'MANIFEST.json'), ($manifest | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
& node (Join-Path $root 'micodent-backend\scripts\check-secrets.js') --artifact $stage
if ($LASTEXITCODE -ne 0) { throw 'La comprobacion de secretos rechazo el paquete.' }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipStream = [IO.File]::Open($zip, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write)
$writer = [IO.Compression.ZipArchive]::new($zipStream, [IO.Compression.ZipArchiveMode]::Create, $false)
try {
  foreach ($file in $files) {
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($writer, (Join-Path $stage $file.path), $file.path, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($writer, (Join-Path $stage 'MANIFEST.json'), 'MANIFEST.json', [IO.Compression.CompressionLevel]::Optimal) | Out-Null
} finally { $writer.Dispose(); $zipStream.Dispose() }
$archive = [IO.Compression.ZipFile]::OpenRead($zip)
try {
  foreach ($file in $files) {
    $entry = $archive.GetEntry($file.path)
    if ($null -eq $entry -or $entry.Length -ne $file.bytes) { throw "Archivo ausente o incompleto en ZIP: $($file.path)" }
    $stream = $entry.Open()
    $sha = [Security.Cryptography.SHA256]::Create()
    try { $digest = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
    finally { $stream.Dispose(); $sha.Dispose() }
    if ($digest -ne $file.sha256) { throw "Hash incorrecto dentro del ZIP: $($file.path)" }
  }
  if ($null -eq $archive.GetEntry('MANIFEST.json')) { throw 'Falta MANIFEST.json en el ZIP.' }
} finally { $archive.Dispose() }
$zipHash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText($hashFile, ($zipHash + '  ' + (Split-Path -Leaf $zip) + "`n"), [Text.UTF8Encoding]::new($false))
Write-Output ([ordered]@{ folder = $stage; zip = $zip; sha256 = $zipHash; files = $files.Count; bytes = (Get-Item -LiteralPath $zip).Length; sourceCommit = $commit } | ConvertTo-Json)
