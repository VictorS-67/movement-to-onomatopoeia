// Carousel management service using SwiperJS
class CarouselManager {
    constructor() {
        this.swiper = null;
        this.currentSlideCallback = null;
    }

    /**
     * Initialize the Swiper carousel
     * @param {string} containerSelector - CSS selector for the swiper container
     * @param {Object} options - Configuration options
     * @param {Function} onSlideChange - Callback for slide change events
     */
    initialize(containerSelector, options = {}, onSlideChange = null) {
        const defaultOptions = {
            slidesPerView: 1,
            spaceBetween: 0, // Set to 0 to prevent spacing issues
            centeredSlides: true, // Ensure slides are properly centered
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                type: 'fraction',
            },
            keyboard: {
                enabled: true,
                onlyInViewport: true,
            },
            a11y: {
                enabled: true,
                prevSlideMessage: 'Previous onomatopoeia',
                nextSlideMessage: 'Next onomatopoeia',
                firstSlideMessage: 'This is the first onomatopoeia',
                lastSlideMessage: 'This is the last onomatopoeia',
            },
            on: {
                slideChange: (swiper) => {
                    console.log('slideChange event triggered, activeIndex:', swiper.activeIndex);
                },
                slideChangeTransitionStart: (swiper) => {
                    console.log('slideChangeTransitionStart event triggered, activeIndex:', swiper.activeIndex);
                },
                slideChangeTransitionEnd: (swiper) => {
                    console.log('CarouselManager slideChangeTransitionEnd event triggered, activeIndex:', swiper.activeIndex);
                    console.log('Total slides in swiper:', swiper.slides.length);
                    if (onSlideChange) {
                        console.log('Calling onSlideChange callback with index:', swiper.activeIndex);
                        onSlideChange(swiper.activeIndex);
                    }
                },
                slideNextTransitionStart: (swiper) => {
                    console.log('slideNextTransitionStart event triggered, activeIndex:', swiper.activeIndex);
                },
                slideNextTransitionEnd: (swiper) => {
                    console.log('slideNextTransitionEnd event triggered, activeIndex:', swiper.activeIndex);
                }
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            this.swiper = new Swiper(containerSelector, finalOptions);
            this.currentSlideCallback = onSlideChange;
            
            console.log('Carousel initialized successfully');
            console.log('Swiper slides count:', this.swiper.slides ? this.swiper.slides.length : 'undefined');
            console.log('Swiper realIndex:', this.swiper.realIndex);
            console.log('Swiper activeIndex:', this.swiper.activeIndex);
            
            return this.swiper;
        } catch (error) {
            console.error('Failed to initialize carousel:', error);
            return null;
        }
    }

    /**
     * Add slides to the carousel
     * @param {Array} slides - Array of HTML content for slides
     */
    addSlides(slides) {
        if (!this.swiper) {
            console.error('Carousel not initialized');
            return;
        }

        // Clear existing slides
        this.swiper.removeAllSlides();

        // Add new slides
        slides.forEach(slideContent => {
            this.swiper.appendSlide(`<div class="swiper-slide">${slideContent}</div>`);
        });

        // Update swiper
        this.swiper.update();
    }

    /**
     * Go to a specific slide
     * @param {number} index - Slide index
     */
    slideTo(index) {
        if (this.swiper) {
            this.swiper.slideTo(index);
        }
    }

    /**
     * Go to next slide
     */
    slideNext() {
        if (this.swiper) {
            console.log('slideNext called, current activeIndex:', this.swiper.activeIndex);
            
            // Manual slide control to ensure we only move by 1
            const currentIndex = this.swiper.activeIndex;
            const nextIndex = currentIndex + 1;
            
            if (nextIndex < this.swiper.slides.length) {
                console.log(`Manually sliding to index: ${nextIndex}`);
                this.swiper.slideTo(nextIndex);
            } else {
                console.log('Already at last slide');
            }
        }
    }

    /**
     * Go to previous slide
     */
    slidePrev() {
        if (this.swiper) {
            console.log('slidePrev called, current activeIndex:', this.swiper.activeIndex);
            
            // Manual slide control to ensure we only move by 1
            const currentIndex = this.swiper.activeIndex;
            const prevIndex = currentIndex - 1;
            
            if (prevIndex >= 0) {
                console.log(`Manually sliding to index: ${prevIndex}`);
                this.swiper.slideTo(prevIndex);
            } else {
                console.log('Already at first slide');
            }
        }
    }

    /**
     * Get current slide index
     * @returns {number} Current slide index
     */
    getCurrentSlide() {
        return this.swiper ? this.swiper.activeIndex : 0;
    }

    /**
     * Get total number of slides
     * @returns {number} Total slides count
     */
    getTotalSlides() {
        return this.swiper ? this.swiper.slides.length : 0;
    }

    /**
     * Update carousel visibility
     * @param {boolean} show - Whether to show the carousel
     */
    updateVisibility(show) {
        if (!this.swiper) return;

        const container = this.swiper.el;
        if (container) {
            uiManager.updateVisibility({ container }, { container: show });
            
            // Update navigation and pagination visibility
            const navigation = container.querySelectorAll('.swiper-button-next, .swiper-button-prev');
            const pagination = container.querySelector('.swiper-pagination');
            
            navigation.forEach(button => {
                button.style.display = show && this.getTotalSlides() > 1 ? 'flex' : 'none';
            });
            
            if (pagination) {
                pagination.style.display = show && this.getTotalSlides() > 1 ? 'block' : 'none';
            }
        }
    }

    /**
     * Destroy the carousel instance
     */
    destroy() {
        if (this.swiper) {
            this.swiper.destroy(true, true);
            this.swiper = null;
            this.currentSlideCallback = null;
        }
    }

    /**
     * Check if carousel is initialized
     * @returns {boolean} Whether carousel is initialized
     */
    isInitialized() {
        return this.swiper !== null;
    }

    /**
     * Update carousel after content changes
     */
    update() {
        if (this.swiper) {
            this.swiper.update();
            this.updateVisibility(this.getTotalSlides() > 0);
        }
    }
}

// Export for use in other modules
window.CarouselManager = CarouselManager;
