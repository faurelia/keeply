Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$buildDir = Join-Path $root 'build'
$resourcesDir = Join-Path $root 'resources'
New-Item -ItemType Directory -Force -Path $buildDir, $resourcesDir | Out-Null

function New-KeeplyBitmap([int]$size) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $scale = $size / 512.0
  $graphics.ScaleTransform($scale, $scale)
  $tile = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $radius = 112.0
  $tile.AddArc(0, 0, $radius, $radius, 180, 90)
  $tile.AddArc(512 - $radius, 0, $radius, $radius, 270, 90)
  $tile.AddArc(512 - $radius, 512 - $radius, $radius, $radius, 0, 90)
  $tile.AddArc(0, 512 - $radius, $radius, $radius, 90, 90)
  $tile.CloseFigure()

  $background = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(24, 24, 39))
  $graphics.FillPath($background, $tile)
  $bookmark = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $points = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new(163, 112),
    [System.Drawing.PointF]::new(349, 112),
    [System.Drawing.PointF]::new(349, 401),
    [System.Drawing.PointF]::new(256, 337),
    [System.Drawing.PointF]::new(163, 401)
  )
  $bookmark.AddPolygon($points)
  $markBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Point]::new(150, 100), [System.Drawing.Point]::new(355, 410),
    [System.Drawing.Color]::FromArgb(139, 92, 246), [System.Drawing.Color]::FromArgb(45, 212, 191)
  )
  $graphics.FillPath($markBrush, $bookmark)
  $graphics.Dispose()
  $background.Dispose()
  $markBrush.Dispose()
  $bookmark.Dispose()
  $tile.Dispose()
  return $bitmap
}

$master = New-KeeplyBitmap 512
$master.Save((Join-Path $buildDir 'icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$master.Save((Join-Path $resourcesDir 'icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)

# Windows ICO with multiple PNG-backed sizes.
$sizes = @(16, 24, 32, 48, 64, 128, 256)
$images = @()
foreach ($size in $sizes) {
  $scaled = [System.Drawing.Bitmap]::new($master, $size, $size)
  $stream = [System.IO.MemoryStream]::new()
  $scaled.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  $images += ,$stream.ToArray()
  $stream.Dispose(); $scaled.Dispose()
}
$ico = [System.IO.MemoryStream]::new()
$writer = [System.IO.BinaryWriter]::new($ico)
$writer.Write([UInt16]0); $writer.Write([UInt16]1); $writer.Write([UInt16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $dim = if ($sizes[$i] -eq 256) { [byte]0 } else { [byte]$sizes[$i] }
  $writer.Write($dim); $writer.Write($dim); $writer.Write([byte]0); $writer.Write([byte]0)
  $writer.Write([UInt16]1); $writer.Write([UInt16]32)
  $writer.Write([UInt32]$images[$i].Length); $writer.Write([UInt32]$offset)
  $offset += $images[$i].Length
}
foreach ($image in $images) { $writer.Write($image) }
[System.IO.File]::WriteAllBytes((Join-Path $buildDir 'icon.ico'), $ico.ToArray())
$writer.Dispose(); $ico.Dispose()

# Apple ICNS containing the 512px and 256px PNG representations.
function Convert-ToBigEndian([int]$value) { return [byte[]]@((($value -shr 24) -band 255), (($value -shr 16) -band 255), (($value -shr 8) -band 255), ($value -band 255)) }
$icns = [System.IO.MemoryStream]::new()
$icns.Write([System.Text.Encoding]::ASCII.GetBytes('icns'), 0, 4)
$icns.Write((Convert-ToBigEndian 0), 0, 4)
foreach ($entry in @(@{Code='ic10'; Size=512}, @{Code='ic09'; Size=256})) {
  $scaled = [System.Drawing.Bitmap]::new($master, $entry.Size, $entry.Size)
  $stream = [System.IO.MemoryStream]::new(); $scaled.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  $data = $stream.ToArray(); $icns.Write([System.Text.Encoding]::ASCII.GetBytes($entry.Code), 0, 4)
  $icns.Write((Convert-ToBigEndian ($data.Length + 8)), 0, 4); $icns.Write($data, 0, $data.Length)
  $stream.Dispose(); $scaled.Dispose()
}
$bytes = $icns.ToArray(); [Array]::Copy((Convert-ToBigEndian $bytes.Length), 0, $bytes, 4, 4)
[System.IO.File]::WriteAllBytes((Join-Path $buildDir 'icon.icns'), $bytes)
$icns.Dispose(); $master.Dispose()
