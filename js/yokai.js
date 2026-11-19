/* =========================================================
   星陨战线 · YOKAI —— 妖怪真敌人 + 游荡小生物
   外部补丁：不修改 data.js / game.js / art.js 任何一行

   素材：Yokai Art: Night Parade of One Hundred Demons
   （Unity 图集按连通域切分 + 归一化，见 assets/yokai/*.png）

   关键坑：THREE.TextureLoader 默认会给 <img> 设 crossOrigin="anonymous"，
   在 file:// 页面下浏览器按 CORS 处理而失败 —— 图片全部加载不到。
   所以这里改用手动 <img> 加载（不设 crossOrigin）。

   接入方式：把妖怪类型注入 GAME_DATA.ENEMIES，并包一层
   AstralArt.EnemyFactory 的 create / update / dispose，
   这样刷怪、移动、血条、受伤、击杀、金币、结算全部走原逻辑。

   关闭：window.ASTRAL_YOKAI = false
   ========================================================= */
(function () {
  'use strict';

  var T = window.THREE;
  var A = window.AstralArt;
  var D = window.GAME_DATA;
  if (!T || !A || !D || !A.EnemyFactory) return;
  if (window.ASTRAL_YOKAI === false) return;
  if (D.__yokaiInjected) return;          // 防重复注入

  /* ---------------- 妖怪配置 ---------------- */
  // size 为屏幕上的世界高度；def.scale 固定 1，game.js 会再乘 1.38
  var SPECS = {
    kirin:      { file: 'assets/yokai/kirin.png',      size: 2.30, tint: '#ffd8b0' },
    tsukumo:    { file: 'assets/yokai/tsukumo.png',    size: 1.55, tint: '#ffe9c8' },
    rokurokubi: { file: 'assets/yokai/rokurokubi.png', size: 1.95, tint: '#f0e4ff' },
    mushroom:   { file: 'assets/yokai/mushroom.png',   size: 1.45, tint: '#dcffe4' },
    ginseng:    { file: 'assets/yokai/ginseng.png',    size: 1.50, tint: '#fff0cc' }
  };

  // 注入到 GAME_DATA.ENEMIES 的数值（与既有 shade 62hp / wisp 96hp 同量级）
  var DEFS = {
    yokai_kirin: {
      id: 'yokai_kirin', name: '火麒麟', en: 'FLAME KIRIN', key: 'kirin',
      hp: 78, speed: 2.05, armor: 0, gold: 11, core: 1,
      radius: 0.55, scale: 1, flying: false, barY: 2.5,
      color: '#ffb066', eye: '#ffe0a8'
    },
    yokai_tsukumo: {
      id: 'yokai_tsukumo', name: '付丧神', en: 'TSUKUMOGAMI', key: 'tsukumo',
      hp: 56, speed: 2.65, armor: 0, gold: 8, core: 1,
      radius: 0.45, scale: 1, flying: false, barY: 1.8,
      color: '#ffd9a0', eye: '#fff3d6'
    },
    yokai_rokurokubi: {
      id: 'yokai_rokurokubi', name: '飞头蛮', en: 'ROKUROKUBI', key: 'rokurokubi',
      hp: 90, speed: 1.95, armor: 1, gold: 12, core: 1,
      radius: 0.55, scale: 1, flying: false, barY: 2.15,
      color: '#c9a8ff', eye: '#f0e4ff'
    },
    yokai_mushroom: {
      id: 'yokai_mushroom', name: '菌妖', en: 'SPORE YOKAI', key: 'mushroom',
      hp: 112, speed: 1.55, armor: 2, gold: 14, core: 1,
      radius: 0.6, scale: 1, flying: false, barY: 1.75,
      color: '#9fe6b4', eye: '#e6ffe9'
    },
    yokai_ginseng: {
      id: 'yokai_ginseng', name: '人参精', en: 'GINSENG SPIRIT', key: 'ginseng',
      hp: 66, speed: 2.35, armor: 0, gold: 9, core: 1,
      radius: 0.5, scale: 1, flying: false, barY: 1.85,
      color: '#ffd48a', eye: '#fff0c4'
    }
  };

  /* ---------------- 贴图加载（绕开 file:// 的 CORS） ---------------- */
  var CACHE = {};       // key -> { tex, frames }
  var WAITING = {};     // key -> [callback]

  function loadTex(key) {
    var spec = SPECS[key];
    if (!spec) return;
    if (CACHE[key]) return;
    var waiters = WAITING[key] = [];
    var img = new Image();            // 故意不设 crossOrigin
    img.onload = function () {
      try {
        var tex = new T.Texture(img);
        tex.colorSpace = T.SRGBColorSpace;
        tex.magFilter = T.LinearFilter;
        tex.minFilter = T.LinearFilter;
        tex.generateMipmaps = false;
        tex.wrapS = T.ClampToEdgeWrapping;
        tex.wrapT = T.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        var frames = Math.max(1, Math.round(img.width / img.height));
        CACHE[key] = { tex: tex, frames: frames };
        for (var i = 0; i < waiters.length; i++) {
          try { waiters[i](CACHE[key]); } catch (e) {}
        }
        if (window.console) console.log('[yokai] 载入 ' + key + ' → ' + frames + ' 帧');
      } catch (e) {
        if (window.console) console.warn('[yokai] 建立贴图失败', key, e);
      }
      delete WAITING[key];
    };
    img.onerror = function () {
      if (window.console) console.warn('[yokai] 图片载入失败：' + spec.file);
      delete WAITING[key];
    };
    img.src = spec.file;
  }

  function onTex(key, cb) {
    if (CACHE[key]) { cb(CACHE[key]); return; }
    if (!WAITING[key]) { WAITING[key] = []; loadTex(key); }
    if (WAITING[key]) WAITING[key].push(cb);
  }

  /* ---------------- 构建敌人视觉 ---------------- */
  // 预加载五张精灵图，避免第一只妖怪出场时短暂透明
  Object.keys(SPECS).forEach(function (k) { loadTex(k); });

  var FOOT = 0.02;          // Sprite 锚点：贴底
  var GROUP_K = 1.38;       // game.js 会再乘的系数

  function buildGroup(def) {
    var spec = SPECS[def.key];
    var grp = new T.Group();
    grp.userData.yokaiKey = def.key;
    grp.userData.yokaiFrames = 1;
    grp.userData.yokaiT = Math.random() * 4;

    var mat = new T.SpriteMaterial({
      transparent: true,
      depthWrite: false,
      alphaTest: 0.06,
      color: spec.tint
    });
    var sp = new T.Sprite(mat);
    var s = spec.size / GROUP_K;
    sp.scale.set(s, s, 1);
    sp.center.set(0.5, FOOT);
    sp.visible = false;                 // 贴图到位前不显示，避免渲染成纯色方块
    grp.add(sp);
    grp.userData.yokaiSpr = sp;

    onTex(def.key, function (c) {
      try {
        mat.map = c.tex.clone();
        mat.map.repeat.set(1 / c.frames, 1);
        mat.map.offset.set(0, 0);
        mat.map.needsUpdate = true;
        mat.needsUpdate = true;
        grp.userData.yokaiFrames = c.frames;
        sp.visible = true;
      } catch (e) {}
    });
    return grp;
  }

  /* ---------------- 注入数据 ---------------- */
  var INJECTED = [];
  Object.keys(DEFS).forEach(function (id) {
    if (D.ENEMIES[id]) return;              // 已存在就不覆盖
    D.ENEMIES[id] = DEFS[id];
    INJECTED.push(id);
  });

  /* 每波混入少量妖怪，并从同波第一个普通怪里扣掉等量，保持总数不变 */
  var WAVE_MIX = [
    ['yokai_tsukumo', 2],
    ['yokai_kirin', 2],
    ['yokai_ginseng', 2],
    ['yokai_rokurokubi', 2],
    ['yokai_mushroom', 2],
    ['yokai_kirin', 3],
    ['yokai_rokurokubi', 3],
    ['yokai_mushroom', 3]
  ];

  var waves = D.WAVES || [];
  for (var wi = 0; wi < waves.length && wi < WAVE_MIX.length; wi++) {
    var mix = WAVE_MIX[wi];
    var w = waves[wi];
    if (!w || !w.spawns || !w.spawns.length) continue;

    var first = w.spawns[0];
    var n = mix[1];
    if (first && n > 0) {
      var take = Math.min(n, Math.max(1, (first.count || 0) - 2));
      if (take > 0) {
        first.count = (first.count || 0) - take;
        n = take;
      }
    }
    if (n > 0) {
      w.spawns.push({ type: mix[0], count: n, gap: 1.35, delay: (first && first.delay ? first.delay + 2.5 : 2.5) });
    }
  }
  D.__yokaiInjected = true;

  /* ---------------- 包一层 EnemyFactory ---------------- */
  var EF = A.EnemyFactory;

  var origCreate = EF.create;
  EF.create = function (typeKey) {
    try {
      var def = D.ENEMIES && D.ENEMIES[typeKey];
      if (def && def.key && SPECS[def.key]) return buildGroup(def);
    } catch (e) {
      if (window.console) console.warn('[yokai] create:', e);
    }
    return origCreate.apply(this, arguments);
  };

  var origUpdate = EF.update;
  EF.update = function (group, time, dt) {
    try {
      if (group && group.userData && group.userData.yokaiKey) {
        var sp = group.userData.yokaiSpr;
        var mat = sp && sp.material;
        if (!mat || !mat.map) return;
        var frames = group.userData.yokaiFrames || 1;
        if (frames <= 1) return;
        group.userData.yokaiT += (dt || 0) * 9.0;
        var n = frames * 2 - 2;
        var f = Math.floor(group.userData.yokaiT) % n;
        if (f < 0) f += n;
        if (f >= frames) f = n - f;
        mat.map.offset.x = f / frames;
        return;
      }
    } catch (e) {}
    return origUpdate.apply(this, arguments);
  };

  var origDispose = EF.dispose;
  EF.dispose = function (group) {
    try {
      if (group && group.userData && group.userData.yokaiKey) {
        group.traverse(function (o) {
          if (o.isSprite) {
            if (o.material) {
              if (o.material.map) { try { o.material.map.dispose(); } catch (e) {} }
              try { o.material.dispose(); } catch (e) {}
            }
            if (o.geometry) { try { o.geometry.dispose(); } catch (e) {} }
          }
        });
        return;
      }
    } catch (e) {}
    return origDispose.apply(this, arguments);
  };

  window.AstralYokai = {
    types: Object.keys(DEFS),
    isYokai: function (group) {
      return !!(group && group.userData && group.userData.yokaiKey);
    },
    loaded: function () { return Object.keys(CACHE); }
  };

  if (window.console) {
    console.log('%c[星陨战线 · YOKAI] 已注入 ' + INJECTED.length +
      ' 种妖怪敌人，混入 ' + Math.min(waves.length, WAVE_MIX.length) +
      ' 波 (window.ASTRAL_YOKAI=false 可关闭)', 'color:#c7f0d0');
  }
})();
