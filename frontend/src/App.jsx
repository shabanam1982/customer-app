import { useState, useEffect } from "react";
import "./App.css";                                   // the design (colours, cards, layout)

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";  // Azure address online, laptop address here

// Colours for the round "initials" circles. Each customer gets one, based on their id.
const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#ec4899"];

// Turn "Asha Khan" into "AK"
function initials(name) {
  return name
    .trim()
    .split(/\s+/)                // split into words
    .map((word) => word[0])      // first letter of each word
    .join("")
    .slice(0, 2)                 // at most 2 letters
    .toUpperCase();
}

function App() {
  // ---------- Memory boxes (state) ----------
  const [customers, setCustomers] = useState([]);   // list of customers from the API
  const [loading, setLoading] = useState(true);     // true while loading the list
  const [loadError, setLoadError] = useState("");   // problem when LOADING
  const [saveError, setSaveError] = useState("");   // problem when SAVING
  const [success, setSuccess] = useState("");       // green "added" message
  const [newName, setNewName] = useState("");       // what the user is typing
  const [saving, setSaving] = useState(false);      // true while saving
  const [search, setSearch] = useState("");         // text in the search box
  const [sortBy, setSortBy] = useState("newest");   // how the list is sorted

  // ---------- Get the customer list from FastAPI ----------
  function loadCustomers() {
    fetch(`${API}/customers`)
      .then((response) => {
        if (!response.ok) throw new Error();         // server answered with an error
        return response.json();
      })
      .then((data) => {
        setCustomers(data);
        setLoadError("");                            // loaded fine, remove old warning
      })
      .catch(() => setLoadError("Cannot load customers right now. Please try again later."))
      .finally(() => setLoading(false));
  }

  // Load the list once, when the page opens
  useEffect(() => {
    loadCustomers();
  }, []);

  // ---------- Add a customer ----------
  function addCustomer(event) {
    event.preventDefault();                          // stop the page from reloading
    const name = newName.trim();

    if (name === "") {                               // empty box?
      setSaveError("Please type a name first.");
      return;
    }

    setSaving(true);                                 // button becomes "Saving..."
    setSaveError("");
    setSuccess("");

    fetch(`${API}/customers`, {
      method: "POST",                                // POST = create new data
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),                // send {"name": "..."}
    })
      .then((response) => {
        if (!response.ok) throw new Error();         // server said no
        return response.json();
      })
      .then((saved) => {
        setNewName("");                              // clear the box
        setSuccess(`${saved.name} was added ✓`);     // green message
        setTimeout(() => setSuccess(""), 3000);      // hide it after 3 seconds
        loadCustomers();                             // refresh the list
      })
      .catch(() => setSaveError("Could not save. Please try again."))
      .finally(() => setSaving(false));              // button back to normal
  }

  // ---------- Insights (worked out from the list) ----------
  const total = customers.length;

  // Newest customer = the one with the biggest id
  const newest = customers.reduce((best, c) => (best === null || c.id > best.id ? c : best), null);

  // Possible duplicates = names that appear more than once (ignoring capital letters and spaces)
  const nameCounts = {};
  customers.forEach((c) => {
    const key = c.name.trim().toLowerCase();
    nameCounts[key] = (nameCounts[key] || 0) + 1;
  });
  const duplicateNames = Object.keys(nameCounts).filter((key) => nameCounts[key] > 1);

  // Count customers by the first letter of their name, keep the top 5
  const letterCounts = {};
  customers.forEach((c) => {
    const letter = c.name.trim().charAt(0).toUpperCase() || "?";
    letterCounts[letter] = (letterCounts[letter] || 0) + 1;
  });
  const topLetters = Object.entries(letterCounts)     // [["A", 2], ["R", 1], ...]
    .sort((a, b) => b[1] - a[1])                      // biggest first
    .slice(0, 5);
  const maxLetterCount = topLetters.length ? topLetters[0][1] : 1;

  // ---------- Search and sort ----------
  const searchText = search.trim().toLowerCase();
  const visible = customers
    .filter((c) => c.name.toLowerCase().includes(searchText))
    .sort((a, b) => {
      if (sortBy === "newest") return b.id - a.id;
      if (sortBy === "oldest") return a.id - b.id;
      return a.name.localeCompare(b.name);            // "az" = alphabetical
    });

  // Server status for the badge in the header
  let status = { text: "Server online", className: "status online" };
  if (loading) status = { text: "Checking server...", className: "status checking" };
  if (loadError) status = { text: "Server offline", className: "status offline" };

  // ---------- What the user sees ----------
  return (
    <div className="page">
      <header className="hero">
        <div>
          <h1>Customer Dashboard</h1>
          <p>Add, search and understand your customers</p>
        </div>
        <span className={status.className}>{status.text}</span>
      </header>

      {loadError && <p className="alert error">{loadError}</p>}

      {/* Insight cards */}
      <section className="stats">
        <div className="stat-card">
          <span className="stat-label">Total customers</span>
          <span className="stat-value">{loading ? "..." : total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Newest customer</span>
          <span className="stat-value small">{newest ? newest.name : "None yet"}</span>
        </div>
        <div className={duplicateNames.length ? "stat-card warn" : "stat-card"}>
          <span className="stat-label">Possible duplicates</span>
          <span className="stat-value">{duplicateNames.length}</span>
          {duplicateNames.length > 0 && (
            <span className="stat-note">Check: {duplicateNames.join(", ")}</span>
          )}
        </div>
      </section>

      <section className="grid">
        {/* Add customer form */}
        <div className="card">
          <h2>Add a customer</h2>
          <form onSubmit={addCustomer} className="add-form">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}   // update as you type
              placeholder="Customer name"
              maxLength={100}                                // same limit as the server
            />
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add customer"}
            </button>
          </form>
          {saveError && <p className="alert error">{saveError}</p>}
          {success && <p className="alert success">{success}</p>}
        </div>

        {/* First-letter chart */}
        <div className="card">
          <h2>Top first letters</h2>
          {topLetters.length === 0 && <p className="muted">No data yet.</p>}
          {topLetters.map(([letter, count]) => (
            <div className="bar-row" key={letter}>
              <span className="bar-label">{letter}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(count / maxLetterCount) * 100}%` }} />
              </div>
              <span className="bar-count">{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Customer list */}
      <section className="card">
        <div className="toolbar">
          <h2>All customers</h2>
          <div className="controls">
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">A to Z</option>
            </select>
          </div>
        </div>

        {loading && <p className="muted">Loading customers...</p>}
        {!loading && !loadError && customers.length === 0 && (
          <p className="muted">No customers yet. Add the first one above.</p>
        )}
        {!loading && customers.length > 0 && visible.length === 0 && (
          <p className="muted">No customer matches "{search}".</p>
        )}

        <ul className="customer-list">
          {visible.map((c) => (
            <li key={c.id}>
              <span className="avatar" style={{ background: COLORS[c.id % COLORS.length] }}>
                {initials(c.name)}
              </span>
              <span className="customer-name">{c.name}</span>
              <span className="customer-id">ID {c.id}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer>Built with React · FastAPI · PostgreSQL · Microsoft Azure</footer>
    </div>
  );
}

export default App;
