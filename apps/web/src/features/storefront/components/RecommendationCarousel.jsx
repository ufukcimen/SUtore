import { Children, cloneElement, useEffect, useRef } from "react";

const AUTO_SCROLL_SPEED = 0.5;
const DRAG_THRESHOLD = 4;
const HOVER_READY_DELAY = 150;

export function RecommendationCarousel({ children }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const cycleWidthRef = useRef(0);
  const hoveredRef = useRef(false);
  const readyRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0, offsetStart: 0, moved: false });
  const rafRef = useRef(null);

  const items = Children.toArray(children);
  const itemCount = items.length;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || itemCount === 0) {
      return undefined;
    }

    // Measure the width of one cycle from the DOM: the distance between
    // the first item of copy 1 and the first item of copy 2.
    const allItems = track.children;
    const cycleWidth =
      allItems.length > itemCount
        ? allItems[itemCount].offsetLeft - allItems[0].offsetLeft
        : track.scrollWidth / 3;
    cycleWidthRef.current = cycleWidth;

    // Start the viewport on the middle copy so there is one full
    // copy of buffer content on each side.
    offsetRef.current = -cycleWidth;
    track.style.transform = `translateX(${-cycleWidth}px)`;

    hoveredRef.current = false;
    readyRef.current = false;

    const readyTimer = setTimeout(() => {
      readyRef.current = true;
    }, HOVER_READY_DELAY);

    function tick() {
      if (!hoveredRef.current && !dragRef.current.active) {
        offsetRef.current -= AUTO_SCROLL_SPEED;

        // When we scroll past the end of the middle copy, silently
        // jump back by one cycle. The content is identical so the
        // reset is invisible.
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

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
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

    if (dragRef.current.active) {
      dragRef.current.active = false;
    }
  }

  function handleMouseDown(event) {
    if (event.button !== 0) {
      return;
    }

    dragRef.current = {
      active: true,
      startX: event.pageX,
      offsetStart: offsetRef.current,
      moved: false,
    };
    viewportRef.current.style.cursor = "grabbing";
  }

  function handleMouseMove(event) {
    if (!dragRef.current.active) {
      return;
    }

    event.preventDefault();
    const delta = event.pageX - dragRef.current.startX;

    if (Math.abs(delta) > DRAG_THRESHOLD) {
      dragRef.current.moved = true;
    }

    let newOffset = dragRef.current.offsetStart + delta;
    const c = cycleWidthRef.current;

    // Normalize the offset so the viewport never reaches the edge of
    // the tripled track. Adjust the drag baseline by the same amount
    // so subsequent mouse-move deltas stay consistent.
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

  function handleMouseUp() {
    if (!dragRef.current.active) {
      return;
    }

    dragRef.current.active = false;
    viewportRef.current.style.cursor = "";
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
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClickCapture={handleClickCapture}
      className="mt-6 overflow-hidden pb-4"
      style={{ cursor: "grab" }}
    >
      <div ref={trackRef} className="flex gap-5" style={{ willChange: "transform" }}>
        {items.map((child, i) => cloneElement(child, { key: `c0-${i}` }))}
        {items.map((child, i) => cloneElement(child, { key: `c1-${i}` }))}
        {items.map((child, i) => cloneElement(child, { key: `c2-${i}` }))}
      </div>
    </div>
  );
}
