import { useEffect, useRef } from "react";

const AUTO_SCROLL_SPEED = 0.5;
const DRAG_THRESHOLD = 4;
const HOVER_READY_DELAY = 150;

export function RecommendationCarousel({ children }) {
  const scrollRef = useRef(null);
  const directionRef = useRef(1);
  const positionRef = useRef(0);
  const hoveredRef = useRef(false);
  const readyRef = useRef(false);
  const wasPausedRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0, scrollStart: 0, moved: false });
  const rafRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return undefined;
    }

    el.scrollLeft = 0;
    positionRef.current = 0;
    directionRef.current = 1;
    hoveredRef.current = false;
    readyRef.current = false;
    wasPausedRef.current = false;

    const readyTimer = setTimeout(() => {
      readyRef.current = true;
    }, HOVER_READY_DELAY);

    function tick() {
      const isPaused = hoveredRef.current || dragRef.current.active;

      if (!isPaused) {
        if (wasPausedRef.current) {
          positionRef.current = el.scrollLeft;
        }

        const maxScroll = el.scrollWidth - el.clientWidth;

        if (maxScroll > 0) {
          positionRef.current += AUTO_SCROLL_SPEED * directionRef.current;

          if (positionRef.current >= maxScroll) {
            positionRef.current = maxScroll;
            directionRef.current = -1;
          } else if (positionRef.current <= 0) {
            positionRef.current = 0;
            directionRef.current = 1;
          }

          el.scrollLeft = positionRef.current;
        }
      }

      wasPausedRef.current = isPaused;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      clearTimeout(readyTimer);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [children]);

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

    const el = scrollRef.current;
    dragRef.current = { active: true, startX: event.pageX, scrollStart: el.scrollLeft, moved: false };
    el.style.cursor = "grabbing";
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

    scrollRef.current.scrollLeft = dragRef.current.scrollStart - delta;
  }

  function handleMouseUp() {
    if (!dragRef.current.active) {
      return;
    }

    dragRef.current.active = false;
    scrollRef.current.style.cursor = "";
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
      ref={scrollRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClickCapture={handleClickCapture}
      className="scrollbar-none mt-6 flex gap-5 overflow-x-auto pb-4"
      style={{ cursor: "grab" }}
    >
      {children}
    </div>
  );
}
