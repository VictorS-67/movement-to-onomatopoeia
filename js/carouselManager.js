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
            spaceBetween: 30,
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
                    if (onSlideChange) {
                        onSlideChange(swiper.activeIndex);
                    }
                    if (this.currentSlideCallback) {
                        this.currentSlideCallback(swiper.activeIndex);
                    }
                }
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            this.swiper = new Swiper(containerSelector, finalOptions);
            this.currentSlideCallback = onSlideChange;
            
            console.log('Carousel initialized successfully');
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
            this.swiper.slideNext();
        }
    }

    /**
     * Go to previous slide
     */
    slidePrev() {
        if (this.swiper) {
            this.swiper.slidePrev();
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
