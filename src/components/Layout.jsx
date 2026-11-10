import { useEffect, useRef, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import PerfectScrollbar from "react-perfect-scrollbar";
import { useAuth } from "../auth";
import { MENU } from "../resources";
import logo from "../assets/images/logo.jpeg";

// hah-admin AdminLayout: pcoded-navbar (sidebar) + pcoded-header + pcoded-main-container
const useWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
};

const prevent = (fn) => (e) => {
  e.preventDefault();
  fn();
};

function Brand({ collapsed, onToggle }) {
  return (
    <>
      <Link to="/dashboard" className="b-brand">
        <div className="b-bg logo-bg">
          <img src={logo} alt="Witter24" />
        </div>
        <span className="b-title fw-semibold">Witter24</span>
      </Link>
      <a href="#menu" role="button" className={`mobile-menu${collapsed ? " on" : ""}`} id="mobile-collapse" onClick={prevent(onToggle)} aria-label="Toggle menu">
        <span />
      </a>
    </>
  );
}

export default function Layout() {
  const { admin, logout } = useAuth();
  const width = useWidth();
  const mobile = width < 992;
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const wrapperRef = useRef(null);

  // close the mobile menu after navigating
  useEffect(() => {
    if (mobile) setCollapsed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggle = () => setCollapsed((c) => !c);
  const nav_class = ["pcoded-navbar", collapsed ? (mobile ? "mob-open" : "navbar-collapsed") : ""].join(" ");

  const navigation = (
    <>
      <nav className={nav_class}>
        <div className="navbar-wrapper">
          <div className="navbar-brand header-logo">
            <Brand collapsed={collapsed} onToggle={toggle} />
          </div>
          <div className="navbar-content datta-scroll">
            <PerfectScrollbar>
              <ul className="nav pcoded-inner-navbar">
                {MENU.map((m) => (
                  <li key={m.path} className="nav-item">
                    <NavLink to={`/${m.path}`} className="nav-link">
                      <span className="pcoded-micon">
                        <i className={`feather icon-${m.icon}`} />
                      </span>
                      <span className="pcoded-mtext">{m.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </PerfectScrollbar>
          </div>
        </div>
      </nav>
      <header className="navbar pcoded-header navbar-expand-lg header-default">
        <div className="m-header">
          <a href="#menu" role="button" className={`mobile-menu${collapsed ? " on" : ""}`} onClick={prevent(toggle)} aria-label="Toggle menu">
            <span />
          </a>
          <Link to="/dashboard" className="b-brand">
            <div className="b-bg logo-bg">
              <img src={logo} alt="Witter24" />
            </div>
            <span className="b-title fw-semibold">Witter24</span>
          </Link>
        </div>
        <div className="collapse navbar-collapse d-flex justify-content-end">
          <ul className="navbar-nav ms-auto">
            <li>
              <Dropdown align="end" className="drp-user">
                <Dropdown.Toggle as="a" variant="link" id="dropdown-user" className="cursor-pointer text-decoration-none">
                  <i className="feather icon-user me-1" />
                  <span className="d-none d-sm-inline">{admin?.email}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="profile-notification">
                  <div className="pro-head px-3 py-2">
                    <span className="d-block text-muted small">Signed in as</span>
                    <strong>{admin?.email}</strong>
                  </div>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to={admin ? `/admin_users/${admin.id}` : "/admin_users"}>
                    <i className="feather icon-user me-2" /> My Account
                  </Dropdown.Item>
                  <Dropdown.Item onClick={logout}>
                    <i className="feather icon-log-out me-2" /> Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </li>
          </ul>
        </div>
      </header>
    </>
  );

  return (
    <>
      {mobile ? (
        <div className={`nav-outside${collapsed ? " mob-backdrop" : ""}`} ref={wrapperRef}>
          {navigation}
        </div>
      ) : (
        navigation
      )}
      <div
        className={mobile ? "pcoded-outside" : undefined}
        onClick={mobile && collapsed ? (e) => !wrapperRef.current?.contains(e.target) && setCollapsed(false) : undefined}
      >
        <div className="pcoded-main-container">
          <div className="pcoded-wrapper">
            <div className="pcoded-content">
              <div className="pcoded-inner-content">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
