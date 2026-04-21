import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="glass border-b border-white/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">DH</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-navy">DeviceHub</h1>
                <p className="text-xs text-muted">QA Device Management</p>
              </div>
            </Link>

            {!isAdmin && (
              <nav className="hidden md:flex gap-6">
                <Link
                  to="/"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'text-primary'
                      : 'text-gray-600 hover:text-navy'
                  }`}
                >
                  Devices
                </Link>
                <Link
                  to="/my-activity"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/my-activity'
                      ? 'text-primary'
                      : 'text-gray-600 hover:text-navy'
                  }`}
                >
                  My Activity
                </Link>
              </nav>
            )}
          </div>

          <div>
            {isAdmin ? (
              <button
                onClick={() => {
                  localStorage.removeItem('admin_token');
                  window.location.href = '/admin/login';
                }}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            ) : (
              <Link to="/admin/login" className="btn-secondary text-sm">
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
