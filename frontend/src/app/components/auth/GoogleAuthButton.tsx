"use client";

import Script from "next/script";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GoogleButtonOptions = {
  type: "standard";
  theme: "outline";
  size: "large";
  text: "continue_with";
  shape: "rectangular";
  logo_alignment: "left";
  width: number;
  locale: "fr";
};

type GoogleAccountsId = {
  initialize: (options: {
    client_id: string;
    callback: (
      response: GoogleCredentialResponse
    ) => void;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: GoogleButtonOptions
  ) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

type GoogleAuthButtonProps = {
  onCredential: (
    credential: string
  ) => Promise<void> | void;
  disabled?: boolean;
};

export default function GoogleAuthButton({
  onCredential,
  disabled = false,
}: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const credentialHandlerRef = useRef(onCredential);
  const [scriptReady, setScriptReady] =
    useState(false);
  const [scriptError, setScriptError] =
    useState(false);

  const clientId = String(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
  ).trim();

  useEffect(() => {
    credentialHandlerRef.current = onCredential;
  }, [onCredential]);

  const renderGoogleButton = useCallback(() => {
    const googleId = window.google?.accounts.id;
    const container = containerRef.current;
    const button = buttonRef.current;

    if (
      !scriptReady ||
      !clientId ||
      !googleId ||
      !container ||
      !button
    ) {
      return;
    }

    const width = Math.max(
      240,
      Math.min(
        Math.floor(container.clientWidth),
        400
      )
    );

    googleId.initialize({
      client_id: clientId,
      cancel_on_tap_outside: true,
      callback: (response) => {
        const credential = String(
          response.credential || ""
        ).trim();

        if (credential) {
          void credentialHandlerRef.current(
            credential
          );
        }
      },
    });

    button.innerHTML = "";

    googleId.renderButton(button, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width,
      locale: "fr",
    });
  }, [clientId, scriptReady]);

  useEffect(() => {
    renderGoogleButton();

    const container = containerRef.current;

    if (!container || !scriptReady) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      renderGoogleButton();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [renderGoogleButton, scriptReady]);

  if (!clientId) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-800">
        Connexion Google non configurée : ajoutez
        NEXT_PUBLIC_GOOGLE_CLIENT_ID.
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptError(false);
          setScriptReady(true);
        }}
        onError={() => {
          setScriptError(true);
          setScriptReady(false);
        }}
      />

      <div
        ref={containerRef}
        className={`flex min-h-11 w-full justify-center ${
          disabled
            ? "pointer-events-none opacity-60"
            : ""
        }`}
        aria-disabled={disabled}
      >
        {scriptError ? (
          <div className="w-full rounded-md border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
            Impossible de charger la connexion Google.
          </div>
        ) : (
          <div ref={buttonRef} />
        )}
      </div>
    </>
  );
}
