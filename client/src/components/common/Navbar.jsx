import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Camera, History, User, TrendingUp, LogIn, LogOut, Award, Activity, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CalorieForecast from '../common/CalorieForecast';

const Navbar = ({ meals, userProfile }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const [showDesktopForecast, setShowDesktopForecast] = useState(false);
  const [showMobileForecast, setShowMobileForecast] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  if (location.pathname === '/login' || location.pathname === '/signup') return null;

  // Removed dashboard from desktop main navigation
  const mainNavItems = user
    ? [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/log-meal', icon: Camera, label: 'Log' },
      ]
    : [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/log-meal', icon: Camera, label: 'Log Meal' },
      ];

  // Dashboard included only in hamburger menu
  const hamburgerMenuItems = [
    { path: '/dashboard', icon: TrendingUp, label: 'Dashboard' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/achievements', icon: Award, label: 'Badges' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      setIsHamburgerOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              <span className="text-xl font-bold text-primary">CalorieSnap</span>
            </Link>
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      isActive(item.path)
                        ? 'bg-primary text-black'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* Calorie Forecast Dropdown */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowDesktopForecast((prev) => !prev)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-black hover:bg-secondary/80 transition"
                  >
                    <Activity size={20} /> Calorie Forecast
                  </button>
                  {showDesktopForecast && (
                    <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg p-4 z-50">
                      {meals && userProfile ? (
                        <CalorieForecast pastTotals={meals} userProfile={userProfile} />
                      ) : (
                        <p className="text-gray-500 text-sm">Prediction not available</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Hamburger for Account menu */}
              {user && (
                <button
                  onClick={() => setIsHamburgerOpen(true)}
                  className="ml-2 flex items-center gap-2 px-4 py-2 text-black rounded-lg hover:bg-gray-100 transition"
                  aria-label="Open menu"
                >
                  <Menu size={26} />
                </button>
              )}

              {/* Auth */}
              {!user && (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg hover:bg-red-600 transition"
                >
                  <LogIn size={20} />
                  <span className="font-medium">Login</span>
                </Link>
              )}
            </div>

            {/* Hamburger button for mobile */}
            <div className="md:hidden flex items-center">
              {user && (
                <button
                  onClick={() => setIsHamburgerOpen(true)}
                  className="p-2"
                  aria-label="Open menu"
                >
                  <Menu size={26} />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className={`grid gap-1 p-2 ${user ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg transition ${
                  isActive(item.path) ? 'text-primary bg-red-50' : 'text-gray-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Hamburger for Account menu */}
          {user && (
            <button
              onClick={() => setIsHamburgerOpen(true)}
              className="flex flex-col items-center gap-1 py-2 rounded-lg text-gray-600 z-50"
              aria-label="Open menu"
            >
              <Menu size={20} />
              <span className="text-xs font-medium">Menu</span>
            </button>
          )}
        </div>
      </div>

      {/* Hamburger Sidebar Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-full bg-white shadow-lg z-50 transform transition-transform duration-300 ${
          isHamburgerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={() => setIsHamburgerOpen(false)}
          aria-label="Close menu"
        >
          <X size={26} />
        </button>
        <nav className="flex flex-col mt-16 gap-2 px-6">
          {hamburgerMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsHamburgerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition text-lg ${
                  isActive(item.path)
                    ? 'bg-primary text-black'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-lg"
            >
              <LogOut size={22} />
              <span>Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-3 px-3 py-2 bg-primary text-black rounded-lg hover:bg-red-600 transition text-lg"
              onClick={() => setIsHamburgerOpen(false)}
            >
              <LogIn size={22} />
              <span>Login</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile Forecast Modal remains for direct fast-access from bottom bar */}
      {showMobileForecast && (
        <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 w-11/12 max-w-xs z-50 bg-white rounded-lg shadow-lg p-4">
          {meals && userProfile ? (
            <CalorieForecast pastTotals={meals} userProfile={userProfile} />
          ) : (
            <p className="text-gray-500 text-sm">Prediction not available</p>
          )}
          <button
            onClick={() => setShowMobileForecast(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar;
