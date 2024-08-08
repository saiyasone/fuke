// src/App.tsx
import React from 'react';
import FileUpload from './components/FileUpload';
import DisplayVideos from './components/DisplayVideos';

const App: React.FC = () => {
  return (
    <div className="App">
      <h1 style={{padding:20}}>Display video</h1>
      {/* <DisplayVideos /> */}
      <FileUpload />
    </div>
  );
};

export default App;
