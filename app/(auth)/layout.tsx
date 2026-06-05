export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-main" style={{ padding: "0 20px" }}>
      {children}
    </div>
  );
}
