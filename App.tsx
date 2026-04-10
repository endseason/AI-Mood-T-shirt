
import React, { useState } from 'react';
import Layout from './components/Layout';
import InspirationFlow from './components/InspirationFlow';
import ChatInterface from './components/ChatInterface';
import MockupLab from './components/MockupLab';
import Checkout from './components/Checkout';
import { AppView } from './types';


const ACCESS_CODE = '1222';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LANDING');
  const [designUrl, setDesignUrl] = useState<string>('');
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [isRecipeLoading, setIsRecipeLoading] = useState<boolean>(false);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [accessCodeInput, setAccessCodeInput] = useState<string>('');
  const [accessError, setAccessError] = useState<string>('');


  const handleVibeSelection = (prompt: string) => {
    setSelectedPrompt(prompt);
    setView('CHAT');
  };

  const handleRecipeSelection = (imageUrl: string, id?: string) => {
    const isTodayTopImage = imageUrl.includes('/todaytop/');
    const recipeUrl = isTodayTopImage ? imageUrl : id ? `/images/${id}.jpg` : imageUrl;
    setDesignUrl(recipeUrl);
    setIsRecipeLoading(false);
    setView('EDITOR');
  };

  const handleGenerationComplete = (url: string) => {
    setDesignUrl(url);
    setIsRecipeLoading(false);
    setView('EDITOR');
  };

  const handleCheckout = (previews: Record<string, string>) => {
    setPreviewImages(previews);
    setView('CHECKOUT');
  };

  const handleUnlock = () => {
    if (accessCodeInput.trim() === ACCESS_CODE) {
      setIsUnlocked(true);
      setAccessError('');
      return;
    }
    setAccessError('内测码错误，请重新输入。');
  };


  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-neutral-200">
          <h1 className="text-xl font-semibold text-neutral-900">AI Mood T-shirt 内测入口</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            该站点当前处于小范围内测，仅对受邀测试用户开放。
            <br />
            请输入内测码后继续访问首页。
          </p>

          <input
            type="password"
            value={accessCodeInput}
            onChange={(e) => {
              setAccessCodeInput(e.target.value);
              if (accessError) setAccessError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUnlock();
              }
            }}
            placeholder="请输入内测码"
            className="mt-6 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-black"
          />

          {accessError && <p className="mt-3 text-sm text-red-500">{accessError}</p>}

          <button
            type="button"
            onClick={handleUnlock}
            className="mt-5 w-full rounded-xl bg-black py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            进入内测
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={view} onViewChange={setView}>
      {view === 'LANDING' && (
        <InspirationFlow onSelect={(imageUrl, id) => handleRecipeSelection(imageUrl, id)} />
      )}

      {view === 'CHAT' && (
        <ChatInterface 
          onComplete={handleGenerationComplete} 
          initialPrompt={selectedPrompt}
        />
      )}

      {view === 'EDITOR' && (
        <MockupLab 
          designUrl={designUrl} 
          isLoading={isRecipeLoading}
          loadingText="配方加载中"
          onNext={handleCheckout}
          onBack={() => setView('LANDING')}
        />
      )}

      {view === 'CHECKOUT' && (
        <Checkout previewImages={previewImages} onBack={() => setView('EDITOR')} />
      )}
    </Layout>
  );
};

export default App;
