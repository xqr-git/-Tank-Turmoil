# =============================================================
#  坦克动荡 —— 局域网服务器（零依赖版）
#
#  不需要安装 Node / Python，Windows 自带的 PowerShell 就能跑。
#  职责与 server.js 完全一致：
#    1. 静态文件服务（index.html / game.js / net.js / lobby.js）
#    2. 极简 WebSocket（RFC 6455 握手 + 文本帧收发）
#    3. 房间管理：创建 / 加入 / 双向转发（2~3 人）
#
#  入口：双击「游戏启动.bat」
#  关闭窗口 = 关闭服务器
# =============================================================

#requires -Version 3.0

$ErrorActionPreference = 'Stop'

$Root = $PSScriptRoot
if ([string]::IsNullOrEmpty($Root)) { $Root = $env:TANK_ROOT }
if ([string]::IsNullOrEmpty($Root)) {
    $Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
}

$MIME = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.txt'  = 'text/plain; charset=utf-8'
}

# -------------------------------------------------------------
#  全局状态
# -------------------------------------------------------------
$script:Clients   = @{}        # id -> client
$script:Rooms     = @{}        # code -> @{ Max; Clients = @(...) }
$script:NextId    = 1
$script:Port      = 0
$script:LanIps    = @()
$script:StatusRow = -1
$script:LastEvent = '等待玩家进入...'

$script:CodeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
$script:Rand = New-Object System.Random
$script:Debug = ($env:TANK_DEBUG -eq '1')

# -------------------------------------------------------------
#  发送
# -------------------------------------------------------------
function Send-All($client, [byte[]]$data) {
    if ($null -eq $client -or $client.Closed) { return }
    try {
        $sock = $client.Sock
        $total = $data.Length
        $sent = 0
        while ($sent -lt $total) {
            $n = $sock.Send($data, $sent, $total - $sent, [System.Net.Sockets.SocketFlags]::None)
            if ($n -le 0) { break }
            $sent = $sent + $n
        }
    } catch {
        Close-Client $client
    }
}

function Send-Frame($client, [int]$opcode, [byte[]]$payload) {
    if ($null -eq $client -or $client.Closed) { return }
    $n = 0
    if ($null -ne $payload) { $n = $payload.Length }

    if ($n -lt 126) {
        $hdr = New-Object byte[] 2
        $hdr[0] = [byte](0x80 -bor $opcode)
        $hdr[1] = [byte]$n
    } elseif ($n -lt 65536) {
        $hdr = New-Object byte[] 4
        $hdr[0] = [byte](0x80 -bor $opcode)
        $hdr[1] = [byte]126
        $hdr[2] = [byte][math]::Floor($n / 256)
        $hdr[3] = [byte]($n % 256)
    } else {
        $hdr = New-Object byte[] 10
        $hdr[0] = [byte](0x80 -bor $opcode)
        $hdr[1] = [byte]127
        $hdr[2] = 0; $hdr[3] = 0; $hdr[4] = 0; $hdr[5] = 0
        $hdr[6] = [byte](([math]::Floor($n / 16777216)) % 256)
        $hdr[7] = [byte](([math]::Floor($n / 65536)) % 256)
        $hdr[8] = [byte](([math]::Floor($n / 256)) % 256)
        $hdr[9] = [byte]($n % 256)
    }

    $frame = New-Object byte[] ($hdr.Length + $n)
    [Array]::Copy($hdr, 0, $frame, 0, $hdr.Length)
    if ($n -gt 0) { [Array]::Copy($payload, 0, $frame, $hdr.Length, $n) }
    Send-All $client $frame
}

function Send-Json($client, [string]$json) {
    if ($null -eq $client -or $client.Closed) { return }
    Send-Frame $client 0x1 ([System.Text.Encoding]::UTF8.GetBytes($json))
}

function Send-Http($client, [int]$status, [string]$contentType, [byte[]]$body) {
    if ($null -eq $body) { $body = New-Object byte[] 0 }
    switch ($status) {
        200 { $st = 'OK' }
        400 { $st = 'Bad Request' }
        403 { $st = 'Forbidden' }
        404 { $st = 'Not Found' }
        405 { $st = 'Method Not Allowed' }
        default { $st = 'OK' }
    }
    $head = "HTTP/1.1 $status $st`r`n" +
            "Content-Type: $contentType`r`n" +
            "Content-Length: $($body.Length)`r`n" +
            "Cache-Control: no-cache, no-store`r`n" +
            "Connection: close`r`n`r`n"
    $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
    $all = New-Object byte[] ($hb.Length + $body.Length)
    [Array]::Copy($hb, 0, $all, 0, $hb.Length)
    if ($body.Length -gt 0) { [Array]::Copy($body, 0, $all, $hb.Length, $body.Length) }
    Send-All $client $all
    Close-Client $client
}

# -------------------------------------------------------------
#  缓冲
# -------------------------------------------------------------
function Ensure-Buf($client, [int]$need) {
    if ($client.Buf.Length -ge $need) { return }
    $size = $client.Buf.Length
    while ($size -lt $need) { $size = $size * 2 }
    $nb = New-Object byte[] $size
    [Array]::Copy($client.Buf, 0, $nb, 0, $client.Len)
    $client.Buf = $nb
}

function Append-Buf($client, [byte[]]$chunk, [int]$count) {
    if ($count -le 0) { return }
    Ensure-Buf $client ($client.Len + $count)
    [Array]::Copy($chunk, 0, $client.Buf, $client.Len, $count)
    $client.Len = $client.Len + $count
}

# -------------------------------------------------------------
#  房间逻辑
# -------------------------------------------------------------
function Room-Count($room) {
    $n = 0
    foreach ($x in $room.Clients) { if ($null -ne $x) { $n = $n + 1 } }
    return $n
}

function Make-Code {
    for ($attempt = 0; $attempt -lt 200; $attempt++) {
        $code = ''
        for ($i = 0; $i -lt 4; $i++) {
            $code = $code + $script:CodeChars[$script:Rand.Next(0, $script:CodeChars.Length)]
        }
        if (-not $script:Rooms.ContainsKey($code)) { return $code }
    }
    return 'R' + ([DateTime]::Now.Ticks.ToString().Substring(12, 3))
}

function Broadcast($room, $except, [string]$json) {
    foreach ($c in $room.Clients) {
        if ($null -ne $c -and $c -ne $except) { Send-Json $c $json }
    }
}

function Leave-Room($client, [bool]$notify) {
    $code = $client.Room
    if ([string]::IsNullOrEmpty($code)) { return }
    $room = $script:Rooms[$code]
    $client.Room = $null
    if ($null -eq $room) { return }

    $side = $client.Side
    if ($side -ge 0 -and $side -lt 3) { $room.Clients[$side] = $null }

    if ($notify) {
        Broadcast $room $null ('{"t":"peerleft","side":' + $side + ',"n":' + (Room-Count $room) + '}')
    }
    if ((Room-Count $room) -eq 0) { $script:Rooms.Remove($code) }
    Update-Status
}

function Inject-Side([string]$json, [int]$side) {
    $s = $json.TrimEnd()
    if ($s.EndsWith('}')) {
        return $s.Substring(0, $s.Length - 1) + ',"side":' + $side + '}'
    }
    return $s
}

function Handle-Message($client, [string]$raw) {
    $m = [regex]::Match($raw, '"t"\s*:\s*"([A-Za-z]+)"')
    if (-not $m.Success) { return }
    $type = $m.Groups[1].Value

    if ($type -eq 'create') {
        if (-not [string]::IsNullOrEmpty($client.Room)) { return }
        $mx = 2
        $mm = [regex]::Match($raw, '"max"\s*:\s*(\d+)')
        if ($mm.Success -and [int]$mm.Groups[1].Value -eq 3) { $mx = 3 }
        $code = Make-Code
        $client.Side = 0
        $script:Rooms[$code] = @{ Max = $mx; Clients = @($client, $null, $null) }
        $client.Room = $code
        Send-Json $client ('{"t":"created","code":"' + $code + '","side":0,"max":' + $mx + '}')
        Set-Event ('房间 ' + $code + ' 已创建（' + $mx + ' 人）')
        return
    }

    if ($type -eq 'join') {
        $mc = [regex]::Match($raw, '"code"\s*:\s*"([A-Za-z0-9]+)"')
        $code = ''
        if ($mc.Success) { $code = $mc.Groups[1].Value.ToUpper() }
        $room = $script:Rooms[$code]
        if ($null -eq $room) {
            Send-Json $client '{"t":"err","msg":"房间不存在或已关闭"}'
            return
        }
        if ($client.Room -eq $code) {
            Send-Json $client '{"t":"err","msg":"不能加入自己的房间"}'
            return
        }
        $slot = -1
        for ($i = 1; $i -lt $room.Max; $i++) {
            if ($null -eq $room.Clients[$i]) { $slot = $i; break }
        }
        if ($slot -lt 0) {
            Send-Json $client '{"t":"err","msg":"房间已满"}'
            return
        }
        $room.Clients[$slot] = $client
        $client.Room = $code
        $client.Side = $slot
        Send-Json $client ('{"t":"joined","code":"' + $code + '","side":' + $slot + ',"max":' + $room.Max + '}')
        Broadcast $room $client ('{"t":"peer","n":' + (Room-Count $room) + ',"max":' + $room.Max + ',"side":' + $slot + '}')
        Set-Event ('房间 ' + $code + ' 有人加入（' + (Room-Count $room) + '/' + $room.Max + '）')
        return
    }

    if ($type -eq 'ping') {
        Send-Json $client '{"t":"pong"}'
        return
    }

    if ($type -eq 'bye') {
        Leave-Room $client $true
        return
    }

    # 其余是游戏消息：input / act 只发给房主，snap / start 等广播给其他人
    $stamped = Inject-Side $raw $client.Side
    if ($type -eq 'input' -or $type -eq 'act') {
        $room = $script:Rooms[$client.Room]
        if ($null -ne $room -and $null -ne $room.Clients[0]) {
            Send-Json $room.Clients[0] $stamped
        }
    } else {
        $room = $script:Rooms[$client.Room]
        if ($null -ne $room) { Broadcast $room $client $stamped }
    }
}

function Close-Client($client) {
    if ($null -eq $client -or $client.Closed) { return }
    $client.Closed = $true
    Leave-Room $client $true
    try { $client.Sock.Close() } catch { }
    $script:Clients.Remove($client.Id)
    Update-Status
}

# -------------------------------------------------------------
#  WebSocket 帧解析
# -------------------------------------------------------------
function Read-WsFrame($client) {
    $buf = $client.Buf
    $len = $client.Len
    if ($len -lt 2) { return $null }

    $b1 = [int]$buf[1]
    $opcode = ([int]$buf[0]) -band 0x0F
    $masked = (($b1 -band 0x80) -ne 0)
    $plen = $b1 -band 0x7F
    $off = 2

    if ($plen -eq 126) {
        if ($len -lt 4) { return $null }
        $plen = ([int]$buf[2] * 256) + [int]$buf[3]
        $off = 4
    } elseif ($plen -eq 127) {
        if ($len -lt 10) { return $null }
        $hi = ([int64]$buf[2] * 16777216) + ([int64]$buf[3] * 65536) + ([int64]$buf[4] * 256) + [int64]$buf[5]
        $lo = ([int64]$buf[6] * 16777216) + ([int64]$buf[7] * 65536) + ([int64]$buf[8] * 256) + [int64]$buf[9]
        $plen = [int64]($hi * 4294967296) + $lo
        $off = 10
    }

    if ($plen -gt 2097152) { return 'too-big' }

    $maskOff = $off
    if ($masked) { $off = $off + 4 }
    if ($len -lt ($off + $plen)) { return $null }

    $payload = New-Object byte[] $plen
    if ($plen -gt 0) { [Array]::Copy($buf, $off, $payload, 0, $plen) }

    if ($masked) {
        for ($i = 0; $i -lt $plen; $i++) {
            $payload[$i] = $payload[$i] -bxor $buf[$maskOff + ($i % 4)]
        }
    }

    $rest = $client.Len - $off - $plen
    if ($rest -gt 0) { [Array]::Copy($buf, ($off + $plen), $buf, 0, $rest) }
    $client.Len = $rest

    return @{ Op = $opcode; Payload = $payload }
}

# -------------------------------------------------------------
#  HTTP 请求
# -------------------------------------------------------------
function Handle-Http($client, [string]$headerText) {
    $lines = $headerText -split "`r`n"
    $parts = $lines[0] -split ' '
    if ($parts.Length -lt 3) {
        Send-Http $client 400 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Bad Request'))
        return
    }
    $method = $parts[0]
    $rawUrl = $parts[1]

    $isUpgrade = $false
    $wsKey = ''
    foreach ($ln in $lines) {
        if ($ln -match '^\s*Upgrade\s*:\s*websocket\s*$') { $isUpgrade = $true }
        if ($ln -match '^\s*Sec-WebSocket-Key\s*:') { $wsKey = ($ln -split ':', 2)[1].Trim() }
    }

    if ($isUpgrade) {
        if ([string]::IsNullOrEmpty($wsKey)) {
            Send-Http $client 400 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Bad Request'))
            return
        }
        $sha1 = [System.Security.Cryptography.SHA1]::Create()
        $hash = $sha1.ComputeHash([System.Text.Encoding]::ASCII.GetBytes($wsKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'))
        $accept = [Convert]::ToBase64String($hash)
        $resp = "HTTP/1.1 101 Switching Protocols`r`n" +
                "Upgrade: websocket`r`n" +
                "Connection: Upgrade`r`n" +
                "Sec-WebSocket-Accept: $accept`r`n`r`n"
        Send-All $client ([System.Text.Encoding]::ASCII.GetBytes($resp))
        $client.Ws = $true
        return
    }

    if ($method -ne 'GET' -and $method -ne 'HEAD') {
        Send-Http $client 405 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Method Not Allowed'))
        return
    }

    $urlPath = $rawUrl
    $qi = $urlPath.IndexOf('?')
    if ($qi -ge 0) { $urlPath = $urlPath.Substring(0, $qi) }
    try { $urlPath = [System.Uri]::UnescapeDataString($urlPath) } catch { }

    if ($urlPath -eq '/api/net') {
        $ips = ''
        foreach ($ip in $script:LanIps) {
            if ($ips.Length -gt 0) { $ips = $ips + ',' }
            $ips = $ips + '"' + $ip + '"'
        }
        $main = '127.0.0.1'
        if ($script:LanIps.Count -gt 0) { $main = $script:LanIps[0] }
        $json = '{"port":' + $script:Port + ',"ip":"' + $main + '","ips":[' + $ips + ']}'
        Send-Http $client 200 'application/json; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes($json))
        return
    }

    if ($urlPath -eq '/' -or $urlPath -eq '') { $urlPath = '/index.html' }
    if ($urlPath -eq '/ws') {
        Send-Http $client 400 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('WebSocket only'))
        return
    }

    $rel = $urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    $full = ''
    try {
        $full = [System.IO.Path]::GetFullPath((Join-Path $Root $rel))
    } catch {
        Send-Http $client 400 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Bad Request'))
        return
    }

    if (-not $full.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
        Send-Http $client 403 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Forbidden'))
        return
    }

    if (-not [System.IO.File]::Exists($full)) {
        Send-Http $client 404 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('404 Not Found'))
        return
    }

    $bytes = $null
    try {
        $bytes = [System.IO.File]::ReadAllBytes($full)
    } catch {
        Send-Http $client 404 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('404 Not Found'))
        return
    }

    $ext = [System.IO.Path]::GetExtension($full).ToLower()
    $type = 'application/octet-stream'
    if ($MIME.ContainsKey($ext)) { $type = $MIME[$ext] }

    if ($method -eq 'HEAD') {
        Send-Http $client 200 $type (New-Object byte[] 0)
    } else {
        Send-Http $client 200 $type $bytes
    }
}

# -------------------------------------------------------------
#  控制台显示
# -------------------------------------------------------------
function Set-Event([string]$text) {
    $script:LastEvent = $text
    Update-Status
}

function Update-Status {
    if ($script:StatusRow -lt 0) { return }
    try {
        $saved = [Console]::CursorTop
        $online = 0
        foreach ($c in $script:Clients.Values) {
            if ($c.Ws -and -not $c.Closed) { $online = $online + 1 }
        }
        $line = '  [ 在线 ' + $online + ' 人 ｜ 房间 ' + $script:Rooms.Count + ' 个 ]  ' + $script:LastEvent
        if ($line.Length -gt 68) { $line = $line.Substring(0, 68) }
        [Console]::SetCursorPosition(0, $script:StatusRow)
        Write-Host $line.PadRight(70) -NoNewline -ForegroundColor DarkCyan
        [Console]::SetCursorPosition(0, $saved)
    } catch { }
}

# -------------------------------------------------------------
#  网络信息
# -------------------------------------------------------------
function Get-LanIps {
    $cands = @()
    try {
        $nics = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()
    } catch { return @() }

    foreach ($ni in $nics) {
        if ($ni.OperationalStatus -ne [System.Net.NetworkInformation.OperationalStatus]::Up) { continue }
        if ($ni.NetworkInterfaceType -eq [System.Net.NetworkInformation.NetworkInterfaceType]::Loopback) { continue }
        $label = ($ni.Name + ' ' + $ni.Description)
        $virtual = $label -match 'VMware|VirtualBox|Hyper-V|vEthernet|Loopback|TAP-|Tunn|Bluetooth|Npcap|ZeroTier|Tailscale|WSL|Docker|VPN'
        $hasGw = $false
        try {
            foreach ($g in $ni.GetIPProperties().GatewayAddresses) {
                if ($null -ne $g.Address -and $g.Address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork) { $hasGw = $true }
            }
        } catch { }
        try {
            foreach ($ua in $ni.GetIPProperties().UnicastAddresses) {
                if ($ua.Address.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) { continue }
                $ip = $ua.Address.ToString()
                if ($ip -like '127.*' -or $ip -like '169.254.*') { continue }
                $score = 0
                if ($ip -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)') { $score = $score + 50 }
                if ($hasGw) { $score = $score + 100 }
                if ($virtual) { $score = $score - 200 }
                $cands += [pscustomobject]@{ Ip = $ip; Score = $score }
            }
        } catch { }
    }
    if ($cands.Count -eq 0) { return @() }
    $sorted = @($cands | Sort-Object -Property Score -Descending)
    $out = @()
    foreach ($x in $sorted) {
        if ($out -notcontains $x.Ip) { $out = $out + $x.Ip }
    }
    return @($out)
}

# -------------------------------------------------------------
#  启动
# -------------------------------------------------------------
$script:LanIps = @(Get-LanIps)

$listener = $null
$portList = @(8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090)
foreach ($p in $portList) {
    try {
        $l = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Any), $p
        $l.Start(128)
        $listener = $l
        $script:Port = $p
        break
    } catch { }
}

if ($null -eq $listener) {
    Write-Host ''
    Write-Host '  启动失败：8080-8090 端口都被占用了。' -ForegroundColor Red
    Write-Host '  请关闭占用端口的程序后重试。' -ForegroundColor Red
    Write-Host ''
    Write-Host '  按任意键退出...'
    try { [void][Console]::ReadKey($true) } catch { }
    exit 1
}

$mainIp = '127.0.0.1'
if ($script:LanIps.Count -gt 0) { $mainIp = $script:LanIps[0] }
$gameUrl = 'http://' + $mainIp + ':' + $script:Port

try { $Host.UI.RawUI.WindowTitle = '坦克动荡 · 局域网服务器（关闭窗口即关闭服务器）' } catch { }
try {
    $raw = $Host.UI.RawUI
    if ($raw.WindowSize.Width -lt 78) {
        $raw.BufferSize = New-Object System.Management.Automation.Host.Size (78, 500)
        $raw.WindowSize = New-Object System.Management.Automation.Host.Size (78, 26)
    }
} catch { }

if ($env:TANK_NO_CLEAR -ne '1') { try { Clear-Host } catch { } }

Write-Host ''
Write-Host '  坦克动荡  ·  局域网对战' -ForegroundColor Yellow
Write-Host '  ============================================================' -ForegroundColor DarkYellow
Write-Host ''
Write-Host '  服务器开启中...' -ForegroundColor Green
Write-Host ('  ' + $gameUrl) -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ''
if ($script:LanIps.Count -gt 1) {
    Write-Host '  其他网卡地址（如果上面那个打不开，可以试试）：' -ForegroundColor DarkGray
    for ($i = 1; $i -lt $script:LanIps.Count; $i++) {
        Write-Host ('      http://' + $script:LanIps[$i] + ':' + $script:Port) -ForegroundColor DarkGray
    }
    Write-Host ''
}
if ($script:LanIps.Count -eq 0) {
    Write-Host '  （没有检测到局域网 IP，请先连上同一个 Wi-Fi 或有线网络）' -ForegroundColor DarkYellow
    Write-Host ''
}
Write-Host '  ------------------------------------------------------------' -ForegroundColor DarkGray
Write-Host '  同一 Wi-Fi 下的电脑 / 手机，用浏览器打开上面这个网址即可进入游戏' -ForegroundColor Gray
Write-Host '  本机要玩也一样：直接在浏览器里打开这个网址' -ForegroundColor Gray
Write-Host '  · 一人点「创建房间」，其他人输入 4 位房间码「加入房间」' -ForegroundColor Gray
Write-Host '  · 建房时可选 2 人对战 或 3 人对战（三人是专属地图）' -ForegroundColor Gray
Write-Host '  · Windows 弹出防火墙提示时，请选「允许访问」' -ForegroundColor Gray
Write-Host '  · 关闭这个窗口，服务器就会关闭' -ForegroundColor Gray
Write-Host '  ============================================================' -ForegroundColor DarkGray
Write-Host ''
$script:StatusRow = -1
try { $script:StatusRow = [Console]::CursorTop } catch { }
Write-Host ('  [ 在线 0 人 ｜ 房间 0 个 ]  ' + $script:LastEvent).PadRight(70) -NoNewline -ForegroundColor DarkCyan
Write-Host ''
Write-Host ''

# -------------------------------------------------------------
#  主循环（单线程非阻塞轮询）
# -------------------------------------------------------------
$lastSweep = [DateTime]::UtcNow
$busyRounds = 0

while ($true) {
    $busy = $false
    try {
        # 1) 接受新连接
        while ($listener.Pending()) {
            $tcp = $listener.AcceptTcpClient()
            $tcp.NoDelay = $true
            $id = $script:NextId
            $script:NextId = $id + 1
            $script:Clients[$id] = @{
                Id       = $id
                Tcp      = $tcp
                Sock     = $tcp.Client
                Buf      = (New-Object byte[] 8192)
                Len      = 0
                Ws       = $false
                HttpDone = $false
                Room     = $null
                Side     = -1
                Closed   = $false
                Last     = [DateTime]::UtcNow
            }
            $busy = $true
        }

        # 2) 逐个处理数据
        foreach ($id in @($script:Clients.Keys)) {
            $c = $script:Clients[$id]
            if ($null -eq $c -or $c.Closed) { continue }

            try {
                $avail = $c.Sock.Available
            } catch {
                Close-Client $c
                continue
            }
            if ($avail -le 0) { continue }

            try {
                $tmp = New-Object byte[] $avail
                $read = $c.Sock.Receive($tmp)
            } catch {
                Close-Client $c
                continue
            }
            if ($read -le 0) { Close-Client $c; continue }

            Append-Buf $c $tmp $read
            $c.Last = [DateTime]::UtcNow
            $busy = $true

            # 还没完成 HTTP 握手
            if (-not $c.HttpDone) {
                $text = [System.Text.Encoding]::ASCII.GetString($c.Buf, 0, $c.Len)
                $idx = $text.IndexOf("`r`n`r`n")
                if ($idx -lt 0) {
                    if ($c.Len -gt 32768) { Close-Client $c }
                    continue
                }
                $end = $idx + 4
                $headerText = $text.Substring(0, $end)
                $rest = $c.Len - $end
                if ($rest -gt 0) { [Array]::Copy($c.Buf, $end, $c.Buf, 0, $rest) }
                $c.Len = $rest
                $c.HttpDone = $true
                Handle-Http $c $headerText
                if ($c.Closed) { continue }
                if (-not $c.Ws) { continue }
                Set-Event '新设备已连上'
            }

            # WebSocket 帧
            $guard = 0
            while (-not $c.Closed -and $guard -lt 300) {
                $guard = $guard + 1
                $frame = Read-WsFrame $c
                if ($null -eq $frame) { break }
                if ($frame -eq 'too-big') { Close-Client $c; break }

                $op = $frame.Op
                if ($op -eq 0x1) {
                    $msg = [System.Text.Encoding]::UTF8.GetString($frame.Payload)
                    try { Handle-Message $c $msg } catch { }
                } elseif ($op -eq 0x8) {
                    Send-Frame $c 0x8 (New-Object byte[] 0)
                    Close-Client $c
                    break
                } elseif ($op -eq 0x9) {
                    Send-Frame $c 0xA $frame.Payload
                }
            }
        }

        # 3) 定期清理僵死连接
        $now = [DateTime]::UtcNow
        if (($now - $lastSweep).TotalSeconds -ge 5) {
            $lastSweep = $now
            foreach ($id in @($script:Clients.Keys)) {
                $c = $script:Clients[$id]
                if ($null -eq $c) { continue }
                if (($now - $c.Last).TotalSeconds -gt 150) { Close-Client $c }
            }
            Update-Status
        }
    } catch {
        # 单次异常不影响整体服务
        if ($script:Debug) { Write-Host ('  [debug] ' + $_.Exception.Message) -ForegroundColor DarkRed }
    }

    if ($busy) {
        $busyRounds = $busyRounds + 1
        if ($busyRounds -gt 20) {
            $busyRounds = 0
            Start-Sleep -Milliseconds 1
        }
    } else {
        $busyRounds = 0
        Start-Sleep -Milliseconds 3
    }
}
