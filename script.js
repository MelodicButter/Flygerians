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
    const slides = Array.from(slider.querySelectorAll('.hero-slide, .catering-slide'));
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

  const setupWeb3Forms = (formId, statusId, successMessage) => {
    const form = document.getElementById(formId);
    const status = document.getElementById(statusId);
    if (!form || !status) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      if (!submitButton) return;

      submitButton.disabled = true;
      status.className = 'form-status';
      status.textContent = 'Sending...';

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'The form could not be sent.');
        }

        form.reset();
        status.className = 'form-status form-status-success';
        status.textContent = successMessage;
      } catch (error) {
        status.className = 'form-status form-status-error';
        status.textContent = error instanceof Error
          ? error.message
          : 'The form could not be sent. Please email us directly.';
      } finally {
        submitButton.disabled = false;
      }
    });
  };

  setupWeb3Forms('contactForm', 'contactFormStatus', "Thanks for reaching out! We'll get back to you soon.");
  setupWeb3Forms('cateringForm', 'cateringFormStatus', "Thanks for your enquiry! Our catering team will be in touch with a quote.");

  document.body.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'notifyForm') {
      e.preventDefault();
      alert("Thanks! We'll email you the moment merch drops.");
      e.target.reset();
    }
  });
});
