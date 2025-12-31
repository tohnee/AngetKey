import { Coordinates } from '../types';

/**
 * Calculates the pixel coordinates of the caret in a textarea.
 * This simulates the Accessibility API coordinate retrieval described in the PRD.
 */
export const getCaretCoordinates = (
  element: HTMLTextAreaElement,
  position: number
): Coordinates => {
  const div = document.createElement('div');
  const style = window.getComputedStyle(element);

  // Copy relevant styles to the mirror div
  Array.from(style).forEach((prop) => {
    div.style.setProperty(prop, style.getPropertyValue(prop));
  });

  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.overflow = 'hidden'; 
  
  // Specific geometry replication
  div.style.width = `${element.clientWidth}px`;
  div.style.height = 'auto'; // Let it expand to find height

  // Content up to the caret
  const textContent = element.value.substring(0, position);
  div.textContent = textContent;

  // Add a span to mark the caret position
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.'; // Ensure span has height
  div.appendChild(span);

  document.body.appendChild(div);

  const spanOffset = span.offsetTop;
  const spanLeft = span.offsetLeft;

  // Clean up
  document.body.removeChild(div);

  // Calculate absolute position relative to the viewport
  const rect = element.getBoundingClientRect();
  
  // Adjust for scroll
  const top = rect.top + spanOffset - element.scrollTop;
  const left = rect.left + spanLeft - element.scrollLeft;

  return {
    top: top + window.scrollY,
    left: left + window.scrollX,
    height: parseInt(style.lineHeight) || 20
  };
};
