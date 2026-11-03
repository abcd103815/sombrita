const form = document.querySelector("#card-form");
const photoInput = document.querySelector("#photo-input");
const uploadBox = document.querySelector("#upload-box");
const uploadTitle = document.querySelector("#upload-title");
const uploadHint = document.querySelector("#upload-hint");
const photoPreview = document.querySelector("#photo-preview");
const cardLogo = document.querySelector(".card-logo");
const portraitPlaceholder = document.querySelector("#portrait-placeholder");
const formError = document.querySelector("#form-error");
const downloadButton = document.querySelector("#download-button");
const imagePreviewLink = document.querySelector("#image-preview-link");
const committeeStart = document.querySelector("#committee-start");
const committeeEnd = document.querySelector("#committee-end");
const committeePreview = document.querySelector("#preview-committee");
let exportTimer;
let exportVersion = 0;
let imageUrl;

const currentYear = new Date().getFullYear();
const firstYear = currentYear - 10;
const lastYear = currentYear + 10;

function toBengaliDigits(value) {
  return String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function populateYears(select, first, last) {
  const years = [];
  for (let year = first; year <= last; year += 1) {
    years.push(new Option(toBengaliDigits(year), String(year)));
  }
  select.replaceChildren(...years);
}

populateYears(committeeStart, firstYear, lastYear);
committeeStart.value = String(currentYear);

function updateCommitteeEndOptions() {
  const startYear = Number(committeeStart.value);
  const previousEndYear = Number(committeeEnd.value);
  populateYears(committeeEnd, startYear + 1, lastYear + 1);
  const endYear = previousEndYear > startYear && previousEndYear <= lastYear + 1
    ? previousEndYear
    : startYear + 1;
  committeeEnd.value = String(endYear);
}

function updateCommitteePreview() {
  committeePreview.textContent = `${toBengaliDigits(committeeStart.value)}–${toBengaliDigits(committeeEnd.value)}`;
  scheduleImageExport();
}

updateCommitteeEndOptions();
updateCommitteePreview();
committeeStart.addEventListener("change", () => {
  updateCommitteeEndOptions();
  updateCommitteePreview();
});
committeeEnd.addEventListener("change", updateCommitteePreview);

const fields = [
  ["#full-name", "#preview-name", "আপনার নাম"],
  ["#blood-group", "#preview-blood", "—"],
  ["#designation", "#preview-designation", "আপনার পদবি"],
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

function createCardImage() {
  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = 1020;
  canvas.height = 645;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create an image canvas.");
  }

  context.scale(scale, scale);
  drawRoundedRect(context, 0.5, 0.5, 339, 214, 10);
  const cardBackground = context.createLinearGradient(0, 0, 340, 215);
  cardBackground.addColorStop(0, "#fffefa");
  cardBackground.addColorStop(1, "#fffaf3");
  context.fillStyle = cardBackground;
  context.fill();
  context.save();
  drawRoundedRect(context, 0.5, 0.5, 339, 214, 10);
  context.clip();

  const topRule = context.createLinearGradient(0, 0, 340, 0);
  topRule.addColorStop(0, "#741d2d");
  topRule.addColorStop(0.65, "#a94442");
  topRule.addColorStop(1, "#c89b48");
  context.fillStyle = topRule;
  context.fillRect(0, 0, 340, 4);

  context.drawImage(cardLogo, 63, 7, 57, 48);
  drawText(context, "সম্বৃত", 129, 31, '700 21px "Noto Serif Bengali"', "#741d2d", 150);
  drawText(context, "এক বৃত্তে • এক মননে", 130, 48, '600 11px "Hind Siliguri"', "#61202b", 155);

  context.save();
  drawRoundedRect(context, 21, 65, 87, 107, 6);
  context.clip();
  context.fillStyle = "#fff";
  context.fillRect(21, 65, 87, 107);
  drawCoverImage(context, photoPreview, 23, 67, 83, 103);
  context.restore();

  drawText(context, document.querySelector("#preview-name").textContent, 122, 85, '700 16px "Noto Serif Bengali"', "#48232b", 196);
  drawRoundedRect(context, 122, 90, 75, 15, 8);
  context.fillStyle = "#f4e9e6";
  context.fill();
  drawText(context, "সদস্য পরিচয়পত্র", 128, 101, '500 8px "Hind Siliguri"', "#741d2d", 65);

  drawText(context, "রক্তের গ্রুপ", 122, 120, '400 8px "Hind Siliguri"', "#9a8880", 75);
  drawText(context, document.querySelector("#preview-blood").textContent, 122, 133, "600 12px Arial", "#a93240", 55);
  drawText(context, "পদবি", 207, 120, '400 8px "Hind Siliguri"', "#9a8880", 90);
  drawText(context, document.querySelector("#preview-designation").textContent, 207, 133, '600 10px "Hind Siliguri"', "#4c3a3b", 118);
  drawText(context, "কমিটি", 122, 148, '400 8px "Hind Siliguri"', "#9a8880", 75);
  drawText(context, document.querySelector("#preview-committee").textContent, 122, 161, '600 10px "Hind Siliguri"', "#4c3a3b", 190);

  context.restore();
  context.strokeStyle = "rgba(113, 51, 46, 0.2)";
  context.lineWidth = 0.8;
  drawRoundedRect(context, 0.5, 0.5, 339, 214, 10);
  context.stroke();

  return canvas;
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

  if (!cardLogo.complete || !photoPreview.complete || document.fonts.status !== "loaded") {
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
        downloadButton.download = `${form.elements.name.value.trim().replace(/[\\/:*?"<>|]/g, "-") || "sambrita-id-card"}.png`;
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
