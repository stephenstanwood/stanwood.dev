import { useCallback, useEffect, useRef, useState } from "react";
import { LANGUAGES, ENGLISH, getLanguage, type Language } from "./languages";

type Direction = "en-to-other" | "other-to-en";

type Status = "idle" | "connecting" | "listening" | "error";

const LANG_STORAGE_KEY = "handoff:targetLang";

const SDP_CALL_URL = "https://api.openai.com/v1/realtime/translations/calls";

export default function Handoff() {
  const [target, setTarget] = useState<Language>(LANGUAGES[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [direction, setDirection] = useState<Direction | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Load saved language preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved) {
        const lang = getLanguage(saved);
        if (lang && lang.code !== "en") setTarget(lang);
      }
    } catch {
      // ignore
    }
  }, []);

  const teardown = useCallback(() => {
    if (dcRef.current) {
      try { dcRef.current.close(); } catch { /* ignore */ }
      dcRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch { /* ignore */ }
      pcRef.current = null;
    }
    if (micStreamRef.current) {
      for (const t of micStreamRef.current.getTracks()) t.stop();
      micStreamRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => teardown, [teardown]);

  const start = useCallback(async (dir: Direction) => {
    // If we're switching direction or restarting, tear down first
    teardown();
    setSourceText("");
    setTranslatedText("");
    setErrorMsg(null);
    setStatus("connecting");
    setDirection(dir);

    const targetLanguage = dir === "en-to-other" ? target.code : "en";

    try {
      // 1) Mint ephemeral session token from our server
      const sessionRes = await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLanguage }),
      });
      if (!sessionRes.ok) {
        const j = await sessionRes.json().catch(() => ({}));
        throw new Error(j.error || `Session error ${sessionRes.status}`);
      }
      const sessionData = await sessionRes.json();
      // OpenAI returns { value, expires_at, session: {...} } — extract the secret value
      const clientSecret =
        (typeof sessionData?.value === "string" && sessionData.value) ||
        (typeof sessionData?.client_secret === "string" && sessionData.client_secret) ||
        (typeof sessionData?.client_secret?.value === "string" && sessionData.client_secret.value);
      if (!clientSecret) throw new Error("No client secret in session response");

      // 2) Get mic
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      // 3) Set up WebRTC
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Remote audio (translated speech) → audio element
      pc.ontrack = ({ streams }) => {
        const el = audioElRef.current;
        if (el && streams[0]) {
          el.srcObject = streams[0];
          el.play().catch((err) => console.warn("Audio play failed", err));
        }
      };

      // Data channel for transcript events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = ({ data }) => {
        try {
          const evt = JSON.parse(data);
          if (evt.type === "session.input_transcript.delta" && typeof evt.delta === "string") {
            setSourceText((prev) => prev + evt.delta);
          } else if (evt.type === "session.output_transcript.delta" && typeof evt.delta === "string") {
            setTranslatedText((prev) => prev + evt.delta);
          } else if (evt.type === "error") {
            console.error("Realtime error event:", evt);
            setErrorMsg(evt.message || evt.error?.message || "Translation error");
          }
        } catch (err) {
          console.warn("Bad event:", data, err);
        }
      };

      // Add mic track
      for (const track of stream.getAudioTracks()) {
        pc.addTrack(track, stream);
      }

      // 4) SDP exchange with OpenAI
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(SDP_CALL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });
      if (!sdpRes.ok) {
        const errText = await sdpRes.text();
        throw new Error(`SDP exchange failed: ${sdpRes.status} ${errText}`);
      }
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setStatus("listening");
    } catch (err) {
      console.error("Handoff start failed:", err);
      setErrorMsg(err instanceof Error ? err.message : "Connection failed");
      setStatus("error");
      teardown();
    }
  }, [target.code, teardown]);

  const stop = useCallback(() => {
    teardown();
    setStatus("idle");
    setDirection(null);
  }, [teardown]);

  const pickLanguage = (lang: Language) => {
    if (status !== "idle") stop();
    setTarget(lang);
    setShowLangPicker(false);
    try { localStorage.setItem(LANG_STORAGE_KEY, lang.code); } catch { /* ignore */ }
  };

  const isListeningEnglish = status === "listening" && direction === "en-to-other";
  const isListeningOther = status === "listening" && direction === "other-to-en";
  const isConnecting = status === "connecting";

  // Which captions are which? When direction is en→other, source = English, translated = target lang.
  const englishCaption = direction === "en-to-other" ? sourceText : translatedText;
  const otherCaption = direction === "en-to-other" ? translatedText : sourceText;

  return (
    <div className="ho-app">
      <audio ref={audioElRef} autoPlay playsInline />

      {/* English (worker) side */}
      <button
        className={`ho-btn ho-btn-en ${isListeningEnglish ? "ho-btn-active" : ""}`}
        onClick={() => (isListeningEnglish ? stop() : start("en-to-other"))}
        disabled={isConnecting && !isListeningEnglish}
        aria-pressed={isListeningEnglish}
      >
        <div className="ho-btn-label">
          {isListeningEnglish ? ENGLISH.listeningLabel : ENGLISH.iSpeakLabel}
        </div>
        <MicIcon active={isListeningEnglish} />
        <div className="ho-btn-hint">
          {isListeningEnglish ? ENGLISH.stopHint : ENGLISH.tapHint}
        </div>
      </button>

      {/* Captions strip */}
      <div className="ho-captions" aria-live="polite">
        <div className="ho-caption ho-caption-en">
          <div className="ho-caption-lang">English</div>
          <div className="ho-caption-text">
            {englishCaption || <span className="ho-caption-empty">…</span>}
          </div>
        </div>
        <div className={`ho-caption ho-caption-other ${target.rtl ? "ho-rtl" : ""}`}>
          <div className="ho-caption-lang">{target.nativeName}</div>
          <div className="ho-caption-text">
            {otherCaption || <span className="ho-caption-empty">…</span>}
          </div>
        </div>
      </div>

      {/* Other language side */}
      <button
        className={`ho-btn ho-btn-other ${isListeningOther ? "ho-btn-active" : ""} ${target.rtl ? "ho-rtl" : ""}`}
        onClick={() => (isListeningOther ? stop() : start("other-to-en"))}
        disabled={isConnecting && !isListeningOther}
        aria-pressed={isListeningOther}
      >
        <div className="ho-btn-hint">
          {isListeningOther ? target.stopHint : target.tapHint}
        </div>
        <MicIcon active={isListeningOther} />
        <div className="ho-btn-label">
          {isListeningOther ? target.listeningLabel : target.iSpeakLabel}
        </div>
      </button>

      {/* Status / error / language picker */}
      <div className="ho-footer">
        {errorMsg && <div className="ho-error">{errorMsg}</div>}
        {isConnecting && <div className="ho-status">Connecting…</div>}
        <button
          className="ho-lang-toggle"
          onClick={() => setShowLangPicker((v) => !v)}
          aria-expanded={showLangPicker}
        >
          Language: {target.englishName} ({target.nativeName})
          <span className="ho-lang-caret">{showLangPicker ? "▾" : "▸"}</span>
        </button>
        {showLangPicker && (
          <div className="ho-lang-grid" role="listbox">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                className={`ho-lang-option ${lang.code === target.code ? "ho-lang-selected" : ""}`}
                onClick={() => pickLanguage(lang)}
                role="option"
                aria-selected={lang.code === target.code}
              >
                <div className="ho-lang-native">{lang.nativeName}</div>
                <div className="ho-lang-english">{lang.englishName}</div>
              </button>
            ))}
          </div>
        )}
        <div className="ho-tagline">
          Hand the phone across the desk. Tap your language to speak.
        </div>
      </div>
    </div>
  );
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`ho-mic ${active ? "ho-mic-active" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
