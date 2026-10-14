"use client";

import { useEffect, useState } from "react";
import { fetchFundraisingCampaign } from "./api";
import type { CampaignResponse } from "./types";

const CAMPAIGN_UNAVAILABLE_MESSAGE =
  "La collecte ne peut pas être affichée pour le moment.";

export function useFundraisingCampaign() {
  const [campaignData, setCampaignData] = useState<CampaignResponse | null>(
    null
  );
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(true);
  const [campaignError, setCampaignError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCampaign() {
      try {
        const data = await fetchFundraisingCampaign();

        if (!ignore) {
          setCampaignData(data);
        }
      } catch (error) {
        if (!ignore) {
          setCampaignError(
            error instanceof Error
              ? error.message
              : CAMPAIGN_UNAVAILABLE_MESSAGE
          );
        }
      } finally {
        if (!ignore) {
          setIsLoadingCampaign(false);
        }
      }
    }

    loadCampaign();

    return () => {
      ignore = true;
    };
  }, []);

  return {
    campaignData,
    campaignError,
    isLoadingCampaign,
  };
}
