const swiper = new Swiper('.swiper', {
  direction: 'horizontal',
  slidesPerView: 1,
  loop: true,
  // Parmağı bırakınca geçiş hızlı ve akıcı olsun (eskiden 1200 ms ve kullanılmayan paralaks vardı)
  speed: 550,
  grabCursor: true,
  threshold: 6,
  resistanceRatio: 0.6,
  mousewheel: false,
  keyboard: { enabled: true },
  spaceBetween: -1,

  pagination: {
    el: ".swiper-pagination",
    type: "fraction",
  },

  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
});
