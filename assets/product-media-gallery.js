/**
 * Base Swiper Class
 * Optimization: Used DOMContentLoaded instead of 'load' event.
 */
class InstanceSwiper extends HTMLElement {
  constructor() {
    super();
    this.handle = this.getAttribute('handle');
    this.swiperInitialized = false; // Prevent multiple initializations
  }

  static get observedAttributes() {
    return ['handle'];
  }

  init() {
    // Stop if already initialized or element is not visible
    if (this.swiperInitialized) return;

    // Skip initialization if element is not visible (has no dimensions)
    if (this.offsetWidth === 0 && this.offsetHeight === 0 && !this.checkVisibility()) return;

    this.swiperInitialized = true;

    this.options = this.setOptions();
    this.instance = new Swiper('.swiper--' + this.handle, this.options);
    this.setInteractions();
  }

  /**
   * Checks if the element is visible
   */
  checkVisibility() {
    return !!(this.offsetWidth || this.offsetHeight || this.getClientRects().length);
  }

  connectedCallback() {
    if (Shopify.designMode) {
      window.addEventListener('shopify:section:load', () => this.init());
      window.addEventListener('shopify:section:select', () => this.init());

      // Fallback for Design mode
      setTimeout(() => {
        if (!this.swiperInitialized) this.init();
      }, 100);
    } else {
      // OPTIMIZATION: Not waiting for window 'load'. Starts immediately if DOM is ready.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }
  }

  disconnectedCallback() {
    if (this.instance && this.instance.destroy) this.instance.destroy();
  }

  /**
   * Settings before initialization
   */
  setOptions() {
    if (this.debug) console.log('setOptions');
    this._options = this.getOptionsAsJsonScripts();
    return this._options;
  }

  getOptionsAsJsonScripts() {
    if (this.debug) console.log('getOptionsAsJsonScripts');
    const jsonScriptAutomated = this.querySelector(`script#swiper--${this.handle}--automated-options`);
    const jsonScriptOverwrite = this.querySelector(`script#swiper--${this.handle}--overwrite-options`);
    let options = {};

    const parseJSON = scriptElement => {
      if (scriptElement && scriptElement.textContent) {
        try {
          return JSON.parse(scriptElement.textContent);
        } catch (error) {
          console.error('JSON Parse Error', error, scriptElement?.textContent);
          return {};
        }
      }
      return {};
    };

    options = { ...options, ...parseJSON(jsonScriptAutomated) };
    options = { ...options, ...parseJSON(jsonScriptOverwrite) };

    return options;
  }

  /** Thumbs instance should be mounted before this instance */
  getThumbsInstance() {
    if (!this.isThumbsActive) return;
    return document.querySelector(`[handle="${this.getAttribute('thumbs')}"]`)?.instance;
  }

  /**
   * Interactions after initialization
   */
  setInteractions() {
    // console.log('setInteractions');
  }
}

/**
 * Product Thumbnails Class
 * Optimization: Used ResizeObserver instead of setTimeout(2500).
 */
class InstanceSwiperProductThumbs extends InstanceSwiper {
  constructor() {
    super();
  }

  setOptions() {
    super.setOptions();
    this.setCenteredSlides();
    return this._options;
  }

  setCenteredSlides() {
    if (this.handle !== 'product-thumbs') return;

    const afterInit = swiper => {
      swiper.slideTo(swiper.activeIndex);
      const swiperWrapper = swiper.wrapperEl;

      const observer = new MutationObserver(resetSwiperWrapperTransform);
      observer.observe(swiperWrapper, { attributes: true });

      function resetSwiperWrapperTransform() {
        if (
          swiperWrapper.hasAttribute('style') &&
          swiperWrapper.style?.transform &&
          swiperWrapper.style?.transform !== 'translate3d(0px, 0px, 0px)'
        ) {
          swiperWrapper.style.transform = 'translate3d(0px, 0px, 0px)';
        } else if (
          swiperWrapper.hasAttribute('style') &&
          swiperWrapper.style?.transform &&
          swiperWrapper.style?.transform === 'translate3d(0px, 0px, 0px)'
        ) {
          setTimeout(() => {
            if (
              swiperWrapper.hasAttribute('style') &&
              swiperWrapper.style?.transform &&
              swiperWrapper.style?.transform === 'translate3d(0px, 0px, 0px)'
            ) {
              observer.disconnect();
            }
          }, 500);
        }
      }

      /**
       * OPTIMIZATION: Quick fix for thumbnail dislocation issue.
       * Used ResizeObserver instead of fixed 2500ms wait.
       */
      const slideElement = this.querySelector('.swiper-slide');

      const calculateAndSetHeight = () => {
        if (!slideElement) return;
        const slideHeight = slideElement.clientHeight;
        // Do not calculate if not rendered (is 0)
        if (!slideHeight) return;

        const calculateAllThumbHeight = (slideHeight + 16) * this.querySelectorAll('.swiper-slide').length;
        const thumbsWrapper = this.parentElement;

        if (thumbsWrapper.offsetHeight === calculateAllThumbHeight || calculateAllThumbHeight <= thumbsWrapper.offsetHeight) return;

        const calculatedHeight = calculateAllThumbHeight - 16 + 'px';

        if (thumbsWrapper.offsetHeight > calculateAllThumbHeight) {
          thumbsWrapper.style.height = calculatedHeight;
        } else {
          thumbsWrapper.removeAttribute('style');
        }
      };

      // Initial run
      calculateAndSetHeight();

      // Listen for changes (CSS loading, screen size change, etc.)
      const resizeObserver = new ResizeObserver(() => {
        calculateAndSetHeight();
      });

      // Observe parent element size changes
      if (this.parentElement) {
        resizeObserver.observe(this.parentElement);
      }
    };

    this._options = {
      ...this._options,
      on: {
        ...(this._options.on || {}),
        afterInit: afterInit
      }
    };
  }
}

if (!customElements.get('swiper-product-thumbs')) {
  customElements.define('swiper-product-thumbs', InstanceSwiperProductThumbs);
}

/**
 * Main Product Gallery Class
 */
class InstanceSwiperProductGallery extends InstanceSwiper {
  constructor() {
    super();
    this.isThumbsActive = this.hasAttribute('thumbs');
    this.isZoomActive = this.hasAttribute('zoom');
    this.modelViewerBtn = this.querySelector('.model-viewer-btn');
    this.modelViewer = this.querySelector('model-viewer');
    this.isModelActive = false;
  }

  static get observedAttributes() {
    return ['thumbs', 'zoom'];
  }

  setOptions() {
    super.setOptions();
    this.setThumbOptions();
    return this._options;
  }

  setThumbOptions() {
    if (!this.isThumbsActive) return;
    if (this.debug) console.log("setThumbOptions");
    const thumbsInstance = super.getThumbsInstance();
    if (this.debug) console.log("thumbsInstance", thumbsInstance);
    this._options = {
      ...this._options,
      thumbs: {
        swiper: thumbsInstance
      }
    };
  }

  /**
   * Interactions after initialization
   */
  setInteractions() {
    if (this.isThumbsActive) this.setThumbsInteraction();
    if (this.isZoomActive) this.photoSwipeLightboxInit();
    this.initModelViewer();

    // Add thumb click handler for model slides
    const thumbSlides = document.querySelectorAll('.swiper-slide[data-media-type="model"]');
    thumbSlides.forEach(slide => {
      slide.addEventListener('click', () => this.enableSwiper());
    });

    // Force pagination update on mobile after each slide change
    this.instance.on('slideChange', swiper => {
      if (DeviceDetector.isMobile()) {
        swiper.pagination.update();
      }
    });

    // Detect scroll event and force update pagination when scrolling ends
    this.instance.on('scroll', swiper => {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        swiper.pagination.update();
      }, 200);
    });
  }

  initModelViewer() {
    // Find all swiper slides with model viewers
    const modelSlides = this.querySelectorAll('.swiper-slide[data-media-type="model"]');

    this.resetAllModelViewers();
    modelSlides.forEach(slide => {
      const btn = slide.querySelector('.model-viewer-btn');
      const container = slide.querySelector('.model-viewer-container');
      const modelViewer = container?.querySelector('model-viewer');

      if (btn && container && modelViewer) {
        // Store references to associated elements
        btn.modelViewer = modelViewer;
        modelViewer.controlButton = btn;

        // Model viewer container click handler
        container.addEventListener('click', e => {
          if (!btn.classList.contains('is-active')) {
            e.preventDefault();
            e.stopPropagation();
            btn.click();
          }
        });

        // Model viewer button click handler
        btn.addEventListener('click', e => {
          e.preventDefault();
          this.toggleModelViewer(btn, modelViewer);
        });

        // Prevent model-viewer direct interaction
        modelViewer.addEventListener('mousedown', e => {
          if (!btn.classList.contains('is-active')) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
      }
    });

    // Add navigation click handlers
    if (this.instance?.navigation) {
      const { nextEl, prevEl } = this.instance.navigation;
      if (nextEl) {
        nextEl.addEventListener('click', () => {
          this.resetAllModelViewers();
          this.enableSwiper(true);
        });
      }
      if (prevEl) {
        prevEl.addEventListener('click', () => {
          this.resetAllModelViewers();
          this.enableSwiper(true);
        });
      }
    }
  }

  resetAllModelViewers() {
    // Find all model viewers in the current gallery instance
    const modelSlides = this.querySelectorAll('.swiper-slide[data-media-type="model"]');

    modelSlides.forEach(slide => {
      const btn = slide.querySelector('.model-viewer-btn');
      const modelViewer = slide.querySelector('model-viewer');

      if (btn && modelViewer) {
        btn.classList.remove('is-active');
        modelViewer.interactionPrompt = 'none';
        modelViewer.cameraControls = false;
      }
    });

    this.isModelActive = false;
    this.instance && (this.instance.allowTouchMove = true);
  }

  toggleModelViewer(btn, modelViewer) {
    const wasActive = btn.classList.contains('is-active');

    // Reset all model viewers in this gallery
    this.resetAllModelViewers();

    if (!wasActive) {
      this.isModelActive = true;
      this.instance.allowTouchMove = false;

      // Enable only this specific model viewer
      modelViewer.interactionPrompt = 'auto';
      modelViewer.cameraControls = true;
      btn.classList.add('is-active');
    }
  }

  temporarilyDisableSwiper() {
    // Only disable touch/mouse dragging
    this.instance.allowTouchMove = false;

    // Re-enable after a short delay if no model interaction occurs
    this.swiperTimeout = setTimeout(() => {
      if (!this.isModelActive) {
        this.enableSwiper();
      }
    }, 100);
  }

  enableSwiper(force = false) {
    if (this.swiperTimeout) {
      clearTimeout(this.swiperTimeout);
    }

    // Always enable touch/mouse dragging if force is true or model is not active
    if (force || !this.isModelActive) {
      this.instance.allowTouchMove = true;

      // Reset model viewer state if forced
      if (force && this.isModelActive) {
        this.isModelActive = false;
        if (this.modelViewer) {
          this.modelViewer.interactionPrompt = 'none';
          this.modelViewer.cameraControls = false;
        }
        this.modelViewerBtn.classList.remove('is-active');
      }
    }
  }

  setThumbsInteraction() {
    if (!this.isThumbsActive || !this.instance) return;
    if (this.debug) console.log("setThumbsInteraction");
    const thumbsSwiper = this.options.thumbs.swiper;

    // Enable swiper on thumb click
    thumbsSwiper.el.addEventListener('click', () => {
      this.enableSwiper(true);
      if (this.modelViewerBtn) {
        this.modelViewerBtn.classList.remove('is-active');
      }
    });

    this.instance.on('slideChangeTransitionStart', function (swiper) {
      const activeIndex = swiper.activeIndex;
      const thumbsActiveIndex = thumbsSwiper.activeIndex;
      if (this.debug) console.log("slideChangeTransitionStart", activeIndex, thumbsActiveIndex);
      if (activeIndex !== thumbsActiveIndex) {
        thumbsSwiper.slideTo(activeIndex);
      }
    });
  }

  photoSwipeLightboxInit() {
    const [closeIcon, prevIcon, nextIcon] = [
      document.querySelector('[data-close-icon]'),
      document.querySelector('[data-prev-icon]'),
      document.querySelector('[data-next-icon]')
    ];

    function isPhone() {
      return window.innerWidth < 750;
    }

    const photoSwipeLightboxInstance = new PhotoSwipeLightbox({
      gallery: `.photoswipe-wrapper`,
      children: 'a.product__gallery-toggle',
      mainClass: 'pswp--product-media-gallery',

      loop: false,
      showHideAnimationType: 'zoom',

      initialZoomLevel: zoomLevelObject => {
        if (DeviceDetector.isMobile()) {
          return zoomLevelObject.vFill;
        } else {
          return zoomLevelObject.fit;
        }
      },
      secondaryZoomLevel: zoomLevelObject => {
        if (DeviceDetector.isMobile()) {
          return zoomLevelObject.fit;
        } else {
          return 1;
        }
      },
      pswpModule: PhotoSwipe
    });
    photoSwipeLightboxInstance.addFilter('uiElement', (element, data) => {
      if (data.name === 'close') {
        element.innerHTML = closeIcon.innerHTML;
      } else if (data.name === 'arrowPrev') {
        element.innerHTML = prevIcon.innerHTML;
      } else if (data.name === 'arrowNext') {
        element.innerHTML = nextIcon.innerHTML;
      }
      return element;
    });

    // html for video
    photoSwipeLightboxInstance.addFilter('itemData', (itemData, index) => {
      if (itemData.type === 'html' && itemData.element) {
        return {
          html: itemData.element.dataset.pswpHtml
        };
      }
      return itemData;
    });

    photoSwipeLightboxInstance.init();

    photoSwipeLightboxInstance.on('beforeOpen', () => {
      document.body.classList.add('overflow-hidden');
      const videos = this.querySelectorAll('video');
      Array.from(videos).forEach(video => {
        // If video is not playing, call playPromise
        // Force to play
        video
          .play()
          .then(() => {
            // Automatic playback started!
            // Show playing UI.
          })
          .catch(error => {
            // Auto-play was prevented
            // Show paused UI.
            video.pause();
          });
      });
    });

    photoSwipeLightboxInstance.on('closingAnimationStart', () => {
      document.body.classList.remove('overflow-hidden');
    });
  }

  setActiveMedia(id) {
    const mediaFound = Array.from(this.querySelectorAll('[data-media-id]')).find(media => Number(media.dataset.mediaId) === id);

    if (!mediaFound) return;

    if (this.instance && typeof this.instance.slideTo === 'function') {
      if (this.dataset.hideOtherVariantsMedia === 'false') {
        this.instance.slideTo(Number(mediaFound.dataset.index));
      }
    }
  }
}
if (!customElements.get('swiper-product-gallery')) {
  customElements.define('swiper-product-gallery', InstanceSwiperProductGallery);
}

/**
 * Product Media Info Class
 */
class ProductMediaInfo extends HTMLElement {
  constructor() {
    super();

    this.init();
    window.addEventListener('resize', this.init.bind(this));

    if (Shopify.designMode) {
      window.addEventListener('shopify:section:load', this.init.bind(this));
    }
  }

  init() {
    let containerOffsetWidth = document.querySelector('.main-product__media--slider')?.offsetWidth || 330;
    if (document.querySelector('.main-product__media--grid-item') && !DeviceDetector.isMobile()) {
      const gridItem = document.querySelector('.main-product__media--grid-item');
      if (gridItem) containerOffsetWidth = gridItem.offsetWidth;
    }
    const maxWidthForInfo = (containerOffsetWidth - 48) / 2;

    const lastP = this.querySelector('p:last-child');
    if (!lastP) return;

    const mediaInfoTextWidth = lastP.offsetWidth;
    const mediaInfoHidden = this.querySelector('p[aria-hidden]');

    if (mediaInfoTextWidth > maxWidthForInfo) {
      this.classList.remove('animation-stopped');
      this.style.cssText = `--marquee-speed: ${(mediaInfoTextWidth / maxWidthForInfo) * 8}s`;
      if (mediaInfoHidden) mediaInfoHidden.style.display = '';
    } else {
      this.classList.add('animation-stopped');
      this.style.cssText = '';
      if (mediaInfoHidden) mediaInfoHidden.style.display = 'none';
    }
  }
}

if (!customElements.get('product-media-info')) {
  customElements.define('product-media-info', ProductMediaInfo);
}
