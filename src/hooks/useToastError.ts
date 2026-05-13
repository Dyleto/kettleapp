import { useEffect } from "react";
import { toaster } from "@/components/ui/toaster";
import { getErrorMessage } from "@/utils/errorMessages";

export const useToastError = (
  error: Error | null | undefined,
  title: string,
) => {
  useEffect(() => {
    if (error) {
      toaster.create({
        title,
        description: getErrorMessage(error, title),
        type: "error",
      });
    }
  }, [error]);
};
