import { useState } from "react";
import type { TaskWeights, Trait, TraitScores, QuizChoice } from "../../lib/whichModel/types";
import { QUIZ_QUESTIONS } from "../../lib/whichModel/quizQuestions";

interface Props {
  onComplete: (weights: TaskWeights) => void;
  onBack: () => void;
}

export default function QuizFlow({ onComplete, onBack }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizChoice[]>([]);

  const question = QUIZ_QUESTIONS[step];
  const total = QUIZ_QUESTIONS.length;

  function handleChoice(choice: QuizChoice) {
    const newAnswers = [...answers, choice];
    setAnswers(newAnswers);

    if (step + 1 < total) {
      setStep(step + 1);
    } else {
      const merged: Partial<TraitScores> = {};
      for (const ans of newAnswers) {
        for (const [trait, value] of Object.entries(ans.weights) as [Trait, number][]) {
          merged[trait] = (merged[trait] ?? 0) + value;
        }
      }
      onComplete({ weights: merged, label: "guided recommendation" });
    }
  }

  return (
    <div className="wm-quiz">
      <button className="wm-back" onClick={onBack}>
        ← back
      </button>

      <div className="wm-progress">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`wm-progress-dot ${i < step ? "done" : ""} ${i === step ? "active" : ""}`}
          />
        ))}
      </div>

      <p className="wm-quiz-step">
        {step + 1} of {total}
      </p>

      <h2 className="wm-quiz-prompt">{question.prompt}</h2>

      <div className="wm-quiz-options">
        <button
          className="wm-quiz-card"
          onClick={() => handleChoice(question.optionA)}
        >
          <span className="wm-quiz-emoji">{question.optionA.emoji}</span>
          <span className="wm-quiz-label">{question.optionA.label}</span>
        </button>

        <span className="wm-quiz-or">or</span>

        <button
          className="wm-quiz-card"
          onClick={() => handleChoice(question.optionB)}
        >
          <span className="wm-quiz-emoji">{question.optionB.emoji}</span>
          <span className="wm-quiz-label">{question.optionB.label}</span>
        </button>
      </div>
    </div>
  );
}
