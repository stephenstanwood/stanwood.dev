import { useState } from "react";
import type { QuizQuestion, QuizAnswer } from "../../lib/greenLight/types";

interface Props {
  questions: QuizQuestion[];
  onComplete: (answers: QuizAnswer[]) => void;
}

export default function TasteQuiz({ questions, onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [animating, setAnimating] = useState(false);

  const question = questions[current];
  const progress = ((current) / questions.length) * 100;

  function pick(selected: "A" | "B") {
    if (animating) return;
    setAnimating(true);

    const newAnswers = [...answers, { questionId: question.id, selected }];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (current + 1 >= questions.length) {
        onComplete(newAnswers);
      } else {
        setCurrent(current + 1);
      }
      setAnimating(false);
    }, 250);
  }

  return (
    <div className="he-quiz">
      {/* Progress bar */}
      <div className="he-progress-track">
        <div
          className="he-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="he-progress-label">
        {current + 1} of {questions.length}
      </p>

      {/* Question cards */}
      <div className={`he-quiz-cards ${animating ? "he-fade-out" : "he-fade-in"}`}>
        <button
          type="button"
          className="he-quiz-card"
          onClick={() => pick("A")}
          aria-label={`Choose: ${question.optionA.label}`}
        >
          <span className="he-quiz-card-label">{question.optionA.label}</span>
          {question.optionA.subtitle && (
            <span className="he-quiz-card-sub">{question.optionA.subtitle}</span>
          )}
        </button>

        <span className="he-quiz-or">or</span>

        <button
          type="button"
          className="he-quiz-card"
          onClick={() => pick("B")}
          aria-label={`Choose: ${question.optionB.label}`}
        >
          <span className="he-quiz-card-label">{question.optionB.label}</span>
          {question.optionB.subtitle && (
            <span className="he-quiz-card-sub">{question.optionB.subtitle}</span>
          )}
        </button>
      </div>
    </div>
  );
}
