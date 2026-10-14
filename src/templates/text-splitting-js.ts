export const TEXT_SPLITTING_JS = String.raw`import { WORD, CHAR, LINE, CLIP, UNIT } from "./motion-attributes.js";

function clipWrap(inner) {
  const clip = document.createElement("span");
  clip.setAttribute(CLIP, "");
  inner.setAttribute(UNIT, "");
  clip.append(inner);
  return clip;
}

function textNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-motion-ignore],script,style,noscript,textarea,[contenteditable='true']")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let node = walker.nextNode();
  while (node) {
    nodes.push(node);
    node = walker.nextNode();
  }
  return nodes;
}

function existingUnits(el, attribute) {
  return Array.from(el.querySelectorAll("[" + attribute + "][" + UNIT + "]"));
}

function splitByWhitespace(value) {
  return value.split(/(\s+)/).filter(Boolean);
}

export function wrapWords(el) {
  const existing = existingUnits(el, WORD);
  if (existing.length) return existing;
  if (unitsOf(el).length) resetTextSplit(el);
  const units = [];
  for (const node of textNodes(el)) {
    const fragment = document.createDocumentFragment();
    for (const part of splitByWhitespace(node.textContent ?? "")) {
      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part));
        continue;
      }
      const inner = document.createElement("span");
      inner.setAttribute(WORD, "");
      inner.textContent = part;
      fragment.append(clipWrap(inner));
      units.push(inner);
    }
    node.replaceWith(fragment);
  }
  return units;
}

export function wrapChars(el) {
  const existing = existingUnits(el, CHAR);
  if (existing.length) return existing;
  if (unitsOf(el).length) resetTextSplit(el);
  const units = [];
  for (const node of textNodes(el)) {
    const fragment = document.createDocumentFragment();
    for (const part of splitByWhitespace(node.textContent ?? "")) {
      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part));
        continue;
      }
      const word = document.createElement("span");
      word.setAttribute(WORD, "");
      for (const character of Array.from(part)) {
        const inner = document.createElement("span");
        inner.setAttribute(CHAR, "");
        inner.textContent = character;
        word.append(clipWrap(inner));
        units.push(inner);
      }
      fragment.append(word);
    }
    node.replaceWith(fragment);
  }
  return units;
}

export function wrapLines(el) {
  const existing = existingUnits(el, LINE);
  if (existing.length) return existing;
  if (unitsOf(el).length) resetTextSplit(el);
  wrapWords(el);
  const words = Array.from(el.querySelectorAll("[" + WORD + "]"));
  if (!words.length) return [];
  const groups = [];
  let current = [];
  let top = null;
  for (const word of words) {
    const wordTop = word.getBoundingClientRect().top;
    if (top === null || Math.abs(wordTop - top) < 2) {
      current.push(word);
      top = wordTop;
    } else {
      groups.push(current);
      current = [word];
      top = wordTop;
    }
  }
  if (current.length) groups.push(current);
  const units = [];
  for (const group of groups) {
    const first = group[0];
    if (!first) continue;
    const clip = first.closest("[" + CLIP + "]");
    if (!clip?.parentNode) continue;
    const lineClip = document.createElement("span");
    lineClip.setAttribute(CLIP, "");
    lineClip.setAttribute(LINE, "");
    const inner = document.createElement("span");
    inner.setAttribute(LINE, "");
    inner.setAttribute(UNIT, "");
    lineClip.append(inner);
    clip.parentNode.insertBefore(lineClip, clip);
    for (const word of group) {
      const wordClip = word.closest("[" + CLIP + "]");
      if (!wordClip) continue;
      const trailing = wordClip.nextSibling;
      word.removeAttribute(UNIT);
      inner.append(wordClip);
      if (trailing?.nodeType === Node.TEXT_NODE) inner.append(trailing);
    }
    units.push(inner);
  }
  return units;
}

export function unitsOf(el) {
  return Array.from(el.querySelectorAll("[" + UNIT + "]"));
}

/** Unwrap helper-generated nodes before replacing dynamic content or re-splitting. */
export function resetTextSplit(el) {
  const lineUnits = Array.from(el.querySelectorAll("[" + LINE + "][" + UNIT + "]"));
  for (const line of lineUnits) {
    const parent = line.parentNode;
    if (!parent) continue;
    while (line.firstChild) parent.insertBefore(line.firstChild, line);
    line.remove();
  }
  const clips = Array.from(el.querySelectorAll("[" + CLIP + "]"));
  for (const clip of clips) {
    const parent = clip.parentNode;
    if (!parent) continue;
    while (clip.firstChild) parent.insertBefore(clip.firstChild, clip);
    clip.remove();
  }
  const words = Array.from(el.querySelectorAll("[" + WORD + "]"));
  for (const word of words) {
    const parent = word.parentNode;
    if (!parent) continue;
    while (word.firstChild) parent.insertBefore(word.firstChild, word);
    word.remove();
  }
  const chars = Array.from(el.querySelectorAll("[" + CHAR + "]"));
  for (const char of chars) {
    const parent = char.parentNode;
    if (!parent) continue;
    while (char.firstChild) parent.insertBefore(char.firstChild, char);
    char.remove();
  }
  for (const attribute of [WORD, CHAR, LINE, CLIP, UNIT]) {
    el.removeAttribute(attribute);
    for (const child of Array.from(el.querySelectorAll("[" + attribute + "]"))) child.removeAttribute(attribute);
  }
}
`;
