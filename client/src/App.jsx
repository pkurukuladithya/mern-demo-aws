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
          <LogoMark />
          <button className="ghost-button" onClick={() => document.getElementById("auth")?.scrollIntoView()}>
            Parent login
          </button>
        </nav>

        <section className="flyer-hero">
          <div className="hero-copy">
            <LogoMark size="hero" />
            <p className="hero-kicker">Sri Lanka's First Parent Helpdesk Platform for Primary Schools</p>
            <h1>Saviya - Smart Parent Helpdesk for Primary Schools</h1>
            <div className="sinhala-title">සවිය</div>
            <p className="tagline">Ask. Ticket. Track. Get Answered.</p>
            <p className="hero-description">
              A simple helpdesk platform for Sri Lankan parents to raise school-related
              questions and get clear responses from responsible staff.
            </p>
            <div className="quote-card">
              දරුවාගේ අධ්‍යාපන ගැටළුවෙන්, ඔබේ ගැටළුවට නිවැරදි පිළිතුරක්.
            </div>
            <div className="hero-actions">
              <button onClick={() => document.getElementById("auth")?.scrollIntoView()}>
                Get started
              </button>
              <button className="secondary-button" onClick={() => setAuthMode("register")}>
                Create account
              </button>
            </div>
          </div>

          <div className="family-hero-card" aria-label="Parent and child using Saviya">
            <div className="family-visual">
              <div className="person parent-person" />
              <div className="person child-person" />
              <div className="phone-card">
                <span>saviya</span>
                <strong>12</strong>
                <small>My Tickets</small>
              </div>
            </div>
            <div className="ai-ready-card">
              <span>AI-Powered Future Ready</span>
              <p>
                Saviya will use AI to understand, categorize, and provide smart
                answer support faster than ever.
              </p>
            </div>
          </div>
        </section>

        <section className="challenge-section">
          <h2>Struggling with these everyday school challenges?</h2>
          <div className="challenge-grid">
            {[
              ["Bag", "Teacher said carry something tomorrow?"],
              ["?", "What is the homework for tomorrow?"],
              ["Note", "When is the next school event?"],
              ["i", "Need information about school activities?"]
            ].map(([icon, item]) => (
              <article className="challenge-card" key={item}>
                <span>{icon}</span>
                <h3>{item}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="solution-band">
          <div className="solution-copy">
            <h2>Saviya is the simple solution.</h2>
            <p className="tagline">Ask. Ticket. Track. Get Answered.</p>
            <p>
              All your child's school related questions, answered in one trusted
              place.
            </p>
          </div>
          <div className="solution-metrics">
            <div><strong>12</strong><span>My Tickets</span></div>
            <div><strong>5</strong><span>Open</span></div>
            <div><strong>4</strong><span>In Progress</span></div>
            <div><strong>3</strong><span>Resolved</span></div>
          </div>
        </section>

        <section className="why-section">
          <h2>Why Parents Love Saviya</h2>
          <div className="feature-row">
            {[
              ["Chat", "Easy Ticketing", "Raise a question in seconds."],
              ["Find", "Track Progress", "Track your ticket status in real-time."],
              ["Bell", "Instant Updates", "Get updates when there is a response."],
              ["Team", "Multiple Channels", "Web, mobile and email support."],
              ["Safe", "Secure & Private", "Your data is safe and protected."]
            ].map(([icon, title, text]) => (
              <article className="feature-card" key={title}>
                <span>{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <ProductPreview />

        <section className="community-section">
          <h2>For Everyone in the School Community</h2>
          <div className="community-grid">
            <CommunityCard
              title="For Parents"
              items={["Raise questions anytime", "Track ticket status", "Get quick responses", "Stay informed"]}
            />
            <CommunityCard
              title="For Staff / Responders"
              items={["View and manage tickets", "Respond efficiently", "Organize by categories", "Better communication"]}
            />
            <CommunityCard
              title="For Admins"
              items={["Manage users and staff", "Monitor all tickets", "Reports and analytics", "Improve school service"]}
            />
            <article className="community-card ai-community">
              <h3>Coming Soon with AI</h3>
              <p>Smart answer suggestions</p>
              <p>Auto category detection</p>
              <p>Similar question finder</p>
              <p>AI chat assistant</p>
            </article>
          </div>
        </section>

        <section className="content-band compact-band">
          <div>
            <p className="eyebrow">Saviya for schools</p>
            <h2>Make School Communication Simple, Fast & Stress Free.</h2>
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

        <section className="roles-grid slim-roles">
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

        <footer className="public-footer">
          <strong>Make School Communication Simple, Fast & Stress Free.</strong>
          <span>www.saviya.lk</span>
          <span>hello@saviya.lk</span>
          <span>Sri Lanka</span>
        </footer>

        <Feedback notice={notice} error={error} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <LogoMark size="large" />
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

function LogoMark({ size = "" }) {
  return (
    <div className={`brand-lockup ${size}`}>
      <div className="logo-symbol">S</div>
      <div>
        <span>saviya</span>
        <strong>සවිය</strong>
      </div>
    </div>
  );
}

function ProductPreview() {
  const recent = [
    ["Homework for tomorrow", "Open"],
    ["Bring stationery items", "In Progress"],
    ["School sports day details", "Resolved"],
    ["Maths holiday assignment", "Open"]
  ];

  return (
    <section className="product-preview">
      <div className="desktop-mock">
        <div className="mock-sidebar">
          <LogoMark />
          <span>Dashboard</span>
          <span>My Tickets</span>
          <span>Create Ticket</span>
          <span>Notifications</span>
        </div>
        <div className="mock-dashboard">
          <h3>Dashboard</h3>
          <div className="mock-stats">
            <div><strong>12</strong><span>My Tickets</span></div>
            <div><strong>5</strong><span>Open</span></div>
            <div><strong>4</strong><span>In Progress</span></div>
            <div><strong>3</strong><span>Resolved</span></div>
          </div>
          <h4>Recent Tickets</h4>
          {recent.map(([title, status]) => (
            <div className="mock-row" key={title}>
              <span>{title}</span>
              <small>{status}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="ticket-mock">
        <span>Ticket #1234</span>
        <h3>Homework for tomorrow</h3>
        <p>Teacher said to bring some items tomorrow. Can you please confirm?</p>
        <button>View Responses</button>
      </div>

      <div className="response-mock">
        <h3>Responses</h3>
        <p>Good morning. Please bring your Maths exercise book and colour pencils tomorrow.</p>
        <div>Thank you so much!</div>
      </div>

      <div className="mobile-mock">
        <LogoMark />
        <strong>My Tickets</strong>
        <div className="mock-stats compact">
          <div><strong>12</strong><span>Total</span></div>
          <div><strong>5</strong><span>Open</span></div>
        </div>
        <button>Create Ticket</button>
      </div>
    </section>
  );
}

function CommunityCard({ title, items }) {
  return (
    <article className="community-card">
      <h3>{title}</h3>
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </article>
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
                  <small>{labelize(ticket.status)} - {ticket.priority}</small>
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
            <small>{ticket.childName} - {ticket.grade}</small>
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
            <span>{ticket.childName} - {ticket.grade}</span>
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
