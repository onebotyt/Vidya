const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function buildReport() {
  console.log('Reading docs/PROJECT_REPORT_VIDYAOS.md...');
  let md = fs.readFileSync(path.join(__dirname, '..', 'docs', 'PROJECT_REPORT_VIDYAOS.md'), 'utf8');

  // Preprocess LaTeX breaks
  md = md.replace(/\\pagebreak/g, '<div class="page-break"></div>');
  md = md.replace(/\\vspace\{([^}]+)\}/g, '<div style="margin-top: $1;"></div>');

  // Write temporary file
  const tempMdPath = path.join(__dirname, '..', 'temp_report.md');
  fs.writeFileSync(tempMdPath, md, 'utf8');

  console.log('Converting markdown to HTML using marked...');
  const bodyHtml = execSync(`npx -y marked -i "${tempMdPath}"`, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VidyaOS — Institutional Project Report (UBTER / AICTE)</title>
<style>
  @page {
    size: A4;
    margin: 22mm 18mm 22mm 18mm;
  }
  @media print {
    body {
      background: #fff !important;
      color: #000 !important;
      font-size: 11.5pt;
      line-height: 1.5;
    }
    .no-print {
      display: none !important;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
      height: 0;
      margin: 0;
      padding: 0;
    }
    h1, h2 {
      page-break-after: avoid;
      break-after: avoid;
    }
    table, figure, pre {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
  @media screen {
    body {
      background: #f1f5f9;
      color: #1e293b;
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 15px;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .report-container {
      background: #fff;
      max-width: 900px;
      width: 100%;
      padding: 60px 70px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      box-sizing: border-box;
    }
    .toolbar {
      position: sticky;
      top: 15px;
      z-index: 999;
      background: #0f172a;
      color: #fff;
      padding: 12px 24px;
      border-radius: 30px;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.25);
      margin-bottom: 25px;
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .toolbar button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: background 0.2s;
    }
    .toolbar button:hover {
      background: #1d4ed8;
    }
    .page-break {
      border-top: 2px dashed #cbd5e1;
      margin: 40px 0;
      position: relative;
    }
    .page-break::after {
      content: 'Page Break';
      position: absolute;
      top: -10px;
      right: 15px;
      background: #f1f5f9;
      color: #94a3b8;
      font-size: 10px;
      padding: 0 6px;
      font-family: sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
  
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
  }
  h1, h2, h3, h4 {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    font-weight: 700;
  }
  h1 {
    font-size: 22pt;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 6px;
    margin-top: 30px;
  }
  h2 {
    font-size: 16pt;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    margin-top: 24px;
  }
  h3 {
    font-size: 13pt;
    margin-top: 18px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 10pt;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    text-align: left;
  }
  th {
    background-color: #f8fafc;
    font-weight: 600;
    color: #0f172a;
  }
  tr:nth-child(even) td {
    background-color: #fbfcfe;
  }
  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 14px 18px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.45;
  }
  code {
    font-family: 'Consolas', 'Courier New', monospace;
  }
  p code {
    background: #e2e8f0;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 0.9em;
  }
  blockquote {
    border-left: 4px solid #2563eb;
    margin: 16px 0;
    padding: 10px 18px;
    background: #eff6ff;
    color: #1e3a8a;
    font-style: italic;
  }
  ul, ol {
    padding-left: 24px;
  }
  li {
    margin-bottom: 6px;
  }
  hr {
    border: 0;
    border-top: 1px solid #cbd5e1;
    margin: 30px 0;
  }
</style>
</head>
<body>

<div class="toolbar no-print">
  <span style="font-weight: 600;">📄 VidyaOS Project Report (UBTER Final Submission)</span>
  <button onclick="window.print()">🖨️ Print / Save as PDF</button>
  <button onclick="window.location.href='/VidyaOS_Project_Report.pdf'">📥 Direct PDF Download</button>
</div>

<div class="report-container">
${bodyHtml}
</div>

</body>
</html>`;

  const docsHtml = path.join(__dirname, '..', 'docs', 'VidyaOS_Project_Report.html');
  const deployHtml = path.join(__dirname, '..', 'deployfolder', 'VidyaOS', 'report.html');
  const downloadsHtml = 'C:/Users/hp/Downloads/VidyaOS_Project_Report.html';

  fs.writeFileSync(docsHtml, fullHtml, 'utf8');
  fs.writeFileSync(deployHtml, fullHtml, 'utf8');
  if (fs.existsSync('C:/Users/hp/Downloads')) {
    fs.writeFileSync(downloadsHtml, fullHtml, 'utf8');
  }

  if (fs.existsSync(tempMdPath)) {
    fs.unlinkSync(tempMdPath);
  }

  console.log('HTML files generated successfully!');
  console.log('Docs HTML:', docsHtml);
  console.log('Deploy HTML:', deployHtml);
  console.log('Downloads HTML:', downloadsHtml);
}

buildReport();

