import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FolderTree, ImageOff, LoaderCircle, Save } from "lucide-react";
import api from "../../configs/axios.config";
import {
  fetchCategories,
  fetchCategoryById,
  updateCategory,
} from "../../services/category.service";
import { generateNotification } from "../../utils/notification.utils";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const sectionClass = "rounded-2xl border border-border bg-card p-4 sm:p-6";

function getId(value) {
  if (typeof value === "string") return value;
  return value?.id ?? value?._id ?? "";
}

function getImageUrl(imageUrl) {
  if (!imageUrl) return "";
  try {
    return new URL(imageUrl, api.defaults.baseURL).toString();
  } catch {
    return "";
  }
}

function CategoryDetails() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [name, setName] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadCategory = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [categoryResponse] = await Promise.all([
          fetchCategoryById(id),
        ]);
        const categoryData =
          categoryResponse?.category ?? categoryResponse?.data?.category ?? categoryResponse;

        

        if (!isActive) return;
        setCategory(categoryData);
        setName(categoryData?.name ?? "");
        setIsFeatured(Boolean(categoryData?.isFeatured));
      } catch (loadError) {
        if (!isActive) return;
        const message =
          loadError?.message || "Category details could not be loaded.";
        setError(message);
        generateNotification(message)();
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadCategory();
    return () => {
      isActive = false;
    };
  }, [id]);

  const handleSave = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      generateNotification("Category name is required.")();
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const response = await updateCategory(
        category.id ?? category._id ?? id,
        trimmedName,
        isFeatured,
      );
      const updatedCategory =
        response?.category ?? response?.data?.category ?? response;
      setCategory((current) => ({
        ...current,
        ...updatedCategory,
        name: updatedCategory?.name ?? trimmedName,
        isFeatured:
          typeof updatedCategory?.isFeatured === "boolean"
            ? updatedCategory.isFeatured
            : isFeatured,
      }));
      setName(updatedCategory?.name ?? trimmedName);
      generateNotification("Category updated successfully.")();
    } catch (saveError) {
      const message = saveError?.message || "Category could not be updated.";
      setError(message);
      generateNotification(message)();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-96 max-w-375 items-center justify-center px-4 text-muted-foreground">
        <LoaderCircle
          aria-hidden="true"
          className="mr-2 h-5 w-5 animate-spin"
        />
        Loading category details…
      </main>
    );
  }

  if (!category) {
    return (
      <main className="mx-auto max-w-375 px-4 py-8 sm:px-6 lg:px-8">
        <BackLink />
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200"
        >
          {error || "Category could not be found."}
        </p>
      </main>
    );
  }

  const iconUrl = category.iconUrl;

  return (
    <main className="mx-auto w-full max-w-375 px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
      <BackLink />

      <div className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-primary"> Categories</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {category.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and update this category.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={category.isFeatured ? "Featured" : "Not featured"}
            highlighted={category.isFeatured}
          />
          <StatusBadge
            label={category.isDeleted ? "Deleted" : "Active"}
            highlighted={!category.isDeleted}
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <section className={sectionClass}>
          <SectionHeading
            title="Category information"
            description="Update the category name and featured visibility."
          />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)]">
            <div className="space-y-5">
              <label className="block text-sm font-medium">
                Category name
                <input
                  className={inputClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={120}
                />
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-primary"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                />
                <span>
                  <span className="block text-sm font-medium">
                    Featured category
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Mark this category as featured in the catalog.
                  </span>
                </span>
              </label>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium">Category icon</p>
              {iconUrl ? (
                <div className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2">
                  <img
                    src={iconUrl}
                    alt={`${category.name} category`}
                    className="h-full w-full rounded-lg object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="flex aspect-4/3 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background text-muted-foreground">
                  <ImageOff aria-hidden="true" className="h-8 w-8" />
                  <span className="text-sm">No icon available</span>
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                The current category service supports updating the name and
                featured status. Icon replacement is not available here.
              </p>
            </div>
          </div>
        </section>

        
        <div className="flex justify-end pb-4">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <LoaderCircle
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
              />
            ) : (
              <Save aria-hidden="true" className="h-4 w-4" />
            )}
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </main>
  );
}

function BackLink() {
  return (
    <Link
      to="/categories"
      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      Categories
    </Link>
  );
}

function SectionHeading({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StatusBadge({ label, highlighted }) {
  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
        highlighted
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function DetailCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

export default CategoryDetails;
