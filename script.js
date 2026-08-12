/* =========================================================
   PERSONALIZE THIS SECTION
   ========================================================= */

const config = {
  herName: "ရင်ဝေ",
  myName: "Your Virtual Travel Mate",

  // Use a simple label unique to the link you send her.
  // It does NOT need to contain her real name.
  linkId: "apology-01",

  // Set false if you do not want any visit receipt at all.
  enableAnonymousVisitReceipt: true,

  title: "ကိုယ် တောင်းပန်ပါတယ်",
  introEyebrow: "A message I should have said properly",
  introText:
    " ရင်ဝေကို ဒီစာကို ဖတ်စေချင်တာပါ။ ပြန်ဖြေရမယ်လို့ မမျှော်လင့်ပါဘူး။",

  paragraphs: [
    "ရင်ဝေကို စိတ်မသက်မသာဖြစ်စေချင်လို့ မဟုတ်ပါဘူး။ ကိုယ် တောင်းပန်ချင် လို့ပါ။",
    "ကိုယ့်ကြောင့် ရင်ဝေ စိတ်ထိခိုက်နာကျင်ခဲ့ရတာအတွက် တကယ်ကို တောင်းပန်ပါတယ်။ ကိုယ့်အတွက် အရေးကြီးခဲ့တဲ့ လူတစ်ယောက်ကို နာကျင်စေမိခဲ့တာကို အခုထိ နောင်တရနေမိတယ်။",
    "တောင်းပန်လိုက်ရုံနဲ့ ရင်ဝေက ကိုယ့်ကို ခွင့်လွှတ်ပေးရမယ်လို့ ကိုယ် မမျှော်လင့်ပါဘူး။ ဖြစ်ပြီးသွားတဲ့အရာတွေကိုလည်း ပြန်ပြင်လို့မရတော့ဘူးဆိုတာ နားလည်ပါတယ်။ ဒါပေမယ့် ဖြစ်ခဲ့သမျှအတွက် ကိုယ် ဘယ်လောက်နောင်တရနေတယ်ဆိုတာတော့ ရိုးရိုးသားသား ပြောချင်တယ်။",
    "ရင်ဝေဆီက အဖြေတစ်ခုခု ပြန်ရဖို့ ကိုယ် မမျှော်လင့်ပါဘူး။ ရင်ဝေ ဘယ်တော့မှ မပြန်ဖြေရင်တောင် ကိုယ် ပြောသင့်တဲ့ တောင်းပန်စကားကို သေချာပြောထားချင်ခဲ့တာပါ။",
    "ကိုယ်တို့ အတူရှိခဲ့တဲ့အချိန်တွေထဲက ကောင်းမွန်တဲ့ အမှတ်တရတွေကိုလည်း ကိုယ် တန်ဖိုးထားပါတယ်။ ရင်ဝေ အမြဲတမ်း ပျော်ရွှင်မှုကို ရရှိပါစေလို့လည်း တကယ်ဆုတောင်းပေးပါတယ်။",
    "ရင်ဝေ ကြိုးစားနေတဲ့အရာတိုင်းမှာ အောင်မြင်ပါစေ။ ဘဝက ရင်ဝေကို ဘယ်နေရာကိုပဲ ခေါ်ဆောင်သွားပါစေ၊ အဲဒီလမ်းမှာ ပျော်ရွှင်မှုနဲ့ စိတ်အေးချမ်းမှုတွေ အများကြီး ရရှိပါစေ။",
    "ကိုယ် နောက်ထပ်အခွင့်အရေးတစ်ခုကို မမျှော်လင့်ပါဘူး။ ကိုယ့်ကြောင့် ရင်ဝေ နာကျင်ခဲ့ရတာကို  “တောင်းပန်ပါတယ်” လို့ သေချာပြောချင်တာပါ။",
    "ပျော်ရွှင်ပါစေ။ အောင်မြင်ပါစေ။ ကိုယ့်ကိုယ်ကို ကောင်းကောင်းဂရုစိုက်ပါ။ ❤️",
    "ရင်ဝေ ပြန်ဖြေဖို့ မလိုပါဘူး။ ကိုယ် တကယ်တောင်းပန်ပါတယ်ဆိုတာ ရင်ဝေ သိစေချင်ရုံပါပဲ။"
  ]
};

/* =========================================================
   PAGE
   ========================================================= */

const introView = document.getElementById("introView");
const messageView = document.getElementById("messageView");
const readButton = document.getElementById("readButton");
const greeting = document.getElementById("greeting");
const signature = document.getElementById("signature");
const messageTitle = document.getElementById("messageTitle");
const stepParagraph = document.getElementById("stepParagraph");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const nextButton = document.getElementById("nextButton");
const backButton = document.getElementById("backButton");

let currentStep = 0;

function hasRealValue(value, placeholder) {
  return value && value.trim() && value.trim().toLowerCase() !== placeholder.toLowerCase();
}

if (hasRealValue(config.herName, "Her Name")) {
  greeting.textContent = `${config.herName.trim()}...`;
} else {
  greeting.textContent = "Hey...";
}

if (hasRealValue(config.myName, "My Name")) {
  signature.textContent = `— ${config.myName.trim()}`;
}

if (config.title) {
  messageTitle.textContent = config.title;
}

function renderStep() {
  const total = config.paragraphs.length;
  stepParagraph.textContent = config.paragraphs[currentStep];
  progressText.textContent = `${currentStep + 1} / ${total}`;
  progressFill.style.width = `${((currentStep + 1) / total) * 100}%`;

  backButton.disabled = currentStep === 0;
  backButton.style.opacity = currentStep === 0 ? "0.55" : "1";
  backButton.style.cursor = currentStep === 0 ? "not-allowed" : "pointer";

  nextButton.textContent = currentStep === total - 1 ? "Finish" : "Next";
}

readButton.addEventListener("click", async () => {
  introView.hidden = true;
  introView.classList.remove("active");
  messageView.hidden = false;
  messageView.classList.add("active");

  currentStep = 0;
  renderStep();
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (config.enableAnonymousVisitReceipt) {
    recordEvent("message_revealed");
  }
});

nextButton.addEventListener("click", () => {
  if (currentStep < config.paragraphs.length - 1) {
    currentStep += 1;
    renderStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    nextButton.textContent = "Done";
    nextButton.disabled = true;
    nextButton.style.opacity = "0.72";
  }
});

backButton.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep -= 1;
    renderStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

/* =========================================================
   TRANSPARENT, MINIMAL VISIT RECEIPT
   Stores only:
   - linkId
   - event type
   - server timestamp

   It does NOT intentionally send/store:
   - IP address
   - location
   - device/browser details
   - contacts
   - camera/microphone
   - form answers
   ========================================================= */

async function recordEvent(eventType) {
  try {
    await fetch("/api/visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        linkId: String(config.linkId || "apology-01").slice(0, 80),
        eventType
      }),
      keepalive: true
    });
  } catch (_) {
    // The message page still works even if tracking is unavailable.
  }
}

if (config.enableAnonymousVisitReceipt) {
  recordEvent("page_opened");
}
