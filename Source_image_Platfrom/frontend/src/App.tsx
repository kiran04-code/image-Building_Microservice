import { useEffect, useState } from 'react';
import { Bell, Box, Boxes, BookOpen, Check, ChevronDown, CircleHelp, Code2, Copy, FolderGit2, GitFork, Grid2X2, HardDrive, Image, LayoutDashboard, Menu, Package, Play, Plus, Search, Settings, ShieldCheck, Terminal, X, Zap } from 'lucide-react';

type Page = 'Dashboard' | 'API Docs' | 'Builds';
type Status = 'Success' | 'Building' | 'Failed' | 'Queued';
type RemoteBuild = {
  id: string;
  status: 'queued' | 'building' | 'success' | 'failed' | 'cancelled';
  repository: { owner: string; name: string };
  image: { reference: string; pullCommand: string };
  logsUrl?: string;
  errorMessage?: string;
};
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://image-building-microservice-hanr.vercel.app';
const API_URL = import.meta.env.VITE_BUILD_API_URL ?? `${API_BASE_URL}/api/builds`;
const Github = GitFork;
const builds = [['kiran/example-app', 'a82df91', 'React', 'Success', '1m 14s', '2 min ago'], ['kiran/api-service', 'fa91be2', 'Node.js', 'Building', '—', '12 min ago'], ['kiran/python-api', 'ab72fd1', 'Python', 'Failed', '42s', '1 hour ago'], ['acme/design-system', '8cef120', 'Next.js', 'Queued', '—', '2 hours ago']] as const;
const nav: { name: Page; icon: typeof LayoutDashboard }[] = [{ name: 'Dashboard', icon: LayoutDashboard }, { name: 'API Docs', icon: BookOpen }];
const logs = ['$ git clone https://github.com/kiran/example-app', 'Cloning repository...', '✓ Repository cloned', 'Analyzing project...', '✓ Node.js detected', '✓ React + Vite detected', '✓ npm detected', '$ npm install', 'added 428 packages', '$ npm run build', 'vite building for production...', 'transforming modules...', '✓ 1287 modules transformed', 'dist/index.html', 'dist/assets/index.js', '✓ built successfully', 'Creating OCI image...', 'Exporting layers...', 'Pushing image...', 'Build completed successfully.'];
function Badge({ status }: { status: Status }) { return <span className={'badge ' + status.toLowerCase()}><i />{status}</span> }
function CopyButton({ value }: { value: string }) { const [done, setDone] = useState(false); return <button className="icon-btn" title="Copy command" onClick={() => { navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500) }}>{done ? <Check size={16} /> : <Copy size={16} />}</button> }
function App() {
    const [page, setPage] = useState<Page>('Dashboard'), [mobile, setMobile] = useState(false), [build, setBuild] = useState<'idle' | 'analyzing' | 'building' | 'success' | 'failed'>('idle'), [repo, setRepo] = useState('https://github.com/kiran/example-app'), [remoteBuild, setRemoteBuild] = useState<RemoteBuild | null>(null), [toast, setToast] = useState(''); const notify = (s: string) => { setToast(s); setTimeout(() => setToast(''), 2200) };
    useEffect(() => { if (!remoteBuild || !['queued', 'building'].includes(remoteBuild.status)) return; const timer = window.setInterval(async () => { try { const response = await fetch(`${API_URL}/${remoteBuild.id}`); if (!response.ok) throw new Error('Unable to update build status'); const next: RemoteBuild = await response.json(); setRemoteBuild(next); if (next.status === 'success') setBuild('success'); if (next.status === 'failed' || next.status === 'cancelled') setBuild('failed'); } catch (error) { notify(error instanceof Error ? error.message : 'Unable to update build status'); } }, 2500); return () => clearInterval(timer); }, [remoteBuild?.id, remoteBuild?.status]);
    const start = async () => { setBuild('analyzing'); try { const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repoUrl: repo }) }); const result = await response.json(); if (!response.ok) throw new Error(result.message); setRemoteBuild(result); setBuild('building'); notify('Remote ECR build started'); } catch (error) { setBuild('idle'); notify(error instanceof Error ? error.message : 'Build failed to start'); } };
    return <div className="app">{mobile && <div className="scrim" onClick={() => setMobile(false)} />}<aside className={mobile ? 'open' : ''}><div className="brand"><span><Zap size={19} /></span>ImageForge</div><div className="brand-subtitle">PUBLIC SOURCE BUILDER</div><nav>{nav.map(({ name, icon: Icon }) => <button key={name} onClick={() => { setPage(name); setBuild('idle'); setMobile(false) }} className={page === name ? 'active' : ''}><Icon size={18} />{name}</button>)}</nav><div className="side-bottom"><button onClick={() => setPage('API Docs')}><CircleHelp size={18} />Documentation</button><div className="privacy-note"><ShieldCheck size={17} /><span><b>Stateless by design</b>Your repository URL is used only for this build.</span></div></div></aside><main><header><button className="menu" onClick={() => setMobile(true)}><Menu size={20} /></button><div className="crumb">ImageForge <span>/</span> <b>{build !== 'idle' ? 'Build in progress' : page}</b></div><div className="top-actions"><span className="public-pill"><i />Public API</span><button className="icon-btn" title="GitHub"><Github size={18} /></button></div></header><section className="content">{page === 'Dashboard' && build === 'idle' && <Dashboard repo={repo} setRepo={setRepo} start={start} setPage={setPage} />} {build === 'analyzing' && <Analysis />}{build === 'building' && <Progress build={remoteBuild} />} {build === 'success' && <Success image={remoteBuild?.image} restart={start} notify={notify} />} {build === 'failed' && <BuildFailed restart={start} build={remoteBuild} />} {page === 'API Docs' && <ApiDocs notify={notify} setPage={setPage} />}</section></main>{toast && <div className="toast"><Check size={17} />{toast}</div>}</div>
}
function Dashboard({ repo, setRepo, start, setPage }: { repo: string; setRepo: (s: string) => void; start: () => void; setPage: (p: Page) => void }) { return <><div className="hero"><span className="eyebrow"><Zap size={14} />SOURCE TO IMAGE</span><h1>Build container images<br />from source.</h1><p>Paste a GitHub repository and turn your source code into a ready-to-use OCI container image.</p><div className="repo-card"><label>GitHub repository</label><div className="repo-form"><Github size={20} /><input value={repo} onChange={e => setRepo(e.target.value)} aria-label="GitHub repository URL" /><button onClick={start}>Build Image <Play size={15} /></button></div><footer><span><Check size={14} />Public repositories can be analyzed instantly.</span><button><Github size={15} />Connect GitHub</button></footer></div></div><section className="section-head"><div><h2>Recent builds</h2><p>Track the latest image builds across your projects.</p></div><button className="text-btn" onClick={() => setPage('Builds')}>View all builds →</button></section><BuildTable rows={builds.slice(0, 3)} /></> }
function BuildTable({ rows }: { rows: readonly (readonly string[])[] }) { return <div className="table-wrap"><table><thead><tr><th>Repository</th><th>Commit</th><th>Stack</th><th>Status</th><th>Build time</th><th>Image</th><th>Created</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r[0]}><td><span className="repo-name"><Box size={16} />{r[0]}</span></td><td><code>{r[1]}</code></td><td>{r[2]}</td><td><Badge status={r[3] as Status} /></td><td>{r[4]}</td><td className="muted">{i === 0 ? 'imageforge.dev/kiran/example-app:a82df91' : '—'}</td><td className="muted">{r[5]}</td></tr>)}</tbody></table></div> }
function Analysis() { return <div className="build-view"><span className="eyebrow">BUILD #24</span><h1>Analyzing repository<span className="dots">...</span></h1><p>We’re inspecting your source code and build configuration.</p><div className="analysis-card"><div className="skeleton title" /><div className="analysis-grid">{Array.from({ length: 8 }, (_, i) => <div key={i}><div className="skeleton label" /><div className="skeleton line" /></div>)}</div></div></div> }
function Progress({ build }: { build: RemoteBuild | null }) {
  const isQueued = build?.status === 'queued';
  const steps = ['Repository queued', 'Remote build started', 'Creating OCI image', 'Pushing image to ECR', 'Build complete'];
  const currentStep = isQueued ? 0 : 2;
  return <div className="build-view"><div className="build-top"><div><span className="eyebrow">{build?.repository.owner} / {build?.repository.name}</span><h1>Building image</h1><p>CodeBuild is building and pushing this image to Amazon ECR.</p></div><Badge status={isQueued ? "Queued" : "Building"} /></div><div className="build-grid"><section className="steps"><h3>Build progress</h3>{steps.map((step, index) => <div className={'step ' + (index < currentStep ? 'complete' : index === currentStep ? 'current' : '')} key={step}><span>{index < currentStep ? <Check size={14} /> : index === currentStep ? <i /> : index + 1}</span><div><b>{step}</b><small>{index < currentStep ? 'Completed' : index === currentStep ? 'In progress' : 'Waiting to start'}</small></div></div>)}</section><section className="terminal"><div className="terminal-head"><span><i /><i /><i /></span><b><Terminal size={14} />Remote build status</b></div><pre>{`Build ID: ${build?.id}\nStatus: ${build?.status}\n\nThe frontend checks the backend every 2.5 seconds.\nThe ECR image URI appears when the build succeeds.`}</pre><footer><span><i />Live polling</span></footer></section></div></div>
}
function BuildFailed({ restart, build }: { restart: () => void; build: RemoteBuild | null }) {
  return <div className="result">
    <h1>Build failed</h1>
    <p>{build?.errorMessage || "CodeBuild could not build or publish this image to ECR."}</p>
    <div className="result-actions" style={{ marginTop: 20 }}>
      {build?.logsUrl && <a href={build.logsUrl} target="_blank" rel="noreferrer" className="secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>View CloudWatch Logs</a>}
      <button onClick={restart}>Try again <Play size={14} /></button>
    </div>
  </div>;
}
function Success({ image: ecrImage, restart, notify }: { image?: RemoteBuild['image']; restart: () => void; notify: (s: string) => void }) { const image = ecrImage?.reference ?? 'ECR image unavailable', pull = ecrImage?.pullCommand ?? ''; return <div className="result"><div className="success-icon"><Check size={33} /></div><span className="eyebrow">ECR IMAGE READY</span><h1>Your image is ready</h1><p>Your repository was successfully converted into a container image.</p><div className="command-card"><label>Amazon ECR image URI</label><div><code>{image}</code><CopyButton value={image} /></div></div><div className="command-card"><label>Docker pull command</label><div><code>{pull}</code><CopyButton value={pull} /></div></div><div className="metadata">{[['Image format', 'OCI'], ['Registry', 'Amazon ECR'], ['Created', 'Just now']].map(x => <div key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></div>)}</div><div className="result-actions"><button className="secondary" onClick={() => notify('Image URL copied')}>Copy Image</button><button onClick={restart}>Build Again <Play size={14} /></button></div></div> }
function Projects() { return <PageHead title="Projects" text="Source repositories configured to build container images." action="New Project"><div className="toolbar"><Search size={18} /><input placeholder="Search projects" /><button>Latest activity <ChevronDown size={15} /></button></div><div className="cards">{[['example-app', 'React + Vite', 'Success'], ['api-service', 'Node.js + Express', 'Building'], ['payment-service', 'Python FastAPI', 'Success']].map((p, i) => <article className="project" key={p[0]}><div><span className="project-icon"><Github size={20} /></span><Badge status={p[2] as Status} /></div><h3>{p[0]}</h3><p>{p[1]}</p><hr /><small>Latest image</small><code>imageforge.dev/kiran/{p[0]}:{i ? 'latest' : 'a82df91'}</code><footer>Updated {i + 1}h ago <span>→</span></footer></article>)}</div></PageHead> }
function Builds() { return <PageHead title="Builds" text="Every build across your ImageForge workspace."><div className="filter"><button className="selected">All</button>{['Success', 'Building', 'Failed', 'Queued'].map(x => <button key={x}>{x}</button>)}<div><Search size={16} /><input placeholder="Search repository" /></div></div><BuildTable rows={builds} /></PageHead> }
function Images({ notify }: { notify: (s: string) => void }) { return <PageHead title="Container images" text="Manage images generated from your source repositories."><div className="image-list">{['example-app:a82df91', 'api-service:fa91be2', 'payment-service:latest'].map((x, i) => <article key={x}><span className="image-icon"><Image size={21} /></span><div><code>registry.imageforge.dev/kiran/{x}</code><p>{x.split(':')[0]} · {i ? 'linux/amd64 · 96 MB' : 'linux/amd64 · 182 MB'} · {i + 1} hours ago</p></div><CopyButton value={'docker pull registry.imageforge.dev/kiran/' + x} /><button className="secondary">View project</button></article>)}</div></PageHead> }
function Registry() { return <PageHead title="Container Registry" text="Your private registry for production-ready OCI images."><div className="registry-host"><div><span className="project-icon"><Package size={22} /></span><div><small>REGISTRY HOSTNAME</small><h2>registry.imageforge.dev</h2></div></div><CopyButton value="registry.imageforge.dev" /></div><div className="stat-grid">{[['Total images', '24', Image], ['Storage used', '1.8 GB', HardDrive], ['Image pulls', '1,284', Boxes], ['Projects', '8', Grid2X2]].map(([a, b, Icon]) => { const I = Icon as typeof Image; return <article key={a as string}><I size={19} /><span>{a as string}</span><b>{b as string}</b></article> })}</div><div className="usage-code"><label>GET STARTED</label><code>docker login registry.imageforge.dev<br />docker pull registry.imageforge.dev/kiran/example-app:latest</code></div></PageHead> }
function SettingsPage({ notify }: { notify: (s: string) => void }) { return <PageHead title="Settings" text="Manage your workspace preferences and integrations."><div className="settings">{[['General', 'Display name', 'Kiran Shah', 'Default branch', 'main'], ['Build defaults', 'Build timeout', '20 minutes', 'Default image tag', 'latest'], ['GitHub connection', 'GitHub account', 'kiran-shah', 'Connection', 'Connected']].map(s => <article key={s[0]}><h3>{s[0]}</h3><div><label>{s[1]}</label><input defaultValue={s[2]} /></div><div><label>{s[3]}</label><input defaultValue={s[4]} /></div><footer><button className="secondary" onClick={() => notify('Settings saved')}>Save changes</button></footer></article>)}</div></PageHead> }

function ApiDocs({ notify, setPage }: { notify: (s: string) => void; setPage: (p: Page) => void }) {
  const [langTab, setLangTab] = useState<'curl' | 'javascript' | 'python' | 'nodejs'>('curl');
  const [testerRepo, setTesterRepo] = useState('https://github.com/kiran04-code/frontend');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: number; timeMs: number; data: unknown } | null>(null);

  const endpointUrl = `${API_BASE_URL}/api/builds`;

  const presets = [
    { label: 'React (Vite)', url: 'https://github.com/kiran04-code/frontend' },
    { label: 'Next.js App', url: 'https://github.com/kiran04-code/MxThifts' },
    { label: 'Node.js API', url: 'https://github.com/kiran04-code/backend' },
    { label: 'Python FastAPI', url: 'https://github.com/kiran04-code/python-service' },
  ];

  const codeSnippets = {
    curl: `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"repoUrl": "https://github.com/owner/repository"}'`,
    javascript: `const response = await fetch("${endpointUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    repoUrl: "https://github.com/owner/repository"
  })
});
const data = await response.json();
console.log(data);`,
    python: `import requests

url = "${endpointUrl}"
payload = {"repoUrl": "https://github.com/owner/repository"}

response = requests.post(url, json=payload)
print(response.json())`,
    nodejs: `const axios = require('axios');

async function createBuild() {
  const { data } = await axios.post('${endpointUrl}', {
    repoUrl: 'https://github.com/owner/repository'
  });
  console.log(data);
}
createBuild();`
  };

  const runLiveTest = async () => {
    setTesting(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: testerRepo })
      });
      const data = await response.json();
      const timeMs = Math.round(performance.now() - start);
      setTestResult({ status: response.status, timeMs, data });
      notify(`Response received (${response.status})`);
    } catch (err) {
      const timeMs = Math.round(performance.now() - start);
      setTestResult({
        status: 500,
        timeMs,
        data: { error: err instanceof Error ? err.message : 'Network error' }
      });
      notify('API call failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="api-docs">
      <div className="api-docs-hero">
        <span className="eyebrow"><Code2 size={15} />REST API DOCUMENTATION v1.0</span>
        <div className="api-header-row">
          <div>
            <h1>Source-to-Image API</h1>
            <p className="api-docs-desc">
              Programmatically trigger Docker container builds from public GitHub repositories and stream real-time OCI image outputs pushed to Amazon ECR.
            </p>
          </div>
          <div className="base-url-bar">
            <span>BASE URL</span>
            <code>{API_BASE_URL}</code>
            <CopyButton value={API_BASE_URL} />
          </div>
        </div>
      </div>

      <div className="api-layout-grid">
        <div className="api-main-content">
          {/* Interactive Live Workbench */}
          <div className="live-tester-card">
            <div className="live-tester-header">
              <h3><Play size={16} color="#2563eb" />Live API Console</h3>
              <span className="live-tester-badge">
                <i /> Live Microservice
              </span>
            </div>
            <p className="live-tester-desc">
              Execute live requests directly against the production Vercel microservice and inspect response latency and payloads.
            </p>

            {/* Quick Presets */}
            <div className="preset-chips-row">
              <span className="preset-chips-label">Quick test presets:</span>
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className={`preset-chip ${testerRepo === p.url ? 'active' : ''}`}
                  onClick={() => setTesterRepo(p.url)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="live-tester-input-row">
              <div className="live-tester-input-wrap">
                <span className="input-method-tag">POST</span>
                <input
                  value={testerRepo}
                  onChange={(e) => setTesterRepo(e.target.value)}
                  placeholder="https://github.com/owner/repository"
                  aria-label="Target repository URL for API tester"
                />
              </div>
              <button
                type="button"
                className="live-tester-submit-btn"
                onClick={runLiveTest}
                disabled={testing}
              >
                {testing ? 'Executing...' : 'Send Request'} <Play size={14} />
              </button>
            </div>

            {testResult && (
              <div className="tester-response-box">
                <div className="tester-response-header">
                  <div className="tester-response-header-left">
                    <Terminal size={14} color="#3b82f6" />
                    <span>RESPONSE PAYLOAD</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 11 }}>{testResult.timeMs}ms</span>
                    <span className={`status-pill ${testResult.status < 400 ? 'success' : 'error'}`}>
                      {testResult.status} {testResult.status === 202 ? 'ACCEPTED' : testResult.status === 200 ? 'OK' : 'ERROR'}
                    </span>
                  </div>
                </div>
                <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Endpoint 1: POST /api/builds */}
          <div className="endpoint-card">
            <div className="endpoint-head">
              <div className="endpoint-badge-group">
                <span className="method-tag post">POST</span>
                <span className="endpoint-uri">/api/builds</span>
              </div>
              <CopyButton value={endpointUrl} />
            </div>
            <p className="endpoint-desc">
              Submits a GitHub repository URL, auto-detects the project framework (Next.js, Vite, Node.js, Python, Go, Java), generates an in-memory Dockerfile, and triggers an asynchronous AWS CodeBuild job.
            </p>

            <div className="section-label">Request Body (application/json)</div>
            <div className="params-table-wrap">
              <table className="params-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>repoUrl</code></td>
                    <td><span className="req-badge no">string</span></td>
                    <td><span className="req-badge yes">Yes</span></td>
                    <td>Valid public HTTPS GitHub repository URL (e.g. <code>https://github.com/owner/repo</code>).</td>
                  </tr>
                  <tr>
                    <td><code>branch</code></td>
                    <td><span className="req-badge no">string</span></td>
                    <td><span className="req-badge no">No</span></td>
                    <td>Specific git branch to build (defaults to repository default branch).</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="section-label">Code Examples</div>
            <div className="code-tabs-wrapper">
              <div className="code-tabs-bar">
                <div className="code-tabs">
                  {(['curl', 'javascript', 'python', 'nodejs'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`code-tab ${langTab === tab ? 'active' : ''}`}
                      onClick={() => setLangTab(tab)}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>
                <CopyButton value={codeSnippets[langTab]} />
              </div>
              <pre>{codeSnippets[langTab]}</pre>
            </div>
          </div>

          {/* Endpoint 2: GET /api/builds/:id */}
          <div className="endpoint-card">
            <div className="endpoint-head">
              <div className="endpoint-badge-group">
                <span className="method-tag get">GET</span>
                <span className="endpoint-uri">/api/builds/:id</span>
              </div>
              <CopyButton value={`${API_BASE_URL}/api/builds/build_example_id`} />
            </div>
            <p className="endpoint-desc">
              Retrieves the real-time status of a build job, CodeBuild phase progression, deep CloudWatch logs URL, and the generated Amazon ECR image URI upon completion.
            </p>

            <div className="section-label">Response Schema (200 OK)</div>
            <div className="code-tabs-wrapper">
              <pre>{`{
  "id": "build_7827080b-22ce-4120-a314-0202685f68e9",
  "providerBuildId": "imageforge-ecr-builder:dc86fd4b-36c6-4ada-93f7-316c349dcae9",
  "status": "success",
  "repository": {
    "url": "https://github.com/kiran04-code/frontend",
    "owner": "kiran04-code",
    "name": "frontend"
  },
  "project": {
    "language": "TypeScript/JavaScript",
    "framework": "React + Vite",
    "port": 80,
    "dockerfileGenerated": true
  },
  "image": {
    "registry": "395799817837.dkr.ecr.ap-south-1.amazonaws.com",
    "repository": "imageforge",
    "tag": "main",
    "reference": "395799817837.dkr.ecr.ap-south-1.amazonaws.com/imageforge:main",
    "pullCommand": "docker pull 395799817837.dkr.ecr.ap-south-1.amazonaws.com/imageforge:main"
  },
  "logsUrl": "https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1..."
}`}</pre>
            </div>
          </div>

          {/* Endpoint 3: GET /health */}
          <div className="endpoint-card">
            <div className="endpoint-head">
              <div className="endpoint-badge-group">
                <span className="method-tag get">GET</span>
                <span className="endpoint-uri">/health</span>
              </div>
              <CopyButton value={`${API_BASE_URL}/health`} />
            </div>
            <p className="endpoint-desc">
              Returns microservice uptime and operational health status.
            </p>
          </div>
        </div>

        {/* Sidebar Panel */}
        <aside className="api-sidebar">
          {/* Architecture Specs */}
          <div className="sidebar-panel">
            <div className="sidebar-panel-header">
              <h4><ShieldCheck size={17} color="#2563eb" />Architecture Specs</h4>
              <span className="sidebar-status-pill"><i /> Active</span>
            </div>
            <ul className="feature-list">
              <li>
                <div className="feature-icon-badge"><Check size={12} /></div>
                <div>
                  <b>Serverless Vercel Edge</b>
                  <span>Node.js express handler</span>
                </div>
              </li>
              <li>
                <div className="feature-icon-badge"><Check size={12} /></div>
                <div>
                  <b>AWS CodeBuild Engine</b>
                  <span>Privileged Docker runtime</span>
                </div>
              </li>
              <li>
                <div className="feature-icon-badge"><Check size={12} /></div>
                <div>
                  <b>Amazon ECR Registry</b>
                  <span>Public & Private OCI image push</span>
                </div>
              </li>
              <li>
                <div className="feature-icon-badge"><Check size={12} /></div>
                <div>
                  <b>Multi-Stage OCI Builds</b>
                  <span>Optimized container layers</span>
                </div>
              </li>
              <li>
                <div className="feature-icon-badge"><Check size={12} /></div>
                <div>
                  <b>Auto Monorepo Detection</b>
                  <span>Finds subfolders like maxx/, frontend/</span>
                </div>
              </li>
              <li>
                <div className="feature-icon-badge"><Check size={12} /></div>
                <div>
                  <b>Stateless & Ephemeral</b>
                  <span>Zero source data retention</span>
                </div>
              </li>
            </ul>

            <div className="specs-meta-grid">
              <div className="specs-meta-item">
                <small>AWS Region</small>
                <b>ap-south-1</b>
              </div>
              <div className="specs-meta-item">
                <small>Build Latency</small>
                <b>~1.4s dispatch</b>
              </div>
            </div>

            <button type="button" className="quick-action-btn" onClick={() => setPage('Dashboard')}>
              Open Interactive Builder →
            </button>
          </div>

          {/* Production Base URL */}
          <div className="sidebar-panel sidebar-panel-dark">
            <div className="sidebar-panel-header">
              <h4><Zap size={16} color="#60a5fa" />Production Base URL</h4>
              <span className="sidebar-status-pill"><i /> Online</span>
            </div>
            <div className="url-display-card">
              <code>{API_BASE_URL}</code>
              <CopyButton value={API_BASE_URL} />
            </div>
            <button
              type="button"
              className="quick-action-btn-dark"
              onClick={() => {
                navigator.clipboard?.writeText(API_BASE_URL);
                notify('Production URL copied to clipboard');
              }}
            >
              <Copy size={13} /> Copy Full API URL
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PageHead({ title, text, action, children }: { title: string; text: string; action?: string; children: React.ReactNode }) { return <div className="page"><div className="page-title"><div><h1>{title}</h1><p>{text}</p></div>{action && <button><Plus size={16} />{action}</button>}</div>{children}</div> }; export default App;
