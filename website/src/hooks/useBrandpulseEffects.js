import { useEffect, useLayoutEffect } from 'react';
import Lenis from 'lenis';

export function useBrandpulseEffects(containerRef, styleText, pageTitle) {
  useLayoutEffect(() => {
    document.documentElement.classList.add('js-motion');
    document.documentElement.classList.remove('hero-loaded');

    let styleTag = document.head.querySelector('style[data-brandpulse-styles="true"]');
    let ownsTag = false;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.dataset.brandpulseStyles = 'true';
      document.head.append(styleTag);
      ownsTag = true;
    }

    styleTag.textContent = styleText;

    return () => {
      document.documentElement.classList.remove('hero-loaded');

      if (ownsTag) {
        styleTag.remove();
      }
    };
  }, [styleText]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    document.title = pageTitle;

    const tailwindRuntime = window.tailwind;
    if (tailwindRuntime && typeof tailwindRuntime.refresh === 'function') {
      tailwindRuntime.refresh();
    }

    const root = document.documentElement;
    const cleanupFns = [];
    const timers = new Set();
    const transitionListeners = new Set();

    const schedule = (callback, delay) => {
      const timerId = window.setTimeout(() => {
        timers.delete(timerId);
        callback();
      }, delay);

      timers.add(timerId);
      return timerId;
    };

    const clearTimers = () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
      timers.clear();
    };

    const addListener = (target, type, handler, options) => {
      if (!target) {
        return;
      }

      target.addEventListener(type, handler, options);
      cleanupFns.push(() => target.removeEventListener(type, handler, options));
    };

    const addTransitionListener = (target, handler) => {
      if (!target) {
        return;
      }

      const cleanup = () => {
        target.removeEventListener('transitionend', wrappedHandler);
        transitionListeners.delete(cleanup);
      };

      const wrappedHandler = (event) => {
        cleanup();
        handler(event);
      };

      target.addEventListener('transitionend', wrappedHandler);
      transitionListeners.add(cleanup);
    };

    const clearTransitionListeners = () => {
      transitionListeners.forEach((cleanup) => cleanup());
      transitionListeners.clear();
    };

    const storyNodes = Array.from(container.querySelectorAll('[data-story]'));
    const heroImages = Array.from(container.querySelectorAll('.hero-layer img'));

    root.classList.add('js-motion');
    root.classList.remove('hero-loaded');

    storyNodes.forEach((node) => {
      node.classList.remove('is-visible');

      const delay = node.dataset.storyDelay;
      if (delay) {
        node.style.setProperty('--story-delay', `${delay}ms`);
      }
    });

    const readyHero = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          root.classList.add('hero-loaded');
        });
      });
    };

    const waitForImageReady = (image) => {
      const decodeImage = () => {
        if (typeof image.decode === 'function') {
          return image.decode().catch(() => {});
        }

        return Promise.resolve();
      };

      if (image.complete) {
        return image.naturalWidth > 0 ? decodeImage() : Promise.resolve();
      }

      return new Promise((resolve) => {
        const handleLoad = () => {
          decodeImage().finally(resolve);
        };

        image.addEventListener('load', handleLoad, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    };

    Promise.all(heroImages.map(waitForImageReady)).then(readyHero);

    const observer = new IntersectionObserver(
      (entries, watcher) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('is-visible');
          watcher.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px',
      },
    );

    storyNodes.forEach((node) => observer.observe(node));
    cleanupFns.push(() => observer.disconnect());

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.1,
      allowNestedScroll: true,
      prevent: (node) => node instanceof Element && Boolean(node.closest('[data-lenis-prevent]')),
    });

    let rafId = 0;

    const onAnimationFrame = (time) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(onAnimationFrame);
    };

    rafId = window.requestAnimationFrame(onAnimationFrame);
    cleanupFns.push(() => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }

      lenis.destroy();
    });

    const hashLinks = Array.from(container.querySelectorAll('a[href^="#"]'));

    hashLinks.forEach((link) => {
      addListener(link, 'click', (event) => {
        const href = link.getAttribute('href');
        if (!href) {
          return;
        }

        event.preventDefault();

        if (href === '#') {
          return;
        }

        const target = container.querySelector(href) || document.querySelector(href);
        if (!target) {
          return;
        }

        lenis.scrollTo(target, { offset: -24, duration: 1.05 });
      });
    });

    let activeOverlay = null;

    const lockOverlay = (overlayName, { stopLenis = true } = {}) => {
      activeOverlay = overlayName;
      document.body.style.overflow = 'hidden';

      if (stopLenis) {
        lenis.stop();
      }
    };

    const unlockOverlay = (overlayName, { stopLenis = true } = {}) => {
      if (activeOverlay !== overlayName) {
        return;
      }

      activeOverlay = null;
      document.body.style.overflow = '';

      if (stopLenis) {
        lenis.start();
      }
    };

    const folioModal = container.querySelector('#folio-modal');
    const folioModalInner = container.querySelector('#folio-modal-inner');
    const folioModalImg = container.querySelector('#folio-modal-img');
    const folioModalName = container.querySelector('#folio-modal-name');
    const folioModalClose = container.querySelector('#folio-modal-close');
    const folioModalBackdrop = container.querySelector('#folio-modal-backdrop');
    const contactModal = container.querySelector('#contact-modal');
    const contactModalShell = container.querySelector('.contact-modal-shell');
    const contactModalClose = container.querySelector('#contact-modal-close');
    const contactModalBackdrop = container.querySelector('#contact-modal-backdrop');
    const contactForm = container.querySelector('#contact-form');
    const contactNameInput = container.querySelector('#contact-name');
    const contactSuccess = container.querySelector('#contact-success');
    const contactSuccessSummary = container.querySelector('#contact-success-summary');
    const contactSuccessReset = container.querySelector('#contact-success-reset');
    const contactEyebrow = container.querySelector('#contact-modal-eyebrow');
    const contactHeading = container.querySelector('#contact-modal-heading');
    const contactCopy = container.querySelector('#contact-modal-copy');
    const contactFormIntroCopy = container.querySelector('#contact-form-intro-copy');
    const contactDetailsField = container.querySelector('textarea[name="details"]');
    const contactIntentInputs = Array.from(container.querySelectorAll('[data-contact-choice]'));
    const contactTriggers = Array.from(container.querySelectorAll('[data-contact-open]'));

    let folioScrollActive = false;
    let currentContactIntent = 'general';
    let lastContactTrigger = null;

    const shouldAutoFocusContactName = () => !window.matchMedia('(max-width: 560px)').matches;

    const contactPresets = {
      general: {
        eyebrow: 'Contact',
        heading: 'Tell us about your project.',
        copy: 'Use this for a website inquiry, a discovery call, or both.',
        introCopy: 'We set this based on the button you clicked. Change it if you need something different.',
        detailsPlaceholder: 'Tell us what you need, what you are working with today, and anything time-sensitive.',
        choice: 'both',
      },
      website: {
        eyebrow: 'Website inquiry',
        heading: 'Tell us about the site you want to build.',
        copy: 'Share the essentials and we can map the right scope from there.',
        introCopy: 'Website project is preselected for you. Switch it if you need a different starting point.',
        detailsPlaceholder: 'What should the site help with, what do you have today, and what would make this successful?',
        choice: 'website',
      },
      call: {
        eyebrow: 'Discovery call',
        heading: 'Set up a discovery call.',
        copy: 'Tell us what you want to cover and when you would like to connect.',
        introCopy: 'Discovery call is preselected for you. Switch it if the conversation also includes project work.',
        detailsPlaceholder: 'What do you want to talk through, and what days or times tend to work best?',
        choice: 'call',
      },
      both: {
        eyebrow: 'Project + call',
        heading: 'Tell us about the project and the call.',
        copy: 'Share the brief and the meeting window in one note.',
        introCopy: 'Project + call is preselected for you. Keep it if you want to cover both in one message.',
        detailsPlaceholder: 'Tell us what the project needs, what you have today, and when you would like to connect.',
        choice: 'both',
      },
    };

    const applyContactPreset = (intentKey = 'general') => {
      const preset = contactPresets[intentKey] || contactPresets.general;
      currentContactIntent = intentKey;

      if (contactEyebrow) {
        contactEyebrow.textContent = preset.eyebrow;
      }

      if (contactHeading) {
        contactHeading.textContent = preset.heading;
      }

      if (contactCopy) {
        contactCopy.textContent = preset.copy;
      }

      if (contactFormIntroCopy) {
        contactFormIntroCopy.textContent = preset.introCopy;
      }

      if (contactDetailsField) {
        contactDetailsField.placeholder = preset.detailsPlaceholder;
      }

      contactIntentInputs.forEach((input) => {
        input.checked = input.dataset.contactChoice === preset.choice;
      });
    };

    const stopFolioScroll = () => {
      folioScrollActive = false;
      clearTimers();
      clearTransitionListeners();
    };

    const startFolioScroll = (delayMs) => {
      stopFolioScroll();
      folioScrollActive = true;

      const runCycle = () => {
        if (!folioScrollActive || !folioModalImg) {
          return;
        }

        const imageHeight = folioModalImg.naturalHeight || folioModalImg.offsetHeight;
        const viewportHeight = folioModalImg.parentElement?.offsetHeight || 0;
        const cropOffset = Number.parseFloat(folioModalImg.dataset.cropOffset || '0') || 0;
        const scrollDistance = Math.max(0, imageHeight - viewportHeight + cropOffset);

        if (scrollDistance <= 0) {
          return;
        }

        const scrollDuration = Math.max(600, scrollDistance * 10);

        folioModalImg.style.transition = `transform ${scrollDuration}ms cubic-bezier(0.37, 0, 0.63, 1)`;
        folioModalImg.style.transform = `translateY(${cropOffset - scrollDistance}px)`;

        addTransitionListener(folioModalImg, () => {
          if (!folioScrollActive) {
            return;
          }

          schedule(() => {
            if (!folioScrollActive) {
              return;
            }

            folioModalImg.style.transition = `transform ${scrollDuration * 0.4}ms cubic-bezier(0.37, 0, 0.63, 1)`;
            folioModalImg.style.transform = `translateY(${cropOffset}px)`;

            addTransitionListener(folioModalImg, () => {
              if (!folioScrollActive) {
                return;
              }

              schedule(runCycle, 320);
            });
          }, 450);
        });
      };

      schedule(runCycle, delayMs);
    };

    const openFolioModal = (cardBody) => {
      if (!folioModal || !folioModalInner || !folioModalImg || !folioModalName) {
        return;
      }

      if (contactModal?.classList.contains('is-open')) {
        closeContactModal({ restoreFocus: false });
      }

      const imageElement = cardBody.querySelector('.folio-img');
      const labelElement = cardBody.querySelector('.folio-label-name');
      const backgroundColor = window.getComputedStyle(cardBody).getPropertyValue('--folio-bg').trim() || '#333';
      const cropOffsetValue = window.getComputedStyle(cardBody).getPropertyValue('--folio-crop-offset').trim() || '0px';
      const cropOffset = Number.parseFloat(cropOffsetValue) || 0;
      const imageSource = imageElement?.src || '';
      const name = labelElement?.textContent || '';

      stopFolioScroll();

      folioModalImg.style.transition = 'none';
      folioModalImg.dataset.cropOffset = String(cropOffset);
      folioModalImg.style.setProperty('--folio-crop-offset', `${cropOffset}px`);
      folioModalImg.style.transform = `translateY(${cropOffset}px)`;
      folioModalImg.src = imageSource;
      folioModalImg.alt = name;
      folioModalName.textContent = name;
      folioModalInner.style.setProperty('--modal-bg', backgroundColor);
      folioModalInner.style.background = backgroundColor;

      folioModal.classList.add('is-open');
      lockOverlay('folio');

      if (folioModalImg.complete && folioModalImg.naturalHeight > 0) {
        startFolioScroll(80);
      } else {
        folioModalImg.addEventListener('load', () => startFolioScroll(80), { once: true });
      }
    };

    const closeFolioModal = () => {
      if (!folioModal || !folioModalImg) {
        return;
      }

      stopFolioScroll();
      folioModal.classList.remove('is-open');
      unlockOverlay('folio');
      schedule(() => {
        if (!folioModal.classList.contains('is-open')) {
          folioModalImg.src = '';
        }
      }, 220);
    };

    const closeContactModal = ({ restoreFocus = true } = {}) => {
      if (!contactModal) {
        return;
      }

      contactModal.classList.remove('is-open');
      contactModal.setAttribute('aria-hidden', 'true');
      unlockOverlay('contact', { stopLenis: false });

      if (restoreFocus && lastContactTrigger instanceof HTMLElement) {
        schedule(() => lastContactTrigger?.focus(), 60);
      }
    };

    const openContactModal = (intentKey = 'general', trigger = null) => {
      if (!contactModal || !contactForm || !contactSuccess) {
        return;
      }

      if (folioModal?.classList.contains('is-open')) {
        closeFolioModal();
      }

      lastContactTrigger = trigger;
      contactForm.reset();
      contactForm.hidden = false;
      contactSuccess.hidden = true;

      if (contactSuccessSummary) {
        contactSuccessSummary.textContent = '';
      }

      applyContactPreset(intentKey);

      if (contactModal) {
        contactModal.scrollTop = 0;
      }

      if (contactModalShell) {
        contactModalShell.scrollTop = 0;
      }

      contactModal.classList.add('is-open');
      contactModal.setAttribute('aria-hidden', 'false');
      lockOverlay('contact', { stopLenis: false });

      if (shouldAutoFocusContactName()) {
        schedule(() => {
          contactNameInput?.focus();
        }, 120);
      }
    };

    contactTriggers.forEach((trigger) => {
      addListener(trigger, 'click', (event) => {
        event.preventDefault();
        openContactModal(trigger.dataset.contactIntent || 'general', trigger);
      });
    });

    contactIntentInputs.forEach((input) => {
      addListener(input, 'change', () => {
        if (!input.checked) {
          return;
        }

        applyContactPreset(input.dataset.contactChoice || 'general');
      });
    });

    addListener(contactForm, 'submit', (event) => {
      event.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const formData = new FormData(contactForm);
      const summaryParts = [];
      const name = formData.get('name');
      const business = formData.get('business');
      const inquiryType = formData.get('inquiryType');
      const timeline = formData.get('timeline');

      if (name) {
        summaryParts.push(`${name}`);
      }

      if (business) {
        summaryParts.push(`from ${business}`);
      }

      if (inquiryType) {
        summaryParts.push(`is looking for ${String(inquiryType).toLowerCase()}`);
      }

      if (timeline) {
        summaryParts.push(`with a timeline of ${String(timeline).toLowerCase()}`);
      }

      if (contactSuccessSummary) {
        contactSuccessSummary.textContent = summaryParts.length
          ? `${summaryParts.join(' ')}.`
          : 'Your inquiry is staged and ready for the next step.';
      }

      contactForm.hidden = true;
      contactSuccess.hidden = false;
    });

    addListener(contactSuccessReset, 'click', () => {
      if (!contactForm || !contactSuccess) {
        return;
      }

      contactForm.reset();
      contactSuccess.hidden = true;
      contactForm.hidden = false;
      applyContactPreset(currentContactIntent);

      if (shouldAutoFocusContactName()) {
        schedule(() => contactNameInput?.focus(), 40);
      }
    });

    Array.from(container.querySelectorAll('.folio-card-body')).forEach((cardBody) => {
      addListener(cardBody, 'click', () => openFolioModal(cardBody));
    });

    addListener(folioModalClose, 'click', closeFolioModal);
    addListener(folioModalBackdrop, 'click', closeFolioModal);
    addListener(contactModalClose, 'click', () => closeContactModal());
    addListener(contactModalBackdrop, 'click', () => closeContactModal());
    addListener(contactModalShell, 'click', (event) => {
      if (event.target === contactModalShell) {
        closeContactModal();
      }
    });
    addListener(document, 'keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (contactModal?.classList.contains('is-open')) {
        closeContactModal();
        return;
      }

      if (folioModal?.classList.contains('is-open')) {
        closeFolioModal();
      }
    });

    return () => {
      stopFolioScroll();
      document.body.style.overflow = '';
      root.classList.remove('hero-loaded');
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, [containerRef, pageTitle]);
}
