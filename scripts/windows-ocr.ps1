param(
  [Parameter(Mandatory = $true)]
  [string]$Path
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Storage.FileAccessMode, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
[void][Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
[void][Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime]
[void][Windows.Media.Ocr.OcrResult, Windows.Media.Ocr, ContentType = WindowsRuntime]

function Wait-WinRt {
  param(
    [Parameter(Mandatory = $true)]
    [object]$Operation,
    [Parameter(Mandatory = $true)]
    [type]$ResultType
  )

  $asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object { $_.Name -eq "AsTask" -and $_.IsGenericMethodDefinition } |
    Where-Object { $_.GetGenericArguments().Length -eq 1 } |
    Where-Object { $_.GetParameters().Length -eq 1 } |
    Select-Object -First 1

  $task = $asTask.
    MakeGenericMethod($ResultType).
    Invoke($null, @($Operation))
  return $task.GetAwaiter().GetResult()
}

$resolvedPath = (Resolve-Path -LiteralPath $Path).Path
$ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if ($null -eq $ocrEngine) {
  throw "Windows OCR engine unavailable."
}

$storageFile = Wait-WinRt `
  -Operation ([Windows.Storage.StorageFile]::GetFileFromPathAsync($resolvedPath)) `
  -ResultType ([Windows.Storage.StorageFile])
$fileStream = Wait-WinRt `
  -Operation ($storageFile.OpenAsync([Windows.Storage.FileAccessMode]::Read)) `
  -ResultType ([Windows.Storage.Streams.IRandomAccessStream])
$bitmapDecoder = Wait-WinRt `
  -Operation ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($fileStream)) `
  -ResultType ([Windows.Graphics.Imaging.BitmapDecoder])
$softwareBitmap = Wait-WinRt `
  -Operation ($bitmapDecoder.GetSoftwareBitmapAsync()) `
  -ResultType ([Windows.Graphics.Imaging.SoftwareBitmap])
$ocrResult = Wait-WinRt `
  -Operation ($ocrEngine.RecognizeAsync($softwareBitmap)) `
  -ResultType ([Windows.Media.Ocr.OcrResult])

$ocrResult.Lines | ForEach-Object { $_.Text }
