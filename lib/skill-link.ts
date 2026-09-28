/*
  Links a skill in the map to every tag on the page that names it, and back.

  Nothing here goes through React. Every tag and every chip carries `data-skill`
  with the same key; lighting a skill sets `data-lit` on all of them and the styling
  is CSS. One delegated pointer listener on the document covers both directions, so
  the server-rendered tags in Experience and Research need no client code of their own.
*/

export function skillKey(name: string) {
  return name.trim().toLowerCase();
}

function elementsFor(key: string) {
  return document.querySelectorAll<HTMLElement>(`[data-skill="${CSS.escape(key)}"]`);
}

export function lightSkill(key: string) {
  elementsFor(key).forEach((element) => element.setAttribute("data-lit", ""));
}

export function unlightSkill(key: string) {
  elementsFor(key).forEach((element) => element.removeAttribute("data-lit"));
}

export function unlightAll() {
  document
    .querySelectorAll<HTMLElement>("[data-skill][data-lit]")
    .forEach((element) => element.removeAttribute("data-lit"));
}

/**
 * Scroll the first tag (not chip) for this skill into the middle of the viewport.
 * Returns false when the skill is used nowhere on the page but the map itself.
 */
export function scrollToSkillUse(key: string) {
  const target = Array.from(elementsFor(key)).find((element) =>
    element.classList.contains("skill-tag"),
  );
  if (!target) return false;
  target.scrollIntoView({ block: "center", behavior: "smooth" });
  return true;
}

/**
 * Hover on any `[data-skill]` element lights the whole set. Returns the teardown.
 * `isPinned` keeps a set lit after the pointer leaves it.
 */
export function bindSkillHover(isPinned: (key: string) => boolean) {
  const keyOf = (event: Event) =>
    (event.target as Element | null)?.closest<HTMLElement>("[data-skill]")?.dataset.skill;

  const over = (event: Event) => {
    const key = keyOf(event);
    if (key) lightSkill(key);
  };
  const out = (event: Event) => {
    const key = keyOf(event);
    if (key && !isPinned(key)) unlightSkill(key);
  };

  document.addEventListener("pointerover", over);
  document.addEventListener("pointerout", out);
  return () => {
    document.removeEventListener("pointerover", over);
    document.removeEventListener("pointerout", out);
  };
}
