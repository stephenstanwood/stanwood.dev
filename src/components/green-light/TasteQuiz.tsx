import { useState } from "react";
import type { QuizQuestion, QuizAnswer } from "../../lib/greenLight/types";

type QuizOption = QuizQuestion["optionA"];

/** One of the two "which sounds better" cards. */
function QuizOptionCard({
  option,
  onPick,
}: {
  option: QuizOption;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      className="he-quiz-card"
      onClick={onPick}
      aria-label={`Choose: ${option.label}`}
    >
      {option.emoji && <span className="he-quiz-card-emoji">{option.emoji}</span>}
      <span className="he-quiz-card-label">{option.label}</span>
      {option.subtitle && (
        <span className="he-quiz-card-sub">{option.subtitle}</span>
      )}
    </button>
  );
}

interface Props {
  questions: QuizQuestion[];
  onComplete: (answers: QuizAnswer[]) => void;
}

export default function TasteQuiz({ questions, onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [animating, setAnimating] = useState(false);

  const question = questions[current];
  const progress = (current / questions.length) * 100;

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
      {/* Intro heading */}
      <h2 className="he-quiz-intro-title">Let's learn what you like</h2>
      <p className="he-quiz-intro-sub">Pick whichever sounds better &mdash; no wrong answers.</p>

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
        <QuizOptionCard option={question.optionA} onPick={() => pick("A")} />
        <span className="he-quiz-or">or</span>
        <QuizOptionCard option={question.optionB} onPick={() => pick("B")} />
      </div>
    </div>
  );
}
