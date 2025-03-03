import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { Routes, Route } from "react-router-dom"; // Dacă folosești React Router

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header-ul sus */}
      <Header />

      {/* Conținutul principal la mijloc */}
      <main className="flex-grow bg-gray-100">
        {/* Aici poți pune rutele sau alte componente */}
        <Routes>
          <Route path="/" element={<h1 className="text-center text-3xl p-4">Pagina de start</h1>} />
          <Route path="/events" element={<h1 className="text-center text-3xl p-4">Evenimente</h1>} />
          {/* ... restul rutelor */}
        </Routes>
      </main>

      {/* Footer-ul jos */}
      <Footer />
    </div>
  );
}

export default App;
