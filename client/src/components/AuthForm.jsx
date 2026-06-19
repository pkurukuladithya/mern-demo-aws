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

export default AuthForm;
