import React, { useEffect, useState } from "react";
import api from "../api"; // API configurada para acceder a tu backend
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend } from "recharts";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await api.get("/dashboard");
      setData(data);
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
    }
  };

  if (!data)
    return <p className="text-center mt-10 text-gray-600">Cargando...</p>;

  // Colores para el gráfico circular
  const COLORS = [
    "#2563eb", // Azul
    "#ef4444", // Rojo
    "#22c55e", // Verde
    "#6b7280", // Gris
    "#9333ea", // Morado
    "#f97316", // Naranja
  ];

  // Datos para el gráfico circular
  const pieData = [
    { name: "Convocatorias abiertas", value: data.convocatoriasAbiertas },
    { name: "Convocatorias cerradas", value: data.convocatoriasCerradas },
    { name: "Empleados activos", value: data.empleadosActivos },
    { name: "Empleados inactivos", value: data.empleadosInactivos },
    { name: "Penalizaciones activas", value: data.penalizacionesActivas },
    { name: "Total de áreas", value: data.totalAreas },
  ];

  return (
    <div className="page-container">
      <h1 className="page-title text-blue-800 font-bold mb-6">Dashboard</h1>

      {/* ================== TARJETAS DE INDICADORES ================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Convocatorias abiertas */}
        <div className="bg-blue-100 p-4 rounded-lg shadow text-center border border-blue-300">
          <h3 className="text-blue-800 font-semibold">Convocatorias abiertas</h3>
          <p className="text-3xl font-bold text-blue-700 mt-1">
            {data.convocatoriasAbiertas}
          </p>
        </div>

        {/* Convocatorias cerradas */}
        <div className="bg-red-100 p-4 rounded-lg shadow text-center border border-red-300">
          <h3 className="text-red-800 font-semibold">Convocatorias cerradas</h3>
          <p className="text-3xl font-bold text-red-700 mt-1">
            {data.convocatoriasCerradas}
          </p>
        </div>

        {/* Empleados activos */}
        <div className="bg-green-100 p-4 rounded-lg shadow text-center border border-green-300">
          <h3 className="text-green-800 font-semibold">Empleados activos</h3>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {data.empleadosActivos}
          </p>
        </div>

        {/* Empleados inactivos */}
        <div className="bg-gray-100 p-4 rounded-lg shadow text-center border border-gray-300">
          <h3 className="text-gray-700 font-semibold">Empleados inactivos</h3>
          <p className="text-3xl font-bold text-gray-800 mt-1">
            {data.empleadosInactivos}
          </p>
        </div>

        {/* Penalizaciones activas */}
        <div className="bg-purple-100 p-4 rounded-lg shadow text-center border border-purple-300">
          <h3 className="text-purple-800 font-semibold">Penalizaciones activas</h3>
          <p className="text-3xl font-bold text-purple-700 mt-1">
            {data.penalizacionesActivas}
          </p>
        </div>

        {/* Total de áreas */}
        <div className="bg-orange-100 p-4 rounded-lg shadow text-center border border-orange-300">
          <h3 className="text-orange-800 font-semibold">Total de áreas</h3>
          <p className="text-3xl font-bold text-orange-700 mt-1">
            {data.totalAreas}
          </p>
        </div>
      </div>

      {/* ================== GRÁFICO DE DISTRIBUCIÓN ================== */}
      <div className="card-container mb-6">
        <h2 className="text-lg font-semibold text-blue-700 mb-3">
          Distribución general
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={110}
              label
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            {/* Agregar leyenda */}
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value, entry, index) => (
                <span>{`${value}: ${pieData[index].value}%`}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
