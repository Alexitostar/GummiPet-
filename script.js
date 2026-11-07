(() => {
  const stage = document.getElementById('gameContainer');
  const actor = document.getElementById('gummigoo');
  const cookies = document.getElementById('cookieContainer');
  const hearts = document.getElementById('heartsContainer');

  const SIZE = 1000, ACTOR_W = 226, SPEED = 3.2;
  
  // Rutas relativas explícitas para evitar errores en GitHub Pages
  const music = new Audio('./song.mp3');
  music.loop = true;
  music.preload = 'auto';
  music.volume = 0.75;
  
  const eatSound = new Audio('./comer.mp3');
  eatSound.preload = 'auto';

  const state = { x: 387, direction: 1, target: null, eating: false, lastTime: 0, pauseUntil: 0 };
  let audioStarted = false;

  function startMusic() {
    if (audioStarted && !music.paused) return;
    
    music.play().then(() => {
      audioStarted = true;
      // Una vez que suena, quitamos los detectores globales de arranque
      ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
        window.removeEventListener(evt, startMusic);
      });
    }).catch((err) => {
      console.warn('Esperando interacción válida para reproducir song.mp3:', err);
      audioStarted = false;
    });
  }

  // Escuchar en toda la ventana con eventos estándar que desbloquean audio en Chrome y Safari
  ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, startMusic, { passive: true });
  });

  function placeCookie(event) {
    startMusic();
    if (state.target || state.eating) return;
    const rect = stage.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const x = Math.max(25, Math.min(SIZE - 75,
      (event.clientX - rect.left) * scaleX - 25));
    const cookie = document.createElement('div');
    cookie.className = 'cookie-bunny';
    const eye = document.createElement('span');
    eye.className = 'eye';
    cookie.appendChild(eye);
    cookie.style.left = `${x}px`;
    cookies.appendChild(cookie);
    state.target = { x: x + 25, element: cookie };
  }

  let lastActorTap = 0;
  function pauseBriefly() {
    state.pauseUntil = performance.now() + 2000;
    actor.src = './gummigoo.png';
  }

  actor.addEventListener('dblclick', (event) => {
    event.preventDefault();
    event.stopPropagation();
    startMusic();
    pauseBriefly();
  });

  actor.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    startMusic(); // Asegura que tocar a Gummigoo también active la música
    const now = performance.now();
    if (now - lastActorTap < 350) {
      pauseBriefly();
      lastActorTap = 0;
    } else {
      lastActorTap = now;
    }
  }, { passive: true });

  stage.addEventListener('pointerdown', placeCookie, { passive: true });
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && audioStarted && music.paused) {
      music.play().catch(() => { audioStarted = false; });
    }
  });

  function showHearts() {
    for (let i = 0; i < 7; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart-pop';
      heart.textContent = '💗';
      heart.style.left = `${state.x + 75 + Math.random() * 90 - 25}px`;
      heart.style.bottom = `${105 + Math.random() * 65}px`;
      heart.style.animationDelay = `${i * 100}ms`;
      hearts.appendChild(heart);
      heart.addEventListener('animationend', () => heart.remove(), { once: true });
    }
  }

  function face(direction) {
    if (state.direction !== direction) {
      state.direction = direction;
      actor.src = direction > 0 ? './gummigoo.gif' : './gummigoo_izquierda.gif';
    }
  }

  function update(time) {
    const dt = state.lastTime ? Math.min((time - state.lastTime) / 16.667, 2.5) : 1;
    state.lastTime = time;

    if (time < state.pauseUntil) {
      actor.style.left = `${state.x}px`;
      requestAnimationFrame(update);
      return;
    } else if (state.pauseUntil !== 0) {
      state.pauseUntil = 0;
      actor.src = state.direction > 0 ? './gummigoo.gif' : './gummigoo_izquierda.gif';
    }

    if (state.target && !state.eating) {
      const center = state.x + ACTOR_W / 2;
      const distance = state.target.x - center;
      if (Math.abs(distance) <= SPEED * dt + 2) {
        state.x = Math.max(0, Math.min(SIZE - ACTOR_W, state.target.x - ACTOR_W / 2));
        state.eating = true;
        actor.src = './gummigoo.png';
        state.target.element.remove();
        state.target = null;
        eatSound.currentTime = 0;
        eatSound.play().catch(() => {});
        showHearts();

        setTimeout(() => {
          state.x = 387;
          state.direction = 1;
          state.target = null;
          state.eating = false;
          state.pauseUntil = 0;
          cookies.replaceChildren();
          actor.src = './gummigoo.gif';
          actor.style.left = `${state.x}px`;
        }, 1400);
      } else {
        face(distance > 0 ? 1 : -1);
        state.x += Math.sign(distance) * SPEED * dt;
      }
    } else if (!state.eating) {
      state.x += state.direction * SPEED * dt;
      if (state.x <= 0) {
        state.x = 0;
        face(1);
      } else if (state.x >= SIZE - ACTOR_W) {
        state.x = SIZE - ACTOR_W;
        face(-1);
      }
    }

    actor.style.left = `${state.x}px`;
    requestAnimationFrame(update);
  }

  try {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  } catch (_) {}
  
  requestAnimationFrame(update);
})();
