import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProveedorSesion } from './lib/sesion';
import RutaProtegida from './componentes/RutaProtegida';
import Layout from './componentes/Layout';
import Login from './paginas/Login';
import Inicio from './paginas/Inicio';
import Equipos from './paginas/Equipos';
import EquipoDetalle from './paginas/EquipoDetalle';
import Temporadas from './paginas/Temporadas';

export default function App() {
  return (
    <ProveedorSesion>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
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
