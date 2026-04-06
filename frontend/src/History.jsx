import ProviderIcon from './ProviderIcon';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export default function History({ history, onReuse, onRemove, onClear }) {
  if (history.length === 0) return null;

  return (
    <section className="history">
      <div className="history-header">
        <span className="history-label">Recent</span>
        <button className="history-clear" onClick={onClear}>Clear all</button>
      </div>

      <ul className="history-list">
        {history.map(entry => (
          <li key={entry.id} className="history-item" data-provider={entry.provider ?? 'spotify'}>
            <button className="history-reuse" onClick={() => onReuse(entry)} title="Use this prompt again">
              <span className="history-prompt">{entry.prompt}</span>
              <span className="history-meta">{entry.count} songs · {entry.provider ?? 'spotify'} · {timeAgo(entry.createdAt)}</span>
            </button>

            <div className="history-actions">
              <a href={entry.playlistUrl} target="_blank" rel="noreferrer" className="history-link" title="Open playlist">
                <ProviderIcon provider={entry.provider ?? 'spotify'} />
              </a>
              <button className="history-remove" onClick={() => onRemove(entry.id)} title="Remove">
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
