# Accessibility (a11y) Conformance — GRACE

## 1. Elder-First Design Principles

Older adults may experience visual impairments, tremors, cognitive fatigue, or unfamiliarity with complex mobile interfaces. GRACE was engineered specifically to reduce cognitive load and make the next healthcare action effortless:

1. **Large, High-Contrast Typography**:
   - Primary elder-facing views feature base font sizes of 20px+ with bold headings up to 48px.
   - Text colors strictly exceed WCAG 2.2 AA contrast ratios ($> 4.5:1$ for normal text, $> 7:1$ for key headers).
2. **Generous Touch Targets**:
   - Interactive buttons on the Today dashboard have minimum dimensions of $56\text{px} \times 56\text{px}$, well above the 44px WCAG requirement.
3. **Uncluttered "What Next?" Hierarchy**:
   - The Today screen immediately answers:
     1. What medicine or routine is due next?
     2. What time is it scheduled for?
     3. What specific instructions apply (e.g. "after breakfast")?
     4. How do I confirm taking it in a single tap?
4. **Non-Shaming, Dignified Language**:
   - Missed items avoid punitive or alarmist copy. Clear, respectful labels like "Past Due" or "Took Late" preserve elder dignity while maintaining clinical transparency.
5. **Screen Reader & Keyboard Accessibility**:
   - Logical semantic landmarks (`<header>`, `<nav>`, `<main>`, `<section>`).
   - Visible 3px blue focus indicators (`:focus-visible`).
   - `aria-live="polite"` feedback regions for asynchronous action confirmations.
   - Respects `prefers-reduced-motion` to avoid disorienting animations.
