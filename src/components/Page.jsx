import { useEffect } from "react";
import { Link } from "react-router-dom";

// hah-admin breadcrumb (page-header with a home icon) + document title; pages render their own cards.
export default function Page({ title, breadcrumbs = [], children }) {
  useEffect(() => {
    document.title = `${title || "Dashboard"} | Witter24 Admin`;
  }, [title]);

  return (
    <>
      <div className="page-header">
        <div className="page-block">
          <div className="row align-items-center">
            <div className="col-md-12">
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/dashboard" aria-label="Dashboard">
                    <i className="feather icon-home" />
                  </Link>
                </li>
                {breadcrumbs.map((b) => (
                  <li key={`${b.label}-${b.to || ""}`} className="breadcrumb-item">
                    {b.to ? <Link to={b.to}>{b.label}</Link> : b.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
