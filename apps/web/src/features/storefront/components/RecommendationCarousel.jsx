import { Children, cloneElement, useEffect, useRef } from "react";

const AUTO_SCROLL_SPEED = 0.5;
const DRAG_THRESHOLD = 4;
const HOVER_READY_DELAY = 150;
const WHEEL_IDLE_DELAY = 200;

export function RecommendationCarousel({ children }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const cycleWidthRef = useRef(0);
  const hoveredRef = useRef(false);
  const readyRef = useRef(false);
  const wheelActiveRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0, offsetStart: 0, moved: false });
  const rafRef = useRef(null);
  const cleanupDragRef = useRef(null);

  const items = Children.toArray(children);
  const itemCount = items.length;

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || itemCount === 0) {
      return undefined;
    }

    const allItems = track.children;
    const cycleWidth =
      allItems.length > itemCount
        ? allItems[itemCount].offsetLeft - allItems[0].offsetLeft
        : track.scrollWidth / 3;
    cycleWidthRef.current = cycleWidth;

    offsetRef.current = -cycleWidth;
    track.style.transform = `translateX(${-cycleWidth}px)`;

    hoveredRef.current = false;
    readyRef.current = false;
    wheelActiveRef.current = false;

    const readyTimer = setTimeout(() => {
      readyRef.current = true;
    }, HOVER_READY_DELAY);

    // --- Trackpad / wheel support ---

    let wheelTimer = null;

    function handleWheel(event) {
      // Only intercept primarily-horizontal gestures so vertical page
      // scrolling is not blocked.
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
        return;
      }

      event.preventDefault();

      // Keep auto-scroll paused while inertial events are still arriving.
      wheelActiveRef.current = true;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        wheelActiveRef.current = false;
      }, WHEEL_IDLE_DELAY);

      // Apply the horizontal delta to the offset with cycle normalization.
      let newOffset = offsetRef.current - event.deltaX;
      const c = cycleWidth;

      if (c > 0) {
        if (newOffset > -c) {
          newOffset -= c;
        } else if (newOffset <= -2 * c) {
          newOffset += c;
        }
      }

      offsetRef.current = newOffset;
      track.style.transform = `translateX(${newOffset}px)`;
    }

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    // --- Auto-scroll ---

    function tick() {
      if (!hoveredRef.current && !dragRef.current.active && !wheelActiveRef.current) {
        offsetRef.current -= AUTO_SCROLL_SPEED;

        if (offsetRef.current <= -2 * cycleWidth) {
          offsetRef.current += cycleWidth;
        }

        track.style.transform = `translateX(${offsetRef.current}px)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      clearTimeout(readyTimer);
      clearTimeout(wheelTimer);
      viewport.removeEventListener("wheel", handleWheel);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      if (cleanupDragRef.current) {
        cleanupDragRef.current();
      }
    };
  }, [children, itemCount]);

  function handleMouseEnter() {
    if (readyRef.current) {
      hoveredRef.current = true;
    }
  }

  function handleMouseLeave() {
    hoveredRef.current = false;
  }

  function handleMouseDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (cleanupDragRef.current) {
      cleanupDragRef.current();
    }

    dragRef.current = {
      active: true,
      startX: event.pageX,
      offsetStart: offsetRef.current,
      moved: false,
    };
    viewportRef.current.style.cursor = "grabbing";

    function onMove(e) {
      if (!dragRef.current.active) {
        return;
      }

      e.preventDefault();
      const delta = e.pageX - dragRef.current.startX;

      if (Math.abs(delta) > DRAG_THRESHOLD) {
        dragRef.current.moved = true;
      }

      let newOffset = dragRef.current.offsetStart + delta;
      const c = cycleWidthRef.current;

      if (c > 0) {
        if (newOffset > -c) {
          newOffset -= c;
          dragRef.current.offsetStart -= c;
        } else if (newOffset <= -2 * c) {
          newOffset += c;
          dragRef.current.offsetStart += c;
        }
      }

      offsetRef.current = newOffset;
      trackRef.current.style.transform = `translateX(${newOffset}px)`;
    }

    function onUp() {
      dragRef.current.active = false;

      if (viewportRef.current) {
        viewportRef.current.style.cursor = "grab";
      }

      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      cleanupDragRef.current = null;
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);

    cleanupDragRef.current = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }

  function handleClickCapture(event) {
    if (dragRef.current.moved) {
      event.stopPropagation();
      event.preventDefault();
      dragRef.current.moved = false;
    }
  }

  return (
    <div
      ref={viewportRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onClickCapture={handleClickCapture}
      className="mt-6 overflow-hidden py-2"
      style={{ cursor: "grab" }}
    >
      <div ref={trackRef} className="flex gap-7" style={{ willChange: "transform" }}>
        {items.map((child, i) => cloneElement(child, { key: `c0-${i}` }))}
        {items.map((child, i) => cloneElement(child, { key: `c1-${i}` }))}
        {items.map((child, i) => cloneElement(child, { key: `c2-${i}` }))}
      </div>
    </div>
  );
}
