/**
 * Bruckner Symphony No. 8 in C minor (WAB 108) Interactive Guide
 * Bilingual Application Engine (ZH / EN) with Polyphony Radar & Web Audio Synth
 * Grounded in Robert Haas Edition & Günter Wand's Contrapuntal Interpretation
 */

(function () {
  'use strict';

  const DATA = window.BRUCKNER_DATA || window.MAHLER_DATA;
  const Engine = window.BrucknerEngine || window.MahlerEngine;

  if (!DATA || !Engine) {
    console.error('Bruckner Data or Engine missing.');
    return;
  }

  // Load saved state or defaults
  const saved = JSON.parse(localStorage.getItem('bruckner8_state') || '{}');
  const state = {
    lang: saved.lang || (navigator.language.startsWith('zh') ? 'zh' : 'en'),
    movementIndex: saved.movementIndex || 0,
    currentTime: 0,
    isPlaying: false,
    loopStage: false,
    autoFollow: true,
    continuous: true,
    speed: 1,
    muted: false,
    calibrations: saved.calibrations || {},
    activeStageIndex: 0,
    synthMode: 'todes-rhythm'
  };

  // Translation helpers
  function t(zh, en) {
    return state.lang === 'en' ? en : zh;
  }

  function tr(obj, field) {
    if (!obj) return '';
    if (state.lang === 'en' && obj[field + '_en']) {
      return obj[field + '_en'];
    }
    return obj[field] || '';
  }

  function saveState() {
    localStorage.setItem('bruckner8_state', JSON.stringify({
      lang: state.lang,
      movementIndex: state.movementIndex,
      calibrations: state.calibrations
    }));
  }

  // Audio & Web Audio Synthesis Context
  const audioEl = document.getElementById('audio');
  let audioCtx = null;
  let synthInterval = null;
  let isSimulated = true;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Web Audio Synthesizer for Themes & Motifs
  function playTone(freq, duration, type = 'sine', gainVal = 0.15, delay = 0) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + delay + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  }

  // Melodic frequencies
  const NOTES = {
    C3: 130.81, D3: 146.83, Eb3: 155.56, F3: 174.61, G3: 196.00, Ab3: 207.65, Bb3: 233.08,
    C4: 261.63, Db4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392.00,
    Ab4: 415.30, Bb4: 466.16, B4: 493.88, C5: 523.25, Db5: 554.37, Eb5: 622.25, F5: 698.46, G5: 783.99
  };

  function playThemeSequence(mode) {
    getAudioContext();
    if (mode === 'todes-rhythm') {
      // Mvt 1 2+3 Rhythm: C - Eb - D - F - G
      playTone(NOTES.C3, 0.5, 'sawtooth', 0.2, 0.0);
      playTone(NOTES.C3, 0.5, 'sawtooth', 0.2, 0.55);
      playTone(NOTES.Eb3, 0.35, 'sawtooth', 0.22, 1.15);
      playTone(NOTES.D3, 0.35, 'sawtooth', 0.22, 1.55);
      playTone(NOTES.F3, 0.35, 'sawtooth', 0.22, 1.95);
      playTone(NOTES.G3, 1.2, 'sawtooth', 0.25, 2.35);
      showToast(t('播放：2+3 命运与死亡宣告动机', 'Playing: 2+3 Todesverkündigung Theme'));
    } else if (mode === 'michel-scherzo') {
      // Mvt 2 Michel Stomp
      playTone(NOTES.C3, 0.4, 'triangle', 0.3, 0.0);
      playTone(NOTES.G3, 0.25, 'triangle', 0.2, 0.45);
      playTone(NOTES.C4, 0.25, 'triangle', 0.2, 0.75);
      playTone(NOTES.Eb4, 0.4, 'triangle', 0.25, 1.05);
      playTone(NOTES.D4, 0.3, 'triangle', 0.2, 1.5);
      playTone(NOTES.C4, 0.8, 'triangle', 0.25, 1.85);
      showToast(t('播放：德意志米歇尔乡村踏地舞', 'Playing: Der deutsche Michel Scherzo'));
    } else if (mode === 'adagio-prayer') {
      // Mvt 3 Adagio Syncopated Sigh
      playTone(NOTES.Db4, 0.9, 'sine', 0.2, 0.0);
      playTone(NOTES.F4, 0.9, 'sine', 0.22, 0.95);
      playTone(NOTES.Ab4, 1.4, 'sine', 0.25, 1.9);
      playTone(NOTES.C5, 1.2, 'sine', 0.25, 3.35);
      playTone(NOTES.Bb4, 1.8, 'sine', 0.2, 4.6);
      showToast(t('播放：降D大调天国切分叹息', 'Playing: Adagio Celestial Sigh in D-flat'));
    } else if (mode === 'quadruple-coda') {
      // Mvt 4 Quadruple Counterpoint (Four Simultaneous Strands!)
      // Layer 1: Trumpets Mvt 1 2+3 (High)
      playTone(NOTES.C5, 0.6, 'sawtooth', 0.15, 0.0);
      playTone(NOTES.C5, 0.6, 'sawtooth', 0.15, 0.65);
      playTone(NOTES.Eb5, 0.4, 'sawtooth', 0.16, 1.35);
      playTone(NOTES.D5, 0.4, 'sawtooth', 0.16, 1.8);
      playTone(NOTES.F5, 0.4, 'sawtooth', 0.16, 2.25);
      playTone(NOTES.G5, 1.5, 'sawtooth', 0.2, 2.7);

      // Layer 2: Horns Mvt 2 Scherzo (Mid)
      playTone(NOTES.G4, 0.4, 'triangle', 0.18, 0.0);
      playTone(NOTES.C4, 0.4, 'triangle', 0.18, 0.45);
      playTone(NOTES.Eb4, 0.4, 'triangle', 0.18, 0.9);
      playTone(NOTES.G4, 0.8, 'triangle', 0.2, 1.35);
      playTone(NOTES.C5, 1.5, 'triangle', 0.2, 2.2);

      // Layer 3: Trombones Mvt 3 Adagio (Solemn)
      playTone(NOTES.C4, 1.8, 'sawtooth', 0.15, 0.0);
      playTone(NOTES.E4, 1.8, 'sawtooth', 0.18, 1.85);

      // Layer 4: Basses Mvt 4 Cossack Ride (Bass Heavy)
      playTone(NOTES.C3, 0.3, 'square', 0.15, 0.0);
      playTone(NOTES.C3, 0.3, 'square', 0.15, 0.35);
      playTone(NOTES.G3, 0.3, 'square', 0.15, 0.7);
      playTone(NOTES.C3, 0.3, 'square', 0.15, 1.05);
      playTone(NOTES.C3, 0.3, 'square', 0.15, 1.4);
      playTone(NOTES.G3, 0.3, 'square', 0.15, 1.75);
      playTone(NOTES.C3, 1.6, 'square', 0.2, 2.1);

      showToast(t('西方复调最高神迹：四大主题四重对位同时轰鸣！', 'Coda Miracle: 4 Movement Themes in Quadruple Counterpoint!'));
    }
  }

  // DOM Elements
  const el = {
    langBtn: document.getElementById('langBtn'),
    consoleMovement: document.getElementById('consoleMovement'),
    heroLength: document.getElementById('heroLength'),
    heroSubtitle: document.getElementById('heroSubtitle'),
    movementNav: document.getElementById('movementNav'),
    playBtn: document.getElementById('play'),
    prevBtn: document.getElementById('prevMovement'),
    nextBtn: document.getElementById('nextMovement'),
    back5Btn: document.getElementById('back5'),
    forward5Btn: document.getElementById('forward5'),
    currentTime: document.getElementById('currentTime'),
    duration: document.getElementById('duration'),
    loopBtn: document.getElementById('loop'),
    followBtn: document.getElementById('follow'),
    continuousBtn: document.getElementById('continuous'),
    speedSelect: document.getElementById('speed'),
    muteBtn: document.getElementById('mute'),
    waveWrap: document.getElementById('waveWrap'),
    waveCanvas: document.getElementById('wave'),
    scrubInput: document.getElementById('scrub'),
    waveHover: document.getElementById('waveHover'),
    wavePosition: document.getElementById('wavePosition'),
    waveAct: document.getElementById('waveAct'),
    quickJumps: document.getElementById('quickJumps'),
    liveTime: document.getElementById('liveTime'),
    liveTitle: document.getElementById('liveTitle'),
    syncBadge: document.getElementById('syncBadge'),
    radarGrid: document.getElementById('radarGrid'),
    content: document.getElementById('content'),
    dialog: document.getElementById('dialog'),
    dialogTitle: document.getElementById('dialogTitle'),
    dialogBody: document.getElementById('dialogBody'),
    dialogClose: document.getElementById('dialogClose'),
    toast: document.getElementById('toast'),
    themeBtn: document.getElementById('themeBtn'),
    btnSettings: document.getElementById('btnSettings'),
    btnSources: document.getElementById('btnSources')
  };

  // Toast Notification
  let toastTimer = null;
  function showToast(msg) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.hidden = true;
    }, 2500);
  }

  // Current Movement Data
  function getCurMvt() {
    return DATA.movements[state.movementIndex] || DATA.movements[0];
  }

  function getCurDuration() {
    const mvt = getCurMvt();
    if (audioEl.src && Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
      return audioEl.duration;
    }
    return mvt.duration || 1000;
  }

  // Update Static Labels based on state.lang
  function updateStaticLabels() {
    document.documentElement.lang = state.lang === 'en' ? 'en' : 'zh-CN';
    if (el.langBtn) {
      el.langBtn.textContent = state.lang === 'en' ? '中文' : 'English';
      el.langBtn.title = state.lang === 'en' ? '切换到中文' : 'Switch to English';
    }
    if (el.btnSettings) {
      el.btnSettings.textContent = t('音源与校准', 'Audio & Calibration');
    }
    if (el.btnSources) {
      el.btnSources.textContent = t('版本与资料', 'Editions & Notes');
    }
    if (el.themeBtn) {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      el.themeBtn.textContent = isLight ? (state.lang === 'en' ? '☀️ Light' : '☀️ 浅色') : (state.lang === 'en' ? '🌙 Dark' : '🌙 深色');
    }
    if (el.prevBtn) el.prevBtn.textContent = t('◀ 上一章', '◀ Prev');
    if (el.nextBtn) el.nextBtn.textContent = t('下一章 ▶', 'Next ▶');
    if (el.loopBtn) {
      el.loopBtn.textContent = state.loopStage ? t('🔁 段落循环 [开]', '🔁 Loop [On]') : t('🔁 段落循环', '🔁 Loop');
    }
    if (el.followBtn) {
      el.followBtn.textContent = state.autoFollow ? t('📍 自动跟随', '📍 Follow') : t('📍 跟随 [关]', '📍 Follow [Off]');
    }
    if (el.continuousBtn) {
      el.continuousBtn.textContent = state.continuous ? t('⇥ 连续乐章', '⇥ Continuous') : t('⇥ 连续 [关]', '⇥ Continuous [Off]');
    }
    if (el.heroSubtitle) {
      el.heroSubtitle.textContent = t(' · 罗伯特·哈斯版 · 四大乐章 · 复调雷达 · 四重对位', ' · Robert Haas Edition · 4 Movements · Polyphony Radar · Quadruple Counterpoint');
    }

    document.title = t(
      'Bruckner 8 · 声音大教堂与复调导览 (Robert Haas / Günter Wand)',
      'Bruckner 8 · Sonic Cathedral & Contrapuntal Guide (Haas / Günter Wand)'
    );
  }

  // Render Movement Navigation Bar
  function renderMovementNav() {
    if (!el.movementNav) return;
    el.movementNav.innerHTML = '';
    DATA.movements.forEach((mvt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'movement-button' + (idx === state.movementIndex ? ' current' : '');
      btn.setAttribute('aria-label', tr(mvt, 'title'));
      btn.innerHTML = `<b>${mvt.roman}</b> <span>${tr(mvt, 'shortEn')}</span> <small>${Engine.formatTime(mvt.duration)}</small>`;
      btn.addEventListener('click', () => switchMovement(idx));
      el.movementNav.appendChild(btn);
    });
  }

  // Switch Movement
  function switchMovement(idx) {
    if (idx < 0 || idx >= DATA.movements.length) return;
    state.movementIndex = idx;
    state.currentTime = 0;
    state.activeStageIndex = 0;
    saveState();

    const mvt = getCurMvt();
    if (el.consoleMovement) {
      el.consoleMovement.textContent = `${mvt.roman}. ${tr(mvt, 'title')}`;
    }
    if (el.duration) {
      el.duration.textContent = Engine.formatTime(getCurDuration());
    }
    if (el.scrubInput) {
      el.scrubInput.max = getCurDuration();
      el.scrubInput.value = 0;
    }

    renderMovementNav();
    renderQuickJumps();
    renderRadar();
    renderContent();
    drawWaveform();
    updateActiveStage();
  }

  // Render Quick Jumps in Timeline
  function renderQuickJumps() {
    if (!el.quickJumps) return;
    el.quickJumps.innerHTML = '';
    const mvt = getCurMvt();
    const stages = mvt.stages || [];
    
    // Pick landmark stages
    const landmarks = stages.filter((s, i) => i === 0 || i === Math.floor(stages.length / 2) || s.motifs?.length > 0).slice(0, 5);
    landmarks.forEach(stage => {
      const btn = document.createElement('button');
      btn.textContent = `${Engine.formatTime(stage.start)} ${tr(stage, 'title')}`;
      btn.addEventListener('click', () => {
        seekTo(stage.start);
      });
      el.quickJumps.appendChild(btn);
    });
  }

  // Render Choir Radar
  const CHOIR_NAMES = {
    woodwinds: { zh: '木管声部', en: 'Woodwinds', desc_zh: '长笛/双簧管/单簧管/大管', desc_en: 'Flutes / Oboes / Clarinets / Bassoons' },
    horns_tubas: { zh: '圆号与大号', en: 'Horns & Tubas', desc_zh: '4圆号与4瓦格纳大号', desc_en: '4 Horns & 4 Wagner Tubas' },
    brass_heavy: { zh: '重铜管与定音鼓', en: 'Heavy Brass', desc_zh: '3小号/3长号/低音大号/定音鼓', desc_en: 'Trumpets / Trombones / Contrabass Tuba' },
    strings: { zh: '弦乐群', en: 'Strings', desc_zh: '第一/第二小提琴/中提/大提/低提', desc_en: 'Violin I & II / Violas / Cellos / Basses' },
    harps: { zh: '竖琴与打击乐', en: 'Harps & Percussion', desc_zh: '三把竖琴/大钹/三角铁', desc_en: 'Triple Harps / Cymbals / Triangle' }
  };

  function renderRadar() {
    if (!el.radarGrid) return;
    const mvt = getCurMvt();
    const stage = mvt.stages[state.activeStageIndex] || mvt.stages[0];
    const choirs = stage?.choirs || { woodwinds: 0.5, horns_tubas: 0.5, brass_heavy: 0.2, strings: 0.8, harps: 0.0 };

    el.radarGrid.innerHTML = '';
    Object.keys(CHOIR_NAMES).forEach(key => {
      const info = CHOIR_NAMES[key];
      const weight = choirs[key] || 0.0;
      const isActive = weight > 0.2;
      const isPeak = weight >= 0.8;

      const card = document.createElement('div');
      card.className = 'choir-card' + (isPeak ? ' highlight' : (isActive ? ' active' : ''));
      card.innerHTML = `
        <div>
          <b>${t(info.zh, info.en)}</b>
          <span>${Math.round(weight * 100)}%</span>
        </div>
        <p>${t(info.desc_zh, info.desc_en)}</p>
      `;
      el.radarGrid.appendChild(card);
    });
  }

  // Render Main Viewport Content
  function renderContent() {
    if (!el.content) return;
    const mvt = getCurMvt();

    el.content.innerHTML = `
      <section class="panel" style="margin-bottom: 20px;">
        <div class="lab-heading">
          <span class="lab-badge">${mvt.roman}</span>
          <h2>${tr(mvt, 'title')}</h2>
          <span class="quiet" style="font-size:11px;">(${tr(mvt, 'tonalCenter')} · ${tr(mvt, 'form')})</span>
        </div>
        <p style="font-size:12px; color:var(--muted); margin:10px 0 14px; line-height:1.8;">
          ${tr(mvt, 'introduction')}
        </p>
        <div style="background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:10px 14px; font-size:11px;">
          <b style="color:var(--gold);">💡 ${t('通关任务：', 'Listening Mission: ')}</b>
          <span style="color:var(--text);">${tr(mvt, 'mission')}</span>
        </div>
      </section>

      <!-- Synth Lab / Theme Showcase -->
      <section class="panel synth-lab" style="margin-bottom: 20px;">
        <div class="lab-head">
          <div class="lab-heading">
            <span class="lab-badge">SYNTH</span>
            <h2>${t('主题与复调实验室', 'Thematic & Polyphony Synth Lab')}</h2>
          </div>
          <p>${t('点击试听四大乐章核心主题及终曲四重对位合成！', 'Click to audition core themes and the climactic quadruple counterpoint!')}</p>
        </div>
        <div class="synth-tabs" id="synthTabs">
          ${(DATA.synthModes || []).map(sm => `
            <button data-mode="${sm.id}" class="${state.synthMode === sm.id ? 'selected' : ''}">
              <b>${tr(sm, 'title')}</b>
              <small>${tr(sm, 'desc')}</small>
            </button>
          `).join('')}
        </div>
        <div class="lab-controls">
          <button id="btnPlaySynth" class="synth-button">${t('▶ 试听当前主题', '▶ Play Current Theme')}</button>
          <button id="btnQuadruple" class="primary-small" style="font-weight:700;">✨ ${t('直接试听四重对位神迹！', 'Audition Quadruple Counterpoint!')}</button>
        </div>
      </section>

      <!-- Motifs Section -->
      <section class="panel" style="margin-bottom: 20px;">
        <div class="lab-heading" style="margin-bottom:12px;">
          <span class="lab-badge">${t('动机印记', 'MOTIFS')}</span>
          <h2>${t('本乐章核心动机', 'Movement Core Motifs')}</h2>
        </div>
        <div class="motif-minis">
          ${(mvt.motifs || []).map(motif => `
            <div class="motif-mini" style="border:1px solid var(--line); border-radius:9px; padding:8px 10px; background:var(--bg);">
              <b style="color:${motif.color || 'var(--gold)'};">${tr(motif, 'name')}</b>
              <span title="${tr(motif, 'earprint')}">${tr(motif, 'earprint')}</span>
              <button data-seek="${motif.audioStart || 0}" style="border:1px solid var(--line);">${t('跳转', 'Jump')}</button>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Timeline Stages -->
      <section class="panel">
        <div class="timeline-heading">
          <div>
            <h2>${t('分段导览时间轴', 'Synchronized Timeline Guide')}</h2>
            <p>${t('精确对齐君特·旺德（罗伯特·哈斯版）的宏伟建筑布局', 'Calibrated to Günter Wand (Robert Haas Edition) cathedral architecture')}</p>
          </div>
        </div>
        <div class="timeline" id="stageList">
          ${(mvt.stages || []).map((stage, idx) => `
            <div class="stage ${idx === state.activeStageIndex ? 'current' : ''}" id="stage-${idx}">
              <div class="stage-body">
                <div class="stage-select">
                  <div class="stage-topline">
                    <span class="stage-time" style="background:${getStageColor(idx)};">${Engine.formatTime(stage.start)}</span>
                    <span class="act-badge">${tr(stage, 'actName')}</span>
                    <span class="stage-number">${stage.scoreRef || ''}</span>
                    <button class="stage-play" data-jump="${stage.start}">▶ ${t('播放', 'Play')}</button>
                  </div>
                  <h4>${tr(stage, 'title')}</h4>
                  <p style="margin: 8px 0 10px;">${tr(stage, 'desc')}</p>
                  <div class="stage-layers">
                    <div><b style="color:var(--text);">${t('听什么 (主导)：', 'Listen for: ')}</b> ${tr(stage, 'foreground')}</div>
                    <div style="margin-top:4px;"><b style="color:var(--muted);">${t('对位与伴奏：', 'Counterpoint: ')}</b> ${tr(stage, 'background')}</div>
                    <div style="margin-top:4px; color:var(--gold);"><b>💡 ${t('建议：', 'Focus: ')}</b> ${tr(stage, 'focus')}</div>
                  </div>
                </div>
                <div class="stage-tools">
                  <button class="cue" data-jump="${stage.start}">📍 ${t('跳转至此', 'Seek here')}</button>
                  ${(stage.motifs || []).map(mId => `<span class="stage-pill">${mId}</span>`).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;

    // Attach Synth Lab event listeners
    const synthTabs = document.querySelectorAll('#synthTabs button');
    synthTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        synthTabs.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.synthMode = btn.dataset.mode;
        playThemeSequence(state.synthMode);
      });
    });

    const btnPlaySynth = document.getElementById('btnPlaySynth');
    if (btnPlaySynth) {
      btnPlaySynth.addEventListener('click', () => {
        playThemeSequence(state.synthMode);
      });
    }

    const btnQuadruple = document.getElementById('btnQuadruple');
    if (btnQuadruple) {
      btnQuadruple.addEventListener('click', () => {
        playThemeSequence('quadruple-coda');
      });
    }

    // Attach Jump buttons in Timeline
    document.querySelectorAll('[data-jump]').forEach(btn => {
      btn.addEventListener('click', () => {
        const time = parseFloat(btn.dataset.jump);
        if (Number.isFinite(time)) seekTo(time);
      });
    });

    document.querySelectorAll('[data-seek]').forEach(btn => {
      btn.addEventListener('click', () => {
        const time = parseFloat(btn.dataset.seek);
        if (Number.isFinite(time)) seekTo(time);
      });
    });
  }

  function getStageColor(idx) {
    const colors = ['#d97706', '#2563eb', '#10b981', '#7c3aed', '#ec4899', '#f59e0b', '#06b6d4'];
    return colors[idx % colors.length];
  }

  // Update Active Stage in Timeline & Telemetry
  function updateActiveStage() {
    const mvt = getCurMvt();
    const stages = mvt.stages || [];
    const stageIdx = Engine.stageAt(stages, state.currentTime);

    if (stageIdx !== state.activeStageIndex) {
      state.activeStageIndex = stageIdx;

      // Update highlight in DOM
      document.querySelectorAll('.stage').forEach((st, i) => {
        if (i === stageIdx) {
          st.classList.add('current');
          if (state.autoFollow) {
            st.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } else {
          st.classList.remove('current');
        }
      });

      renderRadar();
    }

    const currentStage = stages[state.activeStageIndex];
    if (currentStage) {
      if (el.liveTime) el.liveTime.textContent = Engine.formatTime(state.currentTime);
      if (el.liveTitle) el.liveTitle.textContent = `${tr(currentStage, 'actName')} · ${tr(currentStage, 'title')}`;
      if (el.waveAct) el.waveAct.textContent = tr(currentStage, 'actName');
    }

    if (el.currentTime) {
      el.currentTime.textContent = Engine.formatTime(state.currentTime);
    }
    if (el.scrubInput && !el.scrubInput.matches(':active')) {
      el.scrubInput.value = state.currentTime;
    }
    if (el.wavePosition) {
      el.wavePosition.textContent = Engine.formatTime(state.currentTime);
    }

    // Loop logic
    if (state.loopStage && currentStage) {
      const bounds = Engine.stageBounds(stages, state.activeStageIndex, getCurDuration());
      if (state.currentTime >= bounds.end - 0.2) {
        seekTo(bounds.start);
      }
    }
  }

  // Playback & Simulation Engine
  let playTimer = null;

  function togglePlay() {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function play() {
    state.isPlaying = true;
    if (el.playBtn) el.playBtn.textContent = t('⏸ 暂停', '⏸ Pause');

    if (audioEl.src && !isSimulated) {
      audioEl.play().catch(() => {
        runSimulation();
      });
    } else {
      runSimulation();
    }
  }

  function pause() {
    state.isPlaying = false;
    if (el.playBtn) el.playBtn.textContent = t('▶ 播放', '▶ Play');
    if (audioEl.src) audioEl.pause();
    cancelAnimationFrame(playTimer);
  }

  let lastTick = performance.now();
  function runSimulation() {
    lastTick = performance.now();
    function tick(now) {
      if (!state.isPlaying) return;
      const delta = (now - lastTick) / 1000;
      lastTick = now;

      state.currentTime += delta * state.speed;
      const dur = getCurDuration();

      if (state.currentTime >= dur) {
        if (state.continuous && state.movementIndex < DATA.movements.length - 1) {
          switchMovement(state.movementIndex + 1);
          play();
          return;
        } else {
          state.currentTime = dur;
          pause();
          return;
        }
      }

      updateActiveStage();
      playTimer = requestAnimationFrame(tick);
    }
    playTimer = requestAnimationFrame(tick);
  }

  function seekTo(time) {
    state.currentTime = Engine.clamp(time, 0, getCurDuration());
    if (audioEl.src && Number.isFinite(audioEl.duration)) {
      audioEl.currentTime = state.currentTime;
    }
    updateActiveStage();
    drawWaveform();
  }

  // Draw Waveform on Canvas
  function drawWaveform() {
    if (!el.waveCanvas) return;
    const canvas = el.waveCanvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = el.waveWrap.clientWidth || 800;
    const height = canvas.height = el.waveWrap.clientHeight || 48;

    ctx.clearRect(0, 0, width, height);

    const mvt = getCurMvt();
    const stages = mvt.stages || [];
    const dur = getCurDuration();
    const progress = state.currentTime / dur;

    // Draw background pseudo-waveform based on choir activity
    const barCount = Math.floor(width / 4);
    for (let i = 0; i < barCount; i++) {
      const barTime = (i / barCount) * dur;
      const sIdx = Engine.stageAt(stages, barTime);
      const stage = stages[sIdx] || {};
      const choirs = stage.choirs || {};
      const sumWeight = (choirs.woodwinds || 0.4) + (choirs.horns_tubas || 0.5) + (choirs.brass_heavy || 0.3) + (choirs.strings || 0.7);
      const barHeight = Math.min(height - 6, Math.max(8, (sumWeight / 3.5) * (height - 6)));

      const x = i * 4;
      const y = (height - barHeight) / 2;

      if (i / barCount <= progress) {
        ctx.fillStyle = '#f59e0b'; // Gold played
      } else {
        ctx.fillStyle = '#262f45'; // Unplayed line
      }
      ctx.fillRect(x, y, 2.5, barHeight);
    }

    // Playhead line
    const playheadX = progress * width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(playheadX - 1, 0, 2, height);
  }

  // Modal Dialog Manager
  function openDialog(title, contentHtml) {
    if (!el.dialog) return;
    el.dialogTitle.textContent = title;
    el.dialogBody.innerHTML = contentHtml;
    el.dialog.showModal();
  }

  function closeDialog() {
    if (el.dialog) el.dialog.close();
  }

  // Settings & Audio Calibration Modal
  function showSettingsDialog() {
    const html = `
      <p>${t('您可以在此处导入本地音频文件（支持 Günter Wand 的 NDR、柏林爱乐或任何版本 MP3/FLAC/WAV），并微调时间对齐与段落偏移。', 'Load local audio files (e.g., Günter Wand NDR / Berlin Phil / Cologne RSO MP3/FLAC/WAV) and adjust time calibration.')}</p>
      
      <div class="source-row">
        <div>
          <b>${t('导入本地音频文件', 'Import Local Audio File')}</b>
          <small>${t('完全在浏览器本地解码，不上传任何服务器', 'Decoded entirely in your local browser')}</small>
        </div>
        <label class="file-label">
          <span>📁 ${t('选择音频文件', 'Choose File')}</span>
          <input type="file" id="localAudioInput" accept="audio/*">
        </label>
      </div>

      <div class="calibrate-row">
        <label for="offsetInput"><b>${t('整体时间偏移 (秒)：', 'Global Time Offset (seconds): ')}</b></label>
        <input type="number" id="offsetInput" step="0.5" value="${state.calibrations[state.movementIndex]?.offset || 0}">
        <button id="btnSaveOffset" class="primary-small">${t('应用', 'Apply')}</button>
      </div>

      <div style="margin-top:20px; border-top:1px solid var(--line); padding-top:14px;">
        <h3>${t('当前对齐基准', 'Reference Alignment Standard')}</h3>
        <p style="font-size:11px; color:var(--muted); line-height:1.8;">
          ${t('本系统基准时间精准锚定罗伯特·哈斯版（Robert Haas Edition）及君特·旺德（Günter Wand）权威录音。哈斯版在第三乐章恢复了壮丽的三记钹鸣与完整抒情段落，终曲展开部亦保留了宏伟的圣咏探索。', 'Reference timings are aligned to the Robert Haas Edition and Günter Wand\'s seminal recordings, restoring the triple cymbal clashes in the Adagio and full structural integrity in the Finale.')}
        </p>
      </div>
    `;

    openDialog(t('音源设置与时间校准', 'Audio Settings & Calibration'), html);

    const fileInput = document.getElementById('localAudioInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          audioEl.src = url;
          isSimulated = false;
          audioEl.load();
          showToast(t(`已加载本地音轨: ${file.name}`, `Loaded local audio: ${file.name}`));
          closeDialog();
        }
      });
    }

    const btnSaveOffset = document.getElementById('btnSaveOffset');
    if (btnSaveOffset) {
      btnSaveOffset.addEventListener('click', () => {
        const val = parseFloat(document.getElementById('offsetInput').value) || 0;
        state.calibrations[state.movementIndex] = state.calibrations[state.movementIndex] || {};
        state.calibrations[state.movementIndex].offset = val;
        saveState();
        showToast(t(`已应用偏移: ${val} 秒`, `Offset applied: ${val}s`));
        closeDialog();
      });
    }
  }

  // Sources & Version Notes Modal
  function showSourcesDialog() {
    const html = `
      <h3>${t('版本公案：哈斯版 (Haas) vs 诺瓦克版 (Nowak)', 'Editorial Debate: Haas vs. Nowak')}</h3>
      <p style="font-size:12px; color:var(--muted); line-height:1.9;">
        ${t('布鲁克纳交响乐中最著名的版本之争莫过于第八交响曲。1887年初稿遭到指挥家列维拒绝后，布鲁克纳在沙尔克等弟子的过度干预下删削了第三乐章高潮与终曲展开部。罗伯特·哈斯版（1939）审慎剔除了非自愿的删减，使整部交响大教堂重获顶天立地的平衡感。君特·旺德、卡拉扬与切利比达克皆将其视作终生挚爱。', 'The historic debate centers on Robert Haas (1939) restoring cuts made under external pressure from Josef Schalk in the 1890 revision. Haas restores vital measures in the Adagio and Finale development, yielding the supreme architectural balance championed by Wand, Karajan, and Celibidache.')}
      </p>

      <h3 style="margin-top:16px;">${t('权威录音推荐：君特·旺德 (Günter Wand)', 'Recommended Interpretations: Günter Wand')}</h3>
      <div style="font-size:12px; color:var(--muted); line-height:1.8;">
        <ul>
          <li><b>1987 NDR Sinfonieorchester (Hamburg Musikhalle):</b> ${t('结构严谨如钢铁金字塔，声部复调透光感的巅峰。', 'Pyramidal structural logic, crystalline contrapuntal lucidity.')}</li>
          <li><b>1992 NDR Sinfonieorchester (Lübeck Cathedral):</b> ${t('在吕贝克大教堂神圣回响中录制，铜管圣咏如从天国降临。', 'Recorded in Lübeck Cathedral; breathtaking architectural resonance.')}</li>
          <li><b>2001 Berliner Philharmoniker (Berlin Philharmonie):</b> ${t('旺德生前最后绝唱，柏林爱乐无双弦乐与旺德严密对位的完美合体。', 'Wand\'s final testament uniting Berlin Philharmonic string depth with strict polyphony.')}</li>
        </ul>
      </div>

      <h3 style="margin-top:16px;">${t('布鲁克纳专有名词速查 (Glossary)', 'Brucknerian Glossary')}</h3>
      <div>
        ${(DATA.glossary || []).map(g => `
          <details style="margin-bottom:8px;">
            <summary><b>${tr(g, 'term')}</b></summary>
            <p style="font-size:11px; margin-top:5px; line-height:1.7;">${tr(g, 'definition')}</p>
          </details>
        `).join('')}
      </div>
    `;

    openDialog(t('版本考据、录音指南与名词表', 'Editions, Recordings & Glossary'), html);
  }

  // Bind Event Listeners
  function bindEvents() {
    if (el.langBtn) {
      el.langBtn.addEventListener('click', () => {
        state.lang = state.lang === 'zh' ? 'en' : 'zh';
        saveState();
        updateStaticLabels();
        renderMovementNav();
        renderQuickJumps();
        renderRadar();
        renderContent();
        showToast(state.lang === 'en' ? 'Switched to English' : '已切换为中文');
      });
    }

    if (el.playBtn) el.playBtn.addEventListener('click', togglePlay);
    if (el.prevBtn) el.prevBtn.addEventListener('click', () => switchMovement(state.movementIndex - 1));
    if (el.nextBtn) el.nextBtn.addEventListener('click', () => switchMovement(state.movementIndex + 1));
    if (el.back5Btn) el.back5Btn.addEventListener('click', () => seekTo(state.currentTime - 5));
    if (el.forward5Btn) el.forward5Btn.addEventListener('click', () => seekTo(state.currentTime + 5));

    if (el.loopBtn) {
      el.loopBtn.addEventListener('click', () => {
        state.loopStage = !state.loopStage;
        el.loopBtn.setAttribute('aria-pressed', state.loopStage);
        el.loopBtn.textContent = state.loopStage ? t('🔁 段落循环 [开]', '🔁 Loop [On]') : t('🔁 段落循环', '🔁 Loop');
      });
    }

    if (el.followBtn) {
      el.followBtn.addEventListener('click', () => {
        state.autoFollow = !state.autoFollow;
        el.followBtn.classList.toggle('active', state.autoFollow);
        el.followBtn.setAttribute('aria-pressed', state.autoFollow);
        el.followBtn.textContent = state.autoFollow ? t('📍 自动跟随', '📍 Follow') : t('📍 跟随 [关]', '📍 Follow [Off]');
      });
    }

    if (el.continuousBtn) {
      el.continuousBtn.addEventListener('click', () => {
        state.continuous = !state.continuous;
        el.continuousBtn.classList.toggle('active', state.continuous);
        el.continuousBtn.setAttribute('aria-pressed', state.continuous);
        el.continuousBtn.textContent = state.continuous ? t('⇥ 连续乐章', '⇥ Continuous') : t('⇥ 连续 [关]', '⇥ Continuous [Off]');
      });
    }

    if (el.speedSelect) {
      el.speedSelect.addEventListener('change', (e) => {
        state.speed = parseFloat(e.target.value) || 1;
        if (audioEl) audioEl.playbackRate = state.speed;
      });
    }

    if (el.muteBtn) {
      el.muteBtn.addEventListener('click', () => {
        state.muted = !state.muted;
        audioEl.muted = state.muted;
        el.muteBtn.textContent = state.muted ? '🔇' : '♪';
      });
    }

    if (el.scrubInput) {
      el.scrubInput.addEventListener('input', (e) => {
        seekTo(parseFloat(e.target.value));
      });
    }

    if (el.waveWrap) {
      el.waveWrap.addEventListener('mousemove', (e) => {
        const rect = el.waveWrap.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const hoverTime = pos * getCurDuration();
        if (el.waveHover) {
          el.waveHover.style.left = `${e.clientX - rect.left}px`;
          el.waveHover.textContent = Engine.formatTime(hoverTime);
          el.waveHover.hidden = false;
        }
      });
      el.waveWrap.addEventListener('mouseleave', () => {
        if (el.waveHover) el.waveHover.hidden = true;
      });
    }

    if (el.themeBtn) {
      el.themeBtn.addEventListener('click', () => {
        const curTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = curTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nextTheme);
        updateStaticLabels();
      });
    }

    if (el.btnSettings) el.btnSettings.addEventListener('click', showSettingsDialog);
    if (el.btnSources) el.btnSources.addEventListener('click', showSourcesDialog);
    if (el.dialogClose) el.dialogClose.addEventListener('click', closeDialog);

    window.addEventListener('resize', drawWaveform);
  }

  // Initialize
  function init() {
    updateStaticLabels();
    renderMovementNav();
    switchMovement(state.movementIndex);
    bindEvents();
    console.log('Bruckner 8 Guide initialized successfully.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
