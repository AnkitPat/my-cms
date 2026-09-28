'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { cmsConfig, WorkspaceConfig, ContentTypeConfig, FieldDefinition } from '@/cms.config';
import { Language } from '@/config/types';

interface DocumentItem {
  _id: string;
  _type: string;
  language?: string;
  brands?: string[]; // For brand-level content types (filterByBrand: true)
  workspace?: string; // For workspace-specific content types (filterByBrand: false/falsy)
  _createdAt: string;
  _updatedAt: string;
  draft: Record<string, any>;
  published?: Record<string, any> | null;
}

const defaultDocuments: DocumentItem[] = [
  {
    _id: 'doc-1',
    _type: 'campsite',
    brands: ['eurocampings', 'suncamp'],
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    draft: {
      title: 'Alpine Valley Camping',
      slug: 'alpine-valley-camping',
      description: 'A gorgeous campsite nestled in the Swiss Alps with panoramic mountain views.',
      rating: 5,
      featured: true,
      brands: ['eurocampings', 'suncamp'],
    },
    published: null,
  },
  {
    _id: 'doc-2',
    _type: 'author',
    language: 'en',
    workspace: 'eurocampings',
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    draft: {
      name: 'John Doe',
      email: 'john@eurocampings.example',
      workspace: 'eurocampings',
      language: 'en',
    },
    published: {
      name: 'John Doe',
      email: 'john@eurocampings.example',
      workspace: 'eurocampings',
      language: 'en',
    },
  },
];

export default function WorkspaceStudioPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspace as string;

  const foundWorkspace =
    cmsConfig.workspaces.find((w) => w.id === workspaceId) || cmsConfig.workspaces[0];

  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceConfig>(foundWorkspace);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    currentWorkspace.languages[0] || { id: 'en', title: 'English' }
  );
  const [selectedContentType, setSelectedContentType] = useState<ContentTypeConfig>(
    currentWorkspace.contentTypes[0]
  );

  const [activeGroup, setActiveGroup] = useState<string>(
    selectedContentType.groups && selectedContentType.groups.length >= 2
      ? selectedContentType.groups[0].name
      : ''
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [editorTab, setEditorTab] = useState<'form' | 'json'>('form');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGlobalInspectorOpen, setIsGlobalInspectorOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync workspace when URL parameter changes
  useEffect(() => {
    const ws = cmsConfig.workspaces.find((w) => w.id === workspaceId);
    if (ws && ws.id !== currentWorkspace.id) {
      setCurrentWorkspace(ws);
      const firstLang = ws.languages[0] || { id: 'en', title: 'English' };
      setSelectedLanguage(firstLang);
      if (ws.contentTypes && ws.contentTypes.length > 0) {
        setSelectedContentType(ws.contentTypes[0]);
        if (ws.contentTypes[0].groups && ws.contentTypes[0].groups.length >= 2) {
          setActiveGroup(ws.contentTypes[0].groups[0].name);
        }
      }
      setSelectedDocument(null);
      setIsCreating(false);
    }
  }, [workspaceId]);

  // Documents state initialized with default documents to prevent SSR hydration mismatch, then loaded from MongoDB API
  const [documents, setDocuments] = useState<DocumentItem[]>(defaultDocuments);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    async function loadDocuments() {
      try {
        const res = await fetch('/api/documents');
        const data = await res.json();
        if (data.success && data.documents) {
          if (data.documents.length > 0) {
            const loaded = data.documents.map((d: any) => ({
              ...d,
              _id: d._id.toString ? d._id.toString() : d._id,
            }));
            setDocuments(loaded);
          } else {
            // Seed default documents into MongoDB
            for (const doc of defaultDocuments) {
              await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ document: doc }),
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to load documents from MongoDB API, falling back to localStorage', e);
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('my_cms_mongodb_documents');
          if (saved) {
            try {
              setDocuments(JSON.parse(saved));
            } catch (err) {
              console.error('Failed to parse documents from localStorage', err);
            }
          }
        }
      }
    }
    loadDocuments();
  }, []);

  const saveDocumentToApi = async (doc: DocumentItem) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: doc }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error('Error saving document to MongoDB:', data.error);
      }
    } catch (e) {
      console.error('Network error saving document to MongoDB API:', e);
    }
  };

  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const workspaceContentTypeNames = currentWorkspace.contentTypes.map((c) => c.name);

  const handleWorkspaceChange = (ws: WorkspaceConfig) => {
    setCurrentWorkspace(ws);
    const firstLang = ws.languages[0] || { id: 'en', title: 'English' };
    setSelectedLanguage(firstLang);
    if (ws.contentTypes && ws.contentTypes.length > 0) {
      setSelectedContentType(ws.contentTypes[0]);
      if (ws.contentTypes[0].groups && ws.contentTypes[0].groups.length >= 2) {
        setActiveGroup(ws.contentTypes[0].groups[0].name);
      }
    }
    setSelectedDocument(null);
    setIsCreating(false);
  };

  const handleSelectLanguage = (lang: Language) => {
    setSelectedLanguage(lang);
    setSelectedDocument(null);
    setIsCreating(false);
  };

  const handleSelectContentType = (ct: ContentTypeConfig) => {
    setSelectedContentType(ct);
    setSelectedDocument(null);
    setIsCreating(false);
    if (ct.groups && ct.groups.length >= 2) {
      setActiveGroup(ct.groups[0].name);
    }
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setSelectedDocument(null);
    setEditorTab('form');
    const initial: Record<string, any> = {};
    selectedContentType.fields.forEach((field) => {
      initial[field.name] = field.type === 'boolean' ? false : '';
    });
    if (selectedContentType.filterByBrand) {
      initial.brands = [currentWorkspace.id];
    } else {
      initial.language = selectedLanguage.id;
      initial.workspace = currentWorkspace.id;
    }
    setFormData(initial);
  };

  const handleSelectDocument = (doc: DocumentItem) => {
    setSelectedDocument(doc);
    setIsCreating(false);
    setEditorTab('form');
    setFormData({
      ...(doc.draft || {}),
      brands: doc.brands || doc.draft?.brands || (selectedContentType.filterByBrand ? [currentWorkspace.id] : undefined),
      workspace: doc.workspace || doc.draft?.workspace || (!selectedContentType.filterByBrand ? currentWorkspace.id : undefined),
    });
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleBrandToggle = (brandId: string) => {
    const currentBrands: string[] = formData.brands || [currentWorkspace.id];
    let updated: string[];
    if (currentBrands.includes(brandId)) {
      if (currentBrands.length === 1) return; // Keep at least one brand
      updated = currentBrands.filter((b) => b !== brandId);
    } else {
      updated = [...currentBrands, brandId];
    }
    handleFieldChange('brands', updated);
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const isBrand = selectedContentType.filterByBrand;
    const docBrands = isBrand ? formData.brands || [currentWorkspace.id] : undefined;
    const docWorkspace = !isBrand ? currentWorkspace.id : undefined;
    const docLanguage = !isBrand ? selectedLanguage.id : undefined;

    if (isCreating) {
      const newDoc: DocumentItem = {
        _id: `doc-${Date.now()}`,
        _type: selectedContentType.name,
        ...(docLanguage ? { language: docLanguage } : {}),
        ...(docBrands ? { brands: docBrands } : {}),
        ...(docWorkspace ? { workspace: docWorkspace } : {}),
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        draft: {
          ...formData,
          ...(docLanguage ? { language: docLanguage } : {}),
          ...(docBrands ? { brands: docBrands } : {}),
          ...(docWorkspace ? { workspace: docWorkspace } : {}),
        },
        published: null,
      };
      setDocuments([newDoc, ...documents]);
      setIsCreating(false);
      setSelectedDocument(newDoc);
      saveDocumentToApi(newDoc);
      showToast('Draft created and persisted to MongoDB!');
    } else if (selectedDocument) {
      const updatedDoc: DocumentItem = {
        ...selectedDocument,
        language: docLanguage,
        brands: docBrands,
        workspace: docWorkspace,
        draft: {
          ...formData,
          language: docLanguage,
          brands: docBrands,
          workspace: docWorkspace,
        },
        _updatedAt: new Date().toISOString(),
      };
      const updatedDocs = documents.map((doc) =>
        doc._id === selectedDocument._id ? updatedDoc : doc
      );
      setDocuments(updatedDocs);
      setSelectedDocument(updatedDoc);
      saveDocumentToApi(updatedDoc);
      showToast('Draft saved and persisted to MongoDB!');
    }
  };

  const handlePublish = () => {
    if (!selectedDocument) return;
    const updatedDoc: DocumentItem = {
      ...selectedDocument,
      published: { ...selectedDocument.draft },
      _updatedAt: new Date().toISOString(),
    };
    const updatedDocs = documents.map((doc) =>
      doc._id === selectedDocument._id ? updatedDoc : doc
    );
    setDocuments(updatedDocs);
    setSelectedDocument(updatedDoc);
    saveDocumentToApi(updatedDoc);
    showToast('Document published live & persisted to MongoDB!');
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesType = doc._type === selectedContentType.name;
    if (!matchesType) return false;

    if (selectedContentType.filterByBrand) {
      // Rule 2: Brand content type — filtered ONLY by brand (workspace) and ContentType. Shared across languages!
      const docBrands = doc.brands || doc.draft?.brands || [];
      return docBrands.includes(currentWorkspace.id);
    } else {
      // Rule 1: Non-brand content type — filtered by Workspace content types, ContentType, and Language
      const matchesWorkspaceType = workspaceContentTypeNames.includes(doc._type);
      const matchesLang = doc.language === selectedLanguage.id || doc.draft?.language === selectedLanguage.id;
      const docWorkspace = doc.workspace || doc.draft?.workspace || currentWorkspace.id;
      const matchesWorkspaceName = docWorkspace === currentWorkspace.id;
      if (!matchesWorkspaceType || !matchesLang || !matchesWorkspaceName) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (doc.draft?.title || doc.draft?.name || '').toLowerCase();
      const id = doc._id.toLowerCase();
      return title.includes(q) || id.includes(q);
    }
    return true;
  });

  const groups = selectedContentType.groups;
  const showTabs = groups && groups.length >= 2;

  const filteredFields = showTabs
    ? selectedContentType.fields.filter((field) => {
        if (!field.group) {
          return activeGroup === groups[0].name;
        }
        if (Array.isArray(field.group)) {
          return field.group.includes(activeGroup);
        }
        return field.group === activeGroup;
      })
    : selectedContentType.fields;

  return (
    <div className="min-h-screen flex flex-col w-full bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-indigo-500 selection:text-white">
      <Header
        currentWorkspace={currentWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
      />

      {/* Global Data Inspector Modal (Pure Data Only) */}
      {isGlobalInspectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🔍</span>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  Studio Data Inspector (All Persisted Records)
                </h2>
              </div>
              <button
                onClick={() => setIsGlobalInspectorOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center font-bold hover:bg-zinc-200 transition"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-xs">
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Persisted Documents Data (MongoDB / LocalStorage)</div>
                <pre className="p-4 rounded-xl bg-zinc-900 text-zinc-100 overflow-x-auto shadow-inner">
                  {JSON.stringify(documents, null, 2)}
                </pre>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center text-xs text-zinc-500 font-mono">
              <span>Storage Key: <code className="text-indigo-600 dark:text-indigo-400">my_cms_mongodb_documents</code></span>
              <button
                onClick={() => setIsGlobalInspectorOpen(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-zinc-700 dark:border-zinc-200">
          <span className="text-emerald-400 text-sm">✦</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4-Lane Studio Layout (Full Width) */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* Lane 1: Languages */}
        <aside className="w-56 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 flex flex-col shrink-0">
          <div className="mb-3 px-2 flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Languages
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              {currentWorkspace.languages.length}
            </span>
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto">
            {currentWorkspace.languages.map((lang) => {
              const isSelected = selectedLanguage.id === lang.id;
              const langCount = documents.filter((d) => {
                if (!workspaceContentTypeNames.includes(d._type)) return false;
                const ctConfig = currentWorkspace.contentTypes.find((c) => c.name === d._type);
                if (!ctConfig) return false;

                if (ctConfig.filterByBrand) {
                  const docBrands = d.brands || d.draft?.brands || [];
                  return docBrands.includes(currentWorkspace.id);
                } else {
                  const docWs = d.workspace || d.draft?.workspace || currentWorkspace.id;
                  const docLang = d.language || d.draft?.language;
                  return docWs === currentWorkspace.id && docLang === lang.id;
                }
              }).length;
              return (
                <button
                  key={lang.id}
                  onClick={() => handleSelectLanguage(lang)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-semibold shadow-xs ring-1 ring-indigo-500/20'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="text-base">🌐</span>
                    <span className="truncate">{lang.title}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      isSelected
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {langCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 px-2 font-mono truncate">
            {selectedContentType.filterByBrand ? (
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">⚡ Shared across languages (Brand)</span>
            ) : (
              <span>Active: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedLanguage.title}</span></span>
            )}
          </div>
        </aside>

        {/* Lane 2: Content Types for Selected Language */}
        <aside className="w-64 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 flex flex-col shrink-0">
          <div className="mb-3 px-2 flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Content Types
            </h2>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-zinc-200/80 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
              {currentWorkspace.id}
            </span>
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto">
            {currentWorkspace.contentTypes.map((ct) => {
              const isSelected = selectedContentType.name === ct.name;
              const count = documents.filter((d) => {
                if (d._type !== ct.name) return false;
                if (ct.filterByBrand) {
                  const bList = d.brands || d.draft?.brands || [];
                  return bList.includes(currentWorkspace.id);
                } else {
                  const docWs = d.workspace || d.draft?.workspace || currentWorkspace.id;
                  return workspaceContentTypeNames.includes(d._type) && docWs === currentWorkspace.id && (d.language === selectedLanguage.id || d.draft?.language === selectedLanguage.id);
                }
              }).length;

              return (
                <button
                  key={ct.name}
                  onClick={() => handleSelectContentType(ct)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-semibold shadow-xs ring-1 ring-indigo-500/20'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="text-base">{ct.icon || '📄'}</span>
                    <span className="truncate">{ct.title}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      isSelected
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Global Data Inspector Trigger Button */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
            <button
              onClick={() => setIsGlobalInspectorOpen(true)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-2 hover:bg-zinc-800"
            >
              <span>🔍</span>
              <span>Inspect All Studio Data</span>
            </button>
          </div>
        </aside>

        {/* Lane 3: Document List */}
        <section className="w-80 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <span className="text-lg p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">{selectedContentType.icon || '📄'}</span>
                <div className="truncate">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {selectedContentType.title}
                  </h2>
                  <p className="text-[10px] text-zinc-400 font-mono uppercase">
                    {selectedContentType.filterByBrand ? '⚡ Brand Global (All Languages)' : `${selectedLanguage.title} (${selectedLanguage.id})`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleStartCreate}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1"
              >
                <span>+ New</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${selectedContentType.title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl mx-auto mb-3 text-zinc-400">
                  📄
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">No documents found.</p>
                <button
                  onClick={handleStartCreate}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs"
                >
                  Create {selectedContentType.title}
                </button>
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const isSelected = selectedDocument?._id === doc._id;
                const docTitle = doc.draft?.title || doc.draft?.name || doc._id;
                const hasPublished = !!doc.published;
                const docBrands = doc.brands || doc.draft?.brands || [];
                const docWorkspace = doc.workspace || doc.draft?.workspace;

                return (
                  <div
                    key={doc._id}
                    onClick={() => handleSelectDocument(doc)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition group ${
                      isSelected
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                        : 'bg-zinc-50/50 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {docTitle}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                          hasPublished
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50'
                        }`}
                      >
                        {hasPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span className="truncate">ID: {doc._id}</span>
                      {selectedContentType.filterByBrand ? (
                        <div className="flex items-center space-x-1">
                          {docBrands.map((bId: string) => {
                            const ws = cmsConfig.workspaces.find((w) => w.id === bId);
                            return (
                              <span
                                key={bId}
                                className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[9px] font-semibold"
                              >
                                {ws?.icon || '🏢'} {ws?.title || bId}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        docWorkspace && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[9px] font-semibold">
                            🏢 {docWorkspace}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Lane 4: Document Form Editor / Inspector */}
        <main className="flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-y-auto">
          {isCreating || selectedDocument ? (
            <div className="max-w-4xl w-full mx-auto p-8">
              {/* Editor Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-zinc-200/80 dark:border-zinc-800/80 gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs text-zinc-500 font-mono mb-1">
                    <span>{selectedContentType.filterByBrand ? '⚡ Brand Shared (All Languages)' : selectedLanguage.title}</span>
                    <span>/</span>
                    <span>{selectedContentType.title}</span>
                    <span>/</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{isCreating ? 'New Document' : selectedDocument?._id}</span>
                  </div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {isCreating ? `Create ${selectedContentType.title}` : (selectedDocument?.draft?.title || selectedDocument?.draft?.name || selectedDocument?._id)}
                  </h1>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Document Detail Inspector Menu Option on Right */}
                  <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setEditorTab('form')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        editorTab === 'form'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      ✏️ Edit Form
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('json')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        editorTab === 'json'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      💻 Document Inspect
                    </button>
                  </div>

                  {!isCreating && selectedDocument && (
                    <button
                      type="button"
                      onClick={handlePublish}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
                    >
                      <span>🚀 Publish</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedDocument(null);
                    }}
                    className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    Close
                  </button>
                </div>
              </div>

              {editorTab === 'json' ? (
                <div className="space-y-4">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                    Inspect Data for Document: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{isCreating ? 'New Draft' : selectedDocument?._id}</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto shadow-inner border border-zinc-800">
                    <pre>{JSON.stringify(isCreating ? formData : selectedDocument, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <>
                  {showTabs && (
                    <div className="flex space-x-2 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4 mb-6">
                      {groups.map((group) => {
                        const isActive = activeGroup === group.name;
                        return (
                          <button
                            key={group.name}
                            type="button"
                            onClick={() => setActiveGroup(group.name)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {group.icon && <span>{group.icon}</span>}
                            <span>{group.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <form onSubmit={handleSaveDraft} className="space-y-6">
                    {selectedContentType.filterByBrand ? (
                      <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-300 flex items-center justify-between font-mono">
                        <span>Content Scope:</span>
                        <span className="font-bold bg-white dark:bg-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-700 shadow-xs">
                          ⚡ Brand-Level (Shared across all languages)
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-300 flex items-center justify-between font-mono">
                        <span>Language & Workspace Scope:</span>
                        <span className="font-bold uppercase bg-white dark:bg-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-700 shadow-xs">
                          {currentWorkspace.title} / {selectedLanguage.title} ({selectedLanguage.id})
                        </span>
                      </div>
                    )}

                    {/* Multi-Brand Assignment (If filterByBrand is enabled) */}
                    {selectedContentType.filterByBrand && (
                      <div className="p-5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/60 space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-1">
                            🏢 Multi-Brand Assignment <span className="text-red-500">*</span>
                          </label>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Select one or more brands (workspaces) this document belongs to.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                          {cmsConfig.workspaces.map((ws) => {
                            const assignedBrands: string[] = formData.brands || [currentWorkspace.id];
                            const isAssigned = assignedBrands.includes(ws.id);
                            return (
                              <button
                                key={ws.id}
                                type="button"
                                onClick={() => handleBrandToggle(ws.id)}
                                className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                                  isAssigned
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-semibold'
                                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <span className="text-base">{ws.icon || '🏢'}</span>
                                  <span className="text-xs truncate">{ws.title}</span>
                                </div>
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isAssigned ? 'bg-white text-indigo-600 font-bold' : 'border border-zinc-300 dark:border-zinc-600'}`}>
                                  {isAssigned ? '✓' : ''}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                      {filteredFields.map((field: FieldDefinition) => {
                        const val = formData[field.name] ?? '';
                        return (
                          <div key={field.name} className="space-y-2 p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                                {field.title} {field.required && <span className="text-red-500">*</span>}
                              </label>
                              <span className="text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800">
                                {field.type}
                              </span>
                            </div>

                            {field.type === 'text' ? (
                              <textarea
                                rows={4}
                                value={val}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs"
                              />
                            ) : field.type === 'boolean' ? (
                              <label className="flex items-center space-x-3 cursor-pointer py-1">
                                <input
                                  type="checkbox"
                                  checked={!!val}
                                  onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                                  className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">Yes / Active</span>
                              </label>
                            ) : field.type === 'number' ? (
                              <input
                                type="number"
                                value={val}
                                onChange={(e) => handleFieldChange(field.name, Number(e.target.value))}
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs"
                              />
                            ) : (
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={`Enter ${field.title.toLowerCase()}...`}
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 flex justify-end space-x-3">
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-500/20"
                      >
                        {isCreating ? 'Create Draft Document' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center text-4xl mb-4 shadow-sm">
                🏢
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                Select a document to edit
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
                Choose a document from the left list or click <span className="font-semibold text-indigo-600 dark:text-indigo-400">+ New</span> to create a new content item.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
