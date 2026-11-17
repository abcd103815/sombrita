const themeToggle = document.querySelector("#theme-toggle");
const themeStorageKey = "sombrita-color-theme";
const root = document.documentElement;

function applyTheme(theme) {
  const isDark = theme === "dark";
  root.dataset.theme = isDark ? "dark" : "light";
  themeToggle.textContent = isDark ? "লাইট মোড" : "ডার্ক মোড";
  themeToggle.setAttribute("aria-label", isDark ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন");
  themeToggle.setAttribute("aria-pressed", String(isDark));
}

let savedTheme;
try {
  savedTheme = localStorage.getItem(themeStorageKey);
} catch (error) {
  console.error("Could not read the saved color theme.", error);
}

applyTheme(savedTheme === "dark" ? "dark" : "light");

themeToggle.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);

  try {
    localStorage.setItem(themeStorageKey, nextTheme);
  } catch (error) {
    console.error("Could not save the color theme.", error);
  }
});
