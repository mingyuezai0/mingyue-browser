$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$javaHome = 'D:\Capacitor\jdk\jdk-21.0.12.1+1'
$androidHome = 'D:\Capacitor\android-sdk'
$gradleHome = 'D:\Capacitor\gradle-home'
$gradleBin = 'D:\Capacitor\gradle\gradle-8.14\bin'

if (-not (Test-Path $javaHome)) { throw "Missing JDK: $javaHome" }
if (-not (Test-Path $androidHome)) { throw "Missing Android SDK: $androidHome" }
if (-not (Test-Path $gradleBin)) { throw "Missing Gradle: $gradleBin" }

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $androidHome
$env:GRADLE_USER_HOME = $gradleHome
$env:Path = "$javaHome\bin;$gradleBin;$env:Path"

& "$gradleBin\gradle.bat" -p "$root\android" assembleDebug
if ($LASTEXITCODE -ne 0) { throw "Gradle APK build failed ($LASTEXITCODE)" }

$apk = Join-Path $root 'android\app\build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $apk)) { throw "APK not found: $apk" }
$outDir = Join-Path $root 'release'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$out = Join-Path $outDir 'Mingyue-Browser-1.0.1.apk'
Copy-Item -LiteralPath $apk -Destination $out -Force
Write-Host "APK: $out"
