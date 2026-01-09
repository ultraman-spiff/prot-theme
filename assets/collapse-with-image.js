class Accordion {
  constructor(element) {
    this.accordion = element;
    this.headers = this.accordion.querySelectorAll('.cwi-accordion-header');
    this.descriptions = this.accordion.querySelectorAll('.cwi-accordion-body');
    this.toggleAllBtn = document.getElementById('cwi-toggleAll');

    this.init();
  }

  init() {
    // Add click event listeners to headers
    this.headers.forEach(header => {
      header.addEventListener('click', (e) => {
        this.toggle(e.currentTarget);
      });
    });
    this.descriptions.forEach(description => {
      description.innerHTML = description.innerHTML.replace(/<\/p><h6>/g, "</p><br /><h6>");
    });
  }

  toggle(header) {
    const item = header.parentElement;
    const content = item.querySelector('.cwi-accordion-content');
    const icon = header.querySelector('.cwi-accordion-icon');

    const isActive = item.classList.contains('cwi-active');

    if (isActive) {
      // Close
      item.classList.remove('cwi-active');
      content.classList.remove('cwi-active');
      icon.textContent = '+';
    } else {
      // Open
      item.classList.add('cwi-active');
      content.classList.add('cwi-active');
      icon.textContent = '−';
    }
  }
}
