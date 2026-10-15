import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ImagePlus,
    LoaderCircle,
    Plus,
    Save,
    Trash2,
} from "lucide-react";
import { fetchCategories } from "../../services/category.service";
import {
    addImages as uploadProductImages,
    createProduct,
    deleteImage,
    fetchProductById,
    updateProduct,
} from "../../services/product.service";
import api from "../../configs/axios.config";
import { fetchStoreConfig } from "../../services/storeConfig.service";
import { generateNotification } from "../../utils/notification.utils";

const inputClass =
    "mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30";
const cardClass = "rounded-2xl border border-border bg-card p-4 sm:p-6";
const secondaryButtonClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function createSection() {
    return { heading: "", content: "", attributes: [] };
}

function createPurchaseOption() {
    return {
        optionName: "",
        optionValues: [],
    };
}

function createOptionValue(currencies) {
    return {
        option: "",
        pricingChange: currencies.map((currency) => ({
            currency,
            priceChange: "0",
        })),
    };
}

function getCategoryId(category) {
    if (typeof category === "string") return category;
    return category?.id ?? category?._id ?? "";
}

function currencyLabel(currency) {
    try {
        const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(
            currency,
        );
        return name && name !== currency
            ? `${name} (${currency})`
            : currency;
    } catch {
        return currency;
    }
}

function getCategories(result) {
    if (Array.isArray(result)) return result;
    return result?.categories ?? [];
}

function getImageSource(imageUrl) {
    if (!imageUrl) return "";
    try {
        return new URL(imageUrl, api.defaults.baseURL).toString();
    } catch {
        return imageUrl;
    }
}

function FieldError({ children, id }) {
    if (!children) return null;
    return (
        <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-red-300">
            {children}
        </p>
    );
}

function SectionTitle({ id, title, description, action }) {
    return (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
                <h2 id={id} className="text-base font-semibold">{title}</h2>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}

function CreateProduct({ isEditing = false }) {
    const navigate = useNavigate();
    const { id: routeProductId } = useParams();
    const productId = isEditing ? routeProductId : "";
    const fileInputRef = useRef(null);
    const previewUrlsRef = useRef(new Set());
    const [categories, setCategories] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
    const [isCurrenciesLoading, setIsCurrenciesLoading] = useState(true);
    const [categoryError, setCategoryError] = useState("");
    const [configError, setConfigError] = useState("");
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [keywords, setKeywords] = useState([]);
    const [keywordDraft, setKeywordDraft] = useState("");
    const [description, setDescription] = useState("");
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [loadedProductId, setLoadedProductId] = useState("");
    const [productLoadError, setProductLoadError] = useState(null);
    const [imageError, setImageError] = useState("");
    const [pricingInputs, setPricingInputs] = useState({});
    const [sections, setSections] = useState([]);
    const [purchaseOptions, setPurchaseOptions] = useState([]);
    const [availableStock, setAvailableStock] = useState("0");
    const [isFeatured, setIsFeatured] = useState(false);
    const [isUpcoming, setIsUpcoming] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let active = true;

        const loadCategories = async () => {
            setIsCategoriesLoading(true);
            setCategoryError("");
            try {
                const collected = [];
                let page = 1;
                let hasNextPage = true;
                while (hasNextPage) {
                    const result = await fetchCategories(page, 100);
                    if (!active) return;
                    collected.push(...getCategories(result));
                    hasNextPage = Boolean(result?.hasNextPage);
                    page = Number(result?.currentPage ?? page) + 1;
                }
                setCategories(collected);
            } catch (error) {
                if (active) {
                    setCategoryError(
                        error?.message || "Categories could not be loaded.",
                    );
                }
            } finally {
                if (active) setIsCategoriesLoading(false);
            }
        };

        const loadCurrencies = async () => {
            setIsCurrenciesLoading(true);
            setConfigError("");
            try {
                const config = await fetchStoreConfig();
                if (!active) return;
                const supportedCurrencies = Array.isArray(
                    config?.supportedCurrencies,
                )
                    ? config.supportedCurrencies.filter(
                        (currency) => typeof currency === "string" && currency,
                    )
                    : [];
                setCurrencies(supportedCurrencies);
                if (!isEditing) {
                    setPricingInputs(
                        Object.fromEntries(
                            supportedCurrencies.map((currency) => [
                                currency,
                                { price: "", comparePrice: "" },
                            ]),
                        ),
                    );
                }
            } catch (error) {
                if (active) {
                    setConfigError(
                        error?.message || "Supported currencies could not be loaded.",
                    );
                }
            } finally {
                if (active) setIsCurrenciesLoading(false);
            }
        };

        loadCategories();
        loadCurrencies();
        return () => {
            active = false;
        };
    }, [isEditing]);

    useEffect(() => {
        if (!isEditing) return undefined;
        if (!productId) return undefined;
        if (isCurrenciesLoading) return undefined;
        let active = true;

        const loadProduct = async () => {
            try {
                const product = await fetchProductById(productId);
                if (!active) return;
                if (!product || Object.keys(product).length === 0) {
                    throw new Error("Product could not be found.");
                }
                setName(product.name ?? "");
                setCategory(getCategoryId(product.category));
                setKeywords(Array.isArray(product.keywords) ? product.keywords : []);
                setDescription(product.description ?? "");
                setSections(
                    Array.isArray(product.sections)
                        ? product.sections.map((section) => ({
                            heading: section.heading ?? "",
                            content: section.content ?? "",
                            attributes: Array.isArray(section.attributes)
                                ? section.attributes.map((attribute) => ({
                                    name: attribute.name ?? "",
                                    value: attribute.value ?? "",
                                }))
                                : [],
                        }))
                        : [],
                );
                setPricingInputs(
                    Object.fromEntries(
                        currencies.map((currency) => {
                            const price = product.pricing?.find(
                                (item) => item.currency === currency,
                            );
                            return [
                                currency,
                                {
                                    price: price?.price ?? "",
                                    comparePrice: price?.comparePrice ?? "",
                                },
                            ];
                        }),
                    ),
                );
                setPurchaseOptions(
                    Array.isArray(product.purchaseOptions)
                        ? product.purchaseOptions.map((option) => ({
                            optionName: option.optionName ?? "",
                            optionValues: Array.isArray(option.optionValues)
                                ? option.optionValues.map((value) => ({
                                    option: value.option ?? "",
                                    pricingChange: currencies.map((currency) => ({
                                        currency,
                                        priceChange:
                                            value.pricingChange?.find(
                                                (item) => item.currency === currency,
                                            )?.priceChange ?? "0",
                                    })),
                                }))
                                : [],
                        }))
                        : [],
                );
                setAvailableStock(String(product.availableStock ?? 0));
                setIsFeatured(Boolean(product.isFeatured));
                setIsUpcoming(Boolean(product.isUpcoming));
                setExistingImages(
                    Array.isArray(product.imageUrls) ? product.imageUrls : [],
                );
                setLoadedProductId(productId);
            } catch (error) {
                if (active) {
                    setProductLoadError(
                        {
                            productId,
                            message:
                                error?.message ||
                                "Product details could not be loaded.",
                        },
                    );
                }
            }
        };

        loadProduct();
        return () => {
            active = false;
        };
    }, [currencies, isCurrenciesLoading, isEditing, productId]);

    useEffect(
        () => () => {
            previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
            previewUrlsRef.current.clear();
        },
        [],
    );

    const addKeyword = () => {
        const keyword = keywordDraft.trim();
        if (!keyword) return;
        if (!keywords.some((item) => item.toLowerCase() === keyword.toLowerCase())) {
            setKeywords((current) => [...current, keyword]);
        }
        setKeywordDraft("");
    };

    const addImages = (event) => {
        const selectedFiles = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (selectedFiles.length === 0) return;

        const invalidFile = selectedFiles.find(
            (file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type),
        );
        if (invalidFile) {
            setImageError(`${invalidFile.name} is not a supported image format.`);
            return;
        }
        if (existingImages.length + images.length + selectedFiles.length > 5) {
            setImageError("You can add up to 5 images.");
            return;
        }

        setImageError("");
        const selectedImages = selectedFiles.map((file) => {
            const preview = URL.createObjectURL(file);
            previewUrlsRef.current.add(preview);
            return { file, preview };
        });
        setImages((current) => [...current, ...selectedImages]);
    };

    const removeImage = (index) => {
        const removedImage = images[index];
        if (removedImage) {
            URL.revokeObjectURL(removedImage.preview);
            previewUrlsRef.current.delete(removedImage.preview);
        }
        setImages((current) => current.filter((_, imageIndex) => imageIndex !== index));
        setImageError("");
    };

    const removeExistingImage = async (imageUrl) => {
        try {
            await deleteImage(productId, imageUrl);
            setExistingImages((current) =>
                current.filter((url) => url !== imageUrl),
            );
            setImageError("");
        } catch (error) {
            const message = error?.message || "Image could not be removed.";
            setImageError(message);
            generateNotification(message)();
        }
    };

    const setSectionField = (sectionIndex, key, value) => {
        setSections((current) =>
            current.map((section, index) =>
                index === sectionIndex ? { ...section, [key]: value } : section,
            ),
        );
    };

    const setAttributeField = (sectionIndex, attributeIndex, key, value) => {
        setSections((current) =>
            current.map((section, index) =>
                index === sectionIndex
                    ? {
                        ...section,
                        attributes: section.attributes.map((attribute, itemIndex) =>
                            itemIndex === attributeIndex
                                ? { ...attribute, [key]: value }
                                : attribute,
                        ),
                    }
                    : section,
            ),
        );
    };

    const setOptionField = (optionIndex, key, value) => {
        setPurchaseOptions((current) =>
            current.map((option, index) =>
                index === optionIndex ? { ...option, [key]: value } : option,
            ),
        );
    };

    const setOptionValueField = (optionIndex, valueIndex, key, value) => {
        setPurchaseOptions((current) =>
            current.map((option, index) =>
                index === optionIndex
                    ? {
                        ...option,
                        optionValues: option.optionValues.map((optionValue, itemIndex) =>
                            itemIndex === valueIndex
                                ? { ...optionValue, [key]: value }
                                : optionValue,
                        ),
                    }
                    : option,
            ),
        );
    };

    const setPriceChange = (optionIndex, valueIndex, currency, priceChange) => {
        setPurchaseOptions((current) =>
            current.map((option, index) =>
                index === optionIndex
                    ? {
                        ...option,
                        optionValues: option.optionValues.map((optionValue, itemIndex) =>
                            itemIndex === valueIndex
                                ? {
                                    ...optionValue,
                                    pricingChange: optionValue.pricingChange.map(
                                        (price) =>
                                            price.currency === currency
                                                ? { ...price, priceChange }
                                                : price,
                                    ),
                                }
                                : optionValue,
                        ),
                    }
                    : option,
            ),
        );
    };

    const validateForm = () => {
        const errors = {};
        if (!name.trim()) errors.name = "Product name is required.";
        if (!category) errors.category = "Choose a category.";
        if (currencies.length === 0) {
            errors.currencies = "Add supported currencies in store settings first.";
        }
        for (const currency of currencies) {
            const price = pricingInputs[currency]?.price;
            if (price === "" || price === undefined) {
                errors[`price-${currency}`] = "Price is required for this currency.";
            } else if (!Number.isFinite(Number(price)) || Number(price) < 0) {
                errors[`price-${currency}`] = "Enter a valid price of 0 or more.";
            }
            const comparePrice = pricingInputs[currency]?.comparePrice;
            if (
                comparePrice !== "" &&
                comparePrice !== undefined &&
                (!Number.isFinite(Number(comparePrice)) || Number(comparePrice) < 0)
            ) {
                errors[`compare-${currency}`] =
                    "Enter a valid compare price of 0 or more.";
            }
        }
        if (
            availableStock === "" ||
            !Number.isInteger(Number(availableStock)) ||
            Number(availableStock) < 0
        ) {
            errors.availableStock = "Stock must be a whole number of 0 or more.";
        }
        sections.forEach((section, index) => {
            if (!section.heading.trim()) {
                errors[`section-${index}`] = "Section heading is required.";
            }
        });
        purchaseOptions.forEach((option, index) => {
            if (!option.optionName.trim()) {
                errors[`option-name-${index}`] = "Option name is required.";
            }
            if (option.optionValues.length === 0) {
                errors[`option-values-${index}`] =
                    "Add at least one value for this option.";
            }
            option.optionValues.forEach((value, valueIndex) => {
                if (!value.option.trim()) {
                    errors[`option-value-${index}-${valueIndex}`] =
                        "Option value is required.";
                }
                value.pricingChange.forEach((change) => {
                    if (
                        change.priceChange === "" ||
                        !Number.isFinite(Number(change.priceChange))
                    ) {
                        errors[
                            `option-price-${index}-${valueIndex}-${change.currency}`
                        ] = "Enter a valid price change.";
                    }
                });
            });
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSaving || isCategoriesLoading || isCurrenciesLoading) return;
        setSubmitError("");
        if (!validateForm()) {
            generateNotification("Please review the highlighted fields.")();
            return;
        }

        const cleanSections = sections.map((section) => ({
            heading: section.heading.trim(),
            content: section.content.trim(),
            attributes: section.attributes.map((attribute) => ({
                name: attribute.name.trim(),
                value: attribute.value.trim(),
            })),
        }));
        const pricing = currencies.map((currency) => {
            const price = pricingInputs[currency];
            const currencyPricing = {
                currency,
                price: Number(price.price),
            };
            if (price.comparePrice !== "") {
                currencyPricing.comparePrice = Number(price.comparePrice);
            }
            return currencyPricing;
        });
        const cleanPurchaseOptions = purchaseOptions.map((option) => ({
            optionName: option.optionName.trim(),
            optionValues: option.optionValues.map((value) => ({
                option: value.option.trim(),
                pricingChange: currencies.map((currency) => {
                    const change = value.pricingChange.find(
                        (item) => item.currency === currency,
                    );
                    return {
                        currency,
                        priceChange: Number(change?.priceChange ?? 0),
                    };
                }),
            })),
        }));

        setIsSaving(true);
        try {
            if (isEditing) {
                await updateProduct(productId, {
                    name: name.trim(),
                    category,
                    keywords,
                    description: description.trim(),
                    sections: cleanSections,
                    pricing,
                    purchaseOptions: cleanPurchaseOptions,
                    isFeatured,
                    isUpcoming,
                    availableStock: Number(availableStock),
                });
                if (images.length > 0) {
                    try {
                        await uploadProductImages(
                            productId,
                            images.map(({ file }) => file),
                        );
                    } catch (error) {
                        throw new Error(
                            `Product details were saved, but images could not be added: ${error?.message || "Please try again."}`,
                        );
                    }
                }
                generateNotification("Product updated successfully.")();
            } else {
                await createProduct(
                    name.trim(),
                    category,
                    keywords,
                    description.trim(),
                    cleanSections,
                    pricing,
                    cleanPurchaseOptions,
                    isFeatured,
                    Number(availableStock),
                    images.map(({ file }) => file),
                    isUpcoming,
                );
                generateNotification("Product created successfully.")();
            }
            navigate("/products");
        } catch (error) {
            const message =
                error?.message ||
                `Product could not be ${isEditing ? "updated" : "created"}.`;
            setSubmitError(message);
            generateNotification(message)();
        } finally {
            setIsSaving(false);
        }
    };

    const submitDisabled =
        isSaving ||
        isCategoriesLoading ||
        isCurrenciesLoading ||
        Boolean(configError) ||
        currencies.length === 0;

    const isProductLoaded = !isEditing || loadedProductId === productId;
    const productLoadErrorMessage = !productId
        ? "Product ID is missing."
        : productLoadError?.productId === productId
            ? productLoadError.message
            : "";

    if (isEditing && !isProductLoaded) {
        return (
            <main className="mx-auto w-full max-w-375 px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
                <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground">
                    Back to products
                </Link>
                <p className="mt-6" role={productLoadErrorMessage ? "alert" : "status"}>
                    {productLoadErrorMessage || "Loading product…"}
                </p>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-375 px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
            <Link
                to="/products"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Back to products
            </Link>

            <div className="mb-6 mt-4 border-b border-border pb-5">
                <p className="text-sm font-medium text-primary">Products</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {isEditing ? "Edit product" : "Create product"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Add product details, pricing, images, and purchase options.
                </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <section aria-labelledby="basic-info-heading" className={cardClass}>
                    <SectionTitle
                        id="basic-info-heading"
                        title="Basic information"
                        description="Describe the product and assign it to a category."
                    />
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label htmlFor="product-name" className="block text-sm font-medium">
                                Product name <span aria-hidden="true" className="text-primary">*</span>
                            </label>
                            <input
                                id="product-name"
                                className={inputClass}
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={160}
                                autoComplete="off"
                                aria-invalid={Boolean(validationErrors.name)}
                                aria-describedby={
                                    validationErrors.name ? "product-name-error" : undefined
                                }
                                required
                            />
                            <FieldError id="product-name-error">
                                {validationErrors.name}
                            </FieldError>
                        </div>
                        <div>
                            <label htmlFor="product-category" className="block text-sm font-medium">
                                Category*
                            </label>
                            <select
                                id="product-category"
                                className={inputClass}
                                required={true}
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                                disabled={isCategoriesLoading || Boolean(categoryError)}
                                aria-invalid={Boolean(validationErrors.category)}
                            >
                                <option value="">
                                    {isCategoriesLoading
                                        ? "Loading categories…"
                                        : categoryError
                                            ? "Categories unavailable"
                                            : categories.length === 0
                                                ? "No categories available"
                                                : "Select a category"}
                                </option>
                                {categories.map((item) => (
                                    <option
                                        key={getCategoryId(item)}
                                        value={getCategoryId(item)}
                                    >
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            <FieldError>{validationErrors.category}</FieldError>
                            {categoryError && (
                                <p role="alert" className="mt-1.5 text-xs text-red-300">
                                    {categoryError}
                                </p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="product-keywords" className="block text-sm font-medium">
                                Keywords
                            </label>
                            <div className="mt-1.5 flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
                                {keywords.map((keyword) => (
                                    <span
                                        key={keyword}
                                        className="inline-flex min-h-8 items-center gap-1 rounded-full bg-accent px-3 text-xs font-medium text-accent-foreground"
                                    >
                                        {keyword}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setKeywords((current) =>
                                                    current.filter((item) => item !== keyword),
                                                )
                                            }
                                            aria-label={`Remove keyword ${keyword}`}
                                            className="rounded-full p-0.5 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            <Trash2 aria-hidden="true" className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    id="product-keywords"
                                    value={keywordDraft}
                                    onChange={(event) => setKeywordDraft(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === ",") {
                                            event.preventDefault();
                                            addKeyword();
                                        }
                                    }}
                                    placeholder="Type a keyword and press Enter"
                                    className="h-7 min-w-40 flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                                />
                                <button
                                    type="button"
                                    onClick={addKeyword}
                                    className={secondaryButtonClass}
                                >
                                    <Plus aria-hidden="true" className="h-4 w-4" />
                                    Add
                                </button>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                Press Enter or comma to add a keyword.
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="product-description" className="block text-sm font-medium">
                                Description
                            </label>
                            <textarea
                                id="product-description"
                                className={`${inputClass} h-32 resize-y py-3`}
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                maxLength={5000}
                                placeholder="Describe the product for your customers."
                            />
                        </div>
                    </div>
                </section>

                <section aria-labelledby="product-images-heading" className={cardClass}>
                    <SectionTitle
                        id="product-images-heading"
                        title="Images"
                        description={`Add up to 5 product images. ${existingImages.length + images.length} of 5 selected.`}
                        action={
                            <label
                                className={`${secondaryButtonClass} cursor-pointer focus-within:ring-2 focus-within:ring-primary`}
                                htmlFor="product-images"
                            >
                                <ImagePlus aria-hidden="true" className="h-4 w-4" />
                                Add images
                                <input
                                    ref={fileInputRef}
                                    id="product-images"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    onChange={addImages}
                                    disabled={existingImages.length + images.length >= 5}
                                    className="sr-only"
                                    aria-describedby="image-upload-help"
                                />
                            </label>
                        }
                    />
                    <p id="image-upload-help" className="mb-4 text-xs text-muted-foreground">
                        JPEG, PNG, or WebP. Maximum 5 images.
                    </p>
                    {imageError && (
                        <p role="alert" className="mb-4 text-sm text-red-300">
                            {imageError}
                        </p>
                    )}
                    {existingImages.length + images.length ? (
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            {existingImages.map((imageUrl, index) => (
                                <li
                                    key={imageUrl}
                                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-background"
                                >
                                    <img
                                        src={getImageSource(imageUrl)}
                                        alt={`Product image ${index + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(imageUrl)}
                                        aria-label={`Remove product image ${index + 1}`}
                                        className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md transition-colors hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                                    </button>
                                </li>
                            ))}
                            {images.map((image, index) => (
                                <li
                                    key={image.preview}
                                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-background"
                                >
                                    <img
                                        src={image.preview}
                                        alt={`Product image ${index + 1}: ${image.file.name}`}
                                        className="h-full w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        aria-label={`Remove product image ${index + 1}`}
                                        className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md transition-colors hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-4 text-center">
                            <ImagePlus
                                aria-hidden="true"
                                className="h-8 w-8 text-muted-foreground"
                            />
                            <p className="mt-2 text-sm font-medium">No images selected</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Image previews will appear here.
                            </p>
                        </div>
                    )}
                </section>

                <section aria-labelledby="pricing-heading" className={cardClass}>
                    <SectionTitle
                        id="pricing-heading"
                        title="Pricing"
                        description="Set a price for every currency configured in store settings."
                    />
                    {isCurrenciesLoading ? (
                        <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                            Loading supported currencies…
                        </div>
                    ) : configError ? (
                        <p role="alert" className="text-sm text-red-300">{configError}</p>
                    ) : currencies.length === 0 ? (
                        <p role="alert" className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                            No supported currencies are configured. Add currencies in store settings before creating a product.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {currencies.map((currency) => (
                                <div
                                    key={currency}
                                    className="grid gap-4 rounded-xl border border-border bg-background p-4 sm:grid-cols-[minmax(10rem,1fr)_minmax(8rem,1fr)_minmax(8rem,1fr)] sm:items-start"
                                >
                                    <p className="pt-3 text-sm font-medium">
                                        {currencyLabel(currency)}
                                    </p>
                                    <div>
                                        <label
                                            htmlFor={`price-${currency}`}
                                            className="block text-xs font-medium text-muted-foreground"
                                        >
                                            Price *
                                        </label>
                                        <input
                                            id={`price-${currency}`}
                                            type="number"
                                            min="0"
                                            step="any"
                                            required
                                            className={inputClass}
                                            value={pricingInputs[currency]?.price ?? ""}
                                            onChange={(event) =>
                                                setPricingInputs((current) => ({
                                                    ...current,
                                                    [currency]: {
                                                        ...current[currency],
                                                        price: event.target.value,
                                                    },
                                                }))
                                            }
                                            aria-invalid={Boolean(
                                                validationErrors[`price-${currency}`],
                                            )}
                                        />
                                        <FieldError>
                                            {validationErrors[`price-${currency}`]}
                                        </FieldError>
                                    </div>
                                    <div>
                                        <label
                                            htmlFor={`compare-price-${currency}`}
                                            className="block text-xs font-medium text-muted-foreground"
                                        >
                                            Compare price
                                        </label>
                                        <input
                                            id={`compare-price-${currency}`}
                                            type="number"
                                            min="0"
                                            step="any"
                                            className={inputClass}
                                            value={pricingInputs[currency]?.comparePrice ?? ""}
                                            onChange={(event) =>
                                                setPricingInputs((current) => ({
                                                    ...current,
                                                    [currency]: {
                                                        ...current[currency],
                                                        comparePrice: event.target.value,
                                                    },
                                                }))
                                            }
                                            aria-invalid={Boolean(
                                                validationErrors[`compare-${currency}`],
                                            )}
                                        />
                                        <FieldError>
                                            {validationErrors[`compare-${currency}`]}
                                        </FieldError>
                                    </div>
                                </div>
                            ))}
                            {validationErrors.currencies && (
                                <p role="alert" className="text-sm text-red-300">
                                    {validationErrors.currencies}
                                </p>
                            )}
                        </div>
                    )}
                </section>

                <section aria-labelledby="sections-heading" className={cardClass}>
                    <SectionTitle
                        id="sections-heading"
                        title="Product sections"
                        description="Add details and attributes to organize product information."
                        action={
                            <button
                                type="button"
                                onClick={() => setSections((current) => [...current, createSection()])}
                                className={secondaryButtonClass}
                            >
                                <Plus aria-hidden="true" className="h-4 w-4" />
                                Add section
                            </button>
                        }
                    />
                    {sections.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                            No sections added. Sections are optional.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {sections.map((section, sectionIndex) => (
                                <fieldset
                                    key={sectionIndex}
                                    className="space-y-4 rounded-xl border border-border bg-background p-4"
                                >
                                    <legend className="px-1 text-sm font-semibold">
                                        Section {sectionIndex + 1}
                                    </legend>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor={`section-heading-${sectionIndex}`}
                                                className="block text-sm font-medium"
                                            >
                                                Heading *
                                            </label>
                                            <input
                                                id={`section-heading-${sectionIndex}`}
                                                className={inputClass}
                                                value={section.heading}
                                                onChange={(event) =>
                                                    setSectionField(
                                                        sectionIndex,
                                                        "heading",
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    validationErrors[`section-${sectionIndex}`],
                                                )}
                                            />
                                            <FieldError>
                                                {validationErrors[`section-${sectionIndex}`]}
                                            </FieldError>
                                        </div>
                                        <div>
                                            <label
                                                htmlFor={`section-content-${sectionIndex}`}
                                                className="block text-sm font-medium"
                                            >
                                                Content
                                            </label>
                                            <textarea
                                                id={`section-content-${sectionIndex}`}
                                                className={`${inputClass} h-24 resize-y py-3`}
                                                value={section.content}
                                                onChange={(event) =>
                                                    setSectionField(
                                                        sectionIndex,
                                                        "content",
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h3 className="text-sm font-medium">Attributes</h3>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSections((current) =>
                                                        current.map((item, index) =>
                                                            index === sectionIndex
                                                                ? {
                                                                    ...item,
                                                                    attributes: [
                                                                        ...item.attributes,
                                                                        { name: "", value: "" },
                                                                    ],
                                                                }
                                                                : item,
                                                        ),
                                                    )
                                                }
                                                className={secondaryButtonClass}
                                            >
                                                <Plus aria-hidden="true" className="h-4 w-4" />
                                                Add attribute
                                            </button>
                                        </div>
                                        {section.attributes.map((attribute, attributeIndex) => (
                                            <div
                                                key={attributeIndex}
                                                className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                                            >
                                                <label
                                                    htmlFor={`attribute-name-${sectionIndex}-${attributeIndex}`}
                                                    className="block text-xs font-medium text-muted-foreground"
                                                >
                                                    Attribute name
                                                    <input
                                                        id={`attribute-name-${sectionIndex}-${attributeIndex}`}
                                                        className={inputClass}
                                                        value={attribute.name}
                                                        onChange={(event) =>
                                                            setAttributeField(
                                                                sectionIndex,
                                                                attributeIndex,
                                                                "name",
                                                                event.target.value,
                                                            )
                                                        }
                                                    />
                                                </label>
                                                <label
                                                    htmlFor={`attribute-value-${sectionIndex}-${attributeIndex}`}
                                                    className="block text-xs font-medium text-muted-foreground"
                                                >
                                                    Value
                                                    <input
                                                        id={`attribute-value-${sectionIndex}-${attributeIndex}`}
                                                        className={inputClass}
                                                        value={attribute.value}
                                                        onChange={(event) =>
                                                            setAttributeField(
                                                                sectionIndex,
                                                                attributeIndex,
                                                                "value",
                                                                event.target.value,
                                                            )
                                                        }
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSections((current) =>
                                                            current.map((item, index) =>
                                                                index === sectionIndex
                                                                    ? {
                                                                        ...item,
                                                                        attributes:
                                                                            item.attributes.filter(
                                                                                (_, i) =>
                                                                                    i !==
                                                                                    attributeIndex,
                                                                            ),
                                                                    }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                    aria-label={`Remove attribute ${attributeIndex + 1} from section ${sectionIndex + 1}`}
                                                    className={`${secondaryButtonClass} text-muted-foreground`}
                                                >
                                                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                                                    <span className="sm:sr-only">Remove</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end border-t border-border pt-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSections((current) =>
                                                    current.filter(
                                                        (_, index) => index !== sectionIndex,
                                                    ),
                                                )
                                            }
                                            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                                            Remove section
                                        </button>
                                    </div>
                                </fieldset>
                            ))}
                        </div>
                    )}
                </section>

                <section aria-labelledby="purchase-options-heading" className={cardClass}>
                    <SectionTitle
                        id="purchase-options-heading"
                        title="Purchase options"
                        description="Add selectable variants and their price adjustments in each supported currency."
                        action={
                            <button
                                type="button"
                                onClick={() =>
                                    setPurchaseOptions((current) => [
                                        ...current,
                                        createPurchaseOption(),
                                    ])
                                }
                                className={secondaryButtonClass}
                            >
                                <Plus aria-hidden="true" className="h-4 w-4" />
                                Add option
                            </button>
                        }
                    />
                    {purchaseOptions.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                            No purchase options added. Options are optional.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {purchaseOptions.map((option, optionIndex) => (
                                <fieldset
                                    key={optionIndex}
                                    className="space-y-4 rounded-xl border border-border bg-background p-4"
                                >
                                    <legend className="px-1 text-sm font-semibold">
                                        Purchase option {optionIndex + 1}
                                    </legend>
                                    <div>
                                        <label
                                            htmlFor={`option-name-${optionIndex}`}
                                            className="block text-sm font-medium"
                                        >
                                            Option name *
                                        </label>
                                        <input
                                            id={`option-name-${optionIndex}`}
                                            className={inputClass}
                                            value={option.optionName}
                                            onChange={(event) =>
                                                setOptionField(
                                                    optionIndex,
                                                    "optionName",
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                validationErrors[`option-name-${optionIndex}`],
                                            )}
                                        />
                                        <FieldError>
                                            {validationErrors[`option-name-${optionIndex}`]}
                                        </FieldError>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-sm font-medium">Option values</h3>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPurchaseOptions((current) =>
                                                    current.map((item, index) =>
                                                        index === optionIndex
                                                            ? {
                                                                ...item,
                                                                optionValues: [
                                                                    ...item.optionValues,
                                                                    createOptionValue(currencies),
                                                                ],
                                                            }
                                                            : item,
                                                    ),
                                                )
                                            }
                                            className={secondaryButtonClass}
                                        >
                                            <Plus aria-hidden="true" className="h-4 w-4" />
                                            Add value
                                        </button>
                                    </div>
                                    <FieldError>
                                        {validationErrors[`option-values-${optionIndex}`]}
                                    </FieldError>
                                    {option.optionValues.map((value, valueIndex) => (
                                        <div
                                            key={valueIndex}
                                            className="space-y-3 rounded-xl border border-border p-3 sm:p-4"
                                        >
                                            <div className="flex flex-wrap items-end gap-3">
                                                <label
                                                    htmlFor={`option-value-${optionIndex}-${valueIndex}`}
                                                    className="min-w-0 flex-1 text-sm font-medium"
                                                >
                                                    Value *
                                                    <input
                                                        id={`option-value-${optionIndex}-${valueIndex}`}
                                                        className={inputClass}
                                                        value={value.option}
                                                        onChange={(event) =>
                                                            setOptionValueField(
                                                                optionIndex,
                                                                valueIndex,
                                                                "option",
                                                                event.target.value,
                                                            )
                                                        }
                                                        aria-invalid={Boolean(
                                                            validationErrors[
                                                            `option-value-${optionIndex}-${valueIndex}`
                                                            ],
                                                        )}
                                                    />
                                                    <FieldError>
                                                        {
                                                            validationErrors[
                                                            `option-value-${optionIndex}-${valueIndex}`
                                                            ]
                                                        }
                                                    </FieldError>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPurchaseOptions((current) =>
                                                            current.map((item, index) =>
                                                                index === optionIndex
                                                                    ? {
                                                                        ...item,
                                                                        optionValues:
                                                                            item.optionValues.filter(
                                                                                (_, i) =>
                                                                                    i !==
                                                                                    valueIndex,
                                                                            ),
                                                                    }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                    aria-label={`Remove value ${valueIndex + 1} from option ${optionIndex + 1}`}
                                                    className={`${secondaryButtonClass} text-muted-foreground`}
                                                >
                                                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                                                    <span>Remove value</span>
                                                </button>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                {currencies.map((currency) => {
                                                    const change =
                                                        value.pricingChange.find(
                                                            (item) =>
                                                                item.currency === currency,
                                                        )?.priceChange ?? "0";
                                                    return (
                                                        <div key={currency}>
                                                            <label
                                                                htmlFor={`option-price-${optionIndex}-${valueIndex}-${currency}`}
                                                                className="block text-xs font-medium text-muted-foreground"
                                                            >
                                                                {currencyLabel(currency)} price change
                                                            </label>
                                                            <input
                                                                id={`option-price-${optionIndex}-${valueIndex}-${currency}`}
                                                                type="number"
                                                                step="any"
                                                                className={inputClass}
                                                                value={change}
                                                                onChange={(event) =>
                                                                    setPriceChange(
                                                                        optionIndex,
                                                                        valueIndex,
                                                                        currency,
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                aria-invalid={Boolean(
                                                                    validationErrors[
                                                                    `option-price-${optionIndex}-${valueIndex}-${currency}`
                                                                    ],
                                                                )}
                                                            />
                                                            <FieldError>
                                                                {
                                                                    validationErrors[
                                                                    `option-price-${optionIndex}-${valueIndex}-${currency}`
                                                                    ]
                                                                }
                                                            </FieldError>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-end border-t border-border pt-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPurchaseOptions((current) =>
                                                    current.filter(
                                                        (_, index) => index !== optionIndex,
                                                    ),
                                                )
                                            }
                                            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                                            Remove option
                                        </button>
                                    </div>
                                </fieldset>
                            ))}
                        </div>
                    )}
                </section>

                <section aria-labelledby="inventory-heading" className={cardClass}>
                    <SectionTitle
                        id="inventory-heading"
                        title="Inventory & settings"
                        description="Set available inventory and product visibility."
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="available-stock" className="block text-sm font-medium">
                                Available stock *
                            </label>
                            <input
                                id="available-stock"
                                type="number"
                                min="0"
                                step="1"
                                required
                                className={inputClass}
                                value={availableStock}
                                onChange={(event) => setAvailableStock(event.target.value)}
                                aria-invalid={Boolean(validationErrors.availableStock)}
                            />
                            <FieldError>{validationErrors.availableStock}</FieldError>
                        </div>
                        <div className="space-y-3">
                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4">
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={(event) => setIsFeatured(event.target.checked)}
                                    className="mt-0.5 h-4 w-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                />
                                <span>
                                    <span className="block text-sm font-medium">Featured</span>
                                    <span className="mt-1 block text-xs text-muted-foreground">
                                        Highlight this product in the catalog.
                                    </span>
                                </span>
                            </label>
                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4">
                                <input
                                    type="checkbox"
                                    checked={isUpcoming}
                                    onChange={(event) => setIsUpcoming(event.target.checked)}
                                    className="mt-0.5 h-4 w-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                />
                                <span>
                                    <span className="block text-sm font-medium">Upcoming</span>
                                    <span className="mt-1 block text-xs text-muted-foreground">
                                        Mark this product as coming soon.
                                    </span>
                                </span>
                            </label>
                        </div>
                    </div>
                </section>

                {submitError && (
                    <p
                        role="alert"
                        className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
                    >
                        {submitError}
                    </p>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                    <Link
                        to="/products"
                        className={`${secondaryButtonClass} min-h-11 px-5`}
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitDisabled}
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
                        {isSaving
                            ? isEditing
                                ? "Saving changes…"
                                : "Creating product…"
                            : isEditing
                                ? "Save changes"
                                : "Create product"}
                    </button>
                </div>
            </form>
        </main>
    );
}

export default CreateProduct;
