document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => nav.classList.remove('open'));
    });
  }

  const slider = document.querySelector('[data-slider]');
  if (slider) {
    const slides = Array.from(slider.querySelectorAll('.hero-slide'));
    const dots = Array.from(slider.querySelectorAll('.slider-dot'));
    const previous = slider.querySelector('.slider-prev');
    const next = slider.querySelector('.slider-next');
    let current = 0;
    let timer;
    let touchStartX = 0;

    const showSlide = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === current;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', String(isActive));
      });
    };

    const restartTimer = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => showSlide(current + 1), 5000);
    };

    previous.addEventListener('click', () => {
      showSlide(current - 1);
      restartTimer();
    });
    next.addEventListener('click', () => {
      showSlide(current + 1);
      restartTimer();
    });
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showSlide(index);
        restartTimer();
      });
    });

    slider.parentElement.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    slider.parentElement.addEventListener('touchend', (event) => {
      const swipeDistance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(swipeDistance) < 40) return;
      showSlide(current + (swipeDistance < 0 ? 1 : -1));
      restartTimer();
    }, { passive: true });

    slider.addEventListener('mouseenter', () => window.clearInterval(timer));
    slider.addEventListener('mouseleave', restartTimer);
    restartTimer();
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert("Thanks for reaching out! We'll get back to you soon.");
      contactForm.reset();
    });
  }

  const cateringForm = document.getElementById('cateringForm');
  if (cateringForm) {
    cateringForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert("Thanks for your enquiry! Our catering team will be in touch with a quote.");
      cateringForm.reset();
    });
  }

  document.body.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'notifyForm') {
      e.preventDefault();
      alert("Thanks! We'll email you the moment merch drops.");
      e.target.reset();
    }
  });
});
