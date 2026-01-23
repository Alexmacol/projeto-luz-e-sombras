export function initMobileMenu() {
  const menuMobileBtn = document.querySelector(".menu-mobile__btn");
  const line1 = document.querySelector(".menu-mobile__line1");
  const line2 = document.querySelector(".menu-mobile__line2");
  const menuMobile = document.querySelector(".menu__mobile");
  const body = document.querySelector("body");

  if (menuMobileBtn && menuMobile) {
    menuMobileBtn.addEventListener("click", () => {
      line1.classList.toggle("--ativo1");
      line2.classList.toggle("--ativo2");
      menuMobile.classList.toggle("abrir");
      body.classList.toggle("no-overflow");
    });
  }
}
