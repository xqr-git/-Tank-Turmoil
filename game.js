/* =========================================================
 * 坦克动荡 —— 坦克对战（本地双人 / 局域网 2~3 人）
 * 内容：可移动坦克 + 可反弹子弹 + 2D 迷宫地图 + 道具 + 隐身技能
 * ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
   * 1. 常量与地图
   * ------------------------------------------------------- */
  const TILE = 32;

  /* ---- 地图库：每种人数 4 张，每局结束时随机换一张 ---- */
  // '#' 墙 / '.' 空地，统一 25 列 × 17 行；spawns 是各出生点（格坐标 + 初始车头朝向）
  const MAPS_2 = [
    {
      name: '中央十字',
      spawns: [
        { c: 2, r: 8, a: 0 },
        { c: 22, r: 8, a: Math.PI }
      ],
      rows: [
        '#########################',
        '#.......................#',
        '#..##...............##..#',
        '#..##...............##..#',
        '#...........#...........#',
        '#......###.....###......#',
        '#......#.........#......#',
        '#...........#...........#',
        '#...........#...........#',
        '#...........#...........#',
        '#......#.........#......#',
        '#......###.....###......#',
        '#...........#...........#',
        '#..##...............##..#',
        '#..##...............##..#',
        '#.......................#',
        '#########################',
      ]
    },
    {
      name: '石柱阵',
      spawns: [
        { c: 2, r: 8, a: 0 },
        { c: 22, r: 8, a: Math.PI }
      ],
      rows: [
        '#########################',
        '#.......................#',
        '#...........#...........#',
        '#...##......#......##...#',
        '#...##......#......##...#',
        '#...........#...........#',
        '#.......................#',
        '#.......................#',
        '#.......####.####.......#',
        '#.......................#',
        '#.......................#',
        '#...........#...........#',
        '#...##......#......##...#',
        '#...##......#......##...#',
        '#...........#...........#',
        '#.......................#',
        '#########################',
      ]
    },
    {
      name: '双塔夹道',
      spawns: [
        { c: 2, r: 8, a: 0 },
        { c: 22, r: 8, a: Math.PI }
      ],
      rows: [
        '#########################',
        '#.......................#',
        '#......#.........#......#',
        '#......#....#....#......#',
        '#......#....#....#......#',
        '#......#....#....#......#',
        '#......#....#....#......#',
        '#.......................#',
        '#...........#...........#',
        '#...........#...........#',
        '#......#....#....#......#',
        '#......#....#....#......#',
        '#......#....#....#......#',
        '#......#....#....#......#',
        '#......#.........#......#',
        '#.......................#',
        '#########################',
      ]
    },
    {
      name: '环形堡垒',
      spawns: [
        { c: 2, r: 8, a: 0 },
        { c: 22, r: 8, a: Math.PI }
      ],
      rows: [
        '#########################',
        '#.......................#',
        '#.......................#',
        '#..##...............##..#',
        '#..##...............##..#',
        '#........###.###........#',
        '#........#.....#........#',
        '#........#.....#........#',
        '#........#.....#........#',
        '#........#.....#........#',
        '#........#.....#........#',
        '#........###.###........#',
        '#..##...............##..#',
        '#..##...............##..#',
        '#.......................#',
        '#.......................#',
        '#########################',
      ]
    }
  ];

  const MAPS_3 = [
    {
      name: '三向风车',
      spawns: [
        { c: 2, r: 8, a: 0 },
        { c: 22, r: 8, a: Math.PI },
        { c: 12, r: 14, a: -Math.PI / 2 }
      ],
      rows: [
        '#########################',
        '#.......................#',
        '#....##.....#.....##....#',
        '#....##.....#.....##....#',
        '#..........###..........#',
        '#..###.....#.#....###...#',
        '#.....#....#.#....#.....#',
        '#.....#...........#.....#',
        '#.....#....###....#.....#',
        '#.....#...........#.....#',
        '#..###.....#.#....###...#',
        '#..........###..........#',
        '#....##...........##....#',
        '#....##...........##....#',
        '#.......................#',
        '#.......................#',
        '#########################',
      ]
    },
    {
      name: '三角堡垒',
      spawns: [
        { c: 2, r: 8, a: 0 },
        { c: 22, r: 8, a: Math.PI },
        { c: 12, r: 14, a: -Math.PI / 2 }
      ],
      rows: [
        '#########################',
        '#.......................#',
        '#.......................#',
        '#.......................#',
        '#.......................#',
        '#.......####.####.......#',
        '#.......#.......#.......#',
        '#.......#.......#.......#',
        '#.......#.......#.......#',
        '#.......................#',
        '#.......####.####.......#',
        '#.......................#',
        '#.....####.....####.....#',
        '#.......................#',
        '#.......................#',
        '#.......................#',
        '#########################',
      ]
    },
    {
      name: '三分天下',
      spawns: [
        { c: 2, r: 8, a: 0 },
        { c: 22, r: 8, a: Math.PI },
        { c: 12, r: 14, a: -Math.PI / 2 }
      ],
      rows: [
        '#########################',
        '#.......................#',
        '#.......................#',
        '#....#####.....#####....#',
        '#....#.............#....#',
        '#....#.............#....#',
        '#....#.............#....#',
        '#....#.............#....#',
        '#..........###..........#',
        '#..........###..........#',
        '#.......................#',
        '#....#.............#....#',
        '#....#...##...##...#....#',
        '#....#.............#....#',
        '#.......................#',
        '#.......................#',
        '#########################',
      ]
    },
    {
      name: '回字迷宫',
      spawns: [
        { c: 2, r: 8, a: 0 },
        { c: 22, r: 8, a: Math.PI },
        { c: 12, r: 14, a: -Math.PI / 2 }
      ],
      rows: [
        '#########################',
        '#.......................#',
        '#........###.###........#',
        '#.......................#',
        '#.....#...........#.....#',
        '#.....#...........#.....#',
        '#.....#...........#.....#',
        '#.........##.##.........#',
        '#.........#...#.........#',
        '#.........##.##.........#',
        '#.......................#',
        '#.....#...........#.....#',
        '#.....#...........#.....#',
        '#.....#...........#.....#',
        '#.......................#',
        '#.......................#',
        '#########################',
      ]
    }
  ];

  let MAP = MAPS_2[0].rows;
  let MAP_NAME = MAPS_2[0].name;
  let mapIndex = 0;               // 当前用的是地图库里的第几张
  let mapRotation = true;         // 每局结束是否随机换图（测试里可以关掉）
  let needMapRoll = true;         // 下一局开始时要不要换图
  let ROWS = MAP.length;
  let COLS = MAP[0].length;
  let W = COLS * TILE;
  let H = ROWS * TILE;
  let WALL = toWall(MAP);

  function mapPack(n) { return n === 3 ? MAPS_3 : MAPS_2; }

  function toWall(rows) {
    return rows.map(function (row) {
      return row.split('').map(function (ch) { return ch === '#'; });
    });
  }

  const TANK_HALF = 13;         // 坦克碰撞盒半宽（正方形）
  const TANK_SPEED = 126;       // 前进速度 px / 秒
  const TANK_BACK_SPEED = 84;   // 倒车速度 px / 秒
  const TANK_TURN = 3.0;        // 车体转向速度 弧度 / 秒
  const TANK_TURN_STICK = 5.6;  // 摇杆模式下自动转向的速度（要追手指，比键盘快一些）
  const BULLET_SPEED = 330;     // px / 秒（反弹只改方向，速度始终不变）
  const BULLET_R = 4.5;
  const MUZZLE_OFF = TANK_HALF + 10; // 出膛位置：炮管尖端再往外一点（23px），离开车体碰撞盒
  const SELF_IMMUNE = 0.1;      // 刚出膛的这颗子弹对车主免疫 0.1 秒（只对这颗生效，别的子弹照常伤到自己）
  const SELF_DAMAGE = true;     // 超过免疫时间后，自己的跳弹仍会伤到自己（改成 false 则永不伤自己）
  const MAX_OWN_BULLETS = 4;    // 一辆坦克在地图上同时存在的自弹上限（满了就打不出，等到有子弹消失）
  const MUZZLE_FLIGHT = 20;     // 炮口前方至少要留这么长空地才开炮：否则子弹一出去就被墙弹回来，0.1 秒免疫挡不住
  const FIRE_CD = 0.35;         // 开火冷却（秒）：两次射击之间至少隔 0.35 秒
  const MAX_BOUNCE = Infinity;  // 普通子弹不限反弹次数（只受 8 秒寿命约束，撞墙永远弹）
  const BULLET_LIFE = 8;        // 子弹存活时间（秒）

  /* ---- 道具（每 ITEM_INTERVAL 秒从道具池里随机刷一个）---- */
  const LASER_SPEED = 980;      // 激光飞行速度：约普通子弹的 3 倍
  const LASER_R = 3.4;          // 激光弹丸判定半径（比子弹细一点）
  const LASER_DAMAGE = 2;       // 激光命中扣两滴血
  const LASER_LIFE = 2.4;       // 激光存活时间（秒）
  const LASER_MAX_BOUNCE = Infinity;   // 激光同样不限反弹次数
  const ITEM_INTERVAL = 15;     // 道具刷新间隔（秒）
  const ITEM_R = 11;            // 道具本体半径 / 拾取范围
  const SIGHT_LEN = 62;         // 待发射时的激光预瞄长度（短距离）
  const SIGHT_DASH = 6;         // 预瞄虚线长度

  /* ---- 护盾道具 ---- */
  const SHIELD_TIME = 8;        // 护盾持续 8 秒
  const SHIELD_BLINK_FROM = 6;  // 第 6 秒开始闪烁，第 8 秒消失

  /* ---- 地雷道具 ---- */
  const MINE_R = 10;            // 地雷半径（踩中判定）
  const MINE_SLIDE = 44;        // 从车尾吐出后滑行的极短距离
  const MINE_SLIDE_SPEED = 260; // 出膛滑行初速
  const MINE_HIDE_DELAY = 1;    // 停下后 1 秒内逐渐隐去（所有人不可见）
  const MINE_TRIGGER_DELAY = 0.5;// 坦克离开地雷后 0.5 秒引爆
  const MINE_DARTS = 30;        // 爆炸向四周均匀发射的飞镖数
  const MINE_DART_SPEED = 240;  // 飞镖速度（不可反弹）
  const MINE_DART_LIFE = 1.3;   // 飞镖存活时间
  const MINE_USES = 3;          // 一次拾取共能布置三颗

  /* ---- 霰弹枪道具 ---- */
  const SHOTGUN_PELLETS = 5;    // 一次打出 5 颗
  const SHOTGUN_SPREAD = Math.PI / 6;  // 前后共 30 度
  const SHOTGUN_SPEED = 300;
  const SHOTGUN_LIFE = 1.6;
  const SHOTGUN_USES = 3;       // 一共能发射 3 次

  /* ---- 能量电子炮道具 ---- */
  const CANNON_CHARGE = 1;        // 聚能时间：按发射键后 1 秒内炮口光线不断汇聚（期间不能移动、不能转向）
  const CANNON_BEAM_LIFE = 0.5;   // 激光持续 0.5 秒，期间由粗变细
  const CANNON_HALF_W = 13;       // 激光起始半宽（26px 粗）
  const CANNON_DAMAGE = 3;        // 命中扣 3 滴血 = 直接把满血坦克淘汰
  const CANNON_HIT_PAD = 8;       // 判定时在坦克碰撞盒外再放宽一点，斜着扫过去也能算命中

  /* ---- 隐身技能 ---- */
  const INVIS_TIME = 5;         // 隐身持续 5 秒
  const INVIS_CD = 20;          // 冷却 20 秒

  const MAX_HP = 3;
  const MAX_SIDES = 3;          // 最多三人同场（本地模式永远是两人）
  const SIDE_NAMES = ['红方', '蓝方', '绿方'];
  const AWARD_DELAY = 0.95;     // 淘汰后多久才加分（先让爆炸演完）
  const PANEL_DELAY = 1.35;     // 结算面板弹出时间（在加分之后，动画看得见）
  const ROUND_GAP = 3.2;        // 一局结束后，自动开下一局前的停顿（秒）

  const NET_HZ = 30;            // 联机快照 / 输入包频率
  const NET_INTERP = 0.045;     // 访客端渲染延迟（在两帧快照之间插值，抵消 30Hz 抖动）

  const PALETTES = [
    { main: '#ff5d5d', light: '#ff9d9d', dark: '#8d2020', barrel: '#c93a3a', glow: 'rgba(255,93,93,.5)' },
    { main: '#4d9dff', light: '#a2ceff', dark: '#1d4a8c', barrel: '#2f74c9', glow: 'rgba(77,157,255,.5)' },
    { main: '#46d98a', light: '#9df3c4', dark: '#12724a', barrel: '#2fae72', glow: 'rgba(70,217,138,.5)' }
  ];

  // 快照里压缩数值位数，省带宽（1 位小数 / 2 位小数）
  function r1(v) { return Math.round(v * 10) / 10; }
  function r2(v) { return Math.round(v * 100) / 100; }

  /* ---------------------------------------------------------
   * 2. 画布初始化
   * ------------------------------------------------------- */
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvas() {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.aspectRatio = W + ' / ' + H;
  }
  resizeCanvas();

  /* ---------------------------------------------------------
   * 3. 地形 / 地板 预渲染图层
   * ------------------------------------------------------- */
  function makeLayer(draw) {
    const c = document.createElement('canvas');
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    draw(g);
    return c;
  }

  function roundRect(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    if (g.roundRect) {
      g.roundRect(x, y, w, h, r);
    } else {
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    }
  }

  const floorLayer = { c: null };
  const wallLayer = { c: null };

  function buildLayers() {
    floorLayer.c = makeLayer(drawFloor);
    wallLayer.c = makeLayer(drawWalls);
  }

  function drawFloor(g) {
    g.fillStyle = '#0a0e15';
    g.fillRect(0, 0, W, H);

    // 中央冷光
    const glow = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.68);
    glow.addColorStop(0, 'rgba(56,108,180,.13)');
    glow.addColorStop(1, 'rgba(56,108,180,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);

    // 网格
    g.strokeStyle = 'rgba(126,166,224,.055)';
    g.lineWidth = 1;
    g.beginPath();
    for (let x = TILE; x < W; x += TILE) {
      g.moveTo(x + 0.5, 0);
      g.lineTo(x + 0.5, H);
    }
    for (let y = TILE; y < H; y += TILE) {
      g.moveTo(0, y + 0.5);
      g.lineTo(W, y + 0.5);
    }
    g.stroke();

    // 四角暗角
    const vig = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, Math.max(W, H) * 0.78);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,.45)');
    g.fillStyle = vig;
    g.fillRect(0, 0, W, H);
  }

  function drawWalls(g) {
    for (let cy = 0; cy < ROWS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        if (!WALL[cy][cx]) continue;
        const x = cx * TILE;
        const y = cy * TILE;

        // 底部阴影
        g.fillStyle = 'rgba(0,0,0,.5)';
        roundRect(g, x + 1, y + 3, TILE - 2, TILE - 2, 5);
        g.fill();

        // 主体
        const body = g.createLinearGradient(0, y, 0, y + TILE);
        body.addColorStop(0, '#2f3a4f');
        body.addColorStop(0.45, '#242e40');
        body.addColorStop(1, '#1a2230');
        g.fillStyle = body;
        roundRect(g, x + 1, y + 1, TILE - 2, TILE - 2, 5);
        g.fill();

        // 顶部高光
        g.fillStyle = 'rgba(150,190,255,.14)';
        roundRect(g, x + 3, y + 2.5, TILE - 6, 3, 1.5);
        g.fill();

        // 内描边
        g.strokeStyle = 'rgba(130,170,230,.10)';
        g.lineWidth = 1;
        roundRect(g, x + 1.5, y + 1.5, TILE - 3, TILE - 3, 4.5);
        g.stroke();
      }
    }
  }

  buildLayers();

  /* ---------------------------------------------------------
   * 4. 游戏状态
   * ------------------------------------------------------- */
  // 两套键位：本地双人时左右分键盘（WASD / 方向键），联机时人人都是 WASD
  const KEYS_WASD = { forward: 'KeyW', back: 'KeyS', ccw: 'KeyA', cw: 'KeyD' };
  const KEYS_ARROW = { forward: 'ArrowUp', back: 'ArrowDown', ccw: 'ArrowLeft', cw: 'ArrowRight' };

  let sides = 2;          // 参战人数：2 = 双人，3 = 三人

  function createTank(id, keys) {
    return {
      id: id,
      active: false,                     // 本局是否参战（双人时第三辆不上场）
      spawn: { x: 0, y: 0, a: 0 },
      x: 0,
      y: 0,
      angle: 0,                          // 车头朝向：0 = 右，PI = 左
      hp: MAX_HP,
      alive: true,
      cd: 0,
      dryCd: 0,      // 弹满打不出去时的提示音冷却
      recoil: 0,
      flash: 0,
      firing: false,
      // 道具武器：null | 'laser' | 'mine' | 'shotgun' | 'cannon'，charges = 剩余可用次数
      weapon: null,
      charges: 0,
      charge: 0,          // 能量电子炮聚能剩余时间（>0 时锁死移动与转向）
      chargeMax: 0,       // 本次聚能的总时长（用来算汇聚进度）
      shield: 0,          // 护盾剩余时间（秒），>0 时免疫一次伤害
      shieldUsed: false,
      invis: 0,           // 隐身剩余时间
      invisCd: 0,         // 隐身冷却
      // 两套驾驶输入：
      //   键盘 —— forward/back 前进倒车，ccw/cw 转向
      //   摇杆 —— aim 目标朝向（弧度，null 表示没推）+ throttle 油门，车头先转过去再往前开
      input: { forward: 0, back: 0, ccw: 0, cw: 0, aim: null, throttle: 0 },
      palette: PALETTES[id],
      keys: keys
    };
  }

  const tanks = [
    createTank(0, KEYS_WASD),
    createTank(1, KEYS_ARROW),
    createTank(2, KEYS_WASD)
  ];

  // 联机时每人一台设备，键位统一成 WASD，各自控制自己那辆
  function applyKeyset() {
    const online = mode !== 'local';
    tanks[0].keys = KEYS_WASD;
    tanks[1].keys = online ? KEYS_WASD : KEYS_ARROW;
    tanks[2].keys = KEYS_WASD;
  }

  // 装载地图：人数 + 地图序号 → 换地形、搬出生点、重建地形图层
  // 双人 4 张 / 三人 4 张，序号越界会自动绕回，联机时访客靠它跟主机对齐
  function applyMap(n, idx) {
    sides = n === 3 ? 3 : 2;
    const pack = mapPack(sides);
    let i = (typeof idx === 'number' && isFinite(idx)) ? Math.round(idx) : mapIndex;
    i = ((i % pack.length) + pack.length) % pack.length;   // 允许负数 / 越界
    mapIndex = i;

    const def = pack[i];
    MAP = def.rows;
    MAP_NAME = def.name;

    ROWS = MAP.length;
    COLS = MAP[0].length;
    W = COLS * TILE;
    H = ROWS * TILE;
    WALL = toWall(MAP);
    floorTiles = null;          // 空地缓存跟着地图作废
    buildLayers();
    resizeCanvas();

    const sp = def.spawns;
    for (let k = 0; k < tanks.length; k++) {
      const t = tanks[k];
      const s = sp[k];
      t.active = !!s;
      if (!s) continue;
      t.spawn = { x: (s.c + 0.5) * TILE, y: (s.r + 0.5) * TILE, a: s.a };
    }
    applyKeyset();
  }

  // 只切人数，地图序号保持不变（越界会自动绕回）
  function setSides(n) { applyMap(n, mapIndex); }

  // 随机换一张「和现在不一样」的图（图库里 ≥ 2 张时才有意义）
  function rollMap() {
    const pack = mapPack(sides);
    if (pack.length < 2) return false;
    let i = mapIndex;
    let guard = 0;
    while (i === mapIndex && guard++ < 64) i = Math.floor(Math.random() * pack.length);
    applyMap(sides, i);
    return true;
  }

  // 输入用 0~1 的数值表示：键盘只给 0 / 1，摇杆可给中间值（推得越远开得越快）
  function resetInput(t) {
    t.input.forward = 0;
    t.input.back = 0;
    t.input.ccw = 0;
    t.input.cw = 0;
    t.input.aim = null;
    t.input.throttle = 0;
  }

  // 角度归一到 (-PI, PI]，用于求最短转向路径
  function wrapPi(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a <= -Math.PI) a += Math.PI * 2;
    return a;
  }

  let state = 'ready';   // ready | playing | paused | roundOver
  let scores = [0, 0, 0];
  let bullets = [];
  let items = [];        // 场上的道具（激光 / 护盾 / 地雷 / 霰弹枪 / 能量电子炮）
  let mines = [];        // 地上已布置的地雷
  let beams = [];        // 能量电子炮射出的贯穿激光（瞬时成立，持续 0.5 秒由粗变细）
  let itemTimer = ITEM_INTERVAL;
  let itemSeq = 0;
  let mineSeq = 0;
  let beamSeq = 0;
  let clock = 0;         // 全局时间（秒），只用于闪烁 / 旋转之类的表现
  let particles = [];
  let shake = 0;
  let countdown = 0;
  let muted = false;

  // 结算面板延迟弹出，先让爆炸演完
  let overlayTimer = 0;
  let pendingOverlay = null;

  // 一局结束后自动进入下一局的倒计时
  let roundTimer = 0;

  // 淘汰后延迟加分：爆炸演完再给胜方记分，并播放跳动动画
  let awardTimer = 0;
  let pendingWinner = -1;

  // 返回主界面：由大厅注册真正的跳转逻辑
  let exitHandler = null;
  let menuOpen = false;          // 「返回主界面？」确认面板是否打开

  /* ---------------------------------------------------------
   * 4.1 联机状态
   *   local —— 本机双人（原有玩法）
   *   solo  —— 单人模式：玩家开红方（id 0），电脑开蓝方（id 1），
   *            两个座位都在本机跑物理，AI 只是往蓝方写入输入
   *   host  —— 联机主机：自己跑物理模拟，把快照广播给访客
   *   guest —— 联机访客：只发输入、只渲染主机快照
   * ------------------------------------------------------- */
  let mode = 'local';
  let netSend = null;                    // 由大厅注入的发送函数
  // 访客各自的输入包（按座位号存：0 = 主机，1 / 2 = 两位访客）
  function blankInput() {
    return { forward: 0, back: 0, ccw: 0, cw: 0, fire: false, aim: null, throttle: 0 };
  }
  let guestInputs = [blankInput(), blankInput(), blankInput()];
  let guestSide = 1;                     // 本机访客的座位号（三人局可能是 1 或 2）
  let netAcc = 0;                        // 发送节流计时
  let netEvents = [];                    // 待发送的表现事件（开火/命中/爆炸/反弹）
  let bulletSeq = 0;
  let panelVisible = false;

  let netClock = 0;                      // 访客端本地时钟
  let tankKeys = [[], [], []];           // 访客端坦克关键帧
  let bulletKeys = {};                   // 访客端子弹关键帧：id -> []
  let trailStore = {};                   // 访客端子弹拖尾
  let guestPanelShown = false;

  /* ---------------------------------------------------------
   * 5. 音效（程序化，无外部资源）
   * ------------------------------------------------------- */
  let actx = null;

  function primeAudio() {
    if (muted) return;
    try {
      if (!actx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
      }
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { /* 忽略 */ }
  }

  function sfx(kind) {
    if (muted) return;
    try {
      if (!actx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
      }
      if (actx.state === 'suspended') actx.resume();
      const t0 = actx.currentTime;

      function beep(type, from, to, dur, vol, delay) {
        const o = actx.createOscillator();
        const g = actx.createGain();
        const s = t0 + (delay || 0);
        o.type = type;
        o.frequency.setValueAtTime(from, s);
        if (to !== from) o.frequency.exponentialRampToValueAtTime(to, s + dur);
        g.gain.setValueAtTime(vol, s);
        g.gain.exponentialRampToValueAtTime(0.0008, s + dur);
        o.connect(g);
        g.connect(actx.destination);
        o.start(s);
        o.stop(s + dur + 0.02);
      }

      if (kind === 'shoot') beep('square', 560, 170, 0.09, 0.05);
      else if (kind === 'shotgun') { beep('square', 300, 90, 0.16, 0.09); beep('sawtooth', 220, 70, 0.14, 0.05, 0.01); }
      else if (kind === 'laser') { beep('sawtooth', 1500, 320, 0.20, 0.09); beep('square', 720, 220, 0.14, 0.05, 0.02); }
      else if (kind === 'pickup') { beep('triangle', 880, 1320, 0.10, 0.07); beep('triangle', 1320, 1320, 0.12, 0.05, 0.09); }
      else if (kind === 'mine') { beep('triangle', 320, 160, 0.09, 0.06); }                 // 地雷落地
      else if (kind === 'boom') { beep('sawtooth', 150, 40, 0.42, 0.13); beep('square', 90, 30, 0.36, 0.08, 0.02); }
      else if (kind === 'shield') { beep('sine', 1240, 620, 0.22, 0.09); beep('triangle', 720, 720, 0.16, 0.05, 0.05); }
      else if (kind === 'invis') { beep('sine', 520, 1180, 0.26, 0.06); }
      // 电子炮：聚能是持续上扬的蓄力声，开火是一记闷雷 + 高频撕裂
      else if (kind === 'charge') { beep('sawtooth', 180, 900, 0.9, 0.05); beep('sine', 420, 1500, 0.85, 0.04, 0.05); }
      else if (kind === 'cannon') { beep('sawtooth', 240, 32, 0.55, 0.14); beep('square', 1400, 180, 0.34, 0.07, 0.01); }
      else if (kind === 'empty') beep('square', 190, 110, 0.05, 0.022);      // 弹满打不出去：干涩的空响
      else if (kind === 'hit') beep('sawtooth', 200, 48, 0.28, 0.12);
      else if (kind === 'score') {
        // 加分时的清脆“叮咚”，与击杀音区分
        beep('triangle', 1046, 1046, 0.10, 0.075, 0);
        beep('triangle', 1568, 1568, 0.18, 0.06, 0.085);
      }
      else if (kind === 'win') {
        beep('triangle', 523, 523, 0.16, 0.09, 0);
        beep('triangle', 659, 659, 0.16, 0.09, 0.12);
        beep('triangle', 784, 784, 0.30, 0.09, 0.24);
      }
    } catch (e) { /* 静默失败 */ }
  }

  /* ---------------------------------------------------------
   * 6. 碰撞工具
   * ------------------------------------------------------- */
  function rectHitsWall(x, y, half) {
    const x0 = Math.floor((x - half) / TILE);
    const x1 = Math.floor((x + half - 0.01) / TILE);
    const y0 = Math.floor((y - half) / TILE);
    const y1 = Math.floor((y + half - 0.01) / TILE);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return true;
        if (WALL[cy][cx]) return true;
      }
    }
    return false;
  }

  function tanksOverlap(ax, ay, bx, by) {
    return Math.abs(ax - bx) < TANK_HALF * 2 && Math.abs(ay - by) < TANK_HALF * 2;
  }

  function blocked(x, y, self) {
    if (rectHitsWall(x, y, TANK_HALF)) return true;
    for (let i = 0; i < tanks.length; i++) {
      const o = tanks[i];
      if (o === self || !o.active || !o.alive) continue;
      if (tanksOverlap(x, y, o.x, o.y)) return true;
    }
    return false;
  }

  function bulletHitsTank(b, t) {
    const cx = Math.max(t.x - TANK_HALF, Math.min(b.x, t.x + TANK_HALF));
    const cy = Math.max(t.y - TANK_HALF, Math.min(b.y, t.y + TANK_HALF));
    const dx = b.x - cx;
    const dy = b.y - cy;
    return dx * dx + dy * dy <= b.r * b.r;
  }

  /* ---------------------------------------------------------
   * 7. 粒子
   * ------------------------------------------------------- */
  function spawnSparks(x, y, color, count, life) {
    life = life || 0.35;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 190;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: life * (0.55 + Math.random() * 0.7),
        max: life,
        color: color,
        size: 1.2 + Math.random() * 2.6
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const damp = Math.pow(0.12, dt);
      p.vx *= damp;
      p.vy *= damp;
    }
  }

  /* ---------------------------------------------------------
   * 8. 逻辑更新
   * ------------------------------------------------------- */
  // 出膛点：默认在炮管尖端；如果正前方贴墙，就退到「墙前还容得下一颗子弹」的最近位置，
  // 避免子弹一出生就压在墙里连弹好几下（那种情况会被自己吃回来）
  // 斜向开火时要把出膛点推得更远，才能让子弹圆完全离开车体碰撞盒（否则刚出生就贴在自己身上）
  function muzzlePoint(t, cos, sin, radius) {
    const rr = radius || BULLET_R;
    const clear = (TANK_HALF + rr + 0.5) / Math.max(Math.abs(cos), Math.abs(sin));
    const far = Math.max(MUZZLE_OFF, clear);
    for (let d = far; d >= TANK_HALF + 3; d -= 1) {
      const px = t.x + cos * d;
      const py = t.y + sin * d;
      if (rectHitsWall(px, py, rr)) continue;
      // 前方还得分得出一小段飞行距离：贴得太死的炮口打出去的子弹会立刻被墙弹回身上
      if (rectHitsWall(px + cos * MUZZLE_FLIGHT, py + sin * MUZZLE_FLIGHT, rr)) continue;
      return { x: px, y: py };
    }
    return null;
  }

  // 这辆坦克自己还有几颗普通子弹在地图上飞（激光 / 霰弹 / 飞镖是特殊弹，不占 5 颗名额）
  function ownBulletCount(id) {
    let n = 0;
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (b.owner === id && b.kind === 'bullet') n++;
    }
    return n;
  }

  // 贴墙 / 弹仓满时的「打不出去」提示
  function dryClick(t) {
    if (t.dryCd > 0) return;
    t.dryCd = 0.4;
    sfx('empty');
  }

  function fire(t) {
    // 聚能中：整辆车锁死，按发射键也不响应
    if (t.charge > 0) return;

    // 身上带着道具武器时，攻击键打的就是它
    if (t.weapon === 'laser') { fireLaser(t); return; }
    if (t.weapon === 'shotgun') { fireShotgun(t); return; }
    if (t.weapon === 'mine') { placeMine(t); return; }
    if (t.weapon === 'cannon') { startCharge(t); return; }

    // 弹药无限，但同一辆坦克同时存在的子弹最多 MAX_OWN_BULLETS 颗：
    // 满了就打不出去（干响一声），直到有子弹消失才恢复
    if (ownBulletCount(t.id) >= MAX_OWN_BULLETS) {
      dryClick(t);
      return;
    }

    t.cd = FIRE_CD;
    t.recoil = 1;

    const cos = Math.cos(t.angle);
    const sin = Math.sin(t.angle);
    const muzzle = muzzlePoint(t, cos, sin);

    if (!muzzle) {
      // 炮口顶着墙 / 贴得太近，这一炮打不出去（否则子弹会被墙立刻弹回来炸到自己）
      spawnSparks(t.x + cos * MUZZLE_OFF, t.y + sin * MUZZLE_OFF, '#9fc6ff', 5, 0.18);
      dryClick(t);
      return;
    }

    const bx = muzzle.x;
    const by = muzzle.y;

    bullets.push({
      id: ++bulletSeq,
      kind: 'bullet',
      x: bx,
      y: by,
      vx: cos * BULLET_SPEED,
      vy: sin * BULLET_SPEED,
      r: BULLET_R,
      owner: t.id,
      age: 0,         // 出膛后经过的时间：小于 SELF_IMMUNE 时这颗子弹碰不到自己的坦克
      dmg: 1,
      maxBounce: MAX_BOUNCE,
      color: t.palette.main,
      bounces: 0,
      life: BULLET_LIFE,
      trail: []
    });

    netEvents.push(['s', r1(bx), r1(by), t.id, 0]);
    spawnSparks(bx, by, t.palette.light, 4, 0.14);
    shake = Math.max(shake, 2);
    sfx('shoot');
  }

  // 发射激光：速度极快、可反弹、命中扣两滴血，且只能打一发
  function fireLaser(t) {
    const cos = Math.cos(t.angle);
    const sin = Math.sin(t.angle);
    const muzzle = muzzlePoint(t, cos, sin, LASER_R);

    if (!muzzle) {
      // 炮口顶着墙：激光留着下次再打，别白白浪费
      spawnSparks(t.x + cos * MUZZLE_OFF, t.y + sin * MUZZLE_OFF, '#9ff9ff', 5, 0.18);
      dryClick(t);
      return;
    }

    t.weapon = null;
    t.charges = 0;
    t.cd = FIRE_CD;
    t.recoil = 1;

    bullets.push({
      id: ++bulletSeq,
      kind: 'laser',
      x: muzzle.x,
      y: muzzle.y,
      vx: cos * LASER_SPEED,
      vy: sin * LASER_SPEED,
      r: LASER_R,
      owner: t.id,
      age: 0,
      dmg: LASER_DAMAGE,
      maxBounce: LASER_MAX_BOUNCE,
      color: '#8ff4ff',
      bounces: 0,
      life: LASER_LIFE,
      trail: []
    });

    netEvents.push(['s', r1(muzzle.x), r1(muzzle.y), t.id, 1]);
    spawnSparks(muzzle.x, muzzle.y, '#bff8ff', 10, 0.24);
    spawnSparks(muzzle.x, muzzle.y, '#ffffff', 5, 0.16);
    shake = Math.max(shake, 7);
    sfx('laser');
  }

  // 霰弹枪：朝正前方 30 度扇形打出 5 颗不能反弹的子弹，每颗扣一滴血，一共 3 次
  function fireShotgun(t) {
    const half = SHOTGUN_SPREAD / 2;
    const stepA = SHOTGUN_SPREAD / (SHOTGUN_PELLETS - 1);
    let fired = 0;
    let ox = t.x;
    let oy = t.y;

    for (let k = 0; k < SHOTGUN_PELLETS; k++) {
      const a = t.angle - half + stepA * k;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const muzzle = muzzlePoint(t, cos, sin, 3.6);
      if (!muzzle) continue;      // 某个角度顶墙就不发这一颗
      ox = muzzle.x;
      oy = muzzle.y;
      bullets.push({
        id: ++bulletSeq,
        kind: 'pellet',
        x: muzzle.x,
        y: muzzle.y,
        vx: cos * SHOTGUN_SPEED,
        vy: sin * SHOTGUN_SPEED,
        r: 3.4,
        owner: t.id,
        age: 0,
        dmg: 1,
        maxBounce: 0,        // 不能反弹，碰到墙就没了
        color: '#ffd479',
        bounces: 0,
        life: SHOTGUN_LIFE,
        trail: []
      });
      fired++;
    }

    if (!fired) { dryClick(t); return; }   // 顶着墙：不浪费次数

    t.cd = FIRE_CD;
    t.recoil = 1.3;
    t.charges = Math.max(0, t.charges - 1);
    if (t.charges <= 0) t.weapon = null;   // 3 次打完回到普通状态

    netEvents.push(['s', r1(ox), r1(oy), t.id, 2]);
    spawnSparks(ox, oy, '#ffd479', 8, 0.2);
    shake = Math.max(shake, 4);
    sfx('shotgun');
  }

  /* ---- 能量电子炮：聚能 1 秒 → 瞬发贯穿激光（穿墙、不反弹、0.5 秒由粗变细）---- */

  // 按下发射键：进入聚能。这 1 秒里不能移动、不能转向，炮口前方光线不断汇聚。
  function startCharge(t) {
    t.charge = CANNON_CHARGE;
    t.chargeMax = CANNON_CHARGE;
    t.weapon = null;          // 只能打一发，按下就消耗掉
    t.charges = 0;
    t.recoil = 0;
    t.cd = CANNON_CHARGE + CANNON_BEAM_LIFE;   // 整轮（聚能 + 激光）结束前不再响应
    netEvents.push(['ch', r1(t.x), r1(t.y), t.id]);
    sfx('charge');
  }

  // 沿方向射到地图边界需要多长（激光穿墙，所以完全无视墙体）
  function beamReach(x, y, cos, sin) {
    let d = 1e6;
    if (cos > 1e-6) d = Math.min(d, (W - x) / cos);
    else if (cos < -1e-6) d = Math.min(d, (0 - x) / cos);
    if (sin > 1e-6) d = Math.min(d, (H - y) / sin);
    else if (sin < -1e-6) d = Math.min(d, (0 - y) / sin);
    return Math.max(0, d);
  }

  // 点到线段的距离（用来判定坦克有没有被激光扫到）
  function distToSeg(px, py, x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len2 = dx * dx + dy * dy;
    let u = len2 > 0 ? ((px - x0) * dx + (py - y0) * dy) / len2 : 0;
    u = u < 0 ? 0 : (u > 1 ? 1 : u);
    const cxp = x0 + dx * u;
    const cyp = y0 + dy * u;
    return Math.hypot(px - cxp, py - cyp);
  }

  // 聚能满 → 瞬间打出一条贯穿全图的激光，扫到的坦克直接淘汰
  function fireCannonBeam(t) {
    const cos = Math.cos(t.angle);
    const sin = Math.sin(t.angle);
    const x0 = t.x + cos * (TANK_HALF + 12);
    const y0 = t.y + sin * (TANK_HALF + 12);
    const len = beamReach(x0, y0, cos, sin);
    const x1 = x0 + cos * len;
    const y1 = y0 + sin * len;

    beams.push({
      id: ++beamSeq,
      x: x0,
      y: y0,
      x2: x1,
      y2: y1,
      a: t.angle,
      len: len,
      owner: t.id,
      age: 0,
      life: CANNON_BEAM_LIFE
    });

    // 判定：直线扫过的人都吃 3 滴血（满血直接淘汰）；自己站在炮口后面，不会被自己扫到
    for (let k = 0; k < tanks.length; k++) {
      const v = tanks[k];
      if (!v.active || !v.alive || v.id === t.id) continue;
      if (distToSeg(v.x, v.y, x0, y0, x1, y1) <= TANK_HALF + CANNON_HIT_PAD) {
        damage(v, { dmg: CANNON_DAMAGE, x: v.x, y: v.y });
        spawnSparks(v.x, v.y, '#c8f8ff', 20, 0.6);
      }
    }

    netEvents.push(['bm', r1(x0), r1(y0), r2(t.angle), Math.round(len), t.id]);
    spawnSparks(x0, y0, '#e8feff', 22, 0.5);
    spawnSparks(x0, y0, '#8fe8ff', 14, 0.7);
    shake = Math.max(shake, 26);
    sfx('cannon');
  }

  function updateBeams(dt) {
    for (let i = beams.length - 1; i >= 0; i--) {
      beams[i].age += dt;
      if (beams[i].age >= beams[i].life) beams.splice(i, 1);
    }
  }

  // 地雷：从车尾吐出，滑行极短一段距离后停下
  function placeMine(t) {
    const cos = Math.cos(t.angle);
    const sin = Math.sin(t.angle);

    // 车尾位置：先试远一点，被墙挡住就贴着车尾放
    let px = null;
    let py = null;
    for (let d = TANK_HALF + 10; d >= TANK_HALF + 2; d -= 1) {
      const x = t.x - cos * d;
      const y = t.y - sin * d;
      if (!rectHitsWall(x, y, MINE_R)) { px = x; py = y; break; }
    }
    if (px === null) { dryClick(t); return; }   // 车尾顶着墙：这次布不出来，地雷留着

    mines.push({
      id: ++mineSeq,
      owner: t.id,
      x: px,
      y: py,
      vx: -cos * MINE_SLIDE_SPEED,
      vy: -sin * MINE_SLIDE_SPEED,
      travel: 0,
      phase: 'slide',   // slide | idle
      hideT: 0,         // 停下后经过的时间（1 秒内淡出）
      revealed: false,  // 被踩中过 → 永久显形
      armedT: 0         // 踩中后离开的计时
    });

    t.cd = FIRE_CD * 0.8;
    t.charges = Math.max(0, t.charges - 1);
    if (t.charges <= 0) t.weapon = null;   // 两颗放完回到普通状态

    netEvents.push(['m', r1(px), r1(py), t.id]);
    spawnSparks(px, py, '#ff9a5a', 6, 0.22);
    sfx('mine');
  }

  // 地雷爆炸：向四周 360 度均匀发射 30 个不可反弹的小飞镖
  function explodeMine(m) {
    for (let k = 0; k < MINE_DARTS; k++) {
      const a = (Math.PI * 2 * k) / MINE_DARTS;
      bullets.push({
        id: ++bulletSeq,
        kind: 'dart',
        x: m.x,
        y: m.y,
        vx: Math.cos(a) * MINE_DART_SPEED,
        vy: Math.sin(a) * MINE_DART_SPEED,
        r: 3,
        owner: m.owner,
        age: 1,          // 飞镖不受「刚出膛免疫」影响
        dmg: 1,
        maxBounce: 0,    // 不能反弹
        color: '#ffb066',
        bounces: 0,
        life: MINE_DART_LIFE,
        trail: [],
        spin: a
      });
    }
    netEvents.push(['x', r1(m.x), r1(m.y), m.owner]);
    spawnSparks(m.x, m.y, '#ffb066', 26, 0.6);
    spawnSparks(m.x, m.y, '#fff0c8', 14, 0.45);
    shake = Math.max(shake, 14);
    sfx('boom');
  }

  // 单人模式与双人同屏都没有隐身技能（联机保留）
  function invisOff() { return mode === 'solo' || mode === 'local'; }

  // 隐身技能：按 K → 隐身 5 秒，冷却 20 秒（只有联机模式还有）
  function tryInvis(t) {
    if (invisOff()) return false;
    if (!t || !t.active || !t.alive) return false;
    if (t.invis > 0 || t.invisCd > 0) return false;
    t.invis = INVIS_TIME;
    t.invisCd = INVIS_CD;
    netEvents.push(['i', r1(t.x), r1(t.y), t.id]);
    spawnSparks(t.x, t.y, '#b0a8ff', 12, 0.4);
    sfx('invis');
    updateHud();
    return true;
  }

  // 请求隐身：本机控制的坦克在主机侧直接执行，访客则上报给主机
  function requestInvis(t) {
    if (!t || !t.active || !t.alive) return;
    if (mode === 'guest') {
      if (netSend) netSend({ t: 'act', k: 'invis' });
      return;
    }
    tryInvis(t);
  }

  function tryMove(t, dx, dy) {
    if (dx !== 0) {
      const nx = t.x + dx;
      if (!blocked(nx, t.y, t)) t.x = nx;
    }
    if (dy !== 0) {
      const ny = t.y + dy;
      if (!blocked(t.x, ny, t)) t.y = ny;
    }
  }

  function updateTanks(dt) {
    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      if (!t.active || !t.alive) continue;

      t.cd = Math.max(0, t.cd - dt);
      t.dryCd = Math.max(0, (t.dryCd || 0) - dt);
      t.recoil = Math.max(0, t.recoil - dt * 4.5);
      t.flash = Math.max(0, t.flash - dt);

      // 护盾计时：8 秒到点自动消失，免疫也一起失效
      if (t.shield > 0) {
        t.shield = Math.max(0, t.shield - dt);
        if (t.shield === 0) t.shieldUsed = false;
      }
      // 隐身 / 隐身冷却
      if (t.invis > 0) t.invis = Math.max(0, t.invis - dt);
      if (t.invisCd > 0) t.invisCd = Math.max(0, t.invisCd - dt);

      // 能量电子炮聚能：这一秒里整辆车被锁死，既不能移动也不能转向
      const charging = t.charge > 0;
      if (charging) {
        t.charge = Math.max(0, t.charge - dt);
        if (t.charge === 0) fireCannonBeam(t);   // 聚满 → 瞬发激光
      }

      const aim = t.input.aim;
      if (charging) {
        // 聚能期间吃掉所有移动 / 转向输入
      } else if (aim !== null && aim !== undefined && isFinite(aim)) {
        // 摇杆操控：推到哪个方向，车头就转向哪个方向，然后沿车头前进
        const err = wrapPi(aim - t.angle);
        const maxStep = TANK_TURN_STICK * dt;
        const step = err > maxStep ? maxStep : (err < -maxStep ? -maxStep : err);
        t.angle = wrapPi(t.angle + step);

        const throttle = Math.max(0, Math.min(1, t.input.throttle || 0));
        // 车头还没对准时先原地掉头；过了 90° 才逐渐加速，避免横着蹭墙
        const align = Math.cos(err);
        if (throttle > 0 && align > 0) {
          const dist = TANK_SPEED * throttle * align * dt;
          tryMove(t, Math.cos(t.angle) * dist, Math.sin(t.angle) * dist);
        }
      } else {
        // 转向：A / ← 逆时针，D / → 顺时针（0~1，摇杆可给中间值）
        const turn = (t.input.cw || 0) - (t.input.ccw || 0);
        if (turn !== 0) {
          t.angle += turn * TANK_TURN * dt;
          if (t.angle > Math.PI) t.angle -= Math.PI * 2;
          if (t.angle < -Math.PI) t.angle += Math.PI * 2;
        }

        // 前进 / 倒车：沿车头方向
        const drive = (t.input.forward || 0) - (t.input.back || 0);
        if (drive !== 0) {
          const speed = drive > 0 ? TANK_SPEED : TANK_BACK_SPEED;
          const dist = speed * drive * dt;
          tryMove(t, Math.cos(t.angle) * dist, Math.sin(t.angle) * dist);
        }
      }

      if (t.firing && t.cd <= 0 && t.charge <= 0) fire(t);
    }
  }

  // 护盾进入最后 2 秒（8s → 6s 之后）就改闪烁，提示玩家护盾要到期
  function shieldBlinking(t) {
    return t.shield > 0 && t.shield <= SHIELD_TIME - SHIELD_BLINK_FROM;
  }

  function damage(t, b) {
    const dmg = (b && b.dmg) ? b.dmg : 1;
    const hx = b ? b.x : t.x;
    const hy = b ? b.y : t.y;

    // 护盾：整块护盾只免疫一次伤害，挡完立刻消失
    if (t.shield > 0 && !t.shieldUsed) {
      t.shieldUsed = true;
      t.shield = 0;
      t.flash = 0.12;
      shake = Math.max(shake, 7);
      netEvents.push(['sb', r1(hx), r1(hy), t.id]);
      spawnSparks(hx, hy, '#9fe8ff', 18, 0.45);
      spawnSparks(hx, hy, '#ffffff', 8, 0.3);
      updateHud();
      sfx('shield');
      return;
    }

    t.hp = Math.max(0, t.hp - dmg);
    t.flash = 0.28;
    shake = Math.max(shake, dmg > 1 ? 15 : 9);
    netEvents.push(['h', r1(hx), r1(hy), t.id, dmg > 1 ? 1 : 0]);
    spawnSparks(hx, hy, t.palette.main, 16, 0.5);
    spawnSparks(hx, hy, '#ffd479', 9, 0.4);
    if (dmg > 1) {
      spawnSparks(hx, hy, '#bff8ff', 14, 0.55);   // 激光命中：额外一圈青色电光
      spawnSparks(hx, hy, '#ffffff', 8, 0.4);
    }
    updateHud();
    sfx('hit');

    if (t.hp <= 0) {
      t.alive = false;
      netEvents.push(['d', r1(t.x), r1(t.y), t.id]);
      checkRoundOver(t);
    }
  }

  // 剩下最后一人（或全部同归于尽）时结束这一局
  function checkRoundOver(deadTank) {
    if (state !== 'playing') return;
    const left = [];
    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      if (t.active && t.alive) left.push(t);
    }
    if (left.length > 1) {
      // 还有两人以上：这局继续打，谁活到最后谁得分
      shake = Math.max(shake, 10);
      spawnSparks(deadTank.x, deadTank.y, deadTank.palette.main, 26, 0.7);
      return;
    }
    endRound(left.length === 1 ? left[0].id : -1);
  }

  // 反弹次数上限。注意不能用 `b.maxBounce || MAX_BOUNCE`：霰弹 / 飞镖的 0 是假值，
  // 会被误判成「没设上限」，结果反而按普通子弹的 4 次去弹——霰弹枪的「不能反弹」就失效了。
  function maxBounceOf(b) {
    if (b.maxBounce === undefined || b.maxBounce === null) return MAX_BOUNCE;
    return b.maxBounce;
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.life -= dt;
      b.age = (b.age || 0) + dt;

      if (b.life <= 0) {
        bullets.splice(i, 1);
        continue;
      }

      b.trail.push({ x: b.x, y: b.y });
      const trailMax = b.kind === 'laser' ? 12 : 7;
      if (b.trail.length > trailMax) b.trail.shift();

      const dist = Math.sqrt(b.vx * b.vx + b.vy * b.vy) * dt;
      const steps = Math.max(1, Math.ceil(dist / 3));
      const stepDt = dt / steps;
      let dead = false;
      let hitTankFlag = false;

      for (let s = 0; s < steps; s++) {
        // 打中坦克
        for (let k = 0; k < tanks.length; k++) {
          const t = tanks[k];
          if (!t.active || !t.alive) continue;
          // 自己的子弹：刚出膛的 SELF_IMMUNE 秒内对车主免疫（子弹还没真正飞出去时不会炸到自己），
          // 超过这个时间就照常算命中；别的早先发射的子弹不受这颗的免疫影响。
          if (t.id === b.owner) {
            if (b.age >= SELF_IMMUNE && bulletHitsTank(b, t)) {
              if (SELF_DAMAGE) {
                damage(t, b);
                hitTankFlag = true;
              }
              dead = true;
            }
            continue;
          }
          if (bulletHitsTank(b, t)) {
            damage(t, b);
            dead = true;
            hitTankFlag = true;
            break;
          }
        }
        if (dead) break;

        // X 轴（反弹只改方向，速度保持不变）
        const nx = b.x + b.vx * stepDt;
        if (rectHitsWall(nx, b.y, b.r)) {
          if (maxBounceOf(b) <= 0) { dead = true; break; }   // 不可反弹的（霰弹 / 飞镖）：触墙即消失
          b.vx = -b.vx;
          b.bounces++;
          netEvents.push(['b', r1(b.x), r1(b.y)]);
          spawnSparks(b.x + (b.vx > 0 ? -b.r : b.r), b.y, '#a9d2ff', 2, 0.10);
        } else {
          b.x = nx;
        }

        // Y 轴
        const ny = b.y + b.vy * stepDt;
        if (rectHitsWall(b.x, ny, b.r)) {
          if (maxBounceOf(b) <= 0) { dead = true; break; }   // 同上：触墙即消失
          b.vy = -b.vy;
          b.bounces++;
          netEvents.push(['b', r1(b.x), r1(b.y)]);
        } else {
          b.y = ny;
        }

        if (b.bounces > maxBounceOf(b)) { dead = true; break; }
        if (b.x < -8 || b.y < -8 || b.x > W + 8 || b.y > H + 8) { dead = true; break; }
      }

      if (dead) {
        if (!hitTankFlag) spawnSparks(b.x, b.y, b.color, 5, 0.22);
        bullets.splice(i, 1);
      }
    }

    updateAmmo();   // 子弹增减后刷新弹药指示（内部有变化检测，不会每帧写 DOM）
  }

  /* ---- 道具：每 ITEM_INTERVAL 秒从道具池里随机刷一个在空地上，坦克碾过去就能捡 ---- */
  let floorTiles = null;

  // 道具池：激光 / 护盾 / 地雷 / 霰弹枪 / 能量电子炮
  const ITEM_TYPES = ['laser', 'shield', 'mine', 'shotgun', 'cannon'];
  // 单人模式的道具池：只留激光一种（其余武器与增益不进人机对局）
  const SOLO_ITEM_TYPES = ['laser'];
  function itemPool() { return mode === 'solo' ? SOLO_ITEM_TYPES : ITEM_TYPES; }

  // 地图上所有「不是墙」的格子中心（道具只会刷在这些地方）
  function getFloorTiles() {
    if (floorTiles) return floorTiles;
    floorTiles = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!WALL[r][c]) floorTiles.push({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE });
      }
    }
    return floorTiles;
  }

  function spawnItem(typeHint) {
    const tiles = getFloorTiles();
    if (!tiles.length) return;
    // 指定类型时照办（测试与手动投放），随机时只看当前模式的道具池
    const pool = itemPool();
    const type = (typeHint && ITEM_TYPES.indexOf(typeHint) >= 0)
      ? typeHint
      : pool[(Math.random() * pool.length) | 0];

    // 优先挑「离所有坦克都有点距离」的空地，别直接刷在人家脸上
    for (let tries = 0; tries < 120; tries++) {
      const p = tiles[(Math.random() * tiles.length) | 0];
      let ok = true;
      for (let i = 0; i < tanks.length; i++) {
        if (!tanks[i].active || !tanks[i].alive) continue;
        if (Math.hypot(p.x - tanks[i].x, p.y - tanks[i].y) < TILE * 2.2) { ok = false; break; }
      }
      if (!ok) continue;
      items.push({ id: ++itemSeq, x: p.x, y: p.y, type: type, born: 0 });
      return;
    }
    // 兜底：地图太小 / 坦克把空地占满了，就随便挑一格
    const p = tiles[(Math.random() * tiles.length) | 0];
    items.push({ id: ++itemSeq, x: p.x, y: p.y, type: type, born: 0 });
  }

  // 能不能捡：护盾是独立的增益（没护盾就能捡），其它都是武器状态（空手才能捡）
  function canPickItem(t, it) {
    if (t.charge > 0) return false;          // 聚能中整辆车锁死，连地上的道具都捡不了
    if (it.type === 'shield') return t.shield <= 0;
    return !t.weapon;
  }

  function giveItem(t, it) {
    if (it.type === 'laser') { t.weapon = 'laser'; t.charges = 1; }
    else if (it.type === 'shotgun') { t.weapon = 'shotgun'; t.charges = SHOTGUN_USES; }
    else if (it.type === 'mine') { t.weapon = 'mine'; t.charges = MINE_USES; }
    else if (it.type === 'cannon') { t.weapon = 'cannon'; t.charges = 1; }
    else if (it.type === 'shield') { t.shield = SHIELD_TIME; t.shieldUsed = false; }
  }

  function updateItems(dt) {
    // 刷新计时：到点就补一个（场上同时最多一个，被捡走后按间隔再刷）
    itemTimer -= dt;
    if (itemTimer <= 0) {
      itemTimer += ITEM_INTERVAL;
      if (items.length === 0) spawnItem();
    }

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.born += dt;

      for (let k = 0; k < tanks.length; k++) {
        const t = tanks[k];
        if (!t.active || !t.alive || !canPickItem(t, it)) continue;
        if (Math.abs(it.x - t.x) > TANK_HALF + ITEM_R) continue;
        if (Math.abs(it.y - t.y) > TANK_HALF + ITEM_R) continue;

        giveItem(t, it);
        items.splice(i, 1);
        netEvents.push(['p', r1(it.x), r1(it.y), t.id, ITEM_TYPES.indexOf(it.type)]);
        spawnSparks(it.x, it.y, it.type === 'shield' ? '#9fe8ff' : '#ffd479', 16, 0.45);
        spawnSparks(it.x, it.y, '#ffffff', 8, 0.3);
        shake = Math.max(shake, 4);
        sfx('pickup');
        updateHud();
        break;
      }
    }
  }

  /* ---- 地雷 ---- */
  // 车体方框与地雷圆是否接触
  function mineTouches(t, m) {
    const cx = Math.max(t.x - TANK_HALF, Math.min(m.x, t.x + TANK_HALF));
    const cy = Math.max(t.y - TANK_HALF, Math.min(m.y, t.y + TANK_HALF));
    const dx = m.x - cx;
    const dy = m.y - cy;
    return dx * dx + dy * dy <= MINE_R * MINE_R;
  }

  function updateMines(dt) {
    for (let i = mines.length - 1; i >= 0; i--) {
      const m = mines[i];

      // 1) 滑行：从车尾吐出后极短一段距离，很快停下
      if (m.phase === 'slide') {
        const spd = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        const stepLen = spd * dt;
        if (stepLen > 0 && m.travel + stepLen < MINE_SLIDE) {
          const nx = m.x + m.vx * dt;
          const ny = m.y + m.vy * dt;
          if (!rectHitsWall(nx, ny, MINE_R)) {
            m.x = nx;
            m.y = ny;
            m.travel += stepLen;
            const damp = Math.pow(0.02, dt);
            m.vx *= damp;
            m.vy *= damp;
            continue;
          }
        }
        m.vx = 0;
        m.vy = 0;
        m.phase = 'idle';
        m.hideT = 0;
        continue;
      }

      // 2) 落位后：1 秒内逐渐隐去（所有人不可见）
      let stepped = false;
      for (let k = 0; k < tanks.length; k++) {
        const t = tanks[k];
        if (!t.active || !t.alive) continue;
        if (mineTouches(t, m)) { stepped = true; break; }
      }

      if (stepped) {
        // 踩中：地雷显形并红光闪烁，但踩着的这段时间不引爆
        m.revealed = true;
        m.armedT = 0;
      } else if (m.revealed) {
        // 坦克离开后 0.5 秒立刻引爆
        m.armedT += dt;
        if (m.armedT >= MINE_TRIGGER_DELAY) {
          explodeMine(m);
          mines.splice(i, 1);
          continue;
        }
      }

      if (!m.revealed) m.hideT = (m.hideT || 0) + dt;
    }
  }

  /* ---------------------------------------------------------
   * 8.5 单人模式：电脑对手
   *
   *   电脑不去碰坐标，也不走任何捷径：它只是像玩家一样往 tanks[1].input
   *   里写「摇杆」（aim = 想去的方向，throttle = 油门），需要开火时把
   *   firing 置真。移动、碰撞、冷却、伤害全部走 updateTanks 里那套逻辑，
   *   所以电脑不会穿墙、不会跳过 0.35 秒冷却，也不会有玩家没有的特权。
   *
   *   看不见的东西它真的不知道：玩家隐身时 AI 会失去目标，退化成
   *   去最后出现的位置搜寻。
   * ------------------------------------------------------- */

  // 难度基准（每局开始时整体浮动一点，免得每局手感一模一样）
  // 注意：这一套对电脑版、手机版 / 平板都是同一份，AI 里没有任何按设备类型
  // 或操作方式分支的逻辑——触屏只是换了玩家自己的输入方式，电脑那边一个参数都不变。
  const AI_BASE = {
    jitter: 0.085,      // 瞄准误差幅度（弧度，±4.9°）
    jitterHold: 0.30,   // 误差多久重掷一次
    fireGap: 0.20,      // 两次开火之间的犹豫
    sightAim: 0.115,    // 认为「已经对准」的角度阈值
    fleeDist: 215,      // 多近的来袭子弹需要闪
    keepMin: 120,       // 和玩家保持的距离区间
    keepMax: 290,
    grabRange: 340,     // 多近的道具值得绕过去捡
    thinkGap: 0.24      // 重新寻路的间隔
  };

  let aiCfg = AI_BASE;
  const aiSt = {
    route: { pts: [], len: 0 },   // 当前最短路线（折线点列，0.05 秒整条重建）
    routeT: 0,                    // 距离下一次重建还有多久
    routeInit: false,             // 开局那条路线有没有生成过
    replans: 0,                   // 这一局重建了多少次路线（调试 / 测试用）
    state: 'free',                // free = 未受威胁状态，dodge = 躲避状态
    backing: false,               // 这一帧是不是在倒车（可转向的后退）
    pathLen: 0,                   // 当前最短路线还剩几个格（调试 / 测试用）
    goalC: -1,
    goalR: -1,
    errT: 0,
    err: 0,
    fireT: 0,
    stuckT: 0,
    lastX: 0,
    lastY: 0,
    throttle: 0,
    aimAngle: 0,         // 上一帧想去的方向（判断「原地转向」还是「卡住」）
    lastSeen: null,
    lastSeenT: 99,
    wander: 0,
    wanderT: 0,
    escapeT: 0,
    escapeStep: 0,
    backFromX: 0,        // 脱困倒车的起点：只退 TILE/6，退多了会跟墙反复拉扯
    backFromY: 0,
    lastBackDist: 0,     // 上一次脱困实际退了多少（调试 / 测试用）
    grabId: 0,
    grabT: 0,
    skipItem: 0,
    shotCd: 0,           // 弹道规划的节流计时
    shot: null,          // 当前算出来的「能命中玩家」的炮口角度
    burstLeft: 0,        // 还要补几发
    inT: -1,             // 最近一颗会命中自己的子弹还有多久到（-1 = 没有）
    inBounces: 0,
    reactT: 0,           // 发现威胁后已经「反应」了多久（人类不是零延迟）
    dodgeDir: null,
    dodgeT: 0,
    mode: 'idle'
  };

  function aiResetRound() {
    const f = 0.82 + Math.random() * 0.36;     // 0.82 ~ 1.18
    aiCfg = {
      jitter: AI_BASE.jitter * f,
      jitterHold: AI_BASE.jitterHold,
      fireGap: AI_BASE.fireGap * (2 - f),
      sightAim: AI_BASE.sightAim * f,
      fleeDist: AI_BASE.fleeDist,
      keepMin: AI_BASE.keepMin,
      keepMax: AI_BASE.keepMax,
      grabRange: AI_BASE.grabRange,
      thinkGap: AI_BASE.thinkGap
    };
    aiSt.route.pts = [];       // 旧路线在开局就作废，第一帧重新生成
    aiSt.route.len = 0;
    aiSt.routeT = 0;
    aiSt.routeInit = false;
    aiSt.replans = 0;
    aiSt.state = 'free';
    aiSt.backing = false;
    aiSt.pathLen = 0;
    aiSt.goalC = -1;
    aiSt.goalR = -1;
    aiSt.errT = 0;
    aiSt.err = 0;
    aiSt.fireT = 0.8;          // 开局先愣一下，别一响铃就开炮
    aiSt.stuckT = 0;
    aiSt.throttle = 0;
    aiSt.aimAngle = 0;
    aiSt.lastSeen = null;
    aiSt.lastSeenT = 99;
    aiSt.wander = 0;
    aiSt.wanderT = 0;
    aiSt.escapeT = 0;
    aiSt.escapeStep = 0;
    aiSt.grabId = 0;
    aiSt.grabT = 0;
    aiSt.skipItem = 0;
    aiSt.shotCd = 0;
    aiSt.shot = null;
    aiSt.burstLeft = 0;
    aiSt.inT = -1;
    aiSt.inBounces = 0;
    aiSt.reactT = 0;
    aiSt.dodgeDir = null;
    aiSt.dodgeT = 0;
    aiSt.mode = 'idle';
    if (tanks[1]) {
      aiSt.lastX = tanks[1].x;
      aiSt.lastY = tanks[1].y;
    }
  }

  function aiWalkable(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS && !WALL[r][c];
  }

  // 两点之间有没有墙（沿线段每 6px 采样一次）
  function aiLineClear(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;
    const steps = Math.max(2, Math.ceil(dist / 6));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (!aiWalkable(Math.floor((x1 + dx * t) / TILE), Math.floor((y1 + dy * t) / TILE))) return false;
    }
    return true;
  }

  // 车能不能直线开过去：比视线判断多留一点车宽，免得贴着墙角蹭住
  function aiDriveClear(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;
    const steps = Math.max(2, Math.ceil(dist / 8));
    const half = TANK_HALF - 4;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (rectHitsWall(x1 + dx * t, y1 + dy * t, half)) return false;
    }
    return true;
  }

  /* =========================================================
   * 6.5 到目标的最短路线：BFS 距离场 + 视线跳点
   *   从目标格做一次四向 BFS，得到「每格到目标还有几步」的距离场；顺着距离递减的
   *   方向走天生就是最短路线，再把共线的格子用视线合并成折线，走起来才不会一格
   *   一格地蹭墙角。折线每 0.05 秒整条重建、直接顶掉旧的——玩家一动，上一条路线
   *   就作废了，绝不让旧路线拖着车往回跑。
   * ======================================================= */
  const AI_ROUTE_GAP = 0.05;      // 重建路线的间隔（秒）
  const AI_LOOK = 2.0;            // 威胁预测窗口：未来 2 秒
  const AI_REACT = 0.22;          // 看见子弹到动方向盘的反应时间
  const AI_EVADE_T = 0.9;         // 预测命中落在这个时间内 → 立刻闪身
  const AI_BACK_STEP = TILE / 6;  // 脱困只退一个墙宽的 1/6
  const AI_SHOT_TOL = 0.035;      // 炮口和理想弹道差多少算「已经对准」（约 2°）
  const AI_SIM_STEP = 3;          // 弹道模拟的步进（和真实子弹一致）

  const aiFields = Object.create(null);   // 距离场缓存：key = 地图 + 目标格

  function aiCellOf(x, y) {
    return { c: Math.floor(x / TILE), r: Math.floor(y / TILE) };
  }

  // 取「目标格」的 BFS 距离场（同一张图、同一个目标格只算一次）
  function aiFieldOf(gc, gr) {
    const key = mapIndex + ':' + gc + ':' + gr;
    let e = aiFields[key];
    if (e) return e.f;

    // 只留最近用过的五张：玩家一格一格挪，缓存无限涨会占内存
    const keys = Object.keys(aiFields);
    for (let i = 0; i < keys.length - 4; i++) delete aiFields[keys[i]];

    const f = new Int16Array(COLS * ROWS);
    f.fill(-1);
    if (aiWalkable(gc, gr)) {
      const q = [gr * COLS + gc];
      f[gr * COLS + gc] = 0;
      let head = 0;
      while (head < q.length) {
        const cur = q[head++];
        const cx = cur % COLS;
        const cy = (cur - cx) / COLS;
        const nd = f[cur] + 1;
        if (cx + 1 < COLS && !WALL[cy][cx + 1] && f[cy * COLS + cx + 1] === -1) {
          f[cy * COLS + cx + 1] = nd; q.push(cy * COLS + cx + 1);
        }
        if (cx - 1 >= 0 && !WALL[cy][cx - 1] && f[cy * COLS + cx - 1] === -1) {
          f[cy * COLS + cx - 1] = nd; q.push(cy * COLS + cx - 1);
        }
        if (cy + 1 < ROWS && !WALL[cy + 1][cx] && f[(cy + 1) * COLS + cx] === -1) {
          f[(cy + 1) * COLS + cx] = nd; q.push((cy + 1) * COLS + cx);
        }
        if (cy - 1 >= 0 && !WALL[cy - 1][cx] && f[(cy - 1) * COLS + cx] === -1) {
          f[(cy - 1) * COLS + cx] = nd; q.push((cy - 1) * COLS + cx);
        }
      }
    }
    aiFields[key] = { f: f };
    return f;
  }

  // 规划一条「从这里到 (tx,ty)」的最短路线，返回折线点列（终点就是目标本身）
  function aiPlanRoute(me, tx, ty) {
    const g = aiCellOf(tx, ty);
    if (!aiWalkable(g.c, g.r)) return null;
    const f = aiFieldOf(g.c, g.r);
    const s = aiCellOf(me.x, me.y);
    if (s.c < 0 || s.r < 0 || s.c >= COLS || s.r >= ROWS) return null;
    const startD = f[s.r * COLS + s.c];
    if (startD < 0) return null;

    // 顺着距离递减回溯，得到「近 → 远」的格子链
    const cells = [];
    let cc = s.c;
    let cr = s.r;
    let guard = 0;
    while ((cc !== g.c || cr !== g.r) && guard++ < COLS * ROWS) {
      const here = f[cr * COLS + cc];
      let bestD = here;
      let bc = -1;
      let br = -1;
      if (cc + 1 < COLS) { const d = f[cr * COLS + cc + 1]; if (d >= 0 && d < bestD) { bestD = d; bc = cc + 1; br = cr; } }
      if (cc - 1 >= 0) { const d = f[cr * COLS + cc - 1]; if (d >= 0 && d < bestD) { bestD = d; bc = cc - 1; br = cr; } }
      if (cr + 1 < ROWS) { const d = f[(cr + 1) * COLS + cc]; if (d >= 0 && d < bestD) { bestD = d; bc = cc; br = cr + 1; } }
      if (cr - 1 >= 0) { const d = f[(cr - 1) * COLS + cc]; if (d >= 0 && d < bestD) { bestD = d; bc = cc; br = cr - 1; } }
      if (bc < 0) break;
      cc = bc;
      cr = br;
      cells.push({ c: cc, r: cr });
    }

    if (!cells.length) return { pts: [{ x: tx, y: ty }], len: startD };

    // 视线跳点：从最远的那格往回找第一个「车能直接开过去」的格子，当作这一段落点
    const pts = [];
    let px = me.x;
    let py = me.y;
    let i = cells.length - 1;
    let hop = 0;
    while (i >= 0 && hop++ < 64) {
      let pickIdx = -1;
      for (let k = i; k >= 0; k--) {
        const wx = (cells[k].c + 0.5) * TILE;
        const wy = (cells[k].r + 0.5) * TILE;
        if (Math.hypot(wx - px, wy - py) > TILE * 6) continue;
        if (!aiDriveClear(px, py, wx, wy)) continue;
        pickIdx = k;
        break;
      }
      if (pickIdx < 0) pickIdx = 0;     // 全被挡：退回最近一格，一格一格挪出去
      const wx = (cells[pickIdx].c + 0.5) * TILE;
      const wy = (cells[pickIdx].r + 0.5) * TILE;
      pts.push({ x: wx, y: wy });
      px = wx;
      py = wy;
      i = pickIdx - 1;
    }
    // 最后一个点直接落到目标身上（目标一直在动，反正 0.05 秒后就重建了）
    pts.push({ x: tx, y: ty });
    return { pts: pts, len: startD };
  }

  /* ---- 三种「写输入」的方式，等价于玩家推摇杆 / 踩倒车 ---- */

  // 朝 angle 开：车头转过去，然后按油门前进
  function aiAim(t, angle, throttle) {
    t.input.aim = angle;
    t.input.throttle = throttle;
    t.input.forward = 0;
    t.input.back = 0;
    t.input.ccw = 0;
    t.input.cw = 0;
    aiSt.throttle = throttle;
    aiSt.aimAngle = angle;
    aiSt.backing = false;
  }

  /* 可转向的后退：一边倒车，一边用履带差速把车尾掰向 dir。
     - dir 是「想去的方向」，车头朝反方向（noseWant），所以倒车正好往 dir 挪；
     - 打方向按误差比例给，差得多打满、快对上了轻推，不会左右画龙；
     - 比「原地掉头再跑」快得多：车立刻就在动，而且车头常对着玩家，边退还能边还击。
     和老的「简单后退」的区别就在这儿：老版只会直着往后蹭，撞上墙就干瞪眼。 */
  function aiBackTo(t, dir) {
    const noseWant = wrapPi(dir + Math.PI);          // 车尾对准 dir ⇔ 车头背对它
    const err = wrapPi(noseWant - t.angle);
    const steer = Math.max(-1, Math.min(1, err / 0.55));
    t.input.aim = null;                              // 走「履带 / 摇杆」那套手动输入
    t.input.throttle = 0;
    t.input.forward = 0;
    t.input.back = 1;
    t.input.ccw = steer < 0 ? -steer : 0;
    t.input.cw = steer > 0 ? steer : 0;
    aiSt.throttle = -1;                              // 负油门 = 正在倒车（卡住检测也认）
    aiSt.aimAngle = noseWant;
    aiSt.backing = true;
  }

  // 只倒车不打方向：脱困的第一步用它，退多远是可控的
  function aiBackStraight(t) {
    t.input.aim = null;
    t.input.throttle = 0;
    t.input.forward = 0;
    t.input.back = 1;
    t.input.ccw = 0;
    t.input.cw = 0;
    aiSt.throttle = -1;
    aiSt.backing = true;
  }

  /* 去某个点：一般朝前开；目标在正后方就倒车带转向抄近路。
     「可转向的后退」在实战里最好用的其实就是这一下——不用掉头，直接倒着拐过去。 */
  function aiApproach(me, tx, ty) {
    const want = Math.atan2(ty - me.y, tx - me.x);
    const err = Math.abs(wrapPi(want - me.angle));
    if (err > 2.2) aiBackTo(me, want);
    else aiAim(me, want, 1);
  }

  // 沿当前路线开：挑路线上「最远、现在又能直线开到」的那个点
  function aiFollow(me) {
    const pts = aiSt.route.pts;
    if (!pts.length) return false;
    let target = null;
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      if (Math.hypot(p.x - me.x, p.y - me.y) < 12) continue;
      if (!aiDriveClear(me.x, me.y, p.x, p.y)) continue;
      target = p;
      break;
    }
    if (!target) target = pts[0];
    aiApproach(me, target.x, target.y);
    return true;
  }

  // 朝 (tx,ty) 走：先把路线整条重算一遍（0.05 秒一次），再顺着新路线开
  function aiGoto(me, tx, ty, dt) {
    // 脱困：先直着退一个墙宽的 1/6，再换个方向走开
    if (aiSt.escapeT > 0) {
      aiSt.escapeT -= dt;
      if (aiSt.escapeStep === 0) {
        const moved = Math.hypot(me.x - aiSt.backFromX, me.y - aiSt.backFromY);
        aiBackStraight(me);
        if (moved >= AI_BACK_STEP || aiSt.escapeT <= 0) {
          aiSt.lastBackDist = moved;
          aiSt.escapeStep = 1;
          aiSt.escapeT = 0.4;
        }
      } else {
        aiAim(me, aiSt.wander, 1);
        if (aiSt.escapeT <= 0) { aiSt.escapeStep = 0; aiSt.pathLen = 0; }
      }
      return;
    }
    if (aiSt.stuckT > 0.45) {
      aiSt.stuckT = 0;
      aiSt.escapeT = 0.3;
      aiSt.escapeStep = 0;
      aiSt.backFromX = me.x;
      aiSt.backFromY = me.y;
      aiSt.wander = me.angle + (Math.random() < 0.5 ? 1 : -1) * (0.9 + Math.random() * 0.8);
      return;
    }

    aiSt.routeT -= dt;
    if (aiSt.routeT <= 0 || !aiSt.route.pts.length) {
      aiSt.routeT = AI_ROUTE_GAP;
      const plan = aiPlanRoute(me, tx, ty);
      if (plan) {
        aiSt.route.pts = plan.pts;       // 整条替换：旧路线直接扔，不和新路线抢方向盘
        aiSt.route.len = plan.len;
        aiSt.pathLen = plan.len;
        aiSt.replans++;
      } else {
        aiSt.route.pts = [];
        aiSt.route.len = 0;
        aiSt.pathLen = 0;
      }
    }
    if (!aiFollow(me)) aiWander(me, dt);
  }

  function aiWander(me, dt) {
    if (aiSt.wanderT > 0) {
      aiSt.wanderT -= dt;
      aiAim(me, aiSt.wander, 1);
      return;
    }
    const cc = Math.floor(me.x / TILE);
    const cr = Math.floor(me.y / TILE);
    for (let i = 0; i < 24; i++) {
      const c = cc + Math.floor(Math.random() * 11) - 5;
      const r = cr + Math.floor(Math.random() * 9) - 4;
      if (!aiWalkable(c, r)) continue;
      aiSt.wander = Math.atan2((r + 0.5) * TILE - me.y, (c + 0.5) * TILE - me.x);
      aiSt.wanderT = 1.1;
      aiAim(me, aiSt.wander, 1);
      return;
    }
    aiAim(me, me.angle + 1.2, 1);
  }

  /* =========================================================
   * 6.6 弹道预测
   *   和真实子弹用完全一样的步进（每步 3px，X / Y 轴分别反弹），
   *   这样 AI「想象」出来的弹道和实际打出去的子弹是同一条线。
   * ======================================================= */

  // 点到坦克碰撞盒的距离（0 = 已经贴上了）
  function aiRectDist(x, y, t) {
    const cx = Math.max(t.x - TANK_HALF, Math.min(x, t.x + TANK_HALF));
    const cy = Math.max(t.y - TANK_HALF, Math.min(y, t.y + TANK_HALF));
    return Math.hypot(x - cx, y - cy);
  }

  // 模拟「从 (x,y) 沿 angle 打一发」：会不会命中 target、多久命中、弹了几次
  function aiSimShot(x, y, angle, target, opt) {
    opt = opt || {};
    const speed = opt.speed || BULLET_SPEED;
    const life = opt.life || 1.2;
    const rad = opt.r || BULLET_R;
    const dt = AI_SIM_STEP / speed;

    let px = x;
    let py = y;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let t = 0;
    let bounces = 0;
    const probe = { x: px, y: py, r: rad };

    while (t < life) {
      t += dt;
      if (target) {
        probe.x = px;
        probe.y = py;
        if (bulletHitsTank(probe, target)) {
          return { hit: true, t: t, bounces: bounces, x: px, y: py };
        }
      }
      const nx = px + vx * dt;
      if (rectHitsWall(nx, py, rad)) { vx = -vx; bounces++; }
      else px = nx;
      const ny = py + vy * dt;
      if (rectHitsWall(px, ny, rad)) { vy = -vy; bounces++; }
      else py = ny;
      if (bounces > 20) break;
      if (px < -8 || py < -8 || px > W + 8 || py > H + 8) break;
    }
    return { hit: false, t: t, bounces: bounces, x: px, y: py };
  }

  // 一颗已经在飞的子弹，多久会打中 target（不会命中返回 null）
  function aiSimThreat(b, target, maxT) {
    const speed = Math.hypot(b.vx, b.vy) || BULLET_SPEED;
    const rad = b.r || BULLET_R;
    const dt = AI_SIM_STEP / speed;
    const maxBounce = b.maxBounce === undefined ? MAX_BOUNCE : b.maxBounce;
    let px = b.x;
    let py = b.y;
    let vx = b.vx;
    let vy = b.vy;
    let t = 0;
    let bounces = 0;
    while (t < maxT) {
      t += dt;
      if (aiRectDist(px, py, target) <= rad) return { t: t, bounces: bounces };
      const nx = px + vx * dt;
      if (rectHitsWall(nx, py, rad)) {
        if (maxBounce <= 0) return null;
        vx = -vx;
        bounces++;
      } else {
        px = nx;
      }
      const ny = py + vy * dt;
      if (rectHitsWall(px, ny, rad)) {
        if (maxBounce <= 0) return null;
        vy = -vy;
        bounces++;
      } else {
        py = ny;
      }
      if (bounces > maxBounce) return null;
      if (px < -8 || py < -8 || px > W + 8 || py > H + 8) return null;
    }
    return null;
  }

  /* 未来 2 秒内会不会有子弹打中自己？返回最快命中的那一颗（null = 安全）。
     这就是「未受威胁状态 / 躲避状态」的判决依据。 */
  function aiIncoming(me) {
    let best = null;
    let sims = 0;
    const reach = 30 + BULLET_SPEED * AI_LOOK;
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (b.owner === me.id) continue;
      if (b.life <= 0.05) continue;
      if (Math.hypot(b.x - me.x, b.y - me.y) > reach) continue;
      if (sims >= 8) break;          // 每帧最多细算 8 颗，别把帧率吃光
      sims++;
      const span = Math.min(b.life || BULLET_LIFE, AI_LOOK);
      const r = aiSimThreat(b, me, span);
      if (!r) continue;
      if (!best || r.t < best.t) best = { b: b, t: r.t, bounces: r.bounces };
    }
    return best;
  }

  /* 找一条能打中玩家的炮口方向（允许借墙反弹）。
   * 先试「正对玩家」附近 ±0.09 的细角度，再全向粗扫一圈找反弹线路。
   * 命中时间越短、反弹次数越少越优先。 */
  function aiFindShot(me, foe) {
    if (!foe || !foe.active || !foe.alive) return null;
    const dist = Math.hypot(foe.x - me.x, foe.y - me.y);
    if (dist > 620) return null;

    // 手上是激光就按激光的参数算，其它武器走各自的老逻辑
    let opt = { life: 1.2 };
    if (me.weapon === 'laser') opt = { life: 1.1, speed: LASER_SPEED, r: LASER_R };
    else if (me.weapon) return null;

    const base = Math.atan2(foe.y - me.y, foe.x - me.x);
    let best = null;
    const test = function (a) {
      const mz = muzzlePoint(me, Math.cos(a), Math.sin(a), opt.r);
      if (!mz) return;
      const r = aiSimShot(mz.x, mz.y, a, foe, opt);
      if (!r.hit) return;
      const score = r.t + r.bounces * 0.22;
      if (!best || score < best.score) {
        best = { angle: a, t: r.t, bounces: r.bounces, score: score, dist: dist };
      }
    };
    for (let i = -4; i <= 4; i++) test(base + i * 0.0225);
    for (let i = 0; i < 32; i++) test(-Math.PI + (i * Math.PI * 2) / 32);
    if (!best) return null;

    // 瞄准不是完美的：加一点角度抖动，偶尔还会迟疑一下不开枪
    best.angle += (Math.random() * 2 - 1) * 0.022;
    if (Math.random() < 0.12) return null;

    // 「按情况射出数枚」：直射且够近就补一枪；靠反弹的线路容错低，只打一发
    let burst = 1;
    if (best.bounces === 0 && best.t < 0.62 && dist < 420) burst = 2;
    best.burst = burst;
    return best;
  }

  // 弹道规划节流：0.2 秒算一次就够，别每帧全向扫描
  function aiShotPlan(me, foe, dt) {
    aiSt.shotCd = Math.max(0, aiSt.shotCd - dt);
    if (aiSt.shotCd > 0) return aiSt.shot;
    aiSt.shotCd = 0.2;
    aiSt.shot = aiFindShot(me, foe);
    return aiSt.shot;
  }

  // 真的扣扳机（假想弹道已经算出来、炮口也对上了才会走到这儿）
  function aiPullTrigger(me, shot) {
    if (aiSt.fireT > 0 || me.cd > 0) return false;
    if (ownBulletCount(me.id) >= MAX_OWN_BULLETS) return false;
    me.firing = true;
    aiSt.burstLeft = Math.max(0, shot.burst - 1);
    // 打一发之后要缓一下（连发的第二发除外），否则对局几秒就结束了
    aiSt.fireT = shot.burst > 1 ? 0.15 : (0.46 + Math.random() * 0.2);
    aiSt.shotCd = 0;          // 打出去立刻重算（玩家会躲）
    return true;
  }

  // 地雷 / 电子炮 / 霰弹枪不吃「反弹弹道」那一套，按各自脾气开火
  function aiSpecialWeapon(me, foe, dist) {
    if (!me.weapon || me.weapon === 'laser') return false;
    if (aiSt.fireT > 0 || me.cd > 0) return false;
    if (me.weapon === 'mine') {
      // 地雷放在车尾，贴脸放等于炸自己；拉开距离再布
      if (dist < 230 || ownBulletCount(me.id) >= MAX_OWN_BULLETS) return false;
      me.firing = true;
      aiSt.fireT = 1.1;
      return true;
    }
    if (me.weapon === 'cannon') {
      // 电子炮要原地聚能 1 秒，血量见底时不赌这一下
      if (dist < 150 || me.hp <= 1) return false;
      me.firing = true;
      aiSt.fireT = 1.4;
      return true;
    }
    if (me.weapon === 'shotgun') {
      const err = Math.abs(wrapPi(Math.atan2(foe.y - me.y, foe.x - me.x) - me.angle));
      if (dist > 210 || err > 0.2) return false;
      me.firing = true;
      aiSt.fireT = aiCfg.fireGap;
      return true;
    }
    return false;
  }

  function aiNearestItem(me) {
    let best = null;
    let bestD = aiCfg.grabRange;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const d = Math.hypot(it.x - me.x, it.y - me.y);
      if (d < bestD) { bestD = d; best = it; }
    }
    return best;
  }

  /* ---- 躲避：先算「往哪边能让开弹道」，再决定是朝前打方向还是倒车带转向 ---- */

  // 朝逃生方向动：方向在身后（转过去太慢）就倒车带转向，否则朝前开
  function aiEvadeGo(me, dir) {
    const err = Math.abs(wrapPi(dir - me.angle));
    if (err > 1.95) aiBackTo(me, dir);
    else aiAim(me, dir, 1);
  }

  function aiEvade(me, threat, dt) {
    // 已经选好方向就先跑完这 0.24 秒，免得每帧改主意、原地抽搐
    if (aiSt.dodgeDir !== null && aiSt.dodgeT > 0) {
      aiSt.dodgeT -= dt;
      aiEvadeGo(me, aiSt.dodgeDir);
      return;
    }

    const b = threat.b;
    const axis = Math.atan2(b.vy, b.vx);
    const rad = b.r || BULLET_R;
    const need = TANK_HALF + rad + 6;                    // 至少要挪出这么多才离开弹道
    const probe = Math.max(need * 2.2, TILE * 1.15);
    const span = Math.min(b.life || BULLET_LIFE, AI_LOOK);

    // 把车「放」到候选落点上再模拟一次这颗子弹：还会被打中就不算安全
    const safeAt = function (a) {
      const gx = me.x + Math.cos(a) * probe;
      const gy = me.y + Math.sin(a) * probe;
      if (rectHitsWall(gx, gy, TANK_HALF)) return false;
      return !aiSimThreat(b, { x: gx, y: gy }, span);
    };

    // 候选：垂直弹道两侧最快；被墙挡住时再考虑顺着 / 逆着弹道跑
    const dirs = [axis + Math.PI / 2, axis - Math.PI / 2, axis + Math.PI, axis];
    const cands = [];
    for (let i = 0; i < dirs.length; i++) {
      const a = wrapPi(dirs[i]);
      if (safeAt(a)) cands.push(a);
    }

    if (!cands.length) {
      // 四面都不安全：顺着弹道方向跑，多拖一点时间，顺手让车尾先离开线路
      aiSt.dodgeDir = wrapPi(axis);
      aiSt.dodgeT = 0.18;
      aiEvadeGo(me, aiSt.dodgeDir);
      return;
    }

    // 转向越少越优先（威胁可能只剩零点几秒，少转半圈就是多一条命）
    let pick = null;
    // 同一颗子弹继续躲的时候别改主意：上一帧选的那侧还安全就接着走
    if (aiSt.dodgeDir !== null) {
      for (let i = 0; i < cands.length; i++) {
        if (Math.abs(wrapPi(cands[i] - aiSt.dodgeDir)) < 0.35) { pick = cands[i]; break; }
      }
    }
    if (pick === null) {
      cands.sort(function (a1, a2) {
        return Math.abs(wrapPi(a1 - me.angle)) - Math.abs(wrapPi(a2 - me.angle));
      });
      // 两侧都能躲时偶尔判断失误、挑了绕远的那边——给玩家留出可乘之机
      pick = (cands.length > 1 && Math.random() < 0.25) ? cands[1] : cands[0];
    }
    aiSt.dodgeDir = pick;
    aiSt.dodgeT = 0.3;
    aiEvadeGo(me, pick);
  }

  // 倒车 + 转向来躲：车尾先闪开，车头还留在弹道这一侧，随时能还击
  function aiEvadeBack(me, threat) {
    const b = threat.b;
    const axis = Math.atan2(b.vy, b.vx);
    const back = wrapPi(axis + (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2);
    aiBackTo(me, back);
  }

  /* ---- 未受威胁状态：沿最短路线接近、进攻、捡道具 ---- */
  function aiFree(me, foe, dist, hasLOS, dt) {
    const foeAlive = !!(foe && foe.active && foe.alive);

    if (foeAlive) {
      if (aiSpecialWeapon(me, foe, dist)) return;

      // 假想射击：先算一条能命中玩家的弹道（含借墙反弹），炮口对上了才开炮
      const shot = dist > 520 ? null : aiShotPlan(me, foe, dt);
      if (shot) {
        const errS = Math.abs(wrapPi(shot.angle - me.angle));
        if (errS <= AI_SHOT_TOL) {
          aiAim(me, shot.angle, 0);       // 站定，用精确角度瞄准
          aiPullTrigger(me, shot);
          return;
        }
        // 还没对上：离得远就沿最短路线压上去，够近了才停下转炮口
        if (dist > aiCfg.keepMin) { aiGoto(me, foe.x, foe.y, dt); return; }
        aiAim(me, shot.angle, 0);
        return;
      }

      // 上一轮没打完的连发补上
      if (aiSt.burstLeft > 0 && me.cd <= 0 && aiSt.fireT <= 0) {
        me.firing = true;
        aiSt.burstLeft--;
        aiSt.fireT = 0.12;
        return;
      }
    }

    // 手上没家伙 → 去捡（正在贴脸打架时只捡脚边的）
    if (!me.weapon && foeAlive) {
      const it = aiNearestItem(me);
      if (it && it.id !== aiSt.skipItem) {
        const dItem = Math.hypot(it.x - me.x, it.y - me.y);
        const worth = dItem < 105 || !(hasLOS && dist < 300);
        if (worth) {
          if (aiSt.grabId !== it.id) { aiSt.grabId = it.id; aiSt.grabT = 0; }
          aiSt.grabT += dt;
          if (aiSt.grabT > 2.2 && dItem > 70) {
            aiSt.skipItem = it.id;      // 绕不过去，换个目标
            aiSt.grabT = 0;
          } else {
            aiSt.mode = 'grab';
            aiSt.shot = null;           // 去捡东西的时候别再拿旧的弹道数据
            aiGoto(me, it.x, it.y, dt);
            return;
          }
        }
      }
    }

    if (foeAlive) {
      // 有目标但算不出弹道：沿最短路线贴近，贴太近就倒车带转向退开
      aiSt.mode = 'fight';
      const want = Math.atan2(foe.y - me.y, foe.x - me.x);
      // 中间隔着墙：沿最短路线绕过去（直线冲只会顶在墙上）
      if (!hasLOS) { aiGoto(me, foe.x, foe.y, dt); return; }
      const minKeep = me.weapon === 'cannon' ? 175 : aiCfg.keepMin;
      if (dist > aiCfg.keepMax) { aiGoto(me, foe.x, foe.y, dt); return; }
      if (dist < minKeep) { aiBackTo(me, wrapPi(want + Math.PI)); return; }
      aiAim(me, want, 0.55);
      return;
    }

    // 玩家没了（阵亡 / 隐身）：去最后见到他的地方找，找不到就到处转
    if (aiSt.lastSeen && aiSt.lastSeenT < 7) {
      const d = Math.hypot(aiSt.lastSeen.x - me.x, aiSt.lastSeen.y - me.y);
      if (d > 44) {
        aiSt.mode = 'search';
        aiSt.shot = null;
        aiGoto(me, aiSt.lastSeen.x, aiSt.lastSeen.y, dt);
        return;
      }
    }
    aiSt.mode = 'patrol';
    aiWander(me, dt);
  }

  // 躲避状态下也做一次假想射击：这一炮能命中就顺手回敬，躲归躲
  function aiDodgeFire(me, foe, dist, dt) {
    if (!foe || !foe.active || !foe.alive) return false;
    if (aiSt.fireT > 0 || me.cd > 0) return false;
    if (ownBulletCount(me.id) >= MAX_OWN_BULLETS) return false;
    if (aiSpecialWeapon(me, foe, dist)) return true;
    const shot = dist > 520 ? null : aiShotPlan(me, foe, dt);
    if (!shot) return false;
    if (Math.abs(wrapPi(shot.angle - me.angle)) > AI_SHOT_TOL) return false;
    return aiPullTrigger(me, shot);
  }

  /* ---- 主循环 ---- */
  function aiUpdate(dt) {
    const me = tanks[1];
    const foe = tanks[0];
    if (!me || !me.active || !me.alive) {
      if (me) { me.firing = false; resetInput(me); }
      return;
    }
    // 电子炮聚能时整辆车锁死，这期间不用给输入
    if (me.charge > 0) { me.firing = false; return; }

    me.firing = false;      // 默认不开火，要开火的帧自己置真
    aiSt.backing = false;

    aiSt.fireT = Math.max(0, aiSt.fireT - dt);
    aiSt.errT -= dt;
    if (aiSt.errT <= 0) {
      aiSt.errT = aiCfg.jitterHold;
      aiSt.err = (Math.random() * 2 - 1) * aiCfg.jitter;
    }

    // 「想动却动不了」才算卡住：原地转向时车头还没对上，不能算
    const moved = Math.hypot(me.x - aiSt.lastX, me.y - aiSt.lastY);
    const aimOff = Math.abs(wrapPi(aiSt.aimAngle - me.angle));
    if (moved < 1.2 && Math.abs(aiSt.throttle) > 0.4 && aimOff < 0.7) aiSt.stuckT += dt;
    else aiSt.stuckT = Math.max(0, aiSt.stuckT - dt * 2);
    aiSt.lastX = me.x;
    aiSt.lastY = me.y;

    const foeAlive = !!(foe && foe.active && foe.alive);
    const visible = foeAlive && !(foe.invis > 0);   // 玩家隐身 = 真的看不见
    if (visible) {
      aiSt.lastSeen = { x: foe.x, y: foe.y };
      aiSt.lastSeenT = 0;
    } else {
      aiSt.lastSeenT += dt;
    }

    const dist = foeAlive ? Math.hypot(foe.x - me.x, foe.y - me.y) : 9999;
    const hasLOS = visible && aiLineClear(me.x, me.y, foe.x, foe.y);

    // 残血且隐身好了：先隐身保命（单人 / 双人没有隐身，这段自然跳过）
    if (me.hp <= 1 && !invisOff() && me.invisCd <= 0 && me.invis <= 0 && (dist < 300 || aiSt.throttle > 0)) {
      tryInvis(me);
    }

    /* 1) 判决：未来 2 秒内有没有子弹会打中自己？
     *    有 → 躲避状态；没有 → 未受威胁状态。
     *    弹夹清空（自己打出去的子弹还占着四个坑、根本打不出去）也算躲避状态：
     *    打不了就先别站原地当靶子。 */
    const threat = aiIncoming(me);
    aiSt.inT = threat ? threat.t : -1;
    const dry = ownBulletCount(me.id) >= MAX_OWN_BULLETS;
    aiSt.state = (threat || dry) ? 'dodge' : 'free';

    // 开局先生成一条路线：不等第一次移动，路线在开局那一帧就已经存在
    if (!aiSt.routeInit) {
      aiSt.routeInit = true;
      if (foeAlive) {
        const plan = aiPlanRoute(me, foe.x, foe.y);
        if (plan) { aiSt.route.pts = plan.pts; aiSt.route.len = plan.len; aiSt.pathLen = plan.len; }
        aiSt.routeT = AI_ROUTE_GAP;
      }
    }

    if (aiSt.state === 'dodge') {
      /* 2) 躲避状态：优先躲。
       *    - 预测命中在 0.9 秒内：立刻闪身（来不及转身就倒车带转向）
       *    - 还早：边退边等，躲的同时做假想射击，能命中就开火
       *    - 弹夹空了：倒车拉开距离，车头留在玩家身上等装填 */
      if (threat && threat.t <= AI_EVADE_T) {
        // 人类反应时间：看见子弹到打方向盘之间是有延迟的，延迟里保持原动作
        aiSt.reactT += dt;
        if (aiSt.reactT < AI_REACT) return;
        aiSt.mode = 'dodge';
        aiDodgeFire(me, foe, dist, dt);      // 躲之前先看这一炮值不值得还
        aiEvade(me, threat, dt);
        return;
      }
      aiSt.reactT = 0;

      if (dry) {
        // 弹夹清空：贴得近就倒着退开（炮口仍对着玩家，空出位置立刻能打）
        aiSt.mode = 'dodge';
        aiDodgeFire(me, foe, dist, dt);
        const away = Math.atan2(me.y - foe.y, me.x - foe.x);
        if (dist < aiCfg.keepMax) aiBackTo(me, away);
        else aiFree(me, foe, dist, hasLOS, dt);   // 离得够远：照常走位等装填
        return;
      }

      // 威胁还远（0.9 ~ 2 秒）：不算紧急，边保持距离边按路线压上去
      aiDodgeFire(me, foe, dist, dt);
      aiFree(me, foe, dist, hasLOS, dt);
      return;
    }

    /* 3) 未受威胁状态：沿最短路线接近玩家、主动进攻或拾取道具，边走边假想射击 */
    aiSt.reactT = 0;
    aiSt.dodgeDir = null;
    aiSt.dodgeT = 0;
    aiFree(me, foe, dist, hasLOS, dt);
  }

  function update(dt) {
    if (countdown > 0) {
      countdown = Math.max(0, countdown - dt);
      updateParticles(dt);
      if (shake > 0) shake = Math.max(0, shake - dt * 40);
      return;
    }

    if (mode === 'solo') aiUpdate(dt);   // 电脑先想，再和玩家一起跑物理

    updateTanks(dt);
    updateItems(dt);
    updateMines(dt);
    updateBullets(dt);
    updateBeams(dt);
    updateParticles(dt);
    if (shake > 0) shake = Math.max(0, shake - dt * 40);
  }

  /* ---------------------------------------------------------
   * 9. 回合 / 比赛流程
   * ------------------------------------------------------- */
  function resetTanks() {
    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      t.x = t.spawn.x;
      t.y = t.spawn.y;
      t.angle = t.spawn.a;
      t.hp = MAX_HP;
      t.alive = true;
      t.cd = 0;
      t.dryCd = 0;
      t.recoil = 0;
      t.flash = 0;
      t.firing = false;
      t.weapon = null;
      t.charges = 0;
      t.charge = 0;
      t.chargeMax = 0;
      t.shield = 0;
      t.shieldUsed = false;
      t.invis = 0;
      t.invisCd = 0;
      resetInput(t);
    }
  }

  function startRound() {
    // 换局随机换地图：本地 / 房主说了算，访客等主机快照里的地图序号
    if (needMapRoll && mapRotation && mode !== 'guest') {
      rollMap();
      needMapRoll = false;
    }
    bullets.length = 0;
    beams.length = 0;
    particles.length = 0;
    items.length = 0;            // 道具不跨局保留（谁捡到的武器也在 resetTanks 里清掉）
    mines.length = 0;            // 地雷也不跨局保留
    if (itemTimer > ITEM_INTERVAL) itemTimer = ITEM_INTERVAL;   // 刷新节奏接着上次走，不因为换局重新等一轮
    overlayTimer = 0;
    pendingOverlay = null;
    roundTimer = 0;
    awardTimer = 0;
    pendingWinner = -1;

    resetTanks();
    if (mode === 'solo') aiResetRound();   // 每局重新掷一次电脑的手感

    countdown = 1.15;
    state = 'playing';
    hideOverlay();
    updateHud();
  }

  // winner = 最后活着的那一方；-1 表示同归于尽（不加分）
  function endRound(winner) {
    if (state !== 'playing') return;

    // 此处先不加分：血量立刻归零，比分等爆炸演完再跳
    shake = 18;
    if (winner >= 0 && tanks[winner]) {
      const t = tanks[winner];
      spawnSparks(t.x, t.y, t.palette.main, 34, 0.9);
      spawnSparks(t.x, t.y, '#ffd479', 18, 0.75);
    }
    sfx('win');
    updateHud();

    state = 'roundOver';
    needMapRoll = true;          // 下一局开始时换一张地图
    roundTimer = ROUND_GAP;
    pendingWinner = winner;
    awardTimer = winner >= 0 ? AWARD_DELAY : 0;
    pendingOverlay = null;
    overlayTimer = 0;
  }

  // 跳动动画：数字弹一下、闪一下，并飘出一个 +1
  function popScore(side) {
    const box = scoreBoxes[side];
    if (!box) return;
    box.classList.remove('pop');
    void box.offsetWidth;   // 强制重排，保证动画可以重复触发
    box.classList.add('pop');
    setTimeout(function () { box.classList.remove('pop'); }, 1000);
    sfx('score');
  }

  // 加分（主机侧唯一入口；访客侧由快照驱动 popScore）
  function awardScore(winner) {
    if (winner < 0 || winner >= tanks.length) return;
    scores[winner] += 1;
    updateHud();
    popScore(winner);
  }

  function scoreLine() {
    return scores.slice(0, sides).join(' : ');
  }

  function buildRoundOverPanel(winner) {
    const total = scores.slice(0, sides).reduce(function (a, b) { return a + b; }, 0);
    return {
      kicker: '第 ' + total + ' 局结束',
      title: winner >= 0 ? SIDE_NAMES[winner] + ' 拿下这一局' : '同归于尽',
      desc: '当前比分　' + scoreLine() + '<br />下一局马上开始。',
      showKeys: false,
      hint: '点击<em>屏幕</em>立即开始下一局'
    };
  }

  function queueOverlay(opt, delay) {
    pendingOverlay = opt;
    overlayTimer = delay === undefined ? 0.9 : delay;
  }

  function restartMatch() {
    if (mode === 'guest') return;   // 访客不重置比赛，比分由主机权威
    scores = [0, 0, 0];
    updateHud();
    startRound();
  }

  function advance() {
    if (mode === 'guest') return;
    // 爆炸还在演、比分还没跳出来时不允许跳过，避免误触
    if (state === 'roundOver' && (pendingOverlay || awardTimer > 0)) return;
    if (state === 'ready' || state === 'roundOver') {
      startRound();
    } else if (state === 'paused') {
      resumeGame();
    }
  }

  function togglePause() {
    if (mode !== 'local' && mode !== 'solo') return;   // 联机没有暂停，时刻保持运行
    if (state === 'playing') {
      state = 'paused';
      tanks.forEach(function (t) { resetInput(t); t.firing = false; });
      menuOpen = false;
      showOverlay({
        kicker: 'Paused',
        title: '暂停中',
        desc: '当前比分　' + scoreLine(),
        showKeys: false,
        hint: '点击<em>屏幕</em>或按 <em>P</em> 继续',
        actions: [
          { label: '继续对战', kind: 'primary', onClick: resumeGame },
          { label: '返回主界面', onClick: exitToMenu }
        ]
      });
    } else if (state === 'paused') {
      resumeGame();
    }
  }

  /* ---------------------------------------------------------
   * 9.5 联机：主机权威模拟 + 访客插值渲染
   * ------------------------------------------------------- */

  // 关键帧采样：在 rt 时刻于相邻两帧之间做线性插值（角度走最短弧）
  function sampleKeys(keys, rt) {
    if (!keys || !keys.length) return null;
    if (keys.length === 1 || rt <= keys[0].t) return keys[0];

    for (let i = keys.length - 1; i > 0; i--) {
      const a = keys[i - 1];
      const b = keys[i];
      if (rt >= a.t && rt <= b.t) {
        const span = b.t - a.t;
        const u = span > 0.0001 ? (rt - a.t) / span : 1;
        let da = b.a - a.a;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        return {
          x: a.x + (b.x - a.x) * u,
          y: a.y + (b.y - a.y) * u,
          a: a.a + da * u,
          vx: b.vx, vy: b.vy, o: b.o, k: b.k
        };
      }
    }
    return keys[keys.length - 1];
  }

  // 访客：根据快照里的表现事件在本地重现粒子与音效
  function applyNetEvent(e) {
    const pal = PALETTES[e[3] === undefined ? 0 : e[3]] || PALETTES[0];
    if (e[0] === 's') {
      if (e[4] === 1) {
        spawnSparks(e[1], e[2], '#bff8ff', 10, 0.24);
        sfx('laser');
      } else if (e[4] === 2) {
        spawnSparks(e[1], e[2], '#ffd479', 8, 0.2);
        sfx('shotgun');
      } else {
        spawnSparks(e[1], e[2], pal.light, 4, 0.14);
        sfx('shoot');
      }
    } else if (e[0] === 'h') {
      spawnSparks(e[1], e[2], pal.main, 16, 0.5);
      spawnSparks(e[1], e[2], '#ffd479', 9, 0.4);
      if (e[4]) spawnSparks(e[1], e[2], '#bff8ff', 14, 0.55);
      shake = Math.max(shake, e[4] ? 15 : 9);
      sfx('hit');
    } else if (e[0] === 'p') {
      spawnSparks(e[1], e[2], e[4] === 1 ? '#9fe8ff' : '#ffd479', 16, 0.45);
      spawnSparks(e[1], e[2], '#ffffff', 8, 0.3);
      shake = Math.max(shake, 4);
      sfx('pickup');
    } else if (e[0] === 'm') {
      spawnSparks(e[1], e[2], '#ff9a5a', 6, 0.22);
      sfx('mine');
    } else if (e[0] === 'x') {
      spawnSparks(e[1], e[2], '#ffb066', 26, 0.6);
      spawnSparks(e[1], e[2], '#fff0c8', 14, 0.45);
      shake = Math.max(shake, 14);
      sfx('boom');
    } else if (e[0] === 'sb') {
      spawnSparks(e[1], e[2], '#9fe8ff', 18, 0.45);
      spawnSparks(e[1], e[2], '#ffffff', 8, 0.3);
      shake = Math.max(shake, 7);
      sfx('shield');
    } else if (e[0] === 'i') {
      spawnSparks(e[1], e[2], '#b0a8ff', 12, 0.4);
      sfx('invis');
    } else if (e[0] === 'd') {
      spawnSparks(e[1], e[2], pal.main, 34, 0.9);
      spawnSparks(e[1], e[2], '#ffd479', 18, 0.75);
      shake = 18;
      sfx('win');
    } else if (e[0] === 'ch') {
      spawnSparks(e[1], e[2], '#c6b4ff', 10, 0.4);
      sfx('charge');
    } else if (e[0] === 'bm') {
      spawnSparks(e[1], e[2], '#e8feff', 22, 0.5);
      spawnSparks(e[1], e[2], '#8fe8ff', 14, 0.7);
      shake = Math.max(shake, 26);
      sfx('cannon');
    } else if (e[0] === 'b') {
      spawnSparks(e[1], e[2], '#a9d2ff', 2, 0.1);
    }
  }

  // 快照里的武器编号
  const WEAPON_CODES = [null, 'laser', 'mine', 'shotgun', 'cannon'];

  // 访客：收到主机快照
  function applySnapshot(s) {
    if (mode !== 'guest') return;

    state = s.ph === 'roundOver' ? 'roundOver' : 'playing';
    countdown = s.cd || 0;
    const wantSides = (s.sd === 2 || s.sd === 3) ? s.sd : sides;
    const wantMap = (typeof s.mp === 'number') ? s.mp : mapIndex;
    if (wantSides !== sides || wantMap !== mapIndex) {
      applyMap(wantSides, wantMap);    // 换局换图：访客完全跟主机走
      updateHud();
    }

    let hudDirty = false;

    for (let i = 0; i < tanks.length; i++) {
      const d = s.tk && s.tk[i];
      if (!d) continue;
      const keys = tankKeys[i];
      keys.push({ t: netClock, x: d[0], y: d[1], a: d[2] });
      if (keys.length > 16) keys.shift();
      if (tanks[i].hp !== d[3]) { tanks[i].hp = d[3]; hudDirty = true; }
      tanks[i].alive = !!d[4];
      tanks[i].weapon = WEAPON_CODES[d[5] || 0] || null;   // 主机判定拾取，访客只用它来画表现
      tanks[i].charges = d[6] || 0;
      tanks[i].shield = d[7] || 0;
      tanks[i].invis = d[8] || 0;
      tanks[i].invisCd = d[9] || 0;
      tanks[i].charge = d[10] || 0;
    }

    if (s.sc) {
      let diff = false;
      for (let i = 0; i < 3; i++) {
        const v = s.sc[i] || 0;
        if (v !== scores[i]) { if (v > scores[i]) popScore(i); diff = true; }
      }
      if (diff) { scores = [s.sc[0] || 0, s.sc[1] || 0, s.sc[2] || 0]; hudDirty = true; }
    }

    if (hudDirty) updateHud();

    // 子弹关键帧
    const keep = {};
    const list = s.bl || [];
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      const id = b[0];
      keep[id] = 1;
      let keys = bulletKeys[id];
      if (!keys) keys = bulletKeys[id] = [];
      keys.push({ t: netClock, x: b[1], y: b[2], vx: b[3], vy: b[4], o: b[5], k: b[6] || 0 });
      if (keys.length > 16) keys.shift();
      if (!trailStore[id]) trailStore[id] = [];
    }
    for (const id in bulletKeys) {
      if (!keep[id]) { delete bulletKeys[id]; delete trailStore[id]; }
    }

    // 道具 / 地雷由主机决定，访客直接照抄（它们不动，不需要插值）
    const its = s.it || [];
    items = its.map(function (d, idx) {
      return { id: idx, x: d[0], y: d[1], type: ITEM_TYPES[d[2] || 0], born: 1.5 };
    });

    const bms = s.bm || [];
    beams = bms.map(function (d, idx) {
      const a = d[2] || 0;
      return { id: idx, x: d[0], y: d[1], a: a, x2: d[0] + Math.cos(a) * d[3], y2: d[1] + Math.sin(a) * d[3],
        len: d[3], owner: d[4], age: d[5] || 0, life: CANNON_BEAM_LIFE };
    });

    const mns = s.mn || [];
    mines = mns.map(function (d, idx) {
      return { id: idx, x: d[0], y: d[1], phase: 'idle', revealed: !!d[2], hideT: 99, armedT: 0, alpha: d[3] };
    });

    const evs = s.ev || [];
    for (let i = 0; i < evs.length; i++) applyNetEvent(evs[i]);

    // 结算面板镜像（联机没有暂停，面板只由回合结束驱动）
    if (s.pn === 1) {
      if (!guestPanelShown && s.w !== undefined && s.w !== null) {
        guestPanelShown = true;
        showOverlay({
          kicker: '第 ' + scores.slice(0, sides).reduce(function (a, b) { return a + b; }, 0) + ' 局结束',
          title: s.w >= 0 ? SIDE_NAMES[s.w] + ' 拿下这一局' : '同归于尽',
          desc: '当前比分　' + scoreLine() + '<br />下一局马上开始。',
          showKeys: false,
          hint: '下一局由主机自动开始'
        });
      }
    } else if (guestPanelShown) {
      guestPanelShown = false;
      hideOverlay();
    }
  }

  // 快照里的子弹类型编号 → 渲染参数
  function bulletFromCode(code, x, y, vx, vy, owner, trail) {
    if (code === 1) {
      return { kind: 'laser', r: LASER_R, dmg: LASER_DAMAGE, color: '#8ff4ff' };
    }
    if (code === 2) {
      return { kind: 'pellet', r: 3.4, dmg: 1, color: '#ffd479' };
    }
    if (code === 3) {
      return { kind: 'dart', r: 3, dmg: 1, color: '#ffb066', spin: Math.atan2(vy, vx) };
    }
    return { kind: 'bullet', r: BULLET_R, dmg: 1, color: (PALETTES[owner] || PALETTES[0]).main };
  }

  // 访客：每帧渲染（不跑物理），位置全部来自插值
  function guestFrame(dt) {
    netClock += dt;
    const rt = netClock - NET_INTERP;

    for (let i = 0; i < tanks.length; i++) {
      const k = sampleKeys(tankKeys[i], rt);
      if (k) {
        tanks[i].x = k.x;
        tanks[i].y = k.y;
        tanks[i].angle = k.a;
      }
    }

    const list = [];
    for (const id in bulletKeys) {
      const k = sampleKeys(bulletKeys[id], rt);
      if (!k) continue;
      const trail = trailStore[id] || (trailStore[id] = []);
      trail.push({ x: k.x, y: k.y });
      if (trail.length > (k.k === 1 ? 12 : 7)) trail.shift();
      const meta = bulletFromCode(k.k, k.x, k.y, k.vx, k.vy, k.o, trail);
      list.push({
        id: +id,
        kind: meta.kind,
        x: k.x,
        y: k.y,
        vx: k.vx,
        vy: k.vy,
        r: meta.r,
        dmg: meta.dmg,
        color: meta.color,
        spin: meta.spin,
        owner: k.o,
        bounces: 0,
        life: 1,
        age: 1,        // 远端子弹已经飞出去了，直接参与命中判定
        trail: trail
      });
    }
    bullets = list;
    updateAmmo();

    updateParticles(dt);
    if (shake > 0) shake = Math.max(0, shake - dt * 40);

    // 上传自己的输入
    netAcc += dt;
    if (netAcc >= 1 / NET_HZ) guestSendInput();
  }

  function guestSendInput() {
    netAcc = 0;
    if (!netSend) return;
    const t = tanks[guestSide];
    if (!t) return;
    const q = function (v) { return Math.round((+v || 0) * 100) / 100; };   // 摇杆是模拟量，保留两位小数
    netSend({
      t: 'input',
      k: [
        q(t.input.forward),
        q(t.input.back),
        q(t.input.ccw),
        q(t.input.cw),
        t.firing ? 1 : 0
      ],
      // 摇杆：目标朝向（null = 没推摇杆，改走键盘那套）+ 油门
      a: (t.input.aim === null || t.input.aim === undefined) ? null : q(t.input.aim),
      g: q(t.input.throttle)
    });
  }

  // 主机：把各访客的输入写进各自坦克
  function applyGuestInput() {
    for (let i = 1; i < sides; i++) {
      const g = guestInputs[i];
      const t = tanks[i];
      if (!g || !t) continue;
      t.input.forward = g.forward;
      t.input.back = g.back;
      t.input.ccw = g.ccw;
      t.input.cw = g.cw;
      t.input.aim = g.aim;
      t.input.throttle = g.throttle;
      t.firing = g.fire;
    }
  }

  const BULLET_CODES = { bullet: 0, laser: 1, pellet: 2, dart: 3 };

  function tankSnap(t) {
    return [
      r1(t.x), r1(t.y), r2(t.angle), t.hp, t.alive ? 1 : 0,
      Math.max(0, WEAPON_CODES.indexOf(t.weapon)),          // 0 空手 / 1 激光 / 2 地雷 / 3 霰弹 / 4 电子炮
      t.charges || 0,
      r2(t.shield || 0),
      r2(t.invis || 0),
      r2(t.invisCd || 0),
      r2(t.charge || 0)                                     // 电子炮聚能剩余时间（访客据此画聚能光效）
    ];
  }

  // 主机：按固定频率广播快照
  function hostTick(dt) {
    netAcc += dt;
    if (netAcc < 1 / NET_HZ) return;
    netAcc = 0;
    if (!netSend) return;

    const snap = {
      t: 'snap',
      sd: sides,
      ph: state === 'roundOver' ? 'roundOver' : 'playing',
      cd: r2(countdown),
      mp: mapIndex,                                   // 当前地图序号（访客据此换图）
      sc: [scores[0], scores[1], scores[2]],
      tk: tanks.map(tankSnap),
      bl: bullets.map(function (b) {
        return [b.id, r1(b.x), r1(b.y), Math.round(b.vx), Math.round(b.vy), b.owner, BULLET_CODES[b.kind] || 0];
      }),
      it: items.map(function (it) { return [r1(it.x), r1(it.y), ITEM_TYPES.indexOf(it.type)]; }),
      bm: beams.map(function (b) {
        return [r1(b.x), r1(b.y), r2(b.a), Math.round(b.len), b.owner, r2(b.age)];
      }),
      mn: mines.map(function (m) {
        return [r1(m.x), r1(m.y), m.revealed ? 1 : 0, r2(mineAlpha(m))];
      }),
      pn: (state === 'roundOver' && panelVisible) ? 1 : 0,
      w: pendingWinner,
      ev: netEvents
    };

    netEvents = [];
    netSend(snap);
  }

  // 地雷当前的可见度：被踩中过 → 一直显形；否则停下后 1 秒内淡出
  function mineAlpha(m) {
    if (m.revealed) return 1;
    if (m.alpha !== undefined) return m.alpha;     // 访客端由快照直接给
    if (m.phase === 'slide') return 1;
    const k = 1 - (m.hideT || 0) / MINE_HIDE_DELAY;
    return k < 0 ? 0 : k;
  }

  function resetNetState() {
    netClock = 0;
    netAcc = 0;
    netEvents = [];
    tankKeys = [[], [], []];
    bulletKeys = {};
    trailStore = {};
    guestPanelShown = false;
    items = [];
    mines = [];
    beams = [];
    itemTimer = ITEM_INTERVAL;
    guestInputs = [blankInput(), blankInput(), blankInput()];
  }

  // 开局面板里的键位卡：本地双人显示两套键位，单人模式把蓝方差换成电脑说明
  function paintKeyCards(solo) {
    const box = document.getElementById('ovKeys');
    if (!box || typeof box.querySelector !== 'function') return;
    const c1 = box.querySelector('.card.p1');
    const c2 = box.querySelector('.card.p2');
    if (!c1 || !c2) return;
    if (solo) {
      c1.innerHTML =
        '<b>你 · 红方</b>' +
        '<span><kbd>W</kbd><kbd>S</kbd> / <kbd>↑</kbd><kbd>↓</kbd> 前进 · 倒车</span>' +
        '<span><kbd>A</kbd><kbd>D</kbd> / <kbd>←</kbd><kbd>→</kbd> 左转 · 右转</span>' +
        '<span><kbd>空格</kbd> / <kbd>J</kbd> 开火</span>';
      c2.innerHTML =
        '<b>电脑 · 蓝方</b>' +
        '<span>按最短路线找你 · 会绕墙包抄</span>' +
        '<span>会算反弹弹道 · 隔墙照样打你</span>' +
        '<span>盯着你的子弹侧身躲 · 贴脸才好打</span>';
    } else if (duelTouch) {
      // 手机双人同屏：共用一张地图，上下两条操作键
      c1.innerHTML =
        '<b>红方 · P1（下侧）</b>' +
        '<span>左下 <kbd>摇杆</kbd> 推哪个方向就往哪开</span>' +
        '<span>右下 <kbd>开火</kbd> 按住连发</span>' +
        '<span>两键中间写着「红方操控键」</span>';
      c2.innerHTML =
        '<b>蓝方 · P2（上侧）</b>' +
        '<span>右上 <kbd>摇杆</kbd> 推哪个方向就往哪开</span>' +
        '<span>左上 <kbd>开火</kbd> 按住连发</span>' +
        '<span>两键中间写着「蓝方操控键」，字是倒的</span>';
    } else {
      c1.innerHTML =
        '<b>红方 · P1</b>' +
        '<span><kbd>W</kbd><kbd>S</kbd> 前进 / 倒车</span>' +
        '<span><kbd>A</kbd><kbd>D</kbd> 左转 / 右转</span>' +
        '<span><kbd>空格</kbd> / <kbd>J</kbd> 开火</span>';
      c2.innerHTML =
        '<b>蓝方 · P2</b>' +
        '<span><kbd>↑</kbd><kbd>↓</kbd> 前进 / 倒车</span>' +
        '<span><kbd>←</kbd><kbd>→</kbd> 左转 / 右转</span>' +
        '<span><kbd>/</kbd> / <kbd>小键盘 0</kbd> 开火</span>';
    }
  }

  function showStartPanel() {
    paintKeyCards(false);
    showOverlay({
      kicker: duelTouch ? '双人游戏 · 同屏对战' : '双人游戏 · Duo Battle',
      title: '坦克动荡',
      desc: (duelTouch
        ? '两人共用<b>中间这一张地图</b>：你在下侧、对面那位在上侧，各有一条操作键，两条键中间分别写着「红方操控键」/「蓝方操控键」（蓝方那一行字是倒的，他倒着看正好）。摇杆<b>推哪个方向，车就往哪个方向开</b>，两个人规则完全一样。左侧空白处有两排比分，一人看一排。<b>此模式推荐平板操作</b>，屏幕大一些两人都看得清。<br />'
        : '两人同屏对战，键盘左右分区：红方 WASD，蓝方方向键。<br />')
        + '炮口始终朝向车头，靠转向瞄准。<br />子弹会一直反弹（不限次数），小心自己的跳弹。<br />炮弹无限、每 8 秒自行消失，但同时最多 <b>4 颗</b>在场上（HUD 小弹头就是剩余弹药），两炮之间至少隔 0.35 秒。<br />每 15 秒从道具池（<b>激光 / 护盾 / 地雷 / 霰弹枪 / 能量电子炮</b>）随机刷一个：捡到后开火即用。<br />双人游戏<b>没有隐身技能</b>，双方始终看得见对方。<br />每局结束自动续局并<b>随机换一张地图</b>（双人 4 张 / 三人 4 张），比分累积不封顶。',
      showKeys: true,
      hint: '点击<em>屏幕</em>开始对战'
    });
  }

  // 单人模式的开局面板：只介绍「你和电脑」，不提第二套键位
  function showSoloStartPanel() {
    paintKeyCards(true);
    showOverlay({
      kicker: 'Solo Battle · 人机对战',
      title: '坦克动荡',
      desc: '你开红方，电脑开蓝方。<br />炮口始终朝向车头，靠转向瞄准；子弹会一直反弹（不限次数），小心自己的跳弹。<br />炮弹无限、每 8 秒自行消失，但同时最多 <b>4 颗</b>在场上（HUD 小弹头就是剩余弹药），两炮之间至少隔 0.35 秒。<br />场上每 15 秒刷一个<b>激光道具</b>（单人模式只保留这一种）：速度约普通弹 3 倍、一发打掉 <b>2 滴血</b>，用完就没了——电脑也会跟你抢。<br />电脑会沿最短路线逼近、<b>算好反弹角度隔墙打你</b>，还会盯着飞来的子弹<b>侧身躲</b>；它转身和反应需要时间，<b>贴身近战</b>是你的机会。<br />单人模式<b>没有隐身技能</b>，双方始终看得见对方。<br />每局结束自动续局并<b>随机换一张地图</b>（双人 4 张），比分累积不封顶。',
      showKeys: true,
      hint: '点击<em>屏幕</em>开始对战'
    });
  }

  /* 对外接口：大厅（lobby.js）通过它切换模式 */
  window.TANK_GAME = {
    getMode: function () { return mode; },
    getState: function () { return state; },
    getMenuOpen: function () { return menuOpen; },

    // 触屏相关：设备判定结果、当前是否显示摇杆、强制开关（测试用）
    isTouchDevice: function () { return TOUCH_DEVICE; },
    isTouchActive: function () { return touchActive; },
    isDuelTouch: function () { return duelTouch; },
    setTouch: function (on) { forceTouch(on); },

    // 大厅注册：点击「返回主界面」时真正执行的跳转
    setExitHandler: function (fn) { exitHandler = fn; },

    // 供外部（大厅按钮 / 快捷键）直接请求返回主界面
    requestHome: function () { requestHome(); },

    // 测试用：某个座位「辅助瞄准」的可见度（0 = 对当前视角完全不可见）
    sightAlphaAt: function (id) {
      return tanks[id] ? tankAlpha(tanks[id]) : 0;
    },

    // 测试用：直接在指定坐标放一个道具（真实对局里由 15 秒刷新产生）
    dropItem: function (x, y, type) {
      const t = (type && ITEM_TYPES.indexOf(type) >= 0) ? type : 'laser';
      items.push({ id: ++itemSeq, x: +x || 0, y: +y || 0, type: t, born: 1.5 });
    },

    // 测试用：立刻刷一个指定类型的道具
    spawnItem: function (type) { spawnItem(type); },

    // 测试用：按当前模式的道具池随机抽一个类型（不落地，用来核对池子里有哪些东西）
    rollItemType: function () {
      const p = itemPool();
      return p[(Math.random() * p.length) | 0];
    },

    // 测试用：清空场上所有子弹（子弹不再因反弹次数消失，容易攒满 4 颗名额）
    clearBullets: function () { bullets.length = 0; },

    // 测试用：这个点会不会撞墙（检查 AI 有没有穿墙 / 卡进格子里）
    wallAt: function (x, y) { return rectHitsWall(+x || 0, +y || 0, TANK_HALF); },

    // 测试用：直接扣某辆坦克的血（用来快速验证回合结算与续局）
    hurtTank: function (id, dmg) {
      const t = tanks[id | 0];
      if (!t || !t.active || !t.alive) return false;
      damage(t, { x: t.x, y: t.y, dmg: dmg || 1 });
      return true;
    },

    // 测试用：把某辆坦克直接摆到指定位置 / 朝向
    placeTank: function (id, x, y, angle) {
      const t = tanks[id | 0];
      if (!t) return false;
      t.x = +x || 0;
      t.y = +y || 0;
      if (angle !== undefined) t.angle = +angle || 0;
      t.input.aim = null;
      t.input.throttle = 0;
      t.input.forward = 0;
      t.input.back = 0;
      t.input.ccw = 0;
      t.input.cw = 0;
      return true;
    },

    // 测试用：凭空打一颗子弹（验证 AI 的规避）
    fireTestBullet: function (x, y, angle, owner) {
      const a = +angle || 0;
      bullets.push({
        id: ++bulletSeq,
        kind: 'bullet',
        x: +x || 0,
        y: +y || 0,
        vx: Math.cos(a) * BULLET_SPEED,
        vy: Math.sin(a) * BULLET_SPEED,
        r: BULLET_R,
        owner: (owner === undefined ? 0 : owner | 0),
        age: 1,
        dmg: 1,
        maxBounce: MAX_BOUNCE,
        color: '#ffffff',
        bounces: 0,
        life: BULLET_LIFE,
        trail: []
      });
    },

    // 测试用：AI 现在算出来的「能命中玩家」的弹道（null = 找不到）
    aiShotInfo: function () {
      const me = tanks[1];
      const foe = tanks[0];
      if (!me || !foe) return null;
      const s = aiFindShot(me, foe);
      return s ? { angle: r2(s.angle), t: r2(s.t), bounces: s.bounces, burst: s.burst } : null;
    },

    // 测试用：强制让电脑「卡住」一次，用来验证脱困时的后退距离
    forceStuck: function () { aiSt.stuckT = 1; },

    // 测试用：一颗子弹会不会打中指定坦克（内部模拟，返回秒数或 -1）
    simThreat: function (bx, by, angle, id) {
      const t = tanks[id | 0];
      if (!t) return -1;
      const b = {
        x: +bx || 0, y: +by || 0,
        vx: Math.cos(+angle || 0) * BULLET_SPEED,
        vy: Math.sin(+angle || 0) * BULLET_SPEED,
        r: BULLET_R, maxBounce: MAX_BOUNCE
      };
      const r = aiSimThreat(b, t, AI_LOOK);
      return r ? r2(r.t) : -1;
    },

    // 单人模式：电脑当前的行为状态（fight / dodge / grab / search / patrol）
    getAiMode: function () { return mode === 'solo' ? aiSt.mode : null; },

    // 调试用：电脑内部状态快照
    aiDebug: function () {
      const me = tanks[1];
      return {
        mode: aiSt.mode,
        state: aiSt.state,                    // free = 未受威胁 / dodge = 躲避
        route: aiSt.pathLen,
        routePts: aiSt.route.pts.length,      // 当前路线折线有几个点
        replans: aiSt.replans,                // 一共重建过几次路线
        backing: aiSt.backing,                // 这一帧在不在倒车
        dd: aiSt.dodgeDir === null ? null : r2(aiSt.dodgeDir),   // 躲的方向
        stuck: r2(aiSt.stuckT),
        thr: r2(aiSt.throttle),
        inBack: me ? r2(me.input.back || 0) : 0,   // 这一帧写进去的倒车 / 打方向
        inCw: me ? r2(me.input.cw || 0) : 0,
        inCcw: me ? r2(me.input.ccw || 0) : 0,
        fireT: r2(aiSt.fireT),
        err: r2(aiSt.err),
        inT: r2(aiSt.inT),
        back: r2(aiSt.lastBackDist),
        shot: aiSt.shot ? { a: r2(aiSt.shot.angle), t: r2(aiSt.shot.t), b: aiSt.shot.bounces } : null,
        aim: me ? r2(me.input.aim === null ? 99 : me.input.aim) : null,
        angle: me ? r2(me.angle) : null,
        cd: me ? r2(me.cd) : null,
        los: !!(tanks[0] && aiLineClear(me.x, me.y, tanks[0].x, tanks[0].y))
      };
    },

    /* ---- 地图 ---- */
    getMapIndex: function () { return mapIndex; },
    getMapName: function () { return MAP_NAME; },
    // 测试用：当前地图的尺寸信息
    mapInfo: function () {
      return { w: W, h: H, tile: TILE, cols: COLS, rows: ROWS, index: mapIndex };
    },
    getMapCount: function (n) { return mapPack(n === 3 ? 3 : 2).length; },
    getMapNames: function (n) { return mapPack(n === 3 ? 3 : 2).map(function (m) { return m.name; }); },
    // 点名换图（人数不变）
    setMap: function (idx) { applyMap(sides, idx); },
    // 立刻随机换一张
    rollMap: function () { return rollMap(); },
    // 关掉「每局结束随机换图」（测试要固定坐标时用）
    setMapRotation: function (on) {
      mapRotation = !!on;
      if (!mapRotation) needMapRoll = false;
      return mapRotation;
    },
    isMapRotationOn: function () { return mapRotation; },

    // 本地双人：回到开局面板（手机上会切成「单地图居中 + 上下两条操作键」）
    startLocal: function () {
      mode = 'local';
      netSend = null;
      needMapRoll = true;
      setSides(2);
      applyKeyset();
      setTouchMode(true);
      resetNetState();
      menuOpen = false;
      scores = [0, 0, 0];
      bullets.length = 0;
      beams.length = 0;
      particles.length = 0;
      mines.length = 0;
      items.length = 0;
      overlayTimer = 0;
      pendingOverlay = null;
      roundTimer = 0;
      awardTimer = 0;
      pendingWinner = -1;
      resetTanks();
      state = 'ready';
      countdown = 0;
      updateHud();
      showStartPanel();
    },

    // 单人模式：玩家开红方、电脑开蓝方，回到开局面板
    startSolo: function () {
      mode = 'solo';
      netSend = null;
      needMapRoll = true;
      setSides(2);
      applyKeyset();
      setTouchMode(true);          // 手机也能单人玩，摇杆开红方
      resetNetState();
      menuOpen = false;
      scores = [0, 0, 0];
      bullets.length = 0;
      beams.length = 0;
      particles.length = 0;
      mines.length = 0;
      items.length = 0;
      overlayTimer = 0;
      pendingOverlay = null;
      roundTimer = 0;
      awardTimer = 0;
      pendingWinner = -1;
      resetTanks();
      aiResetRound();
      state = 'ready';
      countdown = 0;
      updateHud();
      showSoloStartPanel();
    },

    // 联机主机：直接开第一局（n = 本局人数，2 或 3）
    startHost: function (send, n) {
      mode = 'host';
      netSend = send || null;
      needMapRoll = true;
      setSides(n === 3 ? 3 : 2);
      setTouchMode(true);
      resetNetState();
      menuOpen = false;
      scores = [0, 0, 0];
      updateHud();
      startRound();
    },

    // 联机访客：清场等待快照（side = 自己的座位号 1 / 2）
    startGuest: function (send, side, n) {
      mode = 'guest';
      netSend = send || null;
      guestSide = (side === 2 ? 2 : 1);
      setSides(n === 3 ? 3 : 2);
      setTouchMode(true);
      resetNetState();
      menuOpen = false;
      scores = [0, 0, 0];
      bullets.length = 0;
      beams.length = 0;
      particles.length = 0;
      mines.length = 0;
      items.length = 0;
      resetTanks();
      state = 'playing';
      countdown = 0;
      updateHud();
      hideOverlay();
    },

    // 网络消息入口（'start' / 'bye' 之类由大厅处理）
    receive: function (msg) {
      if (!msg || typeof msg !== 'object') return;
      const num = function (v) {
        const n = +v || 0;
        return n <= 0 ? 0 : (n >= 1 ? 1 : n);
      };

      if (msg.t === 'input' && mode === 'host') {
        const side = msg.side === 2 ? 2 : 1;     // 座位号由服务器盖章
        const g = guestInputs[side];
        const k = msg.k || [];
        g.forward = num(k[0]);
        g.back = num(k[1]);
        g.ccw = num(k[2]);
        g.cw = num(k[3]);
        g.fire = !!k[4];
        // 摇杆朝向量：没推时是 null，退回键盘那套输入
        g.aim = (msg.a === null || msg.a === undefined || !isFinite(msg.a)) ? null : wrapPi(+msg.a);
        g.throttle = num(msg.g);
      } else if (msg.t === 'act' && mode === 'host') {
        // 访客按下隐身键：由主机裁决（冷却 / 存活状态都以主机为准）
        const side = msg.side === 2 ? 2 : 1;
        if (tanks[side]) tryInvis(tanks[side]);
      } else if (msg.t === 'snap' && mode === 'guest') {
        applySnapshot(msg);
      }
    },

    // 对端离开 / 断线：冻结画面
    peerLeft: function () {
      if (mode === 'guest') {
        showOverlay({
          kicker: 'Disconnected',
          title: '主机已离开',
          desc: '连接已断开，请回到主界面重新创建房间。',
          showKeys: false,
          hint: '按 <em>Esc</em> 返回主界面',
          actions: [
            { label: '返回主界面', kind: 'primary', onClick: exitToMenu }
          ]
        });
      }
    },

    // 只读状态快照（调试 / 自动化测试用）
    snapshot: function () {
      return {
        mode: mode,
        state: state,
        countdown: countdown,
        sides: sides,
        guestSide: guestSide,
        mapIndex: mapIndex,
        mapName: MAP_NAME,
        scores: scores.slice(),
        tanks: tanks.map(function (t) {
          return {
            x: t.x, y: t.y, a: t.angle, hp: t.hp, alive: t.alive, active: t.active,
            firing: t.firing, aim: t.input.aim, thr: t.input.throttle,
            weapon: t.weapon, charges: t.charges,
            shield: t.shield, shieldUsed: t.shieldUsed,
            invis: t.invis, invisCd: t.invisCd, charge: t.charge
          };
        }),
        bullets: bullets.map(function (b) {
          return { x: b.x, y: b.y, vx: b.vx, vy: b.vy, owner: b.owner, kind: b.kind, dmg: b.dmg, r: b.r };
        }),
        items: items.map(function (it) { return { x: it.x, y: it.y, type: it.type }; }),
        mines: mines.map(function (m) {
          return { x: m.x, y: m.y, phase: m.phase, revealed: !!m.revealed, alpha: mineAlpha(m), owner: m.owner };
        }),
        beams: beams.map(function (b) {
          return { x: b.x, y: b.y, x2: b.x2, y2: b.y2, a: b.a, len: b.len, age: b.age, owner: b.owner };
        }),
        itemTimer: itemTimer,
        ai: mode === 'solo'
          ? { mode: aiSt.mode, route: aiSt.pathLen, incoming: r2(aiSt.inT), err: r2(aiSt.err), jitter: r2(aiCfg.jitter) }
          : null
      };
    }
  };

  /* ---------------------------------------------------------
   * 10. HUD / 遮罩
   * ------------------------------------------------------- */
  const hudEl = document.getElementById('hud');
  const hpEls = [];
  const ammoEls = [];
  const scoreEls = [];
  const cardEls = [];
  const wpnEls = [];
  for (let i = 1; i <= 3; i++) {
    hpEls.push(document.getElementById('hp' + i));
    ammoEls.push(document.getElementById('ammo' + i));
    scoreEls.push(document.getElementById('score' + i));
    cardEls.push(document.getElementById('pcard' + i));
    wpnEls.push(document.getElementById('wpn' + i));
  }
  const scoreBoxes = [
    document.getElementById('box1'),
    document.getElementById('box2'),
    document.getElementById('box3')
  ];
  // 双人同屏：左侧两排比分（上排倒转给蓝方看，下排正着给红方看）
  const dsCardA = document.getElementById('dsCardA');
  const dsCardB = document.getElementById('dsCardB');
  // 双人同屏：开火键旁边的血量 / 弹夹（红方在开火键左侧，蓝方在右侧且整体倒转）
  const psHpEls = [document.getElementById('psHp1'), document.getElementById('psHp2')];
  const psAmmoEls = [document.getElementById('psAmmo1'), document.getElementById('psAmmo2')];

  const overlayEl = document.getElementById('overlay');
  const ovKicker = document.getElementById('ovKicker');
  const ovTitle = document.getElementById('ovTitle');
  const ovDesc = document.getElementById('ovDesc');
  const ovKeys = document.getElementById('ovKeys');
  const ovHint = document.getElementById('ovHint');
  const ovBtns = document.getElementById('ovBtns');

  const HEART_PATH = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-8.4-5.35-10.2-10.2C.6 6.9 3.2 3.6 6.9 3.6c2.2 0 3.9 1.2 5.1 2.8 1.2-1.6 2.9-2.8 5.1-2.8 3.7 0 6.3 3.3 5.1 7.2C20.4 15.65 12 21 12 21z"/></svg>';

  function renderHearts(el, hp, color) {
    let html = '';
    for (let i = 0; i < MAX_HP; i++) {
      const cls = i < hp ? 'heart' : 'heart off';
      html += '<span class="' + cls + '" style="color:' + color + '">' + HEART_PATH + '</span>';
    }
    el.innerHTML = html;
  }

  /* 双人同屏的比分：模板固定「红方 比 蓝方」，红方数字红、蓝方数字蓝。
     同一份内容写进两块卡片，其中上面那块 CSS 转了 180°，倒着看才是正的。 */
  let dsHtml = '';
  function paintDuelScores() {
    if (!dsCardA) return;
    const r = scores[0] || 0;
    const b = scores[1] || 0;
    const html =
      '<span class="who r">红方</span>' +
      '<span class="num"><i class="r">' + r + '</i><em>:</em><i class="b">' + b + '</i></span>' +
      '<span class="who b">蓝方</span>';
    if (html === dsHtml) return;
    dsHtml = html;
    dsCardA.innerHTML = html;
    if (dsCardB) dsCardB.innerHTML = html;
  }

  /* 双人同屏的「血量 + 弹夹」：贴在各自开火键旁边，红方正着、蓝方整块倒转。
     血量画成三颗心（掉血变暗），弹夹画成四颗小弹头（场上自弹越多亮的越少）。 */
  function paintPadStats() {
    for (let i = 0; i < 2; i++) {
      const t = tanks[i];
      if (psHpEls[i] && t) renderHearts(psHpEls[i], t.hp, PALETTES[i].main);
      if (psAmmoEls[i]) {
        const left = ammoLeft[i] >= 0 ? ammoLeft[i] : MAX_OWN_BULLETS;
        renderAmmo(psAmmoEls[i], left);
      }
    }
  }

  function updateHud() {
    for (let i = 0; i < MAX_SIDES; i++) {
      if (hpEls[i]) renderHearts(hpEls[i], tanks[i].hp, PALETTES[i].main);
      if (scoreEls[i]) scoreEls[i].textContent = scores[i];
    }
    paintPadStats();
    updateHudChrome();
    updateAmmo(true);
    updateChips(true);
    paintDuelScores();
  }

  // 双人时藏掉第三张卡，三人时显示
  let hudSoloLook = null;
  function updateHudChrome() {
    if (hudEl) hudEl.classList.toggle('three', sides === 3);
    if (cardEls[2]) cardEls[2].style.display = sides === 3 ? '' : 'none';

    // 单人模式：蓝方那张卡直接标成「电脑」，别让人以为对面坐着个人
    const solo = mode === 'solo';
    if (solo !== hudSoloLook) {
      hudSoloLook = solo;
      const pick = function (el, sel) {
        return (el && typeof el.querySelector === 'function') ? el.querySelector(sel) : null;
      };
      const t1 = pick(cardEls[0], '.tag');
      const n1 = pick(cardEls[0], '.name');
      const t2 = pick(cardEls[1], '.tag');
      const n2 = pick(cardEls[1], '.name');
      if (t1) t1.textContent = solo ? 'YOU' : 'P1';
      if (n1) n1.textContent = '红方';
      if (t2) t2.textContent = solo ? 'CPU' : 'P2';
      if (n2) n2.textContent = solo ? '电脑' : '蓝方';
    }
  }

  /* 弹药指示：每方 5 颗小弹头，亮的数量 = 还能再发射几颗
     （场上自己的子弹越多，亮的越少；全部熄灭就是「暂时不能发射」） */
  var ammoLeft = [-1, -1, -1];

  function renderAmmo(el, left) {
    if (!el) return;
    let html = '';
    for (let i = 0; i < MAX_OWN_BULLETS; i++) {
      html += '<i class="' + (i < left ? 'on' : 'off') + '"></i>';
    }
    el.innerHTML = html;
    if (el.classList) el.classList.toggle('empty', left <= 0);
  }

  function updateAmmo(force) {
    const cnt = [0, 0, 0];
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (b.kind !== 'bullet') continue;   // 激光 / 霰弹 / 飞镖不占 5 颗名额
      const o = b.owner;
      if (o >= 0 && o < MAX_SIDES) cnt[o]++;
    }
    for (let s = 0; s < MAX_SIDES; s++) {
      const left = Math.max(0, MAX_OWN_BULLETS - cnt[s]);
      if (!force && left === ammoLeft[s]) continue;
      ammoLeft[s] = left;
      renderAmmo(ammoEls[s], left);
      renderAmmo(psAmmoEls[s], left);   // 双人同屏那份「开火键旁的弹夹」
    }
  }

  /* 状态小标签：手上的武器 / 护盾 / 隐身 */
  const chipCache = ['', '', ''];

  function chipHtml(t) {
    // 联机时别人隐身：他的武器 / 隐身计时一律不显示，别把「有人隐身了」写在对面脸上
    if (mode !== 'local' && t.invis > 0 && t.id !== mySide()) return '';
    let html = '';
    if (t.charge > 0) html += '<i class="w charge">聚能 ' + (Math.ceil(t.charge * 10) / 10).toFixed(1) + 's</i>';
    if (t.weapon === 'laser') html += '<i class="w laser">激光</i>';
    else if (t.weapon === 'shotgun') html += '<i class="w shot">霰弹 ×' + t.charges + '</i>';
    else if (t.weapon === 'mine') html += '<i class="w mine">地雷 ×' + t.charges + '</i>';
    else if (t.weapon === 'cannon') html += '<i class="w cannon">电子炮</i>';
    if (t.shield > 0) html += '<i class="w shield">护盾 ' + Math.ceil(t.shield) + 's</i>';
    // 单人 / 双人模式没有隐身技能，HUD 里不占位置
    if (!invisOff()) {
      if (t.invis > 0) html += '<i class="w invis">隐身 ' + Math.ceil(t.invis) + 's</i>';
      else if (t.invisCd > 0) html += '<i class="w cd">隐身 ' + Math.ceil(t.invisCd) + 's</i>';
      else html += '<i class="w ready">隐身就绪</i>';
    }
    return html;
  }

  /* 触屏操控状态：双人同屏时上下各一套（pad1 给红方，pad2 给蓝方） */
  let duelTouch = false;          // 手机 / 平板上的双人同屏（单地图 + 上下两条操作键）
  let pad1Side = null;            // null = 跟随 localTank()；0 / 1 = 固定操纵这一方
  let pad2Side = null;

  function tankForPad(side) {
    if (side === null || side === undefined) return localTank();
    return tanks[side] || null;
  }

  /* 触屏「隐身」按钮：就绪 / 隐身中 / 冷却中三种状态，跟着技能实时变 */
  let invisEls = null;
  const invisKeys = ['', ''];

  function paintInvisBtn(el, t, idx) {
    if (!el) return;
    // 单人模式不提供隐身：按钮直接藏起来，也不用再刷状态
    if (invisOff()) {
      if (invisKeys[idx] !== 'hidden') {
        invisKeys[idx] = 'hidden';
        el.style.display = 'none';
      }
      return;
    }
    if (invisKeys[idx] === 'hidden') {
      invisKeys[idx] = '';
      el.style.display = '';
    }
    let key = 'off', label = '隐身', cls = 'skill-btn cool';
    if (t) {
      if (t.invis > 0) {
        key = 'on' + Math.ceil(t.invis);
        label = '隐身 ' + Math.ceil(t.invis) + 's';
        cls = 'skill-btn on';
      } else if (t.invisCd > 0) {
        key = 'cd' + Math.ceil(t.invisCd);
        label = Math.ceil(t.invisCd) + 's';
        cls = 'skill-btn cool';
      } else {
        key = 'ready';
        cls = 'skill-btn';
      }
    }
    if (key === invisKeys[idx]) return;
    invisKeys[idx] = key;
    el.textContent = label;
    el.className = cls;
  }

  function updateInvisBtn() {
    if (invisEls === null) {
      invisEls = [document.getElementById('invisBtn'), document.getElementById('invisBtn2')];
    }
    paintInvisBtn(invisEls[0], tankForPad(pad1Side), 0);
    paintInvisBtn(invisEls[1], pad2Side === null ? null : tankForPad(pad2Side), 1);
  }

  function updateChips(force) {
    for (let i = 0; i < sides; i++) {
      const el = wpnEls[i];
      if (!el) continue;
      const html = chipHtml(tanks[i]);
      if (!force && html === chipCache[i]) continue;
      chipCache[i] = html;
      el.innerHTML = html;
    }
    updateInvisBtn();
  }

  // 面板底部按钮组：actions = [{ label, kind: 'primary', onClick }]
  function setPanelActions(actions) {
    if (!ovBtns) return;
    ovBtns.innerHTML = '';
    if (!actions || !actions.length) {
      ovBtns.hidden = true;
      return;
    }
    for (let i = 0; i < actions.length; i++) {
      (function (a) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pbtn' + (a.kind === 'primary' ? ' primary' : '');
        b.textContent = a.label;
        b.addEventListener('click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          if (typeof a.onClick === 'function') a.onClick();
        });
        ovBtns.appendChild(b);
      })(actions[i]);
    }
    ovBtns.hidden = false;
  }

  function showOverlay(opt) {
    ovKicker.textContent = opt.kicker || '';
    ovTitle.textContent = opt.title || '';
    ovDesc.innerHTML = opt.desc || '';
    ovKeys.style.display = opt.showKeys === false ? 'none' : 'grid';
    ovHint.innerHTML = opt.hint || '';
    setPanelActions(opt.actions);
    overlayEl.classList.remove('hidden');
    panelVisible = true;
  }

  function hideOverlay() {
    overlayEl.classList.add('hidden');
    panelVisible = false;
    setPanelActions(null);
    // 双人同屏：面板挡住了提示，等真正开打再把「推荐平板」亮出来（每进入一次模式只亮一次）
    if (duelTouch && !duelTipShown) {
      duelTipShown = true;
      showDuelTip();
    }
  }

  /* 点击屏幕开始 / 继续：手机没有键盘，面板上任何空白处（以及战场）点一下即可
   *   只接管「等开局 / 结算 / 暂停 / 返回确认」这几种面板，按钮自己处理点击 */
  if (overlayEl && overlayEl.addEventListener) {
    overlayEl.addEventListener('click', function (e) {
      if (!panelVisible) return;
      const t = e.target;
      if (t && t.closest && t.closest('button, a, input, .pbtn')) return;
      primeAudio();
      if (menuOpen) {
        resumeGame();
        return;
      }
      if (state === 'ready' || state === 'roundOver' || state === 'paused') advance();
    });
  }

  /* ---------------------------------------------------------
   * 10.1 返回主界面（模式选择）
   * ------------------------------------------------------- */

  // 继续对战：恢复运行并收起面板
  function resumeGame() {
    menuOpen = false;
    if (state === 'paused') state = 'playing';
    hideOverlay();
  }

  // 真正离开：交给大厅去切换界面（没注册时退化为本地开局）
  function exitToMenu() {
    menuOpen = false;
    if (mode !== 'local') netSend = null;
    if (typeof exitHandler === 'function') {
      exitHandler();
      return;
    }
    // 兜底：没有大厅时退回本地开始面板
    window.TANK_GAME.startLocal();
  }

  function openMenu() {
    // 本地 / 单人模式会真正暂停；联机保持运行，仅清空自己的输入避免面板后面乱走
    const canPause = (mode === 'local' || mode === 'solo') && state === 'playing';
    if (canPause) state = 'paused';
    if (mode === 'guest') {
      resetInput(tanks[1]);
      tanks[1].firing = false;
      guestSendInput();
    } else {
      tanks.forEach(function (t) { resetInput(t); t.firing = false; });
    }

    let desc;
    let hint = '';
    if (mode === 'guest') {
      desc = '你正在联机对局中，返回主界面会退出房间，对手将收到离开提示。';
      hint = '联机不暂停，对局仍在继续';
    } else if (mode === 'host') {
      desc = '你是房间主机，返回主界面会关闭房间，对手将收到离开提示。';
      hint = '联机不暂停，对局仍在继续';
    } else {
      desc = '当前对局会结束（比分不保留），可以在主界面重新选择模式。';
    }

    menuOpen = true;
    showOverlay({
      kicker: 'Menu',
      title: '返回主界面？',
      desc: desc,
      showKeys: false,
      hint: hint,
      actions: [
        { label: '继续对战', kind: 'primary', onClick: resumeGame },
        { label: '返回主界面', onClick: exitToMenu }
      ]
    });
  }

  // 请求返回：对局进行中先弹确认面板，其余情况（开局/结算）直接回主界面
  function requestHome() {
    primeAudio();
    if (state === 'playing' && !menuOpen) {
      openMenu();
      return;
    }
    exitToMenu();
  }

  /* ---------------------------------------------------------
   * 11. 绘制
   * ------------------------------------------------------- */
  function drawSpawnMarkers() {
    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      const p = t.palette;
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = p.main;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(t.spawn.x, t.spawn.y, 17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = p.main;
      ctx.beginPath();
      ctx.arc(t.spawn.x, t.spawn.y, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 地图上的道具：地面光晕 + 旋转外框 + 各自的图标
  const ITEM_STYLE = {
    laser: { glow: 'rgba(150,245,255,.42)', mid: 'rgba(120,220,255,.16)', line: 'rgba(175,248,255,.9)', fill: 'rgba(130,240,255,.16)' },
    shield: { glow: 'rgba(150,215,255,.40)', mid: 'rgba(120,180,255,.16)', line: 'rgba(190,225,255,.9)', fill: 'rgba(140,190,255,.16)' },
    mine: { glow: 'rgba(255,165,110,.38)', mid: 'rgba(255,140,80,.15)', line: 'rgba(255,190,140,.9)', fill: 'rgba(255,150,90,.16)' },
    shotgun: { glow: 'rgba(255,214,120,.38)', mid: 'rgba(255,190,90,.15)', line: 'rgba(255,224,150,.9)', fill: 'rgba(255,200,110,.16)' },
    cannon: { glow: 'rgba(180,160,255,.42)', mid: 'rgba(140,110,255,.16)', line: 'rgba(216,206,255,.95)', fill: 'rgba(170,150,255,.18)' }
  };

  function drawItems() {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const grow = Math.min(1, it.born / 0.32);
      const pulse = 0.5 + 0.5 * Math.sin(clock * 3.2 + it.id);
      const st = ITEM_STYLE[it.type] || ITEM_STYLE.laser;

      ctx.save();
      ctx.translate(it.x, it.y);

      // 地面光晕
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 23);
      g.addColorStop(0, st.glow);
      g.addColorStop(0.5, st.mid);
      g.addColorStop(1, 'rgba(120,220,255,0)');
      ctx.globalAlpha = (0.55 + 0.3 * pulse) * grow;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 23, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = grow;

      // 旋转外框（六边形）
      ctx.rotate(clock * 1.15);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3;
        const rr = 13 + pulse * 1.6;
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = st.fill;
      ctx.fill();
      ctx.strokeStyle = st.line;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.rotate(-clock * 1.15);

      ctx.globalAlpha = 0.6 + 0.4 * pulse;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (it.type === 'shield') {
        // 护盾：一个半圆罩 + 底边
        ctx.strokeStyle = '#dff0ff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 1, 8, Math.PI, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = (0.6 + 0.4 * pulse) * 0.35;
        ctx.fillStyle = '#bfe0ff';
        ctx.fill();
      } else if (it.type === 'mine') {
        // 地雷：深色圆饼 + 一圈尖刺 + 中心红点（和黄色的霰弹一眼就能分开）
        ctx.fillStyle = '#452618';
        ctx.beginPath();
        ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff8a5c';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#ff9a5a';
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = k * Math.PI / 3 + Math.PI / 6;
          ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
          ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
        }
        ctx.stroke();
        ctx.fillStyle = '#ff5a3c';
        ctx.beginPath();
        ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (it.type === 'cannon') {
        // 能量电子炮：两条向内汇聚的箭头 + 中间一条亮线（暗示「聚能后打一条贯穿线」）
        ctx.strokeStyle = '#ece4ff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-10, -7);
        ctx.lineTo(-2.4, -1.8);
        ctx.moveTo(-10, 7);
        ctx.lineTo(-2.4, 1.8);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-1.6, 0);
        ctx.lineTo(8.4, 0);
        ctx.stroke();
        ctx.fillStyle = '#c9b8ff';
        ctx.beginPath();
        ctx.arc(9.8, 0, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(9.8, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (it.type === 'shotgun') {
        // 霰弹枪：三颗小弹丸扇形
        ctx.fillStyle = '#ffe0a0';
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath();
          ctx.arc(k * 4.6, Math.abs(k) * 3.4 - 1.5, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = '#fff2d0';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-8, 6.5);
        ctx.lineTo(8, 6.5);
        ctx.stroke();
      } else {
        // 激光：横杠 + 核心光点
        ctx.strokeStyle = '#d8fbff';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(140,244,255,.85)';
        ctx.beginPath();
        ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // 地上的地雷：滑行 / 落位淡出 / 被踩中后红光闪烁
  function drawMines() {
    for (let i = 0; i < mines.length; i++) {
      const m = mines[i];
      const a = mineAlpha(m);
      if (a <= 0.01) continue;

      const flash = m.revealed ? (0.55 + 0.45 * Math.sin(clock * 16)) : 0;

      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.globalAlpha = a;

      // 底盘
      ctx.fillStyle = '#2a1d16';
      ctx.beginPath();
      ctx.arc(0, 0, MINE_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = m.revealed ? 'rgba(255,90,70,' + (0.5 + flash * 0.5) + ')' : 'rgba(255,170,110,.75)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // 尖刺
      ctx.strokeStyle = 'rgba(255,190,140,.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = k * Math.PI / 3 + clock * 0.6;
        ctx.moveTo(Math.cos(ang) * (MINE_R - 2), Math.sin(ang) * (MINE_R - 2));
        ctx.lineTo(Math.cos(ang) * (MINE_R + 3), Math.sin(ang) * (MINE_R + 3));
      }
      ctx.stroke();

      // 核心：被踩中时红光狂闪
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, MINE_R);
      core.addColorStop(0, m.revealed ? '#ff5a3c' : '#ff9a5a');
      core.addColorStop(1, 'rgba(120,40,20,.2)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, MINE_R - 2.5, 0, Math.PI * 2);
      ctx.fill();

      if (m.revealed) {
        ctx.globalAlpha = a * (0.35 + flash * 0.65);
        ctx.strokeStyle = '#ff4b32';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, MINE_R + 5.5 + flash * 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // 待发射状态：炮口前方一段微弱闪烁的预瞄。
  // 隐身时这套辅助线要跟着坦克一起隐藏 —— 自己看得见（变浅），别人完全看不见。
  function drawLaserSights() {
    const flicker = 0.26 + 0.2 * Math.sin(clock * 11.0);
    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      if (!t.active || !t.alive || !t.weapon) continue;

      const vis = tankAlpha(t);
      if (vis <= 0.02) continue;          // 隐身且不是自己：辅助瞄准一并消失

      const cos = Math.cos(t.angle);
      const sin = Math.sin(t.angle);
      const x0 = t.x + cos * (TANK_HALF + 7);
      const y0 = t.y + sin * (TANK_HALF + 7);

      ctx.save();

      if (t.weapon === 'shotgun') {
        // 霰弹枪：画一个 30 度的扇形提示
        ctx.globalAlpha = (0.16 + 0.1 * Math.sin(clock * 6)) * vis;
        ctx.fillStyle = '#ffd479';
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.arc(t.x, t.y, SIGHT_LEN * 0.9, t.angle - SHOTGUN_SPREAD / 2, t.angle + SHOTGUN_SPREAD / 2);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.32 * vis;
        ctx.strokeStyle = '#ffe0a0';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
        continue;
      }

      if (t.weapon === 'mine') {
        // 地雷：车尾一个闪烁的小圈，提示「攻击键往这里丢」
        const bx = t.x - cos * (TANK_HALF + 10);
        const by = t.y - sin * (TANK_HALF + 10);
        ctx.globalAlpha = (0.25 + 0.2 * Math.sin(clock * 8)) * vis;
        ctx.strokeStyle = '#ffb066';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(bx, by, MINE_R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(t.x - cos * (TANK_HALF + 1), t.y - sin * (TANK_HALF + 1));
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        continue;
      }

      if (t.weapon === 'cannon') {
        // 电子炮：一条贯穿全图的细虚线（能穿墙，所以不做墙体截断）
        const reach = beamReach(t.x, t.y, cos, sin);
        ctx.globalAlpha = 0.30 * vis;
        ctx.strokeStyle = '#cbb8ff';
        ctx.lineWidth = 1.3;
        ctx.setLineDash([9, 8]);
        ctx.lineDashOffset = -(clock * 58) % 17;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(t.x + cos * reach, t.y + sin * reach);
        ctx.stroke();
        ctx.setLineDash([]);

        // 车外一圈紫色环，提示「这辆坦克揣着电子炮」
        ctx.globalAlpha = (0.30 + 0.16 * Math.sin(clock * 5.5)) * vis;
        ctx.strokeStyle = '#b9a8ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      // 激光：短距虚线预瞄
      let len = SIGHT_LEN;
      for (let d = 4; d <= SIGHT_LEN; d += 3) {
        if (rectHitsWall(t.x + cos * d, t.y + sin * d, 1)) { len = Math.max(4, d - 3); break; }
      }
      const x1 = t.x + cos * len;
      const y1 = t.y + sin * len;

      // 枪身外一圈冷色环，提示「这辆坦克揣着激光」
      ctx.globalAlpha = (0.30 + 0.16 * Math.sin(clock * 5.5)) * vis;
      ctx.strokeStyle = '#8ff4ff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
      ctx.stroke();

      // 预瞄虚线（带一点流动感）
      ctx.globalAlpha = flicker * vis;
      ctx.strokeStyle = '#9ff8ff';
      ctx.lineWidth = 1.7;
      ctx.setLineDash([SIGHT_DASH, SIGHT_DASH]);
      ctx.lineDashOffset = -(clock * 46) % (SIGHT_DASH * 2);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      // 末端小光点
      ctx.globalAlpha = (flicker + 0.18) * vis;
      ctx.fillStyle = '#d6fbff';
      ctx.beginPath();
      ctx.arc(x1, y1, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 能量电子炮聚能：炮口前方一条直线 + 不断向轴线汇聚的光丝，车身旁边有向内收缩的聚能粒子
  function drawCannonCharges() {
    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      if (!t.active || !t.alive || !(t.charge > 0)) continue;

      const vis = tankAlpha(t);
      if (vis <= 0.02) continue;          // 隐身时聚能光效也只有自己能看到

      const cos = Math.cos(t.angle);
      const sin = Math.sin(t.angle);
      const p = 1 - t.charge / (t.chargeMax || CANNON_CHARGE);   // 0 → 1 越来越亮
      const mx = t.x + cos * (TANK_HALF + 10);
      const my = t.y + sin * (TANK_HALF + 10);
      const far = 42 + 128 * p;           // 汇聚焦点越来越远
      const spread = 22 * (1 - p) + 2;    // 光丝之间的间距越来越窄

      ctx.save();

      // 外面的能量场
      ctx.globalAlpha = 0.14 * vis * (0.6 + p);
      const g = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, 30 + p * 12);
      g.addColorStop(0, 'rgba(200,190,255,.55)');
      g.addColorStop(1, 'rgba(140,110,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 30 + p * 12, 0, Math.PI * 2);
      ctx.fill();

      // 汇聚的光丝：起点在炮口两侧张开，终点收到轴线上
      ctx.strokeStyle = '#ded4ff';
      ctx.lineWidth = 2;
      for (let k = -3; k <= 3; k++) {
        if (k === 0) continue;
        const off = k * spread * 0.42;
        const px = mx - sin * off;
        const py = my + cos * off;
        ctx.globalAlpha = (0.26 + 0.6 * p) * vis;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(mx + cos * far, my + sin * far);
        ctx.stroke();
      }

      // 轴线：随聚能进度越来越粗、越来越亮
      ctx.globalAlpha = (0.45 + 0.5 * p) * vis;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2 + 3.2 * p;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + cos * far, my + sin * far);
      ctx.stroke();

      // 炮口蓄能光球
      ctx.globalAlpha = (0.5 + 0.5 * p) * vis;
      const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 5 + 7 * p);
      mg.addColorStop(0, '#ffffff');
      mg.addColorStop(0.45, 'rgba(175,155,255,.85)');
      mg.addColorStop(1, 'rgba(140,110,255,0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mx, my, 5 + 7 * p, 0, Math.PI * 2);
      ctx.fill();

      // 车身周围的聚能粒子：半径越来越小（往里收）
      for (let k = 0; k < 9; k++) {
        const a = clock * 2.4 + k * (Math.PI * 2 / 9);
        const rr = (1 - p) * 27 + 9 + Math.sin(clock * 9 + k) * 2;
        ctx.globalAlpha = (0.25 + 0.6 * p) * vis * (0.5 + 0.5 * Math.sin(clock * 12 + k * 1.7));
        ctx.fillStyle = k % 2 ? '#ffffff' : '#c6b4ff';
        ctx.beginPath();
        ctx.arc(t.x + Math.cos(a) * rr, t.y + Math.sin(a) * rr, 1.2 + p * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // 贯穿激光：一条横穿全图的粗线，0.5 秒内由粗变细
  function drawBeams() {
    for (let i = 0; i < beams.length; i++) {
      const b = beams[i];
      const k = 1 - b.age / b.life;          // 1 → 0
      if (k <= 0) continue;
      const w = 2 + CANNON_HALF_W * k;

      ctx.save();
      ctx.lineCap = 'round';

      // 外层光晕
      ctx.globalAlpha = 0.30 * k;
      ctx.strokeStyle = 'rgba(150,190,255,.9)';
      ctx.lineWidth = w * 2.6;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      // 主体
      ctx.globalAlpha = 0.55 + 0.45 * k;
      ctx.strokeStyle = '#9fe9ff';
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      // 白色芯
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, w * 0.34);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      // 炮口与末端的光团
      ctx.globalAlpha = 0.75 * k;
      const g1 = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 16 + 22 * k);
      g1.addColorStop(0, '#ffffff');
      g1.addColorStop(1, 'rgba(140,220,255,0)');
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 16 + 22 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(b.x2, b.y2, 8 + 12 * k, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawTank(t, alpha) {
    const p = t.palette;
    const angle = t.angle;
    const A = alpha === undefined ? 1 : alpha;

    ctx.save();
    ctx.globalAlpha = A;
    // 聚能时车身在抖：整辆车的绘制整体加一点随机位移
    if (t.charge > 0) {
      const amp = 1.9 * (1 - t.charge / (t.chargeMax || CANNON_CHARGE)) + 0.6;
      ctx.translate((Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp);
    }
    ctx.translate(t.x, t.y);

    // 地面投影
    ctx.fillStyle = 'rgba(0,0,0,.42)';
    ctx.beginPath();
    ctx.ellipse(1.5, 3.5, 15, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(angle);

    const kick = t.recoil * 3;

    // 履带（深色金属）
    ctx.fillStyle = '#151b25';
    roundRect(ctx, -12.5, -13, 25, 6.6, 3.2);
    ctx.fill();
    roundRect(ctx, -12.5, 6.4, 25, 6.6, 3.2);
    ctx.fill();

    // 履带齿
    ctx.fillStyle = 'rgba(255,255,255,.09)';
    for (let i = -9; i <= 8.5; i += 4.4) {
      ctx.fillRect(i, -12.6, 1.4, 5.8);
      ctx.fillRect(i, 6.8, 1.4, 5.8);
    }

    // 车体
    const hull = ctx.createLinearGradient(0, -9, 0, 9);
    hull.addColorStop(0, p.light);
    hull.addColorStop(0.42, p.main);
    hull.addColorStop(1, p.dark);
    ctx.fillStyle = hull;
    roundRect(ctx, -12, -9.2, 24, 18.4, 4.2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,.38)';
    ctx.lineWidth = 1;
    roundRect(ctx, -12, -9.2, 24, 18.4, 4.2);
    ctx.stroke();

    // 炮管（从炮塔伸出，压在车体之上）
    const bl = 21 - kick;
    const shotgun = t.weapon === 'shotgun';
    const cannon = t.weapon === 'cannon';
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = shotgun ? 8.4 : (cannon ? 7.6 : 6.4);
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(bl, 0);
    ctx.stroke();

    // 电子炮状态：炮管上套两圈紫色聚能环
    if (cannon) {
      ctx.strokeStyle = '#cbb8ff';
      ctx.lineWidth = 2;
      for (let k = 0; k < 2; k++) {
        const px = bl - 6 - k * 6;
        ctx.beginPath();
        ctx.moveTo(px, -4.6);
        ctx.lineTo(px, 4.6);
        ctx.stroke();
      }
    }

    // 霰弹枪状态：炮口加一个粗口套
    if (shotgun) {
      ctx.strokeStyle = '#ffd479';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(bl - 6, -4.4);
      ctx.lineTo(bl - 6, 4.4);
      ctx.moveTo(bl, -4.6);
      ctx.lineTo(bl, 4.6);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,.20)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(3, -1.7);
    ctx.lineTo(bl - 2, -1.7);
    ctx.stroke();

    // 炮口
    ctx.fillStyle = p.light;
    ctx.beginPath();
    ctx.arc(bl, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(15,20,28,.85)';
    ctx.beginPath();
    ctx.arc(bl + 0.6, 0, 1.7, 0, Math.PI * 2);
    ctx.fill();

    // 炮塔
    const turret = ctx.createRadialGradient(-2, -2.5, 1, 0, 0, 8.5);
    turret.addColorStop(0, p.light);
    turret.addColorStop(1, p.main);
    ctx.fillStyle = turret;
    ctx.beginPath();
    ctx.arc(0, 0, 7.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 舱盖高光
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.beginPath();
    ctx.arc(-1.8, -2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 受击闪白
    if (t.flash > 0) {
      ctx.globalAlpha = Math.min(1, t.flash * 3.2) * 0.85 * A;
      ctx.fillStyle = '#fff';
      roundRect(ctx, -13, -13.5, 26, 27, 5);
      ctx.fill();
      ctx.globalAlpha = A;
    }

    ctx.restore();

    // 护盾：罩在车体外面的一层光壳
    if (t.shield > 0) {
      const last = shieldBlinking(t);   // 最后 2 秒开始闪，提醒快到期了
      const blink = last ? (0.25 + 0.55 * Math.abs(Math.sin(clock * 11))) : (0.9 + 0.1 * Math.sin(clock * 4));
      ctx.save();
      ctx.globalAlpha = blink * A;
      const g2 = ctx.createRadialGradient(t.x, t.y, 8, t.x, t.y, 23);
      g2.addColorStop(0, 'rgba(190,235,255,.10)');
      g2.addColorStop(0.75, 'rgba(150,215,255,.22)');
      g2.addColorStop(1, 'rgba(150,215,255,.55)');
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cfeaff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 血条
    const barW = 30;
    const barH = 3.6;
    const bx = t.x - barW / 2;
    const by = t.y - 25;
    ctx.save();
    ctx.globalAlpha = A;
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    roundRect(ctx, bx - 1, by - 1, barW + 2, barH + 2, 2.8);
    ctx.fill();
    const ratio = Math.max(0, t.hp / MAX_HP);
    ctx.fillStyle = ratio > 0.7 ? '#63e08a' : (ratio > 0.35 ? '#ffd479' : '#ff5d5d');
    roundRect(ctx, bx, by, barW * ratio, barH, 1.8);
    ctx.fill();
    ctx.restore();
  }

  // 激光：一条带光晕的细长光束（拖尾越长越像"光"）
  function drawLaserBeam(b) {
    const pts = b.trail.concat([{ x: b.x, y: b.y }]);
    if (pts.length < 2) {
      pts.unshift({ x: b.x - b.vx * 0.02, y: b.y - b.vy * 0.02 });
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function poly(width, style, alpha) {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    poly(10, '#2ea8d8', 0.14);
    poly(5, '#69e6ff', 0.40);
    poly(1.8, '#ffffff', 0.92);

    // 弹头光点
    const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 15);
    glow.addColorStop(0, 'rgba(200,250,255,.95)');
    glow.addColorStop(0.4, 'rgba(120,232,255,.45)');
    glow.addColorStop(1, 'rgba(120,232,255,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawBullets() {
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];

      if (b.kind === 'laser') {
        drawLaserBeam(b);
        continue;
      }

      // 地雷飞镖：旋转的小四角
      if (b.kind === 'dart') {
        const spin = (b.spin || 0) + clock * 12;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(spin);
        ctx.fillStyle = '#ffd9a8';
        ctx.beginPath();
        ctx.moveTo(4.6, 0);
        ctx.lineTo(0, 1.5);
        ctx.lineTo(-4.6, 0);
        ctx.lineTo(0, -1.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff7a3c';
        ctx.beginPath();
        ctx.moveTo(3.2, 0);
        ctx.lineTo(0, 0.9);
        ctx.lineTo(-3.2, 0);
        ctx.lineTo(0, -0.9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        continue;
      }

      // 拖尾
      for (let k = 0; k < b.trail.length; k++) {
        const p = b.trail[k];
        const a = (k + 1) / b.trail.length * 0.42;
        ctx.globalAlpha = a;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, b.r * (0.25 + 0.75 * (k + 1) / b.trail.length), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 光晕（霰弹颗粒小一点，别糊成一片）
      const glowR = b.kind === 'pellet' ? 7 : 13;
      const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, glowR);
      glow.addColorStop(0, b.color);
      glow.addColorStop(0.35, b.color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = b.kind === 'pellet' ? 0.3 : 0.42;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.x, b.y, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // 弹丸
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.35 + a * 0.9), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawCountdown() {
    if (countdown <= 0) return;
    const txt = countdown > 0.42 ? '准 备' : '开 始';
    const a = countdown > 0.42
      ? Math.min(1, (countdown - 0.42) * 3)
      : Math.min(1, countdown * 4);

    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 46px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillText(txt, W / 2 + 2, H / 2 - 4 + 3);
    const g = ctx.createLinearGradient(0, H / 2 - 30, 0, H / 2 + 30);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#8fc4ff');
    ctx.fillStyle = g;
    ctx.fillText(txt, W / 2, H / 2 - 4);

    // 底下补一行小字：这张图叫什么（每局换图后玩家能知道换了哪张）
    ctx.font = '700 15px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillText('地图 · ' + MAP_NAME, W / 2 + 1, H / 2 + 37);
    ctx.fillStyle = 'rgba(186,214,255,.92)';
    ctx.fillText('地图 · ' + MAP_NAME, W / 2, H / 2 + 36);
    ctx.restore();
  }

  // 隐身时的可见度：自己视角变浅；联机里别人完全看不见（发射物照常可见）；
  // 本地同屏双人只有一块屏幕，只能统一变浅
  function tankAlpha(t) {
    if (!(t.invis > 0)) return 1;
    if (mode === 'local') return 0.34;
    return t.id === mySide() ? 0.34 : 0;
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    if (shake > 0.15) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    ctx.drawImage(floorLayer.c, 0, 0, W, H);
    drawSpawnMarkers();
    ctx.drawImage(wallLayer.c, 0, 0, W, H);
    drawItems();          // 道具铺在地面上，坦克可以压过去
    drawMines();          // 地雷也在地面层

    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      if (!t.active || !t.alive) continue;
      const a = tankAlpha(t);
      if (a <= 0.02) continue;
      drawTank(t, a);
    }

    drawLaserSights();    // 待发射的预瞄画在坦克之上
    drawCannonCharges();  // 电子炮聚能的光丝 / 聚能粒子
    drawBullets();
    drawBeams();          // 贯穿激光压在子弹之上，穿墙也能看见
    drawParticles();
    ctx.restore();

    drawCountdown();
  }

  /* ---------------------------------------------------------
   * 12. 输入
   * ------------------------------------------------------- */
  const FIRE_KEYS = { Space: 0, KeyJ: 0, Slash: 1, Numpad0: 1 };
  const PREVENT = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Slash', 'Numpad0'];

  // 联机时本机键盘只对应自己那辆坦克；本地时由按键区分红蓝双方
  function mySide() {
    if (mode === 'host') return 0;
    if (mode === 'guest') return guestSide;
    if (mode === 'solo') return 0;      // 单人模式：玩家永远开红方
    return -1;
  }

  // 该开火键落在哪一方（-1 表示不是开火键）
  function fireSideOf(code) {
    if (!(code in FIRE_KEYS)) return -1;
    const mine = mySide();
    return mine < 0 ? FIRE_KEYS[code] : mine;
  }

  // 隐身键：联机时按 K（只有联机模式还有这个技能）
  function invisSideOf(code) {
    if (invisOff()) return -1;
    if (code === 'KeyK') {
      const mine = mySide();
      return mine >= 0 ? mine : 0;
    }
    return -1;
  }

  function setMoveKey(code, down) {
    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      if (!t.active) continue;
      if (mode === 'host' && t.id !== 0) continue;              // 主机键盘不接管访客的坦克
      if (mode === 'guest' && t.id !== guestSide) continue;     // 访客只操纵自己那辆
      if (mode === 'solo' && t.id !== 0) continue;              // 单人模式：蓝方归电脑，键盘别去抢
      const map = t.keys;
      for (const action in map) {
        if (map[action] === code) t.input[action] = down ? 1 : 0;
      }
      // 单人模式玩家想用方向键也顺手，两套键位同时生效
      if (mode === 'solo' && t.id === 0) {
        for (const action2 in KEYS_ARROW) {
          if (KEYS_ARROW[action2] === code) t.input[action2] = down ? 1 : 0;
        }
      }
    }
  }

  window.addEventListener('keydown', function (e) {
    const code = e.code;
    if (PREVENT.indexOf(code) >= 0) e.preventDefault();
    primeAudio();

    if (code === 'KeyP' || code === 'Escape') {
      // 联机时 Esc 交给大厅处理（退出联机返回大厅）；联机不提供暂停，P 键无效
      if (code === 'Escape' && mode !== 'local' && mode !== 'solo') return;
      togglePause();
      return;
    }
    if (code === 'KeyR') {
      restartMatch();
      return;
    }
    if (code === 'KeyM') {
      muted = !muted;
      return;
    }

    // 「返回主界面」确认面板打开时，屏蔽移动与开火（避免面板后面坦克乱动）
    if (menuOpen) {
      if (code === 'Escape' || code === 'Space' || code === 'Enter') resumeGame();
      return;
    }

    if (e.repeat) return;

    if (state !== 'playing' && state !== 'paused') {
      if (code === 'Space' || code === 'Enter' || code === 'NumpadEnter') {
        advance();
        return;
      }
    } else if (state === 'paused' && (code === 'Space' || code === 'Enter')) {
      advance();
      return;
    }

    setMoveKey(code, true);

    // 隐身技能（K / 本地蓝方 3）
    const inv = invisSideOf(code);
    if (inv >= 0) {
      requestInvis(tanks[inv]);
      return;
    }

    const side = fireSideOf(code);
    if (side >= 0) {
      tanks[side].firing = true;
      if (mode === 'guest') guestSendInput();
    }
  });

  window.addEventListener('keyup', function (e) {
    const code = e.code;
    setMoveKey(code, false);
    const side = fireSideOf(code);
    if (side >= 0) {
      tanks[side].firing = false;
      if (mode === 'guest') guestSendInput();
    }
  });

  /* 标题栏「主界面」按钮：返回模式选择 */
  const btnHome = document.getElementById('btnHome');
  if (btnHome) {
    btnHome.addEventListener('click', function (ev) {
      ev.preventDefault();
      btnHome.blur();
      requestHome();
    });
  }

  /* 双人同屏时标题栏收起来了，右侧空白处的「主界面」承担同样的职责 */
  const btnHomeDuel = document.getElementById('btnHomeDuel');
  if (btnHomeDuel) {
    btnHomeDuel.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      btnHomeDuel.blur();
      requestHome();
    });
  }

  /* 「此模式推荐平板操作（点此关闭）」提示胶囊：点一下立刻收掉，不理它 9 秒也会自己淡出 */
  let duelTipEl = null, duelTipTimer = 0, duelTipShown = false;
  function hideDuelTip() {
    if (duelTipEl === null) duelTipEl = document.getElementById('duelTip');
    if (duelTipEl) duelTipEl.classList.add('gone');
    if (duelTipTimer) { clearTimeout(duelTipTimer); duelTipTimer = 0; }
  }
  function showDuelTip() {
    if (duelTipEl === null) duelTipEl = document.getElementById('duelTip');
    const el = duelTipEl;
    if (!el) return;
    el.classList.remove('gone');
    el.style.animation = 'none';       // 重播一次入场动画
    void el.offsetWidth;
    el.style.animation = '';
    if (duelTipTimer) clearTimeout(duelTipTimer);
    duelTipTimer = setTimeout(hideDuelTip, 9000);
  }
  if (duelTipEl === null) duelTipEl = document.getElementById('duelTip');
  if (duelTipEl) {
    duelTipEl.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      hideDuelTip();
    });
    duelTipEl.addEventListener('click', function (ev) { ev.stopPropagation(); });
  }

  window.addEventListener('blur', function () {
    tanks.forEach(function (t) { resetInput(t); t.firing = false; });
    releaseTouch();
    if (mode === 'guest') { guestSendInput(); return; }
    // 联机对局不因切窗暂停，只有本地模式会暂停
    if (mode === 'local' && state === 'playing') togglePause();
  });

  /* ---------------------------------------------------------
   * 12.1 手机触屏操控
   *   一套操控层 = 摇杆 + 开火（+ 隐身小按钮），推得越远开得越快
   *   双人同屏时复制成两套：下侧摇杆在左、上侧摇杆在右，两套都用屏幕坐标，
   *   摇杆指向就是车头指向（拖到哪边，自己那辆车就往哪边开）
   * ------------------------------------------------------- */
  const touchUI = document.getElementById('touchUI');
  const touchUI2 = document.getElementById('touchUI2');

  let touchActive = false;      // 是否处于触屏操控模式（由模式 + 设备类型决定）
  let touchDimmed = false;      // 面板挡在前面时摇杆变暗且失效

  // 设备是否为触屏（手机 / 平板）
  const TOUCH_DEVICE = (function () {
    try {
      if (window.matchMedia) {
        // 只有触摸没有鼠标的，才是手机 / 平板（平板屏幕可能很大，不能只看短边）
        if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return true;
        if (window.matchMedia('(pointer: coarse)').matches) return true;
      }
      const touch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
      const shortSide = Math.min(window.screen.width || 9999, window.screen.height || 9999);
      return touch && shortSide <= 820;   // 触屏笔电的短边一般更大，不放摇杆
    } catch (e) {
      return false;
    }
  })();

  // 本机摇杆 / 键盘控制的那辆坦克（联机时只有自己那辆）
  function localTank() {
    if (mode === 'host') return tanks[0];
    if (mode === 'guest') return tanks[guestSide];
    if (mode === 'solo') return tanks[0];   // 单人模式：手机摇杆开红方
    return null;
  }

  // 摇杆是否可操作：对局进行中，且没有面板挡着
  function padCanPlay() {
    return state === 'playing' && !menuOpen && !panelVisible;
  }

  function pushOwnInput() {
    if (mode === 'guest') guestSendInput();
  }

  /* 造一套操控层
   *   side : null = 跟随 localTank()；0 / 1 = 固定操纵红方 / 蓝方
   * 两套（上侧蓝方 / 下侧红方）都用屏幕坐标：摇杆推哪个方向，自己那辆车就往哪个方向开。 */
  function makePad(cfg) {
    const stick = cfg.stick || null;
    const knob = cfg.knob || null;
    const dir = cfg.dir || null;
    const fire = cfg.fire || null;
    const invis = cfg.invis || null;
    let stickPointer = null;
    let firePointer = null;
    let center = { x: 0, y: 0 };
    let radius = 44;

    const pad = {
      side: cfg.side,
      root: cfg.root || null,
      tank: function () { return tankForPad(pad.side); },

      // 摇杆位移（-1~1，屏幕坐标：向上为负）→ 坦克朝向
      //   摇杆指向就是前进方向：车头自动转过去再开，推得越远油门越大
      apply: function (nx, ny) {
        const t = pad.tank();
        if (!t) return;
        const DZ = 0.24;   // 中心死区，避免手指轻碰就走
        const len = Math.hypot(nx, ny);
        let throttle = len >= DZ ? Math.min(1, (len - DZ) / (1 - DZ)) : 0;
        if (!padCanPlay()) throttle = 0;

        if (throttle > 0) {
          // 画布坐标 y 向下，与屏幕坐标一致：摇杆指向就是车头指向
          t.input.aim = Math.atan2(ny, nx);
          t.input.throttle = throttle;
          // 摇杆期间清掉键盘那套量，避免两套输入打架
          t.input.forward = 0;
          t.input.back = 0;
          t.input.ccw = 0;
          t.input.cw = 0;
        } else {
          t.input.aim = null;
          t.input.throttle = 0;
        }
        pushOwnInput();
      },

      setFire: function (on) {
        const t = pad.tank();
        if (!t) return;
        const v = !!on && padCanPlay();
        t.firing = v;
        if (fire && fire.classList) fire.classList.toggle('on', v);
        pushOwnInput();
      },

      release: function () {
        stickPointer = null;
        firePointer = null;
        if (knob) knob.style.transform = 'translate(0px,0px)';
        if (dir) dir.style.transform = 'rotate(0deg)';
        if (fire && fire.classList) fire.classList.remove('on');
        const t = pad.tank();
        if (t) {
          resetInput(t);
          t.firing = false;
        }
        pushOwnInput();
      },

      dim: function (on) {
        if (pad.root && pad.root.classList) pad.root.classList.toggle('off', !!on);
        if (on) {
          pad.apply(0, 0);
          if (firePointer === null) pad.setFire(false);
        }
      }
    };

    function stickCenterAt() {
      if (!stick) return;
      const r = stick.getBoundingClientRect();
      center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      radius = Math.max(24, r.width * 0.36);
    }

    function stickDown(e) {
      if (!stick || stickPointer !== null) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      stickPointer = e.pointerId;
      stickCenterAt();
      try { stick.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
      stickMove(e);
      primeAudio();
      e.preventDefault();
    }

    function stickMove(e) {
      if (!stick || e.pointerId !== stickPointer) return;
      const dx = e.clientX - center.x;
      const dy = e.clientY - center.y;
      const len = Math.hypot(dx, dy);
      const k = len > radius ? radius / len : 1;
      if (knob) {
        knob.style.transform = 'translate(' + (dx * k).toFixed(1) + 'px,' + (dy * k).toFixed(1) + 'px)';
      }
      // 方向标：屏幕上指向 = 坦克实际行进方向
      if (dir && len > 2) {
        const deg = Math.atan2(dy, dx) * 180 / Math.PI;
        dir.style.transform = 'rotate(' + deg.toFixed(1) + 'deg)';
      }
      pad.apply(dx / radius, dy / radius);
      e.preventDefault();
    }

    function stickUp(e) {
      if (e.pointerId !== stickPointer) return;
      stickPointer = null;
      if (knob) knob.style.transform = 'translate(0px,0px)';
      if (dir) dir.style.transform = 'rotate(0deg)';
      pad.apply(0, 0);
      e.preventDefault();
    }

    function fireDown(e) {
      if (!fire || firePointer !== null) return;
      firePointer = e.pointerId;
      try { fire.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
      primeAudio();
      pad.setFire(true);
      e.preventDefault();
    }

    function fireUp(e) {
      if (e.pointerId !== firePointer) return;
      firePointer = null;
      pad.setFire(false);
      e.preventDefault();
    }

    if (stick) {
      stick.addEventListener('pointerdown', stickDown);
      stick.addEventListener('pointermove', stickMove);
      stick.addEventListener('pointerup', stickUp);
      stick.addEventListener('pointercancel', stickUp);
      stick.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }

    if (fire) {
      fire.addEventListener('pointerdown', fireDown);
      fire.addEventListener('pointerup', fireUp);
      fire.addEventListener('pointercancel', fireUp);
      fire.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      // 避免按钮获得焦点后，桌面键盘的空格被按钮吃掉
      fire.addEventListener('click', function (e) { e.preventDefault(); fire.blur(); });
    }

    /* 触屏「隐身」按钮：手机没有键盘，给隐身技能一个入口 */
    if (invis) {
      invis.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        primeAudio();
        const t = pad.tank();
        if (t && padCanPlay()) requestInvis(t);
      });
      invis.addEventListener('click', function (e) { e.preventDefault(); invis.blur(); });
      invis.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }

    return pad;
  }

  /* 下侧（红方）与上侧（蓝方）两套操控层；单人 / 联机只用下侧那套 */
  const padA = makePad({
    root: touchUI,
    stick: document.getElementById('stickBase'),
    knob: document.getElementById('stickKnob'),
    dir: document.getElementById('knobDir'),
    fire: document.getElementById('fireBtn'),
    invis: document.getElementById('invisBtn'),
    side: null
  });

  const padB = makePad({
    root: touchUI2,
    stick: document.getElementById('stickBase2'),
    knob: document.getElementById('stickKnob2'),
    dir: document.getElementById('knobDir2'),
    fire: document.getElementById('fireBtn2'),
    invis: document.getElementById('invisBtn2'),
    side: -1
  });

  const PADS = [padA, padB];

  // 开关触屏操控层：双人同屏时上下各一套，其余模式只有下侧一套
  let touchForced = null;   // null = 自动判断设备；true / false = 手动覆盖（测试与特殊适配用）

  function applyTouchUi(on) {
    touchActive = !!on;
    duelTouch = touchActive && mode === 'local';
    pad1Side = duelTouch ? 0 : null;
    pad2Side = duelTouch ? 1 : -1;
    padA.side = pad1Side;
    padB.side = pad2Side;
    if (document.body && document.body.classList) {
      document.body.classList.toggle('touch-mode', touchActive);
      document.body.classList.toggle('duel-touch', duelTouch);
    }
    if (!touchActive) {
      for (let i = 0; i < PADS.length; i++) {
        PADS[i].release();
        PADS[i].dim(false);
      }
      hideDuelTip();
    } else if (duelTouch) {
      duelTipShown = false;   // 重新进入双人模式：等开打时再亮一次提示
      hideDuelTip();
      paintDuelScores();      // 左侧两排比分立刻挂上当前比分，别等开局才刷
      updateAmmo(true);       // 弹夹按场上实际子弹重算
      paintPadStats();        // 开火键旁的血量 / 弹夹立刻挂上当前状态
    }
    touchDimmed = false;
  }

  // 模式入口调用：联机 / 单人 / 双人同屏都要摇杆，且取决于设备类型
  function setTouchMode(on) {
    const enabled = touchForced === null ? TOUCH_DEVICE : touchForced;
    applyTouchUi(!!on && enabled);
  }

  // 外部强制开关：传 true 就在触屏模式下显示摇杆（与设备判定无关）
  function forceTouch(flag) {
    touchForced = flag === undefined ? null : !!flag;
    // 双人同屏（本地）也支持触屏：上下各一套摇杆
    setTouchMode(mode === 'host' || mode === 'guest' || mode === 'solo' || mode === 'local');
  }

  // 手指松开 / 切后台：摇杆归位，避免坦克一直往前冲
  function releaseTouch() {
    for (let i = 0; i < PADS.length; i++) PADS[i].release();
  }

  if (document.addEventListener) {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) releaseTouch();
    });
  }

  // 面板出现时摇杆变暗失效，避免隔着面板误操作
  function updateTouchUi() {
    if (!touchActive) return;
    const dim = panelVisible || menuOpen;
    if (dim === touchDimmed) return;
    touchDimmed = dim;
    for (let i = 0; i < PADS.length; i++) PADS[i].dim(dim);
  }

  /* ---------------------------------------------------------
   * 13. 主循环
   * ------------------------------------------------------- */
  let last = performance.now();

  function loop(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 1 / 20) dt = 1 / 20;
    if (dt < 0) dt = 0;
    clock += dt;

    if (mode === 'guest') {
      // 访客不跑物理，全部位置来自主机快照插值
      guestFrame(dt);
    } else {
      if (mode === 'host') applyGuestInput();

      if (state === 'playing') update(dt);
      else if (state === 'roundOver') {
        updateBeams(dt);          // 结算画面里让激光照常收尾消失，别僵在半空
        updateParticles(dt);
        if (shake > 0) shake = Math.max(0, shake - dt * 40);
      }

      // 淘汰后先演爆炸，稍等再给胜方加分（分数跳动动画在这一刻发生）
      if (awardTimer > 0) {
        awardTimer -= dt;
        if (awardTimer <= 0) {
          awardTimer = 0;
          awardScore(pendingWinner);
          // 面板稍晚一点弹出，让“跳动 + 飘 +1”先演到高潮
          queueOverlay(buildRoundOverPanel(pendingWinner), PANEL_DELAY - AWARD_DELAY);
        }
      }

      // 结算面板延时弹出
      if (overlayTimer > 0) {
        overlayTimer -= dt;
        if (overlayTimer <= 0 && pendingOverlay) {
          showOverlay(pendingOverlay);
          pendingOverlay = null;
        }
      }

      // 一局结束后自动进入下一局
      if (state === 'roundOver' && roundTimer > 0) {
        roundTimer -= dt;
        if (roundTimer <= 0) startRound();
      }

      // 主机广播快照
      if (mode === 'host') hostTick(dt);
    }

    updateChips();
    updateTouchUi();
    render();
    requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------
   * 14. 启动
   * ------------------------------------------------------- */
  setSides(2);          // 默认本地双人图，等大厅 / 联机再切换人数
  updateHud();
  render();
  requestAnimationFrame(loop);

  // 有大厅（index.html 里的 #lobby）时由大厅决定进入哪种模式；
  // 没有大厅元素（如直接引用 game.js）则回退到本地模式的开局面板
  if (!document.getElementById('lobby')) {
    showStartPanel();
  }
})();
