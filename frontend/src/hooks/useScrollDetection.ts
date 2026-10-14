import { useState, useEffect } from "react";

interface UseScrollDetectionOptions {
  threshold?: number;
}

export function useScrollDetection(
  options: UseScrollDetectionOptions = {}
): boolean {
  const { threshold = 10 } = options;
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return isScrolled;
}
