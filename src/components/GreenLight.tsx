import { useState, useEffect } from "react";
import type {
  AppView,
  QuizAnswer,
  TasteProfile,
  DietaryConstraints,
  Recommendation,
  RecommendResponse,
} from "../lib/greenLight/types";
import { quizQuestions } from "../lib/greenLight/quizQuestions";
import { computeTasteProfile, nudgeProfile } from "../lib/greenLight/tasteProfile";
import {
  loadProfile,
  saveProfile,
  addRecentRestaurant,
  updateTasteProfile,
  clearProfile,
  defaultConstraints,
} from "../lib/greenLight/storage";
import TasteQuiz from "./green-light/TasteQuiz";
import DietaryConstraintsView from "./green-light/DietaryConstraints";
import RestaurantSearch from "./green-light/RestaurantSearch";
import { RecommendationPicker, RecommendationResult } from "./green-light/RecommendationCard";

export default function GreenLight() {
  const [view, setView] = useState<AppView>("quiz");
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [constraints, setConstraints] = useState<DietaryConstraints>(defaultConstraints);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [recentRestaurants, setRecentRestaurants] = useState<string[]>([]);
  const [recommendResponse, setRecommendResponse] = useState<RecommendResponse | null>(null);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [currentRestaurant, setCurrentRestaurant] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load existing profile on mount
  useEffect(() => {
    const stored = loadProfile();
    if (stored) {
      setProfile(stored.profile);
      setConstraints(stored.constraints);
      setQuizAnswers(stored.quizAnswers);
      setRecentRestaurants(stored.recentRestaurants);
      setView("search");
    }
  }, []);

  function handleQuizComplete(answers: QuizAnswer[]) {
    const computed = computeTasteProfile(answers, quizQuestions);
    setQuizAnswers(answers);
    setProfile(computed);
    setView("constraints");
  }

  function handleConstraintsComplete(c: DietaryConstraints) {
    setConstraints(c);
    const computed = profile ?? computeTasteProfile(quizAnswers, quizQuestions);
    saveProfile(computed, c, quizAnswers);
    setView("search");
  }

  async function handleSearch(restaurantName: string) {
    if (!profile) return;
    setCurrentRestaurant(restaurantName);
    setError(null);
    setView("loading");

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName,
          location: "Campbell, CA",
          tasteProfile: profile,
          constraints,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setView("search");
        return;
      }

      setRecommendResponse(data);
      setSelectedRec(null);
      addRecentRestaurant(restaurantName);
      setRecentRestaurants((prev) => {
        const filtered = prev.filter(
          (r) => r.toLowerCase() !== restaurantName.toLowerCase(),
        );
        return [restaurantName, ...filtered].slice(0, 5);
      });
      setView("picking");
    } catch {
      setError("Could not reach the server. Please try again.");
      setView("search");
    }
  }

  function handlePick(choice: "A" | "B") {
    if (!recommendResponse || !profile) return;
    const picked = choice === "A" ? recommendResponse.optionA : recommendResponse.optionB;
    setSelectedRec(picked);

    // Learn from the choice: nudge profile toward picked option's signals
    const updated = nudgeProfile(profile, picked.signals);
    setProfile(updated);
    updateTasteProfile(updated);

    setView("result");
  }

  function handleTryAgain() {
    if (currentRestaurant) handleSearch(currentRestaurant);
  }

  function handleNewSearch() {
    setRecommendResponse(null);
    setSelectedRec(null);
    setError(null);
    setView("search");
  }

  function handleRetakeQuiz() {
    clearProfile();
    setProfile(null);
    setConstraints(defaultConstraints);
    setQuizAnswers([]);
    setRecommendResponse(null);
    setSelectedRec(null);
    setView("quiz");
  }

  return (
    <div className="he-app">
      {view === "quiz" && (
        <TasteQuiz
          questions={quizQuestions}
          onComplete={handleQuizComplete}
        />
      )}

      {view === "constraints" && (
        <DietaryConstraintsView
          initial={constraints}
          onComplete={handleConstraintsComplete}
        />
      )}

      {view === "search" && (
        <>
          {error && <p className="he-error">{error}</p>}
          <RestaurantSearch
            recentRestaurants={recentRestaurants}
            onSearch={handleSearch}
            onRetakeQuiz={handleRetakeQuiz}
          />
        </>
      )}

      {view === "loading" && (
        <div className="he-loading">
          <div className="he-spinner" />
          <p className="he-loading-text">
            Checking the menu at {currentRestaurant}...
          </p>
        </div>
      )}

      {view === "picking" && recommendResponse && (
        <RecommendationPicker
          response={recommendResponse}
          restaurantName={currentRestaurant}
          onPick={handlePick}
        />
      )}

      {view === "result" && selectedRec && (
        <RecommendationResult
          recommendation={selectedRec}
          onTryAgain={handleTryAgain}
          onNewSearch={handleNewSearch}
        />
      )}
    </div>
  );
}
