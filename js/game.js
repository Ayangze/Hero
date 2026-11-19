/* =========================================================
   星陨战线 · GAME
   ========================================================= */
(function () {
  'use strict';

  const T = THREE;
  const D = window.GAME_DATA;
  const A = window.AstralArt;
  const AUDIO = window.AstralAudio;
  const C = D.CONSTANTS;
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
  const GAME_CAM = new T.Vector3(29.2, 23.6, 45.6);
  const GAME_LOOK = new T.Vector3(4.2, 1.1, 8.2);
  const MENU_CAM = new T.Vector3(5.9, 5.7, 40.6);
  const MENU_LOOK = new T.Vector3(7.45, 2.12, 26.4);

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  function iconSvg(name) {
    return '<svg viewBox="0 0 32 32">' + (D.ICONS[name] || D.ICONS.star) + '</svg>';
  }

  const TRAIT_TEX_CACHE = new Map();
  function traitTexture(text, color) {
    const key = text + color;
    if (TRAIT_TEX_CACHE.has(key)) return TRAIT_TEX_CACHE.get(key);
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font = '700 30px "Microsoft YaHei", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(7,4,12,.92)';
    ctx.strokeText(text, 128, 34);
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 34);
    const tex = new T.CanvasTexture(c);
    tex.minFilter = T.LinearFilter;
    tex.magFilter = T.LinearFilter;
    tex.needsUpdate = true;
    TRAIT_TEX_CACHE.set(key, tex);
    return tex;
  }

  class Game {
    constructor() {
      this.canvas = $('scene');
      this.app = $('app');
      this.ui = {
        loader: $('loader'), menu: $('menu'), hud: $('hud'),
        gold: $('gold'), coreBar: $('core-bar'), coreFrac: $('core-frac'), coreSub: $('core-sub'),
        btnRepair: $('btn-repair'), wavePreview: $('wave-preview'), wpWave: $('wp-wave'), wpName: $('wp-name'), wpList: $('wp-list'),
        waveNumber: $('wave-number'), waveName: $('wave-name'), waveStatus: $('wave-status'), waveTotal: $('wave-total'),
        waveProgress: $('wave-progress'), bossBar: $('boss-bar'), bossFill: $('boss-fill'), bossName: $('boss-name'),
        mapCap: $('map-cap'), mapSwitch: $('map-switch'), metaDaily: $('meta-daily'),
        bossPhase: $('boss-phase'), bossShield: $('boss-shield'), bossShieldFill: $('boss-shield-fill'),
        announce: $('announce'), announceTitle: $('announce-title'), announceEn: $('announce-en'), announceSub: $('announce-sub'),
        shop: $('shop'), shopTip: $('shop-tip'), callBtn: $('btn-call-wave'), callLabel: $('call-label'),
        callSub: $('call-sub'), summonProgress: $('summon-progress'),
        selection: $('selection-panel'), selImg: $('sel-img'), selRole: $('sel-role'), selName: $('sel-name'),
        selStageFrame: $('sel-stage-frame'), selStageBadge: $('sel-stage-badge'), selStageName: $('sel-stage-name'),
        selStageRail: $('sel-stage-rail'),
        selLevel: $('sel-level'), statDmg: $('stat-dmg'), statSpd: $('stat-spd'), statRange: $('stat-range'),
        statKills: $('stat-kills'), selMods: $('sel-mods'), modCount: $('mod-count'), btnMerge: $('btn-merge'),
        selPriority: $('sel-priority'), upLevel: $('up-level'), btnUpgrade: $('btn-upgrade'), upCost: $('up-cost'),
        mergeHint: $('merge-hint'), btnSell: $('btn-sell'), sellValue: $('sell-value'),
        mergeBanner: $('merge-banner'), mergeScreen: $('merge-screen'), mergeCards: $('merge-cards'),
        mergeTowerName: $('merge-tower-name'), mergeFromLevel: $('merge-from-level'),
        mergeCurrentImg: $('merge-current-img'), mergeCurrentLabel: $('merge-current-label'),
        mergeNextImg: $('merge-next-img'), mergeNextLabel: $('merge-next-label'),
        rerollCount: $('reroll-count'), btnReroll: $('btn-reroll'),
        stageup: $('stageup'), stageupImg: $('stageup-img'), stageupStage: $('stageup-stage'),
        stageupName: $('stageup-name'), stageupSub: $('stageup-sub'), stageupFrame: $('stageup-frame'),
        pause: $('pause-screen'), end: $('end-screen'), guide: $('guide-screen'),
        toast: $('toast-layer'), float: $('float-layer'), padLabels: $('pad-labels'),
        tutorial: $('tutorial'), tutTitle: $('tut-title'), tutText: $('tut-text'),
        buildHint: $('build-hint'), transition: $('transition'),
        endTitle: $('end-title'), endSub: $('end-sub'), endEyebrow: $('end-eyebrow'),
        endWaves: $('end-waves'), endKills: $('end-kills'), endGold: $('end-gold'),
        endTime: $('end-time'), endTeam: $('end-team'), endQuote: $('end-quote'),
        endGrade: $('end-grade'), endRatingLabel: $('end-rating-label'), endAttribution: $('end-attribution'), endDamage: $('end-damage'),
        btnSkill: $('btn-skill'), skillProgress: $('skill-progress'), skillState: $('skill-state'),
        loaderBar: $('loader-bar'), loaderTip: $('loader-tip'),
        diffSwitch: $('diff-switch'), modeSwitch: $('mode-switch'), continueBtn: $('btn-continue'), continueInfo: $('continue-info'),
        menuSettings: $('menu-settings'), settingsScreen: $('settings-screen'), settingsClose: $('settings-close'),
        btnStory: $('btn-story'), storyScreen: $('story-screen'), btnMeta: $('btn-meta'), metaScreen: $('meta-screen'), metaDust: $('meta-dust'), metaUpgrades: $('meta-upgrades'), metaAchievements: $('meta-achievements'), metaAchCount: $('meta-ach-count'), metaClose: $('meta-close'), storyChapter: $('story-chapter'), storySubtitle: $('story-subtitle'),
        storyArt: $('story-art'), storySigil: $('story-sigil'), storySpeaker: $('story-speaker'), storyRole: $('story-role'),
        storyTitle: $('story-title'), storyText: $('story-text'), storyProgress: $('story-progress'),
        storyNext: $('story-next'), storySkip: $('story-skip'), storyClose: $('story-close'),
        settingsOk: $('settings-ok'), setVolume: $('set-volume'), setVolumeVal: $('set-volume-val'),
        setQuality: $('set-quality'), setFont: $('set-font'), setMotion: $('set-motion')
      };

      this.state = 'loading';
      this.paused = false;
      this.mergeOpen = false;
      this.transitioning = false;
      this.ready = false;
      this.time = 0;
      this.last = performance.now();
      this.elapsed = 0;
      this.uiClock = 0;
      this.difficulty = 'normal';
      this.difficultyDef = D.DIFFICULTIES.normal;
      this.mode = 'standard';
      this.mapId = 'cloud';
      this.mapDef = D.MAPS.cloud;
      this.coreMax = C.coreHp;
      this.gold = this.difficultyDef.gold;
      this.coreHp = this.coreMax;
      this.waveIndex = 0;
      this.kills = 0;
      this.towers = [];
      this.enemies = [];
      this.projectiles = [];
      this.deaths = [];
      this.towerSeq = 0;
      this.energy = 0;
      this.skillCd = 0;
      this.skillCasts = 0;
      this.leaks = 0;
      this.leakLog = [];
      this.lastLeak = null;
      this.rerollsUsed = 0;
      this.repairsUsed = 0;
      this.previewKey = '';
      this.waveActive = false;
      this.buildPhase = true;
      this.countdown = C.buildTime;
      this.waveTime = 0;
      this.spawnQueue = [];
      this.spawnCursor = 0;
      this.spawnedCount = 0;
      this.waveTotal = 0;
      this.waveKills = 0;
      this.waveClearTimer = 0;
      this.speed = 1;
      this.zoom = 1;
      this.zoomTarget = 1;
      this.rerolls = C.startRerolls;
      this.selected = null;
      this.buildType = null;
      this.mergeSource = null;
      this.pendingMerge = null;
      this.mergeChoices = [];
      this.hoveredPad = null;
      this.mouse = new T.Vector2(0, 0);
      this.raycaster = new T.Raycaster();
      this.pointer = new T.Vector2();
      this.camLook = new T.Vector3();
      this.camTween = null;
      this.shake = 0;
      this.shakeDecay = 0;
      this.slowTimer = 0;
      this.guideFrom = null;
      this.endOrbit = 0;
      this.announceTimer = null;
      this.padLabelEl = null;
      this.bossSpawned = false;
      this.bossPhase = 1;
      this.towerSlowTimer = 0;
      this.menuVisible = true;
      this.storyOpen = false;
      this.storyIndex = 0;
      this.storySeen = false;
      try { this.storySeen = localStorage.getItem('astral_story_seen') === '1'; } catch (e) {}
      this.meta = null;
      this.metaDamage = 0;
      this.runBossTypes = new Set();
      this.runBossKills = 0;
      this.runMaxGold = 0;
      this.runRecorded = false;
      this.dailyRun = false;
      this.quality = 'high';
      this.qualityCap = 1.4;
      this.reducedMotion = false;
      this.previewStage = null;
      this.stageupTimer = null;
      this.menuHeroes = [];

      this.initRenderer();
      this.initScene();
      this.initPost();
      this.initVFX();
      this.initRange();
      if (this.ui.loaderBar) this.ui.loaderBar.style.width = '38%';
      this.buildUI();
      this.initHeroes();
      this.loadMeta();
      this.loadPreferences();
      this.bindEvents();
      this.resize();
      this.setState('menu');
      this.ready = true;
      this.finishLoading();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    /* =========================================================
       INIT
       ========================================================= */
    initRenderer() {
      this.renderer = new T.WebGLRenderer({
        canvas: this.canvas, antialias: false, alpha: false,
        powerPreference: 'high-performance', stencil: false
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.qualityCap || 1.4));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = T.PCFSoftShadowMap;
      this.renderer.shadowMap.autoUpdate = false;
      this.renderer.shadowMap.needsUpdate = true;
      this.renderer.toneMapping = T.NoToneMapping;
      this.renderer.outputColorSpace = T.SRGBColorSpace;
      this.renderer.autoClear = false;
      this.renderer.setClearColor(0x07050c, 1);
    }

    initScene() {
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 400);
      this.camera.position.copy(MENU_CAM);
      this.camLook.copy(MENU_LOOK);
      this.camera.lookAt(this.camLook);
      this.world = new window.AstralWorld(this.renderer, this.scene);
      this.buildPlane = new T.Plane(new T.Vector3(0, 1, 0), -0.24);
      this.buildPathSamples = Array.from({ length: 220 }, (_, i) => this.world.samplePathAt(i / 219).pos.clone());
      this.buildBlockers = [
        [-14.2, 9.6, 2.9], [19.0, -7.4, 2.4], [-3.0, -17.5, 2.0],
        [-19.4, 2.8, 1.8], [13.6, -12.2, 1.7], [20.2, 9.0, 1.7],
        [-3.6, 14.8, 1.5], [18.4, -1.0, 2.0], [-16.0, -1.2, 2.0], [-11.6, 14.6, 1.9],
        [-9.6, -9.2, 4.2]
      ];
      this.initSkyDressing();
    }

    initSkyDressing() {
      this.scene.add(this.camera);
      const moonTex = A.makeMoonTexture();
      const moon = new T.Sprite(new T.SpriteMaterial({
        map: moonTex, color: 0xffefd8, transparent: true, opacity: 0.9,
        blending: T.AdditiveBlending, depthWrite: false, fog: false
      }));
      moon.position.set(48, 37, -100);
      moon.scale.set(13.5, 13.5, 1);
      moon.renderOrder = -1;
      this.camera.add(moon);
      const halo = new T.Sprite(new T.SpriteMaterial({
        map: A.STAR_TEX, color: 0xffdcb0, transparent: true, opacity: 0.2,
        blending: T.AdditiveBlending, depthWrite: false, fog: false
      }));
      halo.position.copy(moon.position);
      halo.position.z -= 0.5;
      halo.scale.set(26, 26, 1);
      halo.renderOrder = -2;
      this.camera.add(halo);
      const n = 150;
      const geo = new T.BufferGeometry();
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 140;
        pos[i * 3 + 1] = -8 + Math.random() * 60;
        pos[i * 3 + 2] = -90 - Math.random() * 20;
      }
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const stars = new T.Points(geo, new T.PointsMaterial({
        map: A.STAR_TEX, color: 0xfff2dc, size: 0.85, transparent: true,
        opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false,
        sizeAttenuation: true, fog: false
      }));
      stars.frustumCulled = false;
      stars.renderOrder = -3;
      this.camera.add(stars);
      const nebula = new T.Sprite(new T.SpriteMaterial({
        map: A.STAR_TEX, color: 0x8d6bff, transparent: true, opacity: 0.08,
        blending: T.AdditiveBlending, depthWrite: false, fog: false
      }));
      nebula.position.set(-36, 18, -110);
      nebula.scale.set(70, 40, 1);
      nebula.renderOrder = -4;
      this.camera.add(nebula);
      this.skyDressing = { moon, halo, stars, nebula };
    }

    initPost() {
      this.post = new A.PostFX(this.renderer, this.scene, this.camera);
      const buf = this.renderer.getDrawingBufferSize(new T.Vector2());
      this.post.setSize(buf.x, buf.y, 1);
    }

    initVFX() {
      this.vfx = new A.VFX(this.scene);
    }

    stageInfo(level) {
      const n = Math.max(1, Math.min(4, level || 1));
      return D.STAGE_INFO[n - 1];
    }

    stageArt(type, level) {
      const arr = D.STAGE_ART[type];
      const n = Math.max(1, Math.min(arr.length, level || 1));
      return arr[n - 1];
    }

    stageLabel(type, level) {
      const n = Math.max(1, Math.min(4, level || 1));
      return `${D.STAGE_INFO[n - 1].roman} · ${D.TOWERS[type].stages[n - 1]}`;
    }

    artClass(level) {
      return level <= 2 ? 'cutout' : 'full';
    }

    buildUI() {
      const shop = this.ui.shop;
      shop.innerHTML = D.TOWER_ORDER.map((type, i) => {
        const def = D.TOWERS[type];
        const parts = def.name.split('·');
        const name = parts.length > 1 ? parts[1].trim() : def.short;
        const mainArt = this.stageArt(type, 2);
        const spiritArt = this.stageArt(type, 1);
        return `<button class="hero-card stage-shop-card" data-type="${type}" style="--card-color:${def.color};--accent-glow:${def.glow}">
          <span class="card-paper"></span>
          <span class="card-key">${i + 1}</span>
          <span class="card-cost"><i></i>${def.cost}</span>
          <span class="card-spirit" title="灵契形态"><img src="${spiritArt}" alt=""></span>
          <span class="card-portrait"><span class="card-portrait-glow"></span><img class="stage-art cutout" src="${mainArt}" alt=""></span>
          <span class="card-gradient"></span>
          <span class="card-flare"></span>
          <span class="card-info">
            <span class="card-role">${def.role}</span>
            <span class="card-name">${def.short} · ${name}</span>
            <span class="card-title">${def.title} · ${def.en.split(' · ')[0]}</span>
          </span>
          <span class="card-stage-tag">I <i>→</i> IV</span>
          <span class="card-bar"></span>
        </button>`;
      }).join('');
      this.cardEls = Array.from(shop.querySelectorAll('.hero-card'));
      this.ui.mergeFromLevel.textContent = '阶位 I';
      this.ui.rerollCount.textContent = this.rerolls;
    }

    initRange() {
      this.rangeGroup = new T.Group();
      const fill = new T.Mesh(new T.CircleGeometry(1, 72), new T.MeshBasicMaterial({
        color: 0x9cefff, transparent: true, opacity: 0.035, depthWrite: false, side: T.DoubleSide
      }));
      fill.rotation.x = -Math.PI / 2;
      const ring = new T.Mesh(new T.RingGeometry(0.988, 1, 96), new T.MeshBasicMaterial({
        color: 0x9cefff, transparent: true, opacity: 0.65, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending
      }));
      ring.rotation.x = -Math.PI / 2;
      const inner = new T.Mesh(new T.RingGeometry(0.72, 0.726, 96), new T.MeshBasicMaterial({
        color: 0x9cefff, transparent: true, opacity: 0.18, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending
      }));
      inner.rotation.x = -Math.PI / 2;
      this.rangeGroup.add(fill, ring, inner);
      this.rangeGroup.visible = false;
      this.rangeGroup.position.y = 0.3;
      this.scene.add(this.rangeGroup);
      this.rangeFill = fill;
      this.rangeRing = ring;
      this.rangeInner = inner;

      const ghost = new T.Group();
      const ghostRune = A.makeRunePlane(2.3, '#9cefff', 0.42);
      ghostRune.rotation.x = -Math.PI / 2;
      ghostRune.position.y = 0.02;
      const ghostRing = new T.Mesh(new T.RingGeometry(1.42, 1.55, 64), new T.MeshBasicMaterial({
        color: 0x9cefff, transparent: true, opacity: 0.9, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending
      }));
      ghostRing.rotation.x = -Math.PI / 2;
      const ghostFill = new T.Mesh(new T.CircleGeometry(1.5, 48), new T.MeshBasicMaterial({
        color: 0x9cefff, transparent: true, opacity: 0.08, depthWrite: false, side: T.DoubleSide
      }));
      ghostFill.rotation.x = -Math.PI / 2;
      ghost.add(ghostRune, ghostFill, ghostRing);
      ghost.visible = false;
      ghost.position.y = 0.27;
      this.scene.add(ghost);
      this.buildGhost = ghost;
      this.ghostRune = ghostRune;
      this.ghostRing = ghostRing;
      this.ghostFill = ghostFill;

      this.mergeFx = new T.Group();
      this.scene.add(this.mergeFx);
    }

    initHeroes() {
      const positions = this.world.plinthPositions || [];
      const heroCount = D.TOWER_ORDER.length;
      D.TOWER_ORDER.forEach((type, i) => {
        const char = A.CharacterFactory.create(type, 3);
        if (positions[i]) char.position.copy(positions[i]);
        else char.position.set((i - (heroCount - 1) / 2) * 2.45, 0.62, 27.6);
        char.rotation.y = -0.2 + (i - 1) * 0.06;
        char.scale.multiplyScalar(0.98);
        this.scene.add(char);
        this.menuHeroes.push(char);
      });
      if (this.ui.loaderBar) this.ui.loaderBar.style.width = '72%';
    }

    finishLoading() {
      this.ui.loaderTip.textContent = '星轨已就位';
      if (this.ui.loaderBar) this.ui.loaderBar.style.width = '100%';
      setTimeout(() => {
        this.ui.loader.classList.add('out');
        this.ui.menu.classList.remove('hidden');
        document.body.classList.add('cinematic');
        setTimeout(() => document.body.classList.remove('cinematic'), 2400);
      }, 480);
    }

    /* =========================================================
       CAMERA
       ========================================================= */
    setCameraImmediate(pos, look) {
      this.camera.position.copy(pos);
      this.camLook.copy(look);
      this.camera.lookAt(this.camLook);
    }

    cameraTweenTo(pos, look, dur) {
      this.camTween = {
        fromPos: this.camera.position.clone(), toPos: pos.clone(),
        fromLook: this.camLook.clone(), toLook: look.clone(),
        t: 0, dur: dur || 1.2
      };
    }

    updateCamera(dt) {
      if (this.camTween) {
        const tw = this.camTween;
        tw.t += dt;
        const k = clamp(tw.t / tw.dur, 0, 1);
        const e = easeInOutCubic(k);
        this.camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
        this.camLook.lerpVectors(tw.fromLook, tw.toLook, e);
        if (k >= 1) this.camTween = null;
        this.camera.lookAt(this.camLook);
        return;
      }
      if (this.state === 'menu') {
        const t = this.time;
        const pos = MENU_CAM.clone().add(new T.Vector3(Math.sin(t * 0.08) * 0.55, Math.sin(t * 0.11) * 0.16, Math.cos(t * 0.06) * 0.4));
        this.camera.position.lerp(pos, 1 - Math.pow(0.001, dt));
        const look = MENU_LOOK.clone().add(new T.Vector3(Math.sin(t * 0.07) * 0.2, 0, 0));
        this.camLook.lerp(look, 1 - Math.pow(0.001, dt));
        this.camera.lookAt(this.camLook);
        return;
      }
      if (this.state === 'merge') {
        this.camera.lookAt(this.camLook);
        return;
      }
      if (this.state === 'end' || this.state === 'victory' || this.state === 'defeat') {
        this.endOrbit += dt * 0.06;
        const core = this.world.coreGroup ? this.world.coreGroup.position : new T.Vector3(12, 0, 12);
        const r = 11;
        const pos = new T.Vector3(core.x + Math.cos(this.endOrbit) * r, 7.5, core.z + Math.sin(this.endOrbit) * r);
        this.camera.position.lerp(pos, 1 - Math.pow(0.03, dt));
        this.camLook.lerp(new T.Vector3(core.x, 2.2, core.z), 1 - Math.pow(0.03, dt));
        this.camera.lookAt(this.camLook);
        return;
      }
      this.zoom += (this.zoomTarget - this.zoom) * (1 - Math.pow(0.002, dt));
      const base = GAME_LOOK.clone().add(GAME_CAM.clone().sub(GAME_LOOK).multiplyScalar(this.zoom));
      base.x += this.mouse.x * 1.1 * this.zoom;
      base.y += this.mouse.y * -0.55 * this.zoom;
      base.z += this.mouse.x * 0.35 * this.zoom;
      const look = GAME_LOOK.clone();
      look.x += this.mouse.x * 0.7 * this.zoom;
      look.z += this.mouse.y * 0.4 * this.zoom;
      this.camera.position.lerp(base, 1 - Math.pow(0.01, dt));
      this.camLook.lerp(look, 1 - Math.pow(0.01, dt));
      if (this.shake > 0.001) {
        const s = this.shake;
        this.camera.position.x += (Math.random() - 0.5) * s;
        this.camera.position.y += (Math.random() - 0.5) * s;
        this.camera.position.z += (Math.random() - 0.5) * s;
        this.shake *= Math.pow(0.002, dt);
      }
      this.camera.lookAt(this.camLook);
    }

    adjustZoom(delta) {
      this.zoomTarget = clamp(this.zoomTarget + delta, 0.68, 1.55);
      if (this.camTween) this.camTween = null;
    }

    shakeScreen(amount) {
      if (this.reducedMotion) return;
      this.shake = Math.max(this.shake, amount || 0.2);
    }

    /* =========================================================
       STATE
       ========================================================= */
    setState(state) {
      this.state = state;
      if (state === 'menu') {
        this.world.showMenu(true);
        this.menuHeroes.forEach(c => c.visible = true);
        this.ui.menu.classList.remove('hidden');
        this.ui.hud.classList.add('hidden');
      }
    }

    startGame(checkpoint) {
      if (this.transitioning || this.state === 'playing') return;
      const resume = checkpoint || null;
      if (resume) {
        this.difficulty = D.DIFFICULTIES[resume.difficulty] ? resume.difficulty : 'normal';
        this.mode = resume.mode === 'endless' ? 'endless' : 'standard';
        this.mapId = D.MAPS[resume.mapId] ? resume.mapId : 'cloud';
        this.mapDef = D.MAPS[this.mapId];
        this.updateMenuSwitch();
      } else {
        this.clearCheckpoint();
      }
      AUDIO.init(); AUDIO.resume(); AUDIO.play('ui');
      this.transitioning = true;
      this.ui.transition.classList.remove('flash');
      this.ui.transition.classList.add('on');
      this.ui.menu.classList.add('hidden');
      setTimeout(() => {
        this.world.showMenu(false);
        this.menuHeroes.forEach(c => c.visible = false);
        this.renderer.shadowMap.needsUpdate = true;
        this.resetRun();
        if (resume) this.applyCheckpoint(resume);
        this.setCameraImmediate(new T.Vector3(17, 41, 36), new T.Vector3(0, 0, 0));
        this.ui.hud.classList.remove('hidden');
        this.ui.transition.classList.remove('on');
        this.setState('playing');
        this.cameraTweenTo(GAME_CAM, GAME_LOOK, 2.9);
        this.transitioning = false;
        AUDIO.setMood('build');
        if (!resume) {
          setTimeout(() => this.showAnnounce('序章 · 星门将坠', 'PROLOGUE · THE LAST GATE', '星核不灭，守望不止', 3000), 500);
          this.showTutorial('星核告急', '深渊军团即将抵达。点击下方守卫卡牌，再点击星路之外的草地部署。');
          this.ui.buildHint.classList.remove('hidden');
        } else {
          this.toast('已恢复上次远征 · 布防期', 'good');
          this.ui.buildHint.classList.remove('hidden');
        }
        this.updateContinueButton();
        this.refreshPadStates();
      }, 760);
    }

    resetRun() {
      this.clearRunObjects();
      this.state = 'playing';
      this.paused = false;
      this.mergeOpen = false;
      this.pendingMerge = null;
      this.mergeSource = null;
      this.selected = null;
      this.buildType = null;
      this.waveIndex = 0;
      this.kills = 0;
      this.mapDef = D.MAPS[this.mapId] || D.MAPS.cloud;
      this.applyMapTheme();
      this.difficultyDef = D.DIFFICULTIES[this.difficulty] || D.DIFFICULTIES.normal;
      this.coreMax = this.difficultyDef.core;
      this.gold = this.difficultyDef.gold;
      this.coreHp = this.coreMax;
      this.energy = 0;
      this.skillCd = 0;
      this.skillCasts = 0;
      this.leaks = 0;
      this.leakLog = [];
      this.lastLeak = null;
      this.rerollsUsed = 0;
      this.repairsUsed = 0;
      this.previewKey = '';
      this.elapsed = 0;
      this.tutorialShownFusion = false;
      this.rerolls = C.startRerolls;
      const metaUp = (this.meta && this.meta.upgrades) || {};
      this.gold += (metaUp.gold || 0) * 40;
      this.coreMax += (metaUp.core || 0) * 2;
      this.coreHp = this.coreMax;
      this.rerolls += metaUp.reroll || 0;
      this.metaDamage = (metaUp.damage || 0) * 0.03;
      this.runBossTypes = new Set();
      this.runBossKills = 0;
      this.runMaxGold = this.gold;
      this.runRecorded = false;
      this.speed = 1;
      this.zoom = 1;
      this.zoomTarget = 1;
      this.waveActive = false;
      this.buildPhase = true;
      this.countdown = C.buildTime;
      this.waveTime = 0;
      this.spawnQueue = [];
      this.spawnCursor = 0;
      this.spawnedCount = 0;
      this.waveTotal = 0;
      this.waveKills = 0;
      this.waveClearTimer = 0;
      this.slowTimer = 0;
      this.shake = 0;
      this.bossSpawned = false;
      this.bossPhase = 1;
      this.towerSlowTimer = 0;
      this.world.setCoreHealth(1);
      this.world.pads.forEach(p => {
        p.occupied = false;
        this.world.setPadState(p.index, 'idle');
      });
      this.hideSelection();
      this.cancelMergeMode();
      this.ui.mergeScreen.classList.add('hidden');
      this.ui.stageup.classList.add('hidden');
      this.ui.stageup.classList.remove('show');
      clearTimeout(this.stageupTimer);
      this.ui.pause.classList.add('hidden');
      this.ui.end.classList.add('hidden');
      this.ui.guide.classList.add('hidden');
      this.ui.bossBar.classList.add('hidden');
      this.ui.tutorial.classList.add('hidden');
      this.ui.buildHint.classList.remove('hidden');
      this.ui.selection.classList.add('hidden');
      this.ui.mergeBanner.classList.add('hidden');
      this.ui.toast.innerHTML = '';
      this.ui.float.innerHTML = '';
      this.ui.mergeCards.innerHTML = '';
      this.ui.shopTip.textContent = '选择卡牌后点击星路之外部署';
      this.clearBuildSelection();
      this.speedButtons && this.speedButtons.forEach(b => b.classList.toggle('active', b.dataset.speed === '1'));
      this.updateHud(true);
      this.updateAudioMood();
    }

    clearRunObjects() {
      this.towers.forEach(t => {
        if (t.char) {
          this.scene.remove(t.char);
          A.CharacterFactory.dispose(t.char);
        }
        if (t.shadow) { this.scene.remove(t.shadow); t.shadow.geometry.dispose(); t.shadow.material.dispose(); }
      });
      this.enemies.forEach(e => {
        if (e.group) {
          this.scene.remove(e.group);
          A.EnemyFactory.dispose(e.group);
        }
        if (e.bar) {
          this.scene.remove(e.bar);
          e.bar.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
        }
      });
      this.projectiles.forEach(p => {
        if (p.mesh) {
          this.scene.remove(p.mesh);
          A.CharacterFactory.dispose(p.mesh);
        }
      });
      this.deaths.forEach(d => {
        this.scene.remove(d.group);
        A.CharacterFactory.dispose(d.group);
      });
      this.towers = [];
      this.enemies = [];
      this.projectiles = [];
      this.deaths = [];
      this.towerSeq = 0;
      this.rangeGroup.visible = false;
      if (this.buildGhost) this.buildGhost.visible = false;
      if (this.mergeFx) {
        while (this.mergeFx.children.length) {
          const c = this.mergeFx.children.pop();
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        }
      }
      this.hoveredPad = null;
      if (this.world) {
        this.world.pads.forEach(p => {
          p.occupied = false;
          this.world.setPadState(p.index, 'idle');
        });
      }
    }

    replayGame() {
      this.clearCheckpoint();
      this.ui.end.classList.add('hidden');
      this.ui.hud.classList.remove('hidden');
      this.world.showMenu(false);
      this.menuHeroes.forEach(c => c.visible = false);
      this.resetRun();
      this.setCameraImmediate(new T.Vector3(18, 40, 36), new T.Vector3(0, 0, 0));
      this.cameraTweenTo(GAME_CAM, GAME_LOOK, 2.2);
      this.setState('playing');
      AUDIO.setMood('build');
      this.showAnnounce('再次远征', 'EXPEDITION II', '命运将在此重写', 2200);
      this.showTutorial('星核告急', '点击下方守卫卡牌，再点击星路之外的草地部署。');
      this.ui.buildHint.classList.remove('hidden');
    }

    goHome() {
      if (this.transitioning) return;
      this.transitioning = true;
      this.ui.transition.classList.add('on');
      setTimeout(() => {
        this.clearRunObjects();
        this.state = 'menu';
        this.paused = false;
        this.mergeOpen = false;
        this.ui.hud.classList.add('hidden');
        this.ui.end.classList.add('hidden');
        this.ui.pause.classList.add('hidden');
        this.ui.guide.classList.add('hidden');
        this.ui.mergeScreen.classList.add('hidden');
        this.ui.menu.classList.remove('hidden');
        this.world.showMenu(true);
        this.world.setCoreHealth(1);
        this.menuHeroes.forEach(c => c.visible = true);
        this.updateContinueButton();
        this.updateMenuSwitch();
        this.renderer.shadowMap.needsUpdate = true;
        this.setCameraImmediate(MENU_CAM, MENU_LOOK);
        this.ui.transition.classList.remove('on');
        this.transitioning = false;
        AUDIO.setMood('menu');
      }, 720);
    }

    endGame(victory) {
      if (this.state === 'victory' || this.state === 'defeat' || this.state === 'end') return;
      this.clearCheckpoint();
      this.state = victory ? 'victory' : 'defeat';
      this.paused = true;
      this.mergeOpen = false;
      this.ui.selection.classList.add('hidden');
      this.ui.mergeBanner.classList.add('hidden');
      this.ui.tutorial.classList.add('hidden');
      this.ui.buildHint.classList.add('hidden');
      this.ui.mergeScreen.classList.add('hidden');
      this.ui.stageup.classList.add('hidden');
      this.ui.stageup.classList.remove('show');
      this.ui.guide.classList.add('hidden');
      this.ui.bossBar.classList.add('hidden');
      this.hideRange();
      this.cancelMergeMode();
      this.endOrbit = Math.atan2(this.camera.position.z - 14, this.camera.position.x - 14);
      setTimeout(() => {
        this.ui.hud.classList.add('hidden');
        this.ui.end.classList.remove('hidden');
        AUDIO.play(victory ? 'victory' : 'defeat');
        AUDIO.setMood(victory ? 'menu' : 'defeat');
        this.recordRun(victory);
        this.fillEndScreen(victory);
        if (this.lastMetaUnlocks && this.lastMetaUnlocks.length) {
          this.ui.endAttribution.textContent += ` · 新成就 ${this.lastMetaUnlocks.join('、')}`;
        }
      }, victory ? 1800 : 1100);
      this.ui.endEyebrow.textContent = victory ? 'THE STARS REMEMBER' : 'THE LIGHT FADES';
      this.ui.endTitle.textContent = victory ? '星核永驻' : '星陨之夜';
      this.ui.endSub.textContent = victory
        ? '云海重归寂静。少女们的名字，被刻进了星图。'
        : '星核的辉光熄灭了。但星轨仍在等待下一次重叠。';
      this.ui.endQuote.textContent = victory
        ? '“只要星光仍被记得，守望就不会终结。”'
        : '“坠落的星辰，也会在别处重新升起。”';
      this.ui.end.classList.toggle('victory', victory);
      this.ui.end.classList.toggle('defeat', !victory);
      if (victory) {
        const core = this.world.coreGroup ? this.world.coreGroup.position : new T.Vector3(14, 0, 16);
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            this.vfx.burst(new T.Vector3(core.x + (Math.random() - 0.5) * 5, 2 + Math.random() * 4, core.z + (Math.random() - 0.5) * 5), '#ffd889', 30, { speed: 4, life: 1.6, size: 0.32, gravity: 1.2 });
            this.vfx.ring(new T.Vector3(core.x, 0.3, core.z), '#ffd889', 3 + i * 0.6, { dur: 1.2 });
          }, i * 280);
        }
      }
    }

    fillEndScreen(victory) {
      this.ui.endWaves.textContent = victory && this.mode !== 'endless' ? C.maxWaves : Math.max(0, this.waveIndex);
      this.ui.endKills.textContent = fmt(this.kills);
      this.ui.endGold.textContent = fmt(this.gold);
      this.ui.endTime.textContent = fmtTime(this.elapsed);
      const best = {};
      this.towers.forEach(t => {
        if (!best[t.type] || best[t.type].level < t.level) best[t.type] = t;
      });
      const team = D.TOWER_ORDER.filter(type => best[type] || victory).map(type => {
        const t = best[type];
        const lv = t ? t.level : 1;
        return `<div class="team-portrait"><img class="stage-art ${this.artClass(lv)}" src="${this.stageArt(type, lv)}" alt=""><span>${t ? 'LV.' + ROMAN[t.level] : 'LV.I'}</span></div>`;
      }).join('');
      this.ui.endTeam.innerHTML = team || '';

      const allMax = this.towers.length > 0 && this.towers.every(t => t.level >= C.maxLevel);
      let score = victory ? 45 : Math.min(35, this.waveIndex * 4);
      score += Math.round(this.coreHp / this.coreMax * 25);
      score += this.leaks === 0 ? 12 : Math.max(0, 12 - this.leaks * 4);
      if (this.rerollsUsed === 0) score += 6;
      if (this.repairsUsed === 0) score += 3;
      if (allMax) score += 6;
      if (this.skillCasts > 0) score += 2;
      if (this.elapsed < 600) score += 3;
      score -= Math.max(0, Math.floor((this.elapsed - 720) / 120));
      const grade = score >= 88 ? 'S' : score >= 72 ? 'A' : score >= 55 ? 'B' : 'C';
      const labels = { S: '星轨完美', A: '星轨稳固', B: '星轨微裂', C: '星轨残响' };
      this.ui.endGrade.textContent = grade;
      this.ui.endGrade.className = 'end-grade grade-' + grade.toLowerCase();
      this.ui.endRatingLabel.textContent = labels[grade];

      if (victory) {
        const extras = [];
        const diffName = (D.DIFFICULTIES[this.difficulty] || D.DIFFICULTIES.normal).name;
        extras.push(`地图 ${this.mapDef.name}`);
        extras.push(`难度 ${diffName}`);
        if (this.mode === 'endless') extras.push('无尽模式');
        extras.push(`星核 ${this.coreHp} / ${this.coreMax}`);
        extras.push(`漏怪 ${this.leaks}`);
        extras.push(`重掷 ${this.rerollsUsed}`);
        extras.push(`修复 ${this.repairsUsed}`);
        if (allMax) extras.push('全员 IV 阶');
        this.ui.endAttribution.textContent = `星轨评级依据：${extras.join(' · ')}`;
      } else {
        const counts = {};
        this.leakLog.forEach(l => { counts[l.name] = (counts[l.name] || 0) + 1; });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        const bits = [];
        if (this.lastLeak) bits.push(`最后一次漏怪：第 ${this.lastLeak.wave} 波 · ${this.lastLeak.name}`);
        if (top) bits.push(`主要威胁：${top[0]} ×${top[1]}`);
        const diffName = (D.DIFFICULTIES[this.difficulty] || D.DIFFICULTIES.normal).name;
        bits.push(`地图 ${this.mapDef.name}`);
        bits.push(`难度 ${diffName}${this.mode === 'endless' ? ' · 无尽' : ''}`);
        bits.push(`当时场上 ${this.towers.length} 座守卫`);
        this.ui.endAttribution.textContent = `远征止于第 ${this.waveIndex} 波 · ${bits.join(' · ')}`;
      }

      const rows = this.towers.filter(t => (t.damageDone || 0) > 0)
        .sort((a, b) => b.damageDone - a.damageDone).slice(0, 6);
      const topDmg = rows.length ? rows[0].damageDone : 1;
      this.ui.endDamage.innerHTML = rows.length ? rows.map(t => {
        const def = D.TOWERS[t.type];
        const pct = Math.max(2, Math.round(t.damageDone / topDmg * 100));
        return `<div class="end-dmg-row">
          <span class="end-dmg-name"><i style="background:${def.color}"></i>${def.short} <em>${ROMAN[t.level]}</em></span>
          <div class="end-dmg-bar"><i style="width:${pct}%;background:${def.color}"></i></div>
          <span class="end-dmg-val">${fmt(t.damageDone)}</span>
        </div>`;
      }).join('') : '<div class="end-dmg-empty">没有守卫造成伤害</div>';
    }

    /* =========================================================
       UI EVENTS
       ========================================================= */
    bindEvents() {
      this.speedButtons = Array.from(document.querySelectorAll('.speed-switch button'));
      $('btn-start').addEventListener('click', () => this.startNewGame());
      this.ui.continueBtn.addEventListener('click', () => this.continueGame());
      this.ui.diffSwitch.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-diff]');
        if (!b) return;
        this.difficulty = b.dataset.diff;
        this.updateMenuSwitch();
        this.savePreferences();
        AUDIO.play('ui');
      });
      this.ui.mapSwitch.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-map]');
        if (!b || !D.MAPS[b.dataset.map]) return;
        this.mapId = b.dataset.map;
        this.mapDef = D.MAPS[this.mapId];
        this.updateMenuSwitch();
        this.savePreferences();
        this.applyMapTheme();
        AUDIO.play('ui');
      });
      this.ui.modeSwitch.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-mode]');
        if (!b) return;
        this.mode = b.dataset.mode;
        this.updateMenuSwitch();
        this.savePreferences();
        AUDIO.play('ui');
      });
      this.ui.menuSettings.addEventListener('click', () => this.openSettings());
      this.ui.btnStory.addEventListener('click', () => this.openStory());
      this.ui.btnMeta.addEventListener('click', () => this.openMeta());
      this.ui.metaClose.addEventListener('click', () => this.closeMeta());
      this.ui.metaDaily.addEventListener('click', () => this.startDaily());
      this.ui.metaUpgrades.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-upgrade]');
        if (b) this.buyMetaUpgrade(b.dataset.upgrade);
      });
      this.ui.storyNext.addEventListener('click', () => this.nextStory());
      this.ui.storySkip.addEventListener('click', () => this.closeStory(true));
      this.ui.storyClose.addEventListener('click', () => this.closeStory(false));
      this.ui.settingsClose.addEventListener('click', () => this.closeSettings());
      this.ui.settingsOk.addEventListener('click', () => this.closeSettings());
      this.ui.setVolume.addEventListener('input', (e) => {
        const v = Number(e.target.value) / 100;
        AUDIO.init(); AUDIO.setVolume(v);
        this.ui.setVolumeVal.textContent = Math.round(v * 100) + '%';
        this.savePreferences();
      });
      this.ui.setQuality.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-q]');
        if (!b) return;
        this.quality = b.dataset.q;
        this.qualityCap = this.quality === 'high' ? 1.4 : this.quality === 'medium' ? 1.0 : 0.75;
        this.updateSettingsUI();
        this.resize();
        this.savePreferences();
        AUDIO.play('ui');
      });
      this.ui.setFont.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-f]');
        if (!b) return;
        document.body.classList.toggle('ui-large', b.dataset.f === 'large');
        this.updateSettingsUI();
        this.savePreferences();
        AUDIO.play('ui');
      });
      this.ui.setMotion.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-m]');
        if (!b) return;
        this.reducedMotion = b.dataset.m === 'reduced';
        document.body.classList.toggle('reduced-motion', this.reducedMotion);
        this.updateSettingsUI();
        this.savePreferences();
        AUDIO.play('ui');
      });
      $('btn-guide').addEventListener('click', () => this.openGuide('menu'));
      $('menu-help').addEventListener('click', () => this.openGuide('menu'));
      $('btn-help') && $('btn-help').addEventListener('click', () => this.openGuide('game'));
      $('btn-pause').addEventListener('click', () => this.togglePause());
      $('btn-resume').addEventListener('click', () => this.togglePause(false));
      $('btn-pause-guide').addEventListener('click', () => { this.ui.pause.classList.add('hidden'); this.openGuide('pause'); });
      $('btn-restart').addEventListener('click', () => this.goHome());
      $('btn-replay').addEventListener('click', () => this.replayGame());
      $('btn-home').addEventListener('click', () => this.goHome());
      $('btn-call-wave').addEventListener('click', () => this.callWave());
      $('guide-close').addEventListener('click', () => this.closeGuide());
      $('guide-ok').addEventListener('click', () => this.closeGuide());
      $('sel-close').addEventListener('click', () => this.hideSelection());
      this.ui.selStageRail.addEventListener('click', (e) => {
        const step = e.target.closest('.stage-step');
        if (!step || !this.selected) return;
        const n = Number(step.dataset.stage);
        this.previewStage = n === this.selected.level ? null : n;
        this.updateSelectionPanel();
        AUDIO.play('hover');
      });
      $('btn-merge').addEventListener('click', () => this.toggleMergeMode());
      $('btn-sell').addEventListener('click', () => this.sellSelected());
      this.ui.btnUpgrade.addEventListener('click', () => this.upgradeSelected());
      this.ui.selPriority.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-mode]');
        if (!b || !this.selected) return;
        this.selected.targetMode = b.dataset.mode;
        this.updateSelectionPanel();
        this.toast('目标优先级：' + b.textContent, '');
        AUDIO.play('ui');
      });
      this.ui.btnRepair.addEventListener('click', () => this.repairCore());
      this.ui.btnSkill.addEventListener('click', () => this.castSkill());
      $('merge-cancel').addEventListener('click', () => this.cancelMergeMode());
      $('btn-reroll').addEventListener('click', () => this.rerollMerge());
      $('tut-close').addEventListener('click', () => this.ui.tutorial.classList.add('hidden'));
      this.ui.shop.addEventListener('click', (e) => {
        const card = e.target.closest('.hero-card');
        if (!card) return;
        this.selectBuildType(card.dataset.type);
      });
      this.speedButtons.forEach(b => b.addEventListener('click', () => {
        this.speed = Number(b.dataset.speed) || 1;
        this.speedButtons.forEach(x => x.classList.toggle('active', x === b));
        AUDIO.play('ui');
      }));
      ['btn-audio', 'menu-audio'].forEach(id => {
        const b = $(id);
        if (b) b.addEventListener('click', () => this.toggleAudio());
      });
      $('btn-speed').addEventListener('click', () => {
        this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 3 : 1;
        this.speedButtons.forEach(x => x.classList.toggle('active', Number(x.dataset.speed) === this.speed));
        AUDIO.play('ui');
      });
      this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
      this.canvas.addEventListener('pointerdown', (e) => {
        if (e.button === 0) this.onCanvasClick(e);
      });
      this.canvas.addEventListener('wheel', (e) => {
        if (this.state !== 'playing' || this.mergeOpen || this.paused) return;
        e.preventDefault();
        this.adjustZoom(e.deltaY > 0 ? -0.075 : 0.075);
      }, { passive: false });
      $('btn-zoom-in').addEventListener('click', () => this.adjustZoom(0.1));
      $('btn-zoom-out').addEventListener('click', () => this.adjustZoom(-0.1));
      this.canvas.addEventListener('pointerleave', () => {
        this.hoveredPad = null;
        this.refreshPadStates();
        this.hidePadLabel();
      });
      window.addEventListener('contextmenu', (e) => {
        if (this.state === 'playing') { e.preventDefault(); this.cancelInteractions(); }
      });
      window.addEventListener('keydown', (e) => this.onKey(e));
      window.addEventListener('pointerdown', () => AUDIO.init(), { once: true });
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('blur', () => {
        if (this.state === 'playing' && !this.paused && !this.mergeOpen) this.togglePause(true);
      });
      const muted = (() => { try { return localStorage.getItem('astral_muted') === '1'; } catch (e) { return false; } })();
      AUDIO.muted = muted;
      this.updateAudioButtons();
      this.ui.btnReroll.addEventListener('click', () => this.rerollMerge());
    }

    loadMeta() {
      const defaults = {
        stardust: 0,
        upgrades: {},
        achievements: {},
        profile: {
          runs: 0, wins: 0, winsHard: 0, winsNightmare: 0, noLeakWins: 0, noRerollWins: 0,
          bossKills: 0, bossTypes: [], kills: 0, bestWave: 0, bestEndless: 0,
          allMaxRun: false, maxMods: 0, maxUpgrade: 0, skillCasts: 0, maxGold: 0,
          clearedMaps: [], upgradeBuys: 0, dailyRuns: 0
        }
      };
      let stored = null;
      try { stored = JSON.parse(localStorage.getItem('astral_meta_v1') || 'null'); } catch (e) {}
      this.meta = defaults;
      if (stored && typeof stored === 'object') {
        this.meta.stardust = Number(stored.stardust) || 0;
        this.meta.upgrades = Object.assign({}, stored.upgrades || {});
        this.meta.achievements = Object.assign({}, stored.achievements || {});
        this.meta.profile = Object.assign({}, defaults.profile, stored.profile || {});
        if (!Array.isArray(this.meta.profile.bossTypes)) this.meta.profile.bossTypes = [];
        if (!Array.isArray(this.meta.profile.clearedMaps)) this.meta.profile.clearedMaps = [];
      }
    }

    saveMeta() {
      try { localStorage.setItem('astral_meta_v1', JSON.stringify(this.meta)); } catch (e) {}
    }

    metaRank(id) { return (this.meta && this.meta.upgrades && this.meta.upgrades[id]) || 0; }

    openMeta() {
      if (this.state !== 'menu') return;
      this.renderMeta();
      this.ui.metaScreen.classList.remove('hidden');
      AUDIO.play('ui');
    }

    closeMeta() {
      this.ui.metaScreen.classList.add('hidden');
      this.saveMeta();
      AUDIO.play('ui');
    }

    renderMeta() {
      if (!window.ASTRAL_META || !this.ui.metaUpgrades) return;
      this.ui.metaDust.textContent = this.meta.stardust || 0;
      this.ui.metaUpgrades.innerHTML = window.ASTRAL_META.upgrades.map(def => {
        const rank = this.metaRank(def.id);
        const maxed = rank >= def.max;
        const cost = maxed ? 0 : def.cost[rank];
        const can = !maxed && this.meta.stardust >= cost;
        return `<div class="meta-upgrade ${maxed ? 'maxed' : ''}">
          <div class="meta-upgrade-icon">${def.icon}</div>
          <div class="meta-upgrade-copy"><b>${def.name} <em>${rank}/${def.max}</em></b><em>${def.en}</em><p>${def.desc}</p></div>
          <button class="meta-buy" data-upgrade="${def.id}" ${(!can || maxed) ? 'disabled' : ''}>${maxed ? '已满' : `✦ ${cost}`}</button>
        </div>`;
      }).join('');
      const unlocked = window.ASTRAL_META.achievements.filter(a => this.meta.achievements[a.id]).length;
      this.ui.metaAchCount.textContent = `${unlocked} / ${window.ASTRAL_META.achievements.length}`;
      this.ui.metaAchievements.innerHTML = window.ASTRAL_META.achievements.map(a => {
        const on = !!this.meta.achievements[a.id];
        return `<div class="meta-ach ${on ? 'on' : ''}"><div class="meta-ach-icon">${on ? '✦' : '·'}</div><div><b>${a.name}</b><em>${a.desc}</em></div></div>`;
      }).join('');
    }

    buyMetaUpgrade(id) {
      const def = window.ASTRAL_META.upgrades.find(u => u.id === id);
      if (!def) return;
      const rank = this.metaRank(id);
      if (rank >= def.max) return;
      const cost = def.cost[rank];
      if (this.meta.stardust < cost) return;
      this.meta.stardust -= cost;
      this.meta.upgrades[id] = rank + 1;
      this.meta.profile.upgradeBuys = (this.meta.profile.upgradeBuys || 0) + 1;
      this.checkAchievements();
      this.saveMeta();
      this.renderMeta();
      AUDIO.play('gold');
    }

    checkAchievements() {
      const unlocked = [];
      if (!window.ASTRAL_META) return unlocked;
      window.ASTRAL_META.achievements.forEach(a => {
        if (this.meta.achievements[a.id]) return;
        let ok = false;
        try { ok = !!a.check(this.meta.profile); } catch (e) {}
        if (ok) {
          this.meta.achievements[a.id] = true;
          unlocked.push(a.name);
        }
      });
      return unlocked;
    }

    recordRun(victory) {
      if (this.runRecorded) return;
      this.runRecorded = true;
      const p = this.meta.profile;
      p.runs++;
      if (this.dailyRun) p.dailyRuns = (p.dailyRuns || 0) + 1;
      if (victory) {
        p.wins++;
        if (this.difficulty === 'hard') p.winsHard++;
        if (this.difficulty === 'nightmare') p.winsNightmare++;
        if (this.leaks === 0) p.noLeakWins++;
        if (this.rerollsUsed === 0) p.noRerollWins++;
        if (!p.clearedMaps.includes(this.mapId)) p.clearedMaps.push(this.mapId);
      }
      p.kills = (p.kills || 0) + this.kills;
      p.bossKills = (p.bossKills || 0) + (this.runBossKills || 0);
      p.bossTypes = Array.from(new Set((p.bossTypes || []).concat(Array.from(this.runBossTypes || []))));
      p.bestWave = Math.max(p.bestWave || 0, this.waveIndex || 0);
      if (this.mode === 'endless') p.bestEndless = Math.max(p.bestEndless || 0, this.waveIndex || 0);
      p.skillCasts = (p.skillCasts || 0) + (this.skillCasts || 0);
      p.maxGold = Math.max(p.maxGold || 0, this.runMaxGold || 0);
      p.maxMods = Math.max(p.maxMods || 0, ...this.towers.map(t => (t.mods || []).length), 0);
      p.maxUpgrade = Math.max(p.maxUpgrade || 0, ...this.towers.map(t => t.upgrades || 0), 0);
      const allMax = this.towers.length > 0 && this.towers.every(t => t.level >= C.maxLevel);
      if (allMax) p.allMaxRun = true;
      const stardust = Math.max(2, Math.round(3 + this.waveIndex * 2 + this.kills * 0.12 + (victory ? 12 : 0) + (this.mode === 'endless' ? 6 : 0)));
      this.meta.stardust = (this.meta.stardust || 0) + stardust;
      this.lastStardust = stardust;
      this.lastMetaUnlocks = this.checkAchievements();
      this.saveMeta();
      return stardust;
    }

    startNewGame() {
      this.dailyRun = false;
      this.startGame();
    }

    startDaily() {
      if (this.state !== 'menu') return;
      const day = Math.floor(Date.now() / 86400000);
      this.mapId = D.MAP_ORDER[day % D.MAP_ORDER.length] || 'cloud';
      this.mapDef = D.MAPS[this.mapId];
      this.difficulty = ['normal', 'hard', 'nightmare'][day % 3];
      this.mode = 'standard';
      this.dailyRun = true;
      this.updateMenuSwitch();
      this.applyMapTheme();
      this.ui.metaScreen.classList.add('hidden');
      this.startGame();
    }

    applyMapTheme() {
      const map = this.mapDef || D.MAPS[this.mapId] || D.MAPS.cloud;
      if (!map) return;
      if (this.ui.mapCap) this.ui.mapCap.textContent = `${map.en} · ${map.name}`;
      if (this.world && this.world.setPath && map.path) this.world.setPath(map.path);
      if (this.world && this.world.setTheme) this.world.setTheme(map.theme || {});
      if (this.world) this.buildPathSamples = Array.from({ length: 220 }, (_, i) => this.world.samplePathAt(i / 219).pos.clone());
      if (this.renderer && this.renderer.domElement) {
        const f = map.theme && map.theme.filter;
        this.renderer.domElement.style.filter = f && f !== 'none' ? f : '';
      }
      if (this.ui.mapCap && map.theme && map.theme.hud) this.ui.mapCap.style.color = map.theme.hud;
    }

    openStory() {
      if (this.state !== 'menu' || !window.ASTRAL_STORY) return;
      this.storyOpen = true;
      this.storyIndex = 0;
      this.ui.storyScreen.classList.remove('hidden');
      document.body.classList.add('is-story');
      this.renderStory();
      AUDIO.init(); AUDIO.resume(); AUDIO.play('ui');
    }

    renderStory() {
      const story = window.ASTRAL_STORY;
      if (!story || !story.beats || !story.beats.length) return;
      const beat = story.beats[this.storyIndex] || story.beats[0];
      this.ui.storyChapter.textContent = story.chapter || 'PROLOGUE · 序章';
      this.ui.storySubtitle.textContent = story.subtitle || 'THE LAST GATE';
      this.ui.storyTitle.textContent = story.title || '星门将坠';
      this.ui.storySpeaker.textContent = beat.speaker || '旁白';
      this.ui.storySpeaker.dataset.color = beat.boss ? 'red' : beat.speaker === '艾莉娅' ? 'cyan' : beat.speaker === '瑟琳' ? 'cyan' : beat.speaker === '绯月' ? 'pink' : '';
      this.ui.storyRole.textContent = beat.role || 'NARRATOR';
      this.ui.storyText.textContent = beat.text || '';
      this.ui.storyScreen.classList.toggle('boss', !!beat.boss);
      this.ui.storyScreen.classList.toggle('is-finished', this.storyIndex >= story.beats.length - 1);
      if (beat.art) {
        this.ui.storyArt.classList.remove('ready');
        this.ui.storyArt.src = beat.art;
        this.ui.storyArt.classList.add('ready');
        this.ui.storyArt.onload = () => this.ui.storyArt.classList.add('ready');
        this.ui.storyArt.style.visibility = 'visible';
        this.ui.storySigil.classList.add('hidden');
      } else {
        this.ui.storyArt.removeAttribute('src');
        this.ui.storyArt.classList.remove('ready');
        this.ui.storyArt.style.visibility = 'hidden';
        this.ui.storySigil.classList.remove('hidden');
        this.ui.storySigil.textContent = beat.sigil || '✦';
      }
      this.ui.storyProgress.innerHTML = story.beats.map((b, i) => `<i class="${i <= this.storyIndex ? 'on' : ''}"></i>`).join('');
      const last = this.storyIndex >= story.beats.length - 1;
      this.ui.storyNext.innerHTML = last ? '落幕 <span>✦</span>' : '继续 <span>→</span>';
      this.ui.storySkip.textContent = last ? '返回星门' : '跳过序章';
    }

    nextStory() {
      const story = window.ASTRAL_STORY;
      if (!this.storyOpen || !story) return;
      if (this.storyIndex >= story.beats.length - 1) { this.closeStory(true); return; }
      this.storyIndex++;
      this.renderStory();
      AUDIO.play('ui');
    }

    closeStory(complete) {
      if (!this.storyOpen) return;
      this.storyOpen = false;
      this.ui.storyScreen.classList.add('hidden');
      this.ui.storyScreen.classList.remove('boss');
      document.body.classList.remove('is-story');
      if (complete) {
        this.storySeen = true;
        try { localStorage.setItem('astral_story_seen', '1'); } catch (e) {}
      }
      this.updateStoryButton();
      AUDIO.play('ui');
    }

    updateStoryButton() {
      if (!this.ui.btnStory) return;
      this.ui.btnStory.classList.toggle('story-unseen', !this.storySeen);
    }

    loadPreferences() {
      const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
      const q = get('astral_quality', 'high');
      this.quality = ['high', 'medium', 'low'].includes(q) ? q : 'high';
      this.qualityCap = this.quality === 'high' ? 1.4 : this.quality === 'medium' ? 1.0 : 0.75;
      this.reducedMotion = get('astral_motion', 'full') === 'reduced';
      const font = get('astral_font', 'standard');
      document.body.classList.toggle('ui-large', font === 'large');
      document.body.classList.toggle('reduced-motion', this.reducedMotion);
      const diff = get('astral_difficulty', 'normal');
      this.difficulty = D.DIFFICULTIES[diff] ? diff : 'normal';
      const mode = get('astral_mode', 'standard');
      this.mode = mode === 'endless' ? 'endless' : 'standard';
      const mapId = get('astral_map', 'cloud');
      this.mapId = D.MAPS[mapId] ? mapId : 'cloud';
      this.mapDef = D.MAPS[this.mapId];
      this.applyMapTheme();
      const vol = Number(get('astral_volume', '0.72'));
      if (Number.isFinite(vol)) AUDIO.setVolume(vol);
      this.updateMenuSwitch();
      this.updateSettingsUI();
      this.updateContinueButton();
      this.updateStoryButton();
      if (this.ui.setVolume) this.ui.setVolume.value = String(Math.round((Number.isFinite(vol) ? vol : 0.72) * 100));
      if (this.ui.setVolumeVal) this.ui.setVolumeVal.textContent = Math.round((Number.isFinite(vol) ? vol : 0.72) * 100) + '%';
    }

    savePreferences() {
      try {
        localStorage.setItem('astral_quality', this.quality);
        localStorage.setItem('astral_motion', this.reducedMotion ? 'reduced' : 'full');
        localStorage.setItem('astral_font', document.body.classList.contains('ui-large') ? 'large' : 'standard');
        localStorage.setItem('astral_difficulty', this.difficulty);
        localStorage.setItem('astral_mode', this.mode);
        localStorage.setItem('astral_map', this.mapId);
        localStorage.setItem('astral_volume', String(AUDIO.volume));
      } catch (e) {}
    }

    updateMenuSwitch() {
      if (this.ui.diffSwitch) this.ui.diffSwitch.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.diff === this.difficulty));
      if (this.ui.modeSwitch) this.ui.modeSwitch.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.mode === this.mode));
      if (this.ui.mapSwitch) this.ui.mapSwitch.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.map === this.mapId));
    }

    updateSettingsUI() {
      if (!this.ui.setQuality) return;
      this.ui.setQuality.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.q === this.quality));
      this.ui.setFont.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.f === (document.body.classList.contains('ui-large') ? 'large' : 'standard')));
      this.ui.setMotion.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.m === (this.reducedMotion ? 'reduced' : 'full')));
    }

    openSettings() {
      if (this.state !== 'menu') return;
      this.updateSettingsUI();
      this.ui.settingsScreen.classList.remove('hidden');
      AUDIO.play('ui');
    }

    closeSettings() {
      this.ui.settingsScreen.classList.add('hidden');
      this.savePreferences();
      AUDIO.play('ui');
    }

    checkpointKey() { return 'astral_checkpoint_v1'; }

    loadCheckpoint() {
      try {
        const raw = localStorage.getItem(this.checkpointKey());
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data && data.version === 1 && Array.isArray(data.towers) ? data : null;
      } catch (e) { return null; }
    }

    clearCheckpoint() {
      try { localStorage.removeItem(this.checkpointKey()); } catch (e) {}
      this.updateContinueButton();
    }

    saveCheckpoint() {
      if (this.state !== 'playing' || !this.buildPhase) return;
      const data = {
        version: 1,
        difficulty: this.difficulty,
        mode: this.mode,
        mapId: this.mapId,
        waveIndex: this.waveIndex,
        kills: this.kills,
        gold: this.gold,
        coreHp: this.coreHp,
        coreMax: this.coreMax,
        energy: this.energy,
        skillCd: this.skillCd,
        rerolls: this.rerolls,
        rerollsUsed: this.rerollsUsed,
        repairsUsed: this.repairsUsed,
        leaks: this.leaks,
        leakLog: this.leakLog,
        lastLeak: this.lastLeak,
        elapsed: this.elapsed,
        towers: this.towers.map(t => ({
          type: t.type, padIndex: t.padIndex, x: t.x, z: t.z,
          level: t.level, mods: t.mods,
          upgrades: t.upgrades || 0, upgradeSpent: t.upgradeSpent || 0,
          targetMode: t.targetMode, kills: t.kills, damageDone: t.damageDone
        }))
      };
      try { localStorage.setItem(this.checkpointKey(), JSON.stringify(data)); } catch (e) {}
      this.updateContinueButton();
    }

    updateContinueButton() {
      if (!this.ui.continueBtn) return;
      const data = this.loadCheckpoint();
      if (!data) {
        this.ui.continueBtn.classList.add('hidden');
        return;
      }
      this.ui.continueBtn.classList.remove('hidden');
      const wave = data.mode === 'endless' ? data.waveIndex + 1 : Math.max(1, Math.min(C.maxWaves, data.waveIndex + 1));
      if (this.ui.continueInfo) this.ui.continueInfo.textContent = `第 ${wave} 波 · ${data.difficulty === 'hard' ? '困难' : data.difficulty === 'nightmare' ? '噩梦' : '普通'}`;
    }

    continueGame() {
      this.dailyRun = false;
      const data = this.loadCheckpoint();
      if (!data) return;
      this.difficulty = D.DIFFICULTIES[data.difficulty] ? data.difficulty : 'normal';
      this.mode = data.mode === 'endless' ? 'endless' : 'standard';
      this.startGame(data);
    }

    applyCheckpoint(data) {
      this.difficulty = D.DIFFICULTIES[data.difficulty] ? data.difficulty : 'normal';
      this.mode = data.mode === 'endless' ? 'endless' : 'standard';
      this.mapId = D.MAPS[data.mapId] ? data.mapId : 'cloud';
      this.mapDef = D.MAPS[this.mapId];
      this.difficultyDef = D.DIFFICULTIES[this.difficulty];
      this.coreMax = data.coreMax || this.difficultyDef.core;
      this.coreHp = Math.max(1, Math.min(this.coreMax, data.coreHp || this.coreMax));
      this.waveIndex = Math.max(0, data.waveIndex || 0);
      this.kills = data.kills || 0;
      this.energy = data.energy || 0;
      this.skillCd = data.skillCd || 0;
      this.rerolls = data.rerolls ?? C.startRerolls;
      this.rerollsUsed = data.rerollsUsed || 0;
      this.repairsUsed = data.repairsUsed || 0;
      this.leaks = data.leaks || 0;
      this.leakLog = Array.isArray(data.leakLog) ? data.leakLog : [];
      this.lastLeak = data.lastLeak || null;
      this.elapsed = data.elapsed || 0;
      this.buildPhase = true;
      this.waveActive = false;
      this.countdown = C.intermission;
      this.waveTime = 0;
      this.spawnQueue = [];
      this.spawnCursor = 0;
      this.spawnedCount = 0;
      this.waveTotal = 0;
      this.waveKills = 0;
      this.waveClearTimer = 0;
      this.towers.slice().forEach(t => this.removeTower(t));
      (data.towers || []).forEach(td => {
        const legacyPad = td.padIndex !== null && td.padIndex !== undefined ? this.world.pads[td.padIndex] : null;
        const tx = Number.isFinite(td.x) ? td.x : (legacyPad ? legacyPad.position.x : 0);
        const tz = Number.isFinite(td.z) ? td.z : (legacyPad ? legacyPad.position.z : 0);
        this.createTowerAt(td.type, tx, tz, td.padIndex, { free: true, silent: true });
        const t = this.towers[this.towers.length - 1];
        if (!t) return;
        t.level = Math.max(1, Math.min(C.maxLevel, td.level || 1));
        t.mods = Array.isArray(td.mods) ? td.mods.slice(0, C.maxMods) : [];
        t.upgrades = td.upgrades || 0;
        t.upgradeSpent = td.upgradeSpent || 0;
        t.targetMode = td.targetMode || (t.type === 'archer' ? 'first' : t.type === 'mage' ? 'strong' : 'near');
        t.kills = td.kills || 0;
        t.damageDone = td.damageDone || 0;
        this.recomputeTower(t);
        this.rebuildTowerVisual(t, false);
      });
      this.gold = data.gold || 0;
      this.world.setCoreHealth(this.coreHp / this.coreMax);
      this.hideSelection();
      this.ui.announce.classList.add('hidden');
      this.ui.tutorial.classList.add('hidden');
      this.ui.toast.innerHTML = '';
      this.previewKey = '';
      this.updateHud(true);
      this.updateContinueButton();
    }

    resize() {
      const w = window.innerWidth, h = window.innerHeight;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
      this.renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      const buf = this.renderer.getDrawingBufferSize(new T.Vector2());
      this.post.setSize(buf.x, buf.y, 1);
      this.vfx && (this.vfx.points.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2));
    }

    toggleAudio() {
      AUDIO.init();
      const muted = AUDIO.toggleMute();
      this.updateAudioButtons();
      if (!muted) AUDIO.play('ui');
    }

    updateAudioButtons() {
      ['btn-audio', 'menu-audio'].forEach(id => {
        const b = $(id);
        if (!b) return;
        b.classList.toggle('muted', AUDIO.muted);
      });
    }

    openGuide(from) {
      this.guideFrom = from;
      if (from === 'game') {
        this.wasPaused = this.paused;
        this.paused = true;
      }
      this.ui.guide.classList.remove('hidden');
      AUDIO.play('ui');
    }

    closeGuide() {
      this.ui.guide.classList.add('hidden');
      if (this.guideFrom === 'game') this.paused = this.wasPaused || false;
      if (this.guideFrom === 'pause') this.ui.pause.classList.remove('hidden');
      this.guideFrom = null;
      AUDIO.play('ui');
    }

    togglePause(force) {
      if (this.state !== 'playing' || this.mergeOpen) return;
      const next = force == null ? !this.paused : force;
      this.paused = next;
      this.ui.pause.classList.toggle('hidden', !next);
      this.ui.buildHint.classList.toggle('hidden', next || this.towers.length > 0);
      AUDIO.play('ui');
    }

    /* =========================================================
       CURSOR / RAYCAST
       ========================================================= */
    updatePointerFromEvent(e) {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.mouse.x = this.pointer.x;
      this.mouse.y = this.pointer.y;
    }

    isBuildableAt(x, z) {
      if (Math.hypot(x, z) > 20.7) return { ok: false, reason: '星岛边缘' };
      const pathSamples = this.buildPathSamples || [];
      for (const p of pathSamples) {
        if ((x - p.x) * (x - p.x) + (z - p.z) * (z - p.z) < 5.06) return { ok: false, reason: '星路' };
      }
      const core = this.world.coreGroup ? this.world.coreGroup.position : null;
      if (core && Math.hypot(x - core.x, z - core.z) < 3.3) return { ok: false, reason: '星核' };
      const portal = this.world.portal ? this.world.portal.position : null;
      if (portal && Math.hypot(x - portal.x, z - portal.z) < 3.1) return { ok: false, reason: '深渊之门' };
      for (const t of this.towers) {
        const tx = t.x !== undefined ? t.x : (t.char ? t.char.position.x : 0);
        const tz = t.z !== undefined ? t.z : (t.char ? t.char.position.z : 0);
        if ((x - tx) * (x - tx) + (z - tz) * (z - tz) < 3.24) return { ok: false, reason: '守卫间距' };
      }
      for (const b of (this.buildBlockers || [])) {
        if ((x - b[0]) * (x - b[0]) + (z - b[1]) * (z - b[1]) < b[2] * b[2]) return { ok: false, reason: '地形' };
      }
      return { ok: true, reason: '' };
    }

    pickBuildPoint() {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const p = new T.Vector3();
      if (!this.raycaster.ray.intersectPlane(this.buildPlane, p)) return null;
      if (Math.hypot(p.x, p.z) > 21.0) return null;
      const check = this.isBuildableAt(p.x, p.z);
      return {
        index: -1,
        freePoint: true,
        position: new T.Vector3(p.x, 0.25, p.z),
        occupied: false,
        valid: check.ok,
        reason: check.reason
      };
    }

    updateBuildGhost() {
      if (!this.buildGhost) return;
      const p = this.hoveredPad;
      if (!this.buildType || !p || !p.freePoint) {
        this.buildGhost.visible = false;
        return;
      }
      const col = p.valid ? '#9cefff' : '#ff6b82';
      this.buildGhost.visible = true;
      this.buildGhost.position.set(p.position.x, 0.27, p.position.z);
      this.ghostRune.material.color.set(col);
      this.ghostRing.material.color.set(col);
      this.ghostFill.material.color.set(col);
      this.ghostRing.material.opacity = p.valid ? 0.9 : 0.7;
    }

    updateMergeHighlights() {
      if (!this.mergeFx) return;
      while (this.mergeFx.children.length) {
        const c = this.mergeFx.children.pop();
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      }
      if (!this.mergeSource) return;
      const partners = this.findPartners(this.mergeSource);
      partners.forEach(t => {
        if (!t.char) return;
        const ring = new T.Mesh(new T.RingGeometry(1.02, 1.16, 48), new T.MeshBasicMaterial({
          color: 0xff9fce, transparent: true, opacity: 0.9, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending
        }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(t.char.position.x, 0.3, t.char.position.z);
        this.mergeFx.add(ring);
      });
    }

    onPointerMove(e) {
      this.updatePointerFromEvent(e);
      if (this.state !== 'playing' || this.mergeOpen) return;
      this.hoveredPad = this.pickBuildPoint();
      this.refreshPadStates();
      this.updatePadLabel();
      this.updateRangeForHover();
    }

    onCanvasClick(e) {
      if (this.state !== 'playing' || this.mergeOpen || this.paused) return;
      this.updatePointerFromEvent(e);
      const p = this.pickBuildPoint();
      this.hoveredPad = p;
      this.refreshPadStates();
      if (!p) {
        if (this.buildType) this.clearBuildSelection();
        else if (this.selected) this.hideSelection();
        return;
      }
      const tower = this.towerAtPoint(p.position.x, p.position.z, 1.35);
      if (this.mergeSource) {
        if (tower && tower !== this.mergeSource) {
          if (tower.type === this.mergeSource.type && tower.level === this.mergeSource.level) this.beginFusion(this.mergeSource, tower);
          else this.toast('只有同类型、同阶位的守卫才能融合', 'warn');
        } else if (tower === this.mergeSource) {
          this.cancelMergeMode();
        } else {
          this.toast('请选择一位发光的同阶同伴', 'warn');
        }
        return;
      }
      if (tower) {
        this.selectTower(tower);
        return;
      }
      if (this.buildType) {
        if (!p.valid) {
          this.toast('无法部署：' + p.reason, 'warn');
          AUDIO.play('deny');
          return;
        }
        this.placeTowerAt(this.buildType, p.position.x, p.position.z);
      } else {
        this.toast('先从下方选择一位星之守卫', '');
      }
    }

    onKey(e) {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        if (this.storyOpen) { this.closeStory(false); return; }
        if (this.mergeOpen) return;
        if (this.buildType) this.clearBuildSelection();
        else if (this.mergeSource) this.cancelMergeMode();
        else if (this.selected) this.hideSelection();
        else if (this.state === 'playing') this.togglePause();
        return;
      }
      if (k === 'm') { this.toggleAudio(); return; }
      if (this.state !== 'playing' || this.mergeOpen) return;
      if (['1', '2', '3', '4', '5'].includes(k)) {
        const type = D.TOWER_ORDER[Number(k) - 1];
        if (type) this.selectBuildType(type);
        return;
      }
      if (k === 'p') { this.togglePause(); return; }
      if (k === 'q') { this.castSkill(); return; }
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.buildPhase) this.callWave();
        else this.togglePause();
      }
    }

    cancelInteractions() {
      if (this.mergeSource) this.cancelMergeMode();
      else if (this.buildType) this.clearBuildSelection();
      else this.hideSelection();
    }

    /* =========================================================
       BUILD / SELECT
       ========================================================= */
    selectBuildType(type) {
      if (this.state !== 'playing' || this.mergeOpen || this.paused) return;
      if (this.buildType === type) {
        this.clearBuildSelection();
        return;
      }
      this.buildType = type;
      this.selected = null;
      this.ui.selection.classList.add('hidden');
      this.cardEls.forEach(c => c.classList.toggle('selected', c.dataset.type === type));
      document.body.classList.add('is-targeting');
      this.ui.shopTip.textContent = '点击星路之外部署 · 右键取消';
      this.showBuildHint(type);
      this.refreshPadStates();
      this.updateRangeForHover();
      AUDIO.play('ui');
    }

    clearBuildSelection() {
      this.buildType = null;
      this.cardEls && this.cardEls.forEach(c => c.classList.remove('selected'));
      document.body.classList.remove('is-targeting');
      this.ui.shopTip.textContent = '选择卡牌后点击星路之外部署';
      this.hideRange();
      this.hidePadLabel();
      if (this.buildGhost) this.buildGhost.visible = false;
      this.refreshPadStates();
    }

    showBuildHint(type) {
      const def = D.TOWERS[type];
      this.ui.buildHint.classList.remove('hidden');
      this.ui.buildHint.querySelector('.hint-copy b').textContent = '部署 ' + def.short;
      this.ui.buildHint.querySelector('.hint-copy span').textContent = `${def.role} · 费用 ${def.cost} 星币 · 点击星路之外的草地`;
    }

    placeTower(type, padIndex, opts) {
      const pad = this.world.pads[padIndex];
      if (!pad || pad.occupied) return;
      return this.createTowerAt(type, pad.position.x, pad.position.z, padIndex, opts);
    }

    placeTowerAt(type, x, z, opts) {
      const check = this.isBuildableAt(x, z);
      if (!check.ok) {
        this.toast('无法部署：' + check.reason, 'warn');
        AUDIO.play('deny');
        return;
      }
      return this.createTowerAt(type, x, z, null, opts || {});
    }

    createTowerAt(type, x, z, padIndex, opts) {
      const opt = opts || {};
      const def = D.TOWERS[type];
      if (!def) return;
      if (!opt.free && this.gold < def.cost) {
        this.toast('星币不足，提前召唤敌潮可获得额外星币', 'warn');
        AUDIO.play('deny');
        return;
      }
      if (!opt.free) this.gold -= def.cost;
      const tower = {
        id: ++this.towerSeq, type, level: 1, padIndex: padIndex ?? null, x, z, mods: [],
        stats: null, cooldown: 0.25, attackCount: 0, kills: 0, damageDone: 0,
        targetMode: type === 'archer' ? 'first' : type === 'mage' ? 'strong' : 'near',
        upgrades: 0, upgradeSpent: 0,
        char: null, invested: def.cost
      };
      const shadow = new T.Mesh(new T.PlaneGeometry(1.9, 1.25), new T.MeshBasicMaterial({ map: A.BLOB_TEX, transparent: true, opacity: 0.32, depthWrite: false, color: 0x000000 }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(x, 0.245, z);
      this.scene.add(shadow);
      tower.shadow = shadow;
      this.towers.push(tower);
      if (padIndex !== null && padIndex !== undefined && this.world.pads[padIndex]) {
        this.world.pads[padIndex].occupied = true;
        this.world.setPadState(padIndex, 'occupied');
      }
      this.rebuildTowerVisual(tower, !opt.silent);
      this.recomputeTower(tower);
      if (!opt.silent) {
        this.vfx.ring(new T.Vector3(x, 0.3, z), def.color, 2.4, { dur: 0.8, width: 0.12 });
        this.vfx.burst(new T.Vector3(x, 1.1, z), def.color, 42, { speed: 3.6, life: 0.9, size: 0.22, gravity: -1.5, up: 1.5 });
        this.shakeScreen(0.12);
        this.flash(def.color, 0.12, 260);
        AUDIO.play('place');
        this.clearBuildSelection();
        this.ui.buildHint.classList.add('hidden');
        this.showTutorial('共鸣融合', '点击已部署的守卫，可查看详情；两名同类型、同阶位的守卫可以融合。');
        this.updateHud(true);
        this.selectTower(tower);
      } else {
        this.refreshPadStates();
      }
      return tower;
    }

    towerAtPad(index) {
      return this.towers.find(t => t.padIndex === index) || null;
    }

    towerAtPoint(x, z, radius) {
      const r2 = (radius || 1.3) * (radius || 1.3);
      let best = null, bestD = r2;
      this.towers.forEach(t => {
        const tx = t.x !== undefined ? t.x : (t.char ? t.char.position.x : 0);
        const tz = t.z !== undefined ? t.z : (t.char ? t.char.position.z : 0);
        const d = (x - tx) * (x - tx) + (z - tz) * (z - tz);
        if (d <= bestD) { best = t; bestD = d; }
      });
      return best;
    }

    selectTower(tower) {
      if (!tower) return;
      this.clearBuildSelection();
      this.selected = tower;
      this.previewStage = null;
      this.ui.selection.classList.remove('hidden');
      this.updateSelectionPanel();
      this.showTowerRange(tower);
      this.refreshPadStates();
      AUDIO.play('hover');
    }

    hideSelection() {
      this.selected = null;
      this.previewStage = null;
      this.ui.selection.classList.add('hidden');
      this.hideRange();
      this.refreshPadStates();
    }

    updateSelectionPanel() {
      const t = this.selected;
      if (!t) return;
      const def = D.TOWERS[t.type];
      const s = t.stats;
      const current = t.level;
      const preview = this.previewStage && this.previewStage >= 1 && this.previewStage <= C.maxLevel ? this.previewStage : current;
      const info = this.stageInfo(preview);
      this.ui.selImg.src = this.stageArt(t.type, preview);
      this.ui.selImg.className = 'stage-art ' + this.artClass(preview);
      this.ui.selStageBadge.textContent = info.roman;
      this.ui.selStageName.innerHTML = `<b>${info.roman}</b><span>${def.stages[preview - 1]}</span>${preview !== current ? '<em>预览</em>' : ''}`;
      this.ui.selStageFrame.className = 'sel-stage-frame stage-' + preview + (preview !== current ? ' previewing' : '');
      this.ui.selRole.textContent = def.title + ' · ' + def.role;
      this.ui.selName.textContent = def.name;
      this.ui.selLevel.innerHTML = Array.from({ length: C.maxLevel }, (_, i) => `<i class="${i < t.level ? 'on' : ''}"></i>`).join('');
      this.ui.selStageRail.innerHTML = D.STAGE_INFO.map((st, idx) => {
        const n = idx + 1;
        return `<button class="stage-step ${n === current ? 'is-current' : ''} ${n === preview ? 'is-active' : ''}" data-stage="${n}" title="${st.roman} · ${def.stages[idx]}" aria-label="${st.roman} ${def.stages[idx]}">
          <span class="stage-thumb"><img class="stage-art ${this.artClass(n)}" src="${this.stageArt(t.type, n)}" alt=""></span>
          <span class="stage-step-meta"><b>${st.roman}</b><em>${st.name}</em></span>
        </button>`;
      }).join('');
      this.ui.statDmg.textContent = Math.round(s.damage);
      this.ui.statSpd.textContent = (1 / s.interval).toFixed(2) + '/s';
      this.ui.statRange.textContent = s.range.toFixed(1);
      this.ui.statKills.textContent = t.kills;
      const mode = t.targetMode || 'first';
      this.ui.selPriority.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
      this.updateUpgradeUI();
      this.ui.modCount.textContent = t.mods.length + ' / ' + C.maxMods;
      if (!t.mods.length) {
        this.ui.selMods.innerHTML = '<span class="empty-mods">尚未获得铭文，融合可唤醒新的力量</span>';
      } else {
        this.ui.selMods.innerHTML = t.mods.map(id => {
          const m = D.MODS.find(x => x.id === id);
          if (!m) return '';
          return `<span class="mod-chip ${m.rarity}" title="${m.desc.replace(/<[^>]+>/g, '')}">${iconSvg(m.icon)}<span class="rar">●</span>${m.name}</span>`;
        }).join('');
      }
      const partners = this.findPartners(t);
      const can = partners.length > 0 && t.level < C.maxLevel;
      this.ui.btnMerge.disabled = !can;
      this.ui.btnMerge.classList.toggle('active', false);
      if (t.level >= C.maxLevel) this.ui.mergeHint.textContent = '已达终阶';
      else if (!partners.length) this.ui.mergeHint.textContent = '暂无同阶同伴';
      else this.ui.mergeHint.textContent = `可用同伴 ${partners.length}`;
      this.ui.sellValue.textContent = '+' + this.getSellValue(t);
    }

    updateUpgradeUI() {
      const t = this.selected;
      if (!t || !this.ui.btnUpgrade) return;
      const up = t.upgrades || 0;
      const max = C.upgradeMax;
      const maxed = up >= max;
      const cost = maxed ? 0 : C.upgradeCosts[up];
      this.ui.upLevel.textContent = `${up} / ${max}`;
      this.ui.upCost.textContent = maxed ? 'MAX' : cost;
      const label = this.ui.btnUpgrade.querySelector('span');
      if (label) label.textContent = maxed ? '已满' : '强化';
      const can = !maxed && this.gold >= cost;
      this.ui.btnUpgrade.disabled = !can;
      this.ui.btnUpgrade.classList.toggle('disabled', !can);
      this.ui.btnUpgrade.classList.toggle('maxed', maxed);
    }

    upgradeSelected() {
      const t = this.selected;
      if (!t || !t.stats) return;
      const up = t.upgrades || 0;
      if (up >= C.upgradeMax) {
        this.toast('该守卫已达到强化上限', 'warn');
        return;
      }
      const cost = C.upgradeCosts[up];
      if (this.gold < cost) {
        this.toast(`星币不足 · 强化需要 ${cost}`, 'warn');
        AUDIO.play('deny');
        return;
      }
      this.gold -= cost;
      t.upgrades = up + 1;
      t.upgradeSpent = (t.upgradeSpent || 0) + cost;
      this.recomputeTower(t);
      this.rebuildTowerVisual(t, false);
      const pos = t.char ? t.char.position.clone() : this.worldSampleCore();
      this.vfx.ring(pos.clone().setY(0.3), D.TOWERS[t.type].color, 2.3, { dur: 0.7 });
      this.vfx.burst(pos.clone().setY(1.2), '#ffd36a', 28, { speed: 2.8, life: 0.8, size: 0.18, up: 1.2 });
      this.shakeScreen(0.12);
      AUDIO.play('gold');
      AUDIO.play('fuse');
      this.toast(`${D.TOWERS[t.type].short} 强化至 ${t.upgrades} 级 · 伤害 +10% / 攻速 +8%`, 'good');
      this.updateSelectionPanel();
      this.updateHud(true);
    }

    repairCore() {
      if (this.state !== 'playing' || this.paused) return;
      if (!this.buildPhase) {
        this.toast('只能在布防期修复星核', 'warn');
        return;
      }
      if (this.coreHp >= this.coreMax) {
        this.toast('星核结界已完整', '');
        return;
      }
      if (this.repairsUsed >= C.coreRepairMax) {
        this.toast('本局修复次数已用尽', 'warn');
        return;
      }
      if (this.gold < C.coreRepairCost) {
        this.toast(`星币不足 · 修复需要 ${C.coreRepairCost}`, 'warn');
        AUDIO.play('deny');
        return;
      }
      this.gold -= C.coreRepairCost;
      this.repairsUsed++;
      this.coreHp = Math.min(this.coreMax, this.coreHp + 1);
      this.world.setCoreHealth(this.coreHp / this.coreMax);
      const pos = this.world.coreGroup.position.clone().setY(2.0);
      this.vfx.burst(pos, '#bff6ff', 26, { speed: 2.4, life: 0.9, size: 0.2, up: 1.2 });
      this.vfx.ring(pos.clone().setY(0.3), '#bff6ff', 3.6, { dur: 0.8 });
      this.toast(`星核修复 +1 · 剩余修复 ${C.coreRepairMax - this.repairsUsed} 次`, 'good');
      AUDIO.play('gold');
      this.updateHud(true);
    }

    castSkill() {
      if (this.state !== 'playing' || this.paused || this.mergeOpen) return;
      if (this.skillCd > 0) {
        this.toast(`星蚀冷却中 · ${Math.ceil(this.skillCd)} 秒`, 'warn');
        return;
      }
      if (this.energy < C.skillEnergyMax) {
        this.toast(`星蚀能量不足 · ${this.energy} / ${C.skillEnergyMax}`, 'warn');
        return;
      }
      this.energy = 0;
      this.skillCd = C.skillCooldown;
      this.skillCasts++;
      let hit = 0;
      this.enemies.forEach(e => {
        if (!e.alive) return;
        const factor = e.def.boss ? 0.42 : C.skillSlow;
        e.slow = Math.max(e.slow, factor);
        e.slowTimer = Math.max(e.slowTimer, C.skillDuration);
        hit++;
      });
      const core = this.world.coreGroup.position;
      this.vfx.ring(new T.Vector3(core.x, 0.3, core.z), '#bff6ff', 7.5, { dur: 1.1 });
      this.vfx.ring(new T.Vector3(core.x, 0.3, core.z), '#ff8fc3', 4.2, { dur: 0.8 });
      this.vfx.burst(new T.Vector3(core.x, 2.2, core.z), '#bff6ff', 60, { speed: 5, life: 1.4, size: 0.28, up: 1.5 });
      this.flash('#9cefff', 0.18, 480);
      this.shakeScreen(0.24);
      this.showAnnounce('星蚀 · 时滞', 'TIME DILATION', `全场敌人减速 70% · 3.5 秒 · 命中 ${hit}`, 1900);
      AUDIO.play('wave');
      AUDIO.play('fuse');
      this.toast('星蚀展开 · 时间被拉慢了', 'good');
      this.updateHud(true);
    }

    updateSkillUI() {
      if (!this.ui.btnSkill) return;
      const C2 = 2 * Math.PI * 52;
      const ready = this.energy >= C.skillEnergyMax && this.skillCd <= 0;
      const ratio = this.skillCd > 0 ? 1 - this.skillCd / C.skillCooldown : this.energy / C.skillEnergyMax;
      this.ui.skillProgress.style.strokeDashoffset = String(C2 * (1 - clamp(ratio, 0, 1)));
      this.ui.btnSkill.classList.toggle('ready', ready);
      this.ui.btnSkill.classList.toggle('cooling', this.skillCd > 0);
      this.ui.btnSkill.disabled = !ready;
      this.ui.skillState.textContent = this.skillCd > 0
        ? `冷却 ${Math.ceil(this.skillCd)} 秒`
        : ready ? '可释放 · Q' : `能量 ${Math.floor(this.energy)} / ${C.skillEnergyMax}`;
    }

    updateWavePreview() {
      if (!this.ui.wpList) return;
      const nextNo = this.waveIndex + 1;
      const waveIndex = this.waveIndex;
      const key = `${this.waveIndex}:${this.waveActive ? 1 : 0}:${this.buildPhase ? 1 : 0}`;
      if (this.previewKey === key) return;
      this.previewKey = key;
      if (!this.isEndless() && waveIndex >= C.maxWaves) {
        this.ui.wpWave.textContent = '终焉';
        this.ui.wpName.textContent = '深渊歌姬';
        this.ui.wpList.innerHTML = '<div class="wp-final"><span>✦</span>最终波已降临</div>';
        return;
      }
      const wave = this.getWaveDef(waveIndex + 1);
      if (!wave) {
        this.ui.wpWave.textContent = '终焉';
        this.ui.wpName.textContent = '深渊歌姬';
        this.ui.wpList.innerHTML = '<div class="wp-final"><span>✦</span>最终波已降临</div>';
        return;
      }
      this.ui.wpWave.textContent = `第 ${nextNo} 波`;
      this.ui.wpName.textContent = wave.name;
      const counts = new Map();
      wave.spawns.forEach(g => counts.set(g.type, (counts.get(g.type) || 0) + g.count));
      this.ui.wpList.innerHTML = Array.from(counts.entries()).map(([type, count]) => {
        const def = D.ENEMIES[type];
        const armor = def.armor + Math.floor((nextNo - 1) * 0.5);
        const tags = [];
        if (armor > 0) tags.push(`甲 ${armor}`);
        if (def.flying) tags.push('飞行');
        if (def.speed >= 3) tags.push('高速');
        if (def.boss) tags.push('BOSS');
        if (def.shield) tags.push('护盾');
        if (def.heal) tags.push('治疗');
        if (def.split) tags.push('分裂');
        return `<div class="wp-enemy" style="--c:${def.color}">
          <i class="wp-dot"></i>
          <div class="wp-enemy-copy"><b>${def.name}</b><em>${def.en}</em></div>
          <span class="wp-count">×${count}</span>
          <span class="wp-tags">${tags.map(t => `<i>${t}</i>`).join('')}</span>
        </div>`;
      }).join('');
    }

    findPartners(tower) {
      return this.towers.filter(t => t !== tower && t.type === tower.type && t.level === tower.level && t.level < C.maxLevel);
    }

    getSellValue(tower) {
      const base = Math.floor(D.TOWERS[tower.type].cost * (0.55 + (tower.level - 1) * 0.2));
      return base + Math.floor((tower.upgradeSpent || 0) * 0.5);
    }

    sellSelected() {
      const t = this.selected;
      if (!t) return;
      const value = this.getSellValue(t);
      this.gold += value;
      this.removeTower(t);
      this.hideSelection();
      this.toast(`已撤回 ${D.TOWERS[t.type].short} · 返还 ${value} 星币`, 'good');
      AUDIO.play('gold');
      this.updateHud(true);
    }

    removeTower(tower) {
      if (tower.padIndex !== null && tower.padIndex !== undefined) {
        const pad = this.world.pads[tower.padIndex];
        if (pad) {
          pad.occupied = false;
          this.world.setPadState(pad.index, 'idle');
        }
      }
      if (tower.char) {
        this.vfx.burst(tower.char.position.clone().setY(1), D.TOWERS[tower.type].color, 26, { speed: 2, life: 0.7, size: 0.18 });
        this.scene.remove(tower.char);
        A.CharacterFactory.dispose(tower.char);
      }
      if (tower.shadow) { this.scene.remove(tower.shadow); tower.shadow.geometry.dispose(); tower.shadow.material.dispose(); }
      this.towers = this.towers.filter(x => x !== tower);
      if (this.selected === tower) this.selected = null;
      if (this.mergeSource === tower) this.cancelMergeMode();
      this.refreshPadStates();
    }

    /* =========================================================
       MERGE
       ========================================================= */
    toggleMergeMode() {
      if (!this.selected) return;
      if (this.mergeSource) { this.cancelMergeMode(); return; }
      const t = this.selected;
      if (t.level >= C.maxLevel) {
        this.toast('该守卫已达到终阶，无法继续融合', 'warn');
        AUDIO.play('deny');
        return;
      }
      const partners = this.findPartners(t);
      if (!partners.length) {
        this.toast('需要另一名同类型、同阶位的守卫', 'warn');
        AUDIO.play('deny');
        return;
      }
      this.mergeSource = t;
      this.ui.mergeBanner.classList.remove('hidden');
      this.ui.btnMerge.classList.add('active');
      this.refreshPadStates();
      document.body.classList.add('is-merging');
      this.toast(`选择一位发光的 ${D.TOWERS[t.type].short} 进行融合`, '');
      AUDIO.play('ui');
    }

    cancelMergeMode() {
      this.mergeSource = null;
      this.ui.mergeBanner.classList.add('hidden');
      this.ui.btnMerge && this.ui.btnMerge.classList.remove('active');
      document.body.classList.remove('is-merging');
      this.refreshPadStates();
      if (this.selected) this.showTowerRange(this.selected);
    }

    beginFusion(source, target) {
      if (!source || !target || source === target) return;
      if (source.type !== target.type || source.level !== target.level || source.level >= C.maxLevel) return;
      const inherited = [];
      source.mods.concat(target.mods).forEach(id => { if (!inherited.includes(id)) inherited.push(id); });
      inherited.splice(C.maxMods - 1);
      const targetPos = target.char ? target.char.position.clone() : new T.Vector3();
      const sourcePos = source.char ? source.char.position.clone() : new T.Vector3();
      const targetUpgrades = target.upgrades || 0;
      const targetUpgradeSpent = target.upgradeSpent || 0;
      this.removeTower(target);
      this.cancelMergeMode();
      this.hideRange();
      this.selected = source;
      this.ui.selection.classList.add('hidden');
      this.state = 'merge';
      this.mergeOpen = true;
      this.pendingMerge = { source, inherited, targetUpgrades, targetUpgradeSpent };
      this.mergeChoices = this.generateChoices(source.type, inherited, source.level);
      this.ui.mergeTowerName.textContent = D.TOWERS[source.type].name;
      this.ui.mergeFromLevel.textContent = '阶位 ' + ROMAN[source.level];
      this.updateMergeStageUI(source);
      this.ui.mergeScreen.classList.remove('hidden');
      this.ui.mergeScreen.querySelector('.merge-levels .gold').textContent = '阶位 ' + ROMAN[source.level + 1];
      this.renderMergeChoices();
      this.updateRerollUI();
      this.ui.selection.classList.add('hidden');
      this.cameraTweenTo(
        sourcePos.clone().add(new T.Vector3(4.8, 5.2, 5.6)),
        sourcePos.clone().setY(1.2), 0.75
      );
      this.vfx.ring(sourcePos.clone().setY(0.3), '#ff9fce', 3.2, { dur: 1.1 });
      this.vfx.ring(targetPos.clone().setY(0.3), '#9cefff', 2.4, { dur: 0.9 });
      this.vfx.burst(sourcePos.clone().setY(1.3), '#ffd27d', 46, { speed: 3, life: 1.0, size: 0.24, up: 1.4 });
      this.vfx.burst(targetPos.clone().setY(1.1), '#9cefff', 36, { speed: 2.6, life: 0.9, size: 0.2, up: 1.2 });
      this.shakeScreen(0.18);
      AUDIO.play('mergeOpen');
      AUDIO.setMood('build');
      this.refreshPadStates();
    }

    updateMergeStageUI(source) {
      const def = D.TOWERS[source.type];
      const cur = this.stageInfo(source.level);
      const next = this.stageInfo(source.level + 1);
      this.ui.mergeCurrentImg.src = this.stageArt(source.type, source.level);
      this.ui.mergeCurrentImg.className = 'stage-art ' + this.artClass(source.level);
      this.ui.mergeNextImg.src = this.stageArt(source.type, source.level + 1);
      this.ui.mergeNextImg.className = 'stage-art ' + this.artClass(source.level + 1);
      this.ui.mergeCurrentLabel.textContent = `${cur.roman} · ${def.stages[source.level - 1]}`;
      this.ui.mergeNextLabel.textContent = `${next.roman} · ${def.stages[source.level]}`;
    }

    showStageUp(tower) {
      if (!tower) return;
      const info = this.stageInfo(tower.level);
      const def = D.TOWERS[tower.type];
      this.ui.stageupImg.src = this.stageArt(tower.type, tower.level);
      this.ui.stageupImg.className = 'stage-art ' + this.artClass(tower.level);
      this.ui.stageupStage.textContent = info.roman;
      this.ui.stageupName.textContent = def.stages[tower.level - 1];
      this.ui.stageupSub.textContent = `阶位 ${info.roman} · ${info.form}`;
      this.ui.stageupFrame.className = 'stageup-frame stage-' + tower.level;
      this.ui.stageup.classList.remove('hidden');
      this.ui.stageup.classList.remove('show');
      void this.ui.stageup.offsetWidth;
      this.ui.stageup.classList.add('show');
      clearTimeout(this.stageupTimer);
      this.stageupTimer = setTimeout(() => {
        this.ui.stageup.classList.remove('show');
        setTimeout(() => this.ui.stageup.classList.add('hidden'), 450);
      }, 1800);
      AUDIO.play('levelup');
    }

    generateChoices(type, exclude, level) {
      const pool = D.MODS.filter(m => (m.types.includes('all') || m.types.includes(type)) && !exclude.includes(m.id));
      const weightFor = m => {
        const base = D.RARITY[m.rarity].weight;
        if (m.rarity === 'common') return Math.max(20, base - level * 5);
        if (m.rarity === 'rare') return base + level * 3;
        return base + level * 4;
      };
      const picked = [];
      const pickFrom = (arr, count) => {
        const local = arr.filter(m => !picked.includes(m));
        for (let n = 0; n < count && local.length; n++) {
          const total = local.reduce((sum, m) => sum + weightFor(m), 0);
          let r = Math.random() * total;
          let choice = local[local.length - 1];
          for (const m of local) {
            r -= weightFor(m);
            if (r <= 0) { choice = m; break; }
          }
          picked.push(choice);
          local.splice(local.indexOf(choice), 1);
        }
      };
      const typePool = pool.filter(m => !m.types.includes('all'));
      const genericPool = pool.filter(m => m.types.includes('all'));
      pickFrom(typePool, 1);
      pickFrom(genericPool, 1);
      pickFrom(pool, 3 - picked.length);
      if (picked.length < 3) pickFrom(D.MODS.filter(m => !exclude.includes(m.id)), 3 - picked.length);
      if (!picked.some(m => m.rarity !== 'common')) {
        const good = pool.filter(m => m.rarity !== 'common' && !picked.includes(m));
        if (good.length) {
          const total = good.reduce((s, m) => s + weightFor(m), 0);
          let r = Math.random() * total;
          let c = good[0];
          for (const m of good) { r -= weightFor(m); if (r <= 0) { c = m; break; } }
          picked[picked.length - 1] = c;
        }
      }
      const unique = [];
      picked.forEach(m => { if (m && !unique.includes(m)) unique.push(m); });
      if (unique.length < 3) {
        D.MODS.forEach(m => { if (unique.length < 3 && !exclude.includes(m.id) && !unique.includes(m)) unique.push(m); });
      }
      unique.sort((a, b) => D.RARITY[a.rarity].rank - D.RARITY[b.rarity].rank);
      return unique.slice(0, 3);
    }

    renderMergeChoices() {
      const cards = this.ui.mergeCards;
      cards.innerHTML = this.mergeChoices.map((m, i) => {
        const r = D.RARITY[m.rarity];
        return `<button class="mod-card ${m.rarity}" data-index="${i}" style="animation-delay:${0.14 + i * 0.1}s">
          <span class="card-bg"></span>
          <span class="mod-corner tl"></span><span class="mod-corner tr"></span>
          <span class="mod-corner bl"></span><span class="mod-corner br"></span>
          <span class="card-glyph"><span class="glyph-glow"></span>${iconSvg(m.icon)}</span>
          <span class="mod-rarity">${r.en} · ${r.name}</span>
          <span class="mod-name">${m.name}</span>
          <span class="mod-divider"><span></span><i>✦</i><span></span></span>
          <span class="mod-effect">${m.desc}</span>
          <span class="mod-quote">${m.quote}</span>
          <span class="mod-pick">点击铭刻此铭文</span>
        </button>`;
      }).join('');
      Array.from(cards.querySelectorAll('.mod-card')).forEach(card => {
        card.addEventListener('click', () => this.chooseMerge(Number(card.dataset.index)));
        card.addEventListener('pointerenter', () => AUDIO.play('hover'));
      });
    }

    chooseMerge(index) {
      if (!this.mergeOpen || !this.pendingMerge) return;
      const m = this.mergeChoices[index];
      const source = this.pendingMerge.source;
      if (!m || !source) return;
      const inherited = this.pendingMerge.inherited || [];
      const mods = inherited.slice();
      if (!mods.includes(m.id)) mods.push(m.id);
      source.mods = mods.slice(0, C.maxMods);
      source.level = Math.min(C.maxLevel, source.level + 1);
      source.upgrades = Math.max(source.upgrades || 0, this.pendingMerge.targetUpgrades || 0);
      source.upgradeSpent = Math.max(source.upgradeSpent || 0, this.pendingMerge.targetUpgradeSpent || 0);
      source.invested += 0;
      this.recomputeTower(source);
      this.rebuildTowerVisual(source, false);
      const pos = source.char.position.clone();
      this.vfx.ring(pos.clone().setY(0.3), D.TOWERS[source.type].color, 4.2, { dur: 1.0 });
      this.vfx.ring(pos.clone().setY(0.3), '#ffd27d', 2.2, { dur: 0.7 });
      this.vfx.burst(pos.clone().setY(1.4), '#ffd27d', 80, { speed: 5, life: 1.5, size: 0.3, up: 2.0 });
      this.vfx.burst(pos.clone().setY(1.1), D.TOWERS[source.type].color, 55, { speed: 3.4, life: 1.2, size: 0.22, up: 1.5 });
      this.shakeScreen(0.35);
      this.flash('#fff0c4', 0.3, 380);
      AUDIO.play('choose');
      AUDIO.play('fuse');
      this.ui.mergeScreen.classList.add('hidden');
      this.mergeOpen = false;
      this.pendingMerge = null;
      this.mergeSource = null;
      this.state = 'playing';
      this.slowTimer = 1.1;
      this.cancelMergeMode();
      this.cameraTweenTo(GAME_CAM, GAME_LOOK, 0.85);
      this.previewStage = null;
      this.selectTower(source);
      this.showStageUp(source);
      this.toast(`融合完成 · ${m.name} · 阶位 ${ROMAN[source.level]}`, 'good');
      AUDIO.setMood(this.waveActive ? 'battle' : 'build');
      this.updateHud(true);
    }

    rerollMerge() {
      if (!this.mergeOpen || !this.pendingMerge || this.rerolls <= 0) return;
      this.rerolls--;
      this.rerollsUsed++;
      this.mergeChoices = this.generateChoices(this.pendingMerge.source.type, this.pendingMerge.inherited, this.pendingMerge.source.level);
      this.renderMergeChoices();
      this.updateRerollUI();
      AUDIO.play('ui');
    }

    updateRerollUI() {
      this.ui.rerollCount.textContent = this.rerolls;
      this.ui.btnReroll.disabled = this.rerolls <= 0;
    }

    /* =========================================================
       TOWER VISUALS
       ========================================================= */
    rebuildTowerVisual(tower, spawnFx) {
      if (tower.char) {
        this.scene.remove(tower.char);
        A.CharacterFactory.dispose(tower.char);
      }
      const char = A.CharacterFactory.create(tower.type, tower.level);
      // In-game LOD: drop per-part outline hulls (portraits/menu keep them).
      const outlines = [];
      char.traverse(o => { if (o.userData && o.userData.noOutline) outlines.push(o); });
      outlines.forEach(o => {
        if (o.parent) o.parent.remove(o);
        if (o.material) o.material.dispose();
      });
      const tx = tower.x !== undefined ? tower.x : 0;
      const tz = tower.z !== undefined ? tower.z : 0;
      char.position.set(tx, 0.24, tz);
      char.rotation.y = Math.atan2(GAME_CAM.x - tx, GAME_CAM.z - tz) * 0.78;

      const stageColors = ['#d9b36a', '#9cefff', '#bf9dff', '#ffd36a'];
      const stageRing = new T.Mesh(new T.RingGeometry(0.82, 0.95, 48), new T.MeshBasicMaterial({
        color: stageColors[Math.max(0, Math.min(3, tower.level - 1))],
        transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending
      }));
      stageRing.rotation.x = -Math.PI / 2;
      stageRing.position.y = 0.025;
      stageRing.renderOrder = 3;
      char.add(stageRing);
      tower.stageRing = stageRing;

      const stagePips = [];
      for (let i = 0; i < tower.level; i++) {
        const a = i / Math.max(1, tower.level) * Math.PI * 2 - Math.PI / 2;
        const pip = new T.Mesh(new T.OctahedronGeometry(0.05, 0), new T.MeshBasicMaterial({ color: stageColors[Math.max(0, Math.min(3, tower.level - 1))] }));
        pip.position.set(Math.cos(a) * 1.06, 0.08, Math.sin(a) * 1.06);
        pip.renderOrder = 5;
        char.add(pip);
        stagePips.push(pip);
      }
      tower.stagePips = stagePips;

      const upgradeRings = [];
      for (let i = 0; i < (tower.upgrades || 0); i++) {
        const ur = new T.Mesh(new T.RingGeometry(0.54 + i * 0.07, 0.565 + i * 0.07, 40), new T.MeshBasicMaterial({
          color: '#ffd36a', transparent: true, opacity: 0.72, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending
        }));
        ur.rotation.x = -Math.PI / 2;
        ur.position.y = 0.045 + i * 0.012;
        ur.renderOrder = 4;
        char.add(ur);
        upgradeRings.push(ur);
      }
      tower.upgradeRings = upgradeRings;

      const stageScale = 1 + (tower.level - 1) * 0.085;
      const upgradeScale = 1 + (tower.upgrades || 0) * 0.018;
      tower.visualScale = 1.72 * stageScale * upgradeScale;
      this.scene.add(char);
      tower.char = char;
      if (spawnFx) {
        char.scale.setScalar(0.01);
        const start = this.time;
        const grow = () => {
          if (!tower.char || tower.char !== char) return;
          const k = clamp((this.time - start) / 0.45, 0, 1);
          char.scale.setScalar((tower.visualScale || 1.72) * easeOutCubic(k));
          if (k < 1) requestAnimationFrame(grow);
        };
        requestAnimationFrame(grow);
      } else {
        char.scale.setScalar(tower.visualScale || 1.72);
      }
    }

    recomputeTower(tower) {
      const def = D.TOWERS[tower.type];
      const s = Object.assign({}, def.base);
      s.interval = def.base.interval;
      s.damage *= 1 + (tower.level - 1) * 0.58;
      s.range *= 1 + (tower.level - 1) * 0.07;
      s.interval /= 1 + (tower.level - 1) * 0.2;
      s.critChance = def.base.critChance;
      s.critMult = def.base.critMult;
      s.armorPen = def.base.armorPen;
      s.bounty = def.base.bounty;
      s.multishot = 0; s.multishotRatio = 0.65;
      s.pierce = 0; s.chain = 0; s.chainCount = 0;
      s.executeThreshold = 0; s.executeBonus = 0;
      s.bleedDps = 0; s.bleedDuration = 0;
      s.freezeChance = 0; s.freezeDuration = 0;
      s.novaRatio = 0; s.novaRadius = 0;
      s.auraSlow = 0; s.echoEvery = 0; s.echoMult = 0;
      s.volleyEvery = 0; s.volleyCount = 0; s.volleyRatio = 0.9;
      s.shadowEvery = 0; s.shadowMult = 0;
      tower.mods.forEach(id => {
        const m = D.MODS.find(x => x.id === id);
        if (m) m.apply(s);
      });
      const up = tower.upgrades || 0;
      if (up > 0) {
        s.damage *= 1 + up * 0.10;
        s.interval /= 1 + up * 0.08;
      }
      s.damage *= 1 + (this.metaDamage || 0);
      s.interval = Math.max(0.08, s.interval);
      s.critChance = clamp(s.critChance, 0, 0.85);
      s.range = Math.min(s.range, 15);
      tower.stats = s;
      tower.dps = s.damage / s.interval * (tower.type === 'blade' ? Math.min(s.maxTargets, 4) : tower.type === 'archer' ? (1 + s.multishot * s.multishotRatio) : 1);
    }

    showTowerRange(tower) {
      if (!tower || !tower.stats) return;
      const x = tower.x !== undefined ? tower.x : (tower.char ? tower.char.position.x : null);
      const z = tower.z !== undefined ? tower.z : (tower.char ? tower.char.position.z : null);
      if (x === null || z === null) return;
      this.showRange(x, z, tower.stats.range, D.TOWERS[tower.type].color);
    }

    showRange(x, z, range, color) {
      this.rangeGroup.visible = true;
      this.rangeGroup.position.set(x, 0.3, z);
      this.rangeGroup.scale.set(range, 1, range);
      this.rangeFill.material.color.set(color);
      this.rangeRing.material.color.set(color);
      this.rangeInner.material.color.set(color);
    }

    hideRange() {
      this.rangeGroup.visible = false;
    }

    updateRangeForHover() {
      if (this.state !== 'playing' || this.mergeOpen) return;
      if (this.selected && !this.buildType) {
        this.showTowerRange(this.selected);
        return;
      }
      if (this.buildType && this.hoveredPad && this.hoveredPad.freePoint) {
        const def = D.TOWERS[this.buildType];
        this.showRange(this.hoveredPad.position.x, this.hoveredPad.position.z, def.base.range, this.hoveredPad.valid ? def.color : '#ff6b82');
      } else if (!this.selected) {
        this.hideRange();
      }
    }

    refreshPadStates() {
      if (!this.world) return;
      this.world.pads.forEach(p => {
        if (p.occupied) this.world.setPadState(p.index, 'occupied');
        else this.world.setPadState(p.index, 'idle');
      });
      this.updateBuildGhost();
      this.updateMergeHighlights();
    }

    updatePadLabel() {
      if (!this.ui.padLabels) return;
      let text = '';
      let invalid = false;
      if (this.mergeSource && this.hoveredPad) {
        const t = this.towerAtPoint(this.hoveredPad.position.x, this.hoveredPad.position.z, 1.8);
        if (t && t !== this.mergeSource && t.type === this.mergeSource.type && t.level === this.mergeSource.level) text = '点击融合';
        else if (t === this.mergeSource) text = '取消融合';
      } else if (this.buildType && this.hoveredPad) {
        if (this.hoveredPad.valid) text = '部署 ' + D.TOWERS[this.buildType].short;
        else { text = '不可部署 · ' + this.hoveredPad.reason; invalid = true; }
      }
      if (!text) { this.hidePadLabel(); return; }
      if (!this.padLabelEl) {
        this.padLabelEl = document.createElement('div');
        this.padLabelEl.className = 'pad-label';
        this.ui.padLabels.appendChild(this.padLabelEl);
      }
      this.padLabelEl.textContent = text;
      this.padLabelEl.dataset.active = '1';
      this.padLabelEl.classList.toggle('invalid', invalid);
      this.padLabelPos = this.hoveredPad.position.clone().setY(1.45);
    }

    hidePadLabel() {
      if (this.padLabelEl) this.padLabelEl.remove();
      this.padLabelEl = null;
    }

    /* =========================================================
       WAVES
       ========================================================= */
    beginBuildPhase(initial) {
      this.buildPhase = true;
      this.waveActive = false;
      this.countdown = initial ? C.buildTime : C.intermission;
      this.refreshPadStates();
      AUDIO.setMood('build');
    }

    getEarlyBonus() {
      return Math.min(25, Math.max(4, Math.ceil(this.countdown * 1.4) + (this.waveIndex || 0) * 2));
    }

    callWave() {
      if (this.state !== 'playing' || this.mergeOpen || !this.buildPhase) return;
      let bonus = 0;
      if (this.countdown > 0.5) {
        bonus = this.getEarlyBonus();
        this.gold += bonus;
        this.floatAtWorld(this.worldSampleCore(), '+' + bonus + ' 星币', 'gold');
        this.toast(`提前召唤 · 获得 ${bonus} 星币`, 'good');
        AUDIO.play('gold');
      }
      this.startWave();
    }

    isEndless() { return this.mode === 'endless'; }

    mapWave(base, index) {
      const map = this.mapDef || D.MAPS[this.mapId] || D.MAPS.cloud;
      const wave = JSON.parse(JSON.stringify(base));
      wave.spawns = wave.spawns || [];
      if (map.mix === 'ember') {
        wave.spawns.forEach(g => { if (g.type === 'wisp') g.type = 'runner'; });
        wave.spawns.push({ type: 'brute', count: 1 + Math.floor(index / 2), gap: 2.0, delay: 5.6 });
        if (index >= 3) wave.spawns.push({ type: 'shielded', count: 1, gap: 1.5, delay: 8.2 });
      } else if (map.mix === 'ruins') {
        wave.spawns.push({ type: 'splitter', count: 2 + Math.floor(index / 2), gap: 1.15, delay: 3.4 });
        wave.spawns.push({ type: 'healer', count: 1, gap: 1.0, delay: 6.4 });
        if (index >= 4) wave.spawns.push({ type: 'shielded', count: 1, gap: 1.5, delay: 9.0 });
      }
      wave.spawns.forEach(g => { if (g.type === 'boss') g.type = map.boss; });
      if (wave.boss) wave.bossType = map.boss;
      wave.reward = Math.round((wave.reward || 0) * (map.mix === 'ember' ? 1.12 : map.mix === 'ruins' ? 1.08 : 1));
      return wave;
    }

    getWaveDef(index) {
      if (index <= 0) return this.mapWave(D.WAVES[0], 1);
      if (index <= C.maxWaves) return this.mapWave(D.WAVES[index - 1], index);
      const cycle = index - C.maxWaves;
      const boss = cycle % 5 === 0;
      const shade = 10 + cycle * 2;
      const runner = 6 + cycle;
      const brute = 2 + Math.floor(cycle / 2);
      const wisp = 3 + Math.floor(cycle / 2);
      const spawns = [
        { type: 'shade', count: shade, gap: 0.52, delay: 0.4 },
        { type: 'runner', count: runner, gap: 0.6, delay: 2.2 },
        { type: 'brute', count: brute, gap: 1.8, delay: 5.0 },
        { type: 'wisp', count: wisp, gap: 0.9, delay: 8.0 }
      ];
      const map = this.mapDef || D.MAPS[this.mapId] || D.MAPS.cloud;
      if (boss) spawns.push({ type: map.boss, count: 1, gap: 1, delay: 10.0 });
      const wave = {
        name: boss ? `无尽领主 · ${index}` : `无尽回响 · ${index}`,
        en: boss ? 'ENDLESS OVERLORD' : 'ENDLESS ECHO',
        subtitle: boss ? '无尽波次 · 深渊领主再临' : '无尽波次 · 敌潮不熄',
        reward: 80 + cycle * 12,
        boss,
        spawns
      };
      return this.mapWave(wave, index);
    }

    startWave() {
      if (this.waveIndex >= C.maxWaves && !this.isEndless()) return;
      this.waveIndex++;
      this.buildPhase = false;
      this.waveActive = true;
      this.countdown = 0;
      this.waveTime = 0;
      this.spawnQueue = [];
      this.spawnCursor = 0;
      this.spawnedCount = 0;
      this.waveKills = 0;
      this.waveClearTimer = 0;
      const wave = this.getWaveDef(this.waveIndex);
      wave.spawns.forEach(group => {
        for (let i = 0; i < group.count; i++) {
          this.spawnQueue.push({ type: group.type, time: group.delay + i * group.gap });
        }
      });
      this.spawnQueue.sort((a, b) => a.time - b.time);
      this.waveTotal = this.spawnQueue.length;
      this.announceWave(wave);
      this.refreshPadStates();
      this.updateHud(true);
      if (wave.boss) {
        AUDIO.play('boss');
        AUDIO.setMood('boss');
      } else {
        AUDIO.play('wave');
        AUDIO.setMood('battle');
      }
    }

    announceWave(wave) {
      this.showAnnounce('第 ' + this.waveIndex + ' 波', wave.en, wave.name, 3000);
      AUDIO.play('announce');
    }

    spawnEnemy(type) {
      const def = D.ENEMIES[type];
      const wave = this.waveIndex;
      const diff = this.difficultyDef || D.DIFFICULTIES.normal;
      const hpScale = (1 + (Math.min(wave, 4) - 1) * 0.12 + Math.max(0, wave - 4) * 0.18) * diff.hp;
      const armorScale = Math.floor((wave - 1) * 0.5) + (diff.armor || 0);
      const speedScale = (1 + (wave - 1) * 0.012) * (diff.speed || 1);
      const group = A.EnemyFactory.create(type);
      this.scene.add(group);
      const start = this.world.samplePathAt(0);
      group.position.set(start.pos.x, 0.12, start.pos.z);
      const enemy = {
        id: ++this.towerSeq + 1000,
        type, def, group,
        hp: def.hp * hpScale, maxHp: def.hp * hpScale,
        armor: def.armor + armorScale,
        speed: def.speed * speedScale,
        dist: 0, progress: 0,
        alive: true, slow: 0, slowTimer: 0, freeze: 0,
        bleedDps: 0, bleedTime: 0, bleedSource: null, bleedShow: 0,
        auraSlow: 0, hitPulse: 0, bar: null, barY: 2.3, gold: def.gold, core: def.core,
        phase: 1, shield: def.shield || 0, phase2: false, phase3: false,
        healTimer: def.heal ? 1.6 : 0
      };
      if (type === 'shade') enemy.barY = 3.15;
      else if (type === 'runner') enemy.barY = 2.3;
      else if (type === 'brute') enemy.barY = 3.8;
      else if (type === 'wisp') enemy.barY = 1.85;
      else if (type === 'boss') enemy.barY = 6.7;
      else if (def.barY) enemy.barY = def.barY;
      this.createEnemyBar(enemy);
      this.enemies.push(enemy);
      this.spawnedCount++;
      this.vfx.ring(new T.Vector3(start.pos.x, 0.3, start.pos.z), def.color, 2.2, { dur: 0.6 });
      this.vfx.burst(new T.Vector3(start.pos.x, 1.2, start.pos.z), def.color, 18, { speed: 2.2, life: 0.6, size: 0.15 });
      if (def.boss) {
        this.bossSpawned = true;
        if (this.ui.bossName) this.ui.bossName.textContent = def.name;
        if (this.ui.bossBar) this.ui.bossBar.dataset.boss = def.id;
        this.ui.bossBar.classList.remove('hidden');
        this.shakeScreen(0.5);
        this.flash('#ff5d8f', 0.18, 500);
        this.showAnnounce('深渊歌姬', 'ABYSS DIVA · SERAPHINA', '塞拉菲娜降临', 3200);
      }
    }

    spawnEnemyAt(type, progress) {
      this.spawnEnemy(type);
      this.spawnedCount = Math.max(0, this.spawnedCount - 1);
      const enemy = this.enemies[this.enemies.length - 1];
      if (enemy) enemy.extra = true;
      if (!enemy) return null;
      const t = clamp(progress, 0, 1);
      const s = this.world.samplePathAt(t);
      enemy.progress = t;
      enemy.dist = (this.world.pathLength || 0) * t;
      enemy.group.position.set(s.pos.x, 0.12, s.pos.z);
      return enemy;
    }

    triggerBossPhase(enemy, phase) {
      if (!enemy || !enemy.alive || !enemy.def.boss) return;
      if (phase === 2 && !enemy.phase2) {
        enemy.phase2 = true;
        enemy.phase = 2;
        this.bossPhase = 2;
        this.slowTimer = 0.9;
        this.showAnnounce('相位 II · 唤潮', 'ABYSS SUMMONS', '2 秒后，飞灵与蚀影将加入战场', 2400);
        const points = [0.46, 0.55, 0.64, 0.72];
        points.forEach((v, i) => {
          const s = this.world.samplePathAt(v);
          this.vfx.ring(new T.Vector3(s.pos.x, 0.3, s.pos.z), '#ff8fc3', 1.8, { dur: 1.9 });
          this.vfx.burst(new T.Vector3(s.pos.x, 1.0, s.pos.z), '#ff8fc3', 12, { speed: 1.5, life: 0.8, size: 0.14 });
        });
        setTimeout(() => {
          if (!enemy.alive || this.state !== 'playing') return;
          this.spawnEnemyAt('wisp', 0.46);
          this.spawnEnemyAt('wisp', 0.55);
          this.spawnEnemyAt('shade', 0.64);
          this.spawnEnemyAt('shade', 0.72);
          this.toast('深渊歌姬召来了 4 名眷属', 'warn');
        }, 2000);
      }
      if (phase === 3 && !enemy.phase3) {
        enemy.phase3 = true;
        enemy.phase = 3;
        enemy.shield = 800;
        this.bossPhase = 3;
        this.towerSlowTimer = 4;
        this.slowTimer = 0.9;
        this.showAnnounce('相位 III · 终幕', 'THE FINAL ARIA', '护盾展开 · 守卫攻速降低 30%', 2600);
        this.vfx.ring(enemy.group.position.clone().setY(0.4), '#ff4f8c', 4.2, { dur: 1.1 });
        this.vfx.burst(enemy.group.position.clone().setY(2.0), '#ff4f8c', 48, { speed: 3.5, life: 1.2, size: 0.26, up: 1.2 });
        this.shakeScreen(0.3);
      }
    }

    createEnemyBar(enemy) {
      const g = new T.Group();
      const w = enemy.def.boss ? 2.2 : 1.0;
      const h = enemy.def.boss ? 0.1 : 0.075;
      const bg = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: 0x120a16, transparent: true, opacity: 0.75, depthTest: false, depthWrite: false }));
      const fill = new T.Mesh(new T.PlaneGeometry(w, h * 0.66), new T.MeshBasicMaterial({ color: enemy.def.boss ? 0xff6b9c : 0xffb36b, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false }));
      fill.position.z = 0.002;
      bg.renderOrder = 20; fill.renderOrder = 21;
      g.add(bg, fill);
      const traits = [];
      if (enemy.armor > 0) traits.push('\u7532 ' + enemy.armor);
      if (enemy.def.flying) traits.push('\u98de');
      if (enemy.def.speed >= 3) traits.push('\u75be');
      if (enemy.shield > 0) traits.push('\u76fe');
      if (enemy.def.heal) traits.push('\u6108');
      if (enemy.def.split) traits.push('\u5206');
      if (traits.length) {
        const text = traits.join('  ');
        const sp = new T.Sprite(new T.SpriteMaterial({
          map: traitTexture(text, enemy.def.boss ? '#ffd36a' : '#d6e4ff'),
          transparent: true, opacity: 0.92, depthTest: false, depthWrite: false
        }));
        const tw = 0.28 + text.length * 0.045;
        sp.scale.set(tw, enemy.def.boss ? 0.2 : 0.15, 1);
        sp.position.set(0, h * 0.5 + 0.12, 0.003);
        sp.renderOrder = 22;
        g.add(sp);
        enemy.traitSprite = sp;
      }
      g.userData.w = w;
      g.userData.fill = fill;
      this.scene.add(g);
      enemy.bar = g;
      enemy.barFill = fill;
    }

    updateEnemyBar(enemy) {
      if (!enemy.bar || !enemy.alive) return;
      enemy.bar.position.copy(enemy.group.position);
      enemy.bar.position.y += enemy.barY;
      enemy.bar.quaternion.copy(this.camera.quaternion);
      const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
      const fill = enemy.barFill;
      fill.scale.x = Math.max(0.001, ratio);
      fill.position.x = -(1 - ratio) * enemy.bar.userData.w / 2;
      if (enemy.freeze > 0) fill.material.color.setHex(0x9cefff);
      else if (ratio < 0.3) fill.material.color.setHex(0xff5a7e);
      else fill.material.color.setHex(enemy.def.boss ? 0xff6b9c : 0xffb36b);
    }

    removeEnemy(enemy, killed) {
      if (!enemy.alive && !enemy._removed) {
        // still remove
      }
      enemy._removed = true;
      enemy.alive = false;
      if (enemy.bar) {
        this.scene.remove(enemy.bar);
        enemy.bar.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
        enemy.bar = null;
      }
      if (enemy.group) {
        if (killed) {
          enemy.group.userData.deathT = 0;
          this.deaths.push({ group: enemy.group, t: 0, scale: enemy.def.scale || 1 });
        } else {
          this.scene.remove(enemy.group);
          A.EnemyFactory.dispose(enemy.group);
        }
      }
      this.enemies = this.enemies.filter(e => e !== enemy);
    }

    /* =========================================================
       UPDATE LOOP
       ========================================================= */
    loop(now) {
      const raw = (now - this.last) / 1000;
      const dt = Math.min(0.05, Math.max(0.0001, raw || 0.016));
      this.last = now;
      this.time += dt;
      this.uiClock += dt;
      this.updateCamera(dt);
      this.world.update(dt, this.time);
      this.updateVisuals(dt);
      if (this.state === 'playing' && !this.paused && !this.mergeOpen) {
        let gdt = dt * this.speed;
        if (this.slowTimer > 0) {
          this.slowTimer -= dt;
          gdt *= 0.32;
        }
        this.updateGame(gdt);
      }
      this.vfx.update(dt);
      AUDIO.update(dt);
      this.updateUI(dt);
      this.post.render(dt);
      requestAnimationFrame(this.loop);
    }

    updateVisuals(dt) {
      // menu heroes
      this.menuHeroes.forEach((c, i) => {
        if (!c.visible) return;
        A.CharacterFactory.update(c, this.time + i * 0.4, dt);
      });
      // deployed guardians
      this.towers.forEach(t => {
        if (t.char) A.CharacterFactory.update(t.char, this.time, dt);
      });
      // enemies
      this.enemies.forEach(e => {
        if (!e.alive) return;
        A.EnemyFactory.update(e.group, this.time, dt);
        e.hitPulse = Math.max(0, e.hitPulse - dt * 5);
        if (e.group) e.group.scale.setScalar((e.def.scale || 1) * 1.38 * (1 + e.hitPulse * 0.035));
        this.updateEnemyBar(e);
      });
      // deaths
      for (let i = this.deaths.length - 1; i >= 0; i--) {
        const d = this.deaths[i];
        d.t += dt;
        const k = d.t / 0.42;
        if (k >= 1) {
          this.scene.remove(d.group);
          A.EnemyFactory.dispose(d.group);
          this.deaths.splice(i, 1);
        } else {
          d.group.scale.setScalar(d.scale * (1 - k * 0.35));
          d.group.position.y -= dt * 1.4;
          d.group.rotation.z += dt * 2.2;
        }
      }
      // pad label follows world
      if (this.padLabelEl && this.padLabelPos) {
        const v = this.padLabelPos.clone().project(this.camera);
        if (v.z < 1) {
          this.padLabelEl.style.left = ((v.x * 0.5 + 0.5) * window.innerWidth) + 'px';
          this.padLabelEl.style.top = ((-v.y * 0.5 + 0.5) * window.innerHeight) + 'px';
        }
      }
    }

    updateGame(dt) {
      this.elapsed += dt;
      this.skillCd = Math.max(0, this.skillCd - dt);
      this.towerSlowTimer = Math.max(0, this.towerSlowTimer - dt);
      if (this.buildPhase) {
        this.countdown -= dt;
        if (this.countdown <= 0) {
          this.countdown = 0;
          this.startWave();
        }
        return;
      }
      if (!this.waveActive) return;
      this.waveTime += dt;
      while (this.spawnCursor < this.spawnQueue.length && this.spawnQueue[this.spawnCursor].time <= this.waveTime) {
        this.spawnEnemy(this.spawnQueue[this.spawnCursor].type);
        this.spawnCursor++;
      }
      this.updateEnemies(dt);
      this.updateTowers(dt);
      this.updateProjectiles(dt);
      // wave clear check
      const alive = this.enemies.length;
      if (this.spawnCursor >= this.spawnQueue.length && alive === 0) {
        this.waveClearTimer += dt;
        if (this.waveClearTimer > 1.15) this.completeWave();
      } else {
        this.waveClearTimer = 0;
      }
    }

    updateEnemies(dt) {
      const pathLength = this.world.pathLength;
      const towersWithAura = this.towers.filter(t => t.stats.auraSlow > 0);
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (!e.alive) continue;
        // statuses
        if (e.freeze > 0) e.freeze -= dt;
        if (e.slowTimer > 0) {
          e.slowTimer -= dt;
          if (e.slowTimer <= 0) e.slow = 0;
        }
        e.auraSlow = 0;
        for (const t of towersWithAura) {
          if (!t.char) continue;
          const dx = t.char.position.x - e.group.position.x;
          const dz = t.char.position.z - e.group.position.z;
          if (dx * dx + dz * dz <= t.stats.range * t.stats.range) {
            e.auraSlow = Math.max(e.auraSlow, t.stats.auraSlow);
          }
        }
        if (e.bleedTime > 0 && e.bleedDps > 0) {
          e.bleedTime -= dt;
          const dmg = e.bleedDps * dt;
          e.hp -= dmg;
          e.bleedShow += dmg;
          if (e.bleedShow > 14) {
            this.floatAtWorld(e.group.position.clone().setY(1.2), '-' + Math.round(e.bleedShow), '');
            e.bleedShow = 0;
          }
          if (e.hp <= 0) {
            this.killEnemy(e, e.bleedSource, true);
            continue;
          }
        }
        if (e.def.heal) {
          e.healTimer = (e.healTimer || 0) - dt;
          if (e.healTimer <= 0) {
            e.healTimer = e.def.heal.interval || 2.6;
            let healed = false;
            for (const o of this.enemies) {
              if (!o.alive || o === e || o.hp >= o.maxHp) continue;
              const dx = o.group.position.x - e.group.position.x;
              const dz = o.group.position.z - e.group.position.z;
              if (dx * dx + dz * dz <= (e.def.heal.radius || 4) ** 2) {
                o.hp = Math.min(o.maxHp, o.hp + (e.def.heal.amount || 8));
                this.floatAtWorld(o.group.position.clone().setY(1.3), '+愈', 'heal');
                healed = true;
              }
            }
            if (healed) this.vfx.ring(e.group.position.clone().setY(0.3), '#8be8b0', e.def.heal.radius || 4, { dur: 0.55 });
          }
        }
        const speedMul = (e.freeze > 0 ? 0 : 1) * (1 - clamp(e.slow + e.auraSlow, 0, 0.82));
        e.dist += e.speed * speedMul * dt;
        const prog = e.dist / pathLength;
        e.progress = prog;
        if (prog >= 0.995) {
          this.coreDamage(e);
          continue;
        }
        const s = this.world.samplePathAt(prog);
        const fly = e.def.flying ? (e.def.flyHeight || 1.5) : 0;
        e.group.position.set(s.pos.x, 0.12 + fly, s.pos.z);
        if (e.def.boss) {
          e.group.rotation.y = Math.atan2(this.camera.position.x - s.pos.x, this.camera.position.z - s.pos.z);
        } else {
          e.group.rotation.y = Math.atan2(s.tangent.x, s.tangent.z);
        }
      }
    }

    updateTowers(dt) {
      for (const tower of this.towers) {
        if (!tower.char || !tower.stats) continue;
        tower.cooldown -= dt;
        if (tower.cooldown > 0) continue;
        const targets = this.getTargets(tower);
        if (!targets.length) {
          tower.cooldown = 0.08;
          continue;
        }
        tower.attackCount++;
        tower.cooldown = Math.max(0.08, tower.stats.interval * (this.towerSlowTimer > 0 ? 1.43 : 1));
        A.CharacterFactory.playAttack(tower.char);
        const echo = tower.stats.echoEvery > 0 && tower.attackCount % tower.stats.echoEvery === 0;
        if (tower.type === 'archer') this.attackArcher(tower, targets, echo);
        else if (tower.type === 'mage' || tower.type === 'kirin' || tower.type === 'ginseng') this.attackMage(tower, targets[0], echo);
        else this.attackBlade(tower, targets, echo);
      }
    }

    getTargets(tower) {
      const s = tower.stats;
      const arr = [];
      const pos = tower.char.position;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const dx = e.group.position.x - pos.x;
        const dz = e.group.position.z - pos.z;
        if (dx * dx + dz * dz <= (s.range + e.def.radius * 0.35) * (s.range + e.def.radius * 0.35)) arr.push(e);
      }
      const mode = tower.targetMode || (tower.type === 'archer' ? 'first' : tower.type === 'mage' ? 'strong' : 'near');
      const byMode = {
        first: (a, b) => b.progress - a.progress,
        last: (a, b) => a.progress - b.progress,
        strong: (a, b) => (b.maxHp - a.maxHp) || (b.hp - a.hp),
        near: (a, b) => a.group.position.distanceToSquared(pos) - b.group.position.distanceToSquared(pos)
      };
      arr.sort(byMode[mode] || byMode.first);
      if (tower.type === 'archer') return arr.slice(0, 1);
      if (tower.type === 'mage' || tower.type === 'kirin' || tower.type === 'ginseng') {
        if (!arr.length) return [];
        const primary = arr[0];
        // keep the mage's splash-relevant cluster behaviour, but respect the selected primary target
        return [primary];
      }
      return arr.slice(0, Math.max(1, s.maxTargets));
    }

    attackArcher(tower, targets, echo) {
      const s = tower.stats;
      const primary = targets[0];
      const mult = echo ? s.echoMult : 1;
      if (echo) {
        this.vfx.ring(primary.group.position.clone().setY(0.4), '#ffd27d', 2.4, { dur: 0.5 });
      }
      const count = 1 + s.multishot;
      const inRange = this.enemies.filter(e => e.alive && e.group.position.distanceToSquared(tower.char.position) <= s.range * s.range);
      for (let i = 0; i < count; i++) {
        let target = primary;
        if (i > 0 && inRange.length > 1) target = inRange[Math.floor(Math.random() * inRange.length)];
        const damage = s.damage * (i === 0 ? 1 : (s.multishotRatio || 0.65)) * mult;
        this.spawnArrow(tower, target, damage);
      }
      if (s.volleyEvery > 0 && tower.attackCount % s.volleyEvery === 0 && inRange.length) {
        for (let i = 0; i < s.volleyCount; i++) {
          const target = inRange[Math.floor(Math.random() * inRange.length)] || primary;
          this.spawnArrow(tower, target, s.damage * (s.volleyRatio || 0.9));
        }
        this.vfx.ring(tower.char.position.clone().setY(1.8), '#ffd27d', 2.4, { dur: 0.5 });
      }
      const muzzle = tower.char.position.clone().setY(1.74);
      this.vfx.burst(muzzle, tower.level >= 3 ? '#7dffc0' : '#ffd77a', 10, { speed: 1.7, life: 0.35, size: 0.13, gravity: 0, drag: 0.96 });
      if (tower.level >= 3) this.vfx.ring(muzzle, '#7dffc0', 1.5, { dur: 0.32 });
      AUDIO.play('shoot_archer');
    }

    attackMage(tower, target, echo) {
      const s = tower.stats;
      const orbColor = tower.type === 'kirin' ? '#ff9a4a' : tower.type === 'ginseng' ? '#8be8b0' : '#9cefff';
      this.spawnOrb(tower, target, s.damage * (echo ? s.echoMult : 1), echo);
      if (echo) this.vfx.ring(target.group.position.clone().setY(0.4), orbColor, 2.2, { dur: 0.5 });
      this.vfx.ring(tower.char.position.clone().setY(0.28), orbColor, 2.0, { dur: 0.55 });
      this.vfx.burst(tower.char.position.clone().setY(1.9), orbColor, 14, { speed: 1.4, life: 0.55, size: 0.12, gravity: -0.4 });
      if (tower.level >= 3) this.vfx.ring(tower.char.position.clone().setY(1.4), '#ff8a8a', 1.2, { dur: 0.4 });
      AUDIO.play('shoot_mage');
    }

    attackBlade(tower, targets, echo) {
      const s = tower.stats;
      const mult = echo ? s.echoMult : 1;
      const color = '#ff9fce';
      this.vfx.slash(tower.char.position.clone().setY(0.6), color, { angle: Math.random() * 6, radius: 1.4, dur: 0.3 });
      this.vfx.slash(tower.char.position.clone().setY(1.0), '#ffd36a', { angle: Math.random() * 6 + 1.4, radius: 1.1, dur: 0.26 });
      if (tower.level >= 3) this.vfx.ring(tower.char.position.clone().setY(0.5), '#ff9a4d', 1.9, { dur: 0.4 });
      let hasShadow = false;
      if (s.shadowEvery > 0 && tower.attackCount % s.shadowEvery === 0) {
        hasShadow = true;
        const all = this.enemies.filter(e => e.alive && e.group.position.distanceToSquared(tower.char.position) <= s.range * s.range);
        all.forEach(e => this.dealDamage(e, s.damage * s.shadowMult, tower, { noChain: true }));
        this.vfx.ring(tower.char.position.clone().setY(0.5), '#ff7bbf', s.range + 0.5, { dur: 0.6 });
        this.vfx.burst(tower.char.position.clone().setY(1.2), '#ff9fce', 40, { speed: 4, life: 0.6, size: 0.2 });
        this.shakeScreen(0.2);
      }
      targets.forEach((e, i) => {
        if (!e.alive) return;
        this.dealDamage(e, s.damage * mult, tower, {});
        if (s.bleedDps > 0) {
          e.bleedDps = Math.max(e.bleedDps, s.bleedDps);
          e.bleedTime = Math.max(e.bleedTime, s.bleedDuration);
          e.bleedSource = tower;
        }
        const p = e.group.position.clone().setY(1.0);
        this.vfx.slash(p, i % 2 ? '#ffd36a' : '#ff7fc4', { angle: Math.random() * 6, radius: 1.0, dur: 0.24 });
        this.vfx.slash(p, '#ffb15e', { angle: Math.random() * 6 + 1.2, radius: 0.9, dur: 0.22 });
        this.vfx.burst(p, '#ff9a4d', 7, { speed: 1.8, life: 0.32, size: 0.1, gravity: 0.6 });
      });
      if (hasShadow) AUDIO.play('crit');
      AUDIO.play('blade');
    }

    spawnArrow(tower, target, damage) {
      if (!target) return;
      const g = new T.Group();
      const spirit = tower.level >= 3;
      const shaft = new T.Mesh(new T.CylinderGeometry(0.016, 0.022, 0.46, 5), new T.MeshBasicMaterial({ color: spirit ? '#c8ffdf' : '#ffe7a8' }));
      shaft.rotation.x = Math.PI / 2;
      const tip = new T.Mesh(new T.ConeGeometry(0.055, 0.16, 5), new T.MeshBasicMaterial({ color: '#fff6d6' }));
      tip.rotation.x = Math.PI / 2;
      tip.position.z = 0.3;
      g.add(shaft, tip);
      const glowS = new T.Sprite(new T.SpriteMaterial({ map: A.STAR_TEX, color: spirit ? 0x7dffc0 : 0xffd77a, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false }));
      glowS.scale.set(0.55, 0.55, 1);
      g.add(glowS);
      const origin = tower.char.position.clone().setY(1.78);
      origin.x += 0.15;
      g.position.copy(origin);
      this.scene.add(g);
      this.projectiles.push({
        kind: 'arrow', mesh: g, source: tower, target, damage,
        speed: tower.stats.speed || 24, life: 2.4,
        pierce: tower.stats.pierce || 0, hitIds: [],
        lastPos: target.group.position.clone().setY(1.0), trail: 0,
        color: spirit ? '#7dffc0' : '#ffd77a'
      });
    }

    spawnOrb(tower, target, damage, echo) {
      if (!target) return;
      const g = new T.Group();
      const orbColor = tower.type === 'kirin' ? '#ff9a4a' : tower.type === 'ginseng' ? '#8be8b0' : '#7ce9ff';
      const core = new T.Mesh(new T.IcosahedronGeometry(0.15, 1), new T.MeshBasicMaterial({ color: orbColor }));
      const shell = new T.Mesh(new T.IcosahedronGeometry(0.26, 1), new T.MeshBasicMaterial({ color: orbColor, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false }));
      const halo = new T.Sprite(new T.SpriteMaterial({ map: A.STAR_TEX, color: orbColor, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false }));
      halo.scale.set(1.0, 1.0, 1);
      g.add(core, shell, halo);
      g.position.copy(tower.char.position).setY(1.95);
      this.scene.add(g);
      this.projectiles.push({
        kind: 'orb', mesh: g, source: tower, target, damage,
        speed: tower.stats.speed || 16, life: 3.2,
        lastPos: target.group.position.clone(), trail: 0, echo,
        color: orbColor
      });
    }

    updateProjectiles(dt) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        const source = p.source;
        let targetPos;
        if (p.target && p.target.alive) {
          targetPos = p.target.group.position.clone();
          targetPos.y += p.kind === 'orb' ? 0.9 : 1.0;
          p.lastPos.copy(targetPos);
        } else {
          targetPos = p.lastPos.clone();
        }
        if (p.kind === 'orb' && p.target && p.target.alive) {
          p.mesh.position.lerp(targetPos, Math.min(1, dt * 6));
        }
        const dir = new T.Vector3().subVectors(targetPos, p.mesh.position);
        const dist = dir.length();
        const step = p.speed * dt;
        if (dist <= Math.max(0.26, step * 0.9)) {
          if (p.kind === 'arrow') {
            if (this.resolveArrow(p)) this.removeProjectile(i);
          } else {
            this.resolveOrb(p);
            this.removeProjectile(i);
          }
          continue;
        }
        dir.normalize();
        p.mesh.position.addScaledVector(dir, step);
        p.mesh.lookAt(p.mesh.position.clone().add(dir));
        p.trail -= dt;
        if (p.trail <= 0) {
          p.trail = 0.035;
          this.vfx.spawn(p.mesh.position, p.color, 1, { speed: 0.4, life: 0.28, size: 0.18, gravity: 0, drag: 0.98 });
        }
        p.life -= dt;
        if (p.life <= 0) {
          if (p.kind === 'arrow') this.resolveArrow(p);
          else this.resolveOrb(p);
          this.removeProjectile(i);
        }
      }
    }

    removeProjectile(index) {
      const p = this.projectiles[index];
      if (!p) return;
      this.scene.remove(p.mesh);
      A.CharacterFactory.dispose(p.mesh);
      this.projectiles.splice(index, 1);
    }

    resolveArrow(p) {
      const target = p.target;
      if (!target || !target.alive) return true;
      this.dealDamage(target, p.damage, p.source, {});
      this.vfx.burst(p.mesh.position.clone(), '#ffd77a', 7, { speed: 2.2, life: 0.3, size: 0.12, gravity: -1 });
      AUDIO.play('hit');
      if (p.pierce > 0) {
        p.hitIds.push(target.id);
        const next = this.enemies
          .filter(e => e.alive && !p.hitIds.includes(e.id) && e.group.position.distanceToSquared(target.group.position) < 49)
          .sort((a, b) => a.group.position.distanceToSquared(target.group.position) - b.group.position.distanceToSquared(target.group.position))[0];
        if (next) {
          p.pierce--;
          p.target = next;
          p.lastPos.copy(next.group.position).setY(1.0);
          p.life = Math.max(p.life, 0.7);
          return false;
        }
      }
      return true;
    }

    resolveOrb(p) {
      const center = p.target && p.target.alive ? p.target.group.position.clone() : p.lastPos.clone();
      center.y = 0.9;
      const tower = p.source;
      if (!tower || !tower.stats) return;
      const s = tower.stats;
      const radius = s.splash;
      const orbColor = tower.type === 'kirin' ? '#ff9a4a' : tower.type === 'ginseng' ? '#8be8b0' : '#9cefff';
      this.vfx.ring(center.clone().setY(0.28), orbColor, radius + 0.4, { dur: 0.55 });
      this.vfx.burst(center, orbColor, 34, { speed: 3.4, life: 0.65, size: 0.2, gravity: -0.8, up: 0.8 });
      this.vfx.burst(center, '#ffffff', 12, { speed: 2, life: 0.4, size: 0.14 });
      this.enemies.slice().forEach(e => {
        if (!e.alive) return;
        const dx = e.group.position.x - center.x;
        const dz = e.group.position.z - center.z;
        if (dx * dx + dz * dz <= (radius + e.def.radius * 0.4) * (radius + e.def.radius * 0.4)) {
          this.dealDamage(e, p.damage, tower, {});
          if (e.alive) {
            if (s.slowFactor > 0) {
              e.slow = Math.max(e.slow, s.slowFactor);
              e.slowTimer = Math.max(e.slowTimer, s.slowDuration);
            }
            if (s.bleedDps > 0) {
              e.bleedDps = Math.max(e.bleedDps, s.bleedDps);
              e.bleedTime = Math.max(e.bleedTime, s.bleedDuration);
              e.bleedSource = tower;
            }
            if (s.freezeChance > 0 && Math.random() < s.freezeChance) {
              e.freeze = Math.max(e.freeze, s.freezeDuration * (e.def.boss ? 0.55 : 1));
              this.vfx.burst(e.group.position.clone().setY(1), '#c9f8ff', 8, { speed: 1.5, life: 0.5, size: 0.12 });
            }
          }
        }
      });
      this.shakeScreen(0.07);
    }

    dealDamage(enemy, amount, tower, opts) {
      if (!enemy || !enemy.alive || !tower || !tower.stats) return;
      const s = tower.stats;
      const crit = Math.random() < s.critChance;
      let dmg = amount * (crit ? s.critMult : 1);
      if (s.executeThreshold > 0 && enemy.hp / enemy.maxHp < s.executeThreshold) dmg *= 1 + s.executeBonus;
      const beforeArmor = dmg;
      const armor = Math.max(0, enemy.armor - s.armorPen);
      dmg = Math.max(dmg * 0.18, dmg - armor);
      const absorbed = Math.max(0, Math.round(beforeArmor - dmg));
      const final = Math.max(1, Math.round(dmg));
      let hpDamage = final;
      if (enemy.shield > 0) {
        const absorbedByShield = Math.min(enemy.shield, hpDamage);
        enemy.shield -= absorbedByShield;
        hpDamage -= absorbedByShield;
        if (absorbedByShield > 0) {
          this.floatAtWorld(enemy.group.position.clone().setY(2.0), '护盾 -' + Math.round(absorbedByShield), 'armor');
        }
        if (enemy.shield <= 0 && absorbedByShield > 0) {
          if (enemy.def.boss) {
            this.showAnnounce('护盾碎裂', 'THE SHIELD BREAKS', enemy.def.name + ' 暴露了核心', 1800);
          }
          this.vfx.ring(enemy.group.position.clone().setY(0.4), '#ffd36a', 3.6, { dur: 0.9 });
        }
      }
      enemy.hp -= hpDamage;
      enemy.hitPulse = 1;
      tower.damageDone += final;
      const pos = enemy.group.position.clone().setY(1.4 + Math.random() * 0.35);
      if (absorbed >= 2 && absorbed >= final * 0.6) {
        this.floatAtWorld(pos.clone().add(new T.Vector3(0.38, 0.28, 0)), '护甲 -' + absorbed, 'armor');
      }
      this.floatAtWorld(pos, String(final), crit ? 'crit' : '');
      if (crit) {
        AUDIO.play('crit');
        this.vfx.burst(pos, '#ffe4a1', 8, { speed: 2.6, life: 0.4, size: 0.14 });
      }
      if (s.slowFactor > 0 && !opts.chain) {
        enemy.slow = Math.max(enemy.slow, s.slowFactor);
        enemy.slowTimer = Math.max(enemy.slowTimer, s.slowDuration);
      }
      if (s.freezeChance > 0 && !opts.chain && Math.random() < s.freezeChance) {
        enemy.freeze = Math.max(enemy.freeze, s.freezeDuration * (enemy.def.boss ? 0.55 : 1));
      }
      if (s.bleedDps > 0 && !opts.chain) {
        enemy.bleedDps = Math.max(enemy.bleedDps, s.bleedDps);
        enemy.bleedTime = Math.max(enemy.bleedTime, s.bleedDuration);
        enemy.bleedSource = tower;
      }
      if (s.chain > 0 && !opts.chain && !opts.noChain) this.chainDamage(enemy, tower, final * (s.chainRatio || 0.45));
      if (enemy.hp <= 0) this.killEnemy(enemy, tower, false, opts);
      else {
        if (enemy.def.boss) {
          const ratio = enemy.hp / enemy.maxHp;
          if (ratio <= 0.66) this.triggerBossPhase(enemy, 2);
          if (ratio <= 0.33) this.triggerBossPhase(enemy, 3);
        }
        this.vfx.spawn(pos, D.TOWERS[tower.type].color, 2, { speed: 1.4, life: 0.25, size: 0.1, gravity: -1 });
      }
    }

    chainDamage(fromEnemy, tower, damage) {
      const s = tower.stats;
      let count = Math.min(3, s.chainCount || 0);
      const hit = [fromEnemy];
      let source = fromEnemy;
      while (count-- > 0) {
        let next = null, best = 20;
        for (const e of this.enemies) {
          if (!e.alive || hit.includes(e)) continue;
          const d = e.group.position.distanceToSquared(source.group.position);
          if (d < best) { best = d; next = e; }
        }
        if (!next) break;
        hit.push(next);
        this.vfx.beam(source.group.position.clone().setY(1.1), next.group.position.clone().setY(1.1), D.TOWERS[tower.type].color, { dur: 0.18, width: 1.4 });
        this.dealDamage(next, damage, tower, { chain: true, noChain: true });
        source = next;
      }
    }

    killEnemy(enemy, tower, fromBleed, opts) {
      if (!enemy.alive) return;
      enemy.alive = false;
      const pos = enemy.group.position.clone().setY(1.0);
      this.waveKills++;
      this.kills++;
      let gold = enemy.def.gold;
      if (tower && tower.stats) {
        gold += tower.stats.bounty || 0;
        tower.kills++;
      }
      this.gold += gold;
      this.runMaxGold = Math.max(this.runMaxGold || 0, this.gold);
      if (enemy.def.boss) { this.runBossKills = (this.runBossKills || 0) + 1; this.runBossTypes.add(enemy.type); }
      this.energy = Math.min(C.skillEnergyMax, this.energy + (enemy.def.boss ? 20 : 2));
      this.floatAtWorld(pos.clone().setY(1.8), '+' + gold, 'gold');
      this.vfx.burst(pos, enemy.def.color, enemy.def.boss ? 150 : 26, {
        speed: enemy.def.boss ? 8 : 3.4, life: enemy.def.boss ? 2.0 : 0.8,
        size: enemy.def.boss ? 0.4 : 0.22, gravity: -1.5, up: 1.4
      });
      this.vfx.ring(pos.clone().setY(0.3), enemy.def.color, enemy.def.boss ? 5 : 1.6, { dur: enemy.def.boss ? 1.2 : 0.55 });
      if (tower && tower.stats && tower.stats.novaRatio > 0 && !opts?.noNova) {
        const s = tower.stats;
        const center = enemy.group.position.clone();
        this.vfx.ring(center.clone().setY(0.3), '#9cefff', s.novaRadius, { dur: 0.5 });
        this.vfx.burst(center, '#9cefff', 18, { speed: 2.8, life: 0.5, size: 0.16 });
        this.enemies.slice().forEach(e => {
          if (!e.alive || e === enemy) return;
          const dx = e.group.position.x - center.x, dz = e.group.position.z - center.z;
          if (dx * dx + dz * dz <= s.novaRadius * s.novaRadius) {
            this.dealDamage(e, s.damage * s.novaRatio, tower, { noNova: true });
          }
        });
      }
      if (enemy.def.split && !opts?.noSplit) {
        const n = Math.max(1, enemy.def.split.count || 2);
        for (let i = 0; i < n; i++) {
          const child = this.spawnEnemyAt(enemy.def.split.type || 'shade', Math.max(0.02, enemy.progress));
          if (child) {
            child.group.position.x += (i - (n - 1) / 2) * 0.9;
            child.group.position.z += (i % 2 ? 0.5 : -0.5);
            child.hp = child.maxHp;
            child.alive = true;
          }
        }
        this.vfx.ring(enemy.group.position.clone().setY(0.3), '#b56cff', 2.4, { dur: 0.6 });
      }
      if (enemy.def.boss) {
        this.bossSpawned = false;
        this.ui.bossBar.classList.add('hidden');
        this.shakeScreen(0.6);
        this.flash('#ffd889', 0.28, 700);
        this.slowTimer = 1.6;
        this.showAnnounce(enemy.def.name + ' 陨落', 'THE ABYSS FALLS SILENT', '星核守住了', 3000);
        this.removeEnemy(enemy, true);
        setTimeout(() => {
          if (this.state === 'playing' && this.enemies.length === 0) this.completeWave();
        }, 1500);
      } else {
        this.removeEnemy(enemy, true);
      }
      AUDIO.play('kill');
      this.updateHud(true);
    }

    coreDamage(enemy) {
      if (!enemy.alive) return;
      this.leaks++;
      this.lastLeak = { wave: this.waveIndex, name: enemy.def.name, type: enemy.type };
      this.leakLog.push({ ...this.lastLeak });
      if (enemy.def.boss) {
        this.bossSpawned = false;
        this.ui.bossBar.classList.add('hidden');
        this.slowTimer = 0.8;
        this.showAnnounce('星核破碎', 'THE CORE IS BREACHED', enemy.def.name + ' 穿过了防线', 2600);
      }
      const dmg = enemy.core;
      this.coreHp = Math.max(0, this.coreHp - dmg);
      const pos = this.world.coreGroup.position.clone().setY(2.2);
      this.floatAtWorld(pos, '-' + dmg, 'core');
      this.vfx.burst(pos, '#ff5d7e', 36, { speed: 4, life: 1.0, size: 0.3, up: 1.0 });
      this.vfx.ring(new T.Vector3(this.world.coreGroup.position.x, 0.3, this.world.coreGroup.position.z), '#ff5d7e', 4.2, { dur: 0.9 });
      this.world.setCoreHealth(this.coreHp / this.coreMax);
      this.shakeScreen(0.42);
      this.flash('#ff3d61', 0.2, 420);
      AUDIO.play('coreHit');
      this.removeEnemy(enemy, false);
      if (this.coreHp <= 0) {
        this.endGame(false);
      } else {
        this.toast('星核结界受损！', 'warn');
      }
      this.updateHud(true);
    }

    completeWave() {
      if (!this.waveActive && !this.buildPhase) return;
      this.waveActive = false;
      this.waveClearTimer = 0;
      const wave = this.getWaveDef(this.waveIndex);
      const reward = wave ? wave.reward : 0;
      this.gold += reward;
      this.toast(`敌潮已退 · 星币 +${reward}`, 'good');
      AUDIO.play('gold');
      if (this.waveIndex % 3 === 0) {
        this.rerolls++;
        setTimeout(() => this.toast('命运重掷 +1', 'good'), 350);
      }
      if (this.waveIndex >= C.maxWaves && !this.isEndless()) {
        this.endGame(true);
        return;
      }
      this.beginBuildPhase(false);
      this.updateHud(true);
      this.saveCheckpoint();
      this.refreshPadStates();
    }

    corePosition() {
      return this.world.coreGroup ? this.world.coreGroup.position : new T.Vector3(14, 0, 16);
    }

    worldSampleCore() {
      const c = this.corePosition();
      return new T.Vector3(c.x, 2.4, c.z);
    }

    /* =========================================================
       UI / FEEDBACK
       ========================================================= */
    updateUI(dt) {
      // smooth pad labels every frame already
      if (this.uiClock < 0.09) return;
      this.uiClock = 0;
      this.updateHud(false);
    }

    updateHud(force) {
      this.runMaxGold = Math.max(this.runMaxGold || 0, this.gold || 0);
      if (!this.ui) return;
      const goldEl = this.ui.gold;
      if (goldEl.textContent !== String(this.gold)) {
        goldEl.textContent = this.gold;
        const res = goldEl.closest('.resource');
        if (res) {
          res.classList.add('flash');
          setTimeout(() => res.classList.remove('flash'), 220);
        }
      }
      const coreFrac = this.coreHp / this.coreMax;
      this.ui.coreFrac.textContent = this.coreHp + ' / ' + this.coreMax;
      this.ui.coreBar.style.transform = `scaleX(${coreFrac})`;
      this.ui.coreBar.parentElement.classList.toggle('low', coreFrac < 0.35);
      this.ui.coreSub.textContent = coreFrac > 0.7 ? '结界稳定' : coreFrac > 0.35 ? '结界出现裂痕' : '结界濒临熄灭';
      const displayWave = this.waveActive ? this.waveIndex : (this.isEndless() ? this.waveIndex + 1 : Math.min(this.waveIndex + 1, C.maxWaves));
      const waveDef = this.getWaveDef(Math.max(0, displayWave));
      this.ui.waveNumber.textContent = displayWave;
      this.ui.waveName.textContent = waveDef ? waveDef.name : '—';
      if (this.ui.waveTotal) this.ui.waveTotal.textContent = this.isEndless() ? '∞' : String(C.maxWaves).padStart(2, '0');
      const alive = this.enemies.filter(e => e.alive).length;
      if (this.buildPhase) {
        this.ui.waveStatus.textContent = this.waveIndex === 0
          ? `部署守卫 · 敌潮将在 ${Math.ceil(this.countdown)} 秒后抵达`
          : `星潮暂歇 · 下一波将在 ${Math.ceil(this.countdown)} 秒后抵达`;
      } else if (this.waveActive) {
        this.ui.waveStatus.textContent = alive > 0 ? `敌潮进行中 · 剩余 ${alive} 个敌人` : '星轨清朗 · 敌潮即将结束';
      } else {
        this.ui.waveStatus.textContent = '星核安全';
      }
      const progress = this.waveActive ? (this.waveTotal ? this.spawnedCount / this.waveTotal : 0) : 0;
      this.ui.waveProgress.style.width = (progress * 100) + '%';
      if (this.buildPhase) {
        this.ui.callBtn.classList.remove('disabled');
        this.ui.callLabel.textContent = '唤醒敌潮';
        const bonus = this.getEarlyBonus();
        this.ui.callSub.textContent = `提前召唤 +${bonus} 星币`;
        const total = this.waveIndex === 0 ? C.buildTime : C.intermission;
        const C2 = 2 * Math.PI * 52;
        this.ui.summonProgress.style.strokeDashoffset = String(C2 * (1 - clamp(this.countdown / total, 0, 1)));
      } else {
        this.ui.callBtn.classList.add('disabled');
        this.ui.callLabel.textContent = '敌潮进行中';
        this.ui.callSub.textContent = alive > 0 ? `剩余 ${alive} 名敌人` : '即将结束';
        this.ui.summonProgress.style.strokeDashoffset = '0';
      }
      this.ui.bossBar.classList.toggle('hidden', !this.bossSpawned);
      const boss = this.enemies.find(e => e.def.boss && e.alive);
      if (boss) {
        this.ui.bossFill.style.transform = `scaleX(${clamp(boss.hp / boss.maxHp, 0, 1)})`;
        if (this.ui.bossPhase) this.ui.bossPhase.textContent = 'PHASE ' + ['I', 'II', 'III'][boss.phase - 1];
        if (this.ui.bossShield) {
          const hasShield = boss.shield > 0;
          this.ui.bossShield.classList.toggle('hidden', !hasShield);
          this.ui.bossShieldFill.style.transform = `scaleX(${clamp(boss.shield / 800, 0, 1)})`;
        }
      } else if (this.ui.bossShield) {
        this.ui.bossShield.classList.add('hidden');
      }
      this.cardEls.forEach(c => {
        const def = D.TOWERS[c.dataset.type];
        c.classList.toggle('disabled', this.gold < def.cost);
        c.classList.toggle('selected', this.buildType === c.dataset.type);
      });
      if (this.selected) {
        const s = this.selected.stats;
        if (s) {
          this.ui.statDmg.textContent = Math.round(s.damage);
          this.ui.statSpd.textContent = (1 / s.interval).toFixed(2) + '/s';
        }
      }
      this.ui.rerollCount.textContent = this.rerolls;
      this.ui.btnReroll.disabled = this.rerolls <= 0;
      if (this.ui.btnRepair) {
        const canRepair = this.buildPhase && this.coreHp < this.coreMax && this.repairsUsed < C.coreRepairMax && this.gold >= C.coreRepairCost;
        this.ui.btnRepair.disabled = !canRepair;
        this.ui.btnRepair.classList.toggle('disabled', !canRepair);
        const span = this.ui.btnRepair.querySelector('span');
        const em = this.ui.btnRepair.querySelector('em');
        if (span) span.textContent = this.repairsUsed >= C.coreRepairMax ? '修复次数已尽' : '修复结界 +1';
        if (em) em.textContent = this.repairsUsed >= C.coreRepairMax ? `${this.repairsUsed}/${C.coreRepairMax}` : String(C.coreRepairCost);
        this.ui.btnRepair.title = !this.buildPhase ? '布防期才能修复' : this.coreHp >= this.coreMax ? '结界完整' : '消耗星币修复 1 点结界';
      }
      if (this.selected) this.updateUpgradeUI();
      this.updateSkillUI();
      this.updateWavePreview();
    }

    showAnnounce(title, en, sub, duration) {
      const el = this.ui.announce;
      this.ui.announceTitle.textContent = title;
      this.ui.announceEn.textContent = en || '';
      this.ui.announceSub.textContent = sub || '';
      el.classList.remove('hidden');
      clearTimeout(this.announceTimer);
      this.announceTimer = setTimeout(() => el.classList.add('hidden'), duration || 2600);
    }

    toast(text, type) {
      const el = document.createElement('div');
      el.className = 'toast ' + (type || '');
      el.innerHTML = `<i>${type === 'warn' ? '!' : type === 'good' ? '✦' : '◇'}</i><span>${text}</span>`;
      this.ui.toast.appendChild(el);
      while (this.ui.toast.children.length > 3) this.ui.toast.firstElementChild.remove();
      setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 360);
      }, 2300);
    }

    showTutorial(title, text) {
      this.ui.tutTitle.textContent = title;
      this.ui.tutText.textContent = text;
      this.ui.tutorial.classList.remove('hidden');
    }

    floatAtWorld(pos, text, cls) {
      const v = pos.clone().project(this.camera);
      if (v.z > 1) return;
      const el = document.createElement('div');
      el.className = 'dmg-float ' + (cls || '');
      el.textContent = text;
      el.style.left = ((v.x * 0.5 + 0.5) * window.innerWidth) + 'px';
      el.style.top = ((-v.y * 0.5 + 0.5) * window.innerHeight) + 'px';
      this.ui.float.appendChild(el);
      if (this.ui.float.children.length > 40) this.ui.float.firstElementChild.remove();
      setTimeout(() => el.remove(), 900);
    }

    flash(color, opacity, duration) {
      if (this.reducedMotion) return;
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;inset:0;z-index:6;pointer-events:none;background:radial-gradient(ellipse at center,${color},transparent 72%);opacity:${opacity};transition:opacity ${duration}ms ease-out`;
      this.app.appendChild(el);
      requestAnimationFrame(() => { el.style.opacity = '0'; });
      setTimeout(() => el.remove(), duration + 60);
    }

    updateAudioMood() {
      if (this.state === 'menu') AUDIO.setMood('menu');
      else if (this.waveActive) {
        const boss = this.enemies.find(e => e.def.boss && e.alive);
        AUDIO.setMood(boss ? 'boss' : 'battle');
      } else AUDIO.setMood('build');
    }
  }

  window.addEventListener('load', () => {
    try {
      window.__astral = new Game();
    } catch (err) {
      console.error(err);
      const tip = document.getElementById('loader-tip');
      if (tip) tip.textContent = '星轨编织失败：' + (err && err.message ? err.message : err);
    }
  });
})();

