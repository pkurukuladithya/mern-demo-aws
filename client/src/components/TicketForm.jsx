import { categories, priorities } from "../data/options";

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

export default TicketForm;
