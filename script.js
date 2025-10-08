const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

const slides = document.querySelectorAll('.slide-image');
  let current = 0;

  function showNextSlide() {
    const currentSlide = slides[current];
    const next = (current + 1) % slides.length;
    const nextSlide = slides[next];

    currentSlide.classList.remove('active');
    currentSlide.classList.add('out-left');
    nextSlide.classList.add('active');

    // Wait for transition to finish before resetting old slide
    setTimeout(() => {
      currentSlide.classList.remove('out-left');
    }, 1000); // match CSS transition time

    current = next;
  }

  setInterval(showNextSlide, 5000);