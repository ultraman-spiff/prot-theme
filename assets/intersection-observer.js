if(!customElements.get("animation-observer")) {
  customElements.define(
    "animation-observer",
    class AnimationObserver extends HTMLElement {
      static get observedAttributes() {
        return [
          "data-intersect-once",
          "data-animation-mobile",
          "data-intersection-observer"
        ];
      }

      constructor() {
        super();
        this.observer = null;
        this.isAnimated = false;
        this.DEFAULT_DELAY = 300;
        this.DEFAULT_DURATION = 900;
      }

      connectedCallback() {
        this.initObserver();
      }

      disconnectedCallback() {
        if (this.observer) {
          this.observer.disconnect();
        }
      }

      attributeChangedCallback(name, oldValue, newValue) {
        if (this.observer) {
          this.observer.disconnect();
        }
        this.initObserver();
      }

      parseIntSafe(value, fallback) {
        const parsed = parseInt(value);
        return isNaN(parsed) ? fallback : parsed;
      }

      initObserver() {
        const observerElement = this;
        const intersectOnce =
          observerElement.dataset.intersectOnce !== "false";
        const observerOptions = {
          rootMargin: "0px 0px -50% 0px",
          threshold: 0,
          ...this.getIntersectionOptions()
        };

        this.observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) {
              return;
            }

            const allowMobileAnimation = observerElement.dataset.animationMobile !== "false";
            if (DeviceDetector.isMobile() && !allowMobileAnimation) {
              return;
            }

            if (this.isAnimated && intersectOnce) {
              return;
            }

            this.isAnimated = true;
            this.triggerAnimation();

            if (intersectOnce) {
              this.observer.unobserve(observerElement);
            }
          });
        }, observerOptions);

        this.observer.observe(observerElement);
      }

      getIntersectionOptions() {
        try {
          return JSON.parse(this.dataset.intersectionObserver || "{}");
        } catch (e) {
          console.error("Invalid JSON in data-intersection-observer:", e);
          return {};
        }
      }

      triggerAnimation() {
        const animationBody = this.querySelector(
          ".full-width-banner__animation--body"
        );
        const animationElements = this.querySelectorAll(
          ".full-width-banner__animation"
        );

        this.addEventListener(
          "animationend",
          () => {
            this.isAnimated = false;
          },
          { once: true }
        );

        if (!animationElements.length) {
          this.classList.add("isAnimated");
          return;
        }

        const baseAnimationDelay = animationBody
          ? this.parseIntSafe(
              animationBody.dataset.animationDelay,
              this.DEFAULT_DELAY
            )
          : this.DEFAULT_DELAY;
        const baseAnimationDuration = animationBody
          ? this.parseIntSafe(
              animationBody.dataset.animationDuration,
              this.DEFAULT_DURATION
            )
          : this.DEFAULT_DURATION;

        this.classList.add("inAnimation");

        let completedAnimations = 0;
        const totalAnimations = animationElements.length;

        animationElements.forEach((element, i) => {
          const elementDelay = this.parseIntSafe(
            element.dataset.animationDelay,
            baseAnimationDelay
          );
          const elementDuration = this.parseIntSafe(
            element.dataset.animationDuration,
            baseAnimationDuration
          );
          const startDelay = i * (elementDelay / 2);

          setTimeout(() => {
            element.classList.add("inAnimation");
            const childElement = element.querySelector("*");
            if (childElement) {
              childElement.style.animationDuration = `${elementDuration}ms`;
            }
          }, startDelay);

          setTimeout(() => {
            element.classList.remove("inAnimation");
            element.classList.add("isAnimated");

            completedAnimations++;

            if (completedAnimations === totalAnimations) {
              this.classList.remove("inAnimation");
              this.classList.add("isAnimated");
              this.isAnimated = true;
            }
          }, startDelay + baseAnimationDuration);
        });
      }
    }
  );
}
