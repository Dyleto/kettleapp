import { Box } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";

const MotionBox = motion(Box);

interface SlidePanelProps {
  children: ReactNode | ((handleClose: () => void) => ReactNode);
  onClose?: () => void;
}

export const SlidePanel = ({ children, onClose }: SlidePanelProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        navigate(-1);
      }
    }, 200);
  };

  return (
    <AnimatePresence>
      <MotionBox
        initial={{ x: "100%" }}
        animate={{ x: isExiting ? window.innerWidth : 0 }}
        exit={{ x: "100%" }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        width="100%"
        bg="bg.canvas"
        zIndex={999}
        overflowY="auto"
      >
        {typeof children === "function" ? children(handleClose) : children}
      </MotionBox>
    </AnimatePresence>
  );
};
