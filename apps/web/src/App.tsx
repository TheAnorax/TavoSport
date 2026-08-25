import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProveedorSesion } from './lib/sesion';
import RutaProtegida from './componentes/RutaProtegida';
import Layout from './componentes/Layout';
import Login from './paginas/Login';
import Inicio from './paginas/Inicio';
import Equipos from './paginas/Equipos';
import EquipoDetalle from './paginas/EquipoDetalle';
import Temporadas from './paginas/Temporadas';
import Jornadas from './paginas/Jornadas';
import JornadaDetalle from './paginas/JornadaDetalle';
import Posiciones from './paginas/Posiciones';
import Publico from './paginas/Publico';
import Configuracion from './paginas/Configuracion';

export default function App() {
  return (
    <ProveedorSesion>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Vista abierta: fuera del layout y sin RutaProtegida, a propósito. */}
          <Route path="/publico/:slug" element={<Publico />} />
          <Route
            element={
              <RutaProtegida>
                <Layout />
              </RutaProtegida>
            }
          >
            <Route path="/" element={<Inicio />} />
            <Route path="/equipos" element={<Equipos />} />
            <Route path="/equipos/:id" element={<EquipoDetalle />} />
            <Route path="/jornadas" element={<Jornadas />} />
            <Route path="/jornadas/:id" element={<JornadaDetalle />} />
            <Route path="/posiciones" element={<Posiciones />} />
            <Route
              path="/configuracion"
              element={
                <RutaProtegida roles={['ADMIN']}>
                  <Configuracion />
                </RutaProtegida>
              }
            />
            <Route
              path="/temporadas"
              element={
                <RutaProtegida roles={['ADMIN']}>
                  <Temporadas />
                </RutaProtegida>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ProveedorSesion>
  );
}
