import { useState } from "react";
import { CheckCircle2, CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { CheckoutField } from "../components/CheckoutField";
import { OrderSummaryPanel } from "../components/OrderSummaryPanel";
import { StorefrontPageShell } from "../components/StorefrontPageShell";
import { formatCurrency } from "../data/cartStorage";
import { writeOrderConfirmation } from "../data/orderConfirmationStorage";
import { useCart } from "../hooks/useCart";
import {
  detectCardBrand,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  getPaymentErrors,
} from "../utils/payment";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateRegion: "",
  postalCode: "",
  country: "United States",
  cardName: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
  acceptTerms: false,
};

const REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "addressLine1",
  "city",
  "stateRegion",
  "postalCode",
  "country",
  "cardName",
  "cardNumber",
  "expiry",
  "cvv",
  "acceptTerms",
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, summary } = useCart();
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [submitState, setSubmitState] = useState({
    kind: "idle",
    message: "",
  });

  const hasItems = items.length > 0;
  const errors = getPaymentErrors(form, hasItems);
  const cardBrand = detectCardBrand(form.cardNumber);
  const visibleErrors = submitState.kind === "error" ? errors : touched;

  function getFieldError(field) {
    return visibleErrors[field] ? errors[field] : "";
  }

  function handleChange(field) {
    return (event) => {
      const isCheckbox = event.target.type === "checkbox";
      let nextValue = isCheckbox ? event.target.checked : event.target.value;

      if (field === "cardNumber") {
        nextValue = formatCardNumber(nextValue);
      }

      if (field === "expiry") {
        nextValue = formatExpiry(nextValue, form.expiry);
      }

      if (field === "cvv") {
        const maxLength = cardBrand?.id === "amex" ? 4 : 3;
        nextValue = digitsOnly(nextValue).slice(0, maxLength);
      }

      setForm((current) => ({ ...current, [field]: nextValue }));
      setSubmitState({ kind: "idle", message: "" });
    };
  }

  function handleBlur(field) {
    return () => {
      setTouched((current) => ({ ...current, [field]: true }));
    };
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = getPaymentErrors(form, hasItems);
    if (Object.keys(nextErrors).length > 0) {
      setTouched(
        REQUIRED_FIELDS.reduce((accumulator, field) => ({ ...accumulator, [field]: true }), {}),
      );
      setSubmitState({
        kind: "error",
        message: hasItems
          ? "Please correct the highlighted billing or payment details."
          : "Add products to your cart before continuing to payment.",
      });
      return;
    }

    writeOrderConfirmation({ form, items, summary });
    navigate("/checkout/success");
  }

  return (
    <StorefrontPageShell
      currentStep="checkout"
      description="Enter billing and payment details with the same secure, polished flow shoppers expect from a production checkout."
      eyebrow="Payment"
      title="Billing and card details for a secure checkout."
    >
      {hasItems ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
          <form id="checkout-form" className="space-y-6" onSubmit={handleSubmit}>
            <section className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_20px_60px_rgba(7,17,31,0.1)]">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-400/15 text-brand-accent">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                    Billing contact
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-brand-ink">
                    Who should receive the order updates?
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <CheckoutField
                  autoComplete="given-name"
                  error={getFieldError("firstName")}
                  id="checkout-first-name"
                  label="First name"
                  onBlur={handleBlur("firstName")}
                  onChange={handleChange("firstName")}
                  value={form.firstName}
                />
                <CheckoutField
                  autoComplete="family-name"
                  error={getFieldError("lastName")}
                  id="checkout-last-name"
                  label="Last name"
                  onBlur={handleBlur("lastName")}
                  onChange={handleChange("lastName")}
                  value={form.lastName}
                />
                <CheckoutField
                  autoComplete="email"
                  error={getFieldError("email")}
                  id="checkout-email"
                  label="Email address"
                  onBlur={handleBlur("email")}
                  onChange={handleChange("email")}
                  type="email"
                  value={form.email}
                />
                <CheckoutField
                  autoComplete="tel"
                  error={getFieldError("phone")}
                  id="checkout-phone"
                  label="Phone number"
                  onBlur={handleBlur("phone")}
                  onChange={handleChange("phone")}
                  type="tel"
                  value={form.phone}
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_20px_60px_rgba(7,17,31,0.1)]">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-gold/15 text-amber-700">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                    Billing address
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-brand-ink">
                    Use the address tied to your payment method.
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <CheckoutField
                    autoComplete="address-line1"
                    error={getFieldError("addressLine1")}
                    id="checkout-address-1"
                    label="Street address"
                    onBlur={handleBlur("addressLine1")}
                    onChange={handleChange("addressLine1")}
                    value={form.addressLine1}
                  />
                </div>
                <div className="sm:col-span-2">
                  <CheckoutField
                    autoComplete="address-line2"
                    hint="Apartment, suite, or company name if needed."
                    id="checkout-address-2"
                    label="Address line 2"
                    onChange={handleChange("addressLine2")}
                    value={form.addressLine2}
                  />
                </div>
                <CheckoutField
                  autoComplete="address-level2"
                  error={getFieldError("city")}
                  id="checkout-city"
                  label="City"
                  onBlur={handleBlur("city")}
                  onChange={handleChange("city")}
                  value={form.city}
                />
                <CheckoutField
                  autoComplete="address-level1"
                  error={getFieldError("stateRegion")}
                  id="checkout-state"
                  label="State / Province / Region"
                  onBlur={handleBlur("stateRegion")}
                  onChange={handleChange("stateRegion")}
                  value={form.stateRegion}
                />
                <CheckoutField
                  autoComplete="postal-code"
                  error={getFieldError("postalCode")}
                  id="checkout-postal"
                  label="Postal code"
                  onBlur={handleBlur("postalCode")}
                  onChange={handleChange("postalCode")}
                  value={form.postalCode}
                />
                <CheckoutField
                  as="select"
                  autoComplete="country-name"
                  error={getFieldError("country")}
                  id="checkout-country"
                  label="Country / Region"
                  onBlur={handleBlur("country")}
                  onChange={handleChange("country")}
                  value={form.country}
                >
                  <option value="United States">United States</option>
                  <option value="Turkey">Turkey</option>
                  <option value="Germany">Germany</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                </CheckoutField>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_20px_60px_rgba(7,17,31,0.1)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-700">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                      Payment method
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-brand-ink">
                      Card details
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["Visa", "Mastercard", "American Express", "Discover"].map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#082f49)] p-5 text-white shadow-[0_18px_50px_rgba(7,17,31,0.18)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/75">
                      Secure card entry
                    </p>
                    <p className="mt-3 text-xl font-semibold">
                      {form.cardName.trim() || "Cardholder name"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                    {cardBrand?.label ?? "Card"}
                  </span>
                </div>
                <p className="mt-10 text-2xl font-semibold tracking-[0.18em] text-white/95">
                  {form.cardNumber || "•••• •••• •••• ••••"}
                </p>
                <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
                  <span>{form.expiry || "MM/YY"}</span>
                  <span>{form.cvv ? "CVV entered" : "Security code"}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <CheckoutField
                    autoComplete="cc-name"
                    error={getFieldError("cardName")}
                    id="checkout-card-name"
                    label="Name on card"
                    onBlur={handleBlur("cardName")}
                    onChange={handleChange("cardName")}
                    value={form.cardName}
                  />
                </div>
                <div className="sm:col-span-2">
                  <CheckoutField
                    autoComplete="cc-number"
                    error={getFieldError("cardNumber")}
                    hint="We support Visa, Mastercard, American Express, and Discover."
                    id="checkout-card-number"
                    inputMode="numeric"
                    label="Card number"
                    maxLength={23}
                    onBlur={handleBlur("cardNumber")}
                    onChange={handleChange("cardNumber")}
                    value={form.cardNumber}
                  />
                </div>
                <CheckoutField
                  autoComplete="cc-exp"
                  error={getFieldError("expiry")}
                  id="checkout-expiry"
                  inputMode="numeric"
                  label="Expiry date"
                  maxLength={5}
                  onBlur={handleBlur("expiry")}
                  onChange={handleChange("expiry")}
                  placeholder="MM/YY"
                  value={form.expiry}
                />
                <CheckoutField
                  autoComplete="cc-csc"
                  error={getFieldError("cvv")}
                  hint={cardBrand?.id === "amex" ? "American Express uses 4 digits." : "3 digits on the back of the card."}
                  id="checkout-cvv"
                  inputMode="numeric"
                  label="CVV"
                  maxLength={cardBrand?.id === "amex" ? 4 : 3}
                  onBlur={handleBlur("cvv")}
                  onChange={handleChange("cvv")}
                  placeholder={cardBrand?.id === "amex" ? "1234" : "123"}
                  value={form.cvv}
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_20px_60px_rgba(7,17,31,0.1)]">
              <label className="flex items-start gap-3">
                <input
                  checked={form.acceptTerms}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-accent"
                  onBlur={handleBlur("acceptTerms")}
                  onChange={handleChange("acceptTerms")}
                  type="checkbox"
                />
                <span className="text-sm leading-7 text-slate-600">
                  I confirm the billing details match this payment method and I agree to
                  SUtore&apos;s terms of sale, return policy, and secure checkout handling.
                </span>
              </label>
              {getFieldError("acceptTerms") ? (
                <p className="mt-2 text-xs font-medium text-rose-700">
                  {getFieldError("acceptTerms")}
                </p>
              ) : null}

              {submitState.message ? (
                <div
                  className={`mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                    submitState.kind === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-rose-200 bg-rose-50 text-rose-900"
                  }`}
                  role="status"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{submitState.message}</p>
                </div>
              ) : null}
            </section>
          </form>

          <OrderSummaryPanel
            items={items}
            note={`You will be charged ${formatCurrency(summary.total)} once live payment processing is connected to this checkout flow.`}
            summary={summary}
            title="Payment summary"
            action={
              <Button
                className="w-full gap-2 bg-brand-ink text-white hover:bg-slate-900"
                form="checkout-form"
                type="submit"
              >
                Review payment details
              </Button>
            }
          />
        </div>
      ) : (
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/88 px-6 py-10 text-center shadow-[0_20px_60px_rgba(7,17,31,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
            No products selected
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-brand-ink">
            Add items to your cart before payment.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Checkout becomes available once products have been added to your cart from
            the storefront.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/cart"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-slate-300"
            >
              Return to cart
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-glow"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      )}
    </StorefrontPageShell>
  );
}
