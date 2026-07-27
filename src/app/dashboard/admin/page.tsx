
export default function AdminPage() {
  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1>Admin Panel</h1>
      <p>Bu sayfa sadece <strong>SUPER_ADMIN</strong> rolüne açıktır.</p>
      <p>Eğer bu mesajı görüyorsanız, SUPER_ADMIN yetkiniz var demektir. ✅</p>
    </div>
  );
}
