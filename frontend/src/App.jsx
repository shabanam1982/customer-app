import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";  // Azure address online, laptop address here    

function App() {
  const [customers, setCustomers] = useState([]); // list of customers
  const [error, setError] = useState("");         // error message
  const [newName, setNewName] = useState("");     // what the user is typing
  const [saving, setSaving] = useState(false);    // true while saving

  // Get the customer list from FastAPI
  function loadCustomers() {
    fetch(`${API}/customers`)
      .then((response) => response.json())
      .then((data) => setCustomers(data))
      .catch(() => setError("Cannot reach the server. Is FastAPI running?"));
  }

  // Load the list once, when the page opens
  useEffect(() => {
    loadCustomers();
  }, []);

  // Runs when the user clicks "Add customer"
  function addCustomer(event) {
    event.preventDefault();                       // stop the page from reloading

    if (newName.trim() === "") {                  // empty box?
      setError("Please type a name first.");
      return;                                     // stop here
    }

    setSaving(true);                              // button becomes "Saving..."
    setError("");

    fetch(`${API}/customers`, {
      method: "POST",                             // POST = create new data
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),    // send {"name": "..."}
    })
      .then((response) => {
        if (!response.ok) throw new Error();      // server said no
        return response.json();
      })
      .then(() => {
        setNewName("");                           // clear the box
        loadCustomers();                          // refresh the table
      })
      .catch(() => setError("Could not save. Please try again."))
      .finally(() => setSaving(false));           // button back to normal
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Customers</h1>

      <form onSubmit={addCustomer} style={{ marginBottom: "16px" }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}   // update as you type
          placeholder="Customer name"
        />
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Add customer"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;