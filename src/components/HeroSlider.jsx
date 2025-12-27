import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const images = [
    '/assets/image1.jpg',
    '/assets/image2.png',
    '/assets/image3.png',
];

const extendedImages = [...images, images[0]];

const HeroSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const timeoutRef = useRef(null);

    const nextSlide = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setIsTransitioning(true);
        setCurrentIndex((prev) => {
            if (prev >= images.length) return prev;
            return prev + 1;
        });
        setTimeout(() => setIsAnimating(false), 700);
    }, [isAnimating]);

    const prevSlide = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setIsTransitioning(true);
        setCurrentIndex((prev) => {
            if (prev === 0) {
                setIsTransitioning(false);
                setTimeout(() => setIsAnimating(false), 100);
                return images.length - 1;
            }
            setTimeout(() => setIsAnimating(false), 700);
            return prev - 1;
        });
    }, [isAnimating]);

    const goToSlide = useCallback((index) => {
        if (isAnimating) return;
        setIsAnimating(true);
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsAnimating(false), 700);
    }, [isAnimating]);

    useEffect(() => {
        if (currentIndex === images.length) {
            timeoutRef.current = setTimeout(() => {
                setIsTransitioning(false);
                setCurrentIndex(0);
            }, 700);
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentIndex]);

    useEffect(() => {
        if (!isTransitioning) {
            const timeout = setTimeout(() => {
                setIsTransitioning(true);
            }, 50);
            return () => clearTimeout(timeout);
        }
    }, [isTransitioning]);

    useEffect(() => {
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [nextSlide]);

    const leftIndex = currentIndex % images.length;

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="relative w-full overflow-hidden rounded-xl h-[330px] md:h-[380px] lg:h-[430px]">
                {/* Inner slider */}
                <div
                    className={`absolute inset-0 flex gap-4 ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
                    style={{
                        width: `${extendedImages.length * 50}%`,
                        transform: `translateX(-${(currentIndex * 100) / extendedImages.length}%)`
                    }}
                >
                    {extendedImages.map((src, index) => (
                        <div
                            key={index}
                            className="h-full overflow-hidden rounded-xl shadow-lg"
                            style={{ width: `${100 / extendedImages.length}%` }}
                        >
                            <img
                                src={src}
                                alt={`Slide ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 z-10"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 z-10"
                    aria-label="Next slide"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>

            </div>

            {/* Dots Indicator - Outside */}
            <div className="flex justify-center gap-2 mt-4">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${leftIndex === index
                            ? 'bg-primary scale-110'
                            : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSlider;
