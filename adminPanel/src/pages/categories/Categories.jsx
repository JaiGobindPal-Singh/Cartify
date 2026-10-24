import { deleteCategory, fetchCategories } from "../../services/category.service";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    Package,
    Plus,
    Trash2,
} from "lucide-react";
import { generateNotification } from "../../utils/notification.utils";



function CategoryCard({ category, onDelete, isDeleting }) {
    const imageUrl = category.iconUrl;

    return (
        <div className="group relative">
            <Link
                to={`/categories/${category.id}`}
                className="block overflow-hidden rounded-2xl border border-border bg-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xl hover:shadow-black/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <span className="relative block aspect-4/3 overflow-hidden bg-accent">
                    <Package
                        aria-hidden="true"
                        className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt={category.name || ""}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            onError={(event) => {
                                event.currentTarget.style.display = "none";
                            }}
                        />
                    )}
                </span>
                <span className="flex min-h-36 flex-col p-4">
                    <span className="truncate text-base font-semibold text-foreground" title={category.name}>
                        {category.name}
                    </span>
                </span>
            </Link>
            <button
                type="button"
                aria-label={`Delete ${category.name}`}
                title="Delete category"
                disabled={isDeleting}
                onClick={() => onDelete(category)}
                className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md transition-colors hover:border-red-400 hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-wait disabled:opacity-60"
            >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
        </div>
    );
}

function Categories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPrevPage, setHasPrevPage] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [deletingCategoryId, setDeletingCategoryId] = useState(null);

    useEffect(() => {
        let isActive = true;
        setIsLoading(true);
        setError("");

        const request =
            fetchCategories(currentPage);

        request
            .then((result) => {
                if (!isActive) return;
                const items = result?.categories ?? [];
                setCategories(items);
                setCurrentPage(result?.currentPage ?? currentPage);
                setHasNextPage(Boolean(result?.hasNextPage));
                setHasPrevPage(Boolean(result?.hasPrevPage));
            })
            .catch(() => {
                if (!isActive) return;
                setCategories([]);
                setHasNextPage(false);
                setHasPrevPage(false);
                setError("Categories could not be loaded. Please try again.");
            })
            .finally(() => {
                if (isActive) setIsLoading(false);
            });


        return () => {
            isActive = false;
        };
    }, [currentPage, refreshKey]);

    const handleDeleteCategory = async (category) => {
        const categoryId = category.id ?? category._id;
        if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
            return;
        }

        setDeletingCategoryId(categoryId);
        try {
            await deleteCategory(categoryId);
            generateNotification("Category deleted successfully.")();
            setRefreshKey((key) => key + 1);
        } catch (deleteError) {
            generateNotification(deleteError?.message || "Category could not be deleted.")();
        } finally {
            setDeletingCategoryId(null);
        }
    };

    return (
        <main className="mx-auto w-full max-w-375 px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-6 grid gap-4 border-b border-border pb-5 md:grid-cols-[1fr_minmax(14rem,20rem)_1fr] md:items-center">
                <div>

                    <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                        Categories
                    </h1>
                </div>

                <div className="md:justify-self-end">
                    <button
                        type="button"
                        onClick={()=>navigate("/categories/create")}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background md:w-auto cursor-pointer"
                    >
                        <Plus aria-hidden="true" className="h-4 w-4" />
                        Add New Category
                    </button>
                </div>
            </div>


            <section aria-label="category list">
                {error ? (
                    <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center">
                        <p role="alert" className="text-sm text-red-300">{error}</p>
                    </div>
                ) : isLoading ? (
                    <div role="status" className="rounded-2xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
                        Loading Categories…
                    </div>
                ) : categories.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card px-5 py-14 text-center">
                        <Package aria-hidden="true" className="mx-auto h-9 w-9 text-muted-foreground" />
                        <h2 className="mt-3 font-semibold text-foreground">No category found</h2>

                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {categories.map((cat) => (
                            <CategoryCard
                                key={cat.id ?? cat._id}
                                category={cat}
                                onDelete={handleDeleteCategory}
                                isDeleting={deletingCategoryId === (cat.id ?? cat._id)}
                            />
                        ))}
                    </div>
                )}
            </section>

            <nav
                aria-label="category pagination"
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
export default Categories;