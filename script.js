// ... (everything else stays the same above)

const quizSendBtn = document.getElementById("quizSendBtn"); // Send your song

let _lastSongKey = null;
let _lastGuestName = null;

function resetQuizUI(){
  if(quizForm) quizForm.reset();

  _lastSongKey = null;
  _lastGuestName = null;

  // HIDE send button until they reveal again
  if(quizSendBtn){
    quizSendBtn.classList.add("is-hidden");
    quizSendBtn.disabled = true;
  }

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

function revealQuizResult(songKey, guestName){
  if(!quizResult || !quizResultInner) return;

  quizResult.style.display = "block";

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

  // store last result for sending
  _lastSongKey = songKey;
  _lastGuestName = guestName;

  // SHOW the send button now
  if(quizSendBtn){
    quizSendBtn.classList.remove("is-hidden");
    quizSendBtn.disabled = false;
  }

  playResultSong(songKey);

  setTimeout(() => {
    quizResult.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 150);
}

// Send button click
quizSendBtn?.addEventListener("click", () => {
  if(!_lastSongKey || !_lastGuestName) return;
  openWhatsAppPrefill(_lastGuestName, _lastSongKey);
});

// ... (everything else stays the same below)
