(() => {
    const carousel = document.querySelector("[data-carousel]");
    if (!carousel) return;

    const viewport = carousel.querySelector("[data-carousel-viewport]");
    const allSlides = [...carousel.querySelectorAll("[data-carousel-slide]")];
    const previous = carousel.querySelector("[data-carousel-previous]");
    const next = carousel.querySelector("[data-carousel-next]");
    const dotGroup = carousel.querySelector("[data-media-dots]");
    const status = carousel.querySelector("[data-media-status]");
    const original = carousel.querySelector("[data-media-original]");
    const filters = [...document.querySelectorAll("[data-media-filter]")];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let slides = allSlides;
    let dots = [];
    let activeIndex = 0;
    let requestedIndex = null;
    let categoryLabel = "All";
    let settleTimer;

    const update = () => {
        slides.forEach((slide, index) => {
            slide.classList.toggle("is-active", index === activeIndex);
            slide.setAttribute("aria-hidden", String(index !== activeIndex));
        });
        dots.forEach((dot, index) => dot.setAttribute("aria-current", String(index === activeIndex)));
        previous.disabled = next.disabled = slides.length < 2;
        status.textContent = categoryLabel + " · " + (activeIndex + 1) + " / " + slides.length;
        const image = slides[activeIndex].querySelector("img");
        original.href = image.getAttribute("src");
        original.setAttribute("aria-label", "View full image: " + image.alt + " (opens in a new tab)");
    };

    const goTo = (index, behavior = motion.matches ? "instant" : "smooth") => {
        activeIndex = (index + slides.length) % slides.length;
        requestedIndex = activeIndex;
        const slide = slides[activeIndex];
        viewport.scrollTo({
            left: slide.offsetLeft + slide.offsetWidth / 2 - viewport.clientWidth / 2,
            behavior
        });
        update();
    };

    const settle = () => {
        window.clearTimeout(settleTimer);
        requestedIndex = null;
        const center = viewport.scrollLeft + viewport.clientWidth / 2;
        activeIndex = slides.reduce((best, slide, index) =>
            Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center) <
            Math.abs(slides[best].offsetLeft + slides[best].offsetWidth / 2 - center)
                ? index : best, 0);
        update();
    };

    const filter = (key, label) => {
        window.clearTimeout(settleTimer);
        // Stop any previous smooth scroll before changing the track.
        viewport.scrollTo({ left: viewport.scrollLeft, behavior: "instant" });
        slides = allSlides.filter(slide => key === "all" || slide.dataset.category.split(" ").includes(key));
        allSlides.forEach(slide => {
            slide.hidden = !slides.includes(slide);
            slide.classList.remove("is-active");
            slide.setAttribute("aria-hidden", "true");
        });
        categoryLabel = label;
        filters.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mediaFilter === key)));
        dots = slides.map((slide, index) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "media-dot";
            dot.setAttribute("aria-label", "Show screenshot " + (index + 1) + ": " + slide.querySelector("img").alt);
            dot.addEventListener("click", () => goTo(index));
            return dot;
        });
        dotGroup.replaceChildren(...dots);
        goTo(0, "instant");
    };

    previous.addEventListener("click", () => goTo((requestedIndex ?? activeIndex) - 1));
    next.addEventListener("click", () => goTo((requestedIndex ?? activeIndex) + 1));
    filters.forEach(button => button.addEventListener("click", () => filter(button.dataset.mediaFilter, button.textContent)));
    allSlides.forEach(slide => slide.addEventListener("click", () => {
        const index = slides.indexOf(slide);
        if (index >= 0 && index !== activeIndex) goTo(index);
    }));
    viewport.addEventListener("keydown", event => {
        const actions = {
            ArrowLeft: () => goTo((requestedIndex ?? activeIndex) - 1),
            ArrowRight: () => goTo((requestedIndex ?? activeIndex) + 1),
            Home: () => goTo(0),
            End: () => goTo(slides.length - 1)
        };
        if (actions[event.key]) {
            event.preventDefault();
            actions[event.key]();
        }
    });
    viewport.addEventListener("scroll", () => {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(settle, 180);
    }, { passive: true });
    viewport.addEventListener("scrollend", settle);
    new ResizeObserver(() => goTo(activeIndex, "instant")).observe(viewport);

    carousel.classList.add("is-ready");
    document.querySelector("[data-media-filters]").hidden = false;
    carousel.querySelector("[data-media-toolbar]").hidden = false;
    previous.hidden = next.hidden = dotGroup.hidden = false;
    filter("all", "All");
})();

