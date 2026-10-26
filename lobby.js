/* =========================================================
 * 坦克动荡 —— 大厅：模式选择（本地 / 局域网联机）
 * 依赖：net.js（NET）、game.js（TANK_GAME）
 * ========================================================= */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  const lobby = $('lobby');
  const panelSelect = $('panelSelect');
  const lanBox = $('lanBox');
  const statusEl = $('lanStatus');
  const codeWrap = $('lanCode');
  const codeText = $('codeText');
  const roomInput = $('roomInput');
  const btnCreate = $('btnCreate');
  const btnJoin = $('btnJoin');
  const btnBack = $('btnBack');
  const hintEl = $('lobbyHint');
  const modeSub = $('modeSub');
  const footA = $('footA');
  const footB = $('footB');
  const footC = $('footC');
  const lanAddr = $('lanAddr');
  const localDesc = $('localDesc');
  const lanDesc = $('lanDesc');
  const sizePick = $('sizePick');
  const btnStartNow = $('btnStartNow');

  if (!lobby) return;

  let phase = 'select';     // select | lan | waitHost | waitGuest | playing
  let isHost = false;
  let wantMax = 2;          // 建房时选的房间人数
  let roomMax = 2;          // 服务器确认的房间人数
  let roomCount = 1;        // 房间里已有的人数（含自己）

  const SIDE_NAMES = ['红方', '蓝方', '绿方'];

  // 手机 / 平板：靠屏幕摇杆操控（双人游戏在手机上是上下两条操作键）
  const IS_TOUCH = (function () {
    try {
      if (window.matchMedia) {
        if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return true;
        if (window.matchMedia('(pointer: coarse)').matches) return true;
      }
      const t = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
      return t && Math.min(window.screen.width || 9999, window.screen.height || 9999) <= 820;
    } catch (e) { return false; }
  })();

  function applyDeviceCopy() {
    if (!IS_TOUCH) return;
    if (localDesc) localDesc.innerHTML = '两人共用一张地图<br />上下各一条屏幕操作键（推荐平板）';
    if (lanDesc) lanDesc.innerHTML = '2~3 台设备连同一 WiFi<br />手机用屏幕摇杆，电脑用键盘';
  }

  /* 顶部副标题 + 底部按键提示：联机时双方键位一致，且没有暂停 */
  function applyModeChrome(kind, seat, total) {
    const n = total || roomMax || 2;
    if (kind === 'host') {
      modeSub.textContent = 'Tank Turmoil · LAN ' + n + 'P · 你是红方（主机）';
      footA.innerHTML = '<span class="dot a"></span>W/S 行驶 · A/D 转向 · 空格开火';
      footB.innerHTML = n === 3
        ? '<span class="dot b"></span>另外两位是蓝方 / 绿方 · 同样的键位'
        : '<span class="dot b"></span>对手蓝方 · 同样是 W/S + A/D · 空格开火';
    } else if (kind === 'guest') {
      const s = (seat === 2 ? 2 : 1);
      const cls = s === 2 ? 'dot c' : 'dot b';
      modeSub.textContent = 'Tank Turmoil · LAN ' + n + 'P · 你是' + SIDE_NAMES[s] + '（访客）';
      footA.innerHTML = '<span class="dot a"></span>W/S 行驶 · A/D 转向 · 空格开火';
      footB.innerHTML = '<span class="' + cls + '"></span>你是' + SIDE_NAMES[s] + ' · W/S 行驶 · A/D 转向 · 空格开火 · K 隐身';
    } else if (kind === 'solo') {
      modeSub.textContent = 'Tank Turmoil · Solo vs CPU';
      footA.innerHTML = '<span class="dot a"></span>你是红方 · W/S 行驶 · A/D 转向 · 空格开火';
      footB.innerHTML = '<span class="dot b"></span>蓝方是电脑 · 会算反弹弹道、侧身躲子弹';
    } else {
      modeSub.textContent = 'Tank Turmoil · 双人游戏 1v1';
      if (IS_TOUCH) {
        footA.innerHTML = '<span class="dot a"></span>红方 · 下端「红方操控键」· 左下摇杆 + 右下开火';
        footB.innerHTML = '<span class="dot b"></span>蓝方 · 上端「蓝方操控键」· 右上摇杆 + 左上开火';
      } else {
        footA.innerHTML = '<span class="dot a"></span>W/S 行驶 · A/D 转向 · 空格开火';
        footB.innerHTML = '<span class="dot b"></span>↑/↓ 行驶 · ←/→ 转向 · / 开火';
      }
    }
    if (footC) {
      footC.innerHTML = (kind === 'local' || kind === 'solo')
        ? '<kbd>P</kbd> 暂停 · <kbd>R</kbd> 重开并清空比分 · <kbd>M</kbd> 静音'
        : '<kbd>Esc</kbd> 退出房间 · <kbd>M</kbd> 静音 · 联机不设暂停';
    }

    // 触屏说明：单人模式没有隐身，武器也只有激光和普通弹
    const tw = document.getElementById('touchWeapons');
    const ti = document.getElementById('touchInvisTip');
    if (tw) {
      tw.textContent = kind === 'solo'
        ? '按住使用手上的武器（激光 / 普通弹）'
        : '按住使用手上的武器（激光 / 地雷 / 霰弹 / 电子炮 / 普通弹）';
    }
    if (ti) ti.style.display = (kind === 'solo' || kind === 'local') ? 'none' : '';
  }

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.setAttribute('data-kind', kind || '');
  }

  function showSelect() {
    panelSelect.hidden = false;
    lanBox.hidden = true;
    phase = 'select';
    hintEl.innerHTML = IS_TOUCH
      ? '单人模式：左下 <b>摇杆</b> 推向哪就朝哪开（推得越远越快），右下 <b>开火</b>；双人游戏则上下各一套，共用中间地图'
      : '单人模式：<kbd>WASD</kbd> / <kbd>方向键</kbd> 开车 · <kbd>空格</kbd> 开火（人机局没有隐身）；双人游戏则左右分键';
  }

  function showLan() {
    panelSelect.hidden = true;
    lanBox.hidden = false;
    phase = 'lan';
    hintEl.innerHTML = IS_TOUCH
      ? '手机：输房间码加入，用屏幕摇杆操控；点右上角 <b>主界面</b> 可切换模式'
      : '联机时你只控制自己那一方；<kbd>Esc</kbd> 退出联机，或点右上角 <b>主界面</b> 回到模式选择';
    loadLanAddr();
    if (!codeWrap.hidden) return;
    setStatus('一人「创建房间」，另一人输入 4 位房间码「加入房间」');
  }

  // 把服务器所在局域网地址显示出来，方便手机浏览器直接输入
  function loadLanAddr() {
    if (!lanAddr || lanAddr.dataset.loaded === '1') return;
    if (location.protocol === 'file:') return;
    fetch('/api/net').then(function (r) { return r.json(); }).then(function (d) {
      const host = d && d.ip ? d.ip : (d && d.ips && d.ips[0]);
      if (!host) return;
      lanAddr.dataset.loaded = '1';
      lanAddr.innerHTML = '手机 / 另一台设备：浏览器打开 <b>http://' + host + ':' + (d.port || location.port || 80) + '</b>';
      lanAddr.hidden = false;
    }).catch(function () { /* 没有 /api/net（静态托管）时静默跳过 */ });
  }

  function showLobby() {
    lobby.hidden = false;
    document.body.classList.add('in-lobby');
  }

  function hideLobby() {
    lobby.hidden = true;
    document.body.classList.remove('in-lobby');
  }

  // 退出联机并把后台游戏恢复成干净的本地开局（大厅遮住它）
  function resetNetUi() {
    if (window.NET) NET.leave();
    isHost = false;
    roomMax = 2;
    roomCount = 1;
    codeWrap.hidden = true;
    roomInput.value = '';
    btnCreate.disabled = false;
    btnJoin.disabled = false;
    if (btnStartNow) btnStartNow.hidden = true;
    roomInput.blur();
    applyModeChrome('local');
    if (window.TANK_GAME) TANK_GAME.startLocal();
    showLobby();
  }

  // 返回主界面：停在「模式选择」
  function backToMenu() {
    resetNetUi();
    showSelect();
    setStatus('');
  }

  // 退出联机：停在「局域网联机」面板，方便重新建房 / 加入
  function exitToLan(message, kind) {
    resetNetUi();
    showLan();
    setStatus(message || '已退出联机，可重新创建或加入房间', kind);
  }

  /* ---------------- 单人模式（人机对战） ---------------- */
  const btnSolo = $('btnSolo');
  if (btnSolo) {
    btnSolo.addEventListener('click', function () {
      if (window.NET) NET.leave();
      isHost = false;
      applyModeChrome('solo');
      hideLobby();
      TANK_GAME.startSolo();
    });
  }

  /* ---------------- 本地模式 ---------------- */
  $('btnLocal').addEventListener('click', function () {
    if (window.NET) NET.leave();
    isHost = false;
    applyModeChrome('local');
    hideLobby();
    TANK_GAME.startLocal();
  });

  /* ---------------- 局域网联机 ---------------- */
  $('btnLan').addEventListener('click', function () {
    showLan();
    if (location.protocol === 'file:') {
      setStatus('当前是本地文件打开。请先运行 node server.js，再用 http://<本机IP>:8080 打开本页。', 'error');
    }
  });

  /* 人数选择：2 人 / 3 人 */
  if (sizePick) {
    sizePick.addEventListener('click', function (e) {
      const btn = e.target.closest ? e.target.closest('.size-btn') : null;
      if (!btn) return;
      wantMax = btn.getAttribute('data-max') === '3' ? 3 : 2;
      const all = sizePick.querySelectorAll('.size-btn');
      for (let i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i] === btn);
    });
  }

  btnBack.addEventListener('click', function () {
    backToMenu();
  });

  btnCreate.addEventListener('click', function () {
    setStatus('正在连接服务器…');
    btnCreate.disabled = true;
    NET.createRoom(wantMax).then(function () {
      // 房间信息通过 onRoom 回调返回
    }).catch(function (err) {
      btnCreate.disabled = false;
      setStatus(err.message || '连接失败', 'error');
    });
  });

  function doJoin() {
    const code = (roomInput.value || '').trim().toUpperCase();
    if (code.length !== 4) {
      setStatus('请输入 4 位房间码', 'error');
      roomInput.focus();
      return;
    }
    setStatus('正在加入房间…');
    btnJoin.disabled = true;
    NET.joinRoom(code).catch(function (err) {
      btnJoin.disabled = false;
      setStatus(err.message || '加入失败', 'error');
    });
  }

  btnJoin.addEventListener('click', doJoin);
  roomInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); doJoin(); }
  });
  roomInput.addEventListener('input', function () {
    roomInput.value = roomInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  });

  // 主机开局：n = 本局人数（到齐了就是房间人数，也可以少人开打）
  function startAsHost(n) {
    const size = n === 3 ? 3 : 2;
    roomMax = size;
    setStatus(size === 3 ? '三位玩家到齐，开始对战！' : '对手已连接，开始对战！', 'ok');
    NET.send({ t: 'start', n: size });
    phase = 'playing';
    applyModeChrome('host', 0, size);
    hideLobby();
    TANK_GAME.startHost(NET.send, size);
  }

  if (btnStartNow) {
    btnStartNow.addEventListener('click', function () {
      if (!isHost) return;
      startAsHost(roomCount >= 2 ? roomCount : 2);
    });
  }

  /* ---------------- 网络事件 ---------------- */
  NET.setHandlers({
    onRoom: function (info) {
      isHost = info.side === 0;
      roomMax = info.max || 2;
      roomCount = 1;
      btnCreate.disabled = false;
      btnJoin.disabled = false;

      if (isHost) {
        phase = 'waitGuest';
        codeWrap.hidden = false;
        codeText.textContent = info.code;
        setStatus(roomMax === 3
          ? '房间已创建（3 人对战），等待 2 位玩家加入…（把房间码告诉他们）'
          : '房间已创建，等待对手加入…（把房间码告诉对方）', 'ok');
      } else {
        phase = 'waitHost';
        codeWrap.hidden = true;
        setStatus('已加入房间（' + roomMax + ' 人对战），等待主机开始…', 'ok');
      }
    },

    // 有人进来了 / 座位上人变了
    onPeer: function (info) {
      if (!isHost) return;
      const n = info && info.n ? info.n : 2;
      const max = (info && info.max) || roomMax;
      roomCount = n;

      if (n >= max) {
        startAsHost(max);
        return;
      }
      setStatus('已有 ' + n + '/' + max + ' 人，还差 ' + (max - n) + ' 人…', 'ok');
      if (btnStartNow) {
        btnStartNow.hidden = false;
        btnStartNow.textContent = '就 ' + n + ' 人开打';
      }
    },

    onMessage: function (msg) {
      if (!msg) return;
      if (msg.t === 'start') {
        if (!isHost) {
          const n = msg.n === 3 ? 3 : 2;
          roomMax = n;
          phase = 'playing';
          applyModeChrome('guest', NET.getSide(), n);
          hideLobby();
          TANK_GAME.startGuest(NET.send, NET.getSide(), n);
        }
        return;
      }
      if (msg.t === 'pong') return;
      TANK_GAME.receive(msg);
    },

    onPeerLeft: function (info) {
      if (phase !== 'playing') {
        // 还没开局就掉线：回到等待态
        roomCount = (info && info.n) || 1;
        codeWrap.hidden = isHost ? false : true;
        setStatus('有玩家离开了，等待中…（' + roomCount + '/' + roomMax + ' 人）', 'error');
        phase = isHost ? 'waitGuest' : 'lan';
        if (btnStartNow) btnStartNow.hidden = roomCount < 2;
        return;
      }
      exitToLan('有玩家离开房间，对战结束。可重新创建或加入房间', 'error');
    },

    onStatus: function (state) {
      if (state === 'offline' && phase !== 'playing' && phase !== 'select') {
        setStatus('与服务器断开连接，请确认 node server.js 仍在运行', 'error');
      }
    },

    onError: function (msg) {
      btnCreate.disabled = false;
      btnJoin.disabled = false;
      setStatus(msg, 'error');
    }
  });

  /* 联机中按 Esc 返回大厅 */
  window.addEventListener('keydown', function (e) {
    if (e.code !== 'Escape') return;
    if (lobby.hidden && phase === 'playing') {
      e.preventDefault();
      exitToLan('已退出联机，可重新创建或加入房间');
    }
  });

  /* 游戏内「主界面」按钮 / 菜单面板 → 回到模式选择 */
  if (window.TANK_GAME && TANK_GAME.setExitHandler) {
    TANK_GAME.setExitHandler(function () {
      backToMenu();
    });
  }

  /* 初始：显示模式选择 */
  applyDeviceCopy();
  showSelect();
  showLobby();
})();
