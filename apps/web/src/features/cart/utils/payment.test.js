import { describe, expect, it } from "vitest";
import {
  digitsOnly,
  detectCardBrand,
  formatCardNumber,
  getPaymentErrors,
  isValidCardNumber,
  isValidCvv,
} from "./payment";

const validForm = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@sutore.test",
  phone: "+1 (555) 555-1212",
  addressLine1: "123 Binary Street",
  city: "Istanbul",
  stateRegion: "Marmara",
  postalCode: "34000",
  country: "Turkey",
  cardName: "Ada Lovelace",
  cardNumber: "4111 1111 1111 1111",
  expiry: "12/99",
  cvv: "123",
  acceptTerms: true,
};

describe("payment utilities", () => {
  it("accepts a complete valid checkout form", () => {
    expect(isValidCardNumber(validForm.cardNumber)).toBe(true);
    expect(getPaymentErrors(validForm, true)).toEqual({});
  });

  it("reports validation errors for empty or malformed payment details", () => {
    const errors = getPaymentErrors(
      {
        ...validForm,
        firstName: " ",
        email: "not-an-email",
        phone: "12",
        cardNumber: "4111",
        expiry: "01/20",
        cvv: "1",
        acceptTerms: false,
      },
      false,
    );

    expect(errors.cart).toBe("Your cart is empty.");
    expect(errors.firstName).toBe("Enter the billing first name.");
    expect(errors.email).toBe("Enter a valid email address.");
    expect(errors.phone).toBe("Enter a valid phone number.");
    expect(errors.cardNumber).toBe("Enter a valid supported card number.");
    expect(errors.expiry).toBe("Enter a valid future expiry date.");
    expect(errors.cvv).toBe("Enter a valid 3-digit security code.");
    expect(errors.acceptTerms).toBe("Confirm the billing details and terms to continue.");
  });

  it("requires a four-digit CVV for American Express cards", () => {
    const amex = "378282246310005";

    expect(digitsOnly("3782 822463 10005")).toBe(amex);
    expect(isValidCvv("1234", amex)).toBe(true);
    expect(isValidCvv("123", amex)).toBe(false);
  });

  it("detects and formats Mastercard numbers", () => {
    const cardNumber = "5555555555554444";

    expect(detectCardBrand(cardNumber)?.label).toBe("Mastercard");
    expect(formatCardNumber(cardNumber)).toBe("5555 5555 5555 4444");
    expect(isValidCardNumber(cardNumber)).toBe(true);
  });
});
