import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ImageOff,
  LoaderCircle,
  MapPin,
  Save,
} from "lucide-react";
import api from "../../configs/axios.config";
import {
  getSpecificOrder,
  updateDeliveryPartner,
  updateOrderStatus,
} from "../../services/order.service";
import { generateNotification } from "../../utils/notification.utils";
import { statusEnum } from "../../../../src/constants/orderStatuses.js";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";
const sectionClass = "rounded-2xl border border-border bg-card p-4 sm:p-6";

const STATUS_STYLES = {
  PAYMENT_FAILED: "border-red-300/20 bg-red-400/10 text-red-300",
  PAYMENT_PENDING: "border-amber-300/20 bg-amber-400/10 text-amber-300",
  ABANDONED: "border-slate-300/20 bg-slate-400/10 text-slate-300",
  ORDER_PLACED: "border-sky-300/20 bg-sky-400/10 text-sky-300",
  PROCESSING: "border-amber-300/20 bg-amber-400/10 text-amber-300",
  HOLD: "border-orange-300/20 bg-orange-400/10 text-orange-300",
  SHIPPED: "border-violet-300/20 bg-violet-400/10 text-violet-300",
  DELIVERED: "border-emerald-300/20 bg-emerald-400/10 text-emerald-300",
  CANCELLED: "border-red-300/20 bg-red-400/10 text-red-300",
  
};

function formatStatus(status) {
  if (!status) return "Unknown";
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatAmount(amount, currency) {
  const value = Number(amount);
  if (amount == null || !Number.isFinite(value)) return "—";

  const normalizedCurrency =
    typeof currency === "string" ? currency.trim().toUpperCase() : "";
  if (normalizedCurrency) {
    try {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency: normalizedCurrency,
        currencyDisplay: "code",
      }).format(value);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }

  return `${normalizedCurrency ? `${normalizedCurrency} ` : ""}${new Intl.NumberFormat(
    "en",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  ).format(value)}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.error || error?.message || fallback;
}

function getImageUrl(imageUrl) {
  if (typeof imageUrl !== "string" || !imageUrl.trim()) return "";
  try {
    return new URL(imageUrl, api.defaults.baseURL).toString();
  } catch {
    return "";
  }
}

function getAddressLines(address) {
  return [
    ["Full name", address?.fullName],
    ["Phone", address?.phone],
    ["Street address", address?.streetAddress],
    ["City", address?.city],
    ["State", address?.state],
    ["Postal code", address?.postalCode],
    ["Country", address?.country],
  ];
}

function DetailSection({ title, description, children, className = "" }) {
  return (
    <section className={`${sectionClass} ${className}`}>
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function AddressCard({ title, address }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <MapPin aria-hidden="true" className="h-4 w-4 text-primary" />
        {title}
      </h3>
      {address ? (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {getAddressLines(address).map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 wrap-break-words text-foreground">
                {value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Address unavailable.</p>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] ??
        "border-border bg-accent text-muted-foreground"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function OrderDetails() {
  const { id } = useParams();
  const isValidOrderId = /^[a-f\d]{24}$/i.test(id ?? "");
  const [order, setOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [deliveryPartner, setDeliveryPartner] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [loadedOrderId, setLoadedOrderId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);
  const requestSequence = useRef(0);
  const isLoading = loadedOrderId !== id;
  const isOrderLoadedForRoute =
    order && String(order._id ?? order.id ?? "") === id;

  const loadOrder = useCallback(
    async (showLoading = true) => {
      const requestId = ++requestSequence.current;
      if (showLoading) {
        setLoadedOrderId("");
        setError("");
      }

      try {
        const result = await getSpecificOrder(id);
        if (requestId !== requestSequence.current) return false;
        setError("");
        setIsNotFound(false);
        if (!result) {
          setOrder(null);
          setIsNotFound(true);
          setError("Order could not be found.");
          return false;
        }

        setOrder(result);
        setSelectedStatus(result.status ?? "");
        setDeliveryPartner(result.deliveryDetails?.deliveryPartner ?? "");
        setTrackingId(result.deliveryDetails?.trackingId ?? "");
        return true;
      } catch (loadError) {
        if (requestId !== requestSequence.current) return false;
        const notFound = loadError?.response?.status === 404;
        const message = notFound
          ? "Order could not be found."
          : getErrorMessage(loadError, "Order details could not be loaded.");
        setIsNotFound(notFound);
        setError(message);
        generateNotification(message)();
        return false;
      } finally {
        if (requestId === requestSequence.current) setLoadedOrderId(id);
      }
    },
    [id],
  );

  useEffect(() => {
    if (isValidOrderId) loadOrder(false);
    return () => {
      requestSequence.current += 1;
    };
  }, [id, isValidOrderId, loadOrder]);

  const handleSave = async (event) => {
    event.preventDefault();

    if (isSaving) return;
    if (!isValidOrderId) {
      generateNotification("A valid order ID is required.")();
      return;
    }
    if (!statusEnum.includes(selectedStatus)) {
      generateNotification("Select a valid order status.")();
      return;
    }

    const nextDeliveryPartner = deliveryPartner.trim();
    const nextTrackingId = trackingId.trim();
    const currentDeliveryPartner = order?.deliveryDetails?.deliveryPartner ?? "";
    const currentTrackingId = order?.deliveryDetails?.trackingId ?? "";
    const statusChanged = selectedStatus !== order?.status;
    const deliveryChanged =
      nextDeliveryPartner !== currentDeliveryPartner ||
      nextTrackingId !== currentTrackingId;

    if (!statusChanged && !deliveryChanged) {
      generateNotification("There are no changes to save.")();
      return;
    }
    if (deliveryChanged && (!nextDeliveryPartner || !nextTrackingId)) {
      generateNotification(
        "Delivery partner and tracking ID are both required.",
      )();
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      if (statusChanged) {
        await updateOrderStatus(id, selectedStatus);
      }
      if (deliveryChanged) {
        await updateDeliveryPartner(
          id,
          nextDeliveryPartner,
          nextTrackingId,
        );
      }

      generateNotification("Order updated successfully.")();
      await loadOrder(false);
    } catch (saveError) {
      const message = getErrorMessage(
        saveError,
        "Order could not be updated.",
      );
      setError(message);
      generateNotification(message)();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !isOrderLoadedForRoute && isValidOrderId) {
    return (
      <main className="mx-auto flex min-h-96 max-w-375 items-center justify-center px-4 text-muted-foreground">
        <LoaderCircle
          aria-hidden="true"
          className="mr-2 h-5 w-5 animate-spin"
        />
        Loading order details…
      </main>
    );
  }

  if (!order || !isOrderLoadedForRoute || !isValidOrderId) {
    return (
      <main className="mx-auto w-full max-w-375 px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
        <Link
          to="/orders"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to Orders
        </Link>
        <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-5">
          <h1 className="text-lg font-semibold text-foreground">
            {isNotFound || !isValidOrderId
              ? "Order not found"
              : "Unable to load order"}
          </h1>
          <p role="alert" className="mt-2 text-sm text-red-200">
            {!isValidOrderId
              ? "A valid order ID is required."
              : error || "Order details could not be loaded."}
          </p>
          {isValidOrderId && (
            <button
              type="button"
              onClick={() => loadOrder()}
              className="mt-4 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Try again
            </button>
          )}
        </div>
      </main>
    );
  }

  const orderId = order._id ?? order.id ?? id;
  const user =
    order.user ;
  const customerName = user?.name?.trim();
  const customerEmail = user?.email?.trim();
  const hasCustomerDetails = Boolean(customerName || customerEmail);
  const billing = order.billing ?? {};
  const transaction =
    order.transaction && typeof order.transaction === "object"
      ? order.transaction
      : null;
  const items = Array.isArray(order.items) ? order.items : [];
  const charges = Array.isArray(billing.charges) ? billing.charges : [];
  const statusHistory = Array.isArray(order.statusHistory)
    ? [...order.statusHistory].sort((left, right) => {
        const leftDate = new Date(left?.updatedAt ?? 0).getTime();
        const rightDate = new Date(right?.updatedAt ?? 0).getTime();
        return (
          (Number.isNaN(leftDate) ? 0 : leftDate) -
          (Number.isNaN(rightDate) ? 0 : rightDate)
        );
      })
    : [];
  const deliveryType =
    typeof order.deliveryDetails?.deliveryType?.optionName === "string"
      ? order.deliveryDetails.deliveryType.optionName
      : "Delivery type unavailable";

  return (
    <main className="mx-auto w-full max-w-375 px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/orders"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to Orders
        </Link>
        {isLoading && (
          <span
            role="status"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground"
          >
            <LoaderCircle
              aria-hidden="true"
              className="h-4 w-4 animate-spin"
            />
            Refreshing order…
          </span>
        )}
      </div>

      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">Order management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Order Details
          </h1>
          <p className="mt-2 break-all text-sm text-muted-foreground">
            Order ID: <span className="font-medium text-foreground">{orderId}</span>
          </p>
          <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            Created {formatDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <div className="space-y-5">
        <form onSubmit={handleSave}>
          <DetailSection
            title="Update order"
            description="Changes are saved only when you submit this form."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm font-medium">
                Order status
                <select
                  className={inputClass}
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  disabled={isSaving}
                  required
                >
                  <option value="" disabled>
                    Select a status
                  </option>
                  {statusEnum.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Delivery partner
                <input
                  className={inputClass}
                  value={deliveryPartner}
                  onChange={(event) => setDeliveryPartner(event.target.value)}
                  disabled={isSaving}
                  autoComplete="organization"
                  maxLength={120}
                />
              </label>
              <label className="block text-sm font-medium sm:col-span-2 lg:col-span-1">
                Tracking ID
                <input
                  className={inputClass}
                  value={trackingId}
                  onChange={(event) => setTrackingId(event.target.value)}
                  disabled={isSaving}
                  autoComplete="off"
                  maxLength={120}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-60 sm:w-auto"
              >
                {isSaving ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <Save aria-hidden="true" className="h-4 w-4" />
                )}
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </DetailSection>
        </form>

        <DetailSection title="Customer information">
          {hasCustomerDetails ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Name
                </dt>
                <dd className="mt-1 wrap-break-words text-sm text-foreground">
                  {customerName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1 break-all text-sm text-foreground">
                  {customerEmail || "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Customer details unavailable.
            </p>
          )}
        </DetailSection>

        <DetailSection title="Order items">
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item, index) => {
                const product =
                  item?.product && typeof item.product === "object"
                    ? item.product
                    : null;
                const imageUrls = Array.isArray(product?.imageUrls)
                  ? product.imageUrls
                  : [];
                const imageUrl = getImageUrl(
                  imageUrls.find(
                    (image) => typeof image === "string" && image.trim(),
                  ),
                );
                const quantity = Number(item?.quantity);
                const safeQuantity = Number.isFinite(quantity) ? quantity : 0;
                const unitPrice = Number(item?.purchasePrice?.amount);
                const lineTotal = Number.isFinite(unitPrice)
                  ? unitPrice * safeQuantity
                  : null;
                const options = Array.isArray(item?.purchaseOptions)
                  ? item.purchaseOptions
                  : [];

                return (
                  <article
                    key={`${product?._id ?? product?.id ?? index}-${index}`}
                    className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-accent sm:h-20 sm:w-20">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product?.name || "Order item"}
                            loading="lazy"
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <ImageOff
                            aria-hidden="true"
                            className="h-7 w-7 text-muted-foreground"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="wrap-break-words font-medium text-foreground">
                          {product?.name || "Product details unavailable"}
                        </h3>
                        {options.length > 0 ? (
                          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {options.map((option, optionIndex) => (
                              <li key={`${option?.optionName ?? "option"}-${optionIndex}`}>
                                {option?.optionName || "Option"}:{" "}
                                {option?.optionValue || "—"}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            No purchase options
                          </p>
                        )}
                      </div>
                    </div>
                    <dl className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-sm sm:min-w-64 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                      <div>
                        <dt className="text-xs text-muted-foreground">Quantity</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {safeQuantity || "—"}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">Unit price</dt>
                        <dd className="mt-1 wrap-break-words font-medium text-foreground">
                          {formatAmount(item?.purchasePrice?.amount, billing.currency)}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">Line total</dt>
                        <dd className="mt-1 wrap-break-words font-semibold text-foreground">
                          {formatAmount(lineTotal, billing.currency)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No item details are available for this order.
            </p>
          )}
        </DetailSection>

        <div className="grid gap-5 lg:grid-cols-2">
          <DetailSection title="Billing summary" className="h-full">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Currency</dt>
                <dd className="font-medium text-foreground">
                  {billing.currency || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Payment mode</dt>
                <dd className="font-medium text-foreground">
                  {billing.paymentMode || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium text-foreground">
                  {formatAmount(billing.subtotal, billing.currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="font-medium text-foreground">
                  {formatAmount(billing.discount ?? 0, billing.currency)}
                </dd>
              </div>
              {charges.length > 0 ? (
                charges.map((charge, index) => (
                  <div
                    key={`${charge?.chargeName ?? "charge"}-${index}`}
                    className="flex justify-between gap-4"
                  >
                    <dt className="text-muted-foreground">
                      {charge?.chargeName || "Additional charge"}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {formatAmount(charge?.chargeAmount, billing.currency)}
                    </dd>
                  </div>
                ))
              ) : (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Additional charges</dt>
                  <dd className="font-medium text-foreground">None</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-border pt-3 text-base">
                <dt className="font-semibold text-foreground">Total bill</dt>
                <dd className="font-semibold text-foreground">
                  {formatAmount(billing.totalBill, billing.currency)}
                </dd>
              </div>
            </dl>
          </DetailSection>

          <DetailSection title="Addresses" className="h-full">
            <div className="grid gap-3">
              <AddressCard
                title="Billing address"
                address={billing.billingAddress}
              />
              <AddressCard
                title="Delivery address"
                address={order.deliveryDetails?.deliveryAddress}
              />
            </div>
          </DetailSection>
        </div>

        <DetailSection title="Delivery details">
          <dl className="mb-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Delivery type
              </dt>
              <dd className="mt-1 text-sm text-foreground">{deliveryType}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Delivery partner
              </dt>
              <dd className="mt-1 wrap-break-words text-sm text-foreground">
                {order.deliveryDetails?.deliveryPartner || "Not assigned"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tracking ID
              </dt>
              <dd className="mt-1 break-all text-sm text-foreground">
                {order.deliveryDetails?.trackingId || "Not available"}
              </dd>
            </div>
          </dl>
        </DetailSection>

        <DetailSection title="Payment and transaction">
          {transaction ? (
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Payment gateway", transaction.paymentGateway],
                ["Payment method", transaction.paymentMethod],
                ["Transaction order ID", transaction.transactionOrderId],
                ["Transaction ID", transaction.transactionId],
                ["Payment status", transaction.status],
                ["Transaction currency", transaction.currency],
                [
                  "Transaction amount",
                  formatAmount(transaction.amount, transaction.currency),
                ],
                ["Transaction created", formatDate(transaction.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-1 wrap-break-words text-sm text-foreground">
                    {value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              No transaction details are available for this order.
            </p>
          )}
        </DetailSection>

        <DetailSection title="Order status history">
          {statusHistory.length > 0 ? (
            <ol className="relative ml-2 space-y-5 border-l border-border pl-5">
              {statusHistory.map((entry, index) => (
                <li
                  key={`${entry?.status ?? "status"}-${entry?.updatedAt ?? index}-${index}`}
                  className="relative"
                >
                  <span className="absolute left-[-1.57rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary ring-2 ring-primary/30" />
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={entry?.status} />
                    <time
                      dateTime={entry?.updatedAt || undefined}
                      className="text-sm text-muted-foreground"
                    >
                      {formatDate(entry?.updatedAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">
              No status history is available for this order.
            </p>
          )}
        </DetailSection>
      </div>
    </main>
  );
}

export default OrderDetails;
