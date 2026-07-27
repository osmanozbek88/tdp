
"use client";

import { useEffect, useState } from "react";
import type { PermissionCode } from "@/lib/auth/permissions";
import { ALL_PERMISSIONS } from "@/lib/auth/permissions";
import type { PermissionWithRoles } from "@/lib/auth/permission-service";

const VALID_ROLES = [
  "SUPER_ADMIN", "DISTRIBUTOR_ADMIN", "DISTRIBUTOR_STAFF",
  "DEALER_ADMIN", "DEALER_STAFF", "SUB_DEALER_ADMIN", "SUB_DEALER_STAFF",
  "EMPLOYEE", "CUSTOMER",
] as const;

type RoleLabel = Record<string, string>;

const ROLE_LABELS: RoleLabel = {
  SUPER_ADMIN: "Süper Admin",
  DISTRIBUTOR_ADMIN: "Distribütör Admin",
  DISTRIBUTOR_STAFF: "Distribütör Personel",
  DEALER_ADMIN: "Bayi Admin",
  DEALER_STAFF: "Bayi Personel",
  SUB_DEALER_ADMIN: "Alt Bayi Admin",
  SUB_DEALER_STAFF: "Alt Bayi Personel",
  EMPLOYEE: "Çalışan",
  CUSTOMER: "Müşteri",
};

interface PermissionMatrix {
  [code: string]: { description: string; group: string; roles: Set<string> };
}

export default function AdminPage() {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  async function loadPermissions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/permissions", { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Yüklenemedi");

      const data: PermissionWithRoles[] = json.data;
      const m: PermissionMatrix = {};

      for (const p of data) {
        m[p.code] = {
          description: p.description ?? p.code,
          group: p.group,
          roles: new Set(p.roles),
        };
      }

      // Ensure all known permissions exist in matrix
      for (const [code, desc] of Object.entries(ALL_PERMISSIONS)) {
        if (!m[code]) {
          m[code] = { description: desc, group: code.split(".")[0]!, roles: new Set() };
        }
      }

      setMatrix(m);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  async function togglePermission(role: string, code: string, hasIt: boolean) {
    if (!matrix) return;
    const key = `${role}:${code}`;
    setSaving(key);

    try {
      const permId = await findPermissionId(code);
      if (!permId) {
        alert(`Permission bulunamadı: ${code}. Önce seed çalıştırın.`);
        setSaving(null);
        return;
      }

      const res = await fetch("/api/auth/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role,
          permissionId: permId,
          action: hasIt ? "revoke" : "grant",
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
    } catch (e: unknown) {
      alert("Yetki güncellenemedi: " + (e instanceof Error ? e.message : "Hata"));
      return;
    } finally {
      setSaving(null);
    }

    // Optimistic update
    setMatrix((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next[code] = { ...next[code]!, roles: new Set(next[code]!.roles) };
      if (hasIt) {
        next[code]!.roles.delete(role);
      } else {
        next[code]!.roles.add(role);
      }
      return next;
    });
  }

  // We need permission IDs, but our matrix only has codes.
  // Fetch permissions list to build a code→id map.
  const [permIdMap, setPermIdMap] = useState<Record<string, string>>({});

  async function findPermissionId(code: string): Promise<string | null> {
    if (permIdMap[code]) return permIdMap[code]!;

    // Lazily load all permissions
    try {
      const res = await fetch("/api/auth/permissions", { credentials: "include" });
      const json = await res.json();
      if (!json.success) return null;

      const map: Record<string, string> = {};
      for (const p of json.data as PermissionWithRoles[]) {
        map[p.code] = p.id;
      }
      setPermIdMap(map);
      return map[code] ?? null;
    } catch {
      return null;
    }
  }

  // Group permissions by group
  const groups = matrix
    ? [...new Set(Object.values(matrix).map((p) => p.group))]
    : [];

  if (loading) return <div style={{ padding: "2rem" }}>Yükleniyor...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>Hata: {error}</div>;
  if (!matrix) return <div style={{ padding: "2rem" }}>Veri bulunamadı.</div>;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "100%" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Rol ve Yetki Yönetimi
      </h1>
      <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
        SUPER_ADMIN tüm yetkilere otomatik sahiptir. Diğer roller için checkbox ile atama yapın.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.8rem",
            border: "1px solid #e2e8f0",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th
                style={{
                  position: "sticky",
                  left: 0,
                  backgroundColor: "#f8fafc",
                  padding: "0.5rem",
                  textAlign: "left",
                  border: "1px solid #e2e8f0",
                  zIndex: 2,
                  minWidth: 160,
                }}
              >
                Grup / Yetki
              </th>
              {VALID_ROLES.map((role) => (
                <th
                  key={role}
                  style={{
                    padding: "0.5rem",
                    textAlign: "center",
                    border: "1px solid #e2e8f0",
                    whiteSpace: "nowrap",
                    fontSize: "0.7rem",
                    minWidth: 70,
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    height: 120,
                  }}
                >
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <>
                <tr key={`hdr-${group}`} style={{ backgroundColor: "#f1f5f9" }}>
                  <td
                    colSpan={VALID_ROLES.length + 1}
                    style={{
                      padding: "0.4rem 0.5rem",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {group}
                  </td>
                </tr>
                {Object.entries(matrix)
                  .filter(([, v]) => v.group === group)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([code, info]) => (
                    <tr
                      key={code}
                      style={{
                        backgroundColor: info.roles.has("SUPER_ADMIN") ? "#fefce8" : "transparent",
                      }}
                    >
                      <td
                        style={{
                          position: "sticky",
                          left: 0,
                          backgroundColor: info.roles.has("SUPER_ADMIN") ? "#fefce8" : "#fff",
                          padding: "0.35rem 0.5rem",
                          border: "1px solid #e2e8f0",
                          fontSize: "0.75rem",
                          zIndex: 1,
                        }}
                      >
                        <div style={{ fontWeight: 500 }}>{code.replace(".", " → ")}</div>
                        <div style={{ color: "#94a3b8", fontSize: "0.65rem" }}>
                          {info.description}
                        </div>
                      </td>
                      {VALID_ROLES.map((role) => {
                        const hasIt = info.roles.has(role);
                        const isSuperAdmin = role === "SUPER_ADMIN";
                        const key = `${role}:${code}`;
                        return (
                          <td
                            key={role}
                            style={{
                              textAlign: "center",
                              padding: "0.35rem",
                              border: "1px solid #e2e8f0",
                              backgroundColor:
                                role === "SUPER_ADMIN" && hasIt ? "#fef9c3" : "transparent",
                            }}
                          >
                            {isSuperAdmin ? (
                              <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                            ) : (
                              <button
                                onClick={() => togglePermission(role, code, hasIt)}
                                disabled={saving === key}
                                style={{
                                  width: 28,
                                  height: 28,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: 4,
                                  border: "1px solid #cbd5e1",
                                  cursor: "pointer",
                                  backgroundColor: hasIt ? "#16a34a" : "#fff",
                                  color: hasIt ? "#fff" : "#94a3b8",
                                  fontSize: "1rem",
                                  lineHeight: 1,
                                  transition: "all 0.15s",
                                }}
                                title={`${hasIt ? "Kaldır" : "Ekle"}: ${ROLE_LABELS[role]} → ${code}`}
                              >
                                {saving === key ? "⋯" : hasIt ? "✓" : "○"}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#94a3b8" }}>
        Değişiklikler anında kaydedilir. Permission cache 60 saniye sonra yenilenir.
      </p>
    </div>
  );
}
