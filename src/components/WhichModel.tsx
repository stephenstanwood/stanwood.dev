import { useState, useCallback } from "react";
import type { AppView, TaskWeights, RecommendResult } from "../lib/whichModel/types";
import { recommend } from "../lib/whichModel/engine";
import { inferWeights } from "../lib/whichModel/taskInference";
import StartScreen from "./which-model/StartScreen";
import FreeTextInput from "./which-model/FreeTextInput";
import QuizFlow from "./which-model/QuizFlow";
import OracleReveal from "./which-model/OracleReveal";
import ResultCard from "./which-model/ResultCard";

export default function WhichModel() {
  const [view, setView] = useState<AppView>("start");
  const [result, setResult] = useState<RecommendResult | null>(null);

  function handleFreeText(text: string) {
    const weights = inferWeights(text);
    const rec = recommend(weights);
    setResult(rec);
    setView("revealing");
  }

  function handleQuizComplete(weights: TaskWeights) {
    const rec = recommend(weights);
    setResult(rec);
    setView("revealing");
  }

  const handleRevealComplete = useCallback(() => {
    setView("result");
  }, []);

  function handleTryAgain() {
    setResult(null);
    setView("start");
  }

  return (
    <div className="wm-page">
      <header className="wm-header">
        <a href="/" className="wm-back-home">
          ← stanwood.dev
        </a>
      </header>

      <main className="wm-main">
        {view === "start" && (
          <StartScreen
            onJustTellMe={() => setView("freetext")}
            onGuideMe={() => setView("quiz")}
          />
        )}

        {view === "freetext" && (
          <FreeTextInput
            onSubmit={handleFreeText}
            onBack={() => setView("start")}
          />
        )}

        {view === "quiz" && (
          <QuizFlow
            onComplete={handleQuizComplete}
            onBack={() => setView("start")}
          />
        )}

        {view === "revealing" && result && (
          <OracleReveal
            model={result.primary.model}
            onComplete={handleRevealComplete}
          />
        )}

        {view === "result" && result && (
          <ResultCard result={result} onTryAgain={handleTryAgain} />
        )}
      </main>

      <footer className="wm-footer">
        <p>
          Opinionated recommendations, not gospel. Model landscape changes fast.
        </p>
      </footer>
    </div>
  );
}
