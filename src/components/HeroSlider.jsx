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
    const timeoutRef = useRef(null);

    const nextSlide = useCallback(() => {
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
    }, []);

    const prevSlide = useCallback(() => {
        setIsTransitioning(true);
        setCurrentIndex((prev) => {
            if (prev === 0) {
                setIsTransitioning(false);
                return images.length - 1;
            }
            return prev - 1;
        });
    }, []);

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
            <div className="relative w-full overflow-hidden rounded-xl h-[280px] md:h-[320px] lg:h-[380px]">
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

                {/* Dots Indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setIsTransitioning(true);
                                setCurrentIndex(index);
                            }}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${leftIndex === index
                                ? 'bg-white scale-110'
                                : 'bg-white/50 hover:bg-white/70'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HeroSlider;
