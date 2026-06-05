import type { Variants, Transition } from "framer-motion"

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
}

export const slideUp: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: "auto", opacity: 1 },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
}

export const cardHover = {
  rest: { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
}

export const shimmerVariants: Variants = {
  initial: { backgroundPosition: "-200% 0" },
  animate: {
    backgroundPosition: "200% 0",
    transition: { repeat: Infinity, duration: 1.5, ease: "linear" },
  },
}

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: "easeIn" },
  },
}

export const bellBounce: Variants = {
  rest: { rotate: 0 },
  animate: {
    rotate: [0, -15, 15, -10, 10, -5, 5, 0],
    transition: { duration: 0.6, ease: "easeInOut" },
  },
}

export const heartBeat: Variants = {
  rest: { scale: 1 },
  animate: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.4, ease: "easeInOut" },
  },
}

export const defaultTransition: Transition = {
  duration: 0.3,
  ease: "easeOut",
}
