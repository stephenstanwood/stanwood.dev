import { useState, useMemo } from "react";

interface Restaurant {
  name: string;
  cuisine: string;
  desc: string;
  orderUrl: string | null;
  orderLabel: string;
  siteUrl: string;
  area: string;
}

const CUISINES = ["All", "Italian", "American", "Mexican", "Austrian", "Sushi", "Wine Bar", "Brewpub"];

const RESTAURANTS: Restaurant[] = [
  { name: "Naschmarkt", cuisine: "Austrian", desc: "Modern Austrian fare, schnitzel and goulash", orderUrl: "https://order.toasttab.com/online/naschmarkt-restaurant-84-east-campbell-ave", orderLabel: "Order on Toast", siteUrl: "https://www.naschmarkt-restaurant.com/", area: "E. Campbell Ave" },
  { name: "Doppio Zero", cuisine: "Italian", desc: "Michelin-listed wood-fired Neapolitan pizza", orderUrl: "https://order.online/en-US/store/doppio-zero-30289844", orderLabel: "Order online", siteUrl: "https://www.doppiozeropizza.com/", area: "E. Campbell Ave" },
  { name: "FLIGHTS", cuisine: "American", desc: "Everything served as a trio flight", orderUrl: "https://www.doordash.com/store/flights-campbell-28563283/", orderLabel: "DoorDash", siteUrl: "https://www.flightsrestaurants.com/", area: "E. Campbell Ave" },
  { name: "Wild Rose Eatery & Bar", cuisine: "American", desc: "Steaks, raw bar, craft cocktails", orderUrl: "https://order.toasttab.com/online/wild-rose-200-east-campbell-avenue", orderLabel: "Order on Toast", siteUrl: "https://www.wildroseeatery.com/", area: "E. Campbell Ave" },
  { name: "Water Tower Kitchen", cuisine: "American", desc: "Brunch winner, sports TVs, community vibe", orderUrl: null, orderLabel: "", siteUrl: "https://www.watertowerkitchen.com/", area: "E. Campbell Ave" },
  { name: "Aqui Cal-Mex", cuisine: "Mexican", desc: "Beloved local Cal-Mex, killer margaritas", orderUrl: "https://togoorder.com/web/6336", orderLabel: "Order direct", siteUrl: "https://www.aquicaliforniamex.com/", area: "E. Campbell Ave" },
  { name: "Trattoria 360", cuisine: "Italian", desc: "Upscale Italian, great wine list", orderUrl: null, orderLabel: "", siteUrl: "https://trattoria360campbell.com/", area: "E. Campbell Ave" },
  { name: "La Pizzeria", cuisine: "Italian", desc: "Family-owned Roman-style pizza and pasta", orderUrl: null, orderLabel: "", siteUrl: "https://lapizzeria.us/", area: "E. Campbell Ave" },
  { name: "A Bellagio", cuisine: "Italian", desc: "Elegant Italian, voted best in South Bay", orderUrl: null, orderLabel: "", siteUrl: "http://www.abellagio.com/", area: "E. Campbell Ave" },
  { name: "Sushi Confidential", cuisine: "Sushi", desc: "Creative rolls, late-night Fri/Sat", orderUrl: "https://sushiconfidential.com/campbell-sushi-location/", orderLabel: "Order online", siteUrl: "https://sushiconfidential.com/campbell-sushi-location/", area: "E. Campbell Ave" },
  { name: "LUNA Mexican Kitchen", cuisine: "Mexican", desc: "Farm-to-table, house-made masa, great patio", orderUrl: "https://www.toasttab.com/local/order/luna-mexican-kitchen-the-pruneyard-shopping-center", orderLabel: "Order on Toast", siteUrl: "https://www.lunamexicankitchen.com/", area: "The Pruneyard" },
  { name: "Orchard City Kitchen", cuisine: "American", desc: "Michelin Bib Gourmand, chef-driven tapas", orderUrl: "https://www.toasttab.com/local/order/orchard-city-kitchen/r-97147aa6-4a2f-4563-a261-c3ce0af818e0", orderLabel: "Order on Toast", siteUrl: "https://www.orchardcitykitchen.com/", area: "The Pruneyard" },
  { name: "Tessora's", cuisine: "Wine Bar", desc: "Women-owned wine bar, live music nights", orderUrl: null, orderLabel: "", siteUrl: "https://tessoras.com/", area: "E. Campbell Ave" },
  { name: "Capers Eat & Drink", cuisine: "American", desc: "Casual bistro, great happy hour, brunch", orderUrl: null, orderLabel: "", siteUrl: "https://www.caperseatanddrink.com/", area: "W. Campbell Ave" },
  { name: "Rock Bottom Brewery", cuisine: "Brewpub", desc: "House-brewed beer, burgers, sports bar", orderUrl: "https://www.rockbottom.com/", orderLabel: "Order online", siteUrl: "https://www.rockbottom.com/", area: "The Pruneyard" },
];

export default function EatLocal() {
  const [cuisine, setCuisine] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return RESTAURANTS.filter((r) => {
      if (cuisine !== "All" && r.cuisine !== cuisine) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) &&
          !r.desc.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [cuisine, search]);

  return (
    <div className="cb-eat">
      <p className="cb-eat-intro">
        Local restaurants in downtown Campbell and The Pruneyard.
        Order direct when you can — it supports the restaurant more than third-party apps.
      </p>

      <div className="cb-eat-filters">
        <input
          type="text"
          className="cb-eat-search"
          placeholder="Search restaurants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="cb-eat-chips">
          {CUISINES.map((c) => (
            <button
              key={c}
              className={`cb-eat-chip ${cuisine === c ? "cb-eat-chip--active" : ""}`}
              onClick={() => setCuisine(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="cb-eat-empty">No restaurants match your filters.</p>
      ) : (
        <div className="cb-eat-grid">
          {filtered.map((r) => (
            <div key={r.name} className="cb-eat-card">
              <div className="cb-eat-card-header">
                <h4 className="cb-eat-name">{r.name}</h4>
                <span className="cb-eat-area">{r.area}</span>
              </div>
              <p className="cb-eat-desc">{r.desc}</p>
              <div className="cb-eat-tags">
                <span className="cb-tag cb-tag-cat">{r.cuisine}</span>
              </div>
              <div className="cb-eat-actions">
                <a
                  href={r.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cb-eat-site"
                >
                  Website
                </a>
                {r.orderUrl && (
                  <a
                    href={r.orderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cb-eat-order"
                  >
                    {r.orderLabel} →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
