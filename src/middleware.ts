import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rutas que requieren admin
  const adminRoutes = ['/dashboard/users', '/admin'];

  // Verificar si la ruta requiere admin
  const requiresAdmin = adminRoutes.some(route => pathname.startsWith(route));

  if (requiresAdmin) {
    // Obtener token del cookie
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // Redirigir a login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Aquí deberías verificar el token y extraer el rol del usuario
    // Por ahora, dejamos pasar. En producción, decodifica el JWT
    // Si el usuario no es admin, redirigir a home
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
