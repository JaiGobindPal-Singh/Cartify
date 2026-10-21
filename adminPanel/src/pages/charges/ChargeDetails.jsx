import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    LoaderCircle,
    Plus,
    RefreshCw,
    Save,
    X,
} from "lucide-react";
import { fetchStoreConfig } from "../../services/storeConfig.service";
import {
    getChargeById,
    updateCharge,
} from "../../services/charges.service";
import { generateNotification } from "../../utils/notification.utils";

const inputClass =
    "mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";
const sectionClass = "rounded-2xl border border-border bg-card p-4 sm:p-6";
const labelClass = "text-sm font-medium text-foreground";

function emptyForm() {
    return {
        chargeName: "",
        isActive: true,
        chargeType: "FIXED",
        chargeAmount: "",
        policyType: "CONDITIONAL",
        matchStrategy: "ANY_CONDITION",
        postalCodes: [],
        countries: [],
        minOrderAmount: "",
        paymentOption: "",
        deliveryType: "",
        currency: "",
    };
}

function normalizeCharge(charge) {
    const conditions = charge?.chargeExemption?.conditions ?? {};
    const policyType = String(charge?.policyType ?? "CONDITIONAL").toUpperCase();

    return {
        chargeName: charge?.chargeName ?? "",
        isActive: Boolean(charge?.isActive),
        chargeType: charge?.chargeType ?? "FIXED",
        chargeAmount: charge?.chargeAmount ?? "",
        policyType: policyType === "ALWAYS_APPLY" ? "ALWAYS_APPLY" : "CONDITIONAL",
        matchStrategy:
            charge?.chargeExemption?.matchStrategy ?? "ANY_CONDITION",
        postalCodes: Array.isArray(conditions.postalCodes)
            ? conditions.postalCodes.map(String)
            : [],
        countries: Array.isArray(conditions.countries)
            ? conditions.countries.map(String)
            : [],
        minOrderAmount: conditions.minOrderAmount ?? "",
        paymentOption: conditions.paymentOption ?? "",
        deliveryType: conditions.deliveryType ?? "",
        currency:
            typeof conditions.currency === "string"
                ? conditions.currency.toUpperCase()
                : "",
    };
}

function BackLink() {
    return (
        <Link
            to="/charges"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to charges
        </Link>
    );
}

function SectionHeading({ title, description }) {
    return (
        <div className="mb-5 border-b border-border pb-4">
            <h2 className="text-base font-semibold">{title}</h2>
            {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
        </div>
    );
}

function TagInput({ label, values, onChange, placeholder, disabled }) {
    const [value, setValue] = useState("");

    const addValue = () => {
        const normalized = value.trim().toUpperCase();
        if (!normalized || values.includes(normalized)) return;
        onChange([...values, normalized]);
        setValue("");
    };

    return (
        <fieldset disabled={disabled}>
            <legend className={labelClass}>{label}</legend>
            <div className="mt-1.5 flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
                {values.map((item) => (
                    <span
                        key={item}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                    >
                        {item}
                        <button
                            type="button"
                            aria-label={`Remove ${item}`}
                            onClick={() => onChange(values.filter((value) => value !== item))}
                            className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <X aria-hidden="true" className="h-3 w-3" />
                        </button>
                    </span>
                ))}
                <input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            addValue();
                        }
                    }}
                    placeholder={values.length ? "Add another…" : placeholder}
                    className="h-8 min-w-32 flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    aria-label={`Add ${label.toLowerCase()}`}
                />
                <button
                    type="button"
                    onClick={addValue}
                    disabled={!value.trim()}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                    Add
                </button>
            </div>
        </fieldset>
    );
}

function ChargeDetails() {
    const { id } = useParams();
    const [form, setForm] = useState(emptyForm);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [chargeNotFound, setChargeNotFound] = useState(false);
    const [hasLoadedCharge, setHasLoadedCharge] = useState(false);
    const [loadKey, setLoadKey] = useState(0);
    const [supportedCurrencies, setSupportedCurrencies] = useState([]);
    const [currencyLoadError, setCurrencyLoadError] = useState(false);

    useEffect(() => {
        let isActive = true;

        const loadPage = async () => {
            setIsLoading(true);
            setError("");
            setChargeNotFound(false);
            setHasLoadedCharge(false);

            if (!id) {
                setChargeNotFound(true);
                setError("A charge ID is required.");
                setIsLoading(false);
                return;
            }

            try {
                const charge = await getChargeById(id);
                if (!isActive) return;
                if (!charge) {
                    setChargeNotFound(true);
                    setError("Charge could not be found.");
                } else {
                    setForm(normalizeCharge(charge));
                    setHasLoadedCharge(true);
                }
            } catch (loadError) {
                if (!isActive) return;
                const message =
                    loadError?.message || "Charge details could not be loaded.";
                setError(message);
                generateNotification(message)();
            } finally {
                if (isActive) setIsLoading(false);
            }

            try {
                const config = await fetchStoreConfig();
                if (!isActive) return;
                const currencies = Array.isArray(config?.supportedCurrencies)
                    ? config.supportedCurrencies
                        .filter((currency) => typeof currency === "string" && currency.trim())
                        .map((currency) => currency.trim().toUpperCase())
                    : [];
                setSupportedCurrencies([...new Set(currencies)]);
            } catch {
                if (isActive) setCurrencyLoadError(true);
            }
        };

        loadPage();
        return () => {
            isActive = false;
        };
    }, [id, loadKey]);

    const setField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSaving || !id) return;

        const chargeName = form.chargeName.trim();
        const amount = Number(form.chargeAmount);
        const minimum = form.minOrderAmount === "" ? undefined : Number(form.minOrderAmount);

        if (!chargeName) {
            setError("Charge name is required.");
            generateNotification("Charge name is required.")();
            return;
        }
        if (!["FIXED", "PERCENT"].includes(form.chargeType)) {
            setError("Select a valid charge type.");
            generateNotification("Select a valid charge type.")();
            return;
        }
        if (
            form.chargeAmount === "" ||
            !Number.isFinite(amount) ||
            amount < 0 ||
            (form.chargeType === "PERCENT" && amount > 99)
        ) {
            const message =
                form.chargeType === "PERCENT" && amount > 99
                    ? "Percentage charges cannot exceed 99%."
                    : "Charge amount must be a valid number greater than or equal to 0.";
            setError(message);
            generateNotification(message)();
            return;
        }
        if (!["ALWAYS_APPLY", "CONDITIONAL"].includes(form.policyType)) {
            setError("Select a valid policy type.");
            generateNotification("Select a valid policy type.")();
            return;
        }
        if (
            form.minOrderAmount !== "" &&
            (!Number.isFinite(minimum) || minimum < 0)
        ) {
            setError("Minimum order amount must be 0 or greater.");
            generateNotification("Minimum order amount must be 0 or greater.")();
            return;
        }

        if (form.policyType !== "CONDITIONAL") {
            const message =
                "The existing charge update service only supports conditional policies. This charge was not updated.";
            setError(message);
            generateNotification(message)();
            return;
        }
        if (form.paymentOption) {
            const message =
                "The existing charge update service does not support saving a payment option. Clear this field before updating.";
            setError(message);
            generateNotification(message)();
            return;
        }
        if (minimum === 0) {
            const message =
                "The existing charge update service omits a minimum order amount of 0. Use a positive amount or leave it blank.";
            setError(message);
            generateNotification(message)();
            return;
        }
        if (!["ALL_CONDITIONS", "ANY_CONDITION"].includes(form.matchStrategy)) {
            setError("Select a valid match strategy.");
            generateNotification("Select a valid match strategy.")();
            return;
        }

        setIsSaving(true);
        setError("");
        try {
            await updateCharge(
                id,
                form.isActive,
                {
                    chargeName,
                    chargeType: form.chargeType,
                    chargeAmount: amount,
                    matchStrategy: form.matchStrategy,
                },
                {
                    postalCodes: form.postalCodes.map((value) => value.trim().toUpperCase()),
                    countries: form.countries.map((value) => value.trim().toUpperCase()),
                    minOrderAmount: minimum,
                    deliveryType: form.deliveryType.trim().toUpperCase(),
                    currency: form.currency.trim().toUpperCase(),
                },
            );
            const charge = await getChargeById(id);
            if (!charge) throw new Error("The updated charge could not be reloaded.");
            setForm(normalizeCharge(charge));
            generateNotification("Charge updated successfully.")();
        } catch (saveError) {
            const message = saveError?.message || "Charge could not be updated.";
            setError(message);
            generateNotification(message)();
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <main className="mx-auto flex min-h-96 max-w-375 items-center justify-center px-4 text-muted-foreground">
                <LoaderCircle aria-hidden="true" className="mr-2 h-5 w-5 animate-spin" />
                Loading charge details…
            </main>
        );
    }

    if (chargeNotFound || !hasLoadedCharge) {
        return (
            <main className="mx-auto w-full max-w-7xl px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
                <BackLink />
                <p
                    role="alert"
                    className="mt-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"
                >
                    {error || "Charge could not be found."}
                </p>
                {!chargeNotFound && id && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsLoading(true);
                            setLoadKey((key) => key + 1);
                        }}
                        className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <RefreshCw aria-hidden="true" className="h-4 w-4" />
                        Try again
                    </button>
                )}
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-5xl px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
            <BackLink />

            <header className="mb-6 mt-4 border-b border-border pb-5">
                <p className="text-sm font-medium text-primary">Charges</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {form.chargeName || "Charge details"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Review and update this charge and its conditions.
                </p>
            </header>

            {error && (
                <p
                    role="alert"
                    className="mb-5 rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground"
                >
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <section className={sectionClass}>
                    <SectionHeading
                        title="Basic information"
                        description="Set the charge name, status, type, and amount."
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="sm:col-span-2">
                            <span className={labelClass}>Charge name</span>
                            <input
                                required
                                type="text"
                                value={form.chargeName}
                                onChange={(event) => setField("chargeName", event.target.value)}
                                className={inputClass}
                                placeholder="e.g. Shipping Charge"
                                maxLength={120}
                            />
                        </label>

                        <div className="sm:col-span-2">
                            <span className={labelClass}>Status</span>
                            <label className="mt-2 flex min-h-11 w-fit cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(event) => setField("isActive", event.target.checked)}
                                    className="h-4 w-4 accent-primary"
                                />
                                <span className="text-sm text-foreground">
                                    {form.isActive ? "Active" : "Inactive"}
                                </span>
                            </label>
                        </div>

                        <label>
                            <span className={labelClass}>Charge type</span>
                            <select
                                value={form.chargeType}
                                onChange={(event) => setField("chargeType", event.target.value)}
                                className={inputClass}
                            >
                                <option value="FIXED">Fixed amount</option>
                                <option value="PERCENT">Percentage</option>
                            </select>
                        </label>

                        <label>
                            <span className={labelClass}>Charge amount</span>
                            <input
                                required
                                type="number"
                                min="0"
                                max={form.chargeType === "PERCENT" ? "99" : undefined}
                                step="any"
                                value={form.chargeAmount}
                                onChange={(event) => setField("chargeAmount", event.target.value)}
                                className={inputClass}
                            />
                            {form.chargeType === "PERCENT" && (
                                <span className="mt-1 block text-xs text-muted-foreground">
                                    Percentage charges must be 99% or less.
                                </span>
                            )}
                        </label>
                    </div>
                </section>

                {/* policy is restricted on conditional so this section is commented */}
                {/* <section className={sectionClass}>
          <SectionHeading
            title="Policy"
            description="Choose when this charge should apply."
          />


          
          <label>
            <span className={labelClass}>Policy type</span>
            <select
              value={form.policyType}
              onChange={(event) => setField("policyType", event.target.value)}
              className={inputClass}
            >
              <option value="ALWAYS_APPLY">Always apply</option>
              <option value="CONDITIONAL">Conditional</option>
            </select>
          </label>
          {form.policyType === "ALWAYS_APPLY" && (
            <p className="mt-3 rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground">
              The current update service only saves conditional policies. This
              setting is editable but cannot be saved until the service supports
              always-apply policies.
            </p>
          )}
        </section> */}

                {form.policyType === "CONDITIONAL" && (
                    <section className={sectionClass}>
                        <SectionHeading
                            title="Charge exemption"
                            description="Define the conditions that determine when this charge is exempt."
                        />

                        <fieldset>
                            <legend className={labelClass}>Match conditions</legend>
                            <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                {[
                                    ["ALL_CONDITIONS", "All conditions"],
                                    ["ANY_CONDITION", "Any condition"],
                                ].map(([value, label]) => (
                                    <label
                                        key={value}
                                        className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 transition-colors ${form.matchStrategy === value
                                                ? "border-primary/60 bg-accent"
                                                : "border-border bg-background hover:bg-accent/50"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="matchStrategy"
                                            value={value}
                                            checked={form.matchStrategy === value}
                                            onChange={(event) => setField("matchStrategy", event.target.value)}
                                            className="h-4 w-4 accent-primary"
                                        />
                                        <span className="text-sm">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            <TagInput
                                label="Postal codes"
                                values={form.postalCodes}
                                onChange={(postalCodes) => setField("postalCodes", postalCodes)}
                                placeholder="Enter a postal code"
                                disabled={isSaving}
                            />
                            <TagInput
                                label="Countries"
                                values={form.countries}
                                onChange={(countries) => setField("countries", countries)}
                                placeholder="Enter a country code"
                                disabled={isSaving}
                            />

                            <label>
                                <span className={labelClass}>Minimum order amount</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.minOrderAmount}
                                    onChange={(event) => setField("minOrderAmount", event.target.value)}
                                    className={inputClass}
                                    placeholder="Optional"
                                />
                            </label>

                            {/* <label>
                <span className={labelClass}>Payment option</span>
                <select
                  value={form.paymentOption}
                  onChange={(event) => setField("paymentOption", event.target.value)}
                  className={inputClass}
                >
                  <option value="">Any payment option</option>
                  <option value="COD">Cash on delivery (COD)</option>
                  <option value="ONLINE">Online</option>
                </select>
                {form.paymentOption && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    The current update service cannot save payment options.
                  </span>
                )}
              </label> */}

                            <label>
                                <span className={labelClass}>Delivery type</span>
                                <input
                                    type="text"
                                    value={form.deliveryType}
                                    onChange={(event) => setField("deliveryType", event.target.value)}
                                    className={inputClass}
                                    placeholder="e.g. EXPRESS"
                                />
                            </label>

                            <label>
                                <span className={labelClass}>Currency</span>
                                {supportedCurrencies.length > 0 ? (
                                    <select
                                        value={form.currency}
                                        onChange={(event) =>
                                            setField("currency", event.target.value.toUpperCase())
                                        }
                                        className={inputClass}
                                    >
                                        <option value="">Any currency</option>
                                        {!supportedCurrencies.includes(form.currency.toUpperCase()) &&
                                            form.currency && (
                                                <option value={form.currency.toUpperCase()}>
                                                    {form.currency.toUpperCase()}
                                                </option>
                                            )}
                                        {supportedCurrencies.map((currency) => (
                                            <option key={currency} value={currency}>
                                                {currency}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={form.currency}
                                        onChange={(event) =>
                                            setField("currency", event.target.value.toUpperCase())
                                        }
                                        className={inputClass}
                                        placeholder="e.g. INR"
                                        maxLength={3}
                                    />
                                )}
                                {currencyLoadError && (
                                    <span className="mt-1 block text-xs text-muted-foreground">
                                        Supported currencies could not be loaded. Enter a currency code.
                                    </span>
                                )}
                            </label>
                        </div>
                    </section>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Link
                        to="/charges"
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-60"
                    >
                        {isSaving ? (
                            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save aria-hidden="true" className="h-4 w-4" />
                        )}
                        {isSaving ? "Updating…" : "Update charge"}
                    </button>
                </div>
            </form>
        </main>
    );
}

export default ChargeDetails;
