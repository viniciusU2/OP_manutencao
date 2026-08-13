import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DocumentBackButton({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to)} className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
      <ArrowLeft size={16} aria-hidden="true" />{label}
    </button>
  );
}
