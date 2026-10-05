import React, { useState, useEffect } from 'react';
import { ExamDocument } from './types/exam';
import { StorageService } from './utils/storage';
import { createNewExamDocument } from './utils/formatters';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { WizardHeaderStep } from './components/wizard/WizardHeaderStep';
import { WizardQuestionStep } from './components/wizard/WizardQuestionStep';
import { WizardPreviewStep } from './components/wizard/WizardPreviewStep';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const [documents, setDocuments] = useState<ExamDocument[]>(() => StorageService.getDocuments());
  const [activeExam, setActiveExam] = useState<ExamDocument | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'wizard'>('dashboard');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Resume last open document if available on init
  const [lastOpenDocId, setLastOpenDocId] = useState<string | null>(() =>
    StorageService.getLastOpenDocumentId()
  );

  const lastOpenDoc = documents.find((d) => d.id === lastOpenDocId) || null;

  // Auto-save active document whenever it's updated in wizard mode
  useEffect(() => {
    if (activeExam && currentView === 'wizard') {
      const timer = setTimeout(() => {
        StorageService.saveDocument(activeExam);
        setDocuments(StorageService.getDocuments());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeExam, currentView]);

  const handleOpenExam = (doc: ExamDocument) => {
    setActiveExam(doc);
    StorageService.saveLastOpenDocumentId(doc.id);
    setLastOpenDocId(doc.id);
    setCurrentView('wizard');
    setWizardStep(3); // Open in A4 preview for existing saved exams
  };

  const handleCreateNew = () => {
    const newDoc = createNewExamDocument();
    setActiveExam(newDoc);
    StorageService.saveDocument(newDoc);
    setDocuments(StorageService.getDocuments());
    setLastOpenDocId(newDoc.id);
    setCurrentView('wizard');
    setWizardStep(1); // Start at Step 1 for new exams
  };

  const handleDuplicate = (id: string) => {
    const copy = StorageService.duplicateDocument(id);
    if (copy) {
      setDocuments(StorageService.getDocuments());
    }
  };

  const handleRename = (id: string, newName: string) => {
    StorageService.renameDocument(id, newName);
    setDocuments(StorageService.getDocuments());
    if (activeExam?.id === id) {
      setActiveExam((prev) => (prev ? { ...prev, name: newName } : null));
    }
  };

  const handleDelete = (id: string) => {
    StorageService.deleteDocument(id);
    setDocuments(StorageService.getDocuments());
    if (activeExam?.id === id) {
      setActiveExam(null);
      setCurrentView('dashboard');
    }
    setLastOpenDocId(StorageService.getLastOpenDocumentId());
  };

  const handleUpdateActiveDoc = (updatedDoc: ExamDocument) => {
    setActiveExam(updatedDoc);
  };

  const handleSaveActiveDoc = () => {
    if (activeExam) {
      StorageService.saveDocument(activeExam);
      setDocuments(StorageService.getDocuments());
    }
  };

  const handleRestoreCompleted = () => {
    const freshDocs = StorageService.getDocuments();
    setDocuments(freshDocs);
    setLastOpenDocId(StorageService.getLastOpenDocumentId());
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-blue-100">
      <Navbar
        currentView={currentView}
        wizardStep={wizardStep}
        documentName={activeExam?.name}
        onGoHome={() => {
          if (activeExam) StorageService.saveDocument(activeExam);
          setCurrentView('dashboard');
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onSetWizardStep={setWizardStep}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentView === 'dashboard' ? (
          <Dashboard
            documents={documents}
            lastOpenDoc={lastOpenDoc}
            onOpenExam={handleOpenExam}
            onCreateNew={handleCreateNew}
            onDuplicate={handleDuplicate}
            onRename={handleRename}
            onDelete={handleDelete}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : activeExam ? (
          <div>
            {wizardStep === 1 && (
              <WizardHeaderStep
                document={activeExam}
                onUpdate={handleUpdateActiveDoc}
                onNext={() => setWizardStep(2)}
              />
            )}
            {wizardStep === 2 && (
              <WizardQuestionStep
                document={activeExam}
                onUpdate={handleUpdateActiveDoc}
                onBack={() => setWizardStep(1)}
                onFinish={() => setWizardStep(3)}
              />
            )}
            {wizardStep === 3 && (
              <WizardPreviewStep
                document={activeExam}
                onUpdate={handleUpdateActiveDoc}
                onSave={handleSaveActiveDoc}
                onBackToQuestions={() => setWizardStep(2)}
              />
            )}
          </div>
        ) : null}
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onRestoreCompleted={handleRestoreCompleted}
      />
    </div>
  );
};

export default App;
