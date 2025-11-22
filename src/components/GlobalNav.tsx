import { Link } from 'react-router-dom';
import { CikSearch } from './CikSearch';

export function GlobalNav() {
  return (
    <nav className="bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-16">
          <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
            <Link to="/" className="text-lg sm:text-xl font-bold text-foreground hover:text-muted-foreground transition-colors">
              MyApp
            </Link>
            <Link to="/counter" className="text-sm sm:text-base text-foreground hover:text-muted-foreground transition-colors">
              Counter
            </Link>
            <Link to="/assets" className="text-sm sm:text-base text-foreground hover:text-muted-foreground transition-colors">
              Assets
            </Link>
            <Link to="/superinvestors" className="text-sm sm:text-base text-foreground hover:text-muted-foreground transition-colors">
              Superinvestors
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-1 sm:flex-initial justify-end">
            <div className="flex-1 sm:flex-initial max-w-md">
              <CikSearch />
            </div>
            <Link to="/profile" className="text-sm sm:text-base text-foreground hover:text-muted-foreground transition-colors flex-shrink-0">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
