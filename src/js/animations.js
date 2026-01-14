// src/js/animations.js

/**
 * Sets up an Intersection Observer to add a 'visible' class to elements when they enter the viewport.
 */
export function setupScrollAnimations() {
  const sections = document.querySelectorAll('.fade-in-section');

  if (!sections.length) {
    return;
  }

  const observerOptions = {
    root: null, // observes intersections relative to the viewport
    rootMargin: '0px',
    threshold: 0.1 // trigger when 10% of the section is visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // stop observing once it's visible
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    observer.observe(section);
  });
}
