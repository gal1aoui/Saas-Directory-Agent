import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

export const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group
        ${isActive 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
        }
      `}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};