const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// Ensure directories exist
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('processed')) fs.mkdirSync('processed');

// Helper to run Python scripts
const runPython = (script, args, res, outputFile, inputFiles = []) => {
    // In Docker/Linux, it is often 'python3', not 'python'
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    const pythonProcess = spawn(pythonCommand, [path.join(__dirname, '../python_engine', script), ...args]);

    let errorOutput = "";

    pythonProcess.stdout.on('data', (data) => {
        const result = data.toString().trim();
        console.log(`[Python stdout]: ${result}`);
        
        if (result.includes('SUCCESS')) {
            res.download(outputFile, (err) => {
                if (err) console.error("Download Error:", err);
                
                // --- CLEANUP: Delete files after download ---
                try {
                    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
                    inputFiles.forEach(file => {
                        if (fs.existsSync(file)) fs.unlinkSync(file);
                    });
                } catch (cleanupErr) {
                    console.error("Cleanup Error:", cleanupErr);
                }
            });
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`[Python stderr]: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0 && !res.headersSent) {
            console.error(`Process exited with code ${code}`);
            res.status(500).send("Processing failed.");
        }
    });
};

// --- ROUTES ---

app.post('/compress', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send("No file");
    const inputPath = req.file.path;
    const outputPath = path.join('processed', `compressed-${req.file.filename}`);
    runPython('compress.py', [inputPath, outputPath], res, outputPath, [inputPath]);
});

app.post('/merge', upload.array('files', 10), (req, res) => {
    if (!req.files) return res.status(400).send("No files");
    const inputPaths = req.files.map(f => f.path);
    const outputPath = path.join('processed', `merged-${Date.now()}.pdf`);
    runPython('merge.py', [outputPath, ...inputPaths], res, outputPath, inputPaths);
});

app.post('/watermark', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send("No file");
    const inputPath = req.file.path;
    const outputPath = path.join('processed', `watermarked-${req.file.filename}`);
    const text = req.body.text || "CONFIDENTIAL";
    runPython('watermark.py', [inputPath, outputPath, text], res, outputPath, [inputPath]);
});

// USE DYNAMIC PORT FOR DEPLOYMENT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));