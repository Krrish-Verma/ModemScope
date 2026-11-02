import Link from "next/link";
import { RadioTower } from "lucide-react";

export function Nav() {
  const github = process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com";
  return (
    <header className="nav-shell">
      <nav className="nav" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="ModemScope home">
          <span className="brand-mark"><RadioTower size={16} /></span>
          ModemScope
        </Link>
        <div className="nav-links">
          <Link href="/#overview">Overview</Link>
          <Link href="/learn">How it works</Link>
          <a href={github} target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <Link className="button button-small" href="/lab">Launch simulator</Link>
      </nav>
    </header>
  );
}
