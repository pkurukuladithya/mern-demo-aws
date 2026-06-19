import LogoMark from "./LogoMark";

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

export default ProductPreview;
