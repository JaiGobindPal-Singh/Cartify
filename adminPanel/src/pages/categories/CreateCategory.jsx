import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ImagePlus,
    LoaderCircle,
    Save,
    Trash2,
} from "lucide-react";
import { createCategory } from "../../services/category.service";
import { generateNotification } from "../../utils/notification.utils";

const inputClass =
    "mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30";

function CreateCategory() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [name, setName] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isFeatured, setIsFeatured] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(
        () => () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        },
        [imagePreview],
    );

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
            await createCategory(trimmedName, isFeatured, image);
            generateNotification("Category added successfully.")();
            navigate("/categories");
        } catch (saveError) {
            const message = saveError?.message || "Category could not be added.";
            setError(message);
            generateNotification(message)();
        } finally {
            setIsSaving(false);
        }
    };

    const clearImage = () => {
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <main className="mx-auto w-full max-w-375 px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
            <Link
                to="/categories"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Back to categories
            </Link>

            <div className="mb-6 mt-4 border-b border-border pb-5">
                <p className="text-sm font-medium text-primary">Categories</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Create category
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Add a category to help customers browse your products.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
                    <section
                        aria-labelledby="category-information-heading"
                        className="rounded-2xl border border-border bg-card p-4 sm:p-6"
                    >
                        <div className="mb-5">
                            <h2
                                id="category-information-heading"
                                className="text-base font-semibold"
                            >
                                Category information
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Choose a clear name and set its visibility.
                            </p>
                        </div>

                        <div className="space-y-5">
                            <label
                                htmlFor="catname"
                                className="block text-sm font-medium"
                            >
                                Category name
                                <input
                                    className={inputClass}
                                    type="text"
                                    name="catname"
                                    id="catname"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="e.g. Home & kitchen"
                                    autoComplete="off"
                                    maxLength={120}
                                    required
                                />
                            </label>

                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:bg-accent/50">
                                <input
                                    type="checkbox"
                                    name="isfeatured"
                                    id="isfeatured"
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                    checked={isFeatured}
                                    onChange={(event) =>
                                        setIsFeatured(event.target.checked)
                                    }
                                />
                                <span>
                                    <span className="block text-sm font-medium">
                                        Featured category
                                    </span>
                                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                        Highlight this category in the catalog.
                                    </span>
                                </span>
                            </label>
                        </div>
                    </section>

                    <section
                        aria-labelledby="category-image-heading"
                        className="rounded-2xl border border-border bg-card p-4 sm:p-6"
                    >
                        <div className="mb-5">
                            <h2
                                id="category-image-heading"
                                className="text-base font-semibold"
                            >
                                Category image
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                JPG, PNG, or WebP image.
                            </p>
                        </div>
                                    
                        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-background">
                        
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt={`Preview of ${image?.name || "the selected category image"}`}
                                    className="h-full w-full  object-cover"
                                />
                            ) : (
                                <div className="px-4 text-center">
                                    <ImagePlus
                                        aria-hidden="true"
                                        className="mx-auto h-9 w-9 text-muted-foreground"
                                    />
                                    <p className="mt-3 text-sm font-medium">
                                        No image selected
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Choose an image to preview it here.
                                    </p>
                                    <label
                            htmlFor="uploadImage"
                            className="mt-4 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-primary"
                        >
                            <ImagePlus
                                aria-hidden="true"
                                className="mr-2 h-4 w-4"
                            />
                            {image ? "Choose a different image" : "Choose image"}
                            <input
                                type="file"
                                name="icon"
                                id="uploadImage"
                                ref={fileInputRef}
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) => {
                                    const selectedImage =
                                        event.target.files?.[0] ?? null;
                                    setImage(selectedImage);
                                    setImagePreview(
                                        selectedImage
                                            ? URL.createObjectURL(selectedImage)
                                            : null,
                                    );
                                }}
                                className="sr-only"
                                aria-describedby="image-format-help"
                            />
                        </label>
                                </div>
                            )}
                        </div>

                        {image && (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span className="min-w-0 break-all">{image.name}</span>
                                <button
                                    type="button"
                                    onClick={clearImage}
                                    className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                                    Remove image
                                </button>
                            </div>
                        )}

                        
                        <p
                            id="image-format-help"
                            className="mt-2 text-center text-xs text-muted-foreground"
                        >
                            Accepted formats: JPEG, PNG, WebP.
                        </p>
                    </section>
                </div>

                {error && (
                    <p
                        role="alert"
                        className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
                    >
                        {error}
                    </p>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                    <Link
                        to="/categories"
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-60"
                    >
                        {isSaving ? (
                            <LoaderCircle
                                aria-hidden="true"
                                className="h-4 w-4 animate-spin"
                            />
                        ) : (
                            <Save aria-hidden="true" className="h-4 w-4" />
                        )}
                        {isSaving ? "Saving…" : "Create category"}
                    </button>
                </div>
            </form>
        </main>
    );
}

export default CreateCategory;
