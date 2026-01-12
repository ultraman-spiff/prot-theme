class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();

    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      if (this.shouldPreventSubmit(event)) return;
      this.onSubmitHandler(event);
    }, 800);

    const facetForm = this.querySelector('form');
    facetForm.addEventListener('input', this.debouncedOnSubmit.bind(this));

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener('popstate', onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById('ProductCount');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');

    document.getElementById('ProductGridContainer').querySelector('.collection-grid-container').classList.add('loading');
    if (countContainer) {
      countContainer.classList.add('loading');
    }
    if (countContainerDesktop) {
      countContainerDesktop.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = (element) => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
        : FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
        if (document.getElementById('SortBy')) {
          document.getElementById('SortBy').dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);

        setTimeout(() => {
          FacetFiltersForm.initializeShowMore();
        }, 0);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
    if (document.getElementById('SortBy')) {
      document.getElementById('SortBy').dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);

    setTimeout(() => {
      FacetFiltersForm.initializeShowMore();
    }, 0);
  }

  static renderProductGridContainer(html) {
    document.getElementById('ProductGridContainer').innerHTML = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById('ProductGridContainer').innerHTML;

    document
      .getElementById('ProductGridContainer')
      .querySelectorAll('.scroll-trigger')
      .forEach((element) => {
        element.classList.add('scroll-trigger--cancel');
      });
  }

  static renderProductCount(html) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
    const countElement = parsedHTML.getElementById('ProductCount');

    if (!countElement) {
      return;
    }

    const count = countElement.innerHTML;
    const container = document.getElementById('ProductCount');
    const containerDesktop = document.getElementById('ProductCountDesktop');

    if (container) {
      container.innerHTML = count;
      container.classList.remove('loading');
    }
    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove('loading');
    }
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
    const facetDetailsElementsFromFetch = parsedHTML.querySelectorAll('#FacetFiltersForm .js-filter');
    const facetDetailsElementsFromDom = document.querySelectorAll('facet-filters-form form .js-filter');

    // Remove facets that are no longer returned from the server
    Array.from(facetDetailsElementsFromDom).forEach((currentElement) => {
      if (!Array.from(facetDetailsElementsFromFetch).some(({ id }) => currentElement.id === id)) {
        currentElement.remove();
      }
    });

    const matchesId = (element) => {
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.id === jsFilter.id : false;
    };

    const facetsToRender = Array.from(facetDetailsElementsFromFetch).filter((element) => !matchesId(element));
    const countsToRender = Array.from(facetDetailsElementsFromFetch).find(matchesId);

    facetsToRender.forEach((elementToRender, index) => {
        const currentElement = document.getElementById(elementToRender.id);
        // Element already rendered in the DOM so just update the innerHTML
        if (currentElement) {
          document.getElementById(elementToRender.id).innerHTML = elementToRender.innerHTML;
        } else {
          if (index > 0) {
            const { className: previousElementClassName, id: previousElementId } = facetsToRender[index - 1];
            if (elementToRender.className === previousElementClassName) {
              document.getElementById(previousElementId).after(elementToRender);
              return;
            }
          }

          /*
          if (elementToRender.parentElement) {
            document.querySelector(`#${elementToRender.parentElement.id} .js-filter`).before(elementToRender);
          }
          */
        }
      });

    FacetFiltersForm.renderActiveFacets(parsedHTML);

    if (countsToRender) {
      const closestJSFilterID = event.target.closest('.js-filter').id;

      if (closestJSFilterID) {
        FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));

        const newFacetDetailsElement = document.getElementById(closestJSFilterID);
        const newElementToActivate = newFacetDetailsElement.querySelector('.facets__summary');

        const isTextInput = event.target.getAttribute('type') === 'text';

        if (newElementToActivate && !isTextInput) newElementToActivate.focus();
      }
    }
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    });

    FacetFiltersForm.toggleActiveFacets(false);
  }

  static renderCounts(source, target) {
    const targetSummary = target.querySelector('.facets__summary');
    const sourceSummary = source.querySelector('.facets__summary');

    if (sourceSummary && targetSummary) {
      targetSummary.outerHTML = sourceSummary.outerHTML;
    }

    const targetHeaderElement = target.querySelector('.facets__header');
    const sourceHeaderElement = source.querySelector('.facets__header');

    if (sourceHeaderElement && targetHeaderElement) {
      targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;
    }

    const targetWrapElement = target.querySelector('.facets-wrap');
    const sourceWrapElement = source.querySelector('.facets-wrap');

    if (sourceWrapElement && targetWrapElement) {
      const isShowingMore = Boolean(target.querySelector('show-more-button .label-show-more.hidden'));
      if (isShowingMore) {
        sourceWrapElement
          .querySelectorAll('.facets__item.hidden')
          .forEach((hiddenItem) => hiddenItem.classList.replace('hidden', 'show-more-item'));
      }

      targetWrapElement.outerHTML = sourceWrapElement.outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      },
    ];
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    const currentUrl = new URL(window.location.href);
    const sortParam = currentUrl.searchParams.get('sort_by');
    if (sortParam) {
      params.set('sort_by', sortParam);
    }

    // Preserve the 'q' parameter for search pages
    const qParam = currentUrl.searchParams.get('q');
    if (qParam) {
      params.set('q', qParam);
    }

    const sortBySelect = document.getElementById('SortBy');
    if (sortBySelect && sortBySelect.value) {
      params.set('sort_by', sortBySelect.value);
    }

    let sortFilterForms = Array.from(document.querySelectorAll('facet-filters-form form'));

    sortFilterForms = sortFilterForms.filter(form => {
      const hasFilterCheckboxes = form.querySelector('input[type="checkbox"][name^="filter"]');
      return hasFilterCheckboxes !== null;
    });

    const allFilterCheckboxes = {};
    sortFilterForms.forEach(form => {
      form.querySelectorAll('input[type="checkbox"]').forEach(input => {
        const key = `${input.name}|${input.value}`;
        if (!allFilterCheckboxes[key]) {
          allFilterCheckboxes[key] = [];
        }
        allFilterCheckboxes[key].push(input);
      });
    });

    Object.values(allFilterCheckboxes).forEach(inputs => {
      if (inputs.length > 1) {
        const triggerForm = event.target ? event.target.closest('form') : null;
        const primaryInput = inputs.find(input => input.closest('form') === triggerForm) || inputs[0];
        inputs.forEach(input => {
          if (input !== primaryInput) {
            input.checked = primaryInput.checked;
          }
        });
      }
    });

    if (window.matchMedia('(max-width:990px)').matches) {
      sortFilterForms = sortFilterForms.filter(form => !form.closest('.collection__facets--sidebar'));
    }

    sortFilterForms.forEach(form => {
      const checkboxInputs = form.querySelectorAll('input[type="checkbox"]');
      checkboxInputs.forEach(input => {
        if (input.checked) {
          params.append(input.name, input.value);
        }
      });

      const otherInputs = form.querySelectorAll('input:not([type="checkbox"])');
      otherInputs.forEach(input => {
        if (input.value && input.name !== 'sort_by' && input.name) {

          // These two conditions for prevent price facet to be submitted if it is at the minimum or maximum value
          if (input.name === 'filter.v.price.gte') {
            const min = input.getAttribute('min');
            if (min !== null && Number(input.value) === Number(min)) return;
          }

          if (input.name === 'filter.v.price.lte') {
            const max = input.getAttribute('max');
            if (max !== null && Number(input.value) === Number(max)) return;
          }

          params.set(input.name, input.value);
        }
      });

      const selectElements = form.querySelectorAll('select');
      selectElements.forEach(select => {
        if (select.value && select.name === 'sort_by') {
          params.set('sort_by', select.value);
        }
      });
    });

    this.onSubmitForm(params.toString(), event);
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    let url = event.currentTarget.href.indexOf('?') == -1 ? '' : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);

    // Preserve the 'q' parameter for search pages
    const currentUrl = new URL(window.location.href);
    const qParam = currentUrl.searchParams.get('q');
    if (qParam) {
      const params = new URLSearchParams(url);
      params.set('q', qParam);
      url = params.toString();
    }

    FacetFiltersForm.renderPage(url);
  }

  shouldPreventSubmit(event) {
    const minInput = event?.target?.form?.querySelector('input[name="filter.v.price.gte"]');
    const maxInput = event?.target?.form?.querySelector('input[name="filter.v.price.lte"]');

    if (minInput && maxInput) {
      const min = parseFloat(minInput.value);
      const max = parseFloat(maxInput.value);

      if (!isNaN(min) && !isNaN(max) && min >= max) {
        return true;
      }
    }

    return false;
  }

  static initializeShowMore() {
    document.querySelectorAll('.js-filter[data-show-more-count]').forEach(group => {
      const listItems = group.querySelectorAll('.facets__item');
      const button = group.querySelector('.show-more');
      const showMoreCount = parseInt(group.dataset.showMoreCount, 10) || 5;
      let expanded = FacetFiltersForm.expandedFilters.has(group.id);

      if (!button) return;

      function updateList() {
        listItems.forEach((item, index) => {
          const shouldCollapse = !expanded && index >= showMoreCount;
          item.classList.toggle('is-collapsed', shouldCollapse);
        });
        button.textContent = expanded ? window.actionStrings.showLess : window.actionStrings.showMore;
      }

      button.addEventListener('click', (event) => {
        event.preventDefault();
        expanded = !expanded;
        if (expanded) {
          FacetFiltersForm.expandedFilters.add(group.id);
        } else {
          FacetFiltersForm.expandedFilters.delete(group.id);
        }
        updateList();
      });

      updateList();

      if (listItems.length <= showMoreCount) {
        button.style.display = 'none';
      }
    });
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();
FacetFiltersForm.expandedFilters = new Set();
FacetFiltersForm.initializeShowMore();

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('input').forEach(element => {
      element.addEventListener('change', this.onRangeChange.bind(this));
      element.addEventListener('keydown', this.onKeyDown.bind(this));
    });
    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  onKeyDown(event) {
    const allowedKeys = ['Backspace', 'Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Escape'];
    if (!allowedKeys.includes(event.key) && !/[0-9.,]/.test(event.key)) {
      event.preventDefault();
    }
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];

    if (maxInput.value) {
      minInput.setAttribute('data-max', maxInput.value);
    } else {
      minInput.setAttribute('data-max', maxInput.getAttribute('max'));
    }

    if (minInput.value) {
      maxInput.setAttribute('data-min', minInput.value);
    } else {
      maxInput.setAttribute('data-min', minInput.getAttribute('min'));
    }
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min')) || 0; // Default to input's min attribute
    const max = Number(input.getAttribute('max')); // Default to input's max attribute

    if (!isNaN(min) && value < min) input.value = min;
    if (!isNaN(max) && value > max) input.value = max;
  }

  #abortController;

  connectedCallback() {
    this.#abortController = new AbortController();
    const signal = { signal: this.#abortController.signal };

    const priceRangeMin = this.querySelector('input[type="range"]:first-child');
    const priceRangeMax = this.querySelector('input[type="range"]:last-child');

    const priceInputMin = this.querySelector('input[name="filter.v.price.gte"]');
    const priceInputMax = this.querySelector('input[name="filter.v.price.lte"]');

    const minPriceGap = priceRangeMin ? parseInt(priceRangeMin.step) || 1 : 1;
    const rangeGroup = this.querySelector('.range-group');

    if (rangeGroup) {
      rangeGroup.addEventListener('click', (event) => {
        if (event.target.tagName === 'INPUT') return;

        const rect = rangeGroup.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const isRtl = document.documentElement.getAttribute('dir') === 'rtl';
        const percentage = isRtl
          ? 1 - Math.max(0, Math.min(1, x / rect.width))
          : Math.max(0, Math.min(1, x / rect.width));

        if (!priceRangeMin || !priceRangeMax) return;

        const min = parseFloat(priceRangeMin.min);
        const max = parseFloat(priceRangeMin.max);
        const range = max - min;

        const clickedValue = Math.round(min + (range * percentage));

        const currentMin = parseFloat(priceRangeMin.value);
        const currentMax = parseFloat(priceRangeMax.value);

        if (Math.abs(clickedValue - currentMin) < Math.abs(clickedValue - currentMax)) {
          priceRangeMin.value = clickedValue;
          priceRangeMin.dispatchEvent(new Event('input', { bubbles: true }));
          priceRangeMin.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          priceRangeMax.value = clickedValue;
          priceRangeMax.dispatchEvent(new Event('input', { bubbles: true }));
          priceRangeMax.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }

    const updateRangePosition = (rangeInput, cssProperty) => {
      const percentage = (parseFloat(rangeInput.value) / parseFloat(rangeInput.max)) * 100;
      rangeInput.parentElement.style.setProperty(cssProperty, `${percentage}%`);
    };

    const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

    const validateInput = (input, otherInput, isMin) => {
      const value = parseInt(input.value);
      const absoluteMax = parseInt(input.max);
      const otherValue = parseInt(otherInput.value);

      if (isNaN(value)) return;

      if (isMin) {
        if (value > absoluteMax) {
          input.value = absoluteMax;
        } else if (value >= otherValue) {
          input.value = otherValue - 1;
        }
      } else {
        if (value > absoluteMax) {
          input.value = absoluteMax;
        }
        debounce(() => {
          if (value <= otherValue) {
            input.value = otherValue + 1;
          }
        }, 800);
      }
    };

    priceInputMin.addEventListener('focus', () => priceInputMin.select(), signal);
    priceInputMax.addEventListener('focus', () => priceInputMax.select(), signal);

    priceInputMin.addEventListener('input', () => validateInput(priceInputMin, priceInputMax, true), signal);
    priceInputMax.addEventListener('input', () => validateInput(priceInputMax, priceInputMin, false), signal);

    priceInputMin.addEventListener(
      'change',
      event => {
        event.preventDefault();
        const value = parseInt(event.target.value);
        const maxValue = parseInt(priceInputMax.value || event.target.max);
        const absoluteMin = parseInt(event.target.min);

        event.target.value = clamp(value, absoluteMin, maxValue - minPriceGap);

        if (priceRangeMin) {
          priceRangeMin.value = event.target.value;
          updateRangePosition(priceRangeMin, '--range-min');
        }
        event.target.dispatchEvent(new Event('input', { bubbles: true }));
      },
      signal
    );

    priceInputMax.addEventListener(
      'change',
      event => {
        event.preventDefault();
        const value = parseInt(event.target.value);
        const minValue = parseInt(priceInputMin.value || event.target.min);
        const absoluteMax = parseInt(event.target.max);

        event.target.value = clamp(value, minValue + minPriceGap, absoluteMax);

        if (priceRangeMax) {
          priceRangeMax.value = event.target.value;
          updateRangePosition(priceRangeMax, '--range-max');
        }
        event.target.dispatchEvent(new Event('input', { bubbles: true }));
      },
      signal
    );

    priceRangeMin?.addEventListener(
      'change',
      event => {
        event.stopPropagation();
        priceInputMin.value = event.target.value;
        priceInputMin.dispatchEvent(new Event('change', { bubbles: true }));
      },
      signal
    );

    priceRangeMax?.addEventListener(
      'change',
      event => {
        event.stopPropagation();
        priceInputMax.value = event.target.value;
        priceInputMax.dispatchEvent(new Event('change', { bubbles: true }));
      },
      signal
    );

    priceRangeMin?.addEventListener(
      'input',
      event => {
        const value = parseInt(event.target.value);
        const maxValue = parseInt(priceInputMax.value);

        event.target.value = Math.min(value, maxValue - minPriceGap);

        updateRangePosition(event.target, '--range-min');
        priceInputMin.value = event.target.value;
      },
      signal
    );

    priceRangeMax?.addEventListener(
      'input',
      event => {
        const value = parseInt(event.target.value);
        const minValue = parseInt(priceInputMin.value);

        event.target.value = Math.max(value, minValue + minPriceGap);

        updateRangePosition(event.target, '--range-max');
        priceInputMax.value = event.target.value;
      },
      signal
    );
  }

  disconnectedCallback() {
    if (this.#abortController) {
      this.#abortController.abort();
    }
  }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector('a');
    facetLink.setAttribute('role', 'button');
    facetLink.addEventListener('click', this.closeFilter.bind(this));
    facetLink.addEventListener('keyup', event => {
      event.preventDefault();
      if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
    });
  }

  closeFilter(event) {
    event.preventDefault();
    const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
    form.onActiveFilterClick(event);
  }
}

customElements.define('facet-remove', FacetRemove);
