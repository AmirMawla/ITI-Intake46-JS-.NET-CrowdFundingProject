  

(function () {
  'use strict';

  function closeAll() {
    document.querySelectorAll('.nav-links.is-open').forEach((el) => el.classList.remove('is-open'));
    document.querySelectorAll('.nav-toggle[aria-expanded="true"]').forEach((btn) =>
      btn.setAttribute('aria-expanded', 'false')
    );
  }

  function initNav(nav) {
    const links = nav.querySelector('.nav-links');
    if (!links) return;

    let toggle = nav.querySelector('.nav-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nav-toggle';
      toggle.setAttribute('aria-label', 'Open menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = `
        <span class="nav-toggle-icon" aria-hidden="true"></span>
      `;

      const userActions = nav.querySelector('.user-actions');
      if (userActions) {
        const anchor =
          userActions.querySelector('#userMenu') ||
          userActions.querySelector('#headerUserProfile') ||
          userActions.lastElementChild;
        if (anchor) userActions.insertBefore(toggle, anchor);
        else userActions.appendChild(toggle);
      } else {
        nav.insertBefore(toggle, links);
      }
    }

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (!isOpen) return;

      document.querySelectorAll('.nav-links').forEach((other) => {
        if (other !== links) other.classList.remove('is-open');
      });
      document.querySelectorAll('.nav-toggle').forEach((otherBtn) => {
        if (otherBtn !== toggle) otherBtn.setAttribute('aria-expanded', 'false');
      });
    });

    links.addEventListener('click', (e) => {
      const a = e.target && (e.target.closest ? e.target.closest('a') : null);
      if (a) closeAll();
    });
  }

  document.addEventListener('click', () => closeAll());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav').forEach(initNav);
  });
})();

