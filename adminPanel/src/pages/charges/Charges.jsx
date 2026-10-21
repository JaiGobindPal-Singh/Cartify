import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, ReceiptText, RefreshCw } from "lucide-react";
import { getAllCharges } from "../../services/charges.service";

function formatAmount(charge) {
  const amount = Number(charge?.chargeAmount);
  if (charge?.chargeAmount == null || !Number.isFinite(amount)) return "—";

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(amount);

  return charge.chargeType === "PERCENT" ? `${formattedAmount}%` : `${formattedAmount}`;
}

function Charges() {
  const navigate = useNavigate();
  const [charges, setCharges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    getAllCharges()
      .then((result) => {
        if (!isActive) return;
        setCharges(Array.isArray(result) ? result : []);
        setError("");
      })
      .catch(() => {
        if (!isActive) return;
        setCharges([]);
        setError("Charges could not be loaded. Please try again.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setError("");
    setRefreshKey((key) => key + 1);
  }, []);

  const handleRowKeyDown = (event, chargeId) => {
    if (chargeId && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      navigate(`/charges/${chargeId}`);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Charges</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your configured charges
          </p>
        </div>
        <Link
          to="/charges/create"
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:self-auto"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add New Charge
        </Link>
      </header>

      {error ? (
        <section className="rounded-2xl border border-border bg-card px-5 py-12 text-center shadow-sm shadow-black/10">
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Try again
          </button>
        </section>
      ) : isLoading ? (
        <div
          role="status"
          className="rounded-2xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground shadow-sm shadow-black/10"
        >
          Loading charges…
        </div>
      ) : charges.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card px-5 py-14 text-center shadow-sm shadow-black/10">
          <ReceiptText
            aria-hidden="true"
            className="mx-auto h-9 w-9 text-muted-foreground"
          />
          <h2 className="mt-3 font-semibold text-foreground">No charges found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first charge to get started.
          </p>
          <Link
            to="/charges/create"
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add New Charge
          </Link>
        </section>
      ) : (
        <section
          aria-label="Charges list"
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/10"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-xl border-collapse text-left">
              <thead className="border-b border-border bg-accent/40">
                <tr>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6"
                  >
                    Charge Name
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Charge Type
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6"
                  >
                    Charge Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {charges.map((charge, index) => {
                  const chargeId = charge?._id ?? charge?.id;
                  const rowKey =
                    chargeId ?? `${charge?.chargeName ?? "charge"}-${index}`;
                  const statusClass = charge?.isActive
                    ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
                    : "border-border bg-accent text-muted-foreground";

                  return (
                    <tr
                      key={rowKey}
                      tabIndex={chargeId ? 0 : undefined}
                      onClick={
                        chargeId ? () => navigate(`/charges/${chargeId}`) : undefined
                      }
                      onKeyDown={
                        chargeId
                          ? (event) => handleRowKeyDown(event, chargeId)
                          : undefined
                      }
                      className={`transition-colors ${
                        chargeId
                          ? "cursor-pointer hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-4 text-sm font-medium text-foreground sm:px-6">
                        {charge?.chargeName || "Unnamed charge"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                        >
                          <span aria-hidden="true" className="text-[10px]">
                            ●
                          </span>
                          {charge?.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {charge?.chargeType || "—"}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums text-foreground sm:px-6">
                        {formatAmount(charge)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground sm:px-6">
            {charges.length} {charges.length === 1 ? "charge" : "charges"}
          </p>
        </section>
      )}
    </main>
  );
}

export default Charges;
