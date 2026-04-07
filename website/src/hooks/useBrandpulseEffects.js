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
    const heroImages = Array.from(container.querySelectorAll('.hero-background img'));

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

    Promise.race([
      Promise.all(heroImages.map(waitForImageReady)),
      new Promise((resolve) => schedule(resolve, 1400)),
    ]).then(readyHero);

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

    const folioModal = container.querySelector('#folio-modal');
    const folioModalInner = container.querySelector('#folio-modal-inner');
    const folioModalImg = container.querySelector('#folio-modal-img');
    const folioModalName = container.querySelector('#folio-modal-name');
    const folioModalClose = container.querySelector('#folio-modal-close');
    const folioModalBackdrop = container.querySelector('#folio-modal-backdrop');

    let folioScrollActive = false;

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
      document.body.style.overflow = 'hidden';
      lenis.stop();

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
      document.body.style.overflow = '';
      lenis.start();
      schedule(() => {
        if (!folioModal.classList.contains('is-open')) {
          folioModalImg.src = '';
        }
      }, 220);
    };

    Array.from(container.querySelectorAll('.folio-card-body')).forEach((cardBody) => {
      addListener(cardBody, 'click', () => openFolioModal(cardBody));
    });

    addListener(folioModalClose, 'click', closeFolioModal);
    addListener(folioModalBackdrop, 'click', closeFolioModal);
    addListener(document, 'keydown', (event) => {
      if (event.key === 'Escape' && folioModal?.classList.contains('is-open')) {
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
