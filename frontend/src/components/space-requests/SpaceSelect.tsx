"use client";

import {
  CCAPAC_SPACES,
} from "@/constants/spaces";

type SpaceSelectProps = {
  value: number;
  onChange: (spaceId: number) => void;
  disabled?: boolean;
  unavailableSpaceIds?: number[];
};

export default function SpaceSelect({
  value,
  onChange,
  disabled = false,
  unavailableSpaceIds = [],
}: SpaceSelectProps) {
  const unavailableIds = new Set(
    unavailableSpaceIds.map(Number)
  );

  const availableSpaces = CCAPAC_SPACES.filter(
    (space) => !unavailableIds.has(Number(space.id))
  );

  return (
    <div className="space-y-2">
      <label
        htmlFor="space"
        className="text-sm font-semibold text-[#5C4033]"
      >
        Espace souhaité *
      </label>

      <select
        id="space"
        name="space"
        value={value || ""}
        disabled={disabled}
        required
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        className="h-10 w-full rounded-md border border-[#D1965B]/30 bg-white px-3 text-sm text-[#5C4033] outline-none transition focus:border-[#D1965B] focus:ring-2 focus:ring-[#D1965B]/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">
          Sélectionnez un espace
        </option>

        {availableSpaces.map((space) => (
          <option
            key={space.id}
            value={space.id}
          >
            {space.name} — {space.capacityLabel}
          </option>
        ))}
      </select>

      {unavailableIds.size > 0 && (
        <p className="text-xs leading-5 text-amber-700">
          {unavailableIds.size} espace
          {unavailableIds.size > 1 ? "s sont" : " est"}{" "}
          déjà réservé
          {unavailableIds.size > 1 ? "s" : ""} pour cette date et{" "}
          {unavailableIds.size > 1
            ? "n’apparaissent"
            : "n’apparaît"}{" "}
          donc pas dans la liste.
        </p>
      )}

      {availableSpaces.length === 0 && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          Tous les espaces sont occupés pour cette date.
          Veuillez choisir une autre date.
        </p>
      )}
    </div>
  );
}