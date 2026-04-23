export default function SkeletonList({ count = 4 }) {
  return (
    <ul className="skeleton-list" aria-label="Loading…">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="skeleton-item">
          <div className="skeleton-line skeleton-line--wide" />
          <div className="skeleton-line skeleton-line--narrow" />
        </li>
      ))}
    </ul>
  );
}
