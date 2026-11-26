import { useEffect, useRef } from "react";

interface UseModalCloseOptions {
  isOpen: boolean;
  onClose: () => void;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  lockScroll?: boolean;
}

export function useModalClose({
  isOpen,
  onClose,
  closeOnEsc = true,
  closeOnOutsideClick = true,
  lockScroll = true,
}: UseModalCloseOptions) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        closeOnOutsideClick &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    if (lockScroll) {
      document.body.style.overflow = "hidden";
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      if (lockScroll) {
        document.body.style.overflow = prevOverflow;
      }
    };
  }, [isOpen, onClose, closeOnEsc, closeOnOutsideClick, lockScroll]);

  return modalRef;
}
