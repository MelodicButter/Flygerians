document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => nav.classList.remove('open'));
    });
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
