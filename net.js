/* =========================================================
 * 坦克动荡 —— 局域网联机客户端
 * 与 server.js 的 WebSocket 服务通信：
 *   房间协议： create / join / peer / peerleft / err
 *   游戏消息： input（访客上行）、snap（主机下行）、start / bye
 * 本文件只在选择“局域网联机”时才建立连接，本地模式不依赖它。
 * ========================================================= */
(function () {
  'use strict';

  const CONTROL = { created: 1, joined: 1, peer: 1, peerleft: 1, err: 1 };
  const PING_MS = 12000;

  let ws = null;
  let code = null;
  let side = -1;
  let max = 2;              // 房间人数上限：2 或 3
  let opened = false;
  let leaving = false;
  let pingTimer = null;

  const handlers = {
    onStatus: function () {},
    onRoom: function () {},
    onPeer: function () {},
    onPeerLeft: function () {},
    onMessage: function () {},
    onError: function () {}
  };

  function wsUrl() {
    if (location.protocol === 'file:') return null;
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return proto + '//' + location.host + '/ws';
  }

  function clearPing() {
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
  }

  function close() {
    clearPing();
    if (ws) {
      try { ws.onclose = null; ws.close(); } catch (e) { /* ignore */ }
    }
    ws = null;
    opened = false;
    code = null;
    side = -1;
  }

  function connect() {
    return new Promise(function (resolve, reject) {
      if (ws && ws.readyState === WebSocket.OPEN) { resolve(); return; }

      const url = wsUrl();
      if (!url) {
        reject(new Error('页面来自本地文件（file://）。请先运行 node server.js，再用 http://<本机IP>:8080 打开。'));
        return;
      }

      close();
      leaving = false;

      let socket;
      try {
        socket = new WebSocket(url);
      } catch (e) {
        reject(new Error('无法创建 WebSocket 连接'));
        return;
      }
      ws = socket;

      let settled = false;

      socket.onopen = function () {
        opened = true;
        settled = true;
        handlers.onStatus('online');
        clearPing();
        pingTimer = setInterval(function () {
          if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ t: 'ping' }));
        }, PING_MS);
        resolve();
      };

      socket.onerror = function () {
        if (!settled) {
          settled = true;
          reject(new Error('连接失败：请确认已运行 node server.js'));
        }
      };

      socket.onclose = function () {
        clearPing();
        const wasOpen = opened;
        opened = false;
        ws = null;
        handlers.onStatus('offline');
        if (wasOpen && !leaving) handlers.onPeerLeft();
      };

      socket.onmessage = function (ev) {
        let msg;
        try { msg = JSON.parse(ev.data); } catch (e) { return; }
        if (!msg || typeof msg !== 'object') return;

        if (CONTROL[msg.t]) {
          if (msg.t === 'created' || msg.t === 'joined') {
            code = msg.code;
            side = msg.side;
            max = msg.max || 2;
            handlers.onRoom({ code: code, side: side, max: max });
          } else if (msg.t === 'peer') {
            handlers.onPeer({ n: msg.n || 0, max: msg.max || max, side: msg.side });
          } else if (msg.t === 'peerleft') {
            handlers.onPeerLeft({ side: msg.side, n: msg.n });
          } else if (msg.t === 'err') {
            handlers.onError(msg.msg || '未知错误');
          }
          return;
        }

        handlers.onMessage(msg);
      };
    });
  }

  function send(obj) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(obj));
      return true;
    } catch (e) {
      return false;
    }
  }

  function createRoom(wantMax) {
    return connect().then(function () {
      send({ t: 'create', max: wantMax === 3 ? 3 : 2 });
    });
  }

  function joinRoom(target) {
    const c = String(target || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(c)) return Promise.reject(new Error('房间码是 4 位字母或数字'));
    return connect().then(function () {
      send({ t: 'join', code: c });
    });
  }

  function leave() {
    leaving = true;
    send({ t: 'bye' });
    close();
  }

  window.NET = {
    connect: connect,
    createRoom: createRoom,
    joinRoom: joinRoom,
    send: send,
    leave: leave,
    getCode: function () { return code; },
    getSide: function () { return side; },
    getMax: function () { return max; },
    isOnline: function () { return !!ws && ws.readyState === WebSocket.OPEN; },
    setHandlers: function (next) {
      for (const k in next) {
        if (typeof next[k] === 'function') handlers[k] = next[k];
      }
    }
  };
})();
