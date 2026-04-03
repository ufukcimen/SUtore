const CARD_BRANDS = [
  {
    id: "visa",
    label: "Visa",
    pattern: /^4/,
    lengths: [13, 16, 19],
    cvvLengths: [3],
  },
  {
    id: "mastercard",
    label: "Mastercard",
    pattern: /^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/,
    lengths: [16],
    cvvLengths: [3],
  },
  {
    id: "amex",
    label: "American Express",
    pattern: /^3[47]/,
    lengths: [15],
    cvvLengths: [4],
  },
  {
    id: "discover",
    label: "Discover",
    pattern: /^(6011|65|64[4-9])/,
    lengths: [16, 19],
    cvvLengths: [3],
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function digitsOnly(value) {
  return value.replace(/\D/g, "");
}

export function detectCardBrand(value) {
  const digits = digitsOnly(value);
  return CARD_BRANDS.find((brand) => brand.pattern.test(digits)) ?? null;
}

export function formatCardNumber(value) {
  const digits = digitsOnly(value).slice(0, 19);
  const brand = detectCardBrand(digits);

  if (brand?.id === "amex") {
    const groups = [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)];
    return groups.filter(Boolean).join(" ");
  }

  return digits.match(/.{1,4}/g)?.join(" ") ?? digits;
}

export function formatExpiry(value, previousValue = "") {
  const digits = digitsOnly(value).slice(0, 4);
  const previousDigits = digitsOnly(previousValue).slice(0, 4);

  if (digits.length < 2) {
    return digits;
  }

  if (digits.length === 2) {
    const typedSecondDigit = previousDigits.length < digits.length && !value.includes("/");
    return typedSecondDigit ? `${digits}/` : digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function isValidCardNumber(value) {
  const digits = digitsOnly(value);
  const brand = detectCardBrand(digits);

  if (!brand || !brand.lengths.includes(digits.length)) {
    return false;
  }

  let checksum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    checksum += digit;
    shouldDouble = !shouldDouble;
  }

  return checksum % 10 === 0;
}

export function isValidExpiry(value) {
  const digits = digitsOnly(value);
  if (digits.length !== 4) {
    return false;
  }

  const month = Number(digits.slice(0, 2));
  const year = Number(digits.slice(2));
  if (month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) {
    return false;
  }

  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return true;
}

export function isValidCvv(value, cardNumber) {
  const digits = digitsOnly(value);
  const brand = detectCardBrand(cardNumber);
  const allowedLengths = brand?.cvvLengths ?? [3, 4];
  return allowedLengths.includes(digits.length);
}

export function getPaymentErrors(form, hasItems) {
  const errors = {};
  const cardBrand = detectCardBrand(form.cardNumber);
  const phoneDigits = digitsOnly(form.phone);

  if (!hasItems) {
    errors.cart = "Your cart is empty.";
  }

  if (!form.firstName.trim()) {
    errors.firstName = "Enter the billing first name.";
  }

  if (!form.lastName.trim()) {
    errors.lastName = "Enter the billing last name.";
  }

  if (!form.email.trim() || !EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (phoneDigits.length < 7) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!form.addressLine1.trim()) {
    errors.addressLine1 = "Enter the billing street address.";
  }

  if (!form.city.trim()) {
    errors.city = "Enter the billing city.";
  }

  if (!form.stateRegion.trim()) {
    errors.stateRegion = "Enter the state, province, or region.";
  }

  if (!form.postalCode.trim()) {
    errors.postalCode = "Enter the postal code.";
  }

  if (!form.country.trim()) {
    errors.country = "Select the billing country.";
  }

  if (!form.cardName.trim()) {
    errors.cardName = "Enter the name shown on the card.";
  }

  if (!cardBrand || !isValidCardNumber(form.cardNumber)) {
    errors.cardNumber = "Enter a valid supported card number.";
  }

  if (!isValidExpiry(form.expiry)) {
    errors.expiry = "Enter a valid future expiry date.";
  }

  if (!isValidCvv(form.cvv, form.cardNumber)) {
    errors.cvv = cardBrand?.id === "amex" ? "Enter a 4-digit security code." : "Enter a valid 3-digit security code.";
  }

  if (!form.acceptTerms) {
    errors.acceptTerms = "Confirm the billing details and terms to continue.";
  }

  return errors;
}
