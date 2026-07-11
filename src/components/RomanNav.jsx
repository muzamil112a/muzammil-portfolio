const NAV_ITEMS = [
  { id: 'hero', numeral: 'I', label: 'HOME' },
  { id: 'about', numeral: 'II', label: 'ABOUT' },
  { id: 'projects', numeral: 'III', label: 'PROJECTS' },
  { id: 'hub', numeral: 'IV', label: 'HUB' },
  { id: 'contact', numeral: 'V', label: 'CONTACT' },
];

// Fixed vertical section nav, desktop only, mounted at the App root — unlike
// the old horizontal Navbar (which lived inside Experience.jsx's sticky
// canvas and disappeared once scrolled past it), this stays on screen all
// the way through Terminal and Contact too.
//
// Purely presentational: `activeIndex` (0-4) is resolved once, centrally, by
// useActiveSection.js (shared with DiamondNav.jsx) so the two indicators can
// never disagree or lag out of sync with each other. Terminal is a trailing,
// unnumbered footer beyond Contact — deliberately not part of this numbered
// sequence (see SectionNumeral usage, or lack of it, in Terminal.jsx) — so
// it has no nav entry here.
export default function RomanNav({ activeIndex, onNavClick }) {
  return (
    <nav className="roman-nav pointer-events-auto fixed right-8 top-1/2 z-[45] hidden -translate-y-1/2 md:flex lg:right-12">
      {NAV_ITEMS.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={`roman-item ${activeIndex === index ? 'active' : ''}`}
          onClick={() => onNavClick(item.id)}
          aria-current={activeIndex === index ? 'true' : undefined}
        >
          <span className="numeral">{item.numeral}</span>
          <span className="line" aria-hidden="true" />
          <span className="label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
