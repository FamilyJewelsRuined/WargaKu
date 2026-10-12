"use client";

// File suara: public/sounds/eas-system.mp3
export const ALERT_SOUND_URL = "/sounds/eas-system.mp3";

let audio: HTMLAudioElement | null = null;

function getAudio() {
  if (!audio) {
    audio = new Audio(ALERT_SOUND_URL);
    audio.preload = "auto";
  }
  return audio;
}

export function playAlertSound() {
  try {
    const a = getAudio();
    a.currentTime = 0;
    a.volume = 1.0;
    a.play().catch((err) => console.warn("Alert sound blocked:", err));
  } catch (err) {
    console.warn("Alert sound error:", err);
  }
}

// Untuk panic alert: putar 3x berurutan agar lebih agresif
export function playPanicSound() {
  try {
    const a = new Audio(ALERT_SOUND_URL);
    a.volume = 1.0;
    let count = 0;
    a.addEventListener("ended", () => {
      if (++count < 3) {
        a.currentTime = 0;
        a.play().catch(() => {});
      }
    });
    a.play().catch((err) => console.warn("Panic sound blocked:", err));
  } catch (err) {
    console.warn("Panic sound error:", err);
  }
}

// Browser memblokir audio sebelum ada interaksi user. Panggil sekali saat
// klik/tap pertama agar suara berikutnya (dari push) boleh diputar.
export function unlockAlertSound() {
  const a = getAudio();
  a.muted = true;
  a.play()
    .then(() => {
      a.pause();
      a.currentTime = 0;
      a.muted = false;
    })
    .catch(() => {
      a.muted = false;
    });
}
