import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export const StaggerContainer = ({ 
  children, 
  className = "", 
  delay = 0.1,
  duration = 0.4 
}: StaggerContainerProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ 
  children, 
  className = "",
  duration = 0.4 
}: { 
  children: ReactNode; 
  className?: string;
  duration?: number;
}) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration
      }
    }
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};
