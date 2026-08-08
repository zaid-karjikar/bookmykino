const LANG_LABELS = {
  german: "DE",
  english: "OV",
  "englische-untertitel": "English Subtitles",
  "deutsche-untertitel": "German Subtitles",
};

export const langLabel = (v) => LANG_LABELS[v] || v.toUpperCase();
