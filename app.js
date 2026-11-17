const form = document.querySelector("#card-form");
const photoInput = document.querySelector("#photo-input");
const uploadBox = document.querySelector("#upload-box");
const uploadTitle = document.querySelector("#upload-title");
const uploadHint = document.querySelector("#upload-hint");
const photoPreview = document.querySelector("#photo-preview");
const cardLogo = document.querySelector(".card-logo");
const cardDecoration = document.querySelector(".card-decoration");
const presidentSignature = document.querySelector("#president-signature");
const secretarySignature = document.querySelector("#secretary-signature");
const portraitPlaceholder = document.querySelector("#portrait-placeholder");
const formError = document.querySelector("#form-error");
const downloadButton = document.querySelector("#download-button");
const downloadLabel = document.querySelector("#download-label");
const imagePreviewLink = document.querySelector("#image-preview-link");
const frontCard = document.querySelector("#id-card");
const backCard = document.querySelector("#back-card");
const backDecoration = document.querySelector(".card-back-decoration");
const backPhone = document.querySelector("#back-phone");
const cardSideButtons = document.querySelectorAll("[data-card-side]");
const committeeStart = document.querySelector("#committee-start");
const committeeEnd = document.querySelector("#committee-end");
const committeePreview = document.querySelector("#preview-committee");
let exportTimer;
let exportVersion = 0;
let imageUrl;
let activeSide = "front";
const contactNumber = "০১৬৭৯০০০১২৫৪";

backPhone.textContent = contactNumber;

const committeeYears = [2027, 2028, 2029, 2030];

function toBengaliDigits(value) {
  return String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function populateYears(select) {
  const years = committeeYears.map(
    (year) => new Option(toBengaliDigits(year), String(year)),
  );
  select.replaceChildren(...years);
}

populateYears(committeeStart);
populateYears(committeeEnd);
committeeStart.value = "2027";
committeeEnd.value = "2030";

function updateCommitteePreview() {
  committeePreview.textContent = `${toBengaliDigits(committeeStart.value)}–${toBengaliDigits(committeeEnd.value)}`;
  scheduleImageExport();
}

updateCommitteePreview();
committeeStart.addEventListener("change", updateCommitteePreview);
committeeEnd.addEventListener("change", updateCommitteePreview);

const fields = [
  ["#full-name", "#preview-name", "আপনার নাম"],
  ["#blood-group", "#preview-blood", "—"],
  ["#designation", "#preview-designation", "আপনার পদবি"],
  ["#phone-number", "#preview-phone", "—"],
];

for (const [inputSelector, previewSelector, placeholder] of fields) {
  const input = document.querySelector(inputSelector);
  const preview = document.querySelector(previewSelector);
  const updatePreview = () => {
    preview.textContent = input.value.trim() || placeholder;
  };

  input.addEventListener("input", updatePreview);
  input.addEventListener("change", updatePreview);
  input.addEventListener("input", scheduleImageExport);
  input.addEventListener("change", scheduleImageExport);
}

for (const button of cardSideButtons) {
  button.addEventListener("click", () => {
    activeSide = button.dataset.cardSide;
    const showBack = activeSide === "back";
    frontCard.hidden = showBack;
    backCard.hidden = !showBack;
    frontCard.setAttribute("aria-hidden", String(showBack));
    backCard.setAttribute("aria-hidden", String(!showBack));
    cardSideButtons.forEach((sideButton) => {
      const isActive = sideButton === button;
      sideButton.classList.toggle("is-active", isActive);
      sideButton.setAttribute("aria-pressed", String(isActive));
    });
    downloadLabel.textContent = showBack
      ? "HD পেছনের অংশ ডাউনলোড"
      : "HD সামনের অংশ ডাউনলোড";
    scheduleImageExport();
  });
}

function showImage(file) {
  formError.textContent = "";

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    photoInput.value = "";
    formError.textContent = "অনুগ্রহ করে JPG, PNG অথবা WebP ফরম্যাটের ছবি বেছে নিন।";
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    photoInput.value = "";
    formError.textContent = "ছবির আকার ১৫ MB-এর কম হতে হবে।";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result !== "string") {
      formError.textContent = "ছবিটি পড়া যায়নি। অন্য একটি ছবি বেছে নিন।";
      return;
    }

    const image = new Image();
    image.addEventListener("load", () => {
      photoPreview.src = reader.result;
      photoPreview.classList.add("is-visible");
      portraitPlaceholder.classList.add("is-hidden");
      uploadTitle.textContent = file.name;
      uploadHint.textContent =
        image.naturalWidth >= 600 && image.naturalHeight >= 750
          ? "HD ছবি · মূল রেজোলিউশন PNG-তে সংরক্ষিত থাকবে"
          : `ছবির রেজোলিউশন ${image.naturalWidth} × ${image.naturalHeight} px · আরও পরিষ্কার ছবির জন্য HD ছবি ব্যবহার করুন`;
      scheduleImageExport();
    });
    image.addEventListener("error", () => {
      photoInput.value = "";
      formError.textContent = "ছবিটি পড়া যায়নি। অন্য একটি ছবি বেছে নিন।";
    });
    image.src = reader.result;
  });
  reader.addEventListener("error", () => {
    photoInput.value = "";
    formError.textContent = "ছবিটি পড়া যায়নি। অন্য একটি ছবি বেছে নিন।";
  });
  reader.readAsDataURL(file);
}

photoInput.addEventListener("change", () => {
  showImage(photoInput.files?.[0]);
});

form.addEventListener("input", scheduleImageExport);
form.addEventListener("change", scheduleImageExport);

for (const eventName of ["dragenter", "dragover"]) {
  uploadBox.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadBox.classList.add("is-dragging");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  uploadBox.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadBox.classList.remove("is-dragging");
  });
}

uploadBox.addEventListener("drop", (event) => {
  const [file] = event.dataTransfer?.files ?? [];
  if (!file) {
    return;
  }

  const transfer = new DataTransfer();
  transfer.items.add(file);
  photoInput.files = transfer.files;
  showImage(file);
});

function drawCoverImage(context, image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawText(context, text, x, y, font, color, maxWidth) {
  context.font = font;
  context.fillStyle = color;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillText(text, x, y, maxWidth);
}

function createFrontCardImage() {
  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 660;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create an image canvas.");
  }

  context.scale(scale, scale);
  drawRoundedRect(context, 0.5, 0.5, 399, 219, 14);
  const cardBackground = context.createLinearGradient(0, 0, 400, 220);
  cardBackground.addColorStop(0, "#fffefa");
  cardBackground.addColorStop(1, "#fffaf3");
  context.fillStyle = cardBackground;
  context.fill();
  context.save();
  drawRoundedRect(context, 0.5, 0.5, 399, 219, 14);
  context.clip();
  context.drawImage(cardDecoration, 0, 0, 400, 220);

  context.drawImage(cardLogo, 80, 8, 84, 66);
  drawText(context, "সম্বৃত", 182, 45, '700 36px "Noto Serif Bengali"', "#741d2d", 150);
  drawText(context, "এক বৃত্তে • এক মননে", 184, 67, '600 14px "Hind Siliguri"', "#61202b", 150);
  context.fillStyle = "#8b2633";
  context.fillRect(184, 75, 135, 0.8);

  drawRoundedRect(context, 167.5, 79, 145, 22, 12);
  context.fillStyle = "#741d2d";
  context.fill();
  context.font = '600 14px "Hind Siliguri"';
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillText("সদস্য পরিচয়পত্র", 240, 95, 137);
  context.textAlign = "left";

  context.save();
  drawRoundedRect(context, 20, 85, 94, 104, 12);
  context.clip();
  context.fillStyle = "#fff";
  context.fillRect(20, 85, 94, 104);
  drawCoverImage(context, photoPreview, 22, 87, 90, 100);
  context.restore();

  const rows = [
    ["নাম", document.querySelector("#preview-name").textContent, 120, '700 13px "Noto Serif Bengali"', "#48232b"],
    ["পদবি", document.querySelector("#preview-designation").textContent, 138, '600 11px "Hind Siliguri"', "#4c3a3b"],
    ["ফোন নম্বর", document.querySelector("#preview-phone").textContent, 156, '600 11px "Hind Siliguri"', "#4c3a3b"],
    ["রক্তের গ্রুপ", document.querySelector("#preview-blood").textContent, 174, "700 13px Arial", "#a93240"],
    ["কমিটির মেয়াদ", document.querySelector("#preview-committee").textContent, 192, '600 11px "Hind Siliguri"', "#4c3a3b"],
  ];
  context.textAlign = "left";
  for (const [label, value, y, font, color] of rows) {
    drawText(context, label, 130, y, '400 10px "Hind Siliguri"', "#6d5149", 70);
    drawText(context, ":", 202, y, '500 11px "Hind Siliguri"', "#4c3a3b", 8);
    drawText(context, value, 214, y, font, color, 175);
  }

  drawText(context, "সেবায় • সম্প্রীতিতে • সমৃদ্ধিতে", 14, 212, '500 9px "Hind Siliguri"', "#fff7e8", 170);

  context.restore();
  context.strokeStyle = "rgba(113, 51, 46, 0.2)";
  context.lineWidth = 0.8;
  drawRoundedRect(context, 0.5, 0.5, 399, 219, 14);
  context.stroke();

  return canvas;
}

function createBackCardImage() {
  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 660;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create an image canvas.");
  }

  context.scale(scale, scale);
  drawRoundedRect(context, 0.5, 0.5, 399, 219, 14);
  const cardBackground = context.createLinearGradient(0, 0, 400, 220);
  cardBackground.addColorStop(0, "#fffefa");
  cardBackground.addColorStop(1, "#fff8e9");
  context.fillStyle = cardBackground;
  context.fill();

  context.save();
  drawRoundedRect(context, 0.5, 0.5, 399, 219, 14);
  context.clip();
  context.drawImage(backDecoration, 0, 0, 400, 220);
  context.globalAlpha = 1;

  drawText(context, "সম্বৃত", 44, 37, '700 27px "Noto Serif Bengali"', "#741d2d", 77);
  context.strokeStyle = "#741d2d";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(128, 12);
  context.lineTo(128, 42);
  context.stroke();
  drawText(context, "এক বৃত্তে • এক মননে", 138, 31, '600 12px "Hind Siliguri"', "#61202b", 155);

  const drawBackIcon = (x, y, glyph) => {
    context.beginPath();
    context.arc(x + 9, y + 9, 9, 0, Math.PI * 2);
    context.fillStyle = "#741d2d";
    context.fill();
    context.font = '700 11px Arial, sans-serif';
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(glyph, x + 9, y + 9);
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
  };

  drawBackIcon(50, 54, "▦");
  drawText(context, "প্রতিষ্ঠাকাল : ২০২৬", 76, 68, '600 12px "Hind Siliguri"', "#302629", 210);
  drawBackIcon(50, 91, "☎");
  drawText(
    context,
    `যোগাযোগ : ${backPhone.textContent}`,
    76,
    105,
    '600 12px "Hind Siliguri"',
    "#302629",
    220,
  );

  drawRoundedRect(context, 86, 112, 184, 40, 7);
  context.fillStyle = "rgba(242, 213, 203, 0.88)";
  context.fill();
  const notices = [
    "◆ এই পরিচয়পত্র সম্বৃত-এর সম্পত্তি।",
    "◆ অননুমোদিতভাবে ব্যবহার করা যাবে না।",
    "◆ হারিয়ে গেলে প্রদত্ত নম্বরে যোগাযোগ করুন।",
  ];
  notices.forEach((notice, index) => {
    drawText(context, notice, 94, 122 + index * 10, '500 7.5px "Hind Siliguri"', "#4c3a3b", 169);
  });

  context.drawImage(presidentSignature, 95, 153, 85, 31);
  context.drawImage(secretarySignature, 220, 153, 96, 31);
  context.strokeStyle = "rgba(57, 40, 42, 0.82)";
  context.lineWidth = 0.65;
  context.beginPath();
  context.moveTo(93, 185);
  context.lineTo(181, 185);
  context.moveTo(221, 185);
  context.lineTo(317, 185);
  context.stroke();
  context.font = '600 11px "Hind Siliguri"';
  context.fillStyle = "#39282a";
  context.textAlign = "center";
  context.fillText("সভাপতি", 137, 201, 88);
  context.fillText("সাধারণ সম্পাদক", 269, 201, 96);
  context.textAlign = "left";
  context.restore();

  context.strokeStyle = "rgba(113, 51, 46, 0.2)";
  context.lineWidth = 0.8;
  drawRoundedRect(context, 0.5, 0.5, 399, 219, 14);
  context.stroke();

  return canvas;
}

function createCardImage() {
  return activeSide === "back" ? createBackCardImage() : createFrontCardImage();
}

function scheduleImageExport() {
  window.clearTimeout(exportTimer);
  exportVersion += 1;
  downloadButton.removeAttribute("href");
  downloadButton.removeAttribute("download");
  downloadButton.classList.add("is-disabled");
  downloadButton.setAttribute("aria-disabled", "true");
  downloadButton.tabIndex = -1;
  imagePreviewLink.removeAttribute("href");
  imagePreviewLink.classList.add("is-disabled");
  imagePreviewLink.setAttribute("aria-disabled", "true");
  imagePreviewLink.tabIndex = -1;
  if (imageUrl) {
    URL.revokeObjectURL(imageUrl);
    imageUrl = undefined;
  }
  const version = exportVersion;
  exportTimer = window.setTimeout(() => updateDownloadLink(version), 200);
}

function updateDownloadLink(version) {
  if (!form.checkValidity() || !photoPreview.classList.contains("is-visible")) {
    return;
  }

  const requiredImages = activeSide === "back"
    ? [backDecoration, presidentSignature, secretarySignature]
    : [cardLogo, cardDecoration, photoPreview];
  if (
    requiredImages.some((image) => !image.complete || !image.naturalWidth) ||
    document.fonts.status !== "loaded"
  ) {
    exportTimer = window.setTimeout(() => updateDownloadLink(version), 200);
    return;
  }

  try {
    createCardImage().toBlob((blob) => {
      if (version !== exportVersion) {
        return;
      }

      if (!blob) {
        formError.textContent = "PNG ছবিটি তৈরি করা যায়নি। আবার চেষ্টা করুন।";
        return;
      }

      try {
        imageUrl = URL.createObjectURL(blob);
        downloadButton.href = imageUrl;
        imagePreviewLink.href = imageUrl;
        imagePreviewLink.classList.remove("is-disabled");
        imagePreviewLink.setAttribute("aria-disabled", "false");
        imagePreviewLink.tabIndex = 0;
        const sideName = activeSide === "back" ? "back" : "front";
        downloadButton.download = `${form.elements.name.value.trim().replace(/[\\/:*?"<>|]/g, "-") || "sambrita-id-card"}-${sideName}.png`;
        downloadButton.classList.remove("is-disabled");
        downloadButton.setAttribute("aria-disabled", "false");
        downloadButton.tabIndex = 0;
        formError.textContent = "";
      } catch (error) {
        console.error("Could not prepare the ID card image download.", error);
        formError.textContent = "ছবিটি তৈরি করা যায়নি। আবার চেষ্টা করুন।";
      }
    }, "image/png");
  } catch (error) {
    console.error("Could not create the ID card image.", error);
    formError.textContent = "ছবিটি তৈরি করা যায়নি। আবার চেষ্টা করুন।";
  }
}

downloadButton.addEventListener("click", (event) => {
  if (downloadButton.hasAttribute("href") && !downloadButton.classList.contains("is-disabled")) {
    return;
  }

  event.preventDefault();
  form.reportValidity();
  scheduleImageExport();
});

document.fonts.ready.then(scheduleImageExport);
