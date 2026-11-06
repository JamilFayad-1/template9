/** Animated native disclosures with a reserved group height, so surrounding content stays put. */
export function createDisclosures(root, { motionAllowed, onResize }) {
  const groups = [...root.querySelectorAll('.services, .contact-faq-grid')];
  const cleanups = [];
  let destroyed = false;

  groups.forEach(group => {
    const items = [...group.querySelectorAll(':scope > details')].map(details => ({
      details,
      summary: details.querySelector('summary'),
      content: [...details.children].find(child => child.tagName !== 'SUMMARY'),
      expanded: details.open,
      animation: null,
      contentAnimation: null,
      full: 0,
      collapsed: 0,
    }));
    if (!items.length) return;
    // One answer is open at a time; the space for the largest answer is always reserved.
    let foundOpen = false;
    items.forEach(item => {
      if (item.expanded && foundOpen) item.details.open = item.expanded = false;
      if (item.expanded) foundOpen = true;
      item.summary.setAttribute('aria-expanded', String(item.expanded));
    });

    function finish(item) {
      item.animation?.cancel(); item.contentAnimation?.cancel();
      item.animation = item.contentAnimation = null;
      item.details.open = item.expanded;
      item.details.style.height = ''; item.details.style.overflow = '';
    }
    function measure() {
      if (destroyed || !group.isConnected) return;
      items.forEach(item => {
        finish(item);
        const probe = item.details.cloneNode(true);
        probe.open = true; probe.inert = true; probe.setAttribute('aria-hidden', 'true');
        probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:${item.details.getBoundingClientRect().width}px;height:auto;overflow:visible;`;
        group.append(probe);
        item.full = probe.getBoundingClientRect().height;
        probe.open = false;
        item.collapsed = probe.getBoundingClientRect().height;
        probe.remove();
      });
      const styles = getComputedStyle(group);
      const columns = styles.display === 'grid' ? styles.gridTemplateColumns.split(' ').filter(Boolean).length : 1;
      const rows = Math.ceil(items.length / columns);
      const collapsed = columns === 1 ? items.reduce((sum, item) => sum + item.collapsed, 0) : Math.max(...items.map(item => item.collapsed));
      const extra = Math.max(...items.map(item => item.full - item.collapsed));
      const gap = parseFloat(styles.rowGap) || 0;
      group.style.height = `${Math.ceil(collapsed + extra + (rows - 1) * gap)}px`;
      group.classList.add('disclosure-group');
      onResize();
    }
    function setExpanded(item, expanded) {
      const from = item.details.getBoundingClientRect().height;
      item.animation?.cancel(); item.contentAnimation?.cancel();
      item.expanded = expanded; item.summary.setAttribute('aria-expanded', String(expanded));
      if (!motionAllowed()) { finish(item); onResize(); return; }
      item.details.style.height = `${from}px`; item.details.style.overflow = 'hidden';
      item.details.open = true;
      const to = expanded ? item.full : item.collapsed;
      const animation = item.details.animate([{ height: `${from}px` }, { height: `${to}px` }], {
        duration: 400, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards',
      });
      item.animation = animation;
      if (item.content) item.contentAnimation = item.content.animate([
        { opacity: expanded ? 0 : 1, transform: expanded ? 'translateY(-6px)' : 'translateY(0)' },
        { opacity: expanded ? 1 : 0, transform: expanded ? 'translateY(0)' : 'translateY(-6px)' },
      ], { duration: 300, easing: 'ease-out' });
      animation.onfinish = () => { if (item.animation === animation) { finish(item); onResize(); } };
    }
    const handlers = items.map(item => {
      const handler = event => {
        event.preventDefault();
        const expanded = !item.expanded;
        if (expanded) items.filter(other => other !== item && other.expanded).forEach(other => setExpanded(other, false));
        setExpanded(item, expanded);
      };
      item.summary.addEventListener('click', handler);
      return [item.summary, handler];
    });
    let lastWidth = 0;
    const observer = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      if (Math.abs(width - lastWidth) > .5) { lastWidth = width; measure(); }
    });
    observer.observe(group);
    measure();
    document.fonts.ready.then(() => { if (!destroyed) measure(); });
    cleanups.push({
      refresh() { if (!motionAllowed()) items.forEach(finish); },
      destroy() { observer.disconnect(); handlers.forEach(([summary, handler]) => summary.removeEventListener('click', handler)); items.forEach(finish); group.style.height = ''; },
    });
  });
  return {
    refresh() { cleanups.forEach(group => group.refresh()); },
    destroy() { destroyed = true; cleanups.forEach(group => group.destroy()); },
  };
}
