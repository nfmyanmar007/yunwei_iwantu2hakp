const config = {
  herName: "ရင်ဝေ",
  myName: "Your Virtual Travel Mate",
  linkId: "oct28-birthday-01",
  birthdayMonth: 10,
  birthdayDay: 28,
  enableVisitReceipt: true,
  paragraphs: [
    "I wanted to make something small and special for you instead of sending only a normal birthday message. ✨",
    "October 28 is your day, and I hope it brings you genuine happiness, peaceful moments, and plenty of reasons to smile.",
    "I hope the year ahead opens good doors for you, brings success to the things you work hard for, and gives you beautiful memories you will want to keep.",
    "May you always be surrounded by people who appreciate your heart, respect you, and make your days a little brighter.",
    "Whatever this new chapter brings, I hope you stay strong, keep believing in yourself, and never forget how special you are. ❤️",
    "Happy Birthday, ရင်ဝေ. I hope October 28 is beautiful from beginning to end. 🎂🎉"
  ]
};

const introView = document.getElementById("introView");
const messageView = document.getElementById("messageView");
const readButton = document.getElementById("readButton");
const greeting = document.getElementById("greeting");
const signature = document.getElementById("signature");
const messageTitle = document.getElementById("messageTitle");
const messageEyebrow = document.getElementById("messageEyebrow");
const introCopy = document.getElementById("introCopy");
const countdownNumber = document.getElementById("countdownNumber");
const countdownLabel = document.getElementById("countdownLabel");
const stepParagraph = document.getElementById("stepParagraph");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const nextButton = document.getElementById("nextButton");
const backButton = document.getElementById("backButton");
const reactionSection = document.getElementById("reactionSection");
const reactionGrid = document.getElementById("reactionGrid");
const sendResponseButton = document.getElementById("sendResponseButton");
const reactionStatus = document.getElementById("reactionStatus");
const confetti = document.getElementById("confetti");

let currentStep = 0;
let selectedReaction = null;

function calendarDaysUntilBirthday() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const birthday = new Date(now.getFullYear(), config.birthdayMonth - 1, config.birthdayDay);
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((birthday - today) / dayMs);
}

function updateCountdown() {
  const days = calendarDaysUntilBirthday();
  greeting.textContent = config.herName ? `${config.herName} ✨` : "For you ✨";

  if (days > 1) {
    countdownNumber.textContent = days;
    countdownLabel.textContent = "days until your birthday 🎂";
    introCopy.textContent = `${days} days to go… Something special is waiting for you on October 28. ❤️`;
    readButton.textContent = "Open your birthday surprise 🎁";
    messageTitle.textContent = "A little early birthday wish ✨";
  } else if (days === 1) {
    countdownNumber.textContent = "1";
    countdownLabel.textContent = "day until your birthday 🎂";
    introCopy.textContent = "Tomorrow is your birthday… so I saved a little surprise for you. ❤️";
    readButton.textContent = "Open tomorrow's surprise 🎁";
    messageTitle.textContent = "Almost your birthday ✨";
  } else if (days === 0) {
    countdownNumber.textContent = "TODAY 🎉";
    countdownLabel.textContent = "October 28 — your special day";
    introCopy.textContent = "The countdown is over. Today is your day. Happy Birthday! 🎂✨";
    readButton.textContent = "Open your birthday wish 🎁";
    messageEyebrow.textContent = "October 28 is finally here";
    messageTitle.textContent = "Happy Birthday! 🎂🎉";
  } else {
    const daysAfter = Math.abs(days);
    countdownNumber.textContent = "❤️";
    countdownLabel.textContent = "October 28 birthday wish";
    introCopy.textContent = `Your birthday was ${daysAfter === 1 ? "yesterday" : `${daysAfter} days ago`}, but this little wish is still for you.`;
    readButton.textContent = "Open your birthday wish 🎁";
    messageTitle.textContent = "I hope your birthday was beautiful ❤️";
  }
}

function renderStep() {
  const total = config.paragraphs.length;
  stepParagraph.textContent = config.paragraphs[currentStep];
  progressText.textContent = `${currentStep + 1} / ${total}`;
  progressFill.style.width = `${((currentStep + 1) / total) * 100}%`;
  backButton.disabled = currentStep === 0;
  nextButton.textContent = currentStep === total - 1 ? "Finish ✨" : "Next";
}

function launchConfetti() {
  confetti.innerHTML = "";
  const pieces = ["✨", "🎉", "💖", "🎈", "⭐", "🎂"];
  for (let i = 0; i < 34; i += 1) {
    const piece = document.createElement("span");
    piece.textContent = pieces[Math.floor(Math.random() * pieces.length)];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    piece.style.animationDuration = `${2.6 + Math.random() * 2}s`;
    confetti.appendChild(piece);
  }
  setTimeout(() => { confetti.innerHTML = ""; }, 5200);
}

readButton.addEventListener("click", () => {
  introView.hidden = true;
  messageView.hidden = false;
  currentStep = 0;
  renderStep();
  launchConfetti();
  // Keep the reader at the current visual position instead of jumping to the top.
  if (config.enableVisitReceipt) recordEvent("message_revealed");
});

nextButton.addEventListener("click", () => {
  if (currentStep < config.paragraphs.length - 1) {
    currentStep += 1;
    renderStep();
    return;
  }
  nextButton.disabled = true;
  nextButton.textContent = "Done ❤️";
  reactionSection.hidden = false;
  launchConfetti();
  setTimeout(() => reactionSection.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
});

backButton.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep -= 1;
    renderStep();
  }
});

reactionGrid.querySelectorAll(".reaction-button").forEach((button) => {
  button.addEventListener("click", () => {
    reactionGrid.querySelectorAll(".reaction-button").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    selectedReaction = button.dataset.reaction;
    sendResponseButton.disabled = false;
    reactionStatus.textContent = "Your answer has not been sent yet.";
  });
});

sendResponseButton.addEventListener("click", async () => {
  if (!selectedReaction) return;
  sendResponseButton.disabled = true;
  reactionStatus.textContent = "Sending...";
  try {
    const response = await fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId: config.linkId, eventType: "response_sent", reaction: selectedReaction, ...clientContext() }),
      keepalive: true
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok || !data.stored) throw new Error(data.error || "Could not send");
    reactionStatus.textContent = "Sent ❤️";
    reactionGrid.querySelectorAll(".reaction-button").forEach((item) => { item.disabled = true; });
  } catch (_) {
    reactionStatus.textContent = "Could not send. Please try again.";
    sendResponseButton.disabled = false;
  }
});


function clientContext() {
  let browserTimezone = "";
  try { browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (_) {}
  return {
    browserTimezone,
    browserLanguage: navigator.language || ""
  };
}

async function recordEvent(eventType) {
  try {
    await fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId: config.linkId, eventType, ...clientContext() }),
      keepalive: true
    });
  } catch (_) {}
}

if (config.myName) signature.textContent = `— ${config.myName}`;
updateCountdown();
if (config.enableVisitReceipt) recordEvent("page_opened");
