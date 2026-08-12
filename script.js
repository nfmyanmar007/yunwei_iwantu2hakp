/* =========================================================
   PERSONALIZE EVERYTHING HERE
   ========================================================= */

const config = {
  herName: "Her Name",
  myName: "My Name",
  myEmail: "your@email.com",

  emailSubject: "Okay, your website worked 😂",
  positiveEndingScore: 5,

  opening: {
    eyebrow: "A very serious matter",
    firstLine: "I sent you an email...",
    secondLine: "But someone forgot to reply. 😂",
    smallText: "So I had to build an entire website instead.",
    buttonText: "Okay okay... continue 😅"
  },

  questions: [
    {
      title: "First, an important investigation... 🕵️‍♂️",
      text: "Did you actually see my email?",
      answers: [
        { label: "Yes 😇", reaction: "AH-HA! I knew it. 😂", score: 2 },
        { label: "Maybe... 👀", reaction: "Very suspicious answer... 🤨", score: 1 },
        { label: "What email? 😂", reaction: "Okay... I'll pretend I believe you. 😂", score: 0 }
      ]
    },
    {
      title: "Be honest...",
      text: "Did you smile when you realized I made a whole website just because you didn't reply?",
      answers: [
        { label: "Yes 😂", reaction: "Mission accomplished. ❤️", score: 2 },
        { label: "A little 😊", reaction: "I'll take it. 😌", score: 1 },
        { label: "Nope 😏", reaction: "Ouch. My web-development career is over. 💔😂", score: 0 }
      ]
    },
    {
      title: "Serious question for 5 seconds... ❤️",
      text: "Do you think I'm at least a little bit cute?",
      answers: [
        { label: "Yes 😊", reaction: "This is excellent data for the research team. 😌❤️", score: 2 },
        { label: "Maybe 😏", reaction: "A mysterious answer. I respect the suspense. 😂", score: 1 },
        { label: "I'm still deciding 😂", reaction: "Fair. Peer review takes time. 🧐😂", score: 0 }
      ]
    },
    {
      title: "Okay... one last question.",
      text: "If I asked you to grab coffee with me sometime...",
      answers: [
        { label: "I'd say yes ☕❤️", reaction: "Well... this website was definitely worth building. 😌❤️", score: 2 },
        { label: "Maybe 😉", reaction: "I will professionally interpret 'maybe' as 'there is hope.' 😂", score: 1 },
        { label: "We need to talk more first 😊", reaction: "Fair answer. I like that. 😊", score: 1 },
        { label: "Nice try 😂", reaction: "😂 Can't blame a guy for trying.", score: 0 }
      ]
    }
  ],

  final: {
    title: "Thanks for completing this extremely scientific survey. 😂❤️",
    intro: "Your answers have been carefully reviewed by our highly qualified romance department.",
    normalResult: "You're still pretty awesome. ❤️",
    ps: "P.S. You can still reply to my email. 😂"
  },

  secretEnding: {
    title: "Wait a second... 👀❤️",
    line1: "Based on our extremely advanced calculations...",
    line2: "There's a suspicious amount of chemistry here.",
    result: "Coffee might be required for further research. ☕😂❤️"
  }
};

/* =========================================================
   APP LOGIC
   ========================================================= */

const screenEl = document.getElementById("screen");
const progressWrap = document.getElementById("progressWrap");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const particles = document.getElementById("heartParticles");
const musicToggle = document.getElementById("musicToggle");

let currentQuestion = 0;
let totalScore = 0;
let answers = [];
let audio = {
  context: null,
  gain: null,
  timer: null,
  enabled: false
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const personalize = (text) =>
  String(text)
    .replaceAll("[herName]", escapeHtml(config.herName))
    .replaceAll("[myName]", escapeHtml(config.myName));

function getGreeting() {
  const name = config.herName.trim();
  return name && name.toLowerCase() !== "her name"
    ? `Hey ${escapeHtml(name)}... 👀`
    : "Hey you... 👀";
}

function envelopeMarkup() {
  return `
    <div class="envelope-stage" aria-hidden="true">
      <span class="mini-heart one">♡</span>
      <span class="mini-heart two">♥</span>
      <span class="mini-heart three">♡</span>
      <div class="envelope-flap"></div>
      <div class="letter-heart">❤️</div>
      <div class="envelope"></div>
    </div>
  `;
}

function renderOpening() {
  progressWrap.classList.add("hidden");

  screenEl.innerHTML = `
    <div class="screen">
      ${envelopeMarkup()}
      <p class="eyebrow">${escapeHtml(config.opening.eyebrow)}</p>
      <h1>${getGreeting()}</h1>
      <p class="lead delay-line">${personalize(config.opening.firstLine)}</p>
      <p class="lead delay-line two"><strong>${personalize(config.opening.secondLine)}</strong></p>
      <p class="small-copy delay-line two">${personalize(config.opening.smallText)}</p>

      <div class="action-row delay-line two">
        <button class="primary-btn" id="startBtn" type="button">
          ${escapeHtml(config.opening.buttonText)}
        </button>
      </div>
    </div>
  `;

  document.getElementById("startBtn").addEventListener("click", () => {
    burstHearts(document.getElementById("startBtn"), 6);
    transitionTo(() => renderQuestion(0));
  });
}

function renderQuestion(index) {
  currentQuestion = index;
  const q = config.questions[index];

  updateProgress(index);
  progressWrap.classList.remove("hidden");

  screenEl.innerHTML = `
    <div class="screen">
      <p class="eyebrow">Question ${index + 1} of ${config.questions.length}</p>
      <h2>${personalize(q.title)}</h2>
      <p class="lead">${personalize(q.text)}</p>

      <div class="answer-grid">
        ${q.answers.map((answer, answerIndex) => `
          <button
            class="answer-btn"
            type="button"
            data-answer-index="${answerIndex}"
          >
            ${personalize(answer.label)}
          </button>
        `).join("")}
      </div>
    </div>
  `;

  screenEl.querySelectorAll(".answer-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const answerIndex = Number(button.dataset.answerIndex);
      const answer = q.answers[answerIndex];

      answers[index] = answer.label;
      totalScore += answer.score || 0;

      burstHearts(button, answer.score >= 2 ? 7 : 4);
      showReaction(answer);
    });
  });
}

function showReaction(answer) {
  const q = config.questions[currentQuestion];

  screenEl.innerHTML = `
    <div class="screen">
      <p class="eyebrow">Answer recorded locally</p>
      <h2>${personalize(q.title)}</h2>

      <div class="reaction-box">
        <span class="reaction-emoji">${answer.score >= 2 ? "💘" : answer.score === 1 ? "😌" : "😂"}</span>
        <p class="reaction-copy">${personalize(answer.reaction)}</p>
      </div>

      <div class="action-row">
        <button class="primary-btn" id="nextBtn" type="button">
          ${currentQuestion === config.questions.length - 1 ? "See My Extremely Scientific Result →" : "Next Question →"}
        </button>
      </div>
    </div>
  `;

  document.getElementById("nextBtn").addEventListener("click", () => {
    const isLast = currentQuestion === config.questions.length - 1;
    transitionTo(() => isLast ? renderFinal() : renderQuestion(currentQuestion + 1));
  });
}

function renderFinal() {
  progressWrap.classList.add("hidden");
  const secret = totalScore >= config.positiveEndingScore;
  const replyHref = buildMailto();

  screenEl.innerHTML = secret
    ? `
      <div class="screen">
        ${envelopeMarkup()}
        <span class="secret-badge">Secret ending unlocked ✨</span>
        <h2>${personalize(config.secretEnding.title)}</h2>
        <p class="lead">${personalize(config.secretEnding.line1)}</p>
        <p class="lead"><strong>${personalize(config.secretEnding.line2)}</strong></p>

        <div class="result-card">
          <p class="result-label">Final Result</p>
          <p class="result-text">${personalize(config.secretEnding.result)}</p>
        </div>

        <p class="small-copy">${personalize(config.final.ps)}</p>

        <div class="action-row">
          <a class="primary-btn reply-link" href="${replyHref}">💌 Reply to My Email</a>
          <button class="secondary-btn" id="restartBtn" type="button">😂 Restart the Investigation</button>
        </div>
      </div>
    `
    : `
      <div class="screen">
        ${envelopeMarkup()}
        <h2>${personalize(config.final.title)}</h2>
        <p class="lead">${personalize(config.final.intro)}</p>

        <div class="result-card">
          <p class="result-label">Final Result</p>
          <p class="result-text">${personalize(config.final.normalResult)}</p>
        </div>

        <p class="small-copy">${personalize(config.final.ps)}</p>

        <div class="action-row">
          <a class="primary-btn reply-link" href="${replyHref}">💌 Reply to My Email</a>
          <button class="secondary-btn" id="restartBtn" type="button">😂 Restart the Investigation</button>
        </div>
      </div>
    `;

  showerHearts(secret ? 22 : 15);

  document.getElementById("restartBtn").addEventListener("click", () => {
    currentQuestion = 0;
    totalScore = 0;
    answers = [];
    transitionTo(renderOpening);
  });
}

function buildMailto() {
  const email = encodeURIComponent(config.myEmail.trim());
  const subject = encodeURIComponent(config.emailSubject);
  const body = encodeURIComponent(
    `Okay, I completed your extremely scientific website survey 😂❤️\n\n— ${config.herName || "Mystery Participant"}`
  );

  return `mailto:${email}?subject=${subject}&body=${body}`;
}

function updateProgress(index) {
  const count = config.questions.length;
  const hearts = Array.from({ length: count }, (_, i) => i <= index ? "❤️" : "○").join(" ");
  progressText.textContent = hearts;
  progressFill.style.width = `${((index + 1) / count) * 100}%`;
}

function transitionTo(renderFn) {
  const existing = screenEl.querySelector(".screen");
  if (!existing) {
    renderFn();
    return;
  }

  existing.classList.add("is-leaving");
  window.setTimeout(renderFn, 230);
}

/* =========================================================
   HEARTS + MICRO-ANIMATIONS
   ========================================================= */

function makeFloatingHeart(extraClass = "") {
  const heart = document.createElement("span");
  const symbols = ["♡", "♥", "❤"];
  heart.className = `floating-heart ${extraClass}`.trim();
  heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.fontSize = `${10 + Math.random() * 15}px`;
  heart.style.setProperty("--duration", `${7 + Math.random() * 7}s`);
  heart.style.setProperty("--drift", `${-45 + Math.random() * 90}px`);
  heart.style.color = Math.random() > .5 ? "#e56a81" : "#d8a0aa";
  particles.appendChild(heart);

  window.setTimeout(() => heart.remove(), 14500);
}

function beginAmbientHearts() {
  makeFloatingHeart();
  window.setInterval(makeFloatingHeart, 1250);
}

function showerHearts(count = 18) {
  for (let i = 0; i < count; i++) {
    window.setTimeout(() => makeFloatingHeart("final-heart"), i * 80);
  }
}

function burstHearts(target, count = 5) {
  const rect = target.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.textContent = i % 2 ? "♡" : "♥";
    spark.style.left = `${rect.left + rect.width / 2}px`;
    spark.style.top = `${rect.top + rect.height / 2}px`;
    spark.style.color = i % 2 ? "#e96f87" : "#cf4b64";
    spark.style.setProperty("--x", `${-55 + Math.random() * 110}px`);
    spark.style.setProperty("--y", `${-65 - Math.random() * 48}px`);
    document.body.appendChild(spark);
    window.setTimeout(() => spark.remove(), 800);
  }
}

/* =========================================================
   OPTIONAL MUSIC — GENERATED LOCALLY WITH WEB AUDIO
   No audio file, tracking, upload, or network request.
   ========================================================= */

function toggleMusic() {
  if (audio.enabled) {
    stopMusic();
  } else {
    startMusic();
  }
}

function startMusic() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    musicToggle.querySelector(".music-label").textContent = "Unavailable";
    return;
  }

  if (!audio.context) {
    audio.context = new AudioContext();
    audio.gain = audio.context.createGain();
    audio.gain.gain.value = 0.032;
    audio.gain.connect(audio.context.destination);
  }

  audio.context.resume();

  const pattern = [
    [261.63, 329.63, 392.00],
    [220.00, 293.66, 349.23],
    [246.94, 329.63, 392.00],
    [196.00, 261.63, 329.63]
  ];

  let step = 0;

  const playChord = () => {
    const now = audio.context.currentTime;
    const chord = pattern[step % pattern.length];
    chord.forEach((freq, idx) => {
      const osc = audio.context.createOscillator();
      const gain = audio.context.createGain();

      osc.type = idx === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(idx === 0 ? 0.11 : 0.045, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      osc.connect(gain);
      gain.connect(audio.gain);

      osc.start(now);
      osc.stop(now + 2.85);
    });

    step++;
  };

  playChord();
  audio.timer = window.setInterval(playChord, 3100);
  audio.enabled = true;
  musicToggle.setAttribute("aria-pressed", "true");
  musicToggle.setAttribute("aria-label", "Turn background music off");
  musicToggle.querySelector(".music-label").textContent = "On";
}

function stopMusic() {
  if (audio.timer) {
    window.clearInterval(audio.timer);
    audio.timer = null;
  }
  audio.enabled = false;
  musicToggle.setAttribute("aria-pressed", "false");
  musicToggle.setAttribute("aria-label", "Turn background music on");
  musicToggle.querySelector(".music-label").textContent = "Music";
}

musicToggle.addEventListener("click", toggleMusic);

/* =========================================================
   START
   ========================================================= */

renderOpening();
beginAmbientHearts();
