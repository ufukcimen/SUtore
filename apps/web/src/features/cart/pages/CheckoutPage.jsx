import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CreditCard, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { CheckoutField } from "../components/CheckoutField";
import { OrderSummaryPanel } from "../components/OrderSummaryPanel";
import { StorefrontPageShell } from "../components/StorefrontPageShell";
import { writeOrderConfirmation } from "../data/orderConfirmationStorage";
import { useCart } from "../hooks/useCart";
import { http } from "../../../lib/http";
import { useStoredUser } from "../../../lib/useStoredUser";
import {
  detectCardBrand,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  getPaymentErrors,
} from "../utils/payment";

const CHECKOUT_STEPS = ["Cart", "Details", "Payment", "Review"];

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

const FIELD_IDS = {
  firstName: "checkout-first-name",
  lastName: "checkout-last-name",
  email: "checkout-email",
  phone: "checkout-phone",
  addressLine1: "checkout-address-1",
  city: "checkout-city",
  stateRegion: "checkout-state",
  postalCode: "checkout-postal",
  country: "checkout-country",
  cardName: "checkout-card-name",
  cardNumber: "checkout-card-number",
  expiry: "checkout-expiry",
  cvv: "checkout-cvv",
  acceptTerms: "checkout-terms",
};

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item?.msg).filter(Boolean).join(" ");
  }

  return fallback;
}

function focusInvalidField(field) {
  if (typeof document === "undefined") {
    return;
  }

  const elementId = FIELD_IDS[field];
  if (!elementId) {
    return;
  }

  const element = document.getElementById(elementId);
  if (!element) {
    return;
  }

  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  if (typeof element.focus === "function") {
    element.focus({ preventScroll: true });
  }
}

function describeStockChange(change) {
  if (change.type === "removed") {
    return change.reason === "out_of_stock"
      ? `${change.name} is now out of stock and was removed from your cart.`
      : `${change.name} is no longer available and was removed from your cart.`;
  }
  if (change.type === "quantity_reduced") {
    return `${change.name} quantity was reduced from ${change.previousQuantity} to ${change.nextQuantity} to match current stock.`;
  }
  return `${change.name} availability was updated.`;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const user = useStoredUser();
  const {
    items,
    summary,
    clearCart,
    refreshStock,
    stockChanges,
    dismissStockChanges,
  } = useCart();
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [submitState, setSubmitState] = useState({
    kind: "idle",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasItems = items.length > 0;
  const errors = getPaymentErrors(form, hasItems);
  const cardBrand = detectCardBrand(form.cardNumber);
  const visibleErrors = submitState.kind === "error" ? errors : touched;

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" }, replace: true });
      return;
    }

    const nameParts = user.name?.trim().split(/\s+/).filter(Boolean) ?? [];
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ");

    setForm((current) => ({
      ...current,
      firstName: current.firstName || firstName,
      lastName: current.lastName || lastName,
      email: current.email || user.email || "",
    }));
  }, [user, navigate]);

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

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = getPaymentErrors(form, hasItems);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalidField = REQUIRED_FIELDS.find((field) => nextErrors[field]);
      setTouched(
        REQUIRED_FIELDS.reduce((accumulator, field) => ({ ...accumulator, [field]: true }), {}),
      );
      setSubmitState({
        kind: "error",
        message: hasItems
          ? (firstInvalidField ? nextErrors[firstInvalidField] : "Please correct the highlighted billing or payment details.")
          : "Add products to your cart before continuing to payment.",
      });
      if (firstInvalidField) {
        focusInvalidField(firstInvalidField);
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitState({ kind: "idle", message: "" });

    try {
      const { changes } = await refreshStock();
      if (changes.length > 0) {
        setIsSubmitting(false);
        setSubmitState({
          kind: "error",
          message:
            "Stock changed for one or more items. Please review the updated cart before placing the order.",
        });
        return;
      }

      const response = await http.post("/orders", {
        user_id: user?.user_id ?? null,
        items: items.map((item) => ({
          product_id: Number(item.productId),
          quantity: item.quantity,
        })),
        billing_name: `${form.firstName} ${form.lastName}`.trim(),
        billing_email: form.email.trim(),
        billing_phone: form.phone.trim(),
        billing_address: [
          form.addressLine1,
          form.addressLine2,
          `${form.city}, ${form.stateRegion} ${form.postalCode}`.trim(),
          form.country,
        ]
          .filter(Boolean)
          .join(", "),
        payment_brand: cardBrand?.label ?? "Card",
        payment_last4: digitsOnly(form.cardNumber).slice(-4),
      });

      writeOrderConfirmation(response.data);
      clearCart();
      navigate("/checkout/success");
    } catch (error) {
      setSubmitState({
        kind: "error",
        message: getErrorMessage(
          error,
          "We could not confirm the order right now. Please try again.",
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <StorefrontPageShell
      currentStep="checkout"
      description="Complete contact, billing, and card details before the final order review."
      eyebrow="Payment"
      title="Secure checkout."
    >
      {stockChanges.length > 0 ? (
        <div
          className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">Cart updated to match current stock</p>
            <ul className="list-disc space-y-1 pl-5">
              {stockChanges.map((change, index) => (
                <li key={`${change.type}-${change.name}-${index}`}>
                  {describeStockChange(change)}
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={dismissStockChanges}
            className="rounded-full p-1 text-amber-700 transition hover:bg-amber-100"
            aria-label="Dismiss stock update notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {hasItems ? (
        <>
          <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-4">
              {CHECKOUT_STEPS.map((step, index) => {
                const isComplete = index === 0;
                const isCurrent = index === 1 || index === 2;

                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2.5 ${
                      isComplete
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : isCurrent
                          ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        isComplete
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                            ? "bg-cyan-600 text-white"
                            : "bg-white text-slate-500"
                      }`}
                    >
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </span>
                    <span className="text-sm font-semibold">{step}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" />
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-950">Encrypted card entry.</span>{" "}
                  Payment details are validated before order creation.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-950">Warranty preserved.</span>{" "}
                  Coverage follows every eligible product into checkout.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-950">Review before charge.</span>{" "}
                  You place the order only after the form passes validation.
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <form id="checkout-form" className="space-y-6" onSubmit={handleSubmit}>
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                    Billing contact
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
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

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                    Billing address
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
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

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                      Payment method
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
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

              <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-5 text-white shadow-sm">
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
                <p className="mt-10 break-all text-xl font-semibold tracking-[0.12em] text-white/95 sm:text-2xl sm:tracking-[0.18em]">
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

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <label className="flex items-start gap-3">
                <input
                  checked={form.acceptTerms}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600"
                  id="checkout-terms"
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
                  className={`mt-6 flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${
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
            note={`Submitting this checkout records the order, assigns an order number, and reserves the requested inventory in the catalog.`}
            summary={summary}
            title="Payment summary"
            action={
              <Button
                disabled={isSubmitting}
                className="w-full gap-2 bg-slate-950 text-white hover:bg-slate-800"
                form="checkout-form"
                type="submit"
              >
                {isSubmitting ? "Placing order..." : "Place order"}
              </Button>
            }
          />
          </div>
        </>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
            No products selected
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950">
            Add items to your cart before payment.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Checkout becomes available once products have been added to your cart from
            the storefront.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/cart"
              className="inline-flex items-center justify-center rounded-md bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-300"
            >
              Return to cart
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      )}
    </StorefrontPageShell>
  );
}
