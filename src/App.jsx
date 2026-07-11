import { useRef, useState } from 'react';
import useAudioManager from './hooks/useAudioManager.js';
import useActiveSection from './hooks/useActiveSection.js';
import Loading from './sections/Loading.jsx';
import Contact from './sections/Contact.jsx';
import Terminal from './sections/Terminal.jsx';
import Experience from './components/Experience.jsx';
import MuteToggle from './components/MuteToggle.jsx';
import CustomCursor from './components/CustomCursor.jsx';
import RomanNav from './components/RomanNav.jsx';
import DiamondNav from './components/DiamondNav.jsx';
import Subtitles from './components/Subtitles.jsx';

// Composition root: a single audio-engine instance is created here and
// shared by Loading (entry gate + narration-1 + gate creak) and Experience
// (narrations 2-4, keyed to scroll position). Experience/Terminal are always
// mounted — Loading's own `fixed inset-0 z-50` overlay (plus its `no-scroll`
// body class) is what keeps them inert and hidden until ENTER is clicked.
//
// RomanNav/DiamondNav are siblings of Experience, not children, so they can
// stay mounted (and visible) across the whole page — including past
// Experience's own sticky canvas, into Terminal/Contact — rather than
// disappearing once scrolled past it. `experienceRef` lets them trigger
// Experience's existing section-scroll logic despite not being its child.
// `experienceIndex` flows the other way (Experience's own crossfade-layer
// progress); useActiveSection folds in Contact's own IntersectionObserver on
// top of that into one shared 0-4 value so every nav indicator agrees.
export default function App() {
  const audio = useAudioManager();
  const experienceRef = useRef(null);
  const [experienceIndex, setExperienceIndex] = useState(0);
  const activeSection = useActiveSection(experienceIndex);

  const handleNavClick = (id) => experienceRef.current?.scrollToSection(id);

  return (
    <div className="relative w-full bg-fog-900">
      <main>
        <Experience ref={experienceRef} audio={audio} onActiveSectionChange={setExperienceIndex} />
        <Contact />
        <Terminal audio={audio} />
      </main>
      <Loading audio={audio} />
      <Subtitles />
      <MuteToggle audio={audio} />
      <CustomCursor />
      <RomanNav activeIndex={activeSection} onNavClick={handleNavClick} />
      <DiamondNav activeIndex={activeSection} onNavClick={handleNavClick} />
    </div>
  );
}
