(() => {
    const carousel = document.querySelector("[data-carousel]");

    if (!carousel) {
        return;
    }

    const viewport = carousel.querySelector("[data-carousel-viewport]");
    const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
    const previous = carousel.querySelector("[data-carousel-previous]");
    const next = carousel.querySelector("[data-carousel-next]");
    const dots = Array.from(carousel.querySelectorAll("[data-carousel-dot]"));
    const caption = carousel.querySelector("[data-carousel-caption]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let activeIndex = 0;
    let scrollFrame;

    const updateControls = () => {
        previous.disabled = activeIndex === 0;
        next.disabled = activeIndex === slides.length - 1;

        dots.forEach((dot, index) => {
            dot.setAttribute("aria-current", index === activeIndex ? "true" : "false");
        });

        caption.textContent = slides[activeIndex]
            .querySelector(".media-slide-caption")
            .textContent
            .trim();
    };

    const moveTo = (index, behavior = reduceMotion ? "auto" : "smooth") => {
        activeIndex = Math.max(0, Math.min(index, slides.length - 1));
        viewport.scrollTo({
            left: slides[activeIndex].offsetLeft,
            behavior
        });
        updateControls();
    };

    previous.addEventListener("click", () => moveTo(activeIndex - 1));
    next.addEventListener("click", () => moveTo(activeIndex + 1));

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => moveTo(index));
    });

    viewport.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            moveTo(activeIndex - 1);
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            moveTo(activeIndex + 1);
        }
    });

    viewport.addEventListener("scroll", () => {
        window.cancelAnimationFrame(scrollFrame);
        scrollFrame = window.requestAnimationFrame(() => {
            const nearestIndex = slides.reduce((nearest, slide, index) => {
                const currentDistance = Math.abs(slide.offsetLeft - viewport.scrollLeft);
                const nearestDistance = Math.abs(slides[nearest].offsetLeft - viewport.scrollLeft);
                return currentDistance < nearestDistance ? index : nearest;
            }, 0);

            if (nearestIndex !== activeIndex) {
                activeIndex = nearestIndex;
                updateControls();
            }
        });
    }, { passive: true });

    window.addEventListener("resize", () => {
        viewport.scrollTo({
            left: slides[activeIndex].offsetLeft,
            behavior: "auto"
        });
    }, { passive: true });

    updateControls();
})();
