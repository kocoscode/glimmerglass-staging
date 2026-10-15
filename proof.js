// The proof strip's background buttons, as in a bundle's preview.html: each one swaps a class on the stage behind the player, and the stage's layers crossfade in CSS. The player itself is never touched.
(function () {
  var stage = document.getElementById("proof-stage");
  var buttons = document.querySelectorAll(".proof-toggle button");
  Array.prototype.forEach.call(buttons, function (button) {
    button.addEventListener("click", function () {
      stage.className = "proof-stage on-" + button.getAttribute("data-bg");
      Array.prototype.forEach.call(buttons, function (b) { b.setAttribute("aria-pressed", String(b === button)); });
    });
  });
})();
