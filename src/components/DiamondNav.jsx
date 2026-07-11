const SECTIONS = ['hero', 'about', 'projects', 'hub', 'contact'];

// Top-center step/pagination indicator — a row of diamonds, one per section,
// same 5-section range as RomanNav.jsx (I-V: hero/about/projects/hub/
// contact). Both consume the same useActiveSection.js value via App.jsx, so
// they update in the same render and can never drift out of sync with each
// other. Desktop only, matching RomanNav's own `md:` breakpoint.
export default function DiamondNav({ activeIndex, onNavClick }) {
  return (
    <nav
      className="pointer-events-auto fixed left-1/2 top-6 z-[45] hidden -translate-x-1/2 items-center gap-4 sm:top-8 md:flex"
      aria-label="Section progress"
    >
      {SECTIONS.map((id, index) => (
        <button
          key={id}
          type="button"
          onClick={() => onNavClick(id)}
          aria-label={id}
          aria-current={activeIndex === index ? 'true' : undefined}
          className={`diamond-dot ${activeIndex === index ? 'active' : ''}`}
        />
      ))}
    </nav>
  );
}
