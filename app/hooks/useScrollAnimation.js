// app/hooks/useScrollAnimation.js
'use client';
import { useEffect, useRef, useState } from 'react';

export function useScrollAnimation(options = {}) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    const {
        threshold = 0.1,
        rootMargin = '0px',
        triggerOnce = true,
    } = options;

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold, rootMargin, triggerOnce]);

    return { ref, isVisible };
}

// Component wrapper for scroll animations
export function ScrollReveal({ children, animation = 'fade-up', delay = 0, className = '' }) {
    const { ref, isVisible } = useScrollAnimation();

    const animations = {
        'fade-up': 'translate-y-8 opacity-0',
        'fade-down': '-translate-y-8 opacity-0',
        'fade-left': 'translate-x-8 opacity-0',
        'fade-right': '-translate-x-8 opacity-0',
        'zoom-in': 'scale-95 opacity-0',
        'zoom-out': 'scale-105 opacity-0',
    };

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${className} ${isVisible ? 'translate-y-0 translate-x-0 scale-100 opacity-100' : animations[animation]
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

export default useScrollAnimation;
