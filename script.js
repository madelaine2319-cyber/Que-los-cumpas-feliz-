/* =========================================================
   CARTA — texto real del proyecto (sin cambios de contenido)
========================================================= */
const LETTER_PARAGRAPHS = [
  { text: 'Pastelito:', cls: 'letter-open' },
  { text: 'Con luces, con estrellas, con una torta y unas velitas que apagaste una por una. Y ahora que llegaste hasta aquí, quería dejarte algo que no pudiera apagarse con un soplido.' },
  { text: 'Hoy es tu cumpleaños, y aunque podría simplemente decirte “feliz cumpleaños” y desearte un día bonito, siento que contigo nunca me alcanza lo simple.' },
  { text: 'Porque hoy no solo celebro que cumplas un año más. Celebro que existas. Que estés aquí, con tu forma tan tuya de ser, con todo lo que te hace ser tú, incluso esas pequeñas cosas que quizás ni siquiera sabes que alguien puede llegar a querer tanto.' },
  { text: 'Me gusta pensar que antes de que yo pudiera conocerte, ya existía toda una vida llena de momentos que nunca vi. Días buenos, días difíciles, versiones de ti que no conocí. Y qué extraño y bonito es que, entre todos esos años, haya terminado coincidiendo contigo en este pedacito de la vida.' },
  { text: 'No sé si alguna vez te he dicho cuánto significa para mí poder quererte.' },
  { text: 'A veces el amor no se parece a las cosas que uno imagina. No siempre es perfecto, ni tranquilo, ni fácil de explicar. A veces es simplemente mirar a alguien y sentir que, de alguna manera, su existencia ya forma parte de la tuya.' },
  { text: 'Y eso me pasa contigo.' },
  { text: 'Por eso quise hacerte algo que fuera un poquito más que un saludo de cumpleaños. Algo que pudieras recorrer, tocar, mirar y finalmente llegar hasta aquí. Porque quería que, aunque fuera por unos minutos, sintieras lo especial que eres para mí.' },
  { text: 'Ojalá este nuevo año de tu vida te encuentre siendo cada vez más tú. Que tengas motivos para reírte hasta que te duela la cara, momentos que quieras recordar para siempre y días en los que puedas mirar alrededor y sentir que estás exactamente donde quieres estar.' },
  { text: 'Y si alguna vez dudas de cuánto puedes significar para alguien, quiero que recuerdes esto:' },
  { text: 'yo te miro y veo muchísimo más de lo que probablemente imaginas.' },
  { text: 'Te amo, Pastelito.', cls: 'letter-close' },
  { text: 'Y qué bonito que existas.', cls: 'letter-close' }
];

/* páginas del libro final (mismas líneas que ya existían) */
const BOOK_PAGES = [
  'Hay días que merecen ser celebrados de una forma distinta.',
  'Y este es uno de ellos.',
  'Porque hoy no comienza solamente un nuevo año de tu vida…',
  'también comienza una pequeña historia hecha especialmente para ti.'
];

const NUM_CANDLES = 5;

/* =========================================================
   UTILIDADES
========================================================= */
const $ = (sel) => document.querySelector(sel);
const rand = (min, max) => Math.random() * (max - min) + min;

/* =========================================================
   MOTOR DE AUDIO (sintetizado con Web Audio API)
   No se usan archivos externos: todos los sonidos y la música
   ambiental se generan por código, así que no requieren
   descargas ni licencias. Si más adelante quieres reemplazar
   la música por una pista tuya con licencia, basta con usar
   un <audio src="assets/tu-musica.mp3"> en vez de startMusic().
========================================================= */
const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let musicOn = false;
  let musicTimer = null;
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  }

  function noiseBurst({ dur, freqType, freq, q, gainVal }) {
    ensureCtx();
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = freqType;
    filter.frequency.value = freq;
    if (q) filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = gainVal;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  }

  function blow() {
    noiseBurst({ dur: 0.4, freqType: 'lowpass', freq: 850, gainVal: 0.16 });
  }
  function pageTurn() {
    noiseBurst({ dur: 0.3, freqType: 'highpass', freq: 1300, gainVal: 0.1 });
  }
  function paper() {
    noiseBurst({ dur: 0.55, freqType: 'bandpass', freq: 2200, q: 0.6, gainVal: 0.09 });
  }

  function pluck(freq, time) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = freq * 2;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.045, time + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 3.4);
    o.connect(g);
    o2.connect(g);
    g.connect(masterGain);
    o.start(time);
    o2.start(time);
    o.stop(time + 3.5);
    o2.stop(time + 3.5);
  }

  function startMusic() {
    ensureCtx();
    if (musicOn) return;
    musicOn = true;
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.0001;
    masterGain.connect(ctx.destination);
    masterGain.gain.setTargetAtTime(0.32, ctx.currentTime, 1.2);
    const step = () => {
      if (!musicOn) return;
      const note = scale[Math.floor(Math.random() * scale.length)];
      pluck(note, ctx.currentTime + 0.05);
      if (Math.random() < 0.45) pluck(note * 1.5, ctx.currentTime + 1.7);
      musicTimer = setTimeout(step, 2400 + Math.random() * 1600);
    };
    step();
  }
  function stopMusic() {
    musicOn = false;
    if (musicTimer) clearTimeout(musicTimer);
    if (masterGain) masterGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.8);
  }
  function toggleMusic() {
    ensureCtx();
    if (musicOn) stopMusic();
    else startMusic();
    return musicOn;
  }
  function unlock() {
    ensureCtx();
  }

  return { blow, pageTurn, paper, toggleMusic, unlock, isMusicOn: () => musicOn };
})();

const btnSound = $('#btn-sound');
btnSound.addEventListener('click', () => {
  const on = AudioEngine.toggleMusic();
  btnSound.textContent = on ? '🔊' : '🔈';
});

/* =========================================================
   SISTEMA DE PARTÍCULAS (canvas de fondo) — cielo elegante
========================================================= */
const canvas = $('#bg-canvas');
const ctx = canvas.getContext('2d');
let W, H, DPR;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

let stars = [];
let floaters = [];
let bursts = [];
let boostUntil = 0;

function initStars() {
  stars = [];
  const count = Math.floor((W * H) / 15000);
  for (let i = 0; i < count; i++) {
    const sizeClass = Math.random();
    stars.push({
      x: rand(0, W),
      y: rand(0, H * 0.88),
      r: sizeClass < 0.72 ? rand(0.5, 1.1) : sizeClass < 0.93 ? rand(1.1, 1.7) : rand(1.7, 2.3),
      baseAlpha: rand(0.3, 0.85),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.3, 0.9),
      twinkle: Math.random() < 0.3,
      featured: Math.random() < 0.12,
      driftPhase: rand(0, Math.PI * 2)
    });
  }
  floaters = [];
  const fcount = Math.max(4, Math.floor((W * H) / 160000));
  for (let i = 0; i < fcount; i++) floaters.push(makeFloater());
}
function makeFloater() {
  return {
    x: rand(0, W),
    y: rand(H * 0.25, H),
    r: rand(1, 2.2),
    vy: -rand(2, 5) / 60,
    vx: rand(-1, 1) / 60,
    alpha: rand(0.1, 0.35),
    hue: Math.random() < 0.5 ? '243,218,158' : '220,232,214'
  };
}

function boostStars(ms = 2600) {
  boostUntil = performance.now() + ms;
}

function addSparkBurst(x, y, opts = {}) {
  const n = opts.count || 14;
  const colors = opts.colors || ['255,177,92', '243,218,158', '220,232,214'];
  for (let i = 0; i < n; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(opts.minSpeed || 0.8, opts.maxSpeed || 2.6);
    bursts.push({
      type: 'spark',
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (opts.lift || 0.4),
      life: 0,
      maxLife: rand(40, 75),
      r: rand(1, 2.6),
      color: colors[Math.floor(Math.random() * colors.length)],
      gravity: opts.gravity ?? 0.02
    });
  }
}

function addConfettiBurst(x, y, count = 26) {
  const colors = ['201,162,75', '243,218,158', '242,232,210', '28,68,51'];
  for (let i = 0; i < count; i++) {
    const angle = rand(-Math.PI, 0);
    const speed = rand(2, 5.5);
    bursts.push({
      type: 'confetti',
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 0,
      maxLife: rand(90, 150),
      size: rand(3, 6),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.2, 0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      gravity: 0.055
    });
  }
}

function drawStars(t) {
  const boosted = performance.now() < boostUntil;
  for (const s of stars) {
    let a = s.baseAlpha;
    if (s.twinkle) a = s.baseAlpha * (0.55 + 0.45 * Math.sin((t / 1400) * s.speed + s.phase));
    if (s.featured && boosted) a = Math.min(1, a + 0.35);
    const drift = Math.sin(t / 26000 + s.driftPhase) * 3;
    ctx.beginPath();
    ctx.fillStyle = `rgba(242,232,210,${a.toFixed(3)})`;
    ctx.arc(s.x + drift, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    if (s.r > 1.5) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(242,232,210,${(a * 0.22).toFixed(3)})`;
      ctx.arc(s.x + drift, s.y, s.r * 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFloaters() {
  for (const f of floaters) {
    f.x += f.vx;
    f.y += f.vy;
    if (f.y < -10) Object.assign(f, makeFloater(), { y: H + 10 });
    if (f.x < -10) f.x = W + 10;
    if (f.x > W + 10) f.x = -10;
    ctx.beginPath();
    ctx.fillStyle = `rgba(${f.hue},${f.alpha})`;
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBursts() {
  bursts = bursts.filter((p) => p.life < p.maxLife);
  for (const p of bursts) {
    p.life++;
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    const progress = p.life / p.maxLife;
    const alpha = 1 - progress;
    if (p.type === 'spark') {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.color},${alpha.toFixed(3)})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'confetti') {
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = `rgba(${p.color},${alpha.toFixed(3)})`;
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
      ctx.restore();
    }
  }
}

let celebrateTimer = null;
let sparkleInterval = null;

function loop(t) {
  ctx.clearRect(0, 0, W, H);
  drawStars(t);
  drawFloaters();
  drawBursts();
  requestAnimationFrame(loop);
}
initStars();
requestAnimationFrame(loop);

function startCelebration() {
  let done = 0;
  const total = 9;
  const fire = () => {
    addConfettiBurst(rand(W * 0.15, W * 0.85), rand(H * 0.15, H * 0.4), 26);
    addSparkBurst(rand(W * 0.15, W * 0.85), rand(H * 0.15, H * 0.5), {
      count: 18, minSpeed: 1, maxSpeed: 3, gravity: 0.01
    });
    done++;
    if (done < total) celebrateTimer = setTimeout(fire, 420);
  };
  fire();
}

function sparkleAt(el, opts = {}) {
  const rect = el.getBoundingClientRect();
  addSparkBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, {
    count: 12, minSpeed: 0.5, maxSpeed: 1.6, lift: 0.4, gravity: 0.01, ...opts
  });
}

/* =========================================================
   CONTROL DE ESCENAS
========================================================= */
const scenes = {
  intro: $('#scene-intro'),
  book: $('#scene-book'),
  night: $('#scene-night'),
  letter: $('#scene-letter')
};

function goTo(name) {
  Object.values(scenes).forEach((s) => s.classList.remove('active'));
  scenes[name].classList.add('active');
}

/* --- Escena 1: intro --- */
const line1 = $('.line-1');
const line2 = $('.line-2');
const btnStart = $('#btn-comenzar');

function playIntro() {
  goTo('intro');
  setTimeout(() => line1.classList.add('show'), 500);
  setTimeout(() => line2.classList.add('show'), 3000);
  setTimeout(() => btnStart.classList.add('show'), 5400);
}

btnStart.addEventListener('click', () => {
  AudioEngine.unlock();
  AudioEngine.toggleMusic();
  btnSound.textContent = '🔊';
  sparkleAt(btnStart, { count: 16 });
  goTo('book');
  playBookScene();
});

/* --- Escena 2: noche / personaje / mensaje / deseo / torta --- */
const character = $('#character');
const sceneMessage = $('#scene-message');
const hintText = $('#hint-text');
const cakeWrap = $('#cake-wrap');
const candlesEl = $('#candles');
const btnContinue = $('#btn-continue');
const sparkleAnchor = null;

let candlesLeft = NUM_CANDLES;
let walkSparkleInterval = null;

function setMessage(html, extraClass) {
  sceneMessage.classList.remove('show');
  setTimeout(() => {
    sceneMessage.innerHTML = html;
    sceneMessage.className = 'scene-message' + (extraClass ? ' ' + extraClass : '');
    requestAnimationFrame(() => sceneMessage.classList.add('show'));
  }, 900);
}

function buildCandles() {
  candlesEl.innerHTML = '';
  candlesLeft = NUM_CANDLES;
  for (let i = 0; i < NUM_CANDLES; i++) {
    const c = document.createElement('div');
    c.className = 'candle';
    c.innerHTML = `
      <div class="flame-wrap">
        <div class="flame-glow"></div>
        <div class="flame"></div>
      </div>
      <div class="candle-stick"></div>
    `;
    c.addEventListener('click', () => extinguish(c));
    candlesEl.appendChild(c);
  }
}

function extinguish(candleEl) {
  if (candleEl.classList.contains('out')) return;
  candleEl.classList.add('out');
  candlesLeft--;
  AudioEngine.blow();

  const rect = candleEl.querySelector('.flame').getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top;

  spawnSmoke(x, y);
  addSparkBurst(x, y, { count: 10, minSpeed: 0.4, maxSpeed: 1.4, lift: 0.4, gravity: 0.012 });

  if (candlesLeft <= 0) {
    hintText.classList.remove('show');
    setTimeout(() => {
      boostStars(3200);
      startCelebration();
      setTimeout(() => {
        setMessage(
          '<p class="msg-title">Hay deseos que espero<br>que se cumplan contigo. <span class="heart">❤️</span></p>'
        );
      }, 1600);
      setTimeout(() => {
        btnContinue.classList.add('show');
      }, 5200);
    }, 900);
  }
}

function spawnSmoke(x, y) {
  for (let i = 0; i < 3; i++) {
    const s = document.createElement('div');
    s.className = 'smoke';
    s.style.left = x + 'px';
    s.style.top = (y - i * 4) + 'px';
    s.style.setProperty('--sx', rand(-14, 14) + 'px');
    s.style.animationDelay = (i * 0.1) + 's';
    document.body.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }
}

function playNightEntrance() {
  character.classList.remove('walk-in', 'settled');
  character.style.left = '-42vw';
  character.style.opacity = '0';
  sceneMessage.classList.remove('show');
  sceneMessage.innerHTML = '<p class="msg-title">Feliz cumpleaños <span class="heart">❤️</span></p><p class="msg-sub">Esta celebración es para ti.</p>';
  sceneMessage.className = 'scene-message';
  btnContinue.classList.remove('show');
  hintText.classList.remove('show');
  cakeWrap.classList.remove('show');
  buildCandles();

  requestAnimationFrame(() => character.classList.add('walk-in'));

  // destellos suaves y lentos alrededor del personaje mientras camina
  walkSparkleInterval = setInterval(() => {
    const rect = character.getBoundingClientRect();
    addSparkBurst(rect.left + rect.width * rand(0.2, 0.8), rect.top + rect.height * rand(0.25, 0.65), {
      count: 2, minSpeed: 0.15, maxSpeed: 0.4, lift: 0.2, gravity: -0.004
    });
  }, 420);

  // llega al centro (caminata lenta) y se hace a un lado con delicadeza
  setTimeout(() => {
    character.classList.remove('walk-in');
    character.classList.add('settled');
    clearInterval(walkSparkleInterval);
  }, 6600);

  // pequeña pausa, luego mensaje y torta aparecen juntos, lentamente
  setTimeout(() => {
    sceneMessage.classList.add('show');
    cakeWrap.classList.add('show');
  }, 8200);

  // pausa larga disfrutando el mensaje, luego el momento del deseo
  setTimeout(() => {
    setMessage('<p class="msg-wish">Pide un deseo&hellip; ✨</p>');
  }, 12200);

  // el deseo se desvanece y aparece la invitación a las velas
  setTimeout(() => {
    sceneMessage.classList.remove('show');
  }, 16200);
  setTimeout(() => {
    hintText.classList.add('show');
  }, 17200);
}

btnContinue.addEventListener('click', () => {
  if (celebrateTimer) clearTimeout(celebrateTimer);
  sparkleAt(btnContinue, { count: 14 });
  goTo('letter');
  playLetterScene();
});

/* --- Escena 3: sobre / carta --- */
const envelopeWrap = $('#envelope-wrap');
const envelope = $('#envelope');
const letterPage = $('#letter-page');
const letterBody = $('#letter-body');
let letterOpened = false;

letterBody.innerHTML = LETTER_PARAGRAPHS.map((p) => `<p class="${p.cls || ''}">${p.text}</p>`).join('');
const letterParaEls = Array.from(letterBody.querySelectorAll('p'));

function playLetterScene() {
  letterOpened = false;
  envelopeWrap.classList.remove('hide');
  envelope.classList.remove('open');
  letterPage.classList.remove('show');
  letterParaEls.forEach((p) => p.classList.remove('show'));
}

envelope.addEventListener('click', () => {
  if (letterOpened) return;
  letterOpened = true;
  AudioEngine.paper();
  envelope.classList.add('open');
  sparkleAt(envelope, { count: 18, maxSpeed: 2 });

  setTimeout(() => {
    envelopeWrap.classList.add('hide');
  }, 1900);

  setTimeout(() => {
    letterPage.classList.add('show');
    // revelación progresiva, párrafo por párrafo
    letterParaEls.forEach((p, i) => {
      setTimeout(() => p.classList.add('show'), i * 950);
    });
  }, 2500);
});

/* --- Escena inicial 2: libro (avance manual) --- */
const book = $('#book');
const bookCover = $('#book-cover');
const storyLine = $('#story-line');
const bookHint = $('#book-hint');
let bookPageIndex = -1; // -1 = cerrado
let bookBusy = false;
let bookSparkleInterval = null;

function playBookScene() {
  bookPageIndex = -1;
  bookBusy = false;
  book.classList.remove('opened', 'closing');
  bookCover.classList.remove('opened');
  storyLine.textContent = '';
  storyLine.classList.remove('show', 'turning');
  bookHint.textContent = 'Toca para abrir';
  bookHint.classList.add('show');
}

function showBookPage(i) {
  storyLine.classList.add('turning');
  setTimeout(() => {
    storyLine.textContent = BOOK_PAGES[i];
    storyLine.classList.remove('turning');
    requestAnimationFrame(() => storyLine.classList.add('show'));
  }, 420);
}

book.addEventListener('click', () => {
  if (bookBusy) return;

  // libro cerrado -> se abre
  if (bookPageIndex === -1) {
    bookBusy = true;
    AudioEngine.pageTurn();
    book.classList.add('opened');
    bookCover.classList.add('opened');
    sparkleAt(book, { count: 16, maxSpeed: 1.8 });
    bookHint.classList.remove('show');

    bookSparkleInterval = setInterval(() => {
      const rect = book.getBoundingClientRect();
      addSparkBurst(rect.left + rand(0, rect.width), rect.top + rand(0, rect.height), {
        count: 4, minSpeed: 0.25, maxSpeed: 0.7, lift: 0.4, gravity: -0.004
      });
    }, 1100);

    setTimeout(() => {
      bookPageIndex = 0;
      showBookPage(bookPageIndex);
      bookHint.textContent = 'Toca para continuar';
      setTimeout(() => {
        bookHint.classList.add('show');
        bookBusy = false;
      }, 900);
    }, 2600);
    return;
  }

  // avanzar página
  if (bookPageIndex < BOOK_PAGES.length - 1) {
    bookBusy = true;
    AudioEngine.pageTurn();
    bookHint.classList.remove('show');
    bookPageIndex++;
    showBookPage(bookPageIndex);
    setTimeout(() => {
      if (bookPageIndex === BOOK_PAGES.length - 1) {
        bookHint.textContent = 'Toca para continuar';
      }
      bookHint.classList.add('show');
      bookBusy = false;
    }, 1000);
    return;
  }

  // última página -> el libro se cierra y comienza la historia
  bookBusy = true;
  bookHint.classList.remove('show');
  clearInterval(bookSparkleInterval);
  AudioEngine.pageTurn();
  storyLine.classList.remove('show');
  setTimeout(() => {
    bookCover.classList.remove('opened');
    book.classList.remove('opened');
  }, 500);
  setTimeout(() => {
    boostStars(3000);
    addSparkBurst(W / 2, H * 0.4, { count: 24, minSpeed: 0.3, maxSpeed: 1, lift: 0.5, gravity: -0.005 });
    book.classList.add('closing');
  }, 1800);
  setTimeout(() => {
    goTo('night');
    playNightEntrance();
  }, 4600);
});

/* =========================================================
   INICIO
========================================================= */
playIntro();
