import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/website/Layout';
import { Home } from './pages/Home';
import { Konfigurator } from './pages/Konfigurator';
import { SharedConfigView } from './pages/SharedConfigView';
import { Impressum } from './pages/Impressum';
import { Datenschutz } from './pages/Datenschutz';
import { Kontakt } from './pages/Kontakt';
import { UeberUns } from './pages/UeberUns';
import { Galerie } from './pages/Galerie';

export default function App() {
  return (
    <Routes>
      {/* Konfigurator: eigene Seite ohne Website-Layout */}
      <Route path="/konfigurator" element={<Konfigurator />} />

      {/* Geteilte Konfigurationsansicht (read-only) */}
      <Route path="/view" element={<SharedConfigView />} />

      {/* Website-Seiten mit Header + Footer */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/kontakt" element={<Kontakt />} />
        <Route path="/ueber-uns" element={<UeberUns />} />
        <Route path="/galerie" element={<Galerie />} />
      </Route>
    </Routes>
  );
}
