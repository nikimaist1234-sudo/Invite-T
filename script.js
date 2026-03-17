/* ===========================
   XO Nights Invite + Quiz
   Updated script.js
   =========================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- Elements ---------- */
  const startBtn = document.getElementById("startBtn");
  const balloonContainer = document.getElementById("balloonContainer");
  const music = document.getElementById("bgMusic");

  /* ✅ Change 1: Removed invite-open email/webhook tracking completely */

  /* ---------- Balloon game config ---------- */
  // ✅ Change 4: 16 balloons total
  const BALLOON_COUNT = 16;

  // ✅ XO rain for 5 seconds
  const XO_RAIN_DURATION_MS = 5000;
  const XO_COLORS = ["#111", "#f2f2f2", "#777"]; // black, white, grey

  let poppedCount = 0;
  let musicStarted = false;
  let finishing = false;

  // Prevent touch scrolling while locked (mobile)
  function preventScroll(e) {
    if (document.body.classList.contains("locked")) {
      e.preventDefault();
    }
  }
  window.addEventListener("touchmove", preventScroll, { passive: false });

  /* ---------- Page nav (Page0 -> Page1) ---------- */
  function showOnlyPage(pageNumber) {
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    const el = document.getElementById("page" + pageNumber);
    if (el) el.classList.add("active");
  }

  /* ---------- Music ---------- */
  function startMusic() {
    if (musicStarted || !music) return;

    music.volume = 0;
    music.play().catch(() => {});
    musicStarted = true;

    const fade = setInterval(() => {
      if (music.volume < 0.6) {
        music.volume = Math.min(0.6, music.volume + 0.05);
      } else {
        clearInterval(fade);
      }
    }, 180);
  }

  /* ---------- Balloon creation ---------- */
  function buildBalloons(count) {
    if (!balloonContainer) return;

    balloonContainer.innerHTML = "";
    poppedCount = 0;
    finishing = false;

    const rect = balloonContainer.getBoundingClientRect();
    const pad = 44;

    // Make a balanced list: 8 white + 8 light grey
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(i < count / 2 ? "white" : "lightgrey");
    }
    shuffle(colors);

    // Place balloons with simple "keep distance" logic
    const placed = [];
    const minDist = 64;

    for (let i = 0; i < count; i++) {
      const b = document.createElement("div");
      b.className = "balloon-piece " + colors[i];

      let x, y;
      let tries = 0;

      do {
        x = rand(pad, rect.width - pad);
        y = rand(pad, rect.height - pad);
        tries++;
        if (tries > 200) break;
      } while (!farEnough(x, y, placed, minDist));

      placed.push({ x, y });

      b.style.left = x + "px";
      b.style.top = y + "px";
      b.style.animationDuration = rand(2200, 3400) + "ms";
      b.style.animationDelay = rand(0, 450) + "ms";

      b.addEventListener("click", () => popBalloon(b));
      balloonContainer.appendChild(b);
    }
  }

  function popBalloon(el) {
    if (finishing) return;
    if (el.classList.contains("popped")) return;

    el.classList.add("popped");
    setTimeout(() => el.remove(), 220);

    poppedCount++;

    if (poppedCount >= BALLOON_COUNT) {
      finishing = true;
      // ✅ Change 5: XO rains on Page 1 for 5 seconds, then fade into invite
      startXORain(XO_RAIN_DURATION_MS);
    }
  }

  /* ---------- XO Rain ---------- */
  function startXORain(durationMs) {
    // ensure still on page1
    const page1 = document.getElementById("page1");

    let layer = document.getElementById("xoRainLayer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "xoRainLayer";
      document.body.appendChild(layer);
    }

    const start = Date.now();

    const spawn = () => {
      // spawn a small burst every tick
      const burst = rand(10, 18);
      for (let i = 0; i < burst; i++) {
        const piece = document.createElement("div");
        piece.className = "xo-piece";
        piece.textContent = "XO";

        const left = rand(0, window.innerWidth);
        const duration = rand(1800, 3200);
        const drift = rand(-140, 140) + "px";
        const rot = rand(-540, 540) + "deg";

        piece.style.left = left + "px";
        piece.style.animationDuration = duration + "ms";
        piece.style.color = XO_COLORS[rand(0, XO_COLORS.length - 1)];
        piece.style.setProperty("--drift", drift);
        piece.style.setProperty("--rot", rot);

        layer.appendChild(piece);
        setTimeout(() => piece.remove(), duration + 150);
      }
    };

    // start raining immediately
    spawn();
    const rainTimer = setInterval(() => {
      spawn();
      if (Date.now() - start >= durationMs) {
        clearInterval(rainTimer);

        // fade page1 out, then reveal scroll invite
        if (page1) page1.classList.add("fade-out");

        setTimeout(() => {
          cleanupXORain();
          finishGame();
        }, 850);
      }
    }, 140);
  }

  function cleanupXORain() {
    const layer = document.getElementById("xoRainLayer");
    if (layer) layer.remove();
  }

  /* ---------- Unlock scrolling after balloons ---------- */
  function finishGame() {
    document.body.classList.remove("locked");
    document.body.classList.add("scroll-mode");

    const page2 = document.getElementById("page2");
    setTimeout(() => {
      page2?.scrollIntoView({ behavior: "smooth" });
    }, 350);
  }

  /* ---------- Helpers ---------- */
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function farEnough(x, y, placed, minDist) {
    for (const p of placed) {
      const dx = x - p.x;
      const dy = y - p.y;
      if (Math.hypot(dx, dy) < minDist) return false;
    }
    return true;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  /* ---------- Start button ---------- */
  function startExperience() {
    showOnlyPage(1);
    startMusic();              // ✅ Change 3 uses montreal.mp3 via HTML src
    buildBalloons(BALLOON_COUNT);
  }

  // Mobile-proof start
  if (startBtn) {
    let started = false;
    const onceStart = (e) => {
      if (started) return;
      started = true;
      e?.preventDefault?.();
      startExperience();
    };

    startBtn.addEventListener("pointerup", onceStart, { passive: false });
    startBtn.addEventListener("touchend", onceStart, { passive: false });
    startBtn.addEventListener("click", onceStart);
  }

  /* ===========================
     QUIZ (unchanged)
     =========================== */

  const openQuizBtn = document.getElementById("openQuizBtn");
  const quizBackBtn = document.getElementById("quizBackBtn");
  const quizCloseBtn = document.getElementById("quizCloseBtn");
  const quizFinishBtn = document.getElementById("quizFinishBtn");
  const quizRetryBtn = document.getElementById("quizRetryBtn");

  const quizScreen = document.getElementById("pageQuiz");
  const quizForm = document.getElementById("quizForm");
  const quizResult = document.getElementById("quizResult");
  const quizResultInner = document.getElementById("quizResultInner");
  const quizOverlay = document.getElementById("quizOverlay");
  const resultCover = document.getElementById("resultCover");
  const resultBlurb = document.getElementById("resultBlurb");
  const guestNameInput = document.getElementById("guestName");

  const resultAudio = document.getElementById("resultAudio");

  const SONG_KEYS = [
    "coming-down",
    "the-fall",
    "the-morning",
    "wicked-games",
    "high-for-this",
  ];

  const SONG_PRETTY = {
    "coming-down": "Coming Down",
    "the-fall": "The Fall",
    "the-morning": "The Morning",
    "wicked-games": "Wicked Games",
    "high-for-this": "High for This",
  };

  const SONG_BLURB = {
    "coming-down": "You feel things deeply but you keep it cute.",
    "the-fall": "Big energy, big feelings, big main-character moments.",
    "the-morning": "Confidence is your thing. You show up, you shine.",
    "wicked-games": "You're playful, bold, and you know the power of a little chaos.",
    "high-for-this": "Magnetic. Fearless. The vibe wherever you go.",
  };

  let _inviteWasPlaying = false;
  let _inviteTime = 0;
  let _scrollYBeforeQuiz = 0;

  function stopResultAudio() {
    if (!resultAudio) return;
    resultAudio.pause();
    resultAudio.currentTime = 0;
    resultAudio.removeAttribute("src");
  }

  function enterQuizAudioMode() {
    stopResultAudio();

    if (!music) return;
    _inviteWasPlaying = !music.paused;
    _inviteTime = music.currentTime || 0;
    music.pause();
  }

  function exitQuizAudioMode() {
    stopResultAudio();

    if (!music) return;
    if (_inviteWasPlaying) {
      try {
        music.currentTime = _inviteTime || 0;
      } catch (e) {}
      music.play().catch(() => {});
    }
  }

  function resetQuizUI() {
    quizForm?.reset();

    if (quizResult) quizResult.style.display = "none";
    if (quizResultInner) {
      quizResultInner.classList.remove("show");
      quizResultInner.innerHTML = "";
    }
    if (resultCover) {
      resultCover.classList.remove("show");
      resultCover.removeAttribute("src");
    }
    if (resultBlurb) resultBlurb.textContent = "";
    quizOverlay?.classList.remove("on");
  }

  function openQuiz() {
    _scrollYBeforeQuiz = window.scrollY || 0;
    enterQuizAudioMode();
    resetQuizUI();

    document.body.classList.add("quiz-open");
    quizScreen?.setAttribute("aria-hidden", "false");

    setTimeout(() => {
      if (quizScreen) quizScreen.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 0);
  }

  function closeQuiz() {
    document.body.classList.remove("quiz-open");
    quizScreen?.setAttribute("aria-hidden", "true");
    stopResultAudio();

    setTimeout(() => {
      window.scrollTo({ top: _scrollYBeforeQuiz, behavior: "auto" });
    }, 0);

    exitQuizAudioMode();
  }

  function computeQuizResult() {
    if (!quizForm) return { error: "Quiz not found." };

    const guestName = (guestNameInput?.value || "").trim();
    if (!guestName) return { error: "Enter your name first." };

    const scores = Object.fromEntries(SONG_KEYS.map((k) => [k, 0]));
    const data = new FormData(quizForm);

    for (const [key, value] of data.entries()) {
      if (key === "guestName") continue;
      if (scores[value] !== undefined) scores[value] += 1;
    }

    for (let i = 1; i <= 6; i++) {
      if (!data.get("q" + i)) return { error: "Answer all 6 questions first." };
    }

    const max = Math.max(...Object.values(scores));
    const top = Object.keys(scores).filter((k) => scores[k] === max);
    const chosen = top[Math.floor(Math.random() * top.length)];

    return { chosen, guestName };
  }

  function playResultSong(songKey) {
    music?.pause();

    if (resultCover) {
      resultCover.src = `${songKey}.jpg`;
      resultCover.classList.add("show");
    }

    if (resultAudio) {
      resultAudio.pause();
      resultAudio.currentTime = 0;
      resultAudio.src = `${songKey}.mp3`;
      resultAudio.load();
      resultAudio.play().catch(() => {});
    }
  }

  function revealQuizResult(songKey, guestName) {
    if (!quizResult || !quizResultInner) return;

    quizResult.style.display = "block";

    quizResultInner.classList.remove("show");
    quizResultInner.innerHTML = `
      <h2>${guestName}, you are <span>${SONG_PRETTY[songKey] || "a Mystery Track"}</span></h2>
    `;

    if (resultBlurb) resultBlurb.textContent = SONG_BLURB[songKey] || "";

    if (quizOverlay) {
      quizOverlay.classList.add("on");
      setTimeout(() => quizOverlay.classList.remove("on"), 900);
    }

    requestAnimationFrame(() => quizResultInner.classList.add("show"));

    playResultSong(songKey);

    const scrollToFullResult = () => {
      quizResult.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => window.scrollBy({ top: -16, left: 0, behavior: "auto" }), 350);
    };

    setTimeout(scrollToFullResult, 180);

    if (resultCover) {
      resultCover.onload = () => {
        setTimeout(scrollToFullResult, 60);
      };
    }
  }

  openQuizBtn?.addEventListener("click", openQuiz);
  quizBackBtn?.addEventListener("click", closeQuiz);
  quizCloseBtn?.addEventListener("click", closeQuiz);

  quizRetryBtn?.addEventListener("click", () => {
    resetQuizUI();
    if (quizScreen) quizScreen.scrollTop = 0;
  });

  quizFinishBtn?.addEventListener("click", () => {
    const res = computeQuizResult();

    if (res.error) {
      if (!quizResult || !quizResultInner) return;
      quizResult.style.display = "block";
      quizResultInner.classList.remove("show");
      quizResultInner.innerHTML = `<h2>Hold up</h2><p>${res.error}</p>`;
      if (resultBlurb) resultBlurb.textContent = "";
      requestAnimationFrame(() => quizResultInner.classList.add("show"));
      setTimeout(() => quizResult.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
      return;
    }

    revealQuizResult(res.chosen, res.guestName);
  });
});
