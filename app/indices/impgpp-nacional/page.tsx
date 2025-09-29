'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IMPGPPNacionalPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to configuration page
    router.push('/indices/impgpp-nacional/configuracion');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo a la configuración...</p>
      </div>
    </div>
  );
}



