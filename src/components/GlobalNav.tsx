import { Link } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';
import { CikSearch } from './CikSearch';

export function GlobalNav() {
  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold hover:text-gray-300 transition-colors">
              MyApp
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/counter" className="hover:text-gray-300 transition-colors">
                Counter
              </Link>
              <Link to="/entities" className="hover:text-gray-300 transition-colors">
                All Entities
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <GlobalSearch />
            <CikSearch />
            <Link to="/profile" className="hover:text-gray-300 transition-colors">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
