// The phone menu (29 October 2026): at phone widths the header's links fold behind a "Menu" button. The button is
// added here, so without scripts the links simply wrap in a row as before; the stylesheet only folds the nav once
// the header carries `has-menu`. On wider screens the button is hidden and the nav shows as usual.
// Escape closes the menu and puts focus back on the button; so does a click or tap outside the header.
(function () {
  var header = document.querySelector("header");
  var nav = header && header.querySelector('nav[aria-label="Main"]');
  if (!nav) return;
  nav.id = nav.id || "site-nav";
  var button = document.createElement("button");
  button.type = "button";
  button.className = "menu-toggle";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", nav.id);
  button.innerHTML = '<span class="menu-icon" aria-hidden="true"></span>Menu';
  header.insertBefore(button, nav);
  header.classList.add("has-menu");

  function setOpen(open, returnFocus) {
    button.setAttribute("aria-expanded", String(open));
    header.classList.toggle("menu-open", open);
    if (!open && returnFocus) button.focus();
  }
  button.addEventListener("click", function () {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && header.classList.contains("menu-open")) setOpen(false, nav.contains(document.activeElement) || document.activeElement === button);
  });
  document.addEventListener("click", function (event) {
    if (header.classList.contains("menu-open") && !header.contains(event.target)) setOpen(false);
  });
})();
