import React from 'react';
import Editor from './components/Editor';

const App: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-background text-text font-sans antialiased selection:bg-primary/20">
      <Editor />
    </div>
  );
};

export default App;
