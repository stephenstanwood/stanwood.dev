export type Language = {
  code: string;
  englishName: string;
  nativeName: string;
  iSpeakLabel: string;
  tapHint: string;       // "Tap, then talk" in this language
  stopHint: string;      // "Tap to stop"
  listeningLabel: string; // "Listening…"
  rtl?: boolean;
};

export const LANGUAGES: Language[] = [
  { code: "es", englishName: "Spanish",    nativeName: "Español",     iSpeakLabel: "Hablo español",              tapHint: "Toque, luego hable",        stopHint: "Toque para detener",     listeningLabel: "Escuchando…" },
  { code: "zh", englishName: "Mandarin",   nativeName: "中文",         iSpeakLabel: "我说中文",                    tapHint: "点击,然后说话",              stopHint: "点击停止",                listeningLabel: "正在听…" },
  { code: "vi", englishName: "Vietnamese", nativeName: "Tiếng Việt",  iSpeakLabel: "Tôi nói tiếng Việt",         tapHint: "Chạm rồi nói",              stopHint: "Chạm để dừng",            listeningLabel: "Đang nghe…" },
  { code: "tl", englishName: "Tagalog",    nativeName: "Tagalog",     iSpeakLabel: "Nagsasalita ako ng Tagalog", tapHint: "Pindutin, tapos magsalita", stopHint: "Pindutin para huminto",   listeningLabel: "Nakikinig…" },
  { code: "ru", englishName: "Russian",    nativeName: "Русский",     iSpeakLabel: "Я говорю по-русски",         tapHint: "Нажмите, затем говорите",   stopHint: "Нажмите, чтобы закончить", listeningLabel: "Слушаю…" },
  { code: "ar", englishName: "Arabic",     nativeName: "العربية",      iSpeakLabel: "أنا أتحدث العربية",            tapHint: "اضغط ثم تكلّم",                 stopHint: "اضغط للإيقاف",              listeningLabel: "يستمع…", rtl: true },
  { code: "ko", englishName: "Korean",     nativeName: "한국어",       iSpeakLabel: "저는 한국어를 합니다",          tapHint: "탭하고 말하세요",              stopHint: "탭하여 중지",                listeningLabel: "듣는 중…" },
  { code: "fr", englishName: "French",     nativeName: "Français",    iSpeakLabel: "Je parle français",          tapHint: "Touchez, puis parlez",       stopHint: "Touchez pour arrêter",    listeningLabel: "Écoute…" },
  { code: "pt", englishName: "Portuguese", nativeName: "Português",   iSpeakLabel: "Eu falo português",          tapHint: "Toque e fale",               stopHint: "Toque para parar",        listeningLabel: "Ouvindo…" },
  { code: "hi", englishName: "Hindi",      nativeName: "हिन्दी",       iSpeakLabel: "मैं हिंदी बोलता हूँ",                tapHint: "टैप करें, फिर बोलें",            stopHint: "रोकने के लिए टैप करें",        listeningLabel: "सुन रहा है…" },
  { code: "ja", englishName: "Japanese",   nativeName: "日本語",       iSpeakLabel: "日本語を話します",              tapHint: "タップして話す",               stopHint: "タップで停止",               listeningLabel: "聞いています…" },
  { code: "de", englishName: "German",     nativeName: "Deutsch",     iSpeakLabel: "Ich spreche Deutsch",        tapHint: "Tippen, dann sprechen",      stopHint: "Tippen zum Stoppen",      listeningLabel: "Hört zu…" },
  { code: "it", englishName: "Italian",    nativeName: "Italiano",    iSpeakLabel: "Parlo italiano",             tapHint: "Tocca, poi parla",           stopHint: "Tocca per fermare",       listeningLabel: "In ascolto…" },
];

export const ENGLISH: Language = {
  code: "en",
  englishName: "English",
  nativeName: "English",
  iSpeakLabel: "I speak English",
  tapHint: "Tap, then talk",
  stopHint: "Tap to stop",
  listeningLabel: "Listening…",
};

export function getLanguage(code: string): Language | undefined {
  if (code === "en") return ENGLISH;
  return LANGUAGES.find((l) => l.code === code);
}
