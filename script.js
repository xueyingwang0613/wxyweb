const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const topbar = document.querySelector('.topbar');
const contactWrapper = document.querySelector('.contact-wrapper');
const contactButton = document.querySelector('.contact-button');
const contactPopover = document.querySelector('.contact-popover');
const contactTriggers = document.querySelectorAll('[data-contact-trigger]');
const posterDetailButton = document.querySelector('[data-poster-detail]');
const posterModal = document.querySelector('.poster-modal');
const posterCloseButtons = document.querySelectorAll('[data-poster-close]');
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
let contactCloseTimer;
let posterReturnFocus;

function closeNav() {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}

function getHeaderOffset() {
  return Math.ceil(topbar.getBoundingClientRect().height) + 14;
}

function scrollToTarget(hash) {
  const target = document.getElementById(hash.slice(1));
  if (!target) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targetTop = window.scrollY + target.getBoundingClientRect().top - getHeaderOffset();
  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  });
  window.history.pushState(null, '', hash);
}

function openContact() {
  window.clearTimeout(contactCloseTimer);
  contactWrapper.classList.add('open');
  contactButton.setAttribute('aria-expanded', 'true');
  contactPopover.setAttribute('aria-hidden', 'false');
}

function closeContact() {
  contactWrapper.classList.remove('open');
  contactButton.setAttribute('aria-expanded', 'false');
  contactPopover.setAttribute('aria-hidden', 'true');
}

function scheduleContactClose() {
  window.clearTimeout(contactCloseTimer);
  contactCloseTimer = window.setTimeout(closeContact, 200);
}

function openPosterModal() {
  posterReturnFocus = document.activeElement;
  closeContact();
  posterModal.classList.add('is-open');
  posterModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closePosterModal() {
  posterModal.classList.remove('is-open');
  posterModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (posterReturnFocus && typeof posterReturnFocus.focus === 'function') {
    posterReturnFocus.focus({ preventScroll: true });
  }
}

function isInsideContactZone(event) {
  const buttonRect = contactButton.getBoundingClientRect();
  const popoverRect = contactPopover.getBoundingClientRect();
  const bridgeRect = {
    left: Math.min(buttonRect.left, popoverRect.left),
    right: Math.max(buttonRect.right, popoverRect.right),
    top: buttonRect.bottom,
    bottom: popoverRect.top,
  };
  const { clientX: x, clientY: y } = event;
  const inRect = (rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  return inRect(buttonRect) || inRect(popoverRect) || inRect(bridgeRect);
}

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

nav.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  closeNav();
  window.requestAnimationFrame(() => scrollToTarget(link.getAttribute('href')));
}));

contactButton.addEventListener('click', (event) => {
  event.stopPropagation();
  if (canHover.matches) {
    openContact();
    return;
  }

  if (contactWrapper.classList.contains('open')) {
    closeContact();
  } else {
    openContact();
  }
});

contactTriggers.forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openContact();
    contactButton.focus({ preventScroll: true });
  });

  trigger.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    openContact();
    contactButton.focus({ preventScroll: true });
  });
});

posterDetailButton.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  openPosterModal();
});

posterCloseButtons.forEach((button) => {
  button.addEventListener('click', closePosterModal);
});

contactWrapper.addEventListener('pointerenter', () => {
  if (canHover.matches) {
    openContact();
  }
});

contactWrapper.addEventListener('pointerleave', () => {
  if (canHover.matches) {
    scheduleContactClose();
  }
});

[contactButton, contactPopover].forEach((node) => {
  node.addEventListener('pointerenter', () => {
    if (canHover.matches) {
      openContact();
    }
  });

  node.addEventListener('pointerleave', () => {
    if (canHover.matches) {
      scheduleContactClose();
    }
  });
});

document.addEventListener('click', (event) => {
  if (!contactWrapper.contains(event.target)) {
    closeContact();
  }
});

document.addEventListener('pointermove', (event) => {
  if (!canHover.matches || !contactWrapper.classList.contains('open')) {
    return;
  }

  if (isInsideContactZone(event)) {
    openContact();
  } else {
    scheduleContactClose();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closePosterModal();
    closeContact();
  }
});
