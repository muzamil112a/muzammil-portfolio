import SectionNumeral from '../components/SectionNumeral.jsx';

// Sourced from my cv.pdf (Experience + Key Projects sections) — one card per
// distinct body of work, not per bullet point. Set `link` to a GitHub repo /
// live demo / case-study URL to make that card clickable; null renders the
// same card as a plain (non-link) panel.
const PROJECTS = [
  {
    title: 'AI-Powered Workflow Automation',
    description:
      'n8n + Zapier workflows connecting web forms, email, Google Sheets, and AI services; intelligent routing and data extraction.',
    tags: ['n8n', 'Zapier', 'REST APIs', 'AI'],
    index: '01',
    link: null,
  },
  {
    title: 'Pharmacy Management System',
    description:
      'Full-stack app with authentication, inventory, prescriptions, billing, and an analytics dashboard; AI-assisted development.',
    tags: ['Full-Stack', 'Auth', 'Analytics'],
    index: '02',
    link: null,
  },
  {
    title: 'MCP Server Integrations',
    description:
      'Configured MCP servers connecting Claude and other AI models to local files, APIs, and external services — real tool access, not just chat.',
    tags: ['MCP', 'Claude', 'Integrations'],
    index: '03',
    link: null,
  },
  {
    title: 'AI Content & Data Pipelines',
    description:
      'Automated content generation, data extraction, and intelligent routing systems that cut repetitive manual work out of daily operations.',
    tags: ['Automation', 'Data Extraction', 'ChatGPT'],
    index: '04',
    link: null,
  },
];

// Renders a project card as a real anchor (new tab) when `link` is set, or a
// plain div otherwise — identical styling/children either way, so filling in
// a PROJECTS entry's `link` is the only step needed to make a card live.
function CardShell({ link, className, children }) {
  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return <div className={className}>{children}</div>;
}

// Presentational Projects layer: scene-3.png + 2 project cards. Ken Burns +
// parallax on `imgRef`, and this layer's own crossfade opacity, are driven
// centrally by Experience.jsx's master ScrollTrigger. `lineRef`/`cardsRef`/
// `labelsRef` are polish-only additions (entrance stagger, line draw-in,
// label parallax) — their opacity/transform are also written by Experience's
// onUpdate, from the same `projectsLocal` value that already drives Ken
// Burns here, so none of it touches the section's crossfade/opacity math.
export default function Projects({ imgRef, cardsRef, lineRef, labelsRef }) {
  return (
    <>
      <SectionNumeral numeral="III" side="left" />

      <img
        ref={imgRef}
        src="/assets/images/scene-3.webp"
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        style={{
          transform: 'translate(var(--px-x, 0px), var(--px-y, 0px)) scale(var(--kb-scale, 1))',
          willChange: 'transform',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/65 via-black/20 to-black/70" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(150,160,175,0.32) 0%, rgba(8,10,14,0) 65%)',
          filter: 'blur(10px)',
        }}
      />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-6 pb-16 sm:pb-20">
        <div className="mb-5 w-full max-w-4xl">
          <p className="mb-3 font-serif text-[11px] uppercase tracking-[0.5em] text-gold-dim/80">
            Selected Work
          </p>
          <div
            ref={lineRef}
            aria-hidden="true"
            className="h-px w-full origin-left bg-gradient-to-r from-gold-dim via-gold-faint to-transparent"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>

        {/* 2x2 at every width — with four cards, a single mobile column would
            stack taller than the 100vh canvas this layer lives in, so phones
            instead get two compact columns with the descriptions hidden. */}
        <div className="grid w-full max-w-4xl grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-6 sm:gap-y-10">
          {PROJECTS.map((project, i) => (
            <div key={project.title} className="relative">
              <span
                ref={(el) => {
                  if (labelsRef) labelsRef.current[i] = el;
                }}
                aria-hidden="true"
                className="pointer-events-none absolute -top-7 left-0 font-serif text-2xl text-gold-faint opacity-0 sm:text-3xl"
                style={{ willChange: 'transform, opacity' }}
              >
                {project.index}
              </span>

              {/* Entrance wrapper: opacity/translateY here are written every
                  scroll tick by Experience.jsx. Kept separate from the card
                  below so that inline style (which always wins over a
                  Tailwind class in the cascade) never fights the card's own
                  CSS `hover:scale` transform. */}
              <div
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
                className="opacity-0"
                style={{ willChange: 'transform, opacity' }}
              >
                {/* Same card either way; with a `link` it becomes a real
                    anchor (new tab) and advertises itself via cursor. */}
                <CardShell
                  link={project.link}
                  className="group relative block overflow-hidden rounded-sm border border-gold-faint bg-black/40 p-4 backdrop-blur-md transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-gold-dim hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_28px_rgba(201,162,39,0.22)] sm:p-6"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-px origin-left scale-x-50 bg-gradient-to-r from-transparent via-gold-dim to-transparent opacity-60 transition-[transform,opacity] duration-500 ease-out group-hover:scale-x-100 group-hover:opacity-100"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 scale-100 opacity-0 transition-[transform,opacity] duration-500 ease-out group-hover:scale-110 group-hover:opacity-100"
                    style={{
                      background:
                        'radial-gradient(ellipse at 30% 20%, rgba(201,162,39,0.12) 0%, rgba(201,162,39,0) 70%)',
                    }}
                  />

                  <h3 className="relative font-display text-sm tracking-[0.08em] text-gold sm:text-lg">
                    {project.title}
                  </h3>
                  <p className="relative mt-3 hidden font-serif text-sm leading-relaxed text-white/70 sm:block">
                    {project.description}
                  </p>
                  <div className="relative mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-gold-faint bg-[rgba(201,162,39,0.06)] px-2 py-0.5 text-[9px] uppercase tracking-widest text-gold-dim transition-colors duration-300 group-hover:border-gold-dim group-hover:text-gold sm:px-2.5 sm:text-[10px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardShell>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
