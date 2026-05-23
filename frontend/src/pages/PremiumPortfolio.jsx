import React from 'react';
import { Link } from 'react-router-dom';
import { cvSkills, experience, profile, projects } from '../data/profile';
import { readStore } from '../utils/storage';
import '../premium-portfolio.css';

const defaultPhoto = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#38bdf8"/><stop offset=".55" stop-color="#2563eb"/><stop offset="1" stop-color="#7c3aed"/></linearGradient>
    <radialGradient id="r" cx="50%" cy="20%" r="70%"><stop stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="420" height="420" rx="86" fill="#020617"/>
  <rect width="420" height="420" rx="86" fill="url(#g)" opacity=".42"/>
  <circle cx="210" cy="150" r="72" fill="#f8fafc" opacity=".94"/>
  <path d="M76 350c22-82 78-126 134-126s112 44 134 126" fill="#f8fafc" opacity=".94"/>
  <rect width="420" height="420" rx="86" fill="url(#r)"/>
  <text x="210" y="389" text-anchor="middle" font-family="Arial" font-size="34" font-weight="900" fill="#fff">AK</text>
</svg>`)};`;

const metrics = [
  { value: '2+', label: 'Years Salesforce + Tech Experience' },
  { value: '90%+', label: 'Apex Test Coverage Focus' },
  { value: '60%', label: 'Manual Effort Reduction' },
  { value: '40%', label: 'Deployment Efficiency Gain' },
];

const serviceCards = [
  ['Salesforce Development', 'Apex, LWC, SOQL, SOSL, Visualforce and reusable component-driven CRM features.'],
  ['Automation & Flow', 'Business process automation using Flow, validation, approvals and clean admin configuration.'],
  ['Integration Ready', 'REST API, JSON, external services, secure integration patterns and deployment support.'],
  ['Production Mindset', 'Security, sharing, test coverage, UAT support, bug fixing and release readiness.'],
];

const recruiterBullets = [
  'Salesforce Developer focused on Apex, LWC, Flow, REST API and CRM delivery.',
  'Built healthcare and real estate Salesforce projects with role-based access and reporting.',
  'Experienced with data operations, IoT reporting, Python automation and business dashboards.',
  'Interview-ready portfolio with measurable business impact and practical project explanations.',
];

function CareerWatch() {
  const [now, setNow] = React.useState(new Date());
  const [endAt, setEndAt] = React.useState(null);
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const left = endAt ? Math.max(0, endAt - now.getTime()) : 0;
  const min = Math.floor(left / 60000);
  const sec = Math.floor((left % 60000) / 1000);
  return <aside className="portfolioCareerWatch">
    <div className="watchTop"><span>Career Watch</span><b>Live</b></div>
    <strong>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
    <p>{now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
    <div className="watchButtons">
      <button type="button" onClick={() => setEndAt(Date.now() + 25 * 60000)}>25m Focus</button>
      <button type="button" onClick={() => setEndAt(Date.now() + 45 * 60000)}>45m Sprint</button>
      <button type="button" onClick={() => setEndAt(null)}>Reset</button>
    </div>
    <small>{endAt ? (left > 0 ? `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')} remaining` : 'Sprint complete. Take 5 min break.') : 'Ready for study sprint'}</small>
  </aside>;
}

export function PremiumPortfolio() {
  const photo = readStore('profilePhoto', defaultPhoto);
  const allSkills = Object.values(cvSkills).flat();

  return <main className="premiumPortfolioV2">
    <nav className="premiumNav">
      <a href="#top" className="premiumBrand"><span>AK</span><b>Abhishek Portfolio</b></a>
      <div>
        <a href="#projects">Projects</a>
        <a href="#skills">Skills</a>
        <a href="#experience">Experience</a>
        <Link className="navLogin" to="/login">Career OS Login</Link>
      </div>
    </nav>

    <section id="top" className="premiumHeroV2">
      <div className="heroGlow one" />
      <div className="heroGlow two" />
      <div className="heroCopyV2">
        <p className="premiumEyebrow">Salesforce Developer Portfolio</p>
        <h1>{profile.name}</h1>
        <h2>{profile.headline}</h2>
        <p className="heroSummaryV2">{profile.summary}</p>
        <div className="heroActionsV2">
          <a className="primaryCta" href={`mailto:${profile.email}`}>Hire / Contact Me</a>
          <a className="secondaryCta" href="#projects">View Projects</a>
          <a className="secondaryCta" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a className="secondaryCta" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <div className="premiumMetricGrid">
          {metrics.map(item => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
        </div>
      </div>

      <aside className="premiumProfileV2">
        <div className="photoShell"><img src={photo} alt={profile.name} /></div>
        <p className="profileBadge">Open to Salesforce Developer roles</p>
        <h3>{profile.role}</h3>
        <p>{profile.location}</p>
        <div className="profileLinksV2">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <a href={`tel:${profile.phone}`}>{profile.phone}</a>
          <a href={profile.trailhead} target="_blank" rel="noreferrer">Trailhead</a>
        </div>
      </aside>
    </section>

    <CareerWatch />

    <section className="premiumTrustStrip">
      <span>Admin + Developer</span><span>Apex + LWC</span><span>Flow Automation</span><span>REST Integration</span><span>UAT + Deployment</span>
    </section>

    <section className="recruiterPanelV2">
      <div>
        <p className="premiumEyebrow">Recruiter 60-second view</p>
        <h2>CRM developer who can convert requirements into working Salesforce features.</h2>
      </div>
      <ul>{recruiterBullets.map(item => <li key={item}>{item}</li>)}</ul>
    </section>

    <section className="premiumSectionV2">
      <div className="sectionTitleV2"><p className="premiumEyebrow">What I bring</p><h2>Premium delivery strengths</h2></div>
      <div className="serviceGridV2">
        {serviceCards.map(([title, text]) => <article key={title}><span>{title.slice(0, 2)}</span><h3>{title}</h3><p>{text}</p></article>)}
      </div>
    </section>

    <section id="projects" className="premiumSectionV2">
      <div className="sectionTitleV2"><p className="premiumEyebrow">Selected work</p><h2>Featured Salesforce and data projects</h2></div>
      <div className="projectGridV2">
        {projects.map((project, index) => <article className="projectCardV2" key={project.title}>
          <div className="projectNumberV2">0{index + 1}</div>
          <p className="premiumEyebrow">{project.company}</p>
          <h3>{project.title}</h3>
          <p>{project.overview}</p>
          <div className="techLineV2">{project.tech}</div>
          <div className="impactBoxV2"><b>Impact</b><span>{project.impact}</span></div>
        </article>)}
      </div>
    </section>

    <section id="skills" className="premiumSectionV2 skillsSectionV2">
      <div className="sectionTitleV2"><p className="premiumEyebrow">Skill stack</p><h2>Salesforce-ready toolkit</h2></div>
      <div className="skillCloudV2">{allSkills.map(skill => <span key={skill}>{skill}</span>)}</div>
    </section>

    <section id="experience" className="premiumSectionV2">
      <div className="sectionTitleV2"><p className="premiumEyebrow">Experience</p><h2>Professional timeline</h2></div>
      <div className="timelineV2">
        {experience.map((item, index) => <article key={item.company}>
          <div className="timelineIndexV2">0{index + 1}</div>
          <div><h3>{item.role}</h3><b>{item.company}</b><p>{item.period}</p><ul>{item.points.map(point => <li key={point}>{point}</li>)}</ul></div>
        </article>)}
      </div>
    </section>

    <section className="premiumFinalCtaV2">
      <div><p className="premiumEyebrow">Ready for interview</p><h2>Need a Salesforce developer who understands CRM, code and business impact?</h2></div>
      <div className="finalCtaActionsV2"><a className="primaryCta" href={`mailto:${profile.email}`}>Contact Abhishek</a><Link className="secondaryCta" to="/login">Open Career OS</Link></div>
    </section>
  </main>;
}
