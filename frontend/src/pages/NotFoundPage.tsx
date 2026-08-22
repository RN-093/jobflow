import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-bg text-center">
      <h1 className="text-4xl font-semibold text-text">404</h1>
      <p className="text-muted">This page doesn&apos;t exist.</p>
      <Link to="/dashboard" className="font-medium text-accent hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
