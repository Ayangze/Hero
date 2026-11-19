/* =========================================================
   星陨战线 · DATA
   ========================================================= */
(function () {
  'use strict';

  const TOWERS = {
    archer: {
      id: 'archer',
      name: '星弦 · 艾莉娅',
      short: '星弦',
      title: '逐星游侠',
      en: 'ARIA · STARLIGHT RANGER',
      role: '远程 · 单体',
      cost: 70,
      color: '#ffd27d',
      color2: '#ff9d58',
      glow: 'rgba(255,190,90,.22)',
      hair: '#4b4670',
      hairDark: '#25223c',
      hairLight: '#a39ad6',
      eye: '#ff7042',
      outfit: '#f3eeff',
      outfit2: '#3f3560',
      accent: '#ffd06b',
      skin: '#ffe2d1',
      element: '星',
      desc: '以星弓连射，优先狙击最接近星核的敌人。',
      quote: '「只要箭尖仍指向群星，我就不会停下。」',
      base: {
        damage: 13, range: 7.0, interval: 0.62, speed: 25,
        splash: 0, slowFactor: 0, slowDuration: 0, maxTargets: 1,
        critChance: 0.05, critMult: 1.6, armorPen: 0,
        bounty: 0, multishot: 0, pierce: 0, chain: 0, chainCount: 0,
        executeThreshold: 0, executeBonus: 0, bleedDps: 0, bleedDuration: 0,
        freezeChance: 0, freezeDuration: 0, novaRatio: 0, novaRadius: 0,
        auraSlow: 0, echoEvery: 0, echoMult: 0, volleyEvery: 0, volleyCount: 0,
        shadowEvery: 0, shadowMult: 0
      }
    },
    mage: {
      id: 'mage',
      name: '霜语 · 瑟琳',
      short: '霜语',
      title: '极光术士',
      en: 'SERENE · AURORA MAGE',
      role: '范围 · 减速',
      cost: 90,
      color: '#9cefff',
      color2: '#69a8ff',
      glow: 'rgba(110,220,255,.2)',
      hair: '#e9f8ff',
      hairDark: '#92bdd6',
      hairLight: '#ffffff',
      eye: '#ff7a6b',
      outfit: '#eef9ff',
      outfit2: '#5f9fc4',
      accent: '#ff6f6f',
      skin: '#dff4ff',
      element: '霜',
      desc: '降下霜星，造成范围伤害并延缓敌人的脚步。',
      quote: '「让寒冬，替星核守住寂静。」',
      base: {
        damage: 24, range: 6.0, interval: 1.32, speed: 16,
        splash: 1.9, slowFactor: 0.34, slowDuration: 1.4, maxTargets: 1,
        critChance: 0.05, critMult: 1.6, armorPen: 0,
        bounty: 0, multishot: 0, pierce: 0, chain: 0, chainCount: 0,
        executeThreshold: 0, executeBonus: 0, bleedDps: 0, bleedDuration: 0,
        freezeChance: 0, freezeDuration: 0, novaRatio: 0, novaRadius: 0,
        auraSlow: 0, echoEvery: 0, echoMult: 0, volleyEvery: 0, volleyCount: 0,
        shadowEvery: 0, shadowMult: 0
      }
    },
    blade: {
      id: 'blade',
      name: '月刃 · 绯月',
      short: '月刃',
      title: '月下剑舞',
      en: 'HIYUKI · MOONBLADE',
      role: '近战 · 多目标',
      cost: 100,
      color: '#ff9fce',
      color2: '#c86bff',
      glow: 'rgba(255,130,200,.2)',
      hair: '#f7a7ce',
      hairDark: '#a34e7d',
      hairLight: '#ffd7e8',
      eye: '#d5ef68',
      outfit: '#f5e5cc',
      outfit2: '#d79a46',
      accent: '#5fd7c7',
      skin: '#ffe1cf',
      element: '月',
      desc: '以月刃斩击射程内多个敌人，并留下血月印记。',
      quote: '「月下的舞台，只容许我一人起舞。」',
      base: {
        damage: 9.5, range: 4.5, interval: 0.36, speed: 0,
        splash: 0, slowFactor: 0, slowDuration: 0, maxTargets: 2,
        critChance: 0.08, critMult: 1.7, armorPen: 0,
        bounty: 0, multishot: 0, pierce: 0, chain: 0, chainCount: 0,
        executeThreshold: 0, executeBonus: 0, bleedDps: 0, bleedDuration: 0,
        freezeChance: 0, freezeDuration: 0, novaRatio: 0, novaRadius: 0,
        auraSlow: 0, echoEvery: 0, echoMult: 0, volleyEvery: 0, volleyCount: 0,
        shadowEvery: 0, shadowMult: 0
      }
    },
    kirin: {
      id: 'kirin',
      name: '焰麟 · 烬',
      short: '焰麟',
      title: '焚风守望',
      en: 'KIRIN · EMBER',
      role: '灵兽 · 范围灼烧',
      cost: 85,
      color: '#ff9a52',
      color2: '#ff5d4a',
      glow: 'rgba(255,140,70,.24)',
      hair: '#ffb15c', hairDark: '#9d3d25', hairLight: '#ffe0a0',
      eye: '#fff0bd', outfit: '#ffd08a', outfit2: '#9d3d2d', accent: '#ff6a3d',
      skin: '#ffd2a1', element: '火',
      desc: '召唤焰麟吐息，对一片区域造成火焰伤害并留下灼烧。',
      quote: '「火会记得每一个被守住的名字。」',
      model: 'kirin',
      base: {
        damage: 26, range: 5.4, interval: 1.28, speed: 15,
        splash: 1.6, slowFactor: 0, slowDuration: 0, maxTargets: 1,
        critChance: 0.06, critMult: 1.7, armorPen: 2,
        bounty: 0, multishot: 0, pierce: 0, chain: 0, chainCount: 0,
        executeThreshold: 0, executeBonus: 0, bleedDps: 5, bleedDuration: 2,
        freezeChance: 0, freezeDuration: 0, novaRatio: 0, novaRadius: 0,
        auraSlow: 0, echoEvery: 0, echoMult: 0, volleyEvery: 0, volleyCount: 0,
        shadowEvery: 0, shadowMult: 0
      }
    },
    ginseng: {
      id: 'ginseng',
      name: '灵参 · 茸',
      short: '灵参',
      title: '森罗回响',
      en: 'GINSENG · SPROUT',
      role: '灵兽 · 减速控场',
      cost: 75,
      color: '#8be8b0',
      color2: '#46d7c0',
      glow: 'rgba(110,230,160,.2)',
      hair: '#b6f0b0', hairDark: '#347a4d', hairLight: '#e8ffe0',
      eye: '#f5ffd0', outfit: '#d9efb0', outfit2: '#4e9d64', accent: '#6fe0b8',
      skin: '#f3e1b0', element: '木',
      desc: '灵参扎根星路旁，以根须缠绕敌人并减缓其步伐。',
      quote: '「森林不追赶，森林只是等待。」',
      model: 'ginseng',
      base: {
        damage: 8, range: 5.8, interval: 0.92, speed: 12,
        splash: 0.8, slowFactor: 0.3, slowDuration: 1.2, maxTargets: 1,
        critChance: 0.04, critMult: 1.5, armorPen: 0,
        bounty: 0, multishot: 0, pierce: 0, chain: 0, chainCount: 0,
        executeThreshold: 0, executeBonus: 0, bleedDps: 0, bleedDuration: 0,
        freezeChance: 0, freezeDuration: 0, novaRatio: 0, novaRadius: 0,
        auraSlow: 0.22, echoEvery: 0, echoMult: 0, volleyEvery: 0, volleyCount: 0,
        shadowEvery: 0, shadowMult: 0
      }
    }

  };

  const TOWER_ORDER = ['archer', 'mage', 'blade', 'kirin', 'ginseng'];

  const STAGE_INFO = [
    { roman: 'I', name: '灵契', en: 'SPIRIT', form: '灵兽形态' },
    { roman: 'II', name: '少女', en: 'MAIDEN', form: '少女形态' },
    { roman: 'III', name: '觉醒', en: 'AWAKENED', form: '觉醒形态' },
    { roman: 'IV', name: '神降', en: 'DIVINE', form: '神降形态' }
  ];

  const STAGE_ART = {
    archer: [
      'assets/cards/archer-1.png',
      'assets/cards/archer-2.png',
      'assets/cards/archer-3.png',
      'assets/cards/archer-4.png'
    ],
    mage: [
      'assets/cards/mage-1.png',
      'assets/cards/mage-2.png',
      'assets/cards/mage-3.png',
      'assets/cards/mage-4.png'
    ],
    blade: [
      'assets/cards/blade-1.png',
      'assets/cards/blade-2.png',
      'assets/cards/blade-3.png',
      'assets/cards/blade-4.png'
    ],
    kirin: [
      'assets/cards/kirin-1.png',
      'assets/cards/kirin-2.png',
      'assets/cards/kirin-3.png',
      'assets/cards/kirin-4.png'
    ],
    ginseng: [
      'assets/cards/ginseng-1.png',
      'assets/cards/ginseng-2.png',
      'assets/cards/ginseng-3.png',
      'assets/cards/ginseng-4.png'
    ]
  };

  TOWERS.archer.stages = ['白狐灵契', '逐星少女', '月狐觉醒', '星弦神降'];
  TOWERS.mage.stages = ['雪灵初啼', '雪女之姿', '冰华觉醒', '霜语神降'];
  TOWERS.blade.stages = ['凰雏灵契', '火舞少女', '月凰觉醒', '绯月神降'];
  TOWERS.kirin.stages = ['火种幼麟', '焚风灵兽', '赤焰觉醒', '烬火神降'];
  TOWERS.ginseng.stages = ['灵芽初生', '森语灵参', '万根觉醒', '森罗神降'];

  const RARITY = {
    common: { name: '微光', en: 'COMMON', rank: 0, weight: 56, color: '#9fc8e3' },
    rare: { name: '辉耀', en: 'RARE', rank: 1, weight: 31, color: '#bf9dff' },
    epic: { name: '星辉', en: 'EPIC', rank: 2, weight: 13, color: '#ffd27d' }
  };

  const ICONS = {
    wind: '<path d="M5 11h13a5 5 0 1 0-5-5"/><path d="M3 16h18a4 4 0 1 1-4 4"/><path d="M6 21h9"/>',
    flame: '<path d="M16 3c1 6 8 7 8 14a8 8 0 1 1-16 0c0-4 2-6 4-8 0 3 1 4 2 5 1-5 0-8 2-11Z"/><path d="M16 18c0 2-2 3-2 5a3 3 0 0 0 6 0c0-2-2-3-4-5Z"/>',
    ring: '<circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="5"/><path d="M16 2v4M16 26v4M2 16h4M26 16h4"/>',
    coin: '<circle cx="16" cy="16" r="10"/><path d="m16 9 2 4.5 5 .5-3.8 3.4 1.1 5.1-4.3-2.7-4.3 2.7 1.1-5.1L9 14l5-.5Z"/>',
    star: '<path d="m16 3 3.3 9.1 9.7.5-7.6 6 2.6 9.4-8-5.3-8 5.3 2.6-9.4-7.6-6 9.7-.5Z"/>',
    shard: '<path d="m16 2 7 8-3 18-8-8-3-10Z"/><path d="m16 2-4 18M16 2l7 8-11 10"/>',
    eye: '<path d="M2 16s5-8 14-8 14 8 14 8-5 8-14 8S2 16 2 16Z"/><circle cx="16" cy="16" r="4"/><path d="M16 3v3M16 26v3"/>',
    chain: '<rect x="3" y="11" width="12" height="7" rx="3.5" transform="rotate(-30 9 14.5)"/><rect x="17" y="14" width="12" height="7" rx="3.5" transform="rotate(-30 23 17.5)"/><path d="m12 15 3 1"/>',
    crown: '<path d="m4 23 2-14 7 6 3-10 3 10 7-6 2 14Z"/><path d="M6 27h20"/>',
    hourglass: '<path d="M8 3h16M8 29h16M9 3c0 8 7 8 7 13s-7 5-7 13M23 3c0 8-7 8-7 13s7 5 7 13"/><path d="M12 9h8M12 23h8"/>',
    arrow: '<path d="M5 27 27 5M15 5h12v12"/><path d="M9 13 5 27l14-4"/>',
    pierce: '<path d="M3 16h20M17 10l8 6-8 6"/><path d="M7 9v14M12 11v10M17 13v6"/>',
    rain: '<path d="M6 4v14M12 3v18M18 4v14M24 3v18"/><path d="m3 21 3 3 3-3M9 24l3 3 3-3M15 21l3 3 3-3M21 24l3 3 3-3"/>',
    snow: '<path d="M16 3v26M5 9l22 14M27 9 5 23"/><path d="m12 5 4 4 4-4M12 27l4-4 4 4M5 13l5 1-1 5M27 19l-5-1 1-5M5 19l5-1-1-5M27 13l-5 1 1 5"/>',
    nova: '<circle cx="16" cy="16" r="4"/><path d="M16 2v6M16 24v6M2 16h6M24 16h6M6 6l5 5M21 21l5 5M26 6l-5 5M11 21l-5 5"/>',
    ice: '<path d="m16 2 8 7-3 16-5 5-5-5-3-16Z"/><path d="m16 2-2 13-6 5M16 2l4 13 4 5M11 18l5-3 5 3M11 26l5-8 5 8"/>',
    aura: '<circle cx="16" cy="16" r="13" stroke-dasharray="2 4"/><circle cx="16" cy="16" r="8"/><circle cx="16" cy="16" r="2"/>',
    blade: '<path d="M6 26 24 4l-2 11-11 11Z"/><path d="m6 26 6-6M4 22l6 6"/>',
    shadow: '<path d="M16 3c5 0 8 4 8 9 0 6-4 8-4 13l-4 4-4-4c0-5-4-7-4-13 0-5 3-9 8-9Z"/><path d="M11 13h3M18 13h3M13 20c2 1.5 4 1.5 6 0"/>',
    moon: '<path d="M23 4a13 13 0 1 0 5 19A11 11 0 0 1 23 4Z"/><path d="m8 8 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/>',
    drop: '<path d="M16 3s9 9 9 15a9 9 0 0 1-18 0c0-6 9-15 9-15Z"/><path d="M12 19c0 3 2 4 4 4"/>',
    clone: '<path d="M11 4h10l5 5v10H11Z"/><path d="M6 10H4v14l5 5h12v-3"/><path d="M20 4v6h6"/>',
    resonance: '<circle cx="16" cy="16" r="12" stroke-dasharray="1 5"/><circle cx="16" cy="16" r="7"/><path d="M16 4v4M16 24v4M4 16h4M24 16h4"/>',
    bow: '<path d="M8 3c14 4 18 20 8 26M8 3c8 8 8 18 8 26M8 3l8 26"/><path d="M4 16h20"/>',
    storm: '<path d="M8 11a6 6 0 0 1 11-2 5 5 0 0 1 5 5c0 4-3 6-7 6H8a5 5 0 1 1 0-9Z"/><path d="m14 18-3 6h5l-2 5 6-8h-5l2-3Z"/>'
  };

  const MODS = [
    /* ---------------- generic ---------------- */
    { id: 'haste', name: '疾星之步', rarity: 'common', icon: 'wind', types: ['all'], quote: '“先一步抵达，就先一步改写命运。”',
      desc: '攻击速度 <b>+24%</b>', apply: s => { s.interval /= 1.24; } },
    { id: 'power', name: '破晓锋芒', rarity: 'common', icon: 'flame', types: ['all'], quote: '“锋芒不必喧哗，星光自会作证。”',
      desc: '攻击伤害 <b>+26%</b>', apply: s => { s.damage *= 1.26; } },
    { id: 'range', name: '远星之瞳', rarity: 'common', icon: 'ring', types: ['all'], quote: '“看得更远，才能守住更久。”',
      desc: '攻击射程 <b>+18%</b>', apply: s => { s.range *= 1.18; } },
    { id: 'bounty', name: '逐光者', rarity: 'common', icon: 'coin', types: ['all'], quote: '“每一缕坠落的星光，都是远征的盘缠。”',
      desc: '击杀敌人额外获得 <b>+2 星币</b>', apply: s => { s.bounty += 2; } },
    { id: 'crit', name: '命运弧光', rarity: 'rare', icon: 'star', types: ['all'], quote: '“命运偶尔也会偏心。”',
      desc: '暴击率 <b>+18%</b>，暴击伤害 <b>+35%</b>', apply: s => { s.critChance += 0.18; s.critMult += 0.35; } },
    { id: 'armor', name: '碎星之牙', rarity: 'rare', icon: 'shard', types: ['all'], quote: '“再坚硬的甲，也存在一道裂缝。”',
      desc: '无视 <b>8 点</b> 敌人护甲', apply: s => { s.armorPen += 8; } },
    { id: 'execute', name: '终末宣告', rarity: 'rare', icon: 'eye', types: ['all'], quote: '“宣告终末，然后转身。”',
      desc: '对生命低于 <b>35%</b> 的敌人伤害 <b>+40%</b>', apply: s => { s.executeThreshold = Math.max(s.executeThreshold, 0.35); s.executeBonus = Math.max(s.executeBonus, 0.4); } },
    { id: 'chain', name: '连锁星火', rarity: 'epic', icon: 'chain', types: ['all'], quote: '“星火从不孤独。”',
      desc: '攻击命中后，向 <b>2</b> 名附近敌人弹射 <b>45%</b> 伤害', apply: s => { s.chain += 1; s.chainCount += 2; } },
    { id: 'resonance', name: '星之共鸣', rarity: 'epic', icon: 'resonance', types: ['all'], quote: '“我们的星轨，在此刻重叠。”',
      desc: '攻击伤害 <b>+22%</b>，射程 <b>+10%</b>', apply: s => { s.damage *= 1.22; s.range *= 1.1; } },
    { id: 'echo', name: '命运回响', rarity: 'rare', icon: 'hourglass', types: ['all'], quote: '“每一次挥击，都会在时光里留下回声。”',
      desc: '每 <b>6</b> 次攻击，造成 <b>220%</b> 伤害并产生小范围冲击', apply: s => { s.echoEvery = s.echoEvery ? Math.max(4, s.echoEvery - 1) : 6; s.echoMult = Math.max(s.echoMult, 2.2); } },

    /* ---------------- archer ---------------- */
    { id: 'twin', name: '双子流星', rarity: 'rare', icon: 'arrow', types: ['archer'], quote: '“一箭之后，还有一箭。”',
      desc: '每次攻击额外射出 <b>1</b> 支箭，造成 <b>65%</b> 伤害', apply: s => { s.multishot += 1; s.multishotRatio = Math.max(s.multishotRatio || 0, 0.65); } },
    { id: 'pierce', name: '贯星长矢', rarity: 'rare', icon: 'pierce', types: ['archer'], quote: '“星光不会被薄甲阻挡。”',
      desc: '箭矢可贯穿 <b>2</b> 名额外敌人，伤害 <b>+8%</b>', apply: s => { s.pierce += 2; s.damage *= 1.08; } },
    { id: 'rain', name: '银河箭雨', rarity: 'epic', icon: 'rain', types: ['archer'], quote: '“仰望星空的人，终会看见流星落下。”',
      desc: '每 <b>7</b> 次攻击，向射程内 <b>5</b> 名敌人各射出一箭，造成 <b>90%</b> 伤害', apply: s => { s.volleyEvery = 7; s.volleyCount = 5; s.volleyRatio = Math.max(s.volleyRatio || 0, 0.9); } },
    { id: 'apex', name: '天穹之弦', rarity: 'epic', icon: 'bow', types: ['archer'], quote: '“弦动之时，天穹为之静默。”',
      desc: '攻击伤害 <b>+40%</b>，攻击速度 <b>+12%</b>', apply: s => { s.damage *= 1.4; s.interval /= 1.12; } },

    /* ---------------- mage ---------------- */
    { id: 'cold', name: '极寒之触', rarity: 'common', icon: 'snow', types: ['mage'], quote: '“寒冷，是温柔的另一种写法。”',
      desc: '减速效果 <b>+12%</b>，持续时间 <b>+0.5 秒</b>', apply: s => { s.slowFactor += 0.12; s.slowDuration += 0.5; } },
    { id: 'nova', name: '霜爆回响', rarity: 'rare', icon: 'nova', types: ['mage'], quote: '“冻结的终点，是盛大的碎裂。”',
      desc: '击杀敌人时引发霜爆，对周围造成 <b>60%</b> 伤害', apply: s => { s.novaRatio = Math.max(s.novaRatio, 0.6); s.novaRadius = Math.max(s.novaRadius, 2.2); } },
    { id: 'freeze', name: '绝对零度', rarity: 'rare', icon: 'ice', types: ['mage'], quote: '“连时间，也会在绝对零度前停下。”',
      desc: '攻击有 <b>16%</b> 概率冻结敌人 <b>0.7 秒</b>', apply: s => { s.freezeChance += 0.16; s.freezeDuration = Math.max(s.freezeDuration, 0.7); } },
    { id: 'aurora', name: '极光链', rarity: 'epic', icon: 'storm', types: ['mage'], quote: '“极光落下时，万物皆成导体。”',
      desc: '霜星弹射至 <b>2</b> 名附近敌人，造成 <b>50%</b> 伤害', apply: s => { s.chain += 1; s.chainCount += 2; } },
    { id: 'winter', name: '永冬领域', rarity: 'epic', icon: 'aura', types: ['mage'], quote: '“这片领域没有春天。”',
      desc: '射程内所有敌人持续减速 <b>28%</b>，射程 <b>+10%</b>', apply: s => { s.auraSlow = Math.max(s.auraSlow, 0.28); s.range *= 1.1; } },
    { id: 'glacier', name: '冰川裂变', rarity: 'epic', icon: 'shard', types: ['mage'], quote: '“冰川崩裂的声音，像极了星核的心跳。”',
      desc: '攻击速度 <b>+28%</b>，爆炸范围 <b>+35%</b>', apply: s => { s.interval /= 1.28; s.splash *= 1.35; } },

    /* ---------------- blade ---------------- */
    { id: 'bleed', name: '血月印记', rarity: 'common', icon: 'drop', types: ['blade'], quote: '“月光染上绯色，才足够锋利。”',
      desc: '斩击附加 <b>6 点/秒</b> 流血，持续 <b>3 秒</b>', apply: s => { s.bleedDps += 6; s.bleedDuration = Math.max(s.bleedDuration, 3); } },
    { id: 'shadowstep', name: '影袭', rarity: 'rare', icon: 'shadow', types: ['blade'], quote: '“你看见的，只是月光的残影。”',
      desc: '暴击率 <b>+16%</b>，攻击速度 <b>+10%</b>', apply: s => { s.critChance += 0.16; s.interval /= 1.1; } },
    { id: 'moonwheel', name: '月轮斩', rarity: 'rare', icon: 'blade', types: ['blade'], quote: '“月轮转过的地方，没有完好的敌人。”',
      desc: '每次斩击额外命中 <b>2</b> 名敌人', apply: s => { s.maxTargets += 2; } },
    { id: 'condemn', name: '断罪之刃', rarity: 'rare', icon: 'eye', types: ['blade'], quote: '“罪与罚，都只需一刀。”',
      desc: '对生命低于 <b>40%</b> 的敌人伤害 <b>+45%</b>', apply: s => { s.executeThreshold = Math.max(s.executeThreshold, 0.4); s.executeBonus = Math.max(s.executeBonus, 0.45); } },
    { id: 'mirage', name: '千影分形', rarity: 'epic', icon: 'clone', types: ['blade'], quote: '“千道月影，皆是真身。”',
      desc: '每 <b>9</b> 次攻击，召唤月影对射程内全体敌人造成 <b>220%</b> 伤害', apply: s => { s.shadowEvery = 9; s.shadowMult = Math.max(s.shadowMult, 2.2); } },
    { id: 'finale', name: '绯月终章', rarity: 'epic', icon: 'moon', types: ['blade'], quote: '“终章落下时，月光会记住所有人。”',
      desc: '攻击伤害 <b>+45%</b>', apply: s => { s.damage *= 1.45; } },
    { id: 'transient', name: '刹那芳华', rarity: 'epic', icon: 'wind', types: ['blade'], quote: '“最美的一瞬，往往最短。”',
      desc: '攻击速度 <b>+30%</b>', apply: s => { s.interval /= 1.3; } },
    /* ---------------- expansion: archer ---------------- */
    { id: 'arrowstorm', name: '箭雨风暴', rarity: 'rare', icon: 'arrow', types: ['archer'], quote: '“让天空也学会下雨。”',
      desc: '多重射击 <b>+2</b>，但单箭伤害 <b>-8%</b>', apply: s => { s.multishot += 2; s.damage *= 0.92; } },
    { id: 'piercing', name: '贯星', rarity: 'rare', icon: 'spear', types: ['archer'], quote: '“一箭贯穿的，不只是铠甲。”',
      desc: '贯穿 <b>+2</b>，护甲穿透 <b>+2</b>', apply: s => { s.pierce += 2; s.armorPen += 2; } },
    { id: 'quickdraw', name: '瞬弦', rarity: 'epic', icon: 'wind', types: ['archer'], quote: '“弦响之前，箭已经抵达。”',
      desc: '攻击速度 <b>+35%</b>', apply: s => { s.interval /= 1.35; } },
    { id: 'moonmark', name: '月痕', rarity: 'epic', icon: 'moon', types: ['archer'], quote: '“月光会替你标记猎物。”',
      desc: '暴击率 <b>+20%</b>，暴击伤害 <b>+30%</b>', apply: s => { s.critChance += 0.2; s.critMult += 0.3; } },
    { id: 'huntwind', name: '猎风', rarity: 'rare', icon: 'wind', types: ['archer'], quote: '“风会把箭带到更远的地方。”',
      desc: '射程 <b>+18%</b>，攻击速度 <b>+8%</b>', apply: s => { s.range *= 1.18; s.interval /= 1.08; } },
    { id: 'fateshot', name: '命定之矢', rarity: 'epic', icon: 'star', types: ['archer'], quote: '“有些箭，生来就是为了终结。”',
      desc: '对生命低于 <b>35%</b> 的敌人伤害 <b>+55%</b>', apply: s => { s.executeThreshold = Math.max(s.executeThreshold, 0.35); s.executeBonus = Math.max(s.executeBonus, 0.55); } },

    /* ---------------- expansion: mage ---------------- */
    { id: 'glacierheart', name: '冰川之心', rarity: 'epic', icon: 'ice', types: ['mage'], quote: '“连心脏都冻结时，时间就没有意义了。”',
      desc: '冻结概率 <b>+12%</b>，冻结时间 <b>+0.3 秒</b>', apply: s => { s.freezeChance += 0.12; s.freezeDuration += 0.3; } },
    { id: 'chainfrost', name: '霜链', rarity: 'rare', icon: 'storm', types: ['mage'], quote: '“寒冷会沿着名字传播。”',
      desc: '连锁 <b>+2</b>，连锁伤害 <b>+15%</b>', apply: s => { s.chain += 2; s.chainCount += 2; s.damage *= 1.15; } },
    { id: 'shatter', name: '碎冰', rarity: 'rare', icon: 'shard', types: ['mage'], quote: '“冰不是墙，是等待碎裂的刀。”',
      desc: '暴击率 <b>+14%</b>，暴击伤害 <b>+40%</b>', apply: s => { s.critChance += 0.14; s.critMult += 0.4; } },
    { id: 'blizzard', name: '暴雪', rarity: 'epic', icon: 'snow', types: ['mage'], quote: '“整片天空都会落下来。”',
      desc: '爆炸范围 <b>+45%</b>，爆炸伤害 <b>+20%</b>', apply: s => { s.splash *= 1.45; s.damage *= 1.2; } },
    { id: 'permafrost', name: '永冻土', rarity: 'epic', icon: 'aura', types: ['mage'], quote: '“这片土地不欢迎春天。”',
      desc: '光环减速 <b>+10%</b>，射程 <b>+8%</b>', apply: s => { s.auraSlow = Math.max(s.auraSlow, 0.1); s.range *= 1.08; } },
    { id: 'arcanefocus', name: '奥术专注', rarity: 'rare', icon: 'star', types: ['mage'], quote: '“把整片星海压进一枚霜球。”',
      desc: '伤害 <b>+32%</b>，攻击速度 <b>-6%</b>', apply: s => { s.damage *= 1.32; s.interval *= 1.06; } },

    /* ---------------- expansion: blade ---------------- */
    { id: 'bloodmoon', name: '血月', rarity: 'epic', icon: 'drop', types: ['blade'], quote: '“月亮的颜色，是敌人最后看见的颜色。”',
      desc: '流血 <b>+10 点/秒</b>，持续时间 <b>+2 秒</b>', apply: s => { s.bleedDps += 10; s.bleedDuration += 2; } },
    { id: 'mirrorblade', name: '镜刃', rarity: 'epic', icon: 'clone', types: ['blade'], quote: '“每一道月光，都可能是真的。”',
      desc: '每 <b>7</b> 次攻击召唤月影，造成 <b>180%</b> 伤害', apply: s => { s.shadowEvery = 7; s.shadowMult = Math.max(s.shadowMult, 1.8); } },
    { id: 'execution', name: '处刑宣告', rarity: 'rare', icon: 'eye', types: ['blade'], quote: '“判决不需要第二刀。”',
      desc: '对生命低于 <b>45%</b> 的敌人伤害 <b>+60%</b>', apply: s => { s.executeThreshold = Math.max(s.executeThreshold, 0.45); s.executeBonus = Math.max(s.executeBonus, 0.6); } },
    { id: 'galeblade', name: '疾风斩', rarity: 'rare', icon: 'wind', types: ['blade'], quote: '“风追不上月刃。”',
      desc: '攻击速度 <b>+38%</b>，暴击率 <b>+8%</b>', apply: s => { s.interval /= 1.38; s.critChance += 0.08; } },
    { id: 'twinslash', name: '双生斩', rarity: 'epic', icon: 'blade', types: ['blade'], quote: '“两把刀，两个结局。”',
      desc: '额外命中 <b>+3</b> 名敌人，伤害 <b>+12%</b>', apply: s => { s.maxTargets += 3; s.damage *= 1.12; } },
    { id: 'lastdance', name: '终舞', rarity: 'epic', icon: 'moon', types: ['blade'], quote: '“最后一支舞，献给星核。”',
      desc: '伤害 <b>+55%</b>，攻击速度 <b>-8%</b>', apply: s => { s.damage *= 1.55; s.interval *= 1.08; } },

  ];

  const ENEMIES = {
    shade: {
      id: 'shade', name: '蚀影', en: 'HOLLOW SHADE', hp: 62, speed: 2.15, armor: 0,
      gold: 9, core: 1, radius: 0.55, scale: 1, flying: false,
      color: '#7a5cff', eye: '#ff5fa8'
    },
    runner: {
      id: 'runner', name: '影狼', en: 'DUSK HOUND', hp: 44, speed: 3.45, armor: 0,
      gold: 8, core: 1, radius: 0.5, scale: 1, flying: false,
      color: '#45e6ff', eye: '#b8fbff'
    },
    brute: {
      id: 'brute', name: '铁卫', en: 'IRON WARDEN', hp: 255, speed: 1.16, armor: 7,
      gold: 20, core: 2, radius: 0.82, scale: 1.2, flying: false,
      color: '#ff7a55', eye: '#ffd27a'
    },
    wisp: {
      id: 'wisp', name: '飞灵', en: 'VOID WISP', hp: 96, speed: 2.55, armor: 0,
      gold: 13, core: 1, radius: 0.45, scale: 1, flying: true, flyHeight: 1.55,
      color: '#9c7cff', eye: '#7cf4ff'
    },
    splitter: {
      id: 'splitter', name: '裂影', en: 'RIFT SPLITTER', hp: 74, speed: 2.25, armor: 0,
      gold: 10, core: 1, radius: 0.55, scale: 1, flying: false, model: 'shade',
      barY: 3.15, color: '#b56cff', eye: '#ffd07a', split: { type: 'shade', count: 2 }
    },
    shielded: {
      id: 'shielded', name: '盾卫', en: 'AEGIS WARDEN', hp: 170, speed: 1.45, armor: 4,
      gold: 16, core: 1, radius: 0.72, scale: 1.08, flying: false, model: 'brute',
      barY: 3.8, shield: 90, color: '#6f9cff', eye: '#bff7ff'
    },
    healer: {
      id: 'healer', name: '祭影', en: 'RITUAL VEIL', hp: 68, speed: 1.9, armor: 0,
      gold: 12, core: 1, radius: 0.5, scale: 1, flying: false, model: 'shade',
      heal: { radius: 4.2, amount: 8, interval: 2.6 },
      barY: 3.15, color: '#8be8b0', eye: '#e6ffe9'
    },
    boss_ember: {
      id: 'boss_ember', name: '熔火歌姬 · 伊格妮丝', en: 'EMBER DIVA · IGNIS', hp: 2850, speed: 1.08,
      armor: 5, gold: 260, core: 12, radius: 1.4, scale: 1.05, flying: false, boss: true, model: 'boss',
      barY: 6.7, color: '#ff6a3d', eye: '#ffe0a8'
    },
    boss_void: {
      id: 'boss_void', name: '星海遗孀 · 诺克提斯', en: 'VOID WIDOW · NOCTIS', hp: 2700, speed: 1.12,
      armor: 4, gold: 250, core: 12, radius: 1.4, scale: 1.05, flying: false, boss: true, model: 'boss',
      barY: 6.7, color: '#54d7ff', eye: '#e8fbff'
    },
    boss: {
      id: 'boss', name: '深渊歌姬 · 塞拉菲娜', en: 'ABYSS DIVA · SERAPHINA', hp: 2600, speed: 1.05, armor: 4,
      gold: 240, core: 12, radius: 1.4, scale: 1.05, flying: false, boss: true,
      color: '#ff4f8c', eye: '#ffe3f0'
    }
  };

  const WAVES = [
    { name: '迷途之影', en: 'SHADOWS AT THE GATE', subtitle: '第一波 · 蚀影试探', reward: 46,
      spawns: [{ type: 'shade', count: 8, gap: 0.95, delay: 0.5 }] },
    { name: '群狼低语', en: 'WHISPERS OF THE PACK', subtitle: '第二波 · 影狼奔袭', reward: 53,
      spawns: [{ type: 'shade', count: 8, gap: 0.85, delay: 0.4 }, { type: 'runner', count: 4, gap: 0.55, delay: 7 }] },
    { name: '铁卫叩门', en: 'IRON UPON THE GATE', subtitle: '第三波 · 铁卫压境', reward: 68,
      spawns: [{ type: 'shade', count: 10, gap: 0.7, delay: 0.3 }, { type: 'brute', count: 3, gap: 2.4, delay: 7.5 }] },
    { name: '飞灵之潮', en: 'TIDE OF WISPS', subtitle: '第四波 · 空域入侵', reward: 62,
      spawns: [{ type: 'runner', count: 10, gap: 0.45, delay: 0.3 }, { type: 'wisp', count: 5, gap: 1.1, delay: 5.5 }] },
    { name: '霜火同歌', en: 'A HYMN OF FROST AND FIRE', subtitle: '第五波 · 混编军团', reward: 77,
      spawns: [{ type: 'shade', count: 8, gap: 0.6, delay: 0.3 }, { type: 'brute', count: 4, gap: 1.9, delay: 4.5 }, { type: 'wisp', count: 4, gap: 1.0, delay: 10 }] },
    { name: '猎月之夜', en: 'THE MOONLESS HUNT', subtitle: '第六波 · 疾影交错', reward: 86,
      spawns: [{ type: 'runner', count: 12, gap: 0.4, delay: 0.3 }, { type: 'wisp', count: 8, gap: 0.75, delay: 4.0 }, { type: 'brute', count: 2, gap: 2.0, delay: 10.5 }] },
    { name: '星门将倾', en: 'THE GATE BENDS', subtitle: '第七波 · 深渊主力', reward: 99,
      spawns: [{ type: 'shade', count: 12, gap: 0.5, delay: 0.3 }, { type: 'brute', count: 5, gap: 1.5, delay: 3.0 }, { type: 'wisp', count: 8, gap: 0.8, delay: 9.0 }] },
    { name: '深渊歌姬', en: 'SONG OF THE ABYSS', subtitle: '终焉 · 塞拉菲娜降临', reward: 176, boss: true,
      spawns: [{ type: 'shade', count: 8, gap: 0.8, delay: 1.0 }, { type: 'wisp', count: 6, gap: 1.0, delay: 5.0 }, { type: 'boss', count: 1, gap: 1, delay: 7.0 }] }
  ];

  const MAPS = {
    cloud: {
      id: 'cloud', name: '云海圣所', en: 'CLOUDSEA SANCTUM',
      subtitle: '最后一道星门', boss: 'boss',
      theme: {
        fog: '#241a33', ground: '#ffffff', filter: 'none',
        hud: '#f3d99b', path: '#ffd47a'
      },
      mix: 'cloud',
      path: [
        [-18.0, -12.0], [-14.5, -10.5], [-10.5, -7.5], [-11.2, -1.8],
        [-8.2, 4.0], [-2.8, 6.8], [2.2, 4.2], [2.0, -2.0],
        [6.8, -7.0], [12.5, -4.5], [14.5, 1.5], [11.0, 7.5],
        [11.8, 12.5], [14.2, 15.8]
      ]
    },
    ember: {
      id: 'ember', name: '熔火回廊', en: 'EMBER CLOISTER',
      subtitle: '被熔岩吞没的旧祈祷室', boss: 'boss_ember',
      theme: {
        fog: '#2b1116', ground: '#d99a83', filter: 'hue-rotate(-28deg) saturate(1.22) brightness(1.04)',
        hud: '#ff9a6a', path: '#ff7a3d'
      },
      mix: 'ember',
      path: [
        [-18.0, -12.0], [-13.5, -12.8], [-9.0, -10.5], [-7.2, -5.8],
        [-11.0, -1.2], [-6.5, 2.8], [-1.5, 1.2], [2.8, 4.2],
        [7.0, 1.0], [5.2, -5.0], [9.0, -8.2], [14.0, -6.0],
        [15.0, 0.0], [11.2, 5.2], [12.0, 10.0], [16.0, 14.8]
      ]
    },
    ruins: {
      id: 'ruins', name: '星海遗迹', en: 'STARFALL RUINS',
      subtitle: '沉入星海的最后观测站', boss: 'boss_void',
      theme: {
        fog: '#111a2b', ground: '#8fa6c8', filter: 'hue-rotate(148deg) saturate(.88) brightness(.94)',
        hud: '#7fe9ff', path: '#7fe9ff'
      },
      mix: 'ruins',
      path: [
        [-18.0, -12.0], [-13.0, -9.5], [-16.0, -4.5], [-11.0, -0.8],
        [-14.5, 4.8], [-8.5, 7.2], [-4.0, 4.0], [-1.0, 8.0],
        [4.0, 6.2], [2.0, 0.0], [6.0, -3.5], [10.0, 0.0],
        [8.0, 6.0], [12.0, 9.5], [15.0, 13.5]
      ]
    }
  };

  const MAP_ORDER = ['cloud', 'ember', 'ruins'];

  const PATH_POINTS = [
    [-18.0, -12.0], [-14.5, -10.5], [-10.5, -7.5], [-11.2, -1.8],
    [-8.2, 4.0], [-2.8, 6.8], [2.2, 4.2], [2.0, -2.0],
    [6.8, -7.0], [12.5, -4.5], [14.5, 1.5], [11.0, 7.5],
    [11.8, 12.5], [14.2, 15.8]
  ];

  const PAD_POSITIONS = [
    [-16.4, -5.0], [-8.0, -12.2], [-5.6, -1.5], [-7.0, 6.6],
    [0.2, 10.7], [5.0, 0.1], [8.2, -10.8], [18.4, 4.2],
    [6.4, 12.0], [16.4, 12.4]
  ];

  const DIFFICULTIES = {
    normal: { id: 'normal', name: '普通', en: 'NORMAL', hp: 1, core: 20, gold: 340, speed: 1, armor: 0, desc: '标准远征' },
    hard: { id: 'hard', name: '困难', en: 'HARD', hp: 1.25, core: 16, gold: 380, speed: 1.04, armor: 1, desc: '敌潮更硬，星核更脆弱' },
    nightmare: { id: 'nightmare', name: '噩梦', en: 'NIGHTMARE', hp: 1.55, core: 12, gold: 420, speed: 1.08, armor: 2, desc: '为极限构筑准备' }
  };

  const CONSTANTS = {
    maxWaves: 8,
    coreHp: 20,
    startGold: 340,
    maxLevel: 4,
    padCount: PAD_POSITIONS.length,
    maxMods: 8,
    startRerolls: 2,
    buildTime: 28,
    intermission: 14,
    upgradeCosts: [60, 120, 200],
    upgradeMax: 3,
    coreRepairCost: 40,
    coreRepairMax: 3,
    skillEnergyMax: 100,
    skillCooldown: 40,
    skillSlow: 0.7,
    skillDuration: 3.5
  };

  window.GAME_DATA = {
    TOWERS, TOWER_ORDER, RARITY, MODS, ICONS, ENEMIES, WAVES,
    PATH_POINTS, PAD_POSITIONS, CONSTANTS, DIFFICULTIES, STAGE_INFO, STAGE_ART, MAPS, MAP_ORDER
  };
})();
