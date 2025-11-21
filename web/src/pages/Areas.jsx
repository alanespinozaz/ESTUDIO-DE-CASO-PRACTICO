import React, { useEffect, useState } from "react";
import api from "../api";
import Swal from "sweetalert2";

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ id: null, nombre: "" });
  const [search, setSearch] = useState("");

  const loadAreas = async () => {
    try {
      const { data } = await api.get("/areas");
      setAreas(data);
    } catch {
      Swal.fire("Error", "No se pudieron cargar las áreas", "error");
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const handleSave = async () => {
    const nombre = form.nombre.trim().replace(/\s+/g, " ").toUpperCase();
    if (!nombre)
      return Swal.fire("Aviso", "El nombre del área es obligatorio", "warning");

    try {
      if (editMode) {
        await api.put(`/areas/${form.id}`, { nombre });
        Swal.fire("Actualizado", "Área actualizada correctamente ", "success");
      } else {
        await api.post("/areas", { nombre });
        Swal.fire("Agregado", "Área registrada con éxito ", "success");
      }

      setShowModal(false);
      setEditMode(false);
      setForm({ id: null, nombre: "" });
      loadAreas();
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo guardar el área";
      Swal.fire("Error", msg, "error");
    }
  };

  const handleEdit = (area) => {
    setForm({ id: area.id, nombre: area.nombre });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar área?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/areas/${id}`);
      Swal.fire("Eliminada", "Área eliminada correctamente ", "success");
      loadAreas();
    } catch {
      Swal.fire("Error", "No se pudo eliminar el área", "error");
    }
  };

  const filtered = areas.filter((a) =>
    a.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <h1 className="page-title text-blue-800 font-bold mb-4">
        Gestión de Áreas
      </h1>

      {/* 🔹 BARRA DE BÚSQUEDA Y BOTÓN AGREGAR */}
      <div className="flex flex-wrap gap-2 items-center mb-4 bg-blue-50 border border-blue-200 p-3 rounded-lg shadow-sm">
        <input
          className="border border-blue-300 rounded-lg p-2 flex-1"
          placeholder="Buscar área..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => {
            setForm({ id: null, nombre: "" });
            setEditMode(false);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow-md transition"
        >
          Agregar
        </button>
      </div>

      {/* 🔹 TABLA DE ÁREAS */}
      <div className="bg-white border border-blue-100 rounded-xl shadow p-4 w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm text-left">
          <thead>
            <tr className="bg-blue-100 text-blue-800 text-center">
              <th className="py-2 px-3 w-16 text-center">N°</th>
              <th className="py-2 px-4 text-left">Nombre del Área</th>
              {/* Centramos “Acciones” visualmente */}
              <th className="py-2 px-4 text-center w-56">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500 italic">
                  No se encontraron áreas.
                </td>
              </tr>
            ) : (
              filtered.map((a, index) => (
                <tr
                  key={a.id}
                  className="border-t hover:bg-blue-50 transition text-center"
                >
                  <td className="font-semibold text-gray-600 text-center">
                    {index + 1}
                  </td>
                  <td className="text-left">{a.nombre}</td>
                  {/*  ontenedor centrado para los botones */}
                  <td className="text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-1 rounded transition"
                        onClick={() => handleEdit(a)}
                      >
                        Editar
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded transition"
                        onClick={() => handleDelete(a.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white w-11/12 md:w-1/2 rounded-xl shadow-lg p-6 relative animate-fadeIn">
            <button
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
              onClick={() => setShowModal(false)}
            >
              ✖
            </button>

            <h2 className="text-xl font-semibold text-blue-700 mb-4 text-center">
              {editMode ? "Editar área" : "Registrar nueva área"}
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Nombre del área *
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={(e) =>
                  setForm({ ...form, nombre: e.target.value.toUpperCase() })
                }
                className="border border-blue-300 rounded p-2 w-full"
                placeholder="Ejemplo: EMPAQUE, SUPERVISIÓN..."
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md"
              >
                {editMode ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}