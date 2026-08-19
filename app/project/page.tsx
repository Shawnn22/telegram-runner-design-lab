"use client";

import { AdminConsole } from "../page";
import Link from "next/link";

export default function ProjectPortalPage() {
  return (
    <main className="app-shell project-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Open runner app">
          <span className="brand-mark">R</span>
          <span>RUNNER</span>
          <span className="project-badge">PROJECT PORTAL</span>
        </Link>
        <Link className="project-return" href="/">Open runner app →</Link>
      </header>
      <AdminConsole />
    </main>
  );
}
