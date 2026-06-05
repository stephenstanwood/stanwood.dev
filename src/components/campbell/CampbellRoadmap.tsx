import { CAMPBELL_ROADMAP } from "../../data/campbell";

export default function CampbellRoadmap() {
  return (
    <div className="cb-roadmap">
      <div className="cb-section-head">
        <span className="cb-section-kicker">Roadmap</span>
        <h3>The page becomes the city index.</h3>
        <p>
          The north star is simple: if a Campbell resident wonders what happened,
          what is open, what is planned, what changed, or who handles it, this page
          should be the best first stop.
        </p>
      </div>

      <div className="cb-roadmap-list">
        {CAMPBELL_ROADMAP.map((item, index) => (
          <article key={item.title} className="cb-roadmap-item">
            <span className="cb-roadmap-num">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <div className="cb-roadmap-title-row">
                <h4>{item.title}</h4>
                <em>{item.status}</em>
              </div>
              <p>{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
