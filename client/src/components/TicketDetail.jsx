import { priorities, statuses } from "../data/options";
import { labelize } from "../utils/format";
import { PriorityBadge, StatusBadge } from "./Badges";

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

export default TicketDetail;
