const canAccessTicket = (user, ticket) =>
  user.role === "responder" ||
  user.role === "admin" ||
  ticket.createdBy.toString() === user.id;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const generateTicketNo = () => `SAV-${Date.now().toString().slice(-8)}`;

module.exports = {
  canAccessTicket,
  escapeRegex,
  generateTicketNo
};
