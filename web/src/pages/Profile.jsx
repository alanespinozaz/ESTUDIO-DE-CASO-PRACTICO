import React, { useState } from "react";
import api from "../api";

export default function Profile() {
  const u = JSON.parse(localStorage.getItem("user") || "{}");
  const [avatarPath, setAvatarPath] = useState(u.avatarPath || "");

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await api.post(`/users/${u.id}/avatar`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setAvatarPath(data.avatarPath);
    const nu = { ...u, avatarPath: data.avatarPath };
    localStorage.setItem("user", JSON.stringify(nu));
    alert("Avatar actualizado correctamente");
  };

 const img = avatarPath ? `${import.meta.env.VITE_API_BASE}${avatarPath}` : 'https://via.placeholder.com/96'

  return (
    <div className="page-container space-y-4">
      <h1 className="page-title">Mi Cuenta</h1>
      <div className="card-container flex gap-4 items-center">
        <img src={img} alt="avatar" className="w-24 h-24 rounded-full object-cover border" />
        <div className="space-y-2">
          <p className="font-medium">
            {u.username}{" "}
            <span className="text-xs text-gray-500">({u.role})</span>
          </p>
          <label className="border rounded px-3 py-2 cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
            Subir foto
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        </div>
      </div>
    </div>
  );
}
