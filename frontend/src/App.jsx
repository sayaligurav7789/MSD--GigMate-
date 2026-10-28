import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { dashboardPathFor } from "./lib/api";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SignupModal from "./components/SignUp";
import RequireAuth from "./components/RequireAuth";
import VerifyBanner from "./components/VerifyBanner";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Gigs from "./pages/Gigs";
import GigDetail from "./pages/GigDetail";
import CreateGig from "./pages/CreateGig";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Tasks from "./pages/Tasks";
import TaskNew from "./pages/TaskNew";
import TaskDetail from "./pages/TaskDetail";
import MyWork from "./pages/MyWork";
import Wallet from "./pages/Wallet";
import Verification from "./pages/Verification";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import StudentProfileSetup from "./pages/StudentProfileSetup";
import ClientProfileSetup from "./pages/ClientProfileSetup";

const Loading = () => <p className="max-w-7xl mx-auto px-6 py-10 text-gray-400">Loading...</p>;

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardPathFor(user.role)} replace />;
}

function AppRoutes() {
  const location = useLocation();
  const state = location.state;
  const user = (role, el, extra = {}) => (
    <RequireAuth role={role} {...extra}>
      {el}
    </RequireAuth>
  );

  return (
    <>
      <Navbar />
      <VerifyBanner />
      <main className="min-h-[70vh]">
        <Routes location={state?.backgroundLocation || location}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupModal />} />

          <Route path="/gigs" element={<Gigs />} />
          <Route path="/gigs/new" element={user("student", <CreateGig />)} />
          <Route path="/gigs/:id" element={<GigDetail />} />
          <Route path="/gigs/:id/edit" element={user("student", <CreateGig />)} />

          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/new" element={user("client", <TaskNew />)} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/my-work" element={user(undefined, <MyWork />)} />

          <Route path="/orders" element={user(undefined, <Orders />)} />
          <Route path="/orders/:id" element={user(undefined, <OrderDetail />)} />
          <Route path="/wallet" element={user(undefined, <Wallet />)} />
          <Route path="/verification" element={user(undefined, <Verification />)} />

          <Route path="/student/profile-setup" element={user("student", <StudentProfileSetup />, { allowIncompleteProfile: true })} />
          <Route path="/client/profile-setup" element={user("client", <ClientProfileSetup />, { allowIncompleteProfile: true })} />
          <Route path="/student/dashboard" element={user("student", <Dashboard />)} />
          <Route path="/client/dashboard" element={user("client", <Dashboard />)} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/admin" element={user("admin", <Admin />)} />

          <Route path="/profile" element={user(undefined, <Profile />)} />
          <Route path="/users/:id" element={<UserProfile />} />
          <Route path="*" element={<div className="max-w-7xl mx-auto px-6 py-20 text-gray-400">Page not found</div>} />
        </Routes>
        {state?.backgroundLocation && (
          <Routes>
            <Route path="/signup" element={<SignupModal />} />
          </Routes>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
