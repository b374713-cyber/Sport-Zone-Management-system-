// FRONT-END: src/layout/AdminLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, borderRight: "1px solid #eee", padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Admin</h3>
        <nav>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            {/* Add more admin links later if you want */}
            <li>
              <NavLink to="/admin/employees">Employees</NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
