import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardPathFor } from "../lib/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const link = "hover:text-white";

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="sticky top-0 z-30 bg-[#021b16]/90 backdrop-blur border-b border-[#0f3d34]">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#18c29c] rounded-md flex items-center justify-center text-black font-bold">g</div>
          <span className="text-white font-semibold text-lg">GigMate</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          {user?.role !== "admin" && (
            <>
              <Link to="/gigs" className={link}>Browse Gigs</Link>
              <Link to="/tasks" className={link}>Tasks</Link>
            </>
          )}
          {user?.role === "student" && (
            <>
              <Link to={dashboardPathFor("student")} className={link}>Dashboard</Link>
              <Link to="/gigs/new" className={link}>Create Gig</Link>
              <Link to="/my-work" className={link}>My Proposals</Link>
            </>
          )}
          {user?.role === "client" && (
            <>
              <Link to={dashboardPathFor("client")} className={link}>Dashboard</Link>
              <Link to="/tasks/new" className={link}>Post Task</Link>
              <Link to="/my-work" className={link}>My Tasks</Link>
            </>
          )}
          {user && user.role !== "admin" && (
            <>
              <Link to="/orders" className={link}>Orders</Link>
              <Link to="/wallet" className={link}>Wallet</Link>
            </>
          )}
          {user?.role === "admin" && <Link to="/admin" className={link}>Admin Panel</Link>}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to={user.role === "admin" ? "/admin" : "/profile"}
                className="hidden sm:block text-sm text-gray-300 hover:text-white"
              >
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 text-sm rounded-md border border-[#0f3d34] text-gray-200 hover:bg-[#0f3d34]"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-300 hover:text-white">Sign in</Link>
              <Link to="/signup" className="px-4 py-1.5 text-sm rounded-md bg-[#18c29c] text-black font-semibold hover:opacity-90">
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
