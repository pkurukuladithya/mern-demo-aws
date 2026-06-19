import AuthForm from "../components/AuthForm";
import Feedback from "../components/Feedback";
import LogoMark from "../components/LogoMark";
import { CommunityCard, RoleCard } from "../components/MarketingCards";
import ProductPreview from "../components/ProductPreview";
import { sinhalaName, sinhalaPromise } from "../data/options";

function LandingPage({
  authForm,
  authMode,
  error,
  loading,
  notice,
  onAuthFormChange,
  onAuthModeChange,
  onAuthSubmit
}) {
  return (
    <main className="public-shell">
      <nav className="public-nav">
        <LogoMark />
        <button className="ghost-button" onClick={() => document.getElementById("auth")?.scrollIntoView()}>
          Parent login
        </button>
      </nav>

      <section className="flyer-hero">
        <div className="hero-copy">
          <LogoMark size="hero" />
          <p className="hero-kicker">Sri Lanka's First Parent Helpdesk Platform for Primary Schools</p>
          <h1>Saviya - Smart Parent Helpdesk for Primary Schools</h1>
          <div className="sinhala-title">{sinhalaName}</div>
          <p className="tagline">Ask. Ticket. Track. Get Answered.</p>
          <p className="hero-description">
            A simple helpdesk platform for Sri Lankan parents to raise school-related
            questions and get clear responses from responsible staff.
          </p>
          <div className="quote-card">{sinhalaPromise}</div>
          <div className="hero-actions">
            <button onClick={() => document.getElementById("auth")?.scrollIntoView()}>
              Get started
            </button>
            <button className="secondary-button" onClick={() => onAuthModeChange("register")}>
              Create account
            </button>
          </div>
        </div>

        <div className="family-hero-card" aria-label="Parent and child using Saviya">
          <div className="family-visual">
            <div className="person parent-person" />
            <div className="person child-person" />
            <div className="phone-card">
              <span>saviya</span>
              <strong>12</strong>
              <small>My Tickets</small>
            </div>
          </div>
          <div className="ai-ready-card">
            <span>AI-Powered Future Ready</span>
            <p>
              Saviya will use AI to understand, categorize, and provide smart
              answer support faster than ever.
            </p>
          </div>
        </div>
      </section>

      <ChallengeSection />
      <SolutionBand />
      <WhyParentsLove />
      <ProductPreview />
      <CommunitySection />
      <FeatureBand />
      <RoleSection />

      <section className="auth-section" id="auth">
        <div>
          <p className="eyebrow">Secure access</p>
          <h2>{authMode === "login" ? "Login to Saviya" : "Register for Saviya"}</h2>
          <p>
            Parents can start with a normal account. Responders and admins can use
            their assigned role during setup.
          </p>
        </div>
        <AuthForm
          mode={authMode}
          form={authForm}
          loading={loading}
          onModeChange={onAuthModeChange}
          onChange={onAuthFormChange}
          onSubmit={onAuthSubmit}
        />
      </section>

      <footer className="public-footer">
        <strong>Make School Communication Simple, Fast & Stress Free.</strong>
        <span>www.saviya.lk</span>
        <span>hello@saviya.lk</span>
        <span>Sri Lanka</span>
      </footer>

      <Feedback notice={notice} error={error} />
    </main>
  );
}

function ChallengeSection() {
  const challenges = [
    ["Bag", "Teacher said carry something tomorrow?"],
    ["?", "What is the homework for tomorrow?"],
    ["Note", "When is the next school event?"],
    ["i", "Need information about school activities?"]
  ];

  return (
    <section className="challenge-section">
      <h2>Struggling with these everyday school challenges?</h2>
      <div className="challenge-grid">
        {challenges.map(([icon, item]) => (
          <article className="challenge-card" key={item}>
            <span>{icon}</span>
            <h3>{item}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}

function SolutionBand() {
  return (
    <section className="solution-band">
      <div className="solution-copy">
        <h2>Saviya is the simple solution.</h2>
        <p className="tagline">Ask. Ticket. Track. Get Answered.</p>
        <p>All your child's school related questions, answered in one trusted place.</p>
      </div>
      <div className="solution-metrics">
        <div><strong>12</strong><span>My Tickets</span></div>
        <div><strong>5</strong><span>Open</span></div>
        <div><strong>4</strong><span>In Progress</span></div>
        <div><strong>3</strong><span>Resolved</span></div>
      </div>
    </section>
  );
}

function WhyParentsLove() {
  const features = [
    ["Chat", "Easy Ticketing", "Raise a question in seconds."],
    ["Find", "Track Progress", "Track your ticket status in real-time."],
    ["Bell", "Instant Updates", "Get updates when there is a response."],
    ["Team", "Multiple Channels", "Web, mobile and email support."],
    ["Safe", "Secure & Private", "Your data is safe and protected."]
  ];

  return (
    <section className="why-section">
      <h2>Why Parents Love Saviya</h2>
      <div className="feature-row">
        {features.map(([icon, title, text]) => (
          <article className="feature-card" key={title}>
            <span>{icon}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CommunitySection() {
  return (
    <section className="community-section">
      <h2>For Everyone in the School Community</h2>
      <div className="community-grid">
        <CommunityCard
          title="For Parents"
          items={["Raise questions anytime", "Track ticket status", "Get quick responses", "Stay informed"]}
        />
        <CommunityCard
          title="For Staff / Responders"
          items={["View and manage tickets", "Respond efficiently", "Organize by categories", "Better communication"]}
        />
        <CommunityCard
          title="For Admins"
          items={["Manage users and staff", "Monitor all tickets", "Reports and analytics", "Improve school service"]}
        />
        <article className="community-card ai-community">
          <h3>Coming Soon with AI</h3>
          <p>Smart answer suggestions</p>
          <p>Auto category detection</p>
          <p>Similar question finder</p>
          <p>AI chat assistant</p>
        </article>
      </div>
    </section>
  );
}

function FeatureBand() {
  const features = [
    "Easy ticketing",
    "Track progress",
    "Staff responses",
    "Secure communication",
    "Parent friendly dashboard",
    "Future AI assistant"
  ];

  return (
    <section className="content-band compact-band">
      <div>
        <p className="eyebrow">Saviya for schools</p>
        <h2>Make School Communication Simple, Fast & Stress Free.</h2>
      </div>
      <div className="feature-grid">
        {features.map((feature) => (
          <div className="feature-pill" key={feature}>{feature}</div>
        ))}
      </div>
    </section>
  );
}

function RoleSection() {
  return (
    <section className="roles-grid slim-roles">
      <RoleCard
        title="Parents"
        items={["Raise school questions", "Track ticket status", "Get clear responses"]}
      />
      <RoleCard
        title="Responders"
        items={["View and reply to tickets", "Organize by category", "Update status and priority"]}
      />
      <RoleCard
        title="Admins"
        items={["Manage all tickets", "Monitor support performance", "View dashboard analytics"]}
      />
    </section>
  );
}

export default LandingPage;
