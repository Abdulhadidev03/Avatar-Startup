"use client";

import { useCallback, useState } from "react";
import { PageHeader } from "../dashboard-ui";
import { useDialogFocus } from "../use-dialog-focus";

type PlanName = "Starter" | "Growth" | "Scale";

const plans: Record<PlanName, { price: number; minutes: number; agents: number; description: string }> = {
  Starter: { price: 79, minutes: 2500, agents: 2, description: "For one site getting its first agent live." },
  Growth: { price: 249, minutes: 10000, agents: 5, description: "For teams growing sales and support outcomes." },
  Scale: { price: 699, minutes: 35000, agents: 15, description: "For larger teams, traffic, and multiple websites." },
};

const invoices = [
  { id: "INV-2026-0828", date: "Aug 28, 2026", description: "Growth plan", amount: "$249.00", status: "Paid" },
  { id: "INV-2026-0728", date: "Jul 28, 2026", description: "Growth plan", amount: "$249.00", status: "Paid" },
  { id: "INV-2026-0628", date: "Jun 28, 2026", description: "Growth plan", amount: "$249.00", status: "Paid" },
];

export default function BillingPage() {
  const [plan, setPlan] = useState<PlanName>("Growth");
  const [pendingPlan, setPendingPlan] = useState<PlanName>("Growth");
  const [dialog, setDialog] = useState<"plan" | "payment" | null>(null);
  const [notice, setNotice] = useState("");
  const [usageAlert, setUsageAlert] = useState(true);

  const closeDialog = useCallback(() => setDialog(null), []);
  const dialogRef = useDialogFocus(Boolean(dialog), closeDialog);

  const activePlan = plans[plan];
  const usagePercent = Math.min(100, Math.round((4820 / activePlan.minutes) * 100));

  function applyPlan() {
    setPlan(pendingPlan);
    setDialog(null);
    setNotice(
      pendingPlan === plan
        ? `${plan} remains your active plan.`
        : `Plan change scheduled. ${pendingPlan} begins on September 28, 2026.`,
    );
  }

  function downloadInvoice(invoice: (typeof invoices)[number]) {
    const content = [
      "Ruhana invoice",
      `Invoice: ${invoice.id}`,
      `Date: ${invoice.date}`,
      `Description: ${invoice.description}`,
      `Amount: ${invoice.amount}`,
      `Status: ${invoice.status}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${invoice.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`${invoice.id} downloaded.`);
  }

  return (
    <div className="ruh-page-stack ruh-billing-page">
      <PageHeader
        eyebrow="Workspace"
        title="Billing"
        description="Manage your plan, payment method, allowance, and invoices."
        actions={
          <button className="ruh-primary-button" type="button" onClick={() => { setPendingPlan(plan); setDialog("plan"); }}>
            Manage plan
          </button>
        }
      />

      {notice ? (
        <div className="ruh-inline-notice is-success" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>Dismiss</button>
        </div>
      ) : null}

      <div className="ruh-billing-overview">
        <section className="ruh-data-surface ruh-plan-card">
          <div className="ruh-plan-card-head">
            <div>
              <p className="ruh-kicker">Current plan</p>
              <h2>{plan}</h2>
            </div>
            <span className="ruh-connection-status is-connected">Active</span>
          </div>
          <p>{activePlan.description}</p>
          <div className="ruh-plan-price">
            <strong>${activePlan.price}</strong>
            <span>/ month</span>
          </div>
          <dl className="ruh-plan-facts">
            <div><dt>Renews</dt><dd>September 28, 2026</dd></div>
            <div><dt>Included minutes</dt><dd>{activePlan.minutes.toLocaleString()}</dd></div>
            <div><dt>Active agents</dt><dd>3 of {activePlan.agents}</dd></div>
          </dl>
        </section>

        <section className="ruh-data-surface ruh-allowance-card">
          <div className="ruh-surface-heading">
            <div>
              <p className="ruh-kicker">This billing cycle</p>
              <h2>Usage allowance</h2>
            </div>
            <span>{usagePercent}% used</span>
          </div>
          <div className="ruh-usage-progress" role="progressbar" aria-label="Billing-cycle minute allowance" aria-valuemin={0} aria-valuemax={activePlan.minutes} aria-valuenow={Math.min(4820, activePlan.minutes)} aria-valuetext={`4,820 of ${activePlan.minutes.toLocaleString()} minutes used`}>
            <span style={{ width: `${usagePercent}%` }} />
          </div>
          <div className="ruh-allowance-numbers">
            <strong>4,820 minutes</strong>
            <span>of {activePlan.minutes.toLocaleString()}</span>
          </div>
          <div className="ruh-forecast-card">
            <span aria-hidden="true">↗</span>
            <div>
              <strong>No overage expected</strong>
              <p>Projected usage is 7,340 minutes by September 28.</p>
            </div>
          </div>
          <label className="ruh-toggle-row">
            <span>
              <strong>Usage alerts</strong>
              <small>Email owners when usage reaches 80% and 100%.</small>
            </span>
            <input type="checkbox" checked={usageAlert} onChange={(event) => setUsageAlert(event.target.checked)} />
          </label>
        </section>
      </div>

      <section className="ruh-data-surface ruh-payment-card">
        <div className="ruh-surface-heading">
          <div>
            <p className="ruh-kicker">Payment method</p>
            <h2>Visa ending in 4242</h2>
            <p>Expires 04/29 · Used for plan and overage charges</p>
          </div>
          <button className="ruh-secondary-button" type="button" onClick={() => setDialog("payment")}>
            Update payment method
          </button>
        </div>
      </section>

      <section className="ruh-data-surface ruh-invoice-section">
        <div className="ruh-surface-heading">
          <div>
            <p className="ruh-kicker">Billing history</p>
            <h2>Invoices</h2>
          </div>
          <span>Amounts shown in USD</span>
        </div>
        <div className="ruh-table-scroll">
          <table className="ruh-data-table">
            <thead><tr><th>Date</th><th>Invoice</th><th>Description</th><th>Amount</th><th>Status</th><th><span className="ruh-sr-only">Actions</span></th></tr></thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.date}</td>
                  <td>{invoice.id}</td>
                  <td>{invoice.description}</td>
                  <td>{invoice.amount}</td>
                  <td><span className="ruh-connection-status is-connected">{invoice.status}</span></td>
                  <td><button className="ruh-table-action" type="button" onClick={() => downloadInvoice(invoice)}>Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {dialog === "plan" ? (
        <div className="ruh-modal-backdrop" role="presentation" onMouseDown={closeDialog}>
          <section ref={dialogRef} className="ruh-modal-card ruh-plan-modal" role="dialog" aria-modal="true" aria-labelledby="plan-dialog-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
            <div className="ruh-modal-header">
              <div><p className="ruh-kicker">Subscription</p><h2 id="plan-dialog-title">Choose your plan</h2></div>
              <button type="button" onClick={closeDialog} aria-label="Close dialog">×</button>
            </div>
            <div className="ruh-plan-options">
              {(Object.keys(plans) as PlanName[]).map((option) => (
                <label key={option} className={pendingPlan === option ? "is-selected" : ""}>
                  <input type="radio" name="plan" value={option} checked={pendingPlan === option} onChange={() => setPendingPlan(option)} />
                  <span>
                    <strong>{option}</strong>
                    <small>{plans[option].minutes.toLocaleString()} minutes · {plans[option].agents} agents</small>
                  </span>
                  <b>${plans[option].price}/mo</b>
                </label>
              ))}
            </div>
            <p className="ruh-modal-note">Changes take effect at your next renewal. Billing will show the exact proration before backend confirmation.</p>
            <div className="ruh-modal-actions">
              <button className="ruh-secondary-button" type="button" onClick={closeDialog}>Keep current plan</button>
              <button className="ruh-primary-button" type="button" onClick={applyPlan}>Confirm {pendingPlan}</button>
            </div>
          </section>
        </div>
      ) : null}

      {dialog === "payment" ? (
        <div className="ruh-modal-backdrop" role="presentation" onMouseDown={closeDialog}>
          <section ref={dialogRef} className="ruh-modal-card" role="dialog" aria-modal="true" aria-labelledby="payment-dialog-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
            <div className="ruh-modal-header">
              <div><p className="ruh-kicker">Secure billing</p><h2 id="payment-dialog-title">Update payment method</h2></div>
              <button type="button" onClick={closeDialog} aria-label="Close dialog">×</button>
            </div>
            <div className="ruh-secure-payment-placeholder">
              <span aria-hidden="true">••••</span>
              <div>
                <strong>Payment details stay with the billing provider</strong>
                <p>Ruhana never stores full card numbers or security codes.</p>
              </div>
            </div>
            <div className="ruh-modal-actions">
              <button className="ruh-secondary-button" type="button" onClick={closeDialog}>Cancel</button>
              <button className="ruh-primary-button" type="button" onClick={() => { closeDialog(); setNotice("Secure payment form is ready for backend connection."); }}>
                Open secure form
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
