import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for mobile touch interactions
 * Provides swipe, pull-to-refresh, and touch feedback functionality
 */

export const useMobileTouch = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
      setIsTouch(isTouchDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, isTouch };
};

/**
 * Hook for swipe gestures
 */
export const useSwipeGesture = (onSwipeLeft, onSwipeRight, threshold = 50) => {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isSwiping) return;
    
    currentX.current = e.touches[0].clientX;
    const distance = currentX.current - startX.current;
    setSwipeDistance(distance);

    // Add visual feedback
    if (elementRef.current) {
      elementRef.current.style.transform = `translateX(${Math.max(-100, Math.min(100, distance * 0.5))}px)`;
      elementRef.current.classList.add('swiping');
    }
  }, [isSwiping]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping) return;

    const distance = currentX.current - startX.current;
    const absDistance = Math.abs(distance);

    if (absDistance > threshold) {
      if (distance > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (distance < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Reset
    setIsSwiping(false);
    setSwipeDistance(0);
    
    if (elementRef.current) {
      elementRef.current.style.transform = '';
      elementRef.current.classList.remove('swiping');
    }
  }, [isSwiping, threshold, onSwipeLeft, onSwipeRight]);

  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return { swipeHandlers, isSwiping, swipeDistance, elementRef };
};

/**
 * Hook for pull-to-refresh functionality
 */
export const usePullToRefresh = (onRefresh, threshold = 80) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === 0) return;
    if (containerRef.current && containerRef.current.scrollTop > 0) {
      startY.current = 0;
      return;
    }

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    if (distance > 0) {
      e.preventDefault();
      setIsPulling(true);
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  }, [threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
        }, 1000);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
    startY.current = 0;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const pullHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    pullHandlers,
    isPulling,
    pullDistance,
    isRefreshing,
    containerRef,
    showIndicator: pullDistance > 20
  };
};

/**
 * Hook for touch feedback (haptic feedback where supported)
 */
export const useTouchFeedback = () => {
  const triggerHaptic = useCallback((type = 'medium') => {
    if ('vibrate' in navigator) {
      // Vibration patterns for different feedback types
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 50, 10],
        error: [100, 50, 100],
        warning: [50, 20, 50]
      };
      
      navigator.vibrate(patterns[type] || patterns.medium);
    }
  }, []);

  const triggerImpactFeedback = useCallback((style = 'medium') => {
    // For iOS devices with haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      triggerHaptic(style);
    }
  }, [triggerHaptic]);

  return { triggerHaptic, triggerImpactFeedback };
};

/**
 * Hook for mobile keyboard handling
 */
export const useMobileKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      if (heightDifference > 150) { // Keyboard is likely open
        setIsKeyboardOpen(true);
        setKeyboardHeight(heightDifference);
        document.body.style.paddingBottom = `${heightDifference}px`;
      } else {
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
        document.body.style.paddingBottom = '';
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      window.addEventListener('resize', handleViewportChange);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
      document.body.style.paddingBottom = '';
    };
  }, []);

  return { keyboardHeight, isKeyboardOpen };
};

/**
 * Hook for mobile scroll behavior
 */
export const useMobileScroll = () => {
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [isScrolling, setIsScrolling] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setScrollY(currentScrollY);
      setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
      setIsScrolling(true);
      
      lastScrollY.current = currentScrollY;

      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Set scrolling to false after scroll ends
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return { scrollY, scrollDirection, isScrolling };
};

/**
 * Hook for device orientation
 */
export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState('portrait');
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const handleOrientationChange = () => {
      setAngle(window.screen.orientation?.angle || window.orientation || 0);
      
      if (window.innerHeight > window.innerWidth) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    handleOrientationChange();
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return { orientation, angle, isPortrait: orientation === 'portrait', isLandscape: orientation === 'landscape' };
};

/**
 * Main hook that combines all mobile touch functionality
 */
export const useMobileTouchOptimization = () => {
  const { isMobile, isTouch } = useMobileTouch();
  const { triggerHaptic, triggerImpactFeedback } = useTouchFeedback();
  const { keyboardHeight, isKeyboardOpen } = useMobileKeyboard();
  const { scrollY, scrollDirection, isScrolling } = useMobileScroll();
  const { orientation, isPortrait, isLandscape } = useDeviceOrientation();

  // Add mobile-specific classes to body
  useEffect(() => {
    const bodyClasses = [];
    
    if (isMobile) bodyClasses.push('is-mobile');
    if (isTouch) bodyClasses.push('is-touch');
    if (isKeyboardOpen) bodyClasses.push('keyboard-open');
    if (isScrolling) bodyClasses.push('is-scrolling');
    
    bodyClasses.push(`orientation-${orientation}`);

    document.body.className = document.body.className.replace(
      /\b(is-mobile|is-touch|keyboard-open|is-scrolling|orientation-\w+)\b/g, 
      ''
    ).trim();
    
    if (bodyClasses.length > 0) {
      document.body.classList.add(...bodyClasses);
    }

    return () => {
      document.body.classList.remove(...bodyClasses);
    };
  }, [isMobile, isTouch, isKeyboardOpen, isScrolling, orientation]);

  return {
    isMobile,
    isTouch,
    triggerHaptic,
    triggerImpactFeedback,
    keyboardHeight,
    isKeyboardOpen,
    scrollY,
    scrollDirection,
    isScrolling,
    orientation,
    isPortrait,
    isLandscape
  };
};