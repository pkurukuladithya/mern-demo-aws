import { useEffect, useMemo, useState } from "react";

const categories = [
  "Academic",
  "Homework",
  "School Materials",
  "Events",
  "Payments",
  "Transport",
  "Health & Safety",
  "General"
];

const statuses = ["open", "in_progress", "waiting_parent", "resolved", "closed"];
const priorities = ["low", "medium", "high", "urgent"];

const defaultTicketForm = {
  title: "",
  description: "",
  childName: "",
  grade: "",
  category: "Academic",
  priority: "medium"
};

function labelize(value) {
  return value.replaceAll("_", " ");
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("saviyaToken") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("saviyaUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "parent"
  });
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketForm, setTicketForm] = useState(defaultTicketForm);
  const [replyText, setReplyText] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
    priority: ""
  });
  const [activeView, setActiveView] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const isStaff = user?.role === "responder" || user?.role === "admin";

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  const apiRequest = async (url, options = {}) => {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  };

  const saveSession = (nextToken, nextUser) => {
    localStorage.setItem("saviyaToken", nextToken);
    localStorage.setItem("saviyaUser", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearSession = () => {
    localStorage.removeItem("saviyaToken");
    localStorage.removeItem("saviyaUser");
    setToken("");
    setUser(null);
    setTickets([]);
    setStats(null);
    setSelectedTicket(null);
    setActiveView("dashboard");
  };

  const loadDashboard = async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });

      const [ticketData, statData] = await Promise.all([
        apiRequest(`/api/tickets?${query.toString()}`, { headers: authHeaders }),
        apiRequest("/api/dashboard/stats", { headers: authHeaders })
      ]);

      setTickets(ticketData);
      setStats(statData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const verifyUser = async () => {
      if (!token) return;

      try {
        const data = await apiRequest("/api/auth/me", { headers: authHeaders });
        setUser(data.user);
        localStorage.setItem("saviyaUser", JSON.stringify(data.user));
      } catch (err) {
        clearSession();
      }
    };

    verifyUser();
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [token, filters]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : authForm;
      const data = await apiRequest(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      saveSession(data.token, data.user);
      setNotice(`Welcome to Saviya, ${data.user.name}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      await apiRequest("/api/tickets", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(ticketForm)
      });
      setTicketForm(defaultTicketForm);
      setNotice("Ticket created successfully.");
      setActiveView("tickets");
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openTicket = async (ticketId) => {
    setLoading(true);
    setError("");

    try {
      const ticket = await apiRequest(`/api/tickets/${ticketId}`, {
        headers: authHeaders
      });
      setSelectedTicket(ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setLoading(true);
    setError("");

    try {
      const ticket = await apiRequest(`/api/tickets/${selectedTicket._id}/messages`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ text: replyText })
      });
      setReplyText("");
      setSelectedTicket(ticket);
      setNotice("Reply added.");
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketField = async (field, value) => {
    if (!selectedTicket) return;

    setLoading(true);
    setError("");

    try {
      const ticket = await apiRequest(`/api/tickets/${selectedTicket._id}/${field}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ [field]: value })
      });
      setSelectedTicket(ticket);
      setNotice(`Ticket ${field} updated.`);
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="public-shell">
        <nav className="public-nav">
          <div className="brand-mark">
            <span>saviya</span>
            <strong>සවිය</strong>
          </div>
          <button className="ghost-button" onClick={() => document.getElementById("auth")?.scrollIntoView()}>
            Parent login
          </button>
        </nav>

        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">Primary school parent support</div>
            <h1>Saviya - Smart Parent Helpdesk for Primary Schools</h1>
            <div className="sinhala-title">සවිය</div>
            <p className="tagline">Ask. Ticket. Track. Get Answered.</p>
            <p className="hero-description">
              A simple helpdesk platform for Sri Lankan parents to raise
              school-related questions and get clear responses from responsible staff.
            </p>
            <div className="hero-actions">
              <button onClick={() => document.getElementById("auth")?.scrollIntoView()}>
                Get started
              </button>
              <button className="secondary-button" onClick={() => setAuthMode("register")}>
                Create account
              </button>
            </div>
          </div>

          <div className="hero-panel" aria-label="Saviya dashboard preview">
            <div className="panel-top">
              <span>Today</span>
              <strong>12 parent questions</strong>
            </div>
            <div className="preview-card urgent">
              <span>Urgent</span>
              <strong>Transport change for Grade 3</strong>
              <p>Waiting for school office response</p>
            </div>
            <div className="preview-grid">
              <div>
                <strong>8</strong>
                <span>Open</span>
              </div>
              <div>
                <strong>6</strong>
                <span>Answered</span>
              </div>
            </div>
            <div className="chat-preview">
              <span>Parent</span>
              <p>Teacher said bring something tomorrow?</p>
              <span>Responder</span>
              <p>Please send the class note photo. We will confirm.</p>
            </div>
          </div>
        </section>

        <section className="problem-section">
          {[
            "Teacher said bring something tomorrow?",
            "Not sure about homework?",
            "Need details about school events?",
            "Confused about notes from school?",
            "Need quick guidance from responsible staff?"
          ].map((item) => (
            <article className="soft-card" key={item}>
              <span className="card-dot" />
              <h3>{item}</h3>
            </article>
          ))}
        </section>

        <section className="content-band">
          <div>
            <p className="eyebrow">Features</p>
            <h2>Built for clear parent-school communication</h2>
          </div>
          <div className="feature-grid">
            {[
              "Easy ticketing",
              "Track progress",
              "Staff responses",
              "Secure communication",
              "Parent friendly dashboard",
              "Future AI assistant"
            ].map((feature) => (
              <div className="feature-pill" key={feature}>{feature}</div>
            ))}
          </div>
        </section>

        <section className="roles-grid">
          <RoleCard
            title="Parents"
            items={["Raise school questions", "Track ticket status", "Get clear responses"]}
          />
          <RoleCard
            title="Responders"
            items={["View and reply to tickets", "Organize by category", "Update status and priority"]}
          />
          <RoleCard
            title="Admins"
            items={["Manage all tickets", "Monitor support performance", "View dashboard analytics"]}
          />
        </section>

        <section className="ai-band">
          <div>
            <p className="eyebrow">Coming Soon with AI</p>
            <h2>Helpful automation without replacing staff judgement</h2>
          </div>
          <div className="ai-list">
            <span>Smart answer suggestions</span>
            <span>Auto category detection</span>
            <span>Similar question finder</span>
            <span>Sinhala/English parent support assistant</span>
          </div>
        </section>

        <section className="auth-section" id="auth">
          <div>
            <p className="eyebrow">Secure access</p>
            <h2>{authMode === "login" ? "Login to Saviya" : "Register for Saviya"}</h2>
            <p>
              Parents can start with a normal account. Responders and admins can use
              their assigned role during setup.
            </p>
          </div>
          <AuthForm
            mode={authMode}
            form={authForm}
            loading={loading}
            onModeChange={setAuthMode}
            onChange={setAuthForm}
            onSubmit={handleAuthSubmit}
          />
        </section>

        <Feedback notice={notice} error={error} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark large">
          <span>saviya</span>
          <strong>සවිය</strong>
        </div>
        <nav className="side-nav">
          {["dashboard", "tickets", "create"].map((view) => (
            <button
              key={view}
              className={activeView === view ? "active" : ""}
              onClick={() => setActiveView(view)}
              disabled={view === "create" && isStaff}
            >
              {view === "create" ? "Create ticket" : labelize(view)}
            </button>
          ))}
        </nav>
        <div className="user-card">
          <span>{user.role}</span>
          <strong>{user.name}</strong>
          <small>{user.email}</small>
        </div>
        <button className="logout-button" onClick={clearSession}>Logout</button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{isStaff ? "Staff workspace" : "Parent dashboard"}</p>
            <h1>{isStaff ? "Manage parent support tickets" : "Your school helpdesk"}</h1>
          </div>
          <button onClick={loadDashboard} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </header>

        <Feedback notice={notice} error={error} />

        {activeView === "dashboard" && <Dashboard stats={stats} isStaff={isStaff} />}

        {activeView === "create" && !isStaff && (
          <TicketForm
            form={ticketForm}
            loading={loading}
            onChange={setTicketForm}
            onSubmit={createTicket}
          />
        )}

        {activeView === "tickets" && (
          <>
            <TicketFilters filters={filters} onChange={setFilters} />
            <TicketList tickets={tickets} loading={loading} onOpen={openTicket} />
          </>
        )}

        <section className="ai-card">
          <div>
            <p className="eyebrow">Coming Soon with AI</p>
            <h2>Smart support suggestions</h2>
            <p>
              Future AI will suggest replies, detect categories, find similar questions,
              and support Sinhala/English parent communication.
            </p>
          </div>
          <span>Coming Soon</span>
        </section>
      </section>

      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          isStaff={isStaff}
          replyText={replyText}
          loading={loading}
          onClose={() => setSelectedTicket(null)}
          onReplyText={setReplyText}
          onReply={sendReply}
          onUpdateField={updateTicketField}
        />
      )}
    </main>
  );
}

function AuthForm({ mode, form, loading, onModeChange, onChange, onSubmit }) {
  return (
    <form className="auth-card" onSubmit={onSubmit}>
      {mode === "register" && (
        <>
          <label>
            Full name
            <input
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              placeholder="Parent or staff name"
            />
          </label>
          <label>
            Role
            <select
              value={form.role}
              onChange={(e) => onChange({ ...form, role: e.target.value })}
            >
              <option value="parent">Parent</option>
              <option value="responder">Responder</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </>
      )}
      <label>
        Email
        <input
          type="email"
          value={form.email}
          onChange={(e) => onChange({ ...form, email: e.target.value })}
          placeholder="you@example.com"
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={form.password}
          onChange={(e) => onChange({ ...form, password: e.target.value })}
          placeholder="Minimum 6 characters"
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
      </button>
      <button
        type="button"
        className="link-button"
        onClick={() => onModeChange(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? "Need an account? Register" : "Already registered? Login"}
      </button>
    </form>
  );
}

function Dashboard({ stats, isStaff }) {
  const numbers = [
    ["Total", stats?.total || 0],
    ["Open", stats?.open || 0],
    ["In progress", stats?.inProgress || 0],
    ["Resolved", stats?.resolved || 0],
    ["Closed", stats?.closed || 0],
    ["Urgent", stats?.urgent || 0]
  ];

  return (
    <>
      <section className="stat-grid">
        {numbers.map(([label, value]) => (
          <article className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <h2>{isStaff ? "Global category overview" : "Your category overview"}</h2>
          <div className="category-list">
            {Object.keys(stats?.categoryCounts || {}).length === 0 ? (
              <p className="empty-state">No category data yet.</p>
            ) : (
              Object.entries(stats.categoryCounts).map(([category, count]) => (
                <div key={category}>
                  <span>{category}</span>
                  <strong>{count}</strong>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel-card">
          <h2>Recent tickets</h2>
          <div className="recent-list">
            {(stats?.recentTickets || []).length === 0 ? (
              <p className="empty-state">No recent tickets yet.</p>
            ) : (
              stats.recentTickets.map((ticket) => (
                <div key={ticket._id}>
                  <strong>{ticket.ticketNo}</strong>
                  <span>{ticket.title}</span>
                  <small>{labelize(ticket.status)} · {ticket.priority}</small>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </>
  );
}

function TicketForm({ form, loading, onChange, onSubmit }) {
  return (
    <form className="panel-card form-grid" onSubmit={onSubmit}>
      <h2>Create a school question ticket</h2>
      <label>
        Title
        <input
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="Example: What should my child bring tomorrow?"
        />
      </label>
      <label>
        Description
        <textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Write the full question clearly for staff."
          rows="5"
        />
      </label>
      <div className="two-column">
        <label>
          Child name
          <input
            value={form.childName}
            onChange={(e) => onChange({ ...form, childName: e.target.value })}
            placeholder="Child name"
          />
        </label>
        <label>
          Grade
          <input
            value={form.grade}
            onChange={(e) => onChange({ ...form, grade: e.target.value })}
            placeholder="Grade 3"
          />
        </label>
      </div>
      <div className="two-column">
        <label>
          Category
          <select
            value={form.category}
            onChange={(e) => onChange({ ...form, category: e.target.value })}
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select
            value={form.priority}
            onChange={(e) => onChange({ ...form, priority: e.target.value })}
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create ticket"}
      </button>
    </form>
  );
}

function TicketFilters({ filters, onChange }) {
  return (
    <section className="filters-card">
      <input
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        placeholder="Search by title, child, ticket no..."
      />
      <select value={filters.status} onChange={(e) => onChange({ ...filters, status: e.target.value })}>
        <option value="">All statuses</option>
        {statuses.map((status) => (
          <option key={status} value={status}>{labelize(status)}</option>
        ))}
      </select>
      <select value={filters.category} onChange={(e) => onChange({ ...filters, category: e.target.value })}>
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
      <select value={filters.priority} onChange={(e) => onChange({ ...filters, priority: e.target.value })}>
        <option value="">All priorities</option>
        {priorities.map((priority) => (
          <option key={priority} value={priority}>{priority}</option>
        ))}
      </select>
    </section>
  );
}

function TicketList({ tickets, loading, onOpen }) {
  if (loading) {
    return <div className="empty-state panel-card">Loading tickets...</div>;
  }

  if (tickets.length === 0) {
    return <div className="empty-state panel-card">No tickets match your view yet.</div>;
  }

  return (
    <section className="ticket-list">
      {tickets.map((ticket) => (
        <article className="ticket-card" key={ticket._id} onClick={() => onOpen(ticket._id)}>
          <div>
            <span className="ticket-no">{ticket.ticketNo}</span>
            <h3>{ticket.title}</h3>
            <p>{ticket.description}</p>
          </div>
          <div className="ticket-meta">
            <StatusBadge value={ticket.status} />
            <PriorityBadge value={ticket.priority} />
            <span>{ticket.category}</span>
            <small>{ticket.childName} · {ticket.grade}</small>
          </div>
        </article>
      ))}
    </section>
  );
}

function TicketDetail({
  ticket,
  isStaff,
  replyText,
  loading,
  onClose,
  onReplyText,
  onReply,
  onUpdateField
}) {
  return (
    <div className="modal-backdrop">
      <section className="ticket-detail">
        <button className="close-button" onClick={onClose}>Close</button>
        <div className="detail-header">
          <span className="ticket-no">{ticket.ticketNo}</span>
          <h2>{ticket.title}</h2>
          <p>{ticket.description}</p>
          <div className="detail-meta">
            <StatusBadge value={ticket.status} />
            <PriorityBadge value={ticket.priority} />
            <span>{ticket.category}</span>
            <span>{ticket.childName} · {ticket.grade}</span>
          </div>
        </div>

        {isStaff && (
          <div className="staff-controls">
            <label>
              Status
              <select value={ticket.status} onChange={(e) => onUpdateField("status", e.target.value)}>
                {statuses.map((status) => (
                  <option key={status} value={status}>{labelize(status)}</option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select value={ticket.priority} onChange={(e) => onUpdateField("priority", e.target.value)}>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="message-list">
          {ticket.messages.map((message) => (
            <div
              className={`message-bubble ${message.senderRole === "parent" ? "parent" : "staff"}`}
              key={message._id || message.createdAt}
            >
              <strong>{message.senderName}</strong>
              <span>{message.senderRole}</span>
              <p>{message.text}</p>
            </div>
          ))}
        </div>

        <form className="reply-form" onSubmit={onReply}>
          <textarea
            value={replyText}
            onChange={(e) => onReplyText(e.target.value)}
            placeholder="Write a clear reply..."
            rows="4"
          />
          <button type="submit" disabled={loading || !replyText.trim()}>
            {loading ? "Sending..." : "Send reply"}
          </button>
        </form>
      </section>
    </div>
  );
}

function RoleCard({ title, items }) {
  return (
    <article className="role-card">
      <h3>{title}</h3>
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </article>
  );
}

function Feedback({ notice, error }) {
  return (
    <>
      {notice && <div className="feedback success">{notice}</div>}
      {error && <div className="feedback error">{error}</div>}
    </>
  );
}

function StatusBadge({ value }) {
  return <span className={`badge status-${value}`}>{labelize(value)}</span>;
}

function PriorityBadge({ value }) {
  return <span className={`badge priority-${value}`}>{value}</span>;
}

export default App;
