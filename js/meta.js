/* =========================================================
   星陨战线 · META
   局外星图与成就定义。纯数据 + localStorage，无外部依赖。
   ========================================================= */
(function () {
  'use strict';

  window.ASTRAL_META = {
    upgrades: [
      {
        id: 'gold', name: '星辉储备', en: 'STAR RESERVE', icon: '✦', max: 3,
        cost: [4, 8, 14], desc: '每级：开局星币 +40'
      },
      {
        id: 'core', name: '结界加固', en: 'WARDEN CORE', icon: '◇', max: 2,
        cost: [6, 14], desc: '每级：星核上限 +2'
      },
      {
        id: 'reroll', name: '命运余响', en: 'FATE ECHO', icon: '↻', max: 2,
        cost: [5, 12], desc: '每级：初始重掷 +1'
      },
      {
        id: 'damage', name: '星轨锋芒', en: 'ASTRAL EDGE', icon: '✧', max: 3,
        cost: [5, 10, 18], desc: '每级：全守卫伤害 +3%'
      }
    ],
    achievements: [
      { id: 'first_run', name: '初次守望', en: 'FIRST WATCH', desc: '完成一次远征', check: p => p.runs >= 1 },
      { id: 'first_win', name: '星核未熄', en: 'THE CORE HOLDS', desc: '首次通关云海圣所', check: p => p.wins >= 1 },
      { id: 'hard_win', name: '逆潮而行', en: 'AGAINST THE TIDE', desc: '在困难难度通关', check: p => (p.winsHard || 0) >= 1 },
      { id: 'nightmare_win', name: '噩梦守望', en: 'NIGHTMARE WATCH', desc: '在噩梦难度通关', check: p => (p.winsNightmare || 0) >= 1 },
      { id: 'no_leak', name: '无瑕结界', en: 'FLAWLESS WARD', desc: '零漏怪通关', check: p => (p.noLeakWins || 0) >= 1 },
      { id: 'no_reroll', name: '命运不重来', en: 'NO SECOND CAST', desc: '不重掷通关', check: p => (p.noRerollWins || 0) >= 1 },
      { id: 'boss_slain', name: '深渊落幕', en: 'ABYSS FALLS', desc: '击败任意 Boss', check: p => (p.bossKills || 0) >= 1 },
      { id: 'boss_all', name: '三座深渊', en: 'THREE ABYSSES', desc: '击败三种 Boss', check: p => (p.bossTypes ? p.bossTypes.length : 0) >= 3 },
      { id: 'kills_100', name: '百影斩', en: 'HUNDRED SHADOWS', desc: '累计击杀 100 个敌人', check: p => (p.kills || 0) >= 100 },
      { id: 'kills_1000', name: '千影斩', en: 'THOUSAND SHADOWS', desc: '累计击杀 1000 个敌人', check: p => (p.kills || 0) >= 1000 },
      { id: 'wave8', name: '第八道门', en: 'THE EIGHTH GATE', desc: '抵达第 8 波', check: p => (p.bestWave || 0) >= 8 },
      { id: 'endless10', name: '回响之外', en: 'BEYOND ECHO', desc: '无尽模式抵达第 10 波', check: p => (p.bestEndless || 0) >= 10 },
      { id: 'all_iv', name: '全员神降', en: 'ALL ASCENDED', desc: '一局内所有守卫达到 IV 阶', check: p => !!p.allMaxRun },
      { id: 'mods6', name: '六枚星轨', en: 'SIX CONSTELLATIONS', desc: '单塔拥有 6 枚铭文', check: p => (p.maxMods || 0) >= 6 },
      { id: 'upgrade3', name: '星辉满溢', en: 'FULLY ENCHANTED', desc: '单塔强化至 3 级', check: p => (p.maxUpgrade || 0) >= 3 },
      { id: 'skill10', name: '时滞十次', en: 'TEN DILATIONS', desc: '累计释放 10 次星蚀', check: p => (p.skillCasts || 0) >= 10 },
      { id: 'gold1000', name: '星币满仓', en: 'GOLDEN HOARD', desc: '单局获得 1000 星币', check: p => (p.maxGold || 0) >= 1000 },
      { id: 'maps3', name: '三界巡礼', en: 'THREE DOMAINS', desc: '在 3 张地图中通关', check: p => (p.clearedMaps ? p.clearedMaps.length : 0) >= 3 },
      { id: 'meta3', name: '星图点亮', en: 'STARCHART LIT', desc: '购买 3 次局外升级', check: p => (p.upgradeBuys || 0) >= 3 },
      { id: 'daily', name: '今日守望', en: 'DAILY WATCH', desc: '完成一次每日挑战', check: p => (p.dailyRuns || 0) >= 1 }
    ]
  };
})();
