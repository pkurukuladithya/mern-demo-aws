import { sinhalaName } from "../data/options";

function LogoMark({ size = "" }) {
  return (
    <div className={`brand-lockup ${size}`}>
      <div className="logo-symbol">S</div>
      <div>
        <span>saviya</span>
        <strong>{sinhalaName}</strong>
      </div>
    </div>
  );
}

export default LogoMark;
