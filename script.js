const startBtn = document.getElementById("startBtn");
const balloonContainer = document.getElementById("balloonContainer");
const music = document.getElementById("bgMusic");

const BALLOON_COUNT = 5;                 // only 5 balloons
const XO_BURST_FINISH = 180;             // XO pieces when all balloons are done
const XO_COLORS = ["#111", "#f2f2f2", "#777"]; // black, white, grey

let poppedCount = 0;
let musicStarted = false;

// Prevent touch scrolling while locked (mobile)
function preventScroll(e){
    if(document.body.classList.contains("locked")){
        e.preventDefault();
    }
}
window.addEventListener("touchmove", preventScroll, { passive: false });

/* ---------------- PAGE NAV (only for Page0 -> Page1) ---------------- */
function showOnlyPage(pageNumber){
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const el = document.getElementById("page" + pageNumber);
    if(el) el.classList.add("active");
}

startBtn?.addEventListener("click", () => {
    showOnlyPage(1);
    startMusic();
    buildBalloons(BALLOON_COUNT);
});

/* ---------------- MUSIC ---------------- */
function startMusic(){
    if(musicStarted || !music) return;

    music.volume = 0;
    music.play().catch(() => {});
    musicStarted = true;

    // gentle fade in
    const fade = setInterval(() => {
        if(music.volume < 0.6){
            music.volume = Math.min(0.6, music.volume + 0.05);
        } else {
            clearInterval(fade);
        }
    }, 180);
}

/* ---------------- BALLOONS ---------------- */
function buildBalloons(count){
    if(!balloonContainer) return;

    balloonContainer.innerHTML = "";
    poppedCount = 0;

    const rect = balloonContainer.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const offsets = [
        {x: -40, y: -10},
        {x:  40, y: -10},
        {x:   0, y: -55},
        {x: -20, y:  45},
        {x:  20, y:  45},
    ];

    for(let i = 0; i < count; i++){
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

function popBalloon(el){
    if(el.classList.contains("popped")) return;

    el.classList.add("popped");
    setTimeout(() => el.remove(), 220);

    poppedCount++;

    if(poppedCount >= BALLOON_COUNT){
        xoConfettiBurst(XO_BURST_FINISH);
        finishGame();
    }
}

/* ---------------- FINISH: enable scroll from Show Up to end ---------------- */
function finishGame(){
    document.body.classList.remove("locked");
    document.body.classList.add("scroll-mode");

    const page2 = document.getElementById("page2");
    setTimeout(() => {
        page2?.scrollIntoView({ behavior: "smooth" });
    }, 350);
}

/* ---------------- XO CONFETTI ---------------- */
function xoConfettiBurst(amount){
    let layer = document.getElementById("xoConfettiLayer");
    if(!layer){
        layer = document.createElement("div");
        layer.id = "xoConfettiLayer";
        document.body.appendChild(layer);
    }

    for(let i = 0; i < amount; i++){
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
        if(l && l.children.length === 0) l.remove();
    }, 3600);
}

/* ---------------- HELPERS ---------------- */
function rand(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max){
    return Math.min(max, Math.max(min, value));
}

/* ---------------- QUIZ (TRILOGY) ---------------- */
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

// Keep names EXACTLY like the file naming you requested
const SONG_KEYS = [
  "wicked-games",
  "montreal",
  "the-morning",
  "coming-down",
  "twenty-eight",
  "valerie",
  "angel",
  "next",
  "the-fall",
  "high-for-this"
];

const SONG_PRETTY = {
  "wicked-games": "Wicked Games",
  "montreal": "Montreal",
  "the-morning": "The Morning",
  "coming-down": "Coming Down",
  "twenty-eight": "Twenty Eight",
  "valerie": "Valerie",
  "angel": "Angel",
  "next": "Next",
  "the-fall": "The Fall",
  "high-for-this": "High for This"
};

// NEW: personality phrases under the cover
const SONG_BLURB = {
  "wicked-games": "You’re playful, bold, and you know the power of a little chaos. You flirt with life (and maybe people) for fun.",
  "montreal": "You’re the main character on a quiet walk with music in your ears. Soft, dreamy, and a little nostalgic.",
  "the-morning": "Confidence is your thing. You show up, you shine, you don’t apologize — energy stays high.",
  "coming-down": "You feel things deeply but you keep it cute. You’re the vibe, the mood, the late-night thoughts.",
  "twenty-eight": "Independent with a soft side. You protect your peace and you don’t force what doesn’t fit.",
  "valerie": "You’re gentle, emotional in the best way, and you romanticize the little moments. Soft heart, strong mind.",
  "angel": "You’re loyal and caring — the friend people trust. You give warmth without needing attention.",
  "next": "You act unbothered but you’re actually hilarious and sharp. You keep boundaries and you mean them.",
  "the-fall": "You live for intensity. Big energy, big feelings, big “main character” moments — and you own it.",
  "high-for-this": "You’re magnetic. You love excitement and you bring a fearless vibe wherever you go."
};

let _inviteWasPlaying = false;
let _inviteTime = 0;
let _scrollYBeforeQuiz = 0;

function stopResultAudio(){
  if(!resultAudio) return;
  resultAudio.pause();
  resultAudio.currentTime = 0;
  resultAudio.removeAttribute("src");
}

function enterQuizAudioMode(){
  stopResultAudio();

  if(!music) return;
  _inviteWasPlaying = !music.paused;
  _inviteTime = music.currentTime || 0;

  music.pause();
}

function exitQuizAudioMode(){
  stopResultAudio();

  if(!music) return;
  if(_inviteWasPlaying){
    try{
      music.currentTime = _inviteTime || 0;
    }catch(e){}

    music.play().catch(() => {});
  }
}

function openQuiz(){
  _scrollYBeforeQuiz = window.scrollY || 0;

  enterQuizAudioMode();
  resetQuizUI();

  document.body.classList.add("quiz-open");
  if(quizScreen) quizScreen.setAttribute("aria-hidden", "false");

  setTimeout(() => {
    if(quizScreen) quizScreen.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, 0);
}

function closeQuiz({ resumeInviteAudio = true } = {}){
  document.body.classList.remove("quiz-open");
  if(quizScreen) quizScreen.setAttribute("aria-hidden", "true");

  stopResultAudio();

  setTimeout(() => {
    window.scrollTo({ top: _scrollYBeforeQuiz, behavior: "auto" });
  }, 0);

  if(resumeInviteAudio){
    exitQuizAudioMode();
  }
}

function resetQuizUI(){
  if(quizForm) quizForm.reset();

  if(quizResult){
    quizResult.style.display = "none";
  }
  if(quizResultInner){
    quizResultInner.classList.remove("show");
    quizResultInner.innerHTML = "";
  }
  if(resultCover){
    resultCover.classList.remove("show");
    resultCover.removeAttribute("src");
  }
  if(resultBlurb){
    resultBlurb.textContent = "";
  }
  if(quizOverlay){
    quizOverlay.classList.remove("on");
  }
}

function computeQuizResult(){
  if(!quizForm) return { error: "Quiz not found." };

  const guestName = (guestNameInput?.value || "").trim();

  if(!guestName){
    return { error: "Enter your name first." };
  }

  const scores = Object.fromEntries(SONG_KEYS.map(k => [k, 0]));
  const data = new FormData(quizForm);

  // Score only q1..q15 (ignore guestName)
  for(const [key, value] of data.entries()){
    if(key === "guestName") continue;
    if(scores[value] !== undefined) scores[value] += 1;
  }

  const totalQuestions = 15;
  let answered = 0;
  for(let i = 1; i <= totalQuestions; i++){
    if(data.get("q" + i)) answered++;
  }

  if(answered < totalQuestions){
    return { error: "Answer all 15 questions first." };
  }

  const max = Math.max(...Object.values(scores));
  const top = Object.keys(scores).filter(k => scores[k] === max);
  const chosen = top[Math.floor(Math.random() * top.length)];

  return { chosen, guestName };
}

function playResultSong(songKey){
  if(music) music.pause();

  if(resultCover){
    resultCover.src = `${songKey}.jpg`;
    resultCover.classList.add("show");
  }

  if(resultAudio){
    resultAudio.pause();
    resultAudio.currentTime = 0;
    resultAudio.src = `${songKey}.mp3`;
    resultAudio.load();
    resultAudio.play().catch(() => {});
  }
}

// NEW: open WhatsApp chat with prefilled message (guest still taps Send)
function openWhatsAppPrefill(guestName, songKey){
  const pretty = SONG_PRETTY[songKey] || songKey;
  const msg = `Trilogy Quiz ✅%0AName: ${guestName}%0ASong: ${pretty}`;
  // SA number format: 27 + number without leading 0
  const url = `https://wa.me/27813270172?text=${msg}`;
  try{
    window.open(url, "_blank");
  }catch(e){
    // If blocked, do nothing (some browsers block popups)
  }
}

function revealQuizResult(songKey, guestName){
  if(!quizResult || !quizResultInner) return;

  quizResult.style.display = "block";

  // CHANGED: removed "Let it play" text
  quizResultInner.classList.remove("show");
  quizResultInner.innerHTML = `
    <h2>${guestName}, you are <span>${SONG_PRETTY[songKey] || "a Mystery Track"}</span></h2>
  `;

  if(resultBlurb){
    resultBlurb.textContent = SONG_BLURB[songKey] || "";
  }

  if(quizOverlay){
    quizOverlay.classList.add("on");
    setTimeout(() => quizOverlay.classList.remove("on"), 900);
  }

  requestAnimationFrame(() => {
    quizResultInner.classList.add("show");
  });

  playResultSong(songKey);

  // CHANGED: auto scroll down to reveal
  setTimeout(() => {
    quizResult.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 150);

  // CHANGED: auto-open WhatsApp with prefilled message (guest taps Send)
  setTimeout(() => {
    openWhatsAppPrefill(guestName, songKey);
  }, 700);
}

/* Buttons */
openQuizBtn?.addEventListener("click", openQuiz);
quizBackBtn?.addEventListener("click", () => closeQuiz({ resumeInviteAudio: true }));
quizCloseBtn?.addEventListener("click", () => closeQuiz({ resumeInviteAudio: true }));

quizRetryBtn?.addEventListener("click", () => {
  resetQuizUI();
  if(quizScreen) quizScreen.scrollTop = 0;
});

quizFinishBtn?.addEventListener("click", () => {
  if(!quizResultInner || !quizResult) return;

  const res = computeQuizResult();
  if(res.error){
    quizResult.style.display = "block";
    quizResultInner.classList.remove("show");
    quizResultInner.innerHTML = `<h2>Hold up</h2><p>${res.error}</p>`;
    if(resultBlurb) resultBlurb.textContent = "";
    requestAnimationFrame(() => quizResultInner.classList.add("show"));

    setTimeout(() => {
      quizResult.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return;
  }

  revealQuizResult(res.chosen, res.guestName);
});
