import { useEffect } from 'react';
import { toaster } from '@/shared/components/ui/toasterInstance';
import eventEmitter from '@/shared/utils/eventEmitter';

interface ErrorEventPayload {
  title: string;
  message: string;
}

export const ErrorHandler = () => {
  useEffect(() => {
    const unsubscribe = eventEmitter.on('error', (data) => {
      const error = data as ErrorEventPayload;
      toaster.create({
        title: error.title,
        description: error.message,
        type: 'error',
        duration: 5000,
      });
    });

    return unsubscribe;
  }, []);

  return null;
};
