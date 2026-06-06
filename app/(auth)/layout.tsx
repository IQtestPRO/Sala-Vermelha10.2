export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // As páginas de auth (login/cadastro) são full-screen (.auth-page), em tema escuro.
  return <>{children}</>;
}
