(() => {
    const carousel = document.querySelector("[data-carousel]");

    if (!carousel) {
        return;
    }

    const viewport = carousel.querySelector("[data-carousel-viewport]");
    const originalSlides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
    const previous = carousel.querySelector("[data-carousel-previous]");
    const next = carousel.querySelector("[data-carousel-next]");
    const dots = Array.from(carousel.querySelectorAll("[data-carousel-dot]"));
    const caption = carousel.querySelector("[data-carousel-caption]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let activeIndex = 0;
    let physicalIndex = 0;
    let physicalSlides = originalSlides;
    let scrollFrame;
    let settleTimer;

    originalSlides.forEach((slide, index) => {
        slide.dataset.logicalIndex = index;
    });

    if (originalSlides.length > 1) {
        const before = originalSlides[originalSlides.length - 1].cloneNode(true);
        const after = originalSlides[0].cloneNode(true);

        before.dataset.carouselClone = "";
        after.dataset.carouselClone = "";
        before.setAttribute("aria-hidden", "true");
        after.setAttribute("aria-hidden", "true");
        viewport.prepend(before);
        viewport.append(after);

        physicalSlides = Array.from(viewport.querySelectorAll("[data-carousel-slide]"));
        physicalIndex = 1;
    }

    const slideCenter = (slide) => slide.offsetLeft + (slide.offsetWidth / 2);
    const viewportCenter = () => viewport.scrollLeft + (viewport.clientWidth / 2);

    const updateControls = () => {
        physicalSlides.forEach((slide, index) => {
            slide.classList.toggle("is-active", index === physicalIndex);
        });

        previous.disabled = originalSlides.length < 2;
        next.disabled = originalSlides.length < 2;

        dots.forEach((dot, index) => {
            dot.setAttribute("aria-current", index === activeIndex ? "true" : "false");
        });

        caption.textContent = originalSlides[activeIndex]
            .querySelector(".media-slide-caption")
            .textContent
            .trim();
    };

    const scrollToPhysical = (index, behavior = reduceMotion ? "auto" : "smooth") => {
        physicalIndex = Math.max(0, Math.min(index, physicalSlides.length - 1));
        activeIndex = Number(physicalSlides[physicalIndex].dataset.logicalIndex);
        viewport.scrollTo({
            left: slideCenter(physicalSlides[physicalIndex]) - (viewport.clientWidth / 2),
            behavior
        });
        updateControls();
    };

    const normalizeLoop = () => {
        if (originalSlides.length < 2) {
            return;
        }

        if (physicalIndex === 0) {
            physicalIndex = originalSlides.length;
            viewport.scrollTo({
                left: slideCenter(physicalSlides[physicalIndex]) - (viewport.clientWidth / 2),
                behavior: "auto"
            });
        } else if (physicalIndex === physicalSlides.length - 1) {
            physicalIndex = 1;
            viewport.scrollTo({
                left: slideCenter(physicalSlides[physicalIndex]) - (viewport.clientWidth / 2),
                behavior: "auto"
            });
        }

        updateControls();
    };

    previous.addEventListener("click", () => scrollToPhysical(physicalIndex - 1));
    next.addEventListener("click", () => scrollToPhysical(physicalIndex + 1));

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => scrollToPhysical(index + (originalSlides.length > 1 ? 1 : 0)));
    });

    physicalSlides.forEach((slide, index) => {
        slide.addEventListener("click", () => {
            if (index !== physicalIndex) {
                scrollToPhysical(index);
            }
        });
    });

    viewport.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollToPhysical(physicalIndex - 1);
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollToPhysical(physicalIndex + 1);
        }
    });

    viewport.addEventListener("scroll", () => {
        window.cancelAnimationFrame(scrollFrame);
        window.clearTimeout(settleTimer);

        scrollFrame = window.requestAnimationFrame(() => {
            const center = viewportCenter();
            const nearestIndex = physicalSlides.reduce((nearest, slide, index) => {
                const currentDistance = Math.abs(slideCenter(slide) - center);
                const nearestDistance = Math.abs(slideCenter(physicalSlides[nearest]) - center);
                return currentDistance < nearestDistance ? index : nearest;
            }, 0);

            if (nearestIndex !== physicalIndex) {
                physicalIndex = nearestIndex;
                activeIndex = Number(physicalSlides[physicalIndex].dataset.logicalIndex);
                updateControls();
            }
        });

        settleTimer = window.setTimeout(normalizeLoop, 180);
    }, { passive: true });

    window.addEventListener("resize", () => {
        window.clearTimeout(settleTimer);
        physicalIndex = originalSlides.length > 1 ? activeIndex + 1 : activeIndex;
        viewport.scrollTo({
            left: slideCenter(physicalSlides[physicalIndex]) - (viewport.clientWidth / 2),
            behavior: "auto"
        });
        updateControls();
    }, { passive: true });

    window.requestAnimationFrame(() => {
        scrollToPhysical(physicalIndex, "auto");
    });
})();
