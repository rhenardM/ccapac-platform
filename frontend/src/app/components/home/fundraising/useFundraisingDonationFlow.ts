"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createFundraisingDonation,
  verifyFundraisingDonation,
} from "./api";
import { MOBILE_MONEY_REVIEW_DELAY_MS } from "./constants";
import { formatMoney } from "./formatters";
import type { StripeEmbeddedCheckout } from "../StripeEmbeddedCheckoutDialog";
import type {
  CampaignResponse,
  CreatedDonation,
  FundraisingErrors,
  PaymentMethod,
  Step,
} from "./types";

export function useFundraisingDonationFlow(
  campaignData: CampaignResponse | null
) {
  const [step, setStep] = useState<Step>("identity");
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [errors, setErrors] = useState<FundraisingErrors>({});
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [isVerifyingDonation, setIsVerifyingDonation] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [mobileDonation, setMobileDonation] = useState<CreatedDonation | null>(
    null
  );
  const [mobileWaitStartedAt, setMobileWaitStartedAt] = useState<number | null>(
    null
  );
  const [mobileAttemptTimedOut, setMobileAttemptTimedOut] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [stripeCheckout, setStripeCheckout] =
    useState<StripeEmbeddedCheckout | null>(null);
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const amountActionRef = useRef<HTMLDivElement | null>(null);
  const fullNameInputRef = useRef<HTMLInputElement | null>(null);

  const tiers = useMemo(() => campaignData?.tiers || [], [campaignData?.tiers]);
  const currency = campaignData?.campaign.currency || "USD";
  const selectedTier = tiers.find((tier) => tier.id === selectedTierId);
  const minimumAmount = Math.max(
    tiers.length ? Math.min(...tiers.map((tier) => tier.min_amount)) : 0
  );
  const campaignIsActive = campaignData?.campaign.status === "active";

  const selectedAmount = useMemo(() => {
    if (useCustomAmount) {
      return Number(customAmount) || 0;
    }

    return selectedTier?.min_amount || minimumAmount;
  }, [customAmount, minimumAmount, selectedTier?.min_amount, useCustomAmount]);

  const selectedLabel = useCustomAmount
    ? "Montant libre"
    : selectedTier?.name || "Contribution";

  const progressPercent = Math.min(
    Math.max(campaignData?.stats.progress_percent || 0, 0),
    100
  );

  useEffect(() => {
    setSelectedTierId(campaignData?.tiers.at(-1)?.id || null);
  }, [campaignData?.tiers]);

  const updateError = (field: string) => {
    setErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors;

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const clearStepFeedback = () => {
    setErrors({});
    setCheckoutError("");
  };

  const clearCheckoutError = () => {
    setCheckoutError("");
  };

  const resetMobileMoneyAttempt = () => {
    setMobileDonation(null);
    setMobileWaitStartedAt(null);
    setMobileAttemptTimedOut(false);
    setIsMobileModalOpen(false);
  };

  const retryMobileMoneyPayment = () => {
    resetMobileMoneyAttempt();
    setPaymentMethod("mobile_money");
    setStep("payment");
    setCheckoutError("");

    window.requestAnimationFrame(() => {
      document
        .getElementById("mobile-money-phone")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("mobile-money-phone")?.focus();
    });
  };

  const scrollToAmountAction = () => {
    window.requestAnimationFrame(() => {
      amountActionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const goBackToAmount = () => {
    clearStepFeedback();
    setStep("amount");
  };

  const goBackToIdentity = () => {
    clearStepFeedback();
    setStep("identity");
  };

  useEffect(() => {
    if (step !== "identity") return;

    window.requestAnimationFrame(() => {
      fullNameInputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      fullNameInputRef.current?.focus({ preventScroll: true });
    });
  }, [step]);

  const goToAmount = () => {
    const nextErrors: FundraisingErrors = {};
    setCheckoutError("");

    if (!fullName.trim()) {
      nextErrors.fullName = "Le nom du donateur ou de l'organisation est requis.";
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = "Veuillez renseigner une adresse e-mail valide.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setStep("amount");
  };

  const goToPayment = () => {
    setCheckoutError("");

    if (!campaignIsActive) {
      setErrors({
        amount: "Les contributions en ligne ne sont pas ouvertes pour le moment.",
      });
      return;
    }

    if (selectedAmount < minimumAmount) {
      setErrors({
        amount: `Le montant minimum est de ${formatMoney(
          minimumAmount,
          currency
        )}.`,
      });
      return;
    }

    setErrors({});
    setStep("payment");
  };

  const createCheckout = async () => {
    setCheckoutError("");

    if (paymentMethod === "mobile_money" && !mobileMoneyPhone.trim()) {
      setCheckoutError(
        "Indiquez le numéro Mobile Money qui recevra la demande de paiement."
      );
      return;
    }

    setIsCreatingCheckout(true);

    try {
      const data = await createFundraisingDonation({
        amount: selectedAmount,
        paymentMethod,
        donor: {
          name: fullName,
          email,
          phone:
            paymentMethod === "mobile_money"
              ? mobileMoneyPhone
              : phone || undefined,
        },
      });

      if (paymentMethod === "mobile_money") {
        setMobileDonation({
          donation_id: data.donation_id,
          status: data.status,
          provider_instructions: data.provider_instructions,
          pawapay: data.pawapay,
        });
        setMobileWaitStartedAt(Date.now());
        setMobileAttemptTimedOut(false);
        setIsMobileModalOpen(true);
        setIsCreatingCheckout(false);
        return;
      }

      sessionStorage.setItem("ccapac.last_donation_id", data.donation_id);

      if (paymentMethod === "card" && data.stripe) {
        setStripeCheckout({
          donationId: data.donation_id,
          publishableKey: data.stripe.publishable_key,
          clientSecret: data.stripe.client_secret,
        });
        setIsStripeModalOpen(true);
        setIsCreatingCheckout(false);
        return;
      }

      if (data.checkout_url) {
        window.location.assign(data.checkout_url);
      }
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Le paiement ne peut pas être démarré pour le moment."
      );
      setIsCreatingCheckout(false);
    }
  };

  const withDonationVerification = useCallback(
    async (action: () => Promise<void>) => {
      setIsVerifyingDonation(true);
      setCheckoutError("");

      try {
        await action();
      } catch (error) {
        setCheckoutError(
          error instanceof Error
            ? error.message
            : "Nous ne pouvons pas confirmer le paiement pour le moment."
        );
      } finally {
        setIsVerifyingDonation(false);
      }
    },
    []
  );

  const verifyMobileDonation = useCallback(
    (donationId: string) =>
      withDonationVerification(async () => {
        const data = await verifyFundraisingDonation(donationId);

        setMobileDonation((current) =>
          current
            ? {
                ...current,
                status: data.status,
                provider_instructions:
                  data.provider_instructions || current.provider_instructions,
                pawapay: data.pawapay || current.pawapay,
              }
            : current
        );
      }),
    [withDonationVerification]
  );

  useEffect(() => {
    if (!mobileDonation || mobileDonation.status !== "pending") return;

    const interval = window.setInterval(() => {
      verifyMobileDonation(mobileDonation.donation_id);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [mobileDonation, verifyMobileDonation]);

  useEffect(() => {
    if (
      !isMobileModalOpen ||
      mobileDonation?.status !== "pending" ||
      !mobileWaitStartedAt
    ) {
      setMobileAttemptTimedOut(false);
      return;
    }

    const elapsed = Date.now() - mobileWaitStartedAt;
    const remaining = MOBILE_MONEY_REVIEW_DELAY_MS - elapsed;

    if (remaining <= 0) {
      setMobileAttemptTimedOut(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setMobileAttemptTimedOut(true);
    }, remaining);

    return () => window.clearTimeout(timeout);
  }, [isMobileModalOpen, mobileDonation?.status, mobileWaitStartedAt]);

  useEffect(() => {
    if (mobileDonation?.status !== "succeeded") return;

    const timeout = window.setTimeout(() => {
      window.location.assign(
        `/don-merci?donation_id=${encodeURIComponent(
          mobileDonation.donation_id
        )}`
      );
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [mobileDonation]);

  return {
    amountActionRef,
    campaignIsActive,
    checkoutError,
    clearCheckoutError,
    clearStepFeedback,
    createCheckout,
    currency,
    customAmount,
    email,
    errors,
    fullName,
    fullNameInputRef,
    goBackToAmount,
    goBackToIdentity,
    goToAmount,
    goToPayment,
    isCreatingCheckout,
    isMobileModalOpen,
    isStripeModalOpen,
    isVerifyingDonation,
    minimumAmount,
    mobileAttemptTimedOut,
    mobileDonation,
    mobileMoneyPhone,
    paymentMethod,
    phone,
    progressPercent,
    resetMobileMoneyAttempt,
    retryMobileMoneyPayment,
    scrollToAmountAction,
    selectedAmount,
    selectedLabel,
    selectedTierId,
    setCustomAmount,
    setEmail,
    setFullName,
    setIsMobileModalOpen,
    setIsStripeModalOpen,
    setMobileMoneyPhone,
    setPaymentMethod,
    setPhone,
    setSelectedTierId,
    setUseCustomAmount,
    step,
    stripeCheckout,
    tiers,
    updateError,
    useCustomAmount,
    verifyMobileDonation,
  };
}
