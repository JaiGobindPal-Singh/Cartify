import { useEffect, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getOrders } from "../../services/order.service";

const PAGE_SIZE = 10;

const ORDER_FILTERS = [
    { label: "All", status: "" },
    { label: "New Orders", status: "ORDER_PLACED" },
    { label: "Processing", status: "PROCESSING" },
    { label: "Hold", status: "HOLD" },
    { label: "Shipped", status: "SHIPPED" },
    { label: "Delivered", status: "DELIVERED" },
];

const STATUS_STYLES = {
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

function formatAmount(billing) {
    const amount = Number(billing?.totalBill);
    if (billing?.totalBill == null || !Number.isFinite(amount)) return "—";

    const currency =
        typeof billing.currency === "string" ? billing.currency.trim().toUpperCase() : "";
    const formattedAmount = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    return `${currency ? `${currency} ` : ""}${formattedAmount}`;
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

function Orders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("ORDER_PLACED");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPrevPage, setHasPrevPage] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let isActive = true;
        setIsLoading(true);
        setError("");

        getOrders(currentPage, PAGE_SIZE, selectedStatus || undefined)
            .then((result) => {
                if (!isActive) return;
                setOrders(result?.orders ?? []);
                setCurrentPage(result?.pagination?.currentPage ?? currentPage);
                setTotalPages(result?.pagination?.totalPages ?? 0);
                setTotalOrders(result?.pagination?.totalOrders ?? 0);
                setHasNextPage(Boolean(result?.pagination?.hasNextPage));
                setHasPrevPage(Boolean(result?.pagination?.hasPrevPage));
            })
            .catch(() => {
                if (!isActive) return;
                setOrders([]);
                setTotalPages(0);
                setTotalOrders(0);
                setHasNextPage(false);
                setHasPrevPage(false);
                setError("Orders could not be loaded. Please try again.");
            })
            .finally(() => {
                if (isActive) setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [currentPage, refreshKey, selectedStatus]);

    const handleFilterChange = (status) => {
        setSelectedStatus(status);
        setCurrentPage(1);
    };

    const handleOrderClick = (order) => {
        const orderId = order?._id ?? order?.id;
        if (orderId) navigate(`/orders/${orderId}`);
    };

    const handleOrderAction = (_order) => {
        // TODO: Implement order actions.
    };

    const handleOrderKeyDown = (event, order) => {
        if (
            event.target === event.currentTarget &&
            (event.key === "Enter" || event.key === " ")
        ) {
            event.preventDefault();
            handleOrderClick(order);
        }
    };

    const firstOrderNumber = totalOrders === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const lastOrderNumber = Math.min(currentPage * PAGE_SIZE, totalOrders);

    return (
        <main className="mx-auto w-full max-w-375 px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-6 border-b border-border pb-5">
                <p className="text-sm font-medium text-primary">Store management</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Orders
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Review customer orders and track their fulfillment status.
                </p>
            </header>

            <nav
                aria-label="Filter orders by status"
                className="mb-5 flex gap-2 overflow-x-auto pb-2"
            >
                {ORDER_FILTERS.map(({ label, status }) => {
                    const isSelected = selectedStatus === status;
                    return (
                        <button
                            key={label}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => handleFilterChange(status)}
                            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </nav>

            <section aria-label="Order list">
                {error ? (
                    <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center">
                        <p role="alert" className="text-sm text-red-300">
                            {error}
                        </p>
                        <button
                            type="button"
                            onClick={() => setRefreshKey((key) => key + 1)}
                            className="mt-4 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            Try again
                        </button>
                    </div>
                ) : isLoading ? (
                    <div
                        role="status"
                        className="rounded-2xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground"
                    >
                        Loading orders…
                    </div>
                ) : orders.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card px-5 py-14 text-center">
                        <Package
                            aria-hidden="true"
                            className="mx-auto h-9 w-9 text-muted-foreground"
                        />
                        <h2 className="mt-3 font-semibold text-foreground">No orders found</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            There are no orders in this status right now.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:gap-4">
                        {orders.map((order, index) => {
                            const status =
                                typeof order?.status === "string" ? order.status : "";
                            const orderId = order?._id ?? order?.id ?? "Unavailable";
                            const orderKey =
                                order?._id ?? order?.id ?? `${order?.createdAt ?? "order"}-${index}`;

                            return (
                                <article
                                    key={orderKey}
                                    tabIndex={0}
                                    aria-label={`Order ${orderId}, ${formatStatus(status)}`}
                                    onClick={() => handleOrderClick(order)}
                                    onKeyDown={(event) => handleOrderKeyDown(event, order)}
                                    className="cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/50 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
                                >
                                    <div className=" flex justify-between flex-wrap gap-4">
                                        <div className="col-span-2 min-w-0 lg:col-span-1">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Order ID
                                            </p>
                                            <p className="mt-1 break-all font-medium text-foreground">
                                                #ORD-{orderId}
                                            </p>
                                        </div>
                                        <div >
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Status
                                            </p>
                                            <span
                                                className={`mt-1 inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status] ??
                                                    "border-border bg-accent text-muted-foreground"
                                                    }`}
                                            >
                                                {formatStatus(status)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Total
                                            </p>
                                            <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                                                {formatAmount(order?.billing)}
                                            </p>
                                        </div>
                                        <div className="col-span-2 flex items-center justify-between gap-3 lg:col-span-1">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Date
                                                </p>
                                                <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
                                                    <CalendarDays
                                                        aria-hidden="true"
                                                        className="h-4 w-4 shrink-0"
                                                    />
                                                    <span>{formatDate(order?.createdAt)}</span>
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                aria-label={`Order actions for ${orderId}`}
                                                title="Order actions"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleOrderAction(order);
                                                }}
                                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:justify-self-end"
                                            >
                                                <MoreHorizontal
                                                    aria-hidden="true"
                                                    className="h-5 w-5"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <nav
                aria-label="Order pagination"
                className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
                <p className="text-sm text-muted-foreground">
                    {totalOrders > 0 ? (
                        <>
                            Showing{" "}
                            <span className="font-medium text-foreground">{firstOrderNumber}</span>
                            {"–"}
                            <span className="font-medium text-foreground">{lastOrderNumber}</span>
                            {" of "}
                            <span className="font-medium text-foreground">{totalOrders}</span>
                            {" orders"}
                        </>
                    ) : (
                        <>
                            Page <span className="font-medium text-foreground">{currentPage}</span>
                            {totalPages > 0 && ` of ${totalPages}`}
                        </>
                    )}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={!hasPrevPage || isLoading}
                        onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                        Previous
                    </button>
                    <span className="px-2 text-sm tabular-nums text-muted-foreground">
                        {currentPage} / {totalPages || 1}
                    </span>
                    <button
                        type="button"
                        disabled={!hasNextPage || isLoading}
                        onClick={() => setCurrentPage((page) => page + 1)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                        <ChevronRight aria-hidden="true" className="h-4 w-4" />
                    </button>
                </div>
            </nav>
        </main>
    );
}

export default Orders;
