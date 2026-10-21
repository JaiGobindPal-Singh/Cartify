import { useEffect, useMemo, useState } from "react";
import {
    ArrowDownRight,
    ArrowRight,
    Boxes,
    CircleAlert,
    ClipboardList,
    FolderKanban,
    Package,
    Plus,
    RefreshCw,
    ShoppingBag,
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { fetchCategories } from "../services/category.service";
import { getOrders } from "../services/order.service";
import { fetchProducts } from "../services/product.service";

const PAGE_SIZE = 10;

const cardClass =
    "rounded-2xl border border-border bg-card shadow-sm shadow-black/10";
const linkClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function formatCount(value) {
    return new Intl.NumberFormat("en").format(value);
}

function formatDate(value) {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatStatus(status) {
    if (typeof status !== "string" || !status) return "Unknown";
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
                maximumFractionDigits: 2,
            }).format(value);
        } catch (error) {
            if (!(error instanceof RangeError)) throw error;
        }
    }
    return new Intl.NumberFormat("en", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function getPageItems(result, key) {
    if (Array.isArray(result?.[key])) return result[key];
    if (Array.isArray(result?.items)) return result.items;
    return [];
}

async function fetchAllPages(fetchPage, key) {
    const firstPage = await fetchPage(1);
    const firstItems = getPageItems(firstPage, key);
    const items = [...firstItems];
    let page = 1;
    let hasNextPage = Boolean(firstPage?.hasNextPage);

    while (hasNextPage) {
        page += 1;
        const result = await fetchPage(page);
        items.push(...getPageItems(result, key));
        hasNextPage = Boolean(result?.hasNextPage);
    }

    return { items, firstItems };
}

function StatCard({ label, value, detail, icon: Icon, to, loading, error }) {
    const content = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        {loading ? (
                            <span className="inline-block h-8 w-20 animate-pulse rounded-lg bg-accent align-middle" />
                        ) : error ? (
                            <span className="text-base font-medium text-muted-foreground">Unavailable</span>
                        ) : (
                            value
                        )}
                    </p>
                </div>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
                {error ? "Could not load this information" : detail}
            </p>
        </>
    );

    return to ? (
        <Link
            to={to}
            className={`${cardClass} block p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
        >
            {content}
        </Link>
    ) : (
        <div className={`${cardClass} p-5`}>{content}</div>
    );
}

function Homepage() {
    const user = useOutletContext();
    const [refreshKey, setRefreshKey] = useState(0);
    const [products, setProducts] = useState([]);
    const [productCount, setProductCount] = useState(null);
    const [productLoading, setProductLoading] = useState(true);
    const [productError, setProductError] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoryCount, setCategoryCount] = useState(null);
    const [categoryLoading, setCategoryLoading] = useState(true);
    const [categoryError, setCategoryError] = useState(false);
    const [orders, setOrders] = useState([]);
    const [totalOrders, setTotalOrders] = useState(null);
    const [orderLoading, setOrderLoading] = useState(true);
    const [orderError, setOrderError] = useState(false);

    useEffect(() => {
        let isActive = true;
        fetchAllPages((page) => fetchProducts(page), "products")
            .then(({ items, firstItems }) => {
                if (!isActive) return;
                setProducts(firstItems);
                setProductCount(items.length);
            })
            .catch(() => {
                if (!isActive) return;
                setProducts([]);
                setProductCount(null);
                setProductError(true);
            })
            .finally(() => {
                if (isActive) setProductLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [refreshKey]);

    useEffect(() => {
        let isActive = true;
        fetchAllPages((page) => fetchCategories(page, PAGE_SIZE), "categories")
            .then(({ items, firstItems }) => {
                if (!isActive) return;
                setCategories(firstItems);
                setCategoryCount(items.length);
            })
            .catch(() => {
                if (!isActive) return;
                setCategories([]);
                setCategoryCount(null);
                setCategoryError(true);
            })
            .finally(() => {
                if (isActive) setCategoryLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [refreshKey]);

    useEffect(() => {
        let isActive = true;
        getOrders(1, PAGE_SIZE, "ORDER_PLACED")
            .then((result) => {
                if (!isActive) return;
                setOrders(Array.isArray(result?.orders) ? result.orders : []);
                setTotalOrders(result?.pagination?.totalOrders ?? null);
            })
            .catch(() => {
                if (!isActive) return;
                setOrders([]);
                setTotalOrders(null);
                setOrderError(true);
            })
            .finally(() => {
                if (isActive) setOrderLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [refreshKey]);

    const recentSales = useMemo(() => {
        const totals = new Map();
        orders.forEach((order) => {
            const amount = Number(order?.billing?.totalBill);
            if (order?.billing?.totalBill == null || !Number.isFinite(amount)) return;
            const currency =
                typeof order?.billing?.currency === "string" && order.billing.currency.trim()
                    ? order.billing.currency.trim().toUpperCase()
                    : "—";
            totals.set(currency, (totals.get(currency) ?? 0) + amount);
        });
        return [...totals.entries()];
    }, [orders]);

    const greetingName =
        typeof user?.name === "string" && user.name.trim()
            ? user.name.trim().split(/\s+/)[0]
            : "there";

    const refreshDashboard = () => {
        setProductLoading(true);
        setCategoryLoading(true);
        setOrderLoading(true);
        setProductError(false);
        setCategoryError(false);
        setOrderError(false);
        setRefreshKey((key) => key + 1);
    };

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-7 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-primary">Store overview</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                        Welcome back, {greetingName}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        A clear view of your catalog and the latest activity in your store.
                    </p>
                </div>
                <div className=" flex flex-wrap gap-2 ">
                    <button
                        type="button"
                        onClick={refreshDashboard}
                        className="flex items-center bg-primary rounded-xl px-4 cursor-pointer hover:opacity-90 "
                    >
                        <RefreshCw aria-hidden="true" className="h-4" />
                        Refresh
                    </button>
                    <Link
                        to="/products/create"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        <Plus aria-hidden="true" className="h-4 w-4" />
                        Add product
                    </Link>
                </div>
            </header>

            {(productError || categoryError || orderError) && (
                <div
                    role="alert"
                    className={`${cardClass} mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
                >
                    <div className="flex items-start gap-3">
                        <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                        <div>
                            <p className="text-sm font-semibold">Some dashboard data could not be loaded.</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Other sections remain available. Refresh to try the unavailable data again.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={refreshDashboard}
                        className={`${linkClass} self-start sm:self-auto`}
                    >
                        Try again
                    </button>
                </div>
            )}

            <section aria-label="Store statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Total products"
                    value={productCount == null ? "—" : formatCount(productCount)}
                    detail="Products across your catalog"
                    icon={Package}
                    to="/products"
                    loading={productLoading}
                    error={productError}
                />
                <StatCard
                    label="Total categories"
                    value={categoryCount == null ? "—" : formatCount(categoryCount)}
                    detail="Categories across your catalog"
                    icon={FolderKanban}
                    to="/categories"
                    loading={categoryLoading}
                    error={categoryError}
                />
                <StatCard
                    label="New orders"
                    value={totalOrders == null ? "—" : formatCount(totalOrders)}
                    detail="New orders received"
                    icon={ClipboardList}
                    to="/orders"
                    loading={orderLoading}
                    error={orderError}
                />
                
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
                <div className={`${cardClass} min-w-0 overflow-hidden`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-6 sm:px-6 ">
                        <div>
                            <h2 className="text-base font-semibold">New orders</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Your latest customer activity
                            </p>
                        </div>
                        <Link to="/orders" className={`${linkClass} min-h-9 px-3 py-1.5`}>
                            View all <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                    </div>
                    {orderLoading ? (
                        <ul className="divide-y divide-border" aria-label="Loading recent orders">
                            {[0, 1, 2].map((item) => (
                                <li key={item} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                                    <span className="h-10 w-10 animate-pulse rounded-xl bg-accent" />
                                    <span className="min-w-0 flex-1 space-y-2">
                                        <span className="block h-4 w-32 animate-pulse rounded bg-accent" />
                                        <span className="block h-3 w-44 max-w-full animate-pulse rounded bg-accent" />
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : orderError ? (
                        <div className="px-5 py-10 text-center sm:px-6">
                            <p className="text-sm font-medium">Orders are temporarily unavailable.</p>
                            <p className="mt-1 text-sm text-muted-foreground">Try refreshing the dashboard.</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="px-5 py-10 text-center sm:px-6">
                            <ShoppingBag aria-hidden="true" className="mx-auto h-8 w-8 text-muted-foreground" />
                            <p className="mt-3 text-sm font-medium">No orders yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                New customer orders will appear here.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {orders.slice(0, PAGE_SIZE).map((order, index) => {
                                const id = order?._id ?? order?.id;
                                const name = order?.user?.name || order?.user?.email || "Customer";
                                const status = order?.status;
                                const statusClass =
                                    status === "DELIVERED"
                                        ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
                                        : status === "CANCELLED"
                                            ? "border-red-300/20 bg-red-400/10 text-red-300"
                                            : "border-primary/20 bg-primary/10 text-primary";
                                const row = (
                                    <>
                                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                                            <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-center gap-2">
                                                <span className="truncate text-sm font-semibold text-foreground">
                                                    {name}
                                                </span>
                                                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                                                    {formatStatus(status)}
                                                </span>
                                            </span>
                                            <span className="mt-1 block text-xs text-muted-foreground">
                                                {id ? `Order #${id}` : "Order"} · {formatDate(order?.createdAt)}
                                            </span>
                                        </span>
                                        <span className="shrink-0 text-right text-sm font-semibold text-foreground">
                                            {formatAmount(order?.billing?.totalBill, order?.billing?.currency)}
                                        </span>
                                        {id && <ArrowRight aria-hidden="true" className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />}
                                    </>
                                );

                                return (
                                    <li key={id ?? `${order?.createdAt ?? "order"}-${index}`}>
                                        {id ? (
                                            <Link
                                                to={`/orders/${id}`}
                                                className="flex min-h-20 items-center gap-3 px-5 py-4 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:gap-4 sm:px-6"
                                            >
                                                {row}
                                            </Link>
                                        ) : (
                                            <div className="flex min-h-20 items-center gap-3 px-5 py-4 sm:gap-4 sm:px-6">
                                                {row}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="space-y-6">
                    <div className={`${cardClass} p-5 sm:p-6`}>
                        <h2 className="text-base font-semibold">Quick actions</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Jump straight into common store tasks.
                        </p>
                        <div className="mt-5 grid gap-3">
                            <Link
                                to="/products/create"
                                className="group flex min-h-14 items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                                    <Plus aria-hidden="true" className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold">Add a product</span>
                                    <span className="mt-0.5 block text-xs text-muted-foreground">Grow your catalog</span>
                                </span>
                                <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </Link>
                            <Link
                                to="/categories/create"
                                className="group flex min-h-14 items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                                    <Boxes aria-hidden="true" className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold">Create a category</span>
                                    <span className="mt-0.5 block text-xs text-muted-foreground">Organize your products</span>
                                </span>
                                <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </Link>
                            <Link
                                to="/orders"
                                className="group flex min-h-14 items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                                    <ClipboardList aria-hidden="true" className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold">Manage orders</span>
                                    <span className="mt-0.5 block text-xs text-muted-foreground">Review fulfillment activity</span>
                                </span>
                                <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </div>

                    <div className={`${cardClass} overflow-hidden`}>
                        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                            <div>
                                <h2 className="text-base font-semibold">Catalog snapshot</h2>
                                <p className="mt-1 text-sm text-muted-foreground">Products on the latest page</p>
                            </div>
                            <Link
                                to="/products"
                                aria-label="View all products"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <ArrowRight aria-hidden="true" className="h-4 w-4" />
                            </Link>
                        </div>
                        {productLoading ? (
                            <ul className="divide-y divide-border" aria-label="Loading products">
                                {[0, 1, 2].map((item) => (
                                    <li key={item} className="flex items-center gap-3 px-5 py-4">
                                        <span className="h-10 w-10 animate-pulse rounded-lg bg-accent" />
                                        <span className="min-w-0 flex-1 space-y-2">
                                            <span className="block h-4 w-32 animate-pulse rounded bg-accent" />
                                            <span className="block h-3 w-20 animate-pulse rounded bg-accent" />
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : productError ? (
                            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                                Products are temporarily unavailable.
                            </p>
                        ) : products.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                                <Package aria-hidden="true" className="mx-auto h-7 w-7 text-muted-foreground" />
                                <p className="mt-2 text-sm font-medium">Your catalog is empty</p>
                                <Link to="/products/create" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                                    Add your first product <ArrowRight aria-hidden="true" className="h-4 w-4" />
                                </Link>
                            </div>
                        ) : (
                            <ul className="divide-y divide-border">
                                {products.slice(0, 4).map((product, index) => {
                                    const id = product?.id ?? product?._id;
                                    const item = (
                                        <>
                                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                                                <Package aria-hidden="true" className="h-4 w-4" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium text-foreground">
                                                    {product?.name || "Unnamed product"}
                                                </span>
                                                <span className="mt-1 block text-xs text-muted-foreground">
                                                    {product?.availableStock == null
                                                        ? "Stock unavailable"
                                                        : `${formatCount(Number(product.availableStock) || 0)} in stock`}
                                                </span>
                                            </span>
                                            {id && <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                        </>
                                    );
                                    return (
                                        <li key={id ?? `${product?.name ?? "product"}-${index}`}>
                                            {id ? (
                                                <Link
                                                    to={`/products/${id}`}
                                                    className="flex min-h-16 items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                                                >
                                                    {item}
                                                </Link>
                                            ) : (
                                                <div className="flex min-h-16 items-center gap-3 px-5 py-3">{item}</div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        {!productLoading && !productError && products.length > 0 && (
                            <div className="border-t border-border px-5 py-3">
                                <Link
                                    to="/products"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                                >
                                    Browse all products <ArrowRight aria-hidden="true" className="h-4 w-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {!categoryLoading && !categoryError && categories.length === 0 && categoryCount === 0 && (
                <div className={`${cardClass} mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between`}>
                    <div>
                        <h2 className="text-sm font-semibold">Set up your first category</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Categories help customers browse your products.
                        </p>
                    </div>
                    <Link to="/categories/create" className={linkClass}>
                        <Plus aria-hidden="true" className="h-4 w-4" />
                        Create category
                    </Link>
                </div>
            )}
        </main>
    );
}

export default Homepage;
