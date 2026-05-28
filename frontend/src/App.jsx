import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { readStore } from './utils/storage';
import { Login, PortfolioManager } from './pages/AuthPortfolio';
import { PremiumPortfolio } from './pages/PremiumPortfolio';
import { Dashboard } from './pages/Dashboard';
import { FocusMode, LearningCoach, MentorRoute } from './pages/Mentor';
import { AIMentorPro } from './pages/AIMentorPro';
import { English100 } from './pages/English';
import { PracticeLab, ScenarioQuestions, UseCases } from './pages/Practice';
import { ProjectsPage, WeeklyTests } from './pages/TestsInterview';
import { InterviewRoomPro } from './pages/InterviewRoomPro';
import { JDMatcher, JobTracker, MoreTools } from './pages/JobsTools';
import { Backup, Documents, Doubts, Journal, Notes, TimeTracker } from './pages/Productivity';
import { Certifications, ResumeOptimizer } from './pages/ResumeCert';
import { FinalPremium } from './pages/FinalPremium';

function Protected({ children }) {
  const session = readStore('session', null);
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function DashboardRedirect() {
  return <Protected><Navigate to="/dashboard" replace /></Protected>;
}

export default function App() {
  const home = readStore('session', null) ? '/dashboard' : '/portfolio';
  const privatePage = component => <Protected>{component}</Protected>;
  return <BrowserRouter><Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/portfolio" element={<PremiumPortfolio/>}/>
    <Route path="/dashboard" element={privatePage(<Dashboard/>)}/>
    <Route path="/ai-mentor" element={privatePage(<AIMentorPro/>)}/>
    <Route path="/mentor-route" element={privatePage(<MentorRoute/>)}/>
    <Route path="/focus" element={privatePage(<FocusMode/>)}/>
    <Route path="/learning-coach" element={privatePage(<LearningCoach/>)}/>
    <Route path="/zero-to-hero" element={<DashboardRedirect/>}/>
    <Route path="/english" element={privatePage(<English100/>)}/>
    <Route path="/practice" element={privatePage(<PracticeLab/>)}/>
    <Route path="/scenarios" element={privatePage(<ScenarioQuestions/>)}/>
    <Route path="/use-cases" element={privatePage(<UseCases/>)}/>
    <Route path="/weekly-tests" element={privatePage(<WeeklyTests/>)}/>
    <Route path="/interview" element={privatePage(<InterviewRoomPro/>)}/>
    <Route path="/projects" element={privatePage(<ProjectsPage/>)}/>
    <Route path="/job-tracker" element={privatePage(<JobTracker/>)}/>
    <Route path="/jd-matcher" element={privatePage(<JDMatcher/>)}/>
    <Route path="/resume" element={privatePage(<ResumeOptimizer/>)}/>
    <Route path="/time-tracker" element={privatePage(<TimeTracker/>)}/>
    <Route path="/notes" element={privatePage(<Notes/>)}/>
    <Route path="/documents" element={privatePage(<Documents/>)}/>
    <Route path="/doubts" element={privatePage(<Doubts/>)}/>
    <Route path="/journal" element={privatePage(<Journal/>)}/>
    <Route path="/certifications" element={privatePage(<Certifications/>)}/>
    <Route path="/portfolio-manager" element={privatePage(<PortfolioManager/>)}/>
    <Route path="/premium-features" element={<DashboardRedirect/>}/>
    <Route path="/final-premium" element={privatePage(<FinalPremium/>)}/>
    <Route path="/more-tools" element={privatePage(<MoreTools/>)}/>
    <Route path="/backup" element={privatePage(<Backup/>)}/>
    <Route path="*" element={<Navigate to={home} replace/>}/>
  </Routes></BrowserRouter>;
}
