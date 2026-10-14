import { useState, useCallback } from "react";

export function useDropdown() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const openDropdown = useCallback((id: string) => {
    setActiveDropdown(id);
  }, []);

  const closeDropdown = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  const closeDropdownDelayed = useCallback(() => {
    setTimeout(() => setActiveDropdown(null), 200);
  }, []);

  const isDropdownOpen = useCallback(
    (id: string) => activeDropdown === id,
    [activeDropdown]
  );

  return {
    activeDropdown,
    openDropdown,
    closeDropdown,
    closeDropdownDelayed,
    isDropdownOpen,
  };
}
