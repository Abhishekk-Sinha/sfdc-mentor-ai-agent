import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { readStore } from './utils/storage';
import { Login, PortfolioManager } from './pages/AuthPortfolio';
import { PremiumPortfolio } from './pages/PremiumPortfolio';
import { Dashboard } from './pages/Dashboard';
import { AIMentor, FocusMode, LearningCoach, MentorRoute } from './pages/Mentor';
import { English100 } from './pages/English';
import { PracticeLab, ScenarioQuestions, UseCases } from './pages/Practice';
import { InterviewQA, ProjectsPage, WeeklyTests } from './pages/TestsInterview';
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
  return <BrowserRouter><Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/portfolio" element={<PremiumPortfolio/>}/>
    <Route path="/dashboard" element={<Protected><Dashboard/></Protected>}/>
    <Route path="/ai-mentor" element={<Protected><AIMentor/></Protected>}/>
    <Route path="/mentor-route" element={<Protected><MentorRoute/></Protected>}/>
    <Route path="/focus" element={<Protected><FocusMode/></Protected>}/>
    <Route path="/learning-coach" element={<Protected><LearningCoach/></Protected>}/>
    <Route path="/zero-to-hero" element={<DashboardRedirect/>}/>
    <Route path="/english" element={<Protected><English100/></Protected>}/>
    <Route path="/practice" element={<Protected><PracticeLab/></Protected>}/>
    <Route path="/scenarios" element={<Protected><ScenarioQuestions/></Protected>}/>
    <Route path="/use-cases" element={<Protected><UseCases/></Protected>}/>
    <Route path="/weekly-tests" element={<Protected><WeeklyTests/></Protected>}/>
    <Route path="/interview" element={<Protected><InterviewQA/></Protected>}/>
    <Route path="/projects" element={<Protected><ProjectsPage/></Protected>}/>
    <Route path="/job-tracker" element={<Protected><JobTracker/></Protected>}/>
    <Route path="/jd-matcher" element={<Protected><JDMatcher/></Protected>}/>
    <Route path="/resume" element={<Protected><ResumeOptimizer/></Protected>}/>
    <Route path="/time-tracker" element={<Protected><TimeTracker/></Protected>}/>
    <Route path="/notes" element={<Protected><Notes/></Protected>}/>
    <Route path="/documents" element={<Protected><Documents/></Protected>}/>
    <Route path="/doubts" element={<Protected><Doubts/></Protected>}/>
    <Route path="/journal" element={<Protected><Journal/></Protected>}/>
    <Route path="/certifications" element={<Protected><Certifications/></Protected>}/>
    <Route path="/portfolio-manager" element={<Protected><PortfolioManager/></Protected>}/>
    <Route path="/premium-features" element={<DashboardRedirect/>}/>
    <Route path="/final-premium" element={<Protected><FinalPremium/></Protected>}/>
    <Route path="/more-tools" element={<Protected><MoreTools/></Protected>}/>
    <Route path="/backup" element={<Protected><Backup/></Protected>}/>
    <Route path="*" element={<Navigate to={home} replace/>}/>
  </Routes></BrowserRouter>;
}
