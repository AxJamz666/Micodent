param()

$ErrorActionPreference = 'Stop'
$backend = Join-Path $PSScriptRoot 'micodent-backend'
$envFile = Join-Path $backend '.env'
if (-not (Test-Path -LiteralPath (Join-Path $backend 'package.json'))) {
  throw 'No se encontro micodent-backend junto a este script.'
}
if (Test-Path -LiteralPath $envFile) {
  throw 'Ya existe .env. No se sobrescribio la configuracion existente.'
}

$dbBytes = New-Object byte[] 24
$jwtBytes = New-Object byte[] 48
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
try {
  $rng.GetBytes($dbBytes)
  $rng.GetBytes($jwtBytes)
} finally {
  $rng.Dispose()
}
$dbPassword = [BitConverter]::ToString($dbBytes).Replace('-', '').ToLowerInvariant()
$jwtSecret = [BitConverter]::ToString($jwtBytes).Replace('-', '').ToLowerInvariant()
$content = @(
  'PORT=4000',
  'DB_HOST=127.0.0.1',
  'DB_PORT=3306',
  'DB_USER=dev_micodent',
  'DB_NAME=micodent_dev',
  ('DB_' + 'PASSWORD=' + $dbPassword),
  ('JWT_' + 'SECRET=' + $jwtSecret),
  'JWT_EXPIRES_IN=8h'
) -join "`n"

$stream = [IO.File]::Open($envFile, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write)
try {
  $bytes = [Text.UTF8Encoding]::new($false).GetBytes($content + "`n")
  $stream.Write($bytes, 0, $bytes.Length)
} finally {
  $stream.Dispose()
}
Write-Host 'Configuracion privada creada en micodent-backend/.env.'
Write-Host 'Contrasena de la cuenta local de BD, visible solo ahora:'
Write-Host $dbPassword
Write-Host 'Usela para crear dev_micodent en MariaDB. No comparta ni tome fotos de esta pantalla.'
