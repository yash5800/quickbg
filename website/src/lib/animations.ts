import { Variants } from "framer-motion";

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

// Staggered children variants
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Fade in variants
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// Scale variants
export const scaleVariants: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

// Button hover variants
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

// Loader variants
export const loaderVariants: Variants = {
  rotate: {
    rotate: 0,
  },
  animate: {
    rotate: 360,
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Progress bar variants
export const progressVariants: Variants = {
  initial: { width: "0%" },
  animate: { width: "100%", transition: { duration: 1.5, ease: "easeOut" } },
};

// Toast variants
export const toastVariants: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.3 } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.2 } },
};