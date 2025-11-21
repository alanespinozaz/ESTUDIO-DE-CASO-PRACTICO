import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../api";

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (user?.avatarPath)
      setAvatar(`${import.meta.env.VITE_API_BASE}${user.avatarPath}`);
  }, [user]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await api.post(`/users/${user.id}/avatar`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const newUser = { ...user, avatarPath: data.avatarPath };
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    setAvatar(`${import.meta.env.VITE_API_BASE}${data.avatarPath}`);
    alert("Foto actualizada correctamente");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 🔹 Sidebar fijo */}
      <aside className="w-64 bg-blue-50 border-r border-blue-100 flex flex-col justify-between fixed top-0 left-0 h-screen">
        <div className="overflow-y-auto">
          <h1 className="text-2xl font-bold text-blue-800 p-4 text-center">
            Empacadora Acuamar
          </h1>

          {/* 🔹 Usuario con foto */}
          <div className="flex flex-col items-center mb-6 bg-white rounded-lg shadow p-4 mx-3 border border-blue-100">
            <div className="relative group">
              <img
                src={
                  avatar ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="avatar"
                className="w-20 h-20 rounded-full border-2 border-blue-300 object-cover shadow-sm"
              />
              <label className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs cursor-pointer rounded-full transition">
                Cambiar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadAvatar}
                />
              </label>
            </div>
            <p className="mt-2 font-semibold text-blue-700">{user.username}</p>
            <span className="text-xs text-gray-500 uppercase">
              ({user.role})
            </span>
          </div>

          {/* 🔹 Menú principal */}
          <nav className="flex flex-col gap-2 px-4">
            {[
              ["Dashboard", "/"],
              ["Áreas", "/areas"],
              ["Empleados", "/employees"],
              ["Convocatorias", "/convocations"],
              ["Asistencias", "/attendance"],
              ["Reportes", "/reports"],
              ["Mi cuenta", "/profile"],
            ].map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `text-center py-2 rounded-lg font-medium border border-blue-200 shadow-sm transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* 🔹 Botón salir fijo */}
        <div className="p-4 border-t border-blue-100 bg-blue-100/40">
          <button
            onClick={logout}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition font-semibold shadow-sm"
          >
            Salir
          </button>
        </div>
      </aside>

      {/* 🔹 Contenido principal (agregamos margen izquierdo por el sidebar fijo) */}
      <main className="flex-1 ml-64 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
