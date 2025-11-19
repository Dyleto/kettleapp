import { useEffect } from "react";
import { toaster } from "./ui/toaster";
import eventEmitter from "@/utils/eventEmitter";

export const ErrorHandler = () => {
  useEffect(() => {
    const unsubscribe = eventEmitter.on("error", (error: any) => {
      toaster.create({
        title: error.title,
        description: error.message,
        type: "error",
        duration: 5000,
      });
    });

    return unsubscribe;
  }, []);

  return null;
};
