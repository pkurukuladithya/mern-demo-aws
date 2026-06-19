import { useEffect, useMemo, useState } from "react";
import { defaultTicketForm } from "./data/options";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import { apiRequest, createAuthHeaders } from "./services/api";

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
  const authHeaders = useMemo(() => createAuthHeaders(token), [token]);

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
      <LandingPage
        authForm={authForm}
        authMode={authMode}
        error={error}
        loading={loading}
        notice={notice}
        onAuthFormChange={setAuthForm}
        onAuthModeChange={setAuthMode}
        onAuthSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <DashboardPage
      activeView={activeView}
      error={error}
      filters={filters}
      isStaff={isStaff}
      loading={loading}
      notice={notice}
      replyText={replyText}
      selectedTicket={selectedTicket}
      stats={stats}
      ticketForm={ticketForm}
      tickets={tickets}
      user={user}
      onClearSession={clearSession}
      onCreateTicket={createTicket}
      onFiltersChange={setFilters}
      onLoadDashboard={loadDashboard}
      onOpenTicket={openTicket}
      onReply={sendReply}
      onReplyText={setReplyText}
      onSelectedTicket={setSelectedTicket}
      onSetActiveView={setActiveView}
      onTicketFormChange={setTicketForm}
      onUpdateField={updateTicketField}
    />
  );
}

export default App;
