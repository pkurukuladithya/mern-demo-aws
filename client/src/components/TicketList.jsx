import { PriorityBadge, StatusBadge } from "./Badges";

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

export default TicketList;
