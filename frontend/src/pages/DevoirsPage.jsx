// src/pages/DevoirsPage.jsx
// Page principale du module Devoirs & Travaux de Groupe
// S'adapte au rôle : enseignant / étudiant / admin

import { useState, useEffect } from "react";
import {
  devoirsAPI,
  groupesAPI,
  soumissionsAPI,
  calendrierAPI,
  notificationsAPI,
  badgesAPI,
} from "../api/devoirs";
import KanbanDevoirs from "../components/devoirs/KanbanDevoirs";
import GroupeChat    from "../components/devoirs/GroupeChat";

// ── Helpers UI ──────────────────────────────
function Btn({ children, onClick, variant = "default", disabled, style = {} }) {
  const styles = {
    default:  { background: "#F9FAFB", color: "#374151", border: "1px solid #E5E7EB" },
    primary:  { background: "#1D4ED8", color: "#fff",    border: "none" },
    danger:   { background: "#EF4444", color: "#fff",    border: "none" },
    success:  { background: "#16A34A", color: "#fff",    border: "none" },
    warning:  { background: "#F59E0B", color: "#fff",    border: "none" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "7px 16px",
        borderRadius: 8,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontWeight: 500,
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.15s",
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 14 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Formulaire de création de devoir ───────
function FormulaireDevoir({ onCreer, loading }) {
  const [form, setForm] = useState({
    cours: "",
    enseignant: "",
    titre: "",
    description: "",
    consignes: "",
    type_devoir: "individuel",
    date_limite: "",
    note_max: 20,
    coefficient: 1,
    detection_plagiat: true,
    creation_groupes_auto: false,
    taille_groupe_max: 4,
  });

  const champ = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const inputStyle = {
    width: "100%",
    fontSize: 13,
    padding: "8px 10px",
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    background: "#F9FAFB",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
            Titre du devoir *
          </label>
          <input style={inputStyle} value={form.titre} onChange={champ("titre")} placeholder="Ex: Projet Django REST" />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
            ID Cours *
          </label>
          <input style={inputStyle} value={form.cours} onChange={champ("cours")} placeholder="ID du cours" type="number" />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
            ID Enseignant *
          </label>
          <input style={inputStyle} value={form.enseignant} onChange={champ("enseignant")} placeholder="ID de l'enseignant" type="number" />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
            Type de devoir
          </label>
          <select style={inputStyle} value={form.type_devoir} onChange={champ("type_devoir")}>
            <option value="individuel">Individuel</option>
            <option value="groupe">Travail de groupe</option>
            <option value="examen">Examen</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
            Date limite *
          </label>
          <input style={inputStyle} type="datetime-local" value={form.date_limite} onChange={champ("date_limite")} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
            Note max
          </label>
          <input style={inputStyle} type="number" value={form.note_max} onChange={champ("note_max")} min={0} max={100} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
          Description / Consignes
        </label>
        <textarea
          style={{ ...inputStyle, height: 80, resize: "vertical" }}
          value={form.consignes}
          onChange={champ("consignes")}
          placeholder="Décrivez les consignes détaillées du devoir…"
        />
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
        <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={form.detection_plagiat} onChange={champ("detection_plagiat")} />
          Détection plagiat automatique
        </label>
        {form.type_devoir === "groupe" && (
          <>
            <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={form.creation_groupes_auto} onChange={champ("creation_groupes_auto")} />
              Création groupes automatique
            </label>
            <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              Taille groupe max :
              <input
                type="number"
                value={form.taille_groupe_max}
                onChange={champ("taille_groupe_max")}
                style={{ ...inputStyle, width: 60 }}
                min={2} max={10}
              />
            </label>
          </>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <Btn variant="primary" onClick={() => onCreer(form)} disabled={loading || !form.titre || !form.date_limite || !form.cours}>
          {loading ? "Création…" : "✚ Créer le devoir"}
        </Btn>
      </div>
    </div>
  );
}

// ── Panneau de correction ───────────────────
function PanneauCorrection({ devoirId }) {
  const [soumissions, setSoumissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [noteEnCours, setNoteEnCours] = useState({});
  const [commentEnCours, setCommentEnCours] = useState({});

  useEffect(() => {
    soumissionsAPI.list({ devoir_id: devoirId }).then((data) => {
      setSoumissions(data.results || data);
      setLoading(false);
    });
  }, [devoirId]);

  const corriger = async (soumissionId) => {
    try {
      await soumissionsAPI.corriger(
        soumissionId,
        noteEnCours[soumissionId],
        commentEnCours[soumissionId] || ""
      );
      setSoumissions((prev) =>
        prev.map((s) =>
          s.id === soumissionId
            ? { ...s, note_obtenue: noteEnCours[soumissionId], commentaire_correction: commentEnCours[soumissionId] }
            : s
        )
      );
      alert("✅ Correction enregistrée !");
    } catch (e) {
      alert("Erreur : " + e.message);
    }
  };

  const lancerPlagiat = async (soumissionId) => {
    try {
      const res = await soumissionsAPI.lancerPlagiat(soumissionId);
      setSoumissions((prev) =>
        prev.map((s) =>
          s.id === soumissionId
            ? { ...s, pourcentage_plagiat: res.pourcentage_plagiat, alerte_plagiat: res.alerte }
            : s
        )
      );
    } catch (e) {
      alert("Erreur plagiat : " + e.message);
    }
  };

  if (loading) return <div style={{ color: "#9CA3AF", padding: 20 }}>Chargement…</div>;

  return (
    <div>
      {soumissions.length === 0 ? (
        <div style={{ color: "#9CA3AF", padding: 20, textAlign: "center" }}>
          Aucune soumission reçue
        </div>
      ) : (
        soumissions.map((s) => (
          <div
            key={s.id}
            style={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "#DBEAFE", color: "#1E40AF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  {(s.etudiant_nom || s.groupe_nom || "?")[0]}
                </div>
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {s.etudiant_nom || s.groupe_nom || `Soumission #${s.id}`}
                </span>
                {s.est_en_retard && (
                  <span style={{ fontSize: 10, background: "#FEF2F2", color: "#B91C1C", padding: "2px 7px", borderRadius: 8 }}>
                    En retard
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Plagiat */}
                {s.pourcentage_plagiat > 0 ? (
                  <span
                    style={{
                      fontSize: 11, fontWeight: 600,
                      color: s.alerte_plagiat ? "#B91C1C" : s.pourcentage_plagiat > 25 ? "#92400E" : "#166534",
                    }}
                  >
                    Plagiat : {s.pourcentage_plagiat}%
                    {s.alerte_plagiat && " ⚠️"}
                  </span>
                ) : (
                  <Btn onClick={() => lancerPlagiat(s.id)} style={{ fontSize: 11, padding: "3px 10px" }}>
                    🔍 Analyser
                  </Btn>
                )}
                {/* Note */}
                {s.note_obtenue !== null && s.note_obtenue !== undefined ? (
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#1D4ED8" }}>
                    {s.note_obtenue}/20
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>Non corrigé</span>
                )}
              </div>
            </div>

            {/* Commentaire existant */}
            {s.commentaire_correction && (
              <div
                style={{
                  fontSize: 12, color: "#6B7280",
                  background: "#F9FAFB", borderRadius: 6,
                  padding: "7px 10px", marginBottom: 8, lineHeight: 1.5,
                }}
              >
                {s.commentaire_correction}
              </div>
            )}

            {/* Formulaire correction */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <textarea
                  placeholder="Commentaire de correction…"
                  value={commentEnCours[s.id] || ""}
                  onChange={(e) => setCommentEnCours((p) => ({ ...p, [s.id]: e.target.value }))}
                  style={{
                    width: "100%", fontSize: 12, padding: "7px 10px",
                    border: "1px solid #E5E7EB", borderRadius: 8,
                    background: "#F9FAFB", resize: "none", height: 60,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Note"
                  value={noteEnCours[s.id] || ""}
                  onChange={(e) => setNoteEnCours((p) => ({ ...p, [s.id]: e.target.value }))}
                  min={0} max={20}
                  style={{
                    width: 70, fontSize: 13, padding: "7px 8px",
                    border: "1px solid #E5E7EB", borderRadius: 8,
                    background: "#F9FAFB", marginBottom: 6,
                  }}
                />
                <br />
                <Btn
                  variant="success"
                  onClick={() => corriger(s.id)}
                  disabled={!noteEnCours[s.id]}
                  style={{ padding: "5px 12px", fontSize: 12 }}
                >
                  ✓ Enregistrer
                </Btn>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Badges Étudiant ─────────────────────────
function BadgesEtudiant() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    badgesAPI.mesBadges().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div style={{ color: "#9CA3AF", padding: 20 }}>Chargement…</div>;

  const badges = data?.badges || [];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Badges obtenus", val: data?.nb_obtenus || 0, color: "#1D4ED8" },
          { label: "Total badges",   val: data?.nb_total   || 0, color: "#6B7280" },
          { label: "Points totaux",  val: data?.points_total || 0, color: "#D97706" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 20px", flex: 1, textAlign: "center", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {badges.map((b) => (
          <div
            key={b.code}
            style={{
              background: b.obtenu ? "#FFFFFF" : "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              padding: "14px 10px",
              textAlign: "center",
              opacity: b.obtenu ? 1 : 0.45,
              filter: b.obtenu ? "none" : "grayscale(1)",
            }}
          >
            <div
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: b.couleur === "gold" ? "#FEF3C7" : b.couleur === "green" ? "#D1FAE5" : b.couleur === "purple" ? "#EDE9FE" : "#DBEAFE",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 8px", fontSize: 22,
              }}
            >
              {b.categorie === "excellence"    ? "🏆"
               : b.categorie === "ponctualite" ? "⏰"
               : b.categorie === "collaboration" ? "🤝"
               : b.categorie === "integrite"    ? "🛡️"
               : "📈"}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", marginBottom: 3 }}>{b.nom}</div>
            <div style={{ fontSize: 10, color: "#9CA3AF", lineHeight: 1.4 }}>{b.description}</div>
            {b.obtenu && b.date_obtention && (
              <div style={{ fontSize: 10, color: "#16A34A", marginTop: 4 }}>
                ✓ {new Date(b.date_obtention).toLocaleDateString("fr-FR")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notifications ───────────────────────────
function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsAPI.list().then((data) => {
      setNotifs(data.results || data);
      setLoading(false);
    });
  }, []);

  const marquerLu = (ids) => {
    notificationsAPI.marquerLu(ids).then(() => {
      setNotifs((prev) => prev.map((n) => ids.includes(n.id) ? { ...n, est_lu: true } : n));
    });
  };

  const TYPE_ICONS = {
    nouveau_devoir:   "📚",
    rappel_echeance:  "⏰",
    soumission_recue: "📩",
    devoir_corrige:   "✅",
    alerte_retard:    "⚠️",
    alerte_plagiat:   "🔍",
    badge_obtenu:     "🏅",
    message_groupe:   "💬",
  };

  const DOT_COLORS = {
    nouveau_devoir:   "#3B82F6",
    rappel_echeance:  "#F59E0B",
    soumission_recue: "#22C55E",
    devoir_corrige:   "#22C55E",
    alerte_retard:    "#F59E0B",
    alerte_plagiat:   "#EF4444",
    badge_obtenu:     "#D97706",
    message_groupe:   "#3B82F6",
  };

  if (loading) return <div style={{ color: "#9CA3AF", padding: 20 }}>Chargement…</div>;

  const nonLues = notifs.filter((n) => !n.est_lu);

  return (
    <div>
      {nonLues.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Btn onClick={() => marquerLu(nonLues.map((n) => n.id))} style={{ fontSize: 12 }}>
            Tout marquer comme lu ({nonLues.length})
          </Btn>
        </div>
      )}
      {notifs.length === 0 ? (
        <div style={{ color: "#9CA3AF", textAlign: "center", padding: 30 }}>
          Aucune notification
        </div>
      ) : (
        notifs.map((n) => (
          <div
            key={n.id}
            style={{
              display: "flex", gap: 10,
              padding: "10px 0",
              borderBottom: "1px solid #F3F4F6",
              opacity: n.est_lu ? 0.6 : 1,
            }}
          >
            <div
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: DOT_COLORS[n.type_notif] || "#3B82F6",
                flexShrink: 0, marginTop: 5,
              }}
            />
            <span style={{ fontSize: 16, flexShrink: 0 }}>{TYPE_ICONS[n.type_notif] || "🔔"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: n.est_lu ? 400 : 600, color: "#111827" }}>
                {n.titre}
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 1.5 }}>
                {n.message}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>
              {new Date(n.date_envoi).toLocaleDateString("fr-FR")}
              {!n.est_lu && (
                <button
                  onClick={() => marquerLu([n.id])}
                  style={{ display: "block", fontSize: 10, color: "#1D4ED8", background: "none", border: "none", cursor: "pointer", marginTop: 2 }}
                >
                  Marquer lu
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── PAGE PRINCIPALE ─────────────────────────
export default function DevoirsPage({ role = "enseignant" }) {
  const [onglet, setOnglet]       = useState("kanban");
  const [devoirSelectionne, setDevoirSelectionne] = useState(null);
  const [creationLoading, setCreationLoading]     = useState(false);
  const [groupeOuvert, setGroupeOuvert]           = useState(null);

  const onglets = {
    enseignant: [
      { key: "kanban",      label: "📋 Tableau" },
      { key: "correction",  label: "✏️ Corrections" },
      { key: "plagiat",     label: "🔍 Plagiat" },
      { key: "creer",       label: "✚ Créer devoir" },
      { key: "calendrier",  label: "📅 Calendrier" },
      { key: "notifications", label: "🔔 Notifications" },
    ],
    etudiant: [
      { key: "kanban",       label: "📋 Mes devoirs" },
      { key: "groupes",      label: "👥 Mes groupes" },
      { key: "badges",       label: "🏅 Badges" },
      { key: "notifications", label: "🔔 Notifications" },
    ],
    admin: [
      { key: "kanban",       label: "📋 Vue globale" },
      { key: "notifications", label: "🔔 Notifications" },
    ],
  };

  const tabs = onglets[role] || onglets.enseignant;

  const creerDevoir = async (form) => {
    setCreationLoading(true);
    try {
      const devoir = await devoirsAPI.create(form);
      alert(`✅ Devoir "${devoir.titre}" créé avec succès !`);
      setOnglet("kanban");
    } catch (e) {
      alert("Erreur création : " + e.message);
    }
    setCreationLoading(false);
  };

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#0F1B3C", color: "#fff", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>📚</span>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            SmartCampus — Devoirs & Travaux de Groupe
          </h1>
          <p style={{ fontSize: 12, color: "#93C5FD", margin: 0 }}>Module 8</p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 20,
              fontWeight: 500,
              background: role === "enseignant" ? "rgba(251,191,36,0.2)" : role === "admin" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
              color: role === "enseignant" ? "#FCD34D" : role === "admin" ? "#FCA5A5" : "#86EFAC",
              border: `0.5px solid ${role === "enseignant" ? "#FCD34D" : role === "admin" ? "#FCA5A5" : "#86EFAC"}`,
            }}
          >
            {role === "enseignant" ? "Enseignant" : role === "admin" ? "Administrateur" : "Étudiant"}
          </span>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", display: "flex", overflowX: "auto" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setOnglet(t.key)}
            style={{
              padding: "12px 18px",
              fontSize: 13,
              background: "none",
              border: "none",
              borderBottom: onglet === t.key ? "2px solid #1D4ED8" : "2px solid transparent",
              color: onglet === t.key ? "#1D4ED8" : "#6B7280",
              fontWeight: onglet === t.key ? 600 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ padding: "20px 24px", maxWidth: 1280, margin: "0 auto" }}>
        {/* ── KANBAN ── */}
        {onglet === "kanban" && (
          <Section title="Tableau de bord des devoirs">
            <KanbanDevoirs
              onSelectDevoir={(d) => {
                setDevoirSelectionne(d);
                if (role === "enseignant") setOnglet("correction");
              }}
            />
          </Section>
        )}

        {/* ── CRÉER DEVOIR ── */}
        {onglet === "creer" && role === "enseignant" && (
          <Section title="Créer un nouveau devoir">
            <FormulaireDevoir onCreer={creerDevoir} loading={creationLoading} />
          </Section>
        )}

        {/* ── CORRECTIONS ── */}
        {onglet === "correction" && role === "enseignant" && (
          <Section title="Corrections en ligne">
            {devoirSelectionne ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <button
                    onClick={() => setDevoirSelectionne(null)}
                    style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, padding: "4px 12px", fontSize: 12, cursor: "pointer" }}
                  >
                    ← Retour
                  </button>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                    {devoirSelectionne.titre}
                  </h3>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>
                    {devoirSelectionne.nb_soumissions} soumissions
                  </span>
                </div>
                <PanneauCorrection devoirId={devoirSelectionne.id} />
              </div>
            ) : (
              <div style={{ color: "#9CA3AF", textAlign: "center", padding: 30 }}>
                Sélectionnez un devoir dans le tableau pour corriger les soumissions.
              </div>
            )}
          </Section>
        )}

        {/* ── PLAGIAT ── */}
        {onglet === "plagiat" && role === "enseignant" && (
          <Section title="Détection de plagiat">
            {devoirSelectionne ? (
              <PlagiatPanel devoirId={devoirSelectionne.id} titre={devoirSelectionne.titre} />
            ) : (
              <div style={{ color: "#9CA3AF", textAlign: "center", padding: 30 }}>
                Sélectionnez un devoir dans le tableau pour voir les résultats de plagiat.
              </div>
            )}
          </Section>
        )}

        {/* ── GROUPES ÉTUDIANT ── */}
        {onglet === "groupes" && role === "etudiant" && (
          <Section title="Mes groupes de travail">
            <GroupesEtudiant onOuvrirChat={setGroupeOuvert} groupeOuvert={groupeOuvert} />
          </Section>
        )}

        {/* ── BADGES ── */}
        {onglet === "badges" && role === "etudiant" && (
          <Section title="Mes badges et récompenses">
            <BadgesEtudiant />
          </Section>
        )}

        {/* ── NOTIFICATIONS ── */}
        {onglet === "notifications" && (
          <Section title="Notifications">
            <Notifications />
          </Section>
        )}

        {/* ── CALENDRIER ── */}
        {onglet === "calendrier" && (
          <Section title="Calendrier universitaire">
            <CalendrierUniversitaire />
          </Section>
        )}
      </div>
    </div>
  );
}

// ── Groupes Étudiant ────────────────────────
function GroupesEtudiant({ onOuvrirChat, groupeOuvert }) {
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groupesAPI.mesGroupes().then((data) => {
      setGroupes(Array.isArray(data) ? data : data.results || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: "#9CA3AF", padding: 20 }}>Chargement…</div>;

  if (groupeOuvert) {
    return (
      <div>
        <button
          onClick={() => onOuvrirChat(null)}
          style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", marginBottom: 14 }}
        >
          ← Retour aux groupes
        </button>
        <GroupeChat groupeId={groupeOuvert} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
      {groupes.length === 0 ? (
        <div style={{ gridColumn: "1/-1", color: "#9CA3AF", textAlign: "center", padding: 30 }}>
          Vous n'êtes dans aucun groupe pour l'instant.
        </div>
      ) : (
        groupes.map((g) => (
          <div
            key={g.id}
            style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{g.nom}</span>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: g.est_complet ? "#DCFCE7" : "#FEF9C3",
                  color: g.est_complet ? "#166534" : "#854D0E",
                }}
              >
                {g.est_complet ? "Complet" : `${g.nb_membres} membres`}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 10 }}>
              📚 {g.devoir_titre}
            </div>
            {(g.membres_detail || []).slice(0, 4).map((m, i) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: ["#BFDBFE","#A7F3D0","#FDE68A","#DDD6FE"][i % 4], color: ["#1E40AF","#065F46","#92400E","#4C1D95"][i % 4], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600 }}>
                  {m.etudiant_nom?.[0] || "?"}
                </div>
                <span style={{ fontSize: 12, flex: 1 }}>{m.etudiant_nom}</span>
                <div style={{ width: 50, height: 4, background: "#E5E7EB", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${m.contribution_pct}%`, background: "#3B82F6", borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>{m.contribution_pct}%</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <Btn variant="primary" onClick={() => onOuvrirChat(g.id)} style={{ fontSize: 12, padding: "5px 12px" }}>
                💬 Ouvrir le chat
              </Btn>
            </div>
          </div>
        ))
      )}
    </div>
  );

  function Btn({ children, onClick, variant = "default", style = {} }) {
    const styles = {
      default: { background: "#F9FAFB", color: "#374151", border: "1px solid #E5E7EB" },
      primary: { background: "#1D4ED8", color: "#fff",    border: "none" },
    };
    return (
      <button onClick={onClick} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, ...styles[variant], ...style }}>
        {children}
      </button>
    );
  }
}

// ── Panneau Plagiat ─────────────────────────
function PlagiatPanel({ devoirId, titre }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    devoirsAPI.plagiatGlobal(devoirId).then((d) => { setData(d); setLoading(false); });
  }, [devoirId]);

  if (loading) return <div style={{ color: "#9CA3AF", padding: 20 }}>Analyse en cours…</div>;

  const resultats = data?.resultats || [];

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16 }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
        🔍 Résultats plagiat — {titre}
        {data?.nb_alertes > 0 && (
          <span style={{ marginLeft: 8, fontSize: 12, background: "#FEF2F2", color: "#B91C1C", padding: "2px 8px", borderRadius: 8 }}>
            {data.nb_alertes} alerte(s)
          </span>
        )}
      </h4>
      {resultats.map((r) => (
        <div key={r.soumission_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#DBEAFE", color: "#1E40AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>
            {r.etudiant_nom[0]}
          </div>
          <span style={{ fontSize: 13, flex: 1 }}>{r.etudiant_nom}</span>
          <div style={{ width: 120, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${r.pourcentage}%`, background: r.niveau === "danger" ? "#EF4444" : r.niveau === "warn" ? "#F59E0B" : "#22C55E", borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36, color: r.niveau === "danger" ? "#B91C1C" : r.niveau === "warn" ? "#92400E" : "#166534" }}>
            {r.pourcentage}%
          </span>
          {r.alerte && <span style={{ fontSize: 11 }}>⚠️</span>}
        </div>
      ))}
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "#6B7280" }}>
        <span>🟢 0–24% : Acceptable</span>
        <span>🟡 25–59% : Suspect</span>
        <span>🔴 60%+ : Plagiat</span>
      </div>
    </div>
  );
}

// ── Calendrier ──────────────────────────────
function CalendrierUniversitaire() {
  const [evenements, setEvenements] = useState([]);
  const [moisCourant]               = useState(new Date());
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    calendrierAPI
      .list({ mois: moisCourant.getMonth() + 1, annee: moisCourant.getFullYear() })
      .then((data) => { setEvenements(data.results || data); setLoading(false); });
  }, []);

  const TYPE_CONFIG = {
    devoir:  { color: "#3B82F6", label: "Devoir",  emoji: "📚" },
    examen:  { color: "#EF4444", label: "Examen",  emoji: "✍️" },
    rendu:   { color: "#22C55E", label: "Rendu",   emoji: "📤" },
    conge:   { color: "#9CA3AF", label: "Congé",   emoji: "🌴" },
    reunion: { color: "#F59E0B", label: "Réunion", emoji: "👥" },
  };

  if (loading) return <div style={{ color: "#9CA3AF", padding: 20 }}>Chargement…</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          {moisCourant.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </h4>
        {/* Grille calendrier simplifiée */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((j) => (
            <div key={j} style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", fontWeight: 500, padding: "4px 0" }}>
              {j}
            </div>
          ))}
          {Array.from({ length: 35 }).map((_, i) => {
            const jour = i - (new Date(moisCourant.getFullYear(), moisCourant.getMonth(), 1).getDay() - 1 + 7) % 7 + 1;
            const today = new Date().getDate() === jour && new Date().getMonth() === moisCourant.getMonth();
            const evts = evenements.filter((e) => new Date(e.date_debut).getDate() === jour);
            return (
              <div
                key={i}
                style={{
                  minHeight: 36,
                  borderRadius: 6,
                  padding: "4px 6px",
                  background: today ? "#1D4ED8" : jour < 1 || jour > 31 ? "transparent" : "#FFFFFF",
                  border: today ? "none" : jour > 0 && jour <= 31 ? "1px solid #F3F4F6" : "none",
                  position: "relative",
                }}
              >
                {jour > 0 && jour <= 31 && (
                  <>
                    <div style={{ fontSize: 12, color: today ? "#fff" : "#374151", fontWeight: today ? 600 : 400 }}>{jour}</div>
                    {evts.map((e) => (
                      <div key={e.id} style={{ width: 6, height: 6, borderRadius: "50%", background: (TYPE_CONFIG[e.type_event] || TYPE_CONFIG.devoir).color, margin: "2px auto 0" }} />
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <span key={k} style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: v.color }} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Liste des événements */}
      <div>
        <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Événements du mois</h4>
        {evenements.length === 0 ? (
          <div style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun événement</div>
        ) : (
          evenements.map((e) => {
            const cfg = TYPE_CONFIG[e.type_event] || TYPE_CONFIG.devoir;
            return (
              <div key={e.id} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: cfg.color + "20", color: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {cfg.emoji}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{e.titre}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                    {new Date(e.date_debut).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    {e.filiere_nom && ` · ${e.filiere_nom}`}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
