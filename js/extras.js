/* =========================================================
   星陨战线 · EXTRAS
   追加氛围道具（外部补丁，不修改 world.js / art.js / game.js）

   素材来源：Yokai Art: Night Parade of One Hundred Demons
   （Unity 资源解包 → OBJ → 内嵌几何，见 js/models_data.js）

   设计原则：
     · 纯追加 —— 只包一层原方法，原逻辑照常执行
     · 全程 try/catch —— 任何异常只影响装饰，绝不影响战斗
     · 可一键关闭 —— window.ASTRAL_EXTRAS = false
   ========================================================= */
(function () {
  'use strict';

  var T = window.THREE;
  var A = window.AstralArt;
  var M = window.ASTRAL_MODELS;
  var W = window.AstralWorld;

  if (!T || !A || !M || !W || !W.prototype) return;
  if (window.ASTRAL_EXTRAS === false) return;

  var P = W.prototype;

  /* ---------- 几何构建 ---------- */
  function geoFrom(key) {
    var d = M[key];
    if (!d || !d.p || !d.i) return null;
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(d.p.slice(), 3));
    g.setIndex(d.i.slice());
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }

  function ensure(w) {
    if (!w.extras) {
      w.extras = { t: 0, torii: null, tornado: null, tornadoMat: null, hearth: null, hearthMat: null, wisps: [] };
    }
    return w.extras;
  }

  /* ---------- 神社遗址：鸟居 + 圣火盆 ----------
     放在岛屿西南角，朝向岛心，与既有樱花树/水晶簇错开
     -------------------------------------------------- */
  var SHRINE = { x: -9.6, z: -9.2, rotY: Math.atan2(9.6, 9.2) };

  function addShrine(w) {
    var e = ensure(w);

    /* 1) 鸟居 */
    var tg = geoFrom('torii_4');
    if (tg) {
      var gate = new T.Group();
      gate.scale.setScalar(6.6);                  // 归一化高度 1 → 世界 6.6
      gate.position.set(SHRINE.x, 0.02, SHRINE.z);
      gate.rotation.y = SHRINE.rotY;

      var wood = A.toon('#9c3a30', {
        flatShading: true,
        emissive: '#3d0f0c',
        emissiveIntensity: 0.46
      });
      var gateMesh = new T.Mesh(tg, wood);
      gateMesh.castShadow = true;
      gateMesh.receiveShadow = true;
      A.outline(gateMesh, 1.008, '#241a2c');
      gate.add(gateMesh);
      w.root.add(gate);
      e.torii = gate;
    }

    /* 2) 圣火盆（用解包出的 Vortex 碗体当石盆） */
    var bg = geoFrom('Vortex');
    if (bg) {
      var bowl = new T.Group();
      bowl.scale.setScalar(0.95);
      bowl.position.set(SHRINE.x, 0.02, SHRINE.z + 2.1);
      var stone = A.toon('#4b3b55', {
        flatShading: true,
        emissive: '#241a33',
        emissiveIntensity: 0.25
      });
      var bowlMesh = new T.Mesh(bg, stone);
      bowlMesh.castShadow = true;
      bowlMesh.receiveShadow = true;
      bowl.add(bowlMesh);
      w.root.add(bowl);

      /* 盆中圣火 */
      var fireMat = new T.SpriteMaterial({
        map: A.STAR_TEX, color: '#ffb055', transparent: true,
        opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false
      });
      var fire = new T.Sprite(fireMat);
      fire.scale.setScalar(1.5);
      fire.position.set(SHRINE.x, 0.55, SHRINE.z + 2.1);
      w.root.add(fire);
      e.hearth = fire;
      e.hearthMat = fireMat;

      var light = new T.PointLight(0xffa04a, 0.9, 9, 2);
      light.position.set(SHRINE.x, 0.9, SHRINE.z + 2.1);
      w.root.add(light);
      e.hearthLight = light;
    }

    /* 3) 门前星火 */
    if (w.root) {
      for (var i = 0; i < 2; i++) {
        var sp = new T.Sprite(new T.SpriteMaterial({
          map: A.STAR_TEX, color: '#ffd9a0', transparent: true,
          opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false
        }));
        sp.scale.setScalar(0.62);
        sp.position.set(SHRINE.x + (i ? 1.4 : -1.4), 1.1, SHRINE.z + 0.8);
        w.root.add(sp);
        e.wisps.push(sp);
      }
    }

    /* 4) 借用 world.js 自带的石灯笼 */
    try {
      if (typeof w.createLantern === 'function') {
        w.createLantern(new T.Vector3(SHRINE.x - 2.3, 0, SHRINE.z + 1.2), 71);
        w.createLantern(new T.Vector3(SHRINE.x + 2.3, 0, SHRINE.z + 1.2), 72);
      }
    } catch (err) { /* 灯是可选装饰 */ }
  }

  /* ---------- 深渊传送门风暴 ---------- */
  function addSpawnStorm(w) {
    var g = geoFrom('TornadoHigh');
    if (!g || !w.portal) return;
    var e = ensure(w);
    var grp = new T.Group();
    grp.scale.setScalar(3.6);
    grp.position.y = 0.3;
    var mat = A.glow('#a86bff', 0.15, { side: T.DoubleSide });
    var mesh = new T.Mesh(g, mat);
    mesh.renderOrder = 2;
    grp.add(mesh);
    w.portal.add(grp);
    e.tornado = grp;
    e.tornadoMat = mat;
  }

  /* ---------- 挂载 ---------- */
  function patch(name, fn) {
    if (typeof P[name] !== 'function') return;
    var orig = P[name];
    P[name] = function () {
      var r = orig.apply(this, arguments);
      try { fn(this); } catch (err) {
        if (window.console) console.warn('[extras] ' + name + ':', err);
      }
      return r;
    };
  }

  patch('buildScenery', addShrine);     // 鸟居 + 圣火盆（构造期 174 行处调用）
  patch('buildSpawn', addSpawnStorm);   // 传送门风暴（175 行处调用）

  /* ---------- 动画 ---------- */
  if (typeof P.update === 'function') {
    var origUpdate = P.update;
    P.update = function (dt, t) {
      origUpdate.apply(this, arguments);
      try {
        var e = this.extras;
        if (!e) return;
        var d = dt || 0;
        e.t += d;
        var et = e.t;

        if (e.torii) e.torii.rotation.y = SHRINE.rotY + Math.sin(et * 0.22) * 0.012;

        if (e.hearth) {
          e.hearth.scale.setScalar(1.42 + Math.sin(et * 3.1) * 0.1);
          if (e.hearthMat) e.hearthMat.opacity = 0.72 + Math.sin(et * 5.3) * 0.1;
        }
        if (e.hearthLight) {
          e.hearthLight.intensity = 1.05 + Math.sin(et * 4.1) * 0.2;
        }

        for (var i = 0; i < e.wisps.length; i++) {
          var sp = e.wisps[i];
          sp.position.y = 1.1 + Math.sin(et * 1.4 + i * 2.1) * 0.26;
          sp.material.opacity = 0.45 + Math.sin(et * 1.9 + i) * 0.2;
        }

        if (e.tornado) {
          e.tornado.rotation.y += d * 0.42;
          if (e.tornadoMat) e.tornadoMat.opacity = 0.13 + Math.sin(et * 0.9 + 1.3) * 0.05;
        }
      } catch (err) {
        if (window.console) console.warn('[extras] update:', err);
      }
    };
  }

  if (window.console) {
    console.log('%c[星陨战线 · EXTRAS] 已注入：神社鸟居 / 圣火盆 / 深渊风暴  (window.ASTRAL_EXTRAS=false 可关闭)',
      'color:#f3d99b');
  }
})();
