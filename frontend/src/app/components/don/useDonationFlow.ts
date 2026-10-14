"use client";

import { useMemo, useRef, useState } from "react";
import type { MakutaOperatorCode } from "@/lib/makuta";
import { campaignConfig } from "./config";
import { confirmDonationOtp, createDonation } from "./makuta-client";
import { formatMoney } from "./formatters";
import { findOperator, getCategory } from "./operators";
import type {
  CreatedDonation,
  DonorType,
  FundraisingErrors,
  PaymentCategory,
  Step,
} from "./types";

const THANK_YOU_PATH = "/faire-un-don/merci";
const LAST_TRANSACTION_KEY = "ccapac.last_transaction_id";
/** Préfixe des données « don en votre honneur » stockées par transaction. */
export const HONOR_KEY_PREFIX = "ccapac.honor.";
const phonePattern = /^\+243\d{9}$/;
const emailPattern = /\S+@\S+\.\S+/;

export function useDonationFlow() {
  const campaign = campaignConfig;
  const tiers = campaign.tiers;
  const currency = campaign.currency;

  const [step, setStep] = useState<Step>("identity");
  const [donorType, setDonorType] = useState<DonorType | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    tiers.at(-1)?.id ?? null
  );
  const [customAmount, setCustomAmount] = useState("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Bénéficiaire (uniquement si le don est « pour un proche » ou « une organisation »).
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryEmail, setBeneficiaryEmail] = useState("");
  const [beneficiaryMessage, setBeneficiaryMessage] = useState("");

  const [category, setCategory] = useState<PaymentCategory>("mobile_money");
  const [operatorCode, setOperatorCode] = useState<MakutaOperatorCode | null>(
    getCategory("mobile_money").operators[0]?.code ?? null
  );
  const [accountNumber, setAccountNumber] = useState("");

  const [errors, setErrors] = useState<FundraisingErrors>({});
  const [checkoutError, setCheckoutError] = useState("");
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const [otpDonation, setOtpDonation] = useState<CreatedDonation | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isConfirmingOtp, setIsConfirmingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");

  const fullNameInputRef = useRef<HTMLInputElement | null>(null);
  const beneficiaryNameInputRef = useRef<HTMLInputElement | null>(null);
  const amountActionRef = useRef<HTMLDivElement | null>(null);

  const selectedTier = tiers.find((tier) => tier.id === selectedTierId);
  const minimumAmount = tiers.length
    ? Math.min(...tiers.map((tier) => tier.minAmount))
    : 0;
  const activeCategory = getCategory(category);
  const activeOperator = findOperator(operatorCode);

  const selectedAmount = useMemo(() => {
    if (useCustomAmount) return Number(customAmount) || 0;
    return selectedTier?.minAmount || minimumAmount;
  }, [customAmount, minimumAmount, selectedTier?.minAmount, useCustomAmount]);

  const selectedLabel = useCustomAmount
    ? "Montant libre"
    : selectedTier?.name || "Contribution";

  const progressPercent = campaign.stats
    ? Math.min(Math.max(campaign.stats.progressPercent, 0), 100)
    : null;

  const updateError = (field: string) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const clearStepFeedback = () => {
    setErrors({});
    setCheckoutError("");
  };

  const clearCheckoutError = () => setCheckoutError("");

  const scrollToAmountAction = () => {
    window.requestAnimationFrame(() => {
      amountActionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const focusFullName = () => {
    window.requestAnimationFrame(() => {
      fullNameInputRef.current?.focus({ preventScroll: true });
    });
  };

  const focusBeneficiaryName = () => {
    window.requestAnimationFrame(() => {
      beneficiaryNameInputRef.current?.focus({ preventScroll: true });
    });
  };

  const goToIdentity = () => {
    clearStepFeedback();
    setStep("identity");
    focusFullName();
  };

  const goToAudience = () => {
    clearStepFeedback();
    setStep("audience");
  };

  const goToBeneficiary = () => {
    clearStepFeedback();
    setStep("beneficiary");
    focusBeneficiaryName();
  };

  /** Étape 1 : valide l'identité du donateur puis passe au choix « pour qui ». */
  const submitIdentity = () => {
    const nextErrors: FundraisingErrors = {};
    setCheckoutError("");

    if (!fullName.trim()) {
      nextErrors.fullName = "Votre nom complet est requis.";
    }

    if (!email.trim() || !emailPattern.test(email)) {
      nextErrors.email = "Veuillez renseigner une adresse e-mail valide.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setStep("audience");
  };

  /**
   * Choix « pour qui » : pour soi-même on va directement au montant, sinon on
   * collecte d'abord les coordonnées du bénéficiaire.
   */
  const selectDonorType = (type: DonorType) => {
    setDonorType(type);
    clearStepFeedback();

    if (type === "self") {
      setStep("amount");
      return;
    }

    setStep("beneficiary");
    focusBeneficiaryName();
  };

  /** Valide les coordonnées du bénéficiaire (proche / organisation). */
  const submitBeneficiary = () => {
    const nextErrors: FundraisingErrors = {};
    setCheckoutError("");

    if (!beneficiaryName.trim()) {
      nextErrors.beneficiaryName =
        donorType === "organization"
          ? "Le nom de l'organisation bénéficiaire est requis."
          : "Le nom du proche est requis.";
    }

    if (!beneficiaryEmail.trim() || !emailPattern.test(beneficiaryEmail)) {
      nextErrors.beneficiaryEmail =
        "Veuillez renseigner une adresse e-mail valide.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setStep("amount");
  };

  /** Retour depuis l'étape Montant vers l'étape de profil précédente. */
  const goBackFromAmount = () => {
    clearStepFeedback();
    setStep(donorType && donorType !== "self" ? "beneficiary" : "audience");
  };

  const goBackToAmount = () => {
    clearStepFeedback();
    setStep("amount");
  };

  const goToPayment = () => {
    setCheckoutError("");

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

  const selectCategory = (next: PaymentCategory) => {
    setCategory(next);
    setOperatorCode(getCategory(next).operators[0]?.code ?? null);
    setAccountNumber("");
    clearCheckoutError();
    updateError("accountNumber");
  };

  const selectOperator = (code: MakutaOperatorCode) => {
    setOperatorCode(code);
    clearCheckoutError();
  };

  const redirectToThankYou = (transactionId: string) => {
    window.location.assign(
      `${THANK_YOU_PATH}?transaction_id=${encodeURIComponent(transactionId)}`
    );
  };

  const validatePaymentInputs = () => {
    if (!operatorCode) {
      setCheckoutError("Veuillez choisir un opérateur de paiement.");
      return false;
    }

    // Carte (Visa CNP) : les coordonnées sont saisies sur la page sécurisée de
    // Makuta après redirection — aucun numéro n'est collecté ici.
    if (activeOperator?.redirect) {
      setErrors({});
      return true;
    }

    const normalizedAccount = accountNumber.replace(/[\s-]/g, "");

    if (!normalizedAccount) {
      setErrors({ accountNumber: `${activeCategory.accountLabel} est requis.` });
      return false;
    }

    if (category === "mobile_money" && !phonePattern.test(normalizedAccount)) {
      setErrors({
        accountNumber:
          "Entrez un numéro valide au format +243 suivi de 9 chiffres.",
      });
      return false;
    }

    setErrors({});
    return true;
  };

  const createCheckout = async () => {
    setCheckoutError("");

    if (!validatePaymentInputs() || !operatorCode) return;

    setIsCreatingCheckout(true);

    try {
      const donation = await createDonation({
        amount: selectedAmount,
        operator: operatorCode,
        accountNumber: accountNumber.replace(/[\s-]/g, ""),
        donor: { name: fullName, email, phone },
        donorType: donorType ?? "self",
        beneficiary:
          donorType && donorType !== "self"
            ? {
                name: beneficiaryName.trim(),
                email: beneficiaryEmail.trim(),
                message: beneficiaryMessage.trim(),
              }
            : undefined,
      });

      try {
        sessionStorage.setItem(LAST_TRANSACTION_KEY, donation.transactionId);

        // Don « pour un proche / une organisation » : on conserve les infos du
        // bénéficiaire pour envoyer l'e-mail « en votre honneur » une fois le
        // paiement confirmé (déclenché depuis la page de remerciement).
        if (
          donorType &&
          donorType !== "self" &&
          beneficiaryEmail.trim()
        ) {
          sessionStorage.setItem(
            `${HONOR_KEY_PREFIX}${donation.transactionId}`,
            JSON.stringify({
              beneficiaryName: beneficiaryName.trim(),
              beneficiaryEmail: beneficiaryEmail.trim(),
              beneficiaryMessage: beneficiaryMessage.trim(),
              donorName: fullName.trim(),
              donorType,
              amount: selectedAmount,
              currency,
            })
          );
        }
      } catch {
        // sessionStorage indisponible : la référence reste dans l'URL.
      }

      if (donation.requiresOtp) {
        setOtpDonation(donation);
        setOtpError("");
        setIsOtpModalOpen(true);
        setIsCreatingCheckout(false);
        return;
      }

      if (donation.redirectUrl) {
        window.location.assign(donation.redirectUrl);
        return;
      }

      // Mobile Money / virement : la confirmation est suivie sur la page de
      // remerciement (qui interroge le statut jusqu'à confirmation).
      redirectToThankYou(donation.transactionId);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Le paiement ne peut pas être démarré pour le moment."
      );
      setIsCreatingCheckout(false);
    }
  };

  const submitOtp = async (otpCode: string) => {
    if (!otpDonation) return;

    setIsConfirmingOtp(true);
    setOtpError("");

    try {
      const result = await confirmDonationOtp(otpDonation.transactionId, otpCode);

      if (result.status === "succeeded" || result.status === "pending") {
        redirectToThankYou(otpDonation.transactionId);
        return;
      }

      setOtpError("Le paiement n'a pas pu être confirmé. Réessayez.");
    } catch (error) {
      setOtpError(
        error instanceof Error
          ? error.message
          : "Le code de confirmation n'a pas pu être validé."
      );
    } finally {
      setIsConfirmingOtp(false);
    }
  };

  const closeOtpModal = () => {
    setIsOtpModalOpen(false);
    setOtpDonation(null);
    setOtpError("");
    setIsCreatingCheckout(false);
  };

  return {
    // campagne
    campaign,
    tiers,
    currency,
    minimumAmount,
    progressPercent,
    // étape
    step,
    // profil « pour qui »
    donorType,
    selectDonorType,
    // montant
    selectedTierId,
    setSelectedTierId,
    customAmount,
    setCustomAmount,
    useCustomAmount,
    setUseCustomAmount,
    selectedAmount,
    selectedLabel,
    // identité
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    fullNameInputRef,
    amountActionRef,
    // bénéficiaire
    beneficiaryName,
    setBeneficiaryName,
    beneficiaryEmail,
    setBeneficiaryEmail,
    beneficiaryMessage,
    setBeneficiaryMessage,
    beneficiaryNameInputRef,
    // paiement
    category,
    selectCategory,
    operatorCode,
    selectOperator,
    activeCategory,
    activeOperator,
    accountNumber,
    setAccountNumber,
    // navigation
    goToIdentity,
    goToAudience,
    goToBeneficiary,
    submitIdentity,
    submitBeneficiary,
    goBackFromAmount,
    goBackToAmount,
    goToPayment,
    scrollToAmountAction,
    // soumission
    createCheckout,
    isCreatingCheckout,
    // OTP
    otpDonation,
    isOtpModalOpen,
    isConfirmingOtp,
    otpError,
    submitOtp,
    closeOtpModal,
    // feedback
    errors,
    checkoutError,
    updateError,
    clearStepFeedback,
    clearCheckoutError,
  };
}
