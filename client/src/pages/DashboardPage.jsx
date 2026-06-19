import Feedback from "../components/Feedback";
import LogoMark from "../components/LogoMark";
import TicketDetail from "../components/TicketDetail";
import TicketFilters from "../components/TicketFilters";
import TicketForm from "../components/TicketForm";
import TicketList from "../components/TicketList";
import { labelize } from "../utils/format";

function DashboardPage({
  activeView,
  error,
  filters,
  isStaff,
  loading,
  notice,
  replyText,
  selectedTicket,
  stats,
  ticketForm,
  tickets,
  user,
  onClearSession,
  onCreateTicket,
  onFiltersChange,
  onLoadDashboard,
  onOpenTicket,
  onReply,
  onReplyText,
  onSelectedTicket,
  onSetActiveView,
  onTicketFormChange,
  onUpdateField
}) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <LogoMark size="large" />
        <nav className="side-nav">
          {["dashboard", "tickets", "create"].map((view) => (
            <button
              key={view}
              className={activeView === view ? "active" : ""}
              onClick={() => onSetActiveView(view)}
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
        <button className="logout-button" onClick={onClearSession}>Logout</button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{isStaff ? "Staff workspace" : "Parent dashboard"}</p>
            <h1>{isStaff ? "Manage parent support tickets" : "Your school helpdesk"}</h1>
          </div>
          <button onClick={onLoadDashboard} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </header>

        <Feedback notice={notice} error={error} />

        {activeView === "dashboard" && <DashboardStats stats={stats} isStaff={isStaff} />}

        {activeView === "create" && !isStaff && (
          <TicketForm
            form={ticketForm}
            loading={loading}
            onChange={onTicketFormChange}
            onSubmit={onCreateTicket}
          />
        )}

        {activeView === "tickets" && (
          <>
            <TicketFilters filters={filters} onChange={onFiltersChange} />
            <TicketList tickets={tickets} loading={loading} onOpen={onOpenTicket} />
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
          onClose={() => onSelectedTicket(null)}
          onReplyText={onReplyText}
          onReply={onReply}
          onUpdateField={onUpdateField}
        />
      )}
    </main>
  );
}

function DashboardStats({ stats, isStaff }) {
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

export default DashboardPage;
