// Loading frame for /admin: the same shell and block sizes as the Ringkasan view, so nothing jumps when it streams in.
export function DashboardSkeleton() {
  return (
    <div className="dash" aria-busy="true">
      <header className="dash-top">
        <div className="hazard" aria-hidden />
        <div className="dash-top-row">
          {/* eslint-disable-next-line @next/next/no-img-element -- 32px static logo, already sized */}
          <p className="dash-brand"><img className="dash-logo" src="/logo-ppa.png" alt="" width={32} height={32} /><span>Admin</span></p>
        </div>
      </header>
      <nav className="dash-nav" aria-hidden>
        <ul>{Array.from({ length: 5 }, (_, i) => <li key={i}><span className="sk sk-nav" /></li>)}</ul>
      </nav>
      <main className="dash-main">
        <p className="sr-only" role="status">Memuat panel…</p>
        <div className="sec" aria-hidden>
          <span className="sk sk-title" />
          <ul className="kpis">{Array.from({ length: 5 }, (_, i) => <li key={i} className="kpi sk-kpi"><span className="sk sk-line" /><span className="sk sk-big" /></li>)}</ul>
          <div className="panel"><span className="sk sk-chart" /></div>
        </div>
      </main>
    </div>
  );
}
