import React, { useState, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import './App.css';

// --- ICONS (SVG) ---
const CompressIcon = () => (
  <svg viewBox="0 0 24 24" className="tool-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 14h6v6h-6z" />
    <path d="M14 4h6v6h-6z" />
    <path d="M11 13l-3 3-3-3" />
    <path d="M22 13l-3 3-3-3" />
    <path d="M8 4v9" />
    <path d="M19 14v6" />
  </svg>
);

const MergeIcon = () => (
  <svg viewBox="0 0 24 24" className="tool-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const WatermarkIcon = () => (
  <svg viewBox="0 0 24 24" className="tool-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M12 18l-2-2 4-4" style={{opacity: 0.5}}/>
    <text x="6" y="18" fontSize="6" fontWeight="bold" fill="currentColor" style={{opacity: 0.3}}>A</text>
  </svg>
);

// --- CONFIGURATION ---
const toolsConfig = {
  compress: {
    title: "Compress PDF",
    description: "Reduce file size while optimizing for maximal PDF quality.",
    endpoint: "/compress",
    inputType: "single",
    icon: CompressIcon,
    btnText: "Select PDF file"
  },
  merge: {
    title: "Merge PDF",
    description: "Combine PDFs. Hold 'Ctrl' to select multiple files.",
    endpoint: "/merge",
    inputType: "multiple",
    icon: MergeIcon,
    btnText: "Select PDFs (Hold Ctrl)"
  },
  watermark: {
    title: "Add Watermark",
    description: "Stamp an image or text over your PDF in seconds.",
    endpoint: "/watermark",
    inputType: "single",
    requiresText: true,
    icon: WatermarkIcon,
    btnText: "Select PDF file"
  }
};

// --- COMPONENT: HOME CARD ---
const HomeCard = ({ id, config }) => {
  const Icon = config.icon;
  return (
    <Link to={`/tool/${id}`} className="tool-card-link">
      <div className="tool-card home-card">
        <div className="icon-container">
          <Icon />
        </div>
        <h3>{config.title}</h3>
        <p className="tool-desc">{config.description}</p>
      </div>
    </Link>
  );
};

// --- COMPONENT: WORKSPACE ---
const ToolWorkspace = () => {
  const { id } = useParams();
  const config = toolsConfig[id];
  const fileInputRef = useRef(null);
  
  const [files, setFiles] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  if (!config) return <div>Tool not found</div>;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
      setSuccess(false); // Reset success state when new files are chosen
      setMessage("");
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };

  const resetTool = () => {
    setFiles(null);
    setText("");
    setMessage("");
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files && !loading) return;

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    if (config.inputType === "multiple") {
      for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
    } else {
      formData.append('file', files[0]);
    }
    if (config.requiresText) formData.append('text', text);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const response = await axios.post(`${API_URL}${config.endpoint}`, formData, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `processed_${id}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      setMessage("Success! Downloading...");
      setSuccess(true);
    } catch (error) {
      console.error("Upload Error:", error);
      setMessage("Failed to process file. (Check Server Console)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-container">
      <div className="workspace-header">
        <h2>{config.title}</h2>
        <p>{config.description}</p>
      </div>
      
      <div className="workspace-box">
        {/* Step 1: File Selection */}
        {!files && !loading && (
          <div className="drop-zone" onClick={triggerFileUpload}>
            <div className="drop-zone-icon">
              <config.icon />
            </div>
            <button type="button" className="big-select-btn">{config.btnText}</button>
            <p className="drop-subtext">or drop PDFs here</p>
            <input 
              type="file" 
              ref={fileInputRef}
              multiple={config.inputType === "multiple"} 
              accept=".pdf"
              onChange={handleFileChange} 
              className="hidden-input"
            />
          </div>
        )}

        {/* Step 2: Processing */}
        {files && (
          <div className="process-area">
            <div className="file-summary">
              <strong>{files.length} file(s) selected</strong>
            </div>

            <form onSubmit={handleSubmit} className="tool-form">
              {config.requiresText && (
                <div className="option-area">
                  <input 
                    type="text" 
                    placeholder="Enter Watermark Text..." 
                    value={text} 
                    onChange={(e) => setText(e.target.value)}
                    required 
                    className="text-input big-input"
                  />
                </div>
              )}

              {!success ? (
                <button type="submit" disabled={loading} className="big-action-btn">
                  {loading ? 'Processing...' : `${config.title} Now`}
                </button>
              ) : (
                <button type="button" onClick={resetTool} className="big-action-btn" style={{backgroundColor: '#27ae60'}}>
                  Process Another File
                </button>
              )}
            </form>
          </div>
        )}
        
        {message && <div className="status-msg" style={{color: success ? '#27ae60' : '#e74c3c'}}>{message}</div>}
      </div>
      
      <Link to="/" className="back-link">← Back to Home</Link>
    </div>
  );
};

// --- MAIN LAYOUT ---
function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <Link to="/" style={{textDecoration:'none'}}>
            <div className="logo">
              <span className="logo-i">i</span>Love<span className="logo-pdf">PDF</span> Clone
            </div>
          </Link>
          <div className="nav-links">
            <Link to="/tool/merge" className="nav-link">Merge PDF</Link>
            <Link to="/tool/compress" className="nav-link">Compress PDF</Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={
            <>
              <header className="hero">
                <h1>Every tool you need to work with PDFs in one place</h1>
                <p>Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use!</p>
              </header>
              <div className="container">
                <div className="grid">
                  <HomeCard id="compress" config={toolsConfig.compress} />
                  <HomeCard id="merge" config={toolsConfig.merge} />
                  <HomeCard id="watermark" config={toolsConfig.watermark} />
                </div>
              </div>
            </>
          } />
          
          <Route path="/tool/:id" element={<ToolWorkspace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;