import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-9xl font-bold text-dark-800">404</h1>
      <h2 className="text-3xl font-bold text-white mt-8 mb-2">Page Not Found</h2>
      <p className="text-gray-300 mb-8 max-w-md">
        Pagina căutată nu există sau a fost mutată.
      </p>
      <Link
        to="/"
        className="inline-flex items-center px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors shadow-lg"
      >
        <Home className="h-5 w-5 mr-2" />
        Înapoi Acasă
      </Link>
    </div>
  );
};

export default NotFound;