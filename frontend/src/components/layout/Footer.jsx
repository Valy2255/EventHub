// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Coloană 1: Despre EventHub */}
          <div>
            <h3 className="text-xl font-bold mb-4">EventHub</h3>
            <p className="text-gray-400">
              Descoperă și achiziționează bilete pentru cele mai tari evenimente.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaEnvelope size={20} />
              </a>
            </div>
          </div>

          {/* Coloană 2: Categorii */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categorii</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/events/category/concerts" className="text-gray-400 hover:text-white transition-colors">
                  Concerte
                </Link>
              </li>
              <li>
                <Link to="/events/category/sports" className="text-gray-400 hover:text-white transition-colors">
                  Sport
                </Link>
              </li>
              <li>
                <Link to="/events/category/theater" className="text-gray-400 hover:text-white transition-colors">
                  Teatru
                </Link>
              </li>
              <li>
                <Link to="/events/category/festivals" className="text-gray-400 hover:text-white transition-colors">
                  Festivaluri
                </Link>
              </li>
              <li>
                <Link to="/events/category/conferences" className="text-gray-400 hover:text-white transition-colors">
                  Conferințe
                </Link>
              </li>
            </ul>
          </div>

          {/* Coloană 3: Suport */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Suport</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white transition-colors">
                  Întrebări frecvente
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Termeni & Condiții
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Politica de Confidențialitate
                </Link>
              </li>
            </ul>
          </div>

          {/* Coloană 4: Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <address className="not-italic text-gray-400">
              <p>Cluj-Napoca, România</p>
              <p className="mt-2">Email: contact@eventhub.ro</p>
              <p className="mt-2">Telefon: +40 700 000 000</p>
            </address>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-gray-500">
          <p>&copy; {currentYear} EventHub. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  );
}