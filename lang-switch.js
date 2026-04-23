(function () {
  const buttons = document.querySelectorAll('[data-lang-target]');
  const panels = document.querySelectorAll('[data-lang]');

  function activate(lang) {
    buttons.forEach((button) => {
      const active = button.dataset.langTarget === lang;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.lang !== lang;
    });

    document.documentElement.lang = lang === 'ko' ? 'ko' : 'en';
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => activate(button.dataset.langTarget));
  });

  activate('ko');
})();
