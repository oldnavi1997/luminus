import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-[#c9a84c] mb-3">Luminus</h3>
            <p className="text-gray-400 text-sm">
              Tu destino de confianza para lentes de calidad en Perú.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Tienda</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/lentes" className="hover:text-white transition-colors">Catálogo</Link></li>
              <li><Link href="/carrito" className="hover:text-white transition-colors">Carrito</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Cuenta</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Iniciar sesión</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Registrarse</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Luminus. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
