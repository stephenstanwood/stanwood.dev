import { useState } from "react";

interface Props {
  recentRestaurants: string[];
  onSearch: (name: string) => void;
  onRetakeQuiz: () => void;
}

export default function RestaurantSearch({
  recentRestaurants,
  onSearch,
  onRetakeQuiz,
}: Props) {
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) onSearch(trimmed);
  }

  function handleRecent(name: string) {
    setQuery(name);
    onSearch(name);
  }

  return (
    <div className="he-search">
      <h2 className="he-section-title">Where are you eating?</h2>

      <form onSubmit={handleSubmit} className="he-search-form">
        <input
          type="text"
          className="he-input he-input-lg"
          placeholder="Restaurant name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          aria-label="Restaurant name"
        />
        <button
          type="submit"
          className="he-btn-primary"
          disabled={!query.trim()}
        >
          Get my order
        </button>
      </form>

      {recentRestaurants.length > 0 && (
        <div className="he-recent">
          <span className="he-recent-label">Recent</span>
          <div className="he-recent-list">
            {recentRestaurants.map((name) => (
              <button
                key={name}
                type="button"
                className="he-recent-item"
                onClick={() => handleRecent(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="he-link-btn"
        onClick={onRetakeQuiz}
      >
        Retake taste quiz
      </button>
    </div>
  );
}
