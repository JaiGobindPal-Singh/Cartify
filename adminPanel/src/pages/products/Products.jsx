import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import api from "../../configs/axios.config";
import {
  deleteProduct,
  fetchLowStockProducts,
  fetchProducts,
  fetchProductsByKeyword,
} from "../../services/product.service";
import { generateNotification } from "../../utils/notification.utils";

const LOW_STOCK_THRESHOLD = 10;

function formatPrices(pricing) {
  if (!Array.isArray(pricing) || pricing.length === 0) return [];

  return pricing
    .filter((price) => typeof price.price === "number")
    .map((price) => {
      try {
        return {
          currency: price.currency,
          value: new Intl.NumberFormat("en", {
            style: "currency",
            currency: price.currency || "INR",
            maximumFractionDigits: 2,
          }).format(price.price),
        };
      } catch {
        return {
          currency: price.currency,
          value: `${price.currency || ""} ${price.price}`.trim(),
        };
      }
    });
}

function getImageUrl(imageUrl) {
  if (!imageUrl) return "";
  try {
    return new URL(imageUrl, api.defaults.baseURL).toString();
  } catch {
    return "";
  }
}

function ProductCard({ product, onDelete }) {
  const isLowStock = Number(product.availableStock ?? 0) <= LOW_STOCK_THRESHOLD;
  const prices = formatPrices(product.pricing);
  const stock = Number(product.availableStock ?? 0);
  const imageUrl = getImageUrl(product.imageUrls?.[0]);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xl hover:shadow-black/15">
      <Link
        to={`/products/${product.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="relative block aspect-4/3 overflow-hidden bg-accent">
          <Package
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-muted-foreground"
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt={product.name || ""}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}
          {isLowStock && (
            <span className="absolute left-3 top-3 rounded-full border border-amber-300/20 bg-background/90 px-2.5 py-1 text-xs font-semibold text-amber-300 shadow-sm backdrop-blur">
              Low stock
            </span>
          )}
        </span>
        <span className="flex min-h-36 flex-col p-4">
          <span className="truncate text-base font-semibold text-foreground" title={product.name}>
            {product.name}
          </span>
          <span className="mt-auto flex items-end justify-between gap-3 pt-4">
            <span className="flex min-w-0 flex-wrap gap-x-3 gap-y-1.5">
              {prices.length > 0 ? (
                prices.map(({ currency, value }) => (
                  <span key={currency} className="text-sm font-semibold tabular-nums text-foreground">
                    <span className="mr-1 text-xs font-medium text-muted-foreground">
                      {currency}
                    </span>
                    {value}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Price unavailable</span>
              )}
            </span>
            <span
              className={`shrink-0 text-right text-xs font-semibold tabular-nums sm:text-sm ${
                isLowStock ? "text-amber-300" : "text-primary"
              }`}
            >
              <span className="block">{stock} units</span>
              <span className="text-[10px] font-normal text-muted-foreground">in stock</span>
            </span>
          </span>
        </span>
      </Link>

      {onDelete && (
        <button
          type="button"
          aria-label={`Delete ${product.name || "product"}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete(product);
          }}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-500/30 bg-background/80 text-red-300 shadow-sm backdrop-blur transition hover:border-red-400 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lowStockError, setLowStockError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    fetchLowStockProducts(1)
      .then((result) => {
        if (!isActive) return;
        const items = result?.items ?? result?.products ?? [];
        setLowStockProducts(
          items
            .filter(
              (product) =>
                Number(product.availableStock ?? 0) <= LOW_STOCK_THRESHOLD,
            )
            .sort(
              (left, right) =>
                Number(left.availableStock ?? 0) -
                Number(right.availableStock ?? 0),
            ),
        );
      })
      .catch(() => {
        if (isActive) setLowStockError("Low-stock products could not be loaded.");
      });

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError("");

      const trimmedKeyword = keyword.trim();
      const request =
        trimmedKeyword.length >= 3
          ? fetchProductsByKeyword(currentPage, trimmedKeyword)
          : fetchProducts(currentPage);

      request
        .then((result) => {
          if (!isActive) return;
          const items = result?.items ?? result?.products ?? [];
          setProducts(items);
          setCurrentPage(result?.currentPage ?? currentPage);
          setHasNextPage(Boolean(result?.hasNextPage));
          setHasPrevPage(Boolean(result?.hasPrevPage));
        })
        .catch(() => {
          if (!isActive) return;
          setProducts([]);
          setHasNextPage(false);
          setHasPrevPage(false);
          setError("Products could not be loaded. Please try again.");
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
    }, keyword.trim().length >= 3 ? 250 : 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [currentPage, keyword, refreshKey]);

  const handleDeleteProduct = async (product) => {
    const productId = product.id ?? product._id;

    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await deleteProduct(productId);
      generateNotification("Product deleted successfully.")();
      setRefreshKey((key) => key + 1);
    } catch (deleteError) {
      generateNotification(deleteError?.message || "Product could not be deleted.")();
    }
  };

  const handleSearch = (value) => {
    setKeyword(value);
    setCurrentPage(1);
  };

  return (
    <main className="mx-auto w-full max-w-375 px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 grid gap-4 border-b border-border pb-5 md:grid-cols-[1fr_minmax(14rem,20rem)_1fr] md:items-center">
        <div>
          <p className="text-sm font-medium text-primary">Catalog</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Products
          </h1>
        </div>
        <label className="block">
          <span className="sr-only">Search products</span>
          <span className="flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 focus-within:ring-2 focus-within:ring-primary">
            <input
              type="search"
              value={keyword}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search Product"
              aria-label="Search products by keyword"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <Search
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-muted-foreground"
            />
          </span>
          {keyword.trim().length > 0 && keyword.trim().length < 3 && (
            <span className="ml-4 mt-1 block text-xs text-muted-foreground">
              Enter at least 3 characters to search.
            </span>
          )}
        </label>
        <div className="md:justify-self-end">
          <Link
            to="/products/create"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background md:w-auto"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add New Product
          </Link>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <section aria-labelledby="low-stock-heading" className="mb-8 border-b border-border pb-8">
          <div className="mb-4 flex items-center gap-2 ">
            <AlertTriangle aria-hidden="true" className="h-5 w-5 text-amber-300" />
            <div>
              <h2 id="low-stock-heading" className="text-lg font-semibold text-foreground">
                Low inventory
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Products with {LOW_STOCK_THRESHOLD} or fewer units available
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {lowStockProducts.map((product) => (
              <ProductCard key={product.id} product={product} onDelete={handleDeleteProduct} />
            ))}
          </div>
          
        </section>
      )}

      {lowStockError && (
        <p role="status" className="mb-4 text-sm text-amber-300">
          {lowStockError}
        </p>
      )}

      <section aria-label="Product list">
        {error ? (
          <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center">
            <p role="alert" className="text-sm text-red-300">{error}</p>
          </div>
        ) : isLoading ? (
          <div role="status" className="rounded-2xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
            Loading products…
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-5 py-14 text-center">
            <Package aria-hidden="true" className="mx-auto h-9 w-9 text-muted-foreground" />
            <h2 className="mt-3 font-semibold text-foreground">No products found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another keyword or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onDelete={handleDeleteProduct} />
            ))}
          </div>
        )}
      </section>

      <nav
        aria-label="Product pagination"
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{currentPage}</span>
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

export default Products;
