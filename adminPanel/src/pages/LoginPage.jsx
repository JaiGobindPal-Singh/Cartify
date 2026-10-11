import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { loginUser } from "../services/user.service.js";
import { generateNotification } from "../utils/notification.utils.js";

export default function LoginPage() {
    const navigate = useNavigate();
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const normalizedPhone = phone.trim();
        if (!/^\d{10}$/.test(normalizedPhone)) {
            setError("Enter a valid 10-digit phone number.");
            return;
        }
        if (password.trim().length < 8) {
            setError("Your password must be at least 8 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            await loginUser(normalizedPhone, "", password);
            generateNotification("Welcome back")();
            navigate("/");
        } catch {
            setError("We couldn't sign you in. Check your details and try again.");
            setPassword("");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background-main px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-32 -top-36 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute -bottom-48 -right-28 h-[30rem] w-[30rem] rounded-full bg-slate-600/20 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_0.7px,transparent_0.7px)] [background-size:24px_24px] opacity-[0.07]" />
            </div>

            <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-800 shadow-2xl shadow-black/25 lg:min-h-[610px] lg:grid-cols-[1fr_0.9fr]">
                <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-800 p-10 text-slate-100 lg:flex xl:p-14">
                    <div aria-hidden="true" className="absolute inset-0">
                        <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full border border-slate-300/10" />
                        <div className="absolute -right-16 -top-12 h-56 w-56 rounded-full border border-slate-300/10" />
                        <div className="absolute -bottom-36 -left-20 h-96 w-96 rounded-full bg-slate-300/5" />
                        <div className="absolute bottom-20 right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                    </div>

                    <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/25 text-indigo-200 ring-1 ring-indigo-200/20">
                            <ShieldCheck aria-hidden="true" size={23} />
                        </div>
                        <span className="text-lg font-semibold tracking-tight">GRD AMRITSAR</span>
                    </div>

                    <div className="relative max-w-md">
                        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">Admin workspace</p>
                        <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
                            Everything your store needs, in one place.
                        </h1>
                        <p className="mt-5 max-w-sm text-base leading-7 text-slate-300">
                            Sign in to manage your products, categories, and the day-to-day of your business.
                        </p>
                    </div>

                    <p className="relative text-sm text-slate-400">A simpler way to run your store.</p>
                </div>

                <div className="flex items-center justify-center bg-slate-800/90 p-6 sm:p-10 lg:p-12 xl:p-16">
                    <div className="w-full max-w-sm">
                        <div className="mb-9 lg:hidden">
                            <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-indigo-300 ring-1 ring-primary/30">
                                <ShieldCheck aria-hidden="true" size={24} />
                            </div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">Cartify admin</p>
                        </div>

                        <div className="mb-8">
                            <p className="mb-2 text-sm font-semibold text-indigo-300">Welcome back</p>
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-100">Sign in to your account</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-400">Enter your admin credentials to continue.</p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                            <div>
                                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-300">
                                    Phone number
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={phone}
                                    onChange={(event) => {
                                        setError("");
                                        setPhone(event.target.value);
                                    }}
                                    placeholder="10-digit phone number"
                                    className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 hover:border-slate-500 focus:border-indigo-400 focus:ring-4 focus:ring-primary/20"
                                    aria-invalid={Boolean(error)}
                                    required
                                />
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                        Password
                                    </label>
                                </div>
                                <div className="relative">
                                    <LockKeyhole aria-hidden="true" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(event) => {
                                            setError("");
                                            setPassword(event.target.value);
                                        }}
                                        placeholder="Enter your password"
                                        className="w-full rounded-xl border border-slate-600 bg-slate-700/50 py-3 pl-11 pr-12 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 hover:border-slate-500 focus:border-indigo-400 focus:ring-4 focus:ring-primary/20"
                                        aria-invalid={Boolean(error)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((visible) => !visible)}
                                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-600 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <p role="alert" className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isSubmitting ? "Signing in..." : "Sign in"}
                                {!isSubmitting && <ArrowRight aria-hidden="true" size={18} className="transition-transform group-hover:translate-x-1" />}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-xs leading-5 text-slate-500">
                            Authorized administrators only. Your account is protected.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
