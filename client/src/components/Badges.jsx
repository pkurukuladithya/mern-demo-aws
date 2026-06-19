import { labelize } from "../utils/format";

export function StatusBadge({ value }) {
  return <span className={`badge status-${value}`}>{labelize(value)}</span>;
}

export function PriorityBadge({ value }) {
  return <span className={`badge priority-${value}`}>{value}</span>;
}
