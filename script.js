/* ===========================
   XO Nights Invite + Quiz
   Full working script.js
   =========================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- Elements ---------- */
  const startBtn = document.getElementById("startBtn");
  const balloonContainer = document.getElementById("balloonContainer");
  const music = document.getElementById("bgMusic");

  /* =========================================================
     INVITE OPEN TRACKER (GitHub Pages friendly) + ANTI-SPAM
     ========================================================= */

  // Paste your webhook URL here (Google Apps Script Web App URL).
  // If left empty, nothing will be sent.
  const INVITE_OPEN_WEBHOOK = "https://script.google.com/macros/s/AKfycbwLTcX8Oi0fdLvEiUd0oqUrB7-tTzLxWi4Rl9bX2WNvC-Qj1UX8z4Fs40YWerslR6hYQA/exec";

  // Anti-spam: only notify once per device per 24 hours
  const INVITE_ANTISPAM_KEY = "xo_invite_open_notified_v1";
  const INVITE_ANTISPAM_TTL_MS = 24 * 60 * 60 * 1000;

  function shouldSendOpenPing() {
    try {
      const last = Number(localStorage.getItem(INVITE_ANTISPAM_KEY) || "0");
      if (!last) return true;
      return Date.now() - last > INVITE_ANTISPAM_TTL_MS;
    } catch (e) {
      // If storage is blocked, best-effort: still send
      return true;
    }
  }

  function markOpenPingSent() {
    try {
      localStorage.setItem(INVITE_ANTISPAM_KEY, String(Date.now()));
    } catch (e) {}
  }

  function notifyInviteOpened() {
    if (!INVITE_OPEN_WEBHOOK) return;

    const payload = {
      event: "invite_opened",
      ts: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // Use sendBeacon if available (best for pages that close quickly)
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        const ok = navigator.sendBeacon(INVITE_OPEN_WEBHOOK, blob);
        if (ok) return;
      }
    } catch (e) {}

    // Fallback to fetch
    fetch(INVITE_OPEN_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }

  // Fire once on load (anti-spam)
  if (shouldSendOpenPing()) {
    notifyInviteOpened();
    markOpenPingSent();
  }

  /* ---------- Balloon game config ---------- */
  const BALLOON_COUNT = 5;
  const XO_BURST_FINISH = 180;
  const XO_COLORS = ["#111", "#f2f2f2", "#777"];

  let poppedCount = 0;
  let musicStarted = false;

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

    const rect = balloonContainer.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const offsets = [
      { x: -40, y: -10 },
      { x: 40, y: -10 },
      { x: 0, y: -55 },
      { x: -20, y: 45 },
      { x: 20, y: 45 },
    ];

    for (let i = 0; i < count; i++) {
      const b = document.createElement("div");
      b.className = "balloon-piece " + (i % 2 === 0 ? "white" : "black");

      const jitterX = rand(-10, 10);
      const jitterY = rand(-8, 8);

      const ox = offsets[i % offsets.length].x + jitterX;
      const oy = offsets[i % offsets.length].y + jitterY;

      const pad = 50;
      const x = clamp(cx + ox, pad, rect.width - pad);
      const y = clamp(cy + oy, pad, rect.height - pad);

      b.style.left = x + "px";
      b.style.top = y + "px";

      b.style.animationDuration = rand(2200, 3200) + "ms";
      b.style.animationDelay = rand(0, 450) + "ms";

      b.addEventListener("click", () => popBalloon(b));
      balloonContainer.appendChild(b);
    }
  }

  function popBalloon(el) {
    if (el.classList.contains("popped")) return;

    el.classList.add("popped");
    setTimeout(() => el.remove(), 220);

    poppedCount++;

    if (poppedCount >= BALLOON_COUNT) {
      xoConfettiBurst(XO_BURST_FINISH);
      finishGame();
    }
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

  /* ---------- XO confetti ---------- */
  function xoConfettiBurst(amount) {
    let layer = document.getElementById("xoConfettiLayer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "xoConfettiLayer";
      document.body.appendChild(layer);
    }

    for (let i = 0; i < amount; i++) {
      const piece = document.createElement("div");
      piece.className = "xo-piece";
      piece.textContent = "XO";

      const left = rand(0, window.innerWidth);
      const duration = rand(1400, 2600);
      const drift = rand(-120, 120) + "px";
      const rot = rand(-540, 540) + "deg";

      piece.style.left = left + "px";
      piece.style.animationDuration = duration + "ms";
      piece.style.color = XO_COLORS[rand(0, XO_COLORS.length - 1)];
      piece.style.setProperty("--drift", drift);
      piece.style.setProperty("--rot", rot);

      layer.appendChild(piece);
      setTimeout(() => piece.remove(), duration + 250);
    }

    setTimeout(() => {
      const l = document.getElementById("xoConfettiLayer");
      if (l && l.children.length === 0) l.remove();
    }, 3600);
  }

  /* ---------- Helpers ---------- */
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  /* ---------- Start button ---------- */
  function startExperience() {
    showOnlyPage(1);
    startMusic();
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
     QUIZ (6 Qs, 5 Songs)
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
    "wicked-games": "You’re playful, bold, and you know the power of a little chaos.",
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

    // Ensure all 6 answered
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

  /* ---------- Quiz button wiring ---------- */
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