function Feedback({ notice, error }) {
  return (
    <>
      {notice && <div className="feedback success">{notice}</div>}
      {error && <div className="feedback error">{error}</div>}
    </>
  );
}

export default Feedback;
