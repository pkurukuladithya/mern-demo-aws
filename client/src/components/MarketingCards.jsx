export function RoleCard({ title, items }) {
  return (
    <article className="role-card">
      <h3>{title}</h3>
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </article>
  );
}

export function CommunityCard({ title, items }) {
  return (
    <article className="community-card">
      <h3>{title}</h3>
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </article>
  );
}
