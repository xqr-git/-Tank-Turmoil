/* =========================================================
 * 坦克动荡 —— 局域网联机服务器（零依赖，只用 Node 内置模块）
 *
 * 职责：
 *   1. 静态文件服务（index.html / game.js / net.js / lobby.js …）
 *   2. 极简 WebSocket 服务（RFC 6455 握手 + 文本帧解析）
 *   3. 房间管理：创建 / 加入 / 双向转发
 *
 * 启动： node server.js      然后浏览器打开 http://<本机IP>:8080
 * 端口： 默认 8080，可用环境变量 PORT 覆盖
 * ========================================================= */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

/* ---------------------------------------------------------
 * 1. 静态文件
 * ------------------------------------------------------- */
const server = http.createServer(function (req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end('Method Not Allowed');
    return;
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (e) {
    res.writeHead(400).end('Bad Request');
    return;
  }

  // 给大厅页用：返回本机局域网地址，方便手机直接输入
  if (urlPath === '/api/net') {
    const ips = lanAddresses();
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify({ port: PORT, ip: ips[0] || '127.0.0.1', ips: ips }));
    return;
  }

  if (urlPath === '/') urlPath = '/index.html';
  if (urlPath === '/ws') { res.writeHead(400).end('WebSocket only'); return; }

  const filePath = path.join(ROOT, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Not Found');
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': 'no-cache',
      'Content-Length': data.length
    });
    if (req.method === 'HEAD') res.end();
    else res.end(data);
  });
});

/* ---------------------------------------------------------
 * 2. WebSocket 帧编解码
 * ------------------------------------------------------- */
function encodeFrame(opcode, payload) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload), 'utf8');
  const len = body.length;
  let header;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeUInt32BE(Math.floor(len / 4294967296), 2);
    header.writeUInt32BE(len >>> 0, 6);
  }

  header[0] = 0x80 | opcode;   // FIN + opcode
  return Buffer.concat([header, body]);
}

/* ---------------------------------------------------------
 * 3. 房间（最多 3 人：房主 + 两位访客）
 * ------------------------------------------------------- */
const rooms = new Map();          // code -> { max, clients: [Client|null, ...] }
const clients = new Set();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode() {
  for (let attempt = 0; attempt < 200; attempt++) {
    let code = '';
    const bytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
    if (!rooms.has(code)) return code;
  }
  return 'R' + Date.now().toString(36).slice(-3).toUpperCase();
}

// 房间里除了自己以外的所有连接
function othersOf(client) {
  const room = client.room && rooms.get(client.room);
  if (!room) return [];
  return room.clients.filter(function (c) { return c && c !== client; });
}

function roomCount(room) {
  return room.clients.filter(Boolean).length;
}

function broadcast(room, except, obj) {
  room.clients.forEach(function (c) {
    if (c && c !== except) sendJSON(c, obj);
  });
}

function sendJSON(client, obj) {
  if (!client || client.closed) return;
  try {
    client.socket.write(encodeFrame(0x1, JSON.stringify(obj)));
  } catch (e) {
    /* 忽略写失败，close 事件里会清理 */
  }
}

function leaveRoom(client, notifyPeer) {
  const code = client.room;
  if (!code) return;
  const room = rooms.get(code);
  client.room = null;
  if (!room) return;

  const side = client.side;
  room.clients[side] = null;

  if (notifyPeer) {
    broadcast(room, null, { t: 'peerleft', side: side, n: roomCount(room) });
  }

  if (roomCount(room) === 0) rooms.delete(code);
}

function handleMessage(client, msg) {
  if (!msg || typeof msg !== 'object') return;

  switch (msg.t) {
    case 'create': {
      if (client.room) return;
      const max = msg.max === 3 ? 3 : 2;
      const code = makeCode();
      client.side = 0;
      rooms.set(code, { max: max, clients: [client, null, null] });
      client.room = code;
      sendJSON(client, { t: 'created', code: code, side: 0, max: max });
      console.log('[room] ' + code + ' 已创建（' + max + ' 人）');
      return;
    }

    case 'join': {
      const code = String(msg.code || '').toUpperCase();
      const room = rooms.get(code);
      if (!room) { sendJSON(client, { t: 'err', msg: '房间不存在或已关闭' }); return; }
      if (client.room === code) { sendJSON(client, { t: 'err', msg: '不能加入自己的房间' }); return; }

      let slot = -1;
      for (let i = 1; i < room.max; i++) {
        if (!room.clients[i]) { slot = i; break; }
      }
      if (slot < 0) { sendJSON(client, { t: 'err', msg: '房间已满' }); return; }

      room.clients[slot] = client;
      client.room = code;
      client.side = slot;
      sendJSON(client, { t: 'joined', code: code, side: slot, max: room.max });
      broadcast(room, client, { t: 'peer', n: roomCount(room), max: room.max, side: slot });
      console.log('[room] ' + code + ' 加入座位 ' + slot + '（' + roomCount(room) + '/' + room.max + '）');
      return;
    }

    case 'ping':
      sendJSON(client, { t: 'pong' });
      return;

    case 'bye':
      leaveRoom(client, true);
      return;

    default: {
      // 游戏消息：input / act 只发给房主；snap / start 等发给其他所有人
      const toHostOnly = (msg.t === 'input' || msg.t === 'act');
      const stamped = Object.assign({}, msg, { side: client.side });
      if (toHostOnly) {
        const room = rooms.get(client.room);
        if (room && room.clients[0]) sendJSON(room.clients[0], stamped);
      } else {
        const room = client.room && rooms.get(client.room);
        if (room) broadcast(room, client, stamped);
      }
    }
  }
}

/* ---------------------------------------------------------
 * 4. 连接生命周期
 * ------------------------------------------------------- */
class Client {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.room = null;
    this.side = -1;
    this.closed = false;
    clients.add(this);

    socket.on('data', (chunk) => this.onData(chunk));
    socket.on('close', () => this.destroy());
    socket.on('error', () => this.destroy());
    socket.setNoDelay(true);
  }

  onData(chunk) {
    this.buffer = this.buffer.length ? Buffer.concat([this.buffer, chunk]) : chunk;
    if (this.buffer.length > 2 * 1024 * 1024) { this.destroy(); return; }

    while (!this.closed) {
      const frame = this.readFrame();
      if (!frame) break;

      if (frame.opcode === 0x1) {
        let msg = null;
        try { msg = JSON.parse(frame.payload.toString('utf8')); } catch (e) { msg = null; }
        if (msg) handleMessage(this, msg);
      } else if (frame.opcode === 0x8) {
        try { this.socket.write(encodeFrame(0x8, Buffer.alloc(0))); } catch (e) { /* ignore */ }
        this.destroy();
      } else if (frame.opcode === 0x9) {
        try { this.socket.write(encodeFrame(0xA, frame.payload)); } catch (e) { /* ignore */ }
      }
      // 0xA(pong) 与其它帧类型忽略；本项目不协商压缩扩展，故无续帧拼接
    }
  }

  readFrame() {
    const buf = this.buffer;
    if (buf.length < 2) return null;

    const b0 = buf[0];
    const b1 = buf[1];
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let len = b1 & 0x7f;
    let offset = 2;

    if (len === 126) {
      if (buf.length < 4) return null;
      len = buf.readUInt16BE(2);
      offset = 4;
    } else if (len === 127) {
      if (buf.length < 10) return null;
      len = buf.readUInt32BE(2) * 4294967296 + buf.readUInt32BE(6);
      offset = 10;
    }

    let mask = null;
    if (masked) {
      if (buf.length < offset + 4) return null;
      mask = buf.slice(offset, offset + 4);
      offset += 4;
    }

    if (buf.length < offset + len) return null;

    const payload = Buffer.from(buf.slice(offset, offset + len));
    if (mask) {
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
    }

    this.buffer = buf.slice(offset + len);
    return { opcode: opcode, payload: payload };
  }

  destroy() {
    if (this.closed) return;
    this.closed = true;
    leaveRoom(this, true);
    clients.delete(this);
    try { this.socket.destroy(); } catch (e) { /* ignore */ }
  }
}

server.on('upgrade', function (req, socket) {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
  );

  new Client(socket);
});

/* ---------------------------------------------------------
 * 5. 启动
 * ------------------------------------------------------- */
function lanAddresses() {
  const out = [];
  const nets = os.networkInterfaces();
  Object.keys(nets).forEach(function (name) {
    (nets[name] || []).forEach(function (net) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    });
  });
  return out;
}

server.listen(PORT, HOST, function () {
  const addrs = lanAddresses();
  console.log('');
  console.log('  坦克动荡 · 局域网联机服务已启动');
  console.log('  ------------------------------------------');
  console.log('  本机打开：   http://localhost:' + PORT);
  addrs.forEach(function (ip) {
    console.log('  同一局域网： http://' + ip + ':' + PORT);
  });
  if (!addrs.length) {
    console.log('  （未检测到局域网 IP，请确认已连接 WiFi / 网线）');
  }
  console.log('');
  console.log('  两名玩家打开同一地址 → 一人「创建房间」，其余人输入房间码「加入房间」');
  console.log('  建房时可选 2 人对战或 3 人对战（三人为独立地图）');
  console.log('  按 Ctrl+C 结束服务');
  console.log('');
});

module.exports = { server: server, rooms: rooms };
