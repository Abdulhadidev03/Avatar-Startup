"use client";

import { type FormEvent, useCallback, useState } from "react";
import { PageHeader } from "../dashboard-ui";
import { useDialogFocus } from "../use-dialog-focus";

type SettingsTab = "Workspace" | "Team" | "Notifications" | "Data & privacy";
type TeamRole = "Owner" | "Admin" | "Operator" | "Analyst";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "Active" | "Invite pending";
};

const tabs: SettingsTab[] = ["Workspace", "Team", "Notifications", "Data & privacy"];

const initialMembers: TeamMember[] = [
  { id: "member-1", name: "Abdul Hadi", email: "abdul@northstar.example", role: "Owner", status: "Active" },
  { id: "member-2", name: "Sara Khan", email: "sara@northstar.example", role: "Admin", status: "Active" },
  { id: "member-3", name: "Omar Aziz", email: "omar@northstar.example", role: "Analyst", status: "Active" },
  { id: "member-4", name: "Lina Ahmed", email: "lina@northstar.example", role: "Operator", status: "Invite pending" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("Workspace");
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState("");
  const [workspace, setWorkspace] = useState({
    name: "Northstar",
    slug: "northstar",
    timezone: "America/New_York",
    currency: "USD",
    weekStarts: "Monday",
    defaultSite: "northstar.com",
  });
  const [members, setMembers] = useState(initialMembers);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("Operator");
  const [notifications, setNotifications] = useState({
    hotLeads: true,
    escalations: true,
    integrationFailures: true,
    weeklyImpact: true,
    usageAlerts: true,
    slack: false,
  });
  const [privacy, setPrivacy] = useState({
    retention: "180",
    piiRedaction: true,
    consentMode: true,
    hashVisitors: true,
  });
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const closeInvite = useCallback(() => setShowInvite(false), []);
  const closeDelete = useCallback(() => setShowDelete(false), []);
  const inviteDialogRef = useDialogFocus(showInvite, closeInvite);
  const deleteDialogRef = useDialogFocus(showDelete, closeDelete);

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDirty(false);
    setNotice(`${tab} settings saved.`);
  }

  function changeWorkspace(key: keyof typeof workspace, value: string) {
    setWorkspace((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function changeNotification(key: keyof typeof notifications, value: boolean) {
    setNotifications((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function changePrivacy(key: keyof typeof privacy, value: string | boolean) {
    setPrivacy((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inviteEmail.trim()) return;
    const displayName = inviteEmail.split("@")[0].replace(/[._-]/g, " ");
    setMembers((current) => [
      ...current,
      {
        id: `member-${Date.now()}`,
        name: displayName.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        email: inviteEmail.trim(),
        role: inviteRole,
        status: "Invite pending",
      },
    ]);
    setInviteEmail("");
    setShowInvite(false);
    setNotice(`Invitation sent to ${inviteEmail.trim()}.`);
  }

  function exportWorkspaceData() {
    const data = JSON.stringify({ workspace, members, notifications, privacy }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ruhana-workspace-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Workspace export downloaded.");
  }

  return (
    <div className="ruh-page-stack ruh-settings-page">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage your workspace, team access, notifications, and data preferences."
        actions={
          <button className="ruh-primary-button" type="submit" form="ruh-settings-form" disabled={!dirty}>
            Save changes
          </button>
        }
      />

      {notice ? (
        <div className="ruh-inline-notice is-success" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>Dismiss</button>
        </div>
      ) : null}

      <div className="ruh-settings-layout">
        <nav className="ruh-settings-tabs" aria-label="Settings sections">
          {tabs.map((option) => (
            <button
              key={option}
              type="button"
              className={tab === option ? "is-active" : ""}
              aria-pressed={tab === option}
              onClick={() => { setTab(option); setNotice(""); }}
            >
              {option}
            </button>
          ))}
        </nav>

        <form id="ruh-settings-form" className="ruh-data-surface ruh-settings-form" onSubmit={saveSettings}>
          {tab === "Workspace" ? (
            <>
              <div className="ruh-surface-heading">
                <div><p className="ruh-kicker">General</p><h2>Workspace details</h2><p>Used in reports, billing, and team invitations.</p></div>
              </div>
              <div className="ruh-form-grid">
                <label className="ruh-plain-field">
                  <span>Workspace name</span>
                  <input value={workspace.name} onChange={(event) => changeWorkspace("name", event.target.value)} />
                </label>
                <label className="ruh-plain-field">
                  <span>Workspace slug</span>
                  <div className="ruh-input-prefix"><span>app.ruhana.ai/</span><input value={workspace.slug} onChange={(event) => changeWorkspace("slug", event.target.value)} /></div>
                </label>
                <label className="ruh-plain-field">
                  <span>Timezone</span>
                  <select value={workspace.timezone} onChange={(event) => changeWorkspace("timezone", event.target.value)}>
                    <option value="America/New_York">Eastern Time · New York</option>
                    <option value="Europe/London">Greenwich Mean Time · London</option>
                    <option value="Asia/Karachi">Pakistan Standard Time · Karachi</option>
                    <option value="Asia/Dubai">Gulf Standard Time · Dubai</option>
                  </select>
                </label>
                <label className="ruh-plain-field">
                  <span>Reporting currency</span>
                  <select value={workspace.currency} onChange={(event) => changeWorkspace("currency", event.target.value)}>
                    <option>USD</option><option>GBP</option><option>EUR</option><option>AED</option><option>PKR</option>
                  </select>
                </label>
                <label className="ruh-plain-field">
                  <span>Week starts</span>
                  <select value={workspace.weekStarts} onChange={(event) => changeWorkspace("weekStarts", event.target.value)}>
                    <option>Monday</option><option>Sunday</option>
                  </select>
                </label>
                <label className="ruh-plain-field">
                  <span>Default reporting website</span>
                  <select value={workspace.defaultSite} onChange={(event) => changeWorkspace("defaultSite", event.target.value)}>
                    <option>northstar.com</option><option>help.northstar.com</option><option>app.northstar.com</option>
                  </select>
                </label>
              </div>
            </>
          ) : null}

          {tab === "Team" ? (
            <>
              <div className="ruh-surface-heading">
                <div><p className="ruh-kicker">Access</p><h2>Team members</h2><p>Give each person only the access they need.</p></div>
                <button className="ruh-secondary-button" type="button" onClick={() => setShowInvite(true)}>Invite member</button>
              </div>
              <div className="ruh-table-scroll">
                <table className="ruh-data-table">
                  <thead><tr><th>Member</th><th>Role</th><th>Status</th><th><span className="ruh-sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td><strong>{member.name}</strong><small>{member.email}</small></td>
                        <td>
                          <select
                            value={member.role}
                            disabled={member.role === "Owner"}
                            aria-label={`Role for ${member.name}`}
                            onChange={(event) => {
                              const role = event.target.value as TeamRole;
                              setMembers((current) => current.map((item) => item.id === member.id ? { ...item, role } : item));
                              setNotice(`${member.name} is now ${role}.`);
                            }}
                          >
                            <option>Owner</option><option>Admin</option><option>Operator</option><option>Analyst</option>
                          </select>
                        </td>
                        <td><span className={`ruh-member-status is-${member.status === "Active" ? "active" : "pending"}`}>{member.status}</span></td>
                        <td>
                          {member.role !== "Owner" ? (
                            <button className="ruh-table-action" type="button" onClick={() => { setMembers((current) => current.filter((item) => item.id !== member.id)); setNotice(`${member.name} removed from the workspace.`); }}>
                              Remove
                            </button>
                          ) : <span>Workspace owner</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {tab === "Notifications" ? (
            <>
              <div className="ruh-surface-heading">
                <div><p className="ruh-kicker">Alerts</p><h2>Outcome notifications</h2><p>Stay informed when an agent creates value or needs help.</p></div>
              </div>
              <div className="ruh-toggle-list">
                <label className="ruh-toggle-row"><span><strong>Hot lead detected</strong><small>Send an immediate email when a high-intent visitor is qualified.</small></span><input type="checkbox" checked={notifications.hotLeads} onChange={(event) => changeNotification("hotLeads", event.target.checked)} /></label>
                <label className="ruh-toggle-row"><span><strong>Human support needed</strong><small>Alert operators when an agent escalates a conversation.</small></span><input type="checkbox" checked={notifications.escalations} onChange={(event) => changeNotification("escalations", event.target.checked)} /></label>
                <label className="ruh-toggle-row"><span><strong>Integration failure</strong><small>Notify admins when customer data or actions stop syncing.</small></span><input type="checkbox" checked={notifications.integrationFailures} onChange={(event) => changeNotification("integrationFailures", event.target.checked)} /></label>
                <label className="ruh-toggle-row"><span><strong>Weekly impact report</strong><small>Send revenue, outcomes, visitor insights, and opportunities every Monday.</small></span><input type="checkbox" checked={notifications.weeklyImpact} onChange={(event) => changeNotification("weeklyImpact", event.target.checked)} /></label>
                <label className="ruh-toggle-row"><span><strong>Usage alerts</strong><small>Notify owners at 80% and 100% of the plan allowance.</small></span><input type="checkbox" checked={notifications.usageAlerts} onChange={(event) => changeNotification("usageAlerts", event.target.checked)} /></label>
                <label className="ruh-toggle-row"><span><strong>Send alerts to Slack</strong><small>Requires a connected Slack workspace.</small></span><input type="checkbox" checked={notifications.slack} onChange={(event) => changeNotification("slack", event.target.checked)} /></label>
              </div>
            </>
          ) : null}

          {tab === "Data & privacy" ? (
            <>
              <div className="ruh-surface-heading">
                <div><p className="ruh-kicker">Privacy</p><h2>Visitor data</h2><p>Control retention, identity handling, and consent behavior.</p></div>
              </div>
              <label className="ruh-plain-field ruh-retention-field">
                <span>Conversation retention</span>
                <select value={privacy.retention} onChange={(event) => changePrivacy("retention", event.target.value)}>
                  <option value="30">30 days</option><option value="90">90 days</option><option value="180">180 days</option><option value="365">1 year</option>
                </select>
                <small>Transcripts and event timelines are removed after this period.</small>
              </label>
              <div className="ruh-toggle-list">
                <label className="ruh-toggle-row"><span><strong>Redact personal information</strong><small>Mask payment details, phone numbers, and other sensitive values in transcripts.</small></span><input type="checkbox" checked={privacy.piiRedaction} onChange={(event) => changePrivacy("piiRedaction", event.target.checked)} /></label>
                <label className="ruh-toggle-row"><span><strong>Respect website consent</strong><small>Do not store visitor analytics until your consent manager allows it.</small></span><input type="checkbox" checked={privacy.consentMode} onChange={(event) => changePrivacy("consentMode", event.target.checked)} /></label>
                <label className="ruh-toggle-row"><span><strong>Hash anonymous visitor IDs</strong><small>Use privacy-preserving identifiers for visitors who have not shared details.</small></span><input type="checkbox" checked={privacy.hashVisitors} onChange={(event) => changePrivacy("hashVisitors", event.target.checked)} /></label>
              </div>
              <section className="ruh-settings-subsection">
                <div><h3>Export workspace data</h3><p>Download workspace settings, member access, and privacy preferences.</p></div>
                <button className="ruh-secondary-button" type="button" onClick={exportWorkspaceData}>Export data</button>
              </section>
              <section className="ruh-settings-subsection is-danger">
                <div><h3>Delete workspace</h3><p>Permanently delete agents, conversations, analytics, and integrations.</p></div>
                <button className="ruh-danger-button" type="button" onClick={() => setShowDelete(true)}>Delete workspace</button>
              </section>
            </>
          ) : null}
        </form>
      </div>

      {dirty ? <div className="ruh-unsaved-bar" role="status"><span>You have unsaved changes.</span><button className="ruh-primary-button" type="submit" form="ruh-settings-form">Save changes</button></div> : null}

      {showInvite ? (
        <div className="ruh-modal-backdrop" role="presentation" onMouseDown={closeInvite}>
          <section ref={inviteDialogRef} className="ruh-modal-card" role="dialog" aria-modal="true" aria-labelledby="invite-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
            <div className="ruh-modal-header"><div><p className="ruh-kicker">Team access</p><h2 id="invite-title">Invite a member</h2></div><button type="button" onClick={closeInvite} aria-label="Close dialog">×</button></div>
            <form className="ruh-settings-form" onSubmit={inviteMember}>
              <label className="ruh-plain-field"><span>Email address</span><input data-autofocus type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@company.com" required /></label>
              <label className="ruh-plain-field"><span>Role</span><select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as TeamRole)}><option>Admin</option><option>Operator</option><option>Analyst</option></select></label>
              <div className="ruh-role-note"><strong>{inviteRole}</strong><p>{inviteRole === "Admin" ? "Can manage agents, integrations, and team members." : inviteRole === "Operator" ? "Can manage conversations and configure agents." : "Can view analytics and export reports."}</p></div>
              <div className="ruh-modal-actions"><button className="ruh-secondary-button" type="button" onClick={closeInvite}>Cancel</button><button className="ruh-primary-button" type="submit">Send invitation</button></div>
            </form>
          </section>
        </div>
      ) : null}

      {showDelete ? (
        <div className="ruh-modal-backdrop" role="presentation" onMouseDown={closeDelete}>
          <section ref={deleteDialogRef} className="ruh-modal-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
            <div className="ruh-modal-header"><div><p className="ruh-kicker">Permanent action</p><h2 id="delete-title">Delete Northstar?</h2></div><button type="button" onClick={closeDelete} aria-label="Close dialog">×</button></div>
            <p>This removes every agent, conversation, outcome, integration, and team member. This cannot be undone.</p>
            <label className="ruh-plain-field"><span>Type DELETE to confirm</span><input data-autofocus value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /></label>
            <div className="ruh-modal-actions"><button className="ruh-secondary-button" type="button" onClick={closeDelete}>Keep workspace</button><button className="ruh-danger-button" type="button" disabled={deleteConfirmation !== "DELETE"} onClick={() => { closeDelete(); setDeleteConfirmation(""); setNotice("Deletion confirmation is ready for secure backend handling."); }}>Delete workspace</button></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
