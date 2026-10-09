import { useState } from "react";
import { CHECKED, RIDE_CITIES, SAFETY } from "../../data/driverless/guide";

export default function DriverlessDashboard() {
  const [query, setQuery] = useState("");
  const cities = RIDE_CITIES.filter(({city,state}) => `${city} ${state}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="dl-page">
    <header className="dl-heading"><span className="dl-kicker">Driverless, in the real world</span><h1>Room for<br />one less driver.</h1><p>Where you can ride. What the published numbers say.</p></header>
    <div className="dl-facts" aria-label="Waymo snapshot">
      <div><strong>271.3M</strong><span>Waymo rider-only miles<br />through June 2026</span></div>
      <div><strong>95%</strong><span>fewer serious-injury-or-worse crashes<br />in Waymo’s comparison</span></div>
      <div><strong>{RIDE_CITIES.length}</strong><span>Waymo service areas<br />listed on {CHECKED}</span></div>
    </div>
    <section className="dl-rides" aria-labelledby="dl-rides-title">
      <div className="dl-section-head"><h2 id="dl-rides-title">Find a ride</h2><a href="https://waymo.com/rides/" target="_blank" rel="noopener noreferrer">Waymo coverage ↗</a></div>
      <label className="dl-search"><span>City or state</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Try San Francisco or TX" /></label>
      <p className="dl-search-count" role="status">{cities.length} {cities.length === 1 ? "service area" : "service areas"}</p>
      <ul className="dl-city-list">{cities.map(({city,state,uber})=><li key={city}><span>{city} <small>{state}</small></span><a href={uber ? "https://waymo.com/waymo-on-uber/" : "https://waymo.com/rides/"} target="_blank" rel="noopener noreferrer" aria-label={`${city}: ride with ${uber ? "Uber" : "Waymo"}`}>{uber ? "Via Uber" : "Waymo"} ↗</a></li>)}</ul>
      {!cities.length && <div className="dl-empty"><p>No listed Waymo service area matches that search.</p><button type="button" onClick={()=>setQuery("")}>See all areas</button></div>}
      <p className="dl-note">Service covers parts of each area. Check your pickup and destination in the provider’s app. Also exploring: <a href="https://zoox.com/" target="_blank" rel="noopener noreferrer">Zoox ↗</a>.</p>
    </section>
    <section className="dl-safety" aria-labelledby="dl-safety-title">
      <div className="dl-section-head"><h2 id="dl-safety-title">A clearer safety picture</h2><span>Waymo · through June 2026</span></div>
      <p>Reported crash reductions versus human drivers traveling the same distance in comparable operating areas.</p>
      <ul>{SAFETY.map(({label,reduction})=><li key={label}><div><span>{label}</span><strong>{reduction}% fewer</strong></div><div className="dl-bar" aria-hidden="true"><span style={{width:`${reduction}%`}} /></div></li>)}</ul>
      <details><summary>What these numbers cover</summary><p>Waymo’s published comparison covers rider-only driving on surface streets, excluding freeways. It is company-reported research within its operating areas; it doesn’t describe every road, situation, or autonomous vehicle.</p><a href="https://waymo.com/safety/impact/" target="_blank" rel="noopener noreferrer">Read the data and methodology ↗</a></details>
    </section>
    <footer className="dl-footer">Availability checked {CHECKED}. Sources: <a href="https://waymo.com/rides/">Waymo rides</a> · <a href="https://waymo.com/safety/impact/">Waymo safety impact</a>.</footer>
  </div>;
}
