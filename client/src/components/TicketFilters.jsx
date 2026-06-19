import { categories, priorities, statuses } from "../data/options";
import { labelize } from "../utils/format";

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

export default TicketFilters;
