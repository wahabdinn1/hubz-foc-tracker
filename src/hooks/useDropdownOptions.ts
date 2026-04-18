"use client";

import { useState, useEffect } from "react";
import { getDropdownOptions } from "@/app/actions/settings";
import type { DropdownOption } from "@/db/schema";

export function useDropdownOptions(category: string) {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchOptions() {
      setIsLoading(true);
      try {
        const data = await getDropdownOptions(category);
        if (isMounted) {
          // Filter to only include active options for the forms
          const activeOptions = data.filter(opt => opt.isActive);
          // Sort options: "Other" should always be last
          activeOptions.sort((a, b) => {
            const isAOther = a.value.trim().toLowerCase() === "other";
            const isBOther = b.value.trim().toLowerCase() === "other";
            if (isAOther && !isBOther) return 1;
            if (!isAOther && isBOther) return -1;
            return 0;
          });
          setOptions(activeOptions);
        }
      } catch (error) {
        console.error(`Failed to fetch options for ${category}:`, error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchOptions();

    return () => {
      isMounted = false;
    };
  }, [category]);

  return { options, isLoading };
}
