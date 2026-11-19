/* =========================================================
   星陨战线 · WORLD
   Floating sanctum, sky, terrain, path, pads, core, stage
   ========================================================= */
(function () {
  'use strict';
  const T = THREE;
  const D = window.GAME_DATA;
  const A = window.AstralArt;
  const { toon, pbr, basic, glow, outline, add, sphere, capsule, taperedTube, starGeo } = A;

  const WORLD_RNG = (seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  })(991127);

  function canvasTex(c, colorSpace) {
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = colorSpace === false ? T.NoColorSpace : T.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  function makeGroundTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(512, 500, 40, 512, 512, 530);
    g.addColorStop(0, '#506353');
    g.addColorStop(0.45, '#3c5146');
    g.addColorStop(0.78, '#2e3f3b');
    g.addColorStop(1, '#22302f');
    x.fillStyle = g;
    x.fillRect(0, 0, 1024, 1024);
    // painterly moss patches
    for (let i = 0; i < 900; i++) {
      const px = WORLD_RNG() * 1024, py = WORLD_RNG() * 1024;
      const r = 5 + WORLD_RNG() * 65;
      const colors = ['rgba(111,132,94,', 'rgba(79,105,81,', 'rgba(53,77,70,', 'rgba(139,148,107,', 'rgba(65,88,71,'];
      x.fillStyle = colors[(Math.random() * colors.length) | 0] + (0.025 + WORLD_RNG() * 0.075) + ')';
      x.beginPath(); x.ellipse(px, py, r, r * (0.4 + WORLD_RNG() * 0.6), WORLD_RNG() * 3.14, 0, 6.3); x.fill();
    }
    // grass strokes
    for (let i = 0; i < 6000; i++) {
      const px = WORLD_RNG() * 1024, py = WORLD_RNG() * 1024;
      x.strokeStyle = `rgba(${90 + (WORLD_RNG() * 60) | 0},${110 + (WORLD_RNG() * 50) | 0},${80 + (WORLD_RNG() * 30) | 0},${0.05 + WORLD_RNG() * 0.16})`;
      x.lineWidth = 0.6 + WORLD_RNG() * 1.3;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + (WORLD_RNG() - 0.5) * 8, py - 4 - WORLD_RNG() * 12); x.stroke();
    }
    // tiny flowers
    for (let i = 0; i < 420; i++) {
      const px = WORLD_RNG() * 1024, py = WORLD_RNG() * 1024;
      const pal = ['rgba(244,218,157,', 'rgba(255,176,205,', 'rgba(160,226,255,', 'rgba(228,241,255,'];
      x.fillStyle = pal[(WORLD_RNG() * pal.length) | 0] + (0.2 + WORLD_RNG() * 0.5) + ')';
      const r = 0.7 + WORLD_RNG() * 1.7;
      x.beginPath(); x.arc(px, py, r, 0, 6.3); x.fill();
    }
    // edge vignette
    const v = x.createRadialGradient(512, 512, 330, 512, 512, 560);
    v.addColorStop(0, 'rgba(15,22,22,0)');
    v.addColorStop(1, 'rgba(11,17,19,.7)');
    x.fillStyle = v; x.fillRect(0, 0, 1024, 1024);
    return canvasTex(c);
  }

  function makeRockTexture() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const x = c.getContext('2d');
    x.fillStyle = '#3b2f46'; x.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 70; i++) {
      const y = WORLD_RNG() * 512;
      const h = 3 + WORLD_RNG() * 20;
      const pal = ['rgba(71,55,82,', 'rgba(52,43,67,', 'rgba(89,67,86,', 'rgba(44,36,55,', 'rgba(102,79,90,'];
      x.fillStyle = pal[(WORLD_RNG() * pal.length) | 0] + (0.15 + WORLD_RNG() * 0.4) + ')';
      x.beginPath();
      x.moveTo(0, y);
      for (let px = 0; px <= 1024; px += 64) x.lineTo(px, y + Math.sin(px * 0.013 + i) * 6 + (WORLD_RNG() - 0.5) * 10);
      x.lineTo(1024, y + h); x.lineTo(0, y + h); x.closePath(); x.fill();
    }
    for (let i = 0; i < 1600; i++) {
      x.fillStyle = `rgba(${20 + WORLD_RNG() * 30 | 0},${16 + WORLD_RNG() * 25 | 0},${25 + WORLD_RNG() * 35 | 0},${WORLD_RNG() * 0.18})`;
      x.fillRect(WORLD_RNG() * 1024, WORLD_RNG() * 512, 1 + WORLD_RNG() * 5, 1 + WORLD_RNG() * 3);
    }
    // cyan crystal veins
    for (let i = 0; i < 18; i++) {
      const x0 = WORLD_RNG() * 1024, y0 = WORLD_RNG() * 512;
      x.strokeStyle = 'rgba(116,226,235,.13)';
      x.lineWidth = 0.8;
      x.beginPath(); x.moveTo(x0, y0);
      for (let k = 0; k < 5; k++) x.lineTo(x0 + (WORLD_RNG() - 0.5) * 80, y0 + k * 18);
      x.stroke();
    }
    const tex = canvasTex(c);
    tex.wrapS = T.RepeatWrapping; tex.wrapT = T.ClampToEdgeWrapping;
    return tex;
  }

  function makeCloudTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    for (let i = 0; i < 16; i++) {
      const px = 50 + WORLD_RNG() * 156, py = 90 + WORLD_RNG() * 80, r = 30 + WORLD_RNG() * 55;
      const g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, 'rgba(255,248,242,.24)');
      g.addColorStop(0.55, 'rgba(232,222,244,.1)');
      g.addColorStop(1, 'rgba(220,210,240,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(px, py, r, 0, 6.3); x.fill();
    }
    return canvasTex(c);
  }

  function makePetalTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 30, 0, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,240,247,1)');
    g.addColorStop(0.5, 'rgba(255,170,205,.9)');
    g.addColorStop(1, 'rgba(255,120,180,0)');
    x.fillStyle = g;
    x.beginPath(); x.ellipse(32, 32, 12, 28, 0.6, 0, 6.3); x.fill();
    return canvasTex(c);
  }

  function makeMoonTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 20, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,248,225,.95)');
    g.addColorStop(0.35, 'rgba(255,232,190,.75)');
    g.addColorStop(0.6, 'rgba(255,206,160,.18)');
    g.addColorStop(1, 'rgba(255,190,150,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    return canvasTex(c);
  }

  /* =========================================================
     WORLD
     ========================================================= */
  class World {
    constructor(renderer, scene) {
      this.renderer = renderer;
      this.scene = scene;
      this.root = new T.Group();
      scene.add(this.root);
      this.time = 0;
      this.pads = [];
      this.padHits = [];
      this.dynamic = [];
      this.trees = [];
      this.lanterns = [];
      this.crystals = [];
      this.floatRocks = [];
      this.clouds = [];
      this.motes = null;
      this.petals = null;
      this.menuGroup = null;
      this.coreGroup = null;
      this.portal = null;
      this.coreHealth = 1;

      this.buildSky();
      this.buildLights();
      this.samplePath();
      this.buildIsland();
      this.buildPath();
      this.buildPads();
      this.buildScenery();
      this.buildSpawn();
      this.buildCore();
      this.buildMotes();
      this.buildClouds();
      this.buildMenuStage();
    }

    samplePath() {
      const points = this.pathPoints || D.PATH_POINTS;
      this.pathCurve = new T.CatmullRomCurve3(
        points.map(p => new T.Vector3(p[0], 0.1, p[1])), false, 'catmullrom', 0.35
      );
      this.pathLength = this.pathCurve.getLength();
      this.pathSamples = [];
      const n = 600;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const p = this.pathCurve.getPointAt(t);
        const tan = this.pathCurve.getTangentAt(t);
        this.pathSamples.push({ p, tan });
      }
    }

    samplePathAt(t) {
      t = Math.max(0, Math.min(1, t));
      const f = t * 600;
      const i = Math.min(599, Math.floor(f));
      const k = f - i;
      const a = this.pathSamples[i], b = this.pathSamples[i + 1];
      return {
        pos: new T.Vector3().lerpVectors(a.p, b.p, k),
        tangent: new T.Vector3().lerpVectors(a.tan, b.tan, k).normalize()
      };
    }

    pathEnd() {
      return this.pathSamples[600].p.clone();
    }

    buildSky() {
      const skyGeo = new T.SphereGeometry(180, 48, 32);
      this.skyMat = new T.ShaderMaterial({
        side: T.BackSide,
        depthWrite: false,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `
          varying vec3 vPos; uniform float uTime;
          float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
          void main(){
            vec3 dir=normalize(vPos);
            float h=dir.y;
            vec3 horizon=vec3(0.34,0.15,0.13);
            vec3 mid=vec3(0.12,0.06,0.18);
            vec3 zenith=vec3(0.008,0.008,0.032);
            vec3 col=mix(horizon,mid,smoothstep(-0.06,0.20,h));
            col=mix(col,zenith,smoothstep(0.14,0.72,h));
            // sun glow near horizon
            vec3 sunDir=normalize(vec3(-0.55,0.12,-0.82));
            float sd=max(dot(dir,sunDir),0.0);
            col+=vec3(1.0,0.55,0.24)*pow(sd,90.0)*1.25;
            col+=vec3(1.0,0.42,0.22)*pow(sd,8.0)*0.07;
            // aurora ribbons
            float ang=atan(dir.z,dir.x);
            float band=sin(ang*3.0+uTime*0.03)+0.6*sin(ang*7.0-uTime*0.05+1.3);
            float aurora=smoothstep(0.55,1.25,band)*smoothstep(0.08,0.5,h)*smoothstep(0.95,0.3,h);
            col+=vec3(0.16,0.75,0.72)*aurora*0.075;
            col+=vec3(0.55,0.3,0.9)*pow(aurora,2.0)*0.055;
            // stars
            vec2 sp=floor(vec2(ang,h)*vec2(180.0,300.0));
            float star=step(0.995,hash(sp));
            float twinkle=0.5+0.5*sin(uTime*1.3+hash(sp+7.0)*20.0);
            col+=vec3(0.9,0.95,1.0)*star*twinkle*smoothstep(0.28,0.85,h)*0.45;
            // subtle cloud band at horizon
            float haze=smoothstep(0.08,-0.02,h)*smoothstep(-0.2,-0.04,h);
            col=mix(col,vec3(0.4,0.24,0.24),haze*0.22);
            gl_FragColor=vec4(col,1.0);
          }`
      });
      this.sky = new T.Mesh(skyGeo, this.skyMat);
      this.sky.frustumCulled = false;
      this.root.add(this.sky);

      // stars
      const starGeo = new T.BufferGeometry();
      const starPos = [];
      for (let i = 0; i < 900; i++) {
        const theta = WORLD_RNG() * Math.PI * 2;
        const phi = Math.acos(0.15 + WORLD_RNG() * 0.85);
        const r = 155;
        starPos.push(Math.sin(phi) * Math.cos(theta) * r, Math.cos(phi) * r, Math.sin(phi) * Math.sin(theta) * r);
      }
      starGeo.setAttribute('position', new T.Float32BufferAttribute(starPos, 3));
      const starMat = new T.PointsMaterial({
        color: 0xfff4da, size: 3.8, map: A.STAR_TEX, transparent: true, fog: false,
        opacity: 1.0, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true
      });
      this.stars = new T.Points(starGeo, starMat);
      this.stars.frustumCulled = false;
      this.root.add(this.stars);

      // moon / broken planet
      const moonMat = new T.SpriteMaterial({
        map: makeMoonTexture(), color: 0xffe9c8, transparent: true, fog: false,
        opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false
      });
      this.moon = new T.Sprite(moonMat);
      this.moon.position.set(-2, 45, -112);
      this.moon.scale.set(34, 34, 1);
      this.root.add(this.moon);
      const halo = new T.Sprite(new T.SpriteMaterial({
        map: A.STAR_TEX, color: 0xffd9a0, transparent: true, opacity: 0.35,
        blending: T.AdditiveBlending, depthWrite: false
      }));
      halo.position.copy(this.moon.position);
      halo.position.z += 1;
      halo.scale.set(64, 64, 1);
      this.root.add(halo);

      // distant floating islands
      for (let i = 0; i < 0; i++) {
        const a = WORLD_RNG() * Math.PI * 2;
        const r = 70 + WORLD_RNG() * 35;
        const grp = new T.Group();
        const rock = new T.Mesh(new T.DodecahedronGeometry(4 + WORLD_RNG() * 4, 0), pbr('#3d3150', { roughness: 1 }));
        rock.scale.y = 0.5;
        grp.add(rock);
        const top = new T.Mesh(new T.CylinderGeometry(3.2, 3.8, 0.6, 10), toon('#4a6153'));
        top.position.y = 1.5;
        grp.add(top);
        grp.position.set(Math.cos(a) * r, -2 + WORLD_RNG() * 16, Math.sin(a) * r);
        grp.rotation.y = WORLD_RNG() * 6;
        grp.scale.setScalar(0.7 + WORLD_RNG() * 0.8);
        this.root.add(grp);
      }
    }

    buildLights() {
      this.scene.add(new T.HemisphereLight(0xbfd8ff, 0x2b1b38, 0.42));
      this.scene.add(new T.AmbientLight(0x5a4b7d, 0.18));
      const key = new T.DirectionalLight(0xffe0b0, 1.05);
      key.position.set(-18, 30, 18);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.camera.left = -34;
      key.shadow.camera.right = 34;
      key.shadow.camera.top = 34;
      key.shadow.camera.bottom = -34;
      key.shadow.camera.near = 1;
      key.shadow.camera.far = 90;
      key.shadow.bias = -0.0004;
      key.shadow.normalBias = 0.04;
      this.scene.add(key);
      this.keyLight = key;
      const rim = new T.DirectionalLight(0x7fe2ff, 0.48);
      rim.position.set(26, 16, -22);
      this.scene.add(rim);
      const fill = new T.DirectionalLight(0xff9ccf, 0.2);
      fill.position.set(10, 6, 26);
      this.scene.add(fill);
      this.scene.fog = new T.FogExp2(0x241a33, 0.0072);
    }

    buildIsland() {
      const island = new T.Group();
      this.root.add(island);
      this.island = island;
      const groundMap = makeGroundTexture();
      const groundMat = new T.MeshStandardMaterial({ map: groundMap, roughness: 0.98, metalness: 0.02, color: 0xffffff });
      this.groundMat = groundMat;
      const top = new T.Mesh(new T.CircleGeometry(22.4, 96), groundMat);
      top.rotation.x = -Math.PI / 2;
      top.receiveShadow = true;
      top.position.y = 0.02;
      island.add(top);
      // rim
      const rim = new T.Mesh(new T.TorusGeometry(22.25, 0.16, 6, 120), pbr('#5b705a', { roughness: 0.9 }));
      rim.rotation.x = -Math.PI / 2;
      rim.position.y = 0.05;
      island.add(rim);
      const rimGlow = new T.Mesh(new T.TorusGeometry(22.3, 0.03, 4, 120), glow('#e9d18a', 0.28));
      rimGlow.rotation.x = -Math.PI / 2;
      rimGlow.position.y = 0.08;
      island.add(rimGlow);
      // cliff body
      const rockMap = makeRockTexture();
      rockMap.repeat.set(3, 1.2);
      const sideMat = new T.MeshStandardMaterial({ map: rockMap, roughness: 0.97, metalness: 0.03 });
      const side = new T.Mesh(new T.CylinderGeometry(22.3, 11.5, 7.8, 80, 8, true), sideMat);
      side.position.y = -3.9;
      side.castShadow = true;
      side.receiveShadow = true;
      island.add(side);
      const under = new T.Mesh(new T.ConeGeometry(11.5, 9.5, 36, 4), new T.MeshStandardMaterial({ color: 0x2a2236, roughness: 1 }));
      under.position.y = -12.5;
      under.rotation.z = Math.PI;
      island.add(under);
      // moss overhang (instanced)
      const clumpGeo = new T.DodecahedronGeometry(1, 0);
      const clumpMat = toon('#526a54');
      const clumps = new T.InstancedMesh(clumpGeo, clumpMat, 46);
      const cd = new T.Object3D();
      const cColor = new T.Color();
      for (let i = 0; i < 46; i++) {
        const a = i / 46 * Math.PI * 2 + WORLD_RNG() * 0.1;
        const r = 21.4 + WORLD_RNG() * 1.4;
        cd.position.set(Math.cos(a) * r, 0.1 + WORLD_RNG() * 0.2, Math.sin(a) * r);
        cd.scale.set(0.6 + WORLD_RNG() * 1.4, (0.4 + WORLD_RNG() * 0.3) * (0.6 + WORLD_RNG() * 1.4), 0.6 + WORLD_RNG() * 1.4);
        cd.rotation.y = WORLD_RNG() * 6;
        cd.updateMatrix();
        clumps.setMatrixAt(i, cd.matrix);
        clumps.setColorAt(i, cColor.set(WORLD_RNG() > 0.5 ? '#526a54' : '#405b4d'));
      }
      clumps.instanceMatrix.needsUpdate = true;
      if (clumps.instanceColor) clumps.instanceColor.needsUpdate = true;
      island.add(clumps);
      // rock outcrops around cliff (instanced)
      const outcropGeo = new T.DodecahedronGeometry(1, 0);
      const outcropMat = pbr('#5c4a6b', { roughness: 1, emissive: '#2b1c38', emissiveIntensity: 0.22 });
      const outcrops = new T.InstancedMesh(outcropGeo, outcropMat, 26);
      const od = new T.Object3D();
      for (let i = 0; i < 26; i++) {
        const a = WORLD_RNG() * Math.PI * 2;
        const y = -1.5 - WORLD_RNG() * 6;
        const r = 18 + (Math.abs(y) * 0.55) + WORLD_RNG() * 2;
        const sc = 0.6 + WORLD_RNG() * 1.2;
        od.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        od.scale.set(sc, sc * (0.4 + WORLD_RNG() * 0.35), sc);
        od.rotation.set(WORLD_RNG() * 2, WORLD_RNG() * 6, WORLD_RNG() * 2);
        od.updateMatrix();
        outcrops.setMatrixAt(i, od.matrix);
      }
      outcrops.instanceMatrix.needsUpdate = true;
      island.add(outcrops);
      // dense low-poly ground life
      const dummy = new T.Object3D();
      const grassGeo = new T.ConeGeometry(0.065, 0.34, 3);
      const grassMat = toon('#69815d');
      const grass = new T.InstancedMesh(grassGeo, grassMat, 280);
      let gi = 0;
      for (let tries = 0; tries < 2000 && gi < 280; tries++) {
        const a = WORLD_RNG() * Math.PI * 2, r = 5 + WORLD_RNG() * 15.5;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this.distanceToPath(x, z) < 2.25) continue;
        let tooClose = false;
        for (const pad of D.PAD_POSITIONS) {
          const dx = pad[0] - x, dz = pad[1] - z;
          if (dx * dx + dz * dz < 2.4) { tooClose = true; break; }
        }
        if (tooClose) continue;
        dummy.position.set(x, 0.16, z);
        dummy.rotation.set((WORLD_RNG() - 0.5) * 0.18, WORLD_RNG() * 6, (WORLD_RNG() - 0.5) * 0.18);
        dummy.scale.set(0.6 + WORLD_RNG() * 0.9, 0.6 + WORLD_RNG() * 1.0, 0.6 + WORLD_RNG() * 0.9);
        dummy.updateMatrix();
        grass.setMatrixAt(gi, dummy.matrix);
        grass.setColorAt(gi, new T.Color().setHSL(0.25 + WORLD_RNG() * 0.05, 0.22 + WORLD_RNG() * 0.16, 0.28 + WORLD_RNG() * 0.12));
        gi++;
      }
      grass.count = gi;
      grass.instanceMatrix.needsUpdate = true;
      if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
      grass.receiveShadow = true;
      island.add(grass);
      // flowers
      const flowerGeo = new T.IcosahedronGeometry(0.042, 0);
      const flowerMat = new T.MeshBasicMaterial({ color: 0xffffff });
      const flowers = new T.InstancedMesh(flowerGeo, flowerMat, 190);
      let fi = 0;
      const flowerCols = ['#ffdda0', '#ffa9c9', '#9fe8ff', '#f4e5ff'];
      for (let tries = 0; tries < 2200 && fi < 190; tries++) {
        const a = WORLD_RNG() * Math.PI * 2, r = 5 + WORLD_RNG() * 15.5;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this.distanceToPath(x, z) < 2.15) continue;
        let tooClose = false;
        for (const pad of D.PAD_POSITIONS) {
          const dx = pad[0] - x, dz = pad[1] - z;
          if (dx * dx + dz * dz < 2.2) { tooClose = true; break; }
        }
        if (tooClose) continue;
        dummy.position.set(x, 0.1 + WORLD_RNG() * 0.15, z);
        dummy.rotation.set(0, WORLD_RNG() * 6, 0);
        dummy.scale.setScalar(0.6 + WORLD_RNG() * 0.65);
        dummy.updateMatrix();
        flowers.setMatrixAt(fi, dummy.matrix);
        flowers.setColorAt(fi, new T.Color(flowerCols[(WORLD_RNG() * flowerCols.length) | 0]));
        fi++;
      }
      flowers.count = fi;
      flowers.instanceMatrix.needsUpdate = true;
      if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
      island.add(flowers);
      // scattered pebbles
      const stoneGeo = new T.DodecahedronGeometry(0.18, 0);
      const stoneMat = pbr('#6a5d72', { roughness: 0.95 });
      const stones = new T.InstancedMesh(stoneGeo, stoneMat, 80);
      let si = 0;
      for (let tries = 0; tries < 600 && si < 80; tries++) {
        const a = WORLD_RNG() * Math.PI * 2, r = 7 + WORLD_RNG() * 14;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this.distanceToPath(x, z) < 2.1) continue;
        dummy.position.set(x, 0.05, z);
        dummy.rotation.set(WORLD_RNG() * 3, WORLD_RNG() * 6, WORLD_RNG() * 3);
        dummy.scale.set(0.4 + WORLD_RNG() * 1.2, 0.3 + WORLD_RNG() * 0.7, 0.4 + WORLD_RNG() * 1.2);
        dummy.updateMatrix();
        stones.setMatrixAt(si, dummy.matrix);
        si++;
      }
      stones.count = si;
      stones.instanceMatrix.needsUpdate = true;
      stones.castShadow = true;
      stones.receiveShadow = true;
      island.add(stones);
      // old flower cluster pass removed (instanced flowers are used instead)
    }

    distanceToPath(x, z) {
      let min = 99;
      if (!this.pathSamples) return min;
      for (let i = 0; i < this.pathSamples.length; i += 4) {
        const p = this.pathSamples[i].p;
        const dx = p.x - x, dz = p.z - z;
        const d = dx * dx + dz * dz;
        if (d < min) min = d;
      }
      return Math.sqrt(min);
    }

    ribbonGeometry(width, segments) {
      const pos = [], uv = [], idx = [];
      const up = new T.Vector3(0, 1, 0);
      for (let i = 0; i <= segments; i++) {
        const s = this.samplePathAt(i / segments);
        const n = new T.Vector3(-s.tangent.z, 0, s.tangent.x).normalize();
        const p = s.pos;
        const l = p.clone().addScaledVector(n, width / 2);
        const r = p.clone().addScaledVector(n, -width / 2);
        pos.push(l.x, p.y, l.z, r.x, p.y, r.z);
        uv.push(0, i / segments, 1, i / segments);
      }
      for (let i = 0; i < segments; i++) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }

    buildPath() {
      const pathGroup = new T.Group();
      this.root.add(pathGroup);
      this.pathGroup = pathGroup;
      const geo = this.ribbonGeometry(2.9, 260);
      this.pathMat = new T.ShaderMaterial({
        transparent: false, side: T.DoubleSide,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `varying vec2 vUv; varying vec3 vWorld; void main(){ vUv=uv; vec4 wp=modelMatrix*vec4(position,1.0); vWorld=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
        fragmentShader: `
          varying vec2 vUv; varying vec3 vWorld; uniform float uTime;
          float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
          void main(){
            vec2 uv=vUv;
            float edge=smoothstep(0.0,0.09,uv.x)*smoothstep(0.0,0.09,1.0-uv.x);
            float row=floor(uv.y*70.0);
            float seam=smoothstep(0.92,1.0,fract(uv.y*70.0))*0.35;
            float sideLine=smoothstep(0.055,0.0,abs(uv.x-0.06))+smoothstep(0.055,0.0,abs(uv.x-0.94));
            vec3 stoneA=vec3(0.075,0.062,0.11), stoneB=vec3(0.185,0.155,0.235);
            float n=hash(vec2(row,floor(uv.x*5.0)));
            vec3 col=mix(stoneA,stoneB,n*0.8);
            col+=vec3(0.6,0.55,0.65)*seam*0.35;
            float runeLine=pow(max(0.0,sin(uv.x*26.0+hash(vec2(row,3.0))*8.0)),10.0);
            col+=vec3(1.0,0.68,0.25)*runeLine*0.08*edge;
            float flow=pow(max(0.0,sin(uv.y*24.0-uTime*2.1+uv.x*6.0)),10.0);
            col+=vec3(1.0,0.68,0.28)*flow*0.075;
            col+=vec3(1.0,0.72,0.34)*sideLine*0.95;
            col*=0.95+0.12*edge;
            gl_FragColor=vec4(col,1.0);
          }`
      });
      const path = new T.Mesh(geo, this.pathMat);
      path.receiveShadow = true;
      pathGroup.add(path);
      // border glow tubes
      [-1, 1].forEach(side => {
        const pts = [];
        for (let i = 0; i <= 120; i++) {
          const s = this.samplePathAt(i / 120);
          const n = new T.Vector3(-s.tangent.z, 0, s.tangent.x).normalize();
          pts.push(s.pos.clone().addScaledVector(n, side * 1.45).setY(0.13));
        }
        const curve = new T.CatmullRomCurve3(pts);
        const tube = new T.Mesh(new T.TubeGeometry(curve, 150, 0.035, 4, false), glow(side > 0 ? '#ffd47a' : '#9cefff', 0.7));
        pathGroup.add(tube);
      });
      // rune medallions along path
      for (let i = 1; i < 12; i++) {
        const s = this.samplePathAt(i / 12);
        const disc = A.makeRunePlane(0.65, '#ffd794', 0.24);
        disc.rotation.x = -Math.PI / 2;
        disc.rotation.z = WORLD_RNG() * 6;
        disc.position.copy(s.pos).setY(0.115);
        pathGroup.add(disc);
      }
      // path edge stones (instanced)
      const edgeGeo = new T.DodecahedronGeometry(0.15, 0);
      const edgeMat = toon('#6d6177');
      const edgeStones = new T.InstancedMesh(edgeGeo, edgeMat, 80);
      const dummy = new T.Object3D();
      for (let i = 0; i < 80; i++) {
        const s = this.samplePathAt(i / 80);
        const side = i % 2 ? 1 : -1;
        const n = new T.Vector3(-s.tangent.z, 0, s.tangent.x).normalize();
        const p = s.pos.clone().addScaledVector(n, side * (1.72 + WORLD_RNG() * 0.15));
        dummy.position.copy(p).setY(0.1);
        dummy.rotation.set(WORLD_RNG(), WORLD_RNG() * 6, WORLD_RNG());
        dummy.scale.setScalar(0.75 + WORLD_RNG() * 0.8);
        dummy.updateMatrix();
        edgeStones.setMatrixAt(i, dummy.matrix);
      }
      edgeStones.instanceMatrix.needsUpdate = true;
      edgeStones.receiveShadow = true;
      pathGroup.add(edgeStones);
    }

    setPath(points) {
      if (!points || !points.length) return;
      const key = JSON.stringify(points);
      if (this.pathPointsKey === key) return;
      this.pathPointsKey = key;
      this.pathPoints = points;
      this.samplePath();
      if (this.pathGroup) {
        this.root.remove(this.pathGroup);
        this.pathGroup.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
            else o.material.dispose();
          }
        });
        this.pathGroup = null;
      }
      this.buildPath();
      const start = this.samplePathAt(0);
      if (this.portal) {
        this.portal.position.copy(start.pos).setY(0.05);
        this.portal.rotation.y = Math.atan2(start.tangent.x, start.tangent.z);
      }
      if (this.coreGroup) this.coreGroup.position.copy(this.pathEnd()).setY(0.05);
    }

    buildPads() {
      const padGroup = new T.Group();
      this.root.add(padGroup);
      this.padGroup = padGroup;
      D.PAD_POSITIONS.forEach((p, i) => {
        const g = new T.Group();
        g.position.set(p[0], 0, p[1]);
        padGroup.add(g);
        const baseMat = pbr('#4c405d', { roughness: 0.8, metalness: 0.18 });
        const base = add(g, new T.CylinderGeometry(0.98, 1.1, 0.22, 8), baseMat, 0, 0.11, 0);
        base.receiveShadow = true;
        const trim = add(g, new T.TorusGeometry(0.9, 0.035, 5, 8), toon('#c5a25e', { emissive: '#5b3a13', emissiveIntensity: 0.35 }), 0, 0.225, 0);
        trim.rotation.x = Math.PI / 2;
        trim.rotation.z = Math.PI / 8;
        // rune plane
        const rune = A.makeRunePlane(2.15, '#9cefff', 0.24);
        rune.rotation.x = -Math.PI / 2;
        rune.position.y = 0.24;
        g.add(rune);
        const rune2 = A.makeRunePlane(1.35, '#f3d99b', 0.16);
        rune2.rotation.x = -Math.PI / 2;
        rune2.position.y = 0.245;
        g.add(rune2);
        // hover ring
        const hoverMat = glow('#9cefff', 0.0);
        const hover = add(g, new T.RingGeometry(1.02, 1.12, 40), hoverMat, 0, 0.27, 0);
        hover.rotation.x = -Math.PI / 2;
        // shards
        const shards = [];
        for (let k = 0; k < 1; k++) {
          const a = k / 1 * Math.PI * 2;
          const sh = add(g, new T.OctahedronGeometry(0.07, 0), new T.MeshBasicMaterial({ color: '#9cefff', transparent: true, opacity: 0.5 }), Math.cos(a) * 1.15, 0.3, Math.sin(a) * 1.15);
          sh.userData.phase = a;
          shards.push(sh);
        }
        // interaction collider
        const hit = new T.Mesh(new T.CylinderGeometry(1.25, 1.25, 0.9, 12), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
        hit.position.y = 0.45;
        hit.userData.padIndex = i;
        g.add(hit);
        this.padHits.push(hit);
        const pad = {
          index: i, group: g, rune, rune2, hover, shards, hit,
          occupied: false, state: 'idle', baseY: 0, pulse: WORLD_RNG() * 6,
          position: new T.Vector3(p[0], 0.25, p[1])
        };
        this.pads.push(pad);
      });
      // Free-placement mode: ancient pads are kept only as invisible legacy anchors.
      padGroup.visible = false;
    }

    setPadState(index, state) {
      const pad = this.pads[index];
      if (!pad) return;
      pad.state = state;
      const col = state === 'available' ? '#9cefff' : state === 'hover' ? '#ffe2a1' : state === 'merge' ? '#ff9fce' : state === 'invalid' ? '#ff7b8e' : state === 'occupied' ? '#f3d99b' : '#9cefff';
      pad.rune.material.color.set(col);
      pad.rune2.material.color.set(col);
      pad.hover.material.color.set(col);
      const target = state === 'available' ? 0.6 : state === 'hover' ? 0.95 : state === 'merge' ? 0.85 : state === 'occupied' ? 0.2 : state === 'invalid' ? 0.6 : 0.2;
      pad.hover.material.opacity = target;
      pad.hover.visible = target > 0.02;
      pad.shards.forEach(s => s.material.color.set(col));
    }

    setAllPadsAvailable(available) {
      this.pads.forEach(p => {
        if (p.occupied) this.setPadState(p.index, 'occupied');
        else this.setPadState(p.index, available ? 'available' : 'idle');
      });
    }

    buildScenery() {
      // big cherry tree
      this.createTree(-14.2, 9.6, 1.15, '#ffb7d4');
      this.createTree(19.0, -7.4, 0.72, '#ffc4dc');
      this.createTree(-3.0, -17.5, 0.6, '#c6b4ff');
      // crystals
      this.createCrystalCluster(-19.4, 2.8, '#7fe9ff', 1.0);
      this.createCrystalCluster(13.6, -12.2, '#caa8ff', 0.85);
      this.createCrystalCluster(20.2, 9.0, '#ffa8d2', 0.8);
      this.createCrystalCluster(-3.6, 14.8, '#9cefff', 0.6);
      // ruins
      this.createRuins(18.4, -1.0);
      this.createRuins(-16.0, -1.2);
      this.createRuins(-11.6, 14.6);
      this.createWaterfall(-4.8, 20.7);
      // lanterns
      const lanternTs = [0.16, 0.28, 0.39, 0.51, 0.63, 0.75, 0.87];
      lanternTs.forEach((t, i) => {
        const s = this.samplePathAt(t);
        const n = new T.Vector3(-s.tangent.z, 0, s.tangent.x).normalize();
        const side = i % 2 ? 1 : -1;
        this.createLantern(s.pos.clone().addScaledVector(n, side * 2.6), i);
      });
      // floating rocks
      for (let i = 0; i < 0; i++) {
        const a = WORLD_RNG() * Math.PI * 2;
        const r = 13 + WORLD_RNG() * 18;
        const y = 6 + WORLD_RNG() * 10;
        const grp = new T.Group();
        const rock = new T.Mesh(new T.DodecahedronGeometry(0.35 + WORLD_RNG() * 0.7, 0), pbr('#594966', { roughness: 1, emissive: '#291d34', emissiveIntensity: 0.25 }));
        grp.add(rock);
        if (WORLD_RNG() > 0.55) {
          const top = new T.Mesh(new T.DodecahedronGeometry(0.42, 0), toon('#526756'));
          top.position.y = 0.4;
          top.scale.y = 0.35;
          grp.add(top);
        }
        grp.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        grp.userData.baseY = y;
        grp.userData.phase = WORLD_RNG() * 6;
        grp.userData.rotSpeed = (WORLD_RNG() - 0.5) * 0.05;
        this.root.add(grp);
        this.floatRocks.push(grp);
      }
      // light shafts
      for (let i = 0; i < 0; i++) {
        const a = i / 4 * Math.PI * 2 + 0.4;
        const cone = new T.Mesh(new T.ConeGeometry(3.4 + i, 24, 16, 1, true), new T.MeshBasicMaterial({
          color: i % 2 ? 0x9ee8ff : 0xffd79a, transparent: true, opacity: 0.011,
          blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
        }));
        cone.position.set(Math.cos(a) * 14, 13, Math.sin(a) * 14);
        cone.rotation.z = Math.cos(a) * 0.08;
        cone.rotation.x = Math.sin(a) * 0.08;
        this.root.add(cone);
      }
    }

    createWaterfall(x, z) {
      const g = new T.Group();
      g.position.set(x, 0, z);
      this.root.add(g);
      // stone lip
      const lip = add(g, new T.DodecahedronGeometry(1.3, 0), pbr('#3e334a', { roughness: 1 }), 0, 0.05, 0);
      lip.scale.set(1.4, 0.5, 0.9);
      const lipMoss = add(g, new T.DodecahedronGeometry(1.25, 0), toon('#4d6654'), 0, 0.42, 0);
      lipMoss.scale.set(1.36, 0.16, 0.85);
      // flowing sheet
      const wmat = new T.ShaderMaterial({
        transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `
          varying vec2 vUv; uniform float uTime;
          float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
          void main(){
            float edge=smoothstep(0.0,0.16,vUv.x)*smoothstep(0.0,0.16,1.0-vUv.x);
            float streak=pow(max(0.0,sin(vUv.y*46.0-uTime*7.0+vUv.x*18.0)),5.0);
            float fine=hash(vec2(vUv.x*30.0,floor(vUv.y*40.0-uTime*4.0)));
            float foam=smoothstep(0.85,1.0,vUv.y)*0.5;
            vec3 col=mix(vec3(0.24,0.55,0.75),vec3(0.86,0.97,1.0),streak*0.6+foam);
            float a=edge*(0.26+streak*0.52+foam*0.7);
            gl_FragColor=vec4(col,a);
          }`
      });
      const sheet = new T.Mesh(new T.PlaneGeometry(2.8, 13, 8, 24), wmat);
      sheet.position.set(0, -6.6, 0.15);
      g.add(sheet);
      this.waterfallMat = wmat;
      // particle spray
      const n = 150;
      const geo = new T.BufferGeometry();
      const pos = new Float32Array(n * 3);
      this.waterfallBase = [];
      for (let i = 0; i < n; i++) {
        const px = (Math.random() - 0.5) * 2.6, pz = (Math.random() - 0.5) * 0.5, py = -Math.random() * 13;
        pos[i * 3] = px; pos[i * 3 + 1] = py; pos[i * 3 + 2] = pz;
        this.waterfallBase.push({ x: px, z: pz, y: py, s: 1 + Math.random() * 2.2, p: Math.random() * 6 });
      }
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const pm = new T.PointsMaterial({
        map: A.STAR_TEX, color: 0x9fe8ff, size: 0.22, transparent: true, opacity: 0.68,
        blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true
      });
      const pts = new T.Points(geo, pm);
      pts.frustumCulled = false;
      g.add(pts);
      this.waterfallParticles = pts;
      this.waterfallGeo = geo;
      // mist at the bottom
      const mistTex = makeCloudTexture();
      for (let i = 0; i < 5; i++) {
        const spr = new T.Sprite(new T.SpriteMaterial({ map: mistTex, color: 0xbfe9ff, transparent: true, opacity: 0.1, depthWrite: false }));
        spr.position.set((i - 2) * 1.8, -10.5 - Math.random() * 2, 0.8);
        spr.scale.set(7 + Math.random() * 4, 3 + Math.random() * 2, 1);
        g.add(spr);
      }
      this.waterfallGroup = g;
    }

    createTree(x, z, scale, color) {
      const g = new T.Group();
      g.position.set(x, 0, z);
      g.scale.setScalar(scale);
      this.root.add(g);
      const trunkMat = toon('#4a3038', { emissive: '#2b1222', emissiveIntensity: 0.1 });
      const trunkPts = [[0, 0, 0], [0.1, 1.5, 0.08], [-0.1, 3.1, -0.05], [0.25, 4.6, 0.1]];
      const trunk = taperedTube(trunkPts, 0.32, 0.11, trunkMat, 14, 7);
      trunk.castShadow = true; g.add(trunk); outline(trunk, 1.03);
      const branches = [
        [[0.02, 2.4, 0], [1.0, 3.2, 0.4], [1.7, 3.7, 0.9]],
        [[-0.04, 2.8, 0], [-1.1, 3.5, 0.2], [-1.8, 3.9, -0.3]],
        [[0.1, 3.4, 0], [0.5, 4.1, -1.0], [0.8, 4.6, -1.7]],
        [[0.0, 3.1, 0], [-0.4, 4.0, 1.0], [-0.7, 4.4, 1.6]]
      ];
      branches.forEach(b => {
        const br = taperedTube(b, 0.11, 0.02, trunkMat, 10, 5);
        br.castShadow = true; g.add(br);
      });
      const palette = [color, '#ffb8d3', '#e978a7', '#ffcfe0', '#d9689a'];
      const foliage = [];
      const blobs = [
        [1.55, 4.25, 0.8, 1.15], [-1.7, 4.3, -0.2, 1.3], [0.65, 4.85, -1.5, 1.05],
        [-0.6, 4.7, 1.45, 1.2], [0.1, 5.2, 0.2, 1.45], [2.4, 4.0, -0.6, 0.8],
        [-2.5, 4.0, 1.0, 0.85], [1.2, 4.6, 1.6, 0.9], [-1.2, 4.9, -1.4, 0.85]
      ];
      blobs.forEach((b, i) => {
        const m = new T.Mesh(new T.IcosahedronGeometry(b[3], 1), toon(palette[i % palette.length], {
          emissive: palette[i % palette.length], emissiveIntensity: 0.05
        }));
        m.position.set(b[0], b[1], b[2]);
        m.scale.set(1.1, 0.85, 1.0);
        m.castShadow = true;
        m.receiveShadow = true;
        g.add(m);
        foliage.push(m);
      });
      const light = new T.PointLight(0xffa8d0, 1.7, 12, 2);
      light.position.set(0, 4, 0);
      g.add(light);
      this.trees.push({ group: g, foliage, phase: WORLD_RNG() * 6 });
      return g;
    }

    createCrystalCluster(x, z, color, scale) {
      const g = new T.Group();
      g.position.set(x, 0, z);
      g.scale.setScalar(scale);
      this.root.add(g);
      const mat = new T.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.85, roughness: 0.18, metalness: 0.25, transparent: true, opacity: 0.92 });
      const glowMat = glow(color, 0.18);
      for (let i = 0; i < 6; i++) {
        const h = 0.6 + WORLD_RNG() * 1.8;
        const c = add(g, new T.OctahedronGeometry(0.16 + WORLD_RNG() * 0.25, 0), mat, (WORLD_RNG() - 0.5) * 1.3, h * 0.5, (WORLD_RNG() - 0.5) * 1.3);
        c.scale.y = h / 0.5;
        c.rotation.z = (WORLD_RNG() - 0.5) * 0.5;
        c.rotation.x = (WORLD_RNG() - 0.5) * 0.5;
        c.castShadow = true;
        const halo = add(g, new T.OctahedronGeometry(0.5, 0), glowMat, c.position.x, c.position.y, c.position.z);
        halo.scale.copy(c.scale).multiplyScalar(1.3);
      }
      const base = add(g, new T.DodecahedronGeometry(0.9, 0), pbr('#3b3146', { roughness: 1 }), 0, 0.1, 0);
      base.scale.y = 0.35;
      const light = new T.PointLight(color, 3.0, 9, 2);
      light.position.y = 1.2;
      g.add(light);
      this.crystals.push({ group: g, phase: WORLD_RNG() * 6, light });
    }

    createRuins(x, z) {
      const g = new T.Group();
      g.position.set(x, 0, z);
      this.root.add(g);
      const mat = pbr('#6a5b70', { roughness: 0.95, metalness: 0.05 });
      const col1 = add(g, new T.CylinderGeometry(0.38, 0.46, 2.8, 9), mat, 0, 1.4, 0);
      col1.castShadow = true; outline(col1, 1.02);
      const top1 = add(g, new T.CylinderGeometry(0.52, 0.46, 0.22, 9), mat, 0, 2.85, 0);
      const col2 = add(g, new T.CylinderGeometry(0.34, 0.42, 1.7, 9), mat, 1.7, 0.85, 0.4);
      col2.rotation.z = 0.2;
      col2.castShadow = true; outline(col2, 1.02);
      const lintel = add(g, new T.BoxGeometry(2.5, 0.3, 0.55), mat, 0.6, 2.7, 0.2);
      lintel.rotation.z = -0.06;
      lintel.castShadow = true; outline(lintel, 1.02);
      const cap = add(g, new T.ConeGeometry(0.55, 0.45, 4), toon('#8a778a'), 0.6, 3.05, 0.2);
      cap.rotation.y = 0.4;
      for (let i = 0; i < 6; i++) {
        const r = add(g, new T.DodecahedronGeometry(0.15 + WORLD_RNG() * 0.2, 0), mat, (WORLD_RNG() - 0.5) * 3, 0.1, (WORLD_RNG() - 0.5) * 2);
        r.rotation.set(WORLD_RNG() * 3, WORLD_RNG() * 3, 0);
      }
      // vine
      const vine = taperedTube([[0.2, 0, 0.3], [0.1, 1.0, 0.4], [-0.2, 2.0, 0.3], [0.2, 2.6, 0.2]], 0.04, 0.01, toon('#5c7756'), 10, 4);
      g.add(vine);
      g.rotation.y = WORLD_RNG() * 6;
    }

    createLantern(pos, i) {
      const g = new T.Group();
      g.position.copy(pos);
      this.root.add(g);
      const pole = add(g, new T.CylinderGeometry(0.035, 0.06, 2.3, 6), pbr('#4b3b57', { metalness: 0.4, roughness: 0.6 }), 0, 1.15, 0);
      pole.castShadow = true;
      const arm = add(g, new T.BoxGeometry(0.55, 0.05, 0.05), pbr('#6b5264', { metalness: 0.4, roughness: 0.6 }), 0.22, 2.28, 0);
      const cage = new T.Group();
      cage.position.set(0.45, 2.05, 0);
      g.add(cage);
      const cageMat = toon('#3c2a4b');
      for (let k = 0; k < 4; k++) {
        const a = k / 4 * Math.PI * 2;
        const bar = add(cage, new T.CylinderGeometry(0.012, 0.012, 0.45, 4), cageMat, Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14);
      }
      const top = add(cage, new T.ConeGeometry(0.22, 0.18, 4), cageMat, 0, 0.28, 0);
      const orb = add(cage, new T.OctahedronGeometry(0.14, 0), new T.MeshBasicMaterial({ color: i % 2 ? '#9cefff' : '#ffd99a' }), 0, 0, 0);
      const halo = new T.Sprite(new T.SpriteMaterial({ map: A.STAR_TEX, color: i % 2 ? 0x9cefff : 0xffd99a, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false }));
      halo.scale.set(1.7, 1.7, 1);
      cage.add(halo);
      const light = new T.PointLight(i % 2 ? 0x8ce6ff : 0xffcf7a, i % 2 ? 2 : 3, 9, 2);
      light.position.copy(cage.position);
      g.add(light);
      this.lanterns.push({ group: g, orb, halo, light, phase: WORLD_RNG() * 6 });
    }

    buildSpawn() {
      const s = this.samplePathAt(0);
      const g = new T.Group();
      g.position.copy(s.pos).setY(0.05);
      g.rotation.y = Math.atan2(s.tangent.x, s.tangent.z);
      this.root.add(g);
      this.portal = g;
      // base rock
      const base = add(g, new T.CylinderGeometry(3.1, 3.6, 0.8, 12), pbr('#3d2f45', { roughness: 1 }), 0, 0.2, 0);
      base.receiveShadow = true;
      // arch pillars
      const stone = pbr('#4a3a55', { roughness: 0.9, metalness: 0.08 });
      [-1, 1].forEach(side => {
        const pil = add(g, new T.CylinderGeometry(0.34, 0.52, 3.6, 7), stone, side * 2.0, 2.1, 0);
        pil.castShadow = true; outline(pil, 1.02);
        const cap = add(g, new T.DodecahedronGeometry(0.55, 0), stone, side * 2.0, 3.95, 0);
        cap.scale.set(1, 0.65, 1);
        const spike = add(g, new T.ConeGeometry(0.2, 1.4, 5), toon('#35253f'), side * 2.05, 4.6, 0);
        spike.rotation.z = side * 0.12;
        const rune = add(g, new T.BoxGeometry(0.1, 1.2, 0.06), new T.MeshBasicMaterial({ color: '#ff72b5' }), side * 1.75, 2.2, 0.26);
      });
      const lintel = add(g, new T.BoxGeometry(4.7, 0.55, 0.8), stone, 0, 3.95, 0);
      lintel.castShadow = true; outline(lintel, 1.02);
      // portal disc
      const portalMat = new T.ShaderMaterial({
        transparent: true, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `
          varying vec2 vUv; uniform float uTime;
          float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
          void main(){
            vec2 uv=vUv*2.0-1.0; float r=length(uv); float a=atan(uv.y,uv.x);
            float swirl=sin(a*7.0+r*12.0-uTime*2.2)*0.5+0.5;
            float ring=smoothstep(0.75,0.95,r)*smoothstep(1.0,0.94,r);
            float core=smoothstep(0.8,0.0,r);
            vec3 col=mix(vec3(0.22,0.02,0.2),vec3(0.9,0.14,0.5),swirl);
            col+=vec3(0.5,0.1,0.8)*core*0.8;
            float alpha=(core*0.5+ring*0.7)*(0.35+swirl*0.5);
            gl_FragColor=vec4(col,alpha);
          }`
      });
      this.portalMat = portalMat;
      const disc = new T.Mesh(new T.CircleGeometry(1.85, 48), portalMat);
      disc.position.set(0, 2.1, 0.05);
      g.add(disc);
      const ring = add(g, new T.TorusGeometry(1.9, 0.05, 5, 48), glow('#ff62b0', 0.55), 0, 2.1, 0.06);
      // tendrils
      for (let i = 0; i < 4; i++) {
        const tnd = taperedTube([[-1.5 + i * 0.9, 0.4, 0.1], [-2 + i * 1.1, 1.2, 1.1], [-1.8 + i * 1.2, 1.7, 1.8]], 0.12, 0.01, toon('#261530'), 8, 4);
        g.add(tnd);
      }
      const light = new T.PointLight(0xff4fa8, 5, 16, 2);
      light.position.set(0, 2.4, 1.2);
      g.add(light);
    }

    buildCore() {
      const end = this.pathEnd();
      const g = new T.Group();
      g.position.copy(end).setY(0.05);
      this.root.add(g);
      this.coreGroup = g;
      const stone = pbr('#53445f', { roughness: 0.8, metalness: 0.15 });
      const base = add(g, new T.CylinderGeometry(2.3, 2.6, 0.35, 12), stone, 0, 0.18, 0);
      base.receiveShadow = true;
      const step = add(g, new T.CylinderGeometry(1.7, 2.05, 0.3, 12), stone, 0, 0.48, 0);
      const rune = A.makeRunePlane(5.0, '#ffd99a', 0.4);
      rune.rotation.x = -Math.PI / 2;
      rune.position.y = 0.41;
      g.add(rune);
      this.coreRune = rune;
      // pillars
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        if (Math.cos(a) > 0.3 && Math.sin(a) > 0.3) continue;
        const pil = add(g, new T.CylinderGeometry(0.16, 0.22, 1.5, 6), stone, Math.cos(a) * 2.0, 1.1, Math.sin(a) * 2.0);
        pil.castShadow = true;
        const cap = add(g, new T.OctahedronGeometry(0.14, 0), toon('#c7a966', { emissive: '#6a4314', emissiveIntensity: 0.4 }), Math.cos(a) * 2.0, 1.9, Math.sin(a) * 2.0);
      }
      // core crystal
      const crystalMat = new T.MeshStandardMaterial({
        color: '#ffe3a3', emissive: '#c47a1e', emissiveIntensity: 0.42,
        roughness: 0.16, metalness: 0.34, flatShading: true
      });
      const crystal = add(g, new T.OctahedronGeometry(0.92, 0), crystalMat, 0, 2.42, 0);
      crystal.scale.set(0.9, 2.0, 0.9);
      crystal.castShadow = true;
      crystal.rotation.y = 0.35;
      this.coreCrystal = crystal;
      const edges = new T.LineSegments(new T.EdgesGeometry(crystal.geometry), new T.LineBasicMaterial({ color: '#ffe7ae', transparent: true, opacity: 0.9 }));
      edges.scale.copy(crystal.scale).multiplyScalar(1.005);
      edges.position.copy(crystal.position);
      edges.rotation.copy(crystal.rotation);
      g.add(edges);
      this.coreEdges = edges;
      const inner = add(g, new T.OctahedronGeometry(0.34, 0), new T.MeshBasicMaterial({ color: '#fffbe8' }), 0, 2.55, 0);
      inner.scale.set(1, 2.2, 1);
      this.coreInner = inner;
      const glowCrystal = add(g, new T.OctahedronGeometry(1.0, 0), glow('#ffd781', 0.08), 0, 2.42, 0);
      glowCrystal.scale.set(0.95, 2.1, 0.95);
      this.coreGlow = glowCrystal;
      // inner shards
      const shards = [];
      for (let i = 0; i < 8; i++) {
        const sh = add(g, new T.OctahedronGeometry(0.12, 0), new T.MeshBasicMaterial({ color: '#fff4cd' }), 0, 2.4, 0);
        sh.userData.a = i / 8 * Math.PI * 2;
        shards.push(sh);
      }
      this.coreShards = shards;
      // rings
      const rings = [];
      [1.7, 2.2, 2.7].forEach((r, i) => {
        const ring = add(g, new T.TorusGeometry(r, 0.018, 4, 64), new T.MeshBasicMaterial({ color: i === 1 ? '#9cefff' : '#ffd88a', transparent: true, opacity: 0.55 }), 0, 2.4, 0);
        ring.rotation.set(WORLD_RNG() * 3, WORLD_RNG() * 3, WORLD_RNG() * 3);
        ring.userData.speed = (i % 2 ? -1 : 1) * (0.12 + i * 0.05);
        rings.push(ring);
      });
      this.coreRings = rings;
      // pedestal light beam
      const beam = add(g, new T.CylinderGeometry(0.18, 0.42, 18, 24, 1, true), new T.MeshBasicMaterial({
        color: '#ffe5a8', transparent: true, opacity: 0.014, blending: T.AdditiveBlending,
        depthWrite: false, side: T.DoubleSide
      }), 0, 11, 0);
      this.coreBeam = beam;
      // shield
      this.shieldMat = new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.FrontSide,
        uniforms: { uColor: { value: new T.Color('#ffe3a3') }, uTime: { value: 0 } },
        vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `varying vec3 vN; varying vec3 vV; uniform vec3 uColor; uniform float uTime;
          void main(){ float f=pow(1.0-abs(dot(vN,vV)),2.6); float a=f*0.16+0.008; gl_FragColor=vec4(uColor*1.4,a); }`
      });
      const shield = new T.Mesh(new T.SphereGeometry(2.75, 32, 24), this.shieldMat);
      shield.position.y = 2.2;
      shield.visible = false;
      this.shield = shield;
      const light = new T.PointLight(0xffd48a, 3.6, 16, 2);
      light.position.set(0, 2.8, 0);
      g.add(light);
      this.coreLight = light;
      // ground glow sprite
      const spr = new T.Sprite(new T.SpriteMaterial({ map: A.STAR_TEX, color: 0xffd58a, transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false }));
      spr.scale.set(2.2, 2.2, 1);
      spr.position.y = 1.2;
      g.add(spr);
      this.coreHalo = spr;
    }

    buildMotes() {
      const n = 420;
      const geo = new T.BufferGeometry();
      const pos = new Float32Array(n * 3);
      this.moteBase = [];
      for (let i = 0; i < n; i++) {
        const a = WORLD_RNG() * Math.PI * 2;
        const r = 3 + WORLD_RNG() * 21;
        const y = 0.4 + WORLD_RNG() * 10;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        this.moteBase.push({ x, y, z, p: WORLD_RNG() * 6, s: 0.3 + WORLD_RNG() * 0.7 });
      }
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const mat = new T.PointsMaterial({
        map: A.STAR_TEX, color: 0xffe5b3, size: 0.28, transparent: true, opacity: 0.56,
        blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true
      });
      this.motes = new T.Points(geo, mat);
      this.motes.frustumCulled = false;
      this.root.add(this.motes);
      this.moteGeo = geo;

      // petals
      const pn = 220;
      const pg = new T.BufferGeometry();
      const pp = new Float32Array(pn * 3);
      this.petalBase = [];
      for (let i = 0; i < pn; i++) {
        const a = WORLD_RNG() * Math.PI * 2, r = WORLD_RNG() * 9;
        const x = -14.2 + Math.cos(a) * r, z = 9.6 + Math.sin(a) * r, y = 1 + WORLD_RNG() * 8;
        pp[i * 3] = x; pp[i * 3 + 1] = y; pp[i * 3 + 2] = z;
        this.petalBase.push({ x, y, z, speed: 0.2 + WORLD_RNG() * 0.55, p: WORLD_RNG() * 6 });
      }
      pg.setAttribute('position', new T.BufferAttribute(pp, 3));
      const petalTex = makePetalTexture();
      const pm = new T.PointsMaterial({
        map: petalTex, color: 0xffb9d6, size: 0.3, transparent: true, opacity: 0.75,
        depthWrite: false, sizeAttenuation: true, alphaTest: 0.02
      });
      this.petals = new T.Points(pg, pm);
      this.petals.frustumCulled = false;
      this.root.add(this.petals);
      this.petalGeo = pg;
    }

    buildClouds() {
      const cloudTex = makeCloudTexture();
      for (let i = 0; i < 20; i++) {
        const mat = new T.SpriteMaterial({
          map: cloudTex, color: i % 5 === 0 ? 0xffddd0 : 0xcfd2ea, transparent: true,
          opacity: 0.045 + WORLD_RNG() * 0.075, depthWrite: false
        });
        const spr = new T.Sprite(mat);
        const a = WORLD_RNG() * Math.PI * 2;
        const r = 16 + WORLD_RNG() * 70;
        spr.position.set(Math.cos(a) * r, -8 - WORLD_RNG() * 12, Math.sin(a) * r);
        const s = 16 + WORLD_RNG() * 34;
        spr.scale.set(s, s * (0.38 + WORLD_RNG() * 0.2), 1);
        spr.userData.drift = 0.15 + WORLD_RNG() * 0.35;
        spr.userData.phase = WORLD_RNG() * 6;
        spr.userData.baseY = spr.position.y;
        this.root.add(spr);
        this.clouds.push(spr);
      }
      // cloud sea plane
      const plane = new T.Mesh(new T.CircleGeometry(120, 64), new T.MeshBasicMaterial({
        color: 0xb9afd2, transparent: true, opacity: 0.1, depthWrite: false
      }));
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -17;
      this.root.add(plane);
    }

    buildMenuStage() {
      const g = new T.Group();
      g.position.set(9.8, 0, 26.5);
      this.root.add(g);
      this.menuGroup = g;
      const rockMap = makeRockTexture();
      const side = new T.Mesh(new T.CylinderGeometry(5.15, 3.0, 2.0, 12, 4, true), new T.MeshStandardMaterial({ map: rockMap, roughness: 1 }));
      side.position.y = -1.1;
      g.add(side);
      const top = new T.Mesh(new T.CylinderGeometry(5.15, 5.15, 0.35, 32), pbr('#3a5045', { roughness: 0.95 }));
      top.position.y = 0.08;
      top.receiveShadow = true;
      g.add(top);
      const underside = new T.Mesh(new T.ConeGeometry(3.0, 4.6, 14), pbr('#2f2539', { roughness: 1 }));
      underside.position.y = -4.6;
      underside.rotation.z = Math.PI;
      g.add(underside);
      // platform ring
      const ring = new T.Mesh(new T.TorusGeometry(5.05, 0.05, 4, 100), glow('#f3d99b', 0.4));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.28;
      g.add(ring);
      this.stageRing = ring;
      // back arc
      const arc = new T.Mesh(new T.TorusGeometry(4.35, 0.03, 4, 100, Math.PI * 1.15), glow('#9cefff', 0.26));
      arc.position.set(0, 3.6, -2.4);
      arc.rotation.z = Math.PI * 0.42;
      g.add(arc);
      this.stageArc = arc;
      // plinths
      this.plinthPositions = [];
      [-4.7, -2.35, 0, 2.35, 4.7].forEach((x, i) => {
        const plinth = new T.Group();
        plinth.position.set(x, 0.25, i === 1 ? 0.2 : 0);
        g.add(plinth);
        const base = add(plinth, new T.CylinderGeometry(0.78, 0.92, 0.38, 8), pbr('#544563', { roughness: 0.65, metalness: 0.2 }), 0, 0.19, 0);
        base.castShadow = true;
        const trim = add(plinth, new T.TorusGeometry(0.78, 0.025, 4, 8), toon('#d6b06a', { emissive: '#634015', emissiveIntensity: 0.5 }), 0, 0.39, 0);
        trim.rotation.x = Math.PI / 2;
        const rune = A.makeRunePlane(1.75, i === 0 ? '#ffd27d' : i === 1 ? '#9cefff' : '#ff9fce', 0.24);
        rune.rotation.x = -Math.PI / 2;
        rune.position.y = 0.42;
        plinth.add(rune);
        this.plinthPositions.push(new T.Vector3(9.8 + x, 0.62, 26.5 + (i === 1 ? 0.2 : 0)));
      });
      const stageRune = A.makeRunePlane(8.2, '#f0d28d', 0.16);
      stageRune.rotation.x = -Math.PI / 2;
      stageRune.position.y = 0.3;
      g.add(stageRune);
      this.stageRune = stageRune;
      const innerRune = A.makeRunePlane(5.4, '#9cefff', 0.1);
      innerRune.rotation.x = -Math.PI / 2;
      innerRune.position.y = 0.305;
      g.add(innerRune);
      this.innerRune = innerRune;
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2;
        const r = 4.55;
        const sh = add(g, new T.OctahedronGeometry(0.045 + WORLD_RNG() * 0.04, 0), new T.MeshBasicMaterial({ color: i % 2 ? '#9cefff' : '#ffd99a' }), Math.cos(a) * r, 0.42, Math.sin(a) * r);
        sh.scale.y = 1.7;
      }
      // stage decor crystals
      [-3.9, 4.0].forEach((x, i) => {
        const c = add(g, new T.OctahedronGeometry(0.2, 0), new T.MeshBasicMaterial({ color: i ? '#ffb3d4' : '#a8efff' }), x, 0.8, -1.4);
        c.scale.y = 2.2;
        const halo = add(g, new T.OctahedronGeometry(0.35, 0), glow(i ? '#ff9fce' : '#9cefff', 0.2), x, 0.8, -1.4);
        halo.scale.y = 2.2;
      });
      const light = new T.PointLight(0xffd7a0, 3.2, 15, 2);
      light.position.set(0, 5, 1);
      g.add(light);
    }

    showMenu(show) {
      if (this.menuGroup) this.menuGroup.visible = show;
    }

    setTheme(theme) {
      this.theme = theme || {};
      if (this.scene && this.scene.fog && theme && theme.fog) this.scene.fog.color.set(theme.fog);
      if (this.groundMat && theme && theme.ground) this.groundMat.color.set(theme.ground);
      if (this.pathMat && theme && theme.path) {
        if (!this.pathMat.uniforms.uTint) this.pathMat.uniforms.uTint = { value: new T.Color('#ffffff') };
        this.pathMat.uniforms.uTint.value.set(theme.path);
      }
    }

    setCoreHealth(frac) {
      this.coreHealth = Math.max(0, Math.min(1, frac));
      const em = 0.18 + this.coreHealth * 0.4;
      if (this.coreCrystal) {
        this.coreCrystal.material.emissiveIntensity = em;
        this.coreCrystal.material.color.set(frac < 0.35 ? '#ffc0c8' : '#ffe3a3');
      }
      if (this.shieldMat) {
        this.shieldMat.uniforms.uColor.value.set(frac < 0.35 ? '#ff728c' : '#ffe3a3');
      }
      if (this.coreLight) this.coreLight.intensity = 2.2 + this.coreHealth * 2.8;
      if (this.coreBeam) this.coreBeam.material.opacity = 0.02 + this.coreHealth * 0.04;
    }

    update(dt, t) {
      this.time = t;
      if (this.skyMat) this.skyMat.uniforms.uTime.value = t;
      if (this.pathMat) this.pathMat.uniforms.uTime.value = t;
      if (this.portalMat) this.portalMat.uniforms.uTime.value = t;
      if (this.shieldMat) this.shieldMat.uniforms.uTime.value = t;
      // pads
      this.pads.forEach(p => {
        p.rune.rotation.z += dt * 0.18;
        p.rune2.rotation.z -= dt * 0.12;
        const pulse = 0.5 + Math.sin(t * 2 + p.pulse) * 0.5;
        if (p.state === 'available') p.rune.material.opacity = 0.4 + pulse * 0.3;
        else if (p.state === 'idle') p.rune.material.opacity = 0.16 + pulse * 0.07;
        else if (p.state === 'merge') p.rune.material.opacity = 0.55 + pulse * 0.3;
        else if (p.state === 'occupied') p.rune.material.opacity = 0.15;
        p.shards.forEach((s, i) => {
          const a = t * 0.7 + s.userData.phase;
          s.position.set(Math.cos(a) * 1.2, 0.3 + Math.sin(t * 1.5 + i) * 0.07, Math.sin(a) * 1.2);
          s.rotation.y += dt * 1.2;
        });
      });
      if (this.waterfallMat) this.waterfallMat.uniforms.uTime.value = t;
      if (this.waterfallParticles) {
        const arr = this.waterfallGeo.attributes.position.array;
        for (let i = 0; i < this.waterfallBase.length; i++) {
          const b = this.waterfallBase[i];
          let y = b.y - ((t * b.s) % 13);
          if (y < -13) y += 13;
          arr[i * 3] = b.x + Math.sin(t * 1.1 + b.p) * 0.25;
          arr[i * 3 + 1] = y;
          arr[i * 3 + 2] = b.z + Math.cos(t * 0.9 + b.p) * 0.12;
        }
        this.waterfallGeo.attributes.position.needsUpdate = true;
      }
      // trees sway
      this.trees.forEach(tr => {
        tr.group.rotation.z = Math.sin(t * 0.5 + tr.phase) * 0.005;
        tr.foliage.forEach((f, i) => {
          f.position.y += Math.sin(t * 1.2 + i + tr.phase) * 0.0004;
        });
      });
      // lanterns
      this.lanterns.forEach(l => {
        const p = 0.7 + Math.sin(t * 2 + l.phase) * 0.3;
        l.light.intensity = (l.light.color.getHex() === 0x8ce6ff ? 2 : 3) * p;
        l.halo.material.opacity = 0.35 + p * 0.25;
        l.halo.scale.setScalar(1.4 + p * 0.4);
        l.orb.rotation.y += dt * 0.7;
      });
      // crystals
      this.crystals.forEach(c => {
        c.light.intensity = (2 + Math.sin(t * 2.1 + c.phase) * 1.1);
        c.group.rotation.y += dt * 0.05;
      });
      // portal pulse
      if (this.portal) {
        const sc = 1 + Math.sin(t * 2.2) * 0.02;
        this.portal.children.forEach(c => { if (c.geometry && c.geometry.type === 'CircleGeometry') c.scale.setScalar(sc); });
      }
      // core
      if (this.coreCrystal) {
        this.coreCrystal.rotation.y += dt * 0.25;
        this.coreCrystal.position.y = 2.42 + Math.sin(t * 1.4) * 0.09;
        this.coreGlow.position.y = this.coreCrystal.position.y;
        if (this.coreEdges) { this.coreEdges.position.y = this.coreCrystal.position.y; this.coreEdges.rotation.y = this.coreCrystal.rotation.y; }
        if (this.coreInner) { this.coreInner.position.y = this.coreCrystal.position.y + 0.1; this.coreInner.rotation.y -= dt * 0.5; }
        this.coreGlow.rotation.y -= dt * 0.18;
        this.coreGlow.scale.setScalar(1 + Math.sin(t * 2.1) * 0.03);
      }
      this.coreShards.forEach((s, i) => {
        const a = t * 0.5 + s.userData.a;
        s.position.set(Math.cos(a) * 1.55, 2.4 + Math.sin(t * 1.3 + i) * 0.3, Math.sin(a) * 1.55);
        s.rotation.y += dt * 1.4;
      });
      this.coreRings.forEach(r => {
        r.rotation.x += dt * r.userData.speed;
        r.rotation.y += dt * r.userData.speed * 0.7;
      });
      if (this.coreRune) this.coreRune.rotation.z += dt * 0.1;
      if (this.coreHalo) this.coreHalo.material.opacity = 0.4 + Math.sin(t * 2) * 0.12;
      // motes
      if (this.motes) {
        const arr = this.moteGeo.attributes.position.array;
        for (let i = 0; i < this.moteBase.length; i++) {
          const b = this.moteBase[i];
          arr[i * 3] = b.x + Math.sin(t * 0.18 * b.s + b.p) * 1.2;
          arr[i * 3 + 1] = b.y + Math.sin(t * 0.24 * b.s + b.p * 2) * 0.9;
          arr[i * 3 + 2] = b.z + Math.cos(t * 0.15 * b.s + b.p) * 1.2;
        }
        this.moteGeo.attributes.position.needsUpdate = true;
      }
      // petals
      if (this.petals) {
        const arr = this.petalGeo.attributes.position.array;
        for (let i = 0; i < this.petalBase.length; i++) {
          const b = this.petalBase[i];
          let y = b.y - ((t * b.speed) % 9);
          if (y < 0.2) y += 9;
          arr[i * 3] = b.x + Math.sin(t * 0.6 + b.p) * 1.1;
          arr[i * 3 + 1] = y;
          arr[i * 3 + 2] = b.z + Math.cos(t * 0.5 + b.p) * 1.1;
        }
        this.petalGeo.attributes.position.needsUpdate = true;
      }
      // clouds
      this.clouds.forEach(c => {
        c.position.x += dt * c.userData.drift * 0.25;
        if (c.position.x > 95) c.position.x = -95;
        c.position.y = c.userData.baseY + Math.sin(t * 0.12 + c.userData.phase) * 0.6;
      });
      // floating rocks
      this.floatRocks.forEach(r => {
        r.position.y = r.userData.baseY + Math.sin(t * 0.6 + r.userData.phase) * 0.35;
        r.rotation.y += dt * r.userData.rotSpeed;
      });
      // menu stage
      if (this.menuGroup && this.menuGroup.visible) {
        this.stageRing.rotation.z += dt * 0.08;
        this.stageArc.rotation.z += dt * 0.03;
        if (this.stageRune) this.stageRune.rotation.z += dt * 0.035;
        if (this.innerRune) this.innerRune.rotation.z -= dt * 0.05;
      }
    }
  }

  window.AstralWorld = World;
})();


