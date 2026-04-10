import { useState, useEffect, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const C = { bg:"#080C14",surface:"#0D1321",card:"#111827",border:"#1E2A3A",text:"#E8EDF5",muted:"#8B9DC3",dim:"#4B5E7A",green:"#10B981",accent:"#3B82F6",purple:"#A855F7",critical:"#EF4444",high:"#F97316",medium:"#EAB308",low:"#22C55E",teal:"#14B8A6" };
const SEV = { Critical:C.critical,High:C.high,Medium:C.medium,Low:C.low };
const SC  = s => s>=80?C.low:s>=60?C.medium:s>=40?C.high:C.critical;
const GC  = g => ({A:C.low,B:C.teal,C:C.medium,D:C.high,F:C.critical}[g]||C.muted);
const Tip = ({active,payload,label}) => !active||!payload?.length?null:(<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 11px",fontSize:11}}>{label&&<div style={{fontWeight:700,color:C.text,marginBottom:3}}>{label}</div>}{payload.map((p,i)=><div key={i} style={{color:p.color||p.fill||C.accent}}>{p.name||"count"}: {p.value}</div>)}</div>);
const Spinner = () => <div style={{width:14,height:14,border:`2px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>;

// ── Severity badge ─────────────────────────────────────────────────────────
function SevBadge({ s }) { return <span style={{background:SEV[s]||C.muted,color:"#fff",borderRadius:4,padding:"2px 6px",fontSize:9,fontWeight:700,letterSpacing:"0.05em"}}>{s?.toUpperCase()}</span>; }

// ── Expandable issue card ──────────────────────────────────────────────────
function IssueCard({ issue }) {
  const [open,setOpen] = useState(false);
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:7,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
        <span style={{color:C.dim,fontSize:10,minWidth:20}}>#{issue.id}</span>
        <SevBadge s={issue.severity}/>
        <span style={{flex:1,fontSize:13,fontWeight:600,color:C.text}}>{issue.title}</span>
        <span style={{fontSize:10,color:C.muted,background:C.surface,padding:"2px 7px",borderRadius:4}}>{issue.category}</span>
        <span style={{color:C.dim,fontSize:11,transform:open?"rotate(180deg)":"none",transition:"0.15s"}}>▾</span>
      </div>
      {open&&<div style={{padding:"0 14px 12px",borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,margin:"10px 0 10px"}}>
          <div style={{fontSize:10,color:C.muted}}>📁 <span style={{color:C.accent}}>{issue.file}</span></div>
          <div style={{fontSize:10,color:C.muted}}>📍 {issue.line}</div>
          <div style={{fontSize:10,color:C.muted}}>⏱ <span style={{color:C.text}}>{issue.effort}</span></div>
        </div>
        <div style={{fontSize:12,color:C.muted,marginBottom:7,lineHeight:1.6}}><span style={{color:C.high,fontWeight:700}}>Found: </span>{issue.found}</div>
        <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}><span style={{color:C.low,fontWeight:700}}>Fix: </span>{issue.fix}</div>
      </div>}
    </div>
  );
}

// ── Report view (full audit) ───────────────────────────────────────────────
function ReportView({ report, onBack }) {
  const [tab,setTab]       = useState(0);
  const [filter,setFilter] = useState("All");
  const issues = report.issues||[];
  const sevCnt = {Critical:0,High:0,Medium:0,Low:0};
  issues.forEach(i=>{ if(sevCnt[i.severity]!==undefined) sevCnt[i.severity]++; });
  const sevData  = Object.entries(sevCnt).map(([name,value])=>({name,value,color:SEV[name]})).filter(d=>d.value>0);
  const catData  = Object.entries(issues.reduce((a,i)=>{a[i.category]=(a[i.category]||0)+1;return a;},{})).map(([name,value])=>({name,value}));
  const radData  = (report.grades||[]).map(g=>({subject:g.category.split(" ")[0],score:g.score||0}));
  const filtered = filter==="All"?issues:issues.filter(i=>i.severity===filter);
  const PTABS    = ["Overview","Issues ("+issues.length+")","Action Plan","Files"];

  return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"10px 22px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 11px",fontSize:11}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:800,color:C.text}}>{report.themeName}</div>
          <div style={{fontSize:11,color:C.muted}}>{report.storeName} · {new Date(report.auditDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
        </div>
        <div style={{background:SC(report.overallScore)+"22",border:`1px solid ${SC(report.overallScore)}44`,borderRadius:7,padding:"4px 13px",display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:20,fontWeight:900,color:SC(report.overallScore)}}>{report.overallScore}</span>
          <span style={{fontSize:11,color:C.muted}}>/100</span>
        </div>
        <div style={{display:"flex",gap:5}}>
          {Object.entries(sevCnt).filter(([,v])=>v>0).map(([k,v])=>(
            <span key={k} style={{background:SEV[k]+"22",color:SEV[k],border:`1px solid ${SEV[k]}44`,borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:700}}>{v} {k}</span>
          ))}
        </div>
      </div>
      {/* Tab bar */}
      <div style={{display:"flex",gap:2,padding:"8px 22px 0",borderBottom:`1px solid ${C.border}`,background:C.surface}}>
        {PTABS.map((t,i)=>(<div key={t} onClick={()=>setTab(i)} style={{padding:"7px 15px",fontSize:13,fontWeight:600,cursor:"pointer",borderBottom:tab===i?`2px solid ${C.accent}`:"2px solid transparent",color:tab===i?C.text:C.muted,transition:"0.15s"}}>{t}</div>))}
      </div>
      <div style={{padding:"20px 22px",maxWidth:960,margin:"0 auto"}}>

        {/* ─── OVERVIEW ─── */}
        {tab===0&&<div className="fadein">
          <div style={{display:"grid",gridTemplateColumns:"100px 1fr",gap:12,marginBottom:16}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"12px 8px"}}>
              <div style={{fontSize:38,fontWeight:900,color:SC(report.overallScore),lineHeight:1}}>{report.overallScore}</div>
              <div style={{fontSize:9,color:C.dim,marginTop:4,letterSpacing:"0.06em"}}>SCORE/100</div>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.07em",marginBottom:7}}>SUMMARY</div>
              <div style={{fontSize:13,color:C.text,lineHeight:1.7}}>{report.summary}</div>
              <div style={{fontSize:10,color:C.dim,marginTop:8}}>{report.filesAnalysed?.length||0} files analysed · {report.totalFilesInTheme||0} total · {issues.length} issues</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {[{l:"Total",v:issues.length,c:C.accent},{l:"Critical",v:sevCnt.Critical,c:C.critical},{l:"High",v:sevCnt.High,c:C.high},{l:"Medium",v:sevCnt.Medium,c:C.medium},{l:"Low",v:sevCnt.Low,c:C.low}].map(m=>(
              <div key={m.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"12px 16px",flex:1,minWidth:80}}>
                <div style={{fontSize:24,fontWeight:800,color:m.c}}>{m.v}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{m.l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:14}}>
              <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:8}}>By Severity</div>
              <ResponsiveContainer width="100%" height={130}><PieChart><Pie data={sevData} cx="50%" cy="50%" innerRadius={30} outerRadius={54} dataKey="value" paddingAngle={3}>{sevData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip content={<Tip/>}/></PieChart></ResponsiveContainer>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:6}}>{sevData.map(d=><div key={d.name} style={{display:"flex",alignItems:"center",gap:3,fontSize:10}}><div style={{width:6,height:6,borderRadius:"50%",background:d.color}}/><span style={{color:C.muted}}>{d.name}: <strong style={{color:C.text}}>{d.value}</strong></span></div>)}</div>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:14}}>
              <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:8}}>By Category</div>
              <ResponsiveContainer width="100%" height={150}><BarChart data={catData} layout="vertical" barCategoryGap="30%"><XAxis type="number" hide/><YAxis type="category" dataKey="name" width={115} tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/><Tooltip content={<Tip/>} cursor={{fill:"rgba(13,19,33,.6)"}}/><Bar dataKey="value" fill={C.accent} radius={[0,3,3,0]}/></BarChart></ResponsiveContainer>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:14}}>
              <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:8}}>Health Radar</div>
              <ResponsiveContainer width="100%" height={150}><RadarChart data={radData}><PolarGrid stroke={C.border}/><PolarAngleAxis dataKey="subject" tick={{fill:C.muted,fontSize:8}}/><PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/><Radar dataKey="score" stroke={C.accent} fill={C.accent} fillOpacity={0.2}/><Tooltip content={<Tip/>}/></RadarChart></ResponsiveContainer>
            </div>
          </div>
          {report.grades?.length>0&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:14,marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:12}}>Category Grades</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {report.grades.map(g=><div key={g.category} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"10px 12px",display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:32,height:32,borderRadius:6,background:GC(g.grade),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff",flexShrink:0}}>{g.grade}</div>
                <div><div style={{fontSize:11,fontWeight:600,color:C.text,lineHeight:1.3}}>{g.category}</div><div style={{fontSize:10,color:C.muted}}>{g.score}/100 · {g.issues} issue{g.issues!==1?"s":""}</div></div>
              </div>)}
            </div>
          </div>}
          {issues.filter(i=>["Critical","High"].includes(i.severity)).length>0&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:14}}>
            <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:10}}>Top Priority</div>
            {issues.filter(i=>["Critical","High"].includes(i.severity)).map(issue=>(
              <div key={issue.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <SevBadge s={issue.severity}/><div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{issue.title}</div><div style={{fontSize:11,color:C.muted}}>{issue.file} — {issue.effort}</div></div>
              </div>
            ))}
          </div>}
          {report.positives?.length>0&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:14,marginTop:12}}>
            <div style={{fontSize:11,fontWeight:700,color:C.low,marginBottom:8}}>✓ What the theme does well</div>
            {report.positives.map((p,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:5,fontSize:12,color:C.muted}}><span style={{color:C.low}}>•</span>{p}</div>)}
          </div>}
        </div>}

        {/* ─── ISSUES ─── */}
        {tab===1&&<div className="fadein">
          <div style={{display:"flex",gap:7,marginBottom:18,flexWrap:"wrap"}}>
            {["All","Critical","High","Medium","Low"].map(s=>(
              <button key={s} onClick={()=>setFilter(s)}
                style={{padding:"5px 13px",borderRadius:6,border:`1px solid ${filter===s?SEV[s]||C.accent:C.border}`,background:filter===s?(SEV[s]?SEV[s]+"22":C.accent+"22"):"transparent",color:filter===s?(SEV[s]||C.accent):C.muted,fontSize:12,fontWeight:600}}>
                {s}{s!=="All"?` (${sevCnt[s]||0})`:` (${issues.length})`}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"170px 1fr",gap:14}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:13,height:"fit-content"}}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:10,letterSpacing:"0.07em"}}>BREAKDOWN</div>
              {Object.entries(SEV).map(([n,col])=><div key={n} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:12,color:C.muted}}>{n}</span><span style={{fontSize:14,fontWeight:800,color:col}}>{sevCnt[n]}</span></div>)}
              <div style={{marginTop:9,padding:"5px 0"}}><div style={{fontSize:12,fontWeight:700,color:C.text}}>Total: {issues.length}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>Showing: {filtered.length}</div></div>
            </div>
            <div>{filtered.length===0?<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"28px",textAlign:"center",color:C.muted,fontSize:13}}>No issues match this filter</div>:filtered.map(issue=><IssueCard key={issue.id} issue={issue}/>)}</div>
          </div>
        </div>}

        {/* ─── ACTION PLAN ─── */}
        {tab===2&&<div className="fadein">
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            {(report.actionPlan||[]).map(p=>{ const col={Immediate:C.critical,"Sprint 1":C.high,"Sprint 2":C.medium,Process:C.teal}[p.phase]||C.accent; return(<div key={p.phase} style={{flex:1,background:C.card,border:`1px solid ${col}44`,borderRadius:9,padding:"12px 15px"}}><div style={{fontSize:10,fontWeight:700,color:col,letterSpacing:"0.07em",marginBottom:3}}>{p.phase.toUpperCase()}</div><div style={{fontSize:20,fontWeight:800,color:C.text}}>{p.items?.length||0}</div><div style={{fontSize:11,color:C.muted}}>actions</div></div>); })}
          </div>
          {(report.actionPlan||[]).map(p=>{ const col={Immediate:C.critical,"Sprint 1":C.high,"Sprint 2":C.medium,Process:C.teal}[p.phase]||C.accent; return(<div key={p.phase} style={{marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}><div style={{height:3,width:20,borderRadius:2,background:col}}/><div style={{fontSize:12,fontWeight:800,color:col,letterSpacing:"0.05em"}}>{p.phase.toUpperCase()}</div></div>
            {(p.items||[]).map((item,idx)=><div key={idx} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 13px",marginBottom:5,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:col,flexShrink:0}}/><div style={{flex:1,fontSize:13,color:C.text,fontWeight:500}}>{item.action}</div>
              {item.file&&<code style={{fontSize:10,color:C.accent,maxWidth:190,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.file}</code>}
              <div style={{fontSize:11,color:col,fontWeight:700,whiteSpace:"nowrap"}}>{item.effort}</div>
            </div>)}
          </div>); })}
        </div>}

        {/* ─── FILES ─── */}
        {tab===3&&<div className="fadein">
          <div style={{display:"flex",gap:10,marginBottom:18}}>
            {[{l:"Analysed",v:report.filesAnalysed?.length||0,c:C.accent},{l:"Total in theme",v:report.totalFilesInTheme||0,c:C.muted},{l:"Coverage",v:`${report.totalFilesInTheme?Math.round(((report.filesAnalysed?.length||0)/report.totalFilesInTheme)*100):0}%`,c:C.green}].map(m=><div key={m.l} style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"12px 15px"}}><div style={{fontSize:22,fontWeight:800,color:m.c}}>{m.v}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{m.l}</div></div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {(report.filesAnalysed||[]).map(f=><div key={f} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12}}>{f.endsWith(".liquid")?"💧":f.endsWith(".css")?"🎨":f.endsWith(".js")?"⚡":"📋"}</span>
              <code style={{fontSize:11,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f}</code>
            </div>)}
          </div>
        </div>}

      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard({ shop, storeUrl, accessToken, mcpUrl, onDisconnect }) {
  const [themes,   setThemes]   = useState([]);
  const [themeId,  setThemeId]  = useState("");
  const [projects, setProjects] = useState([]);
  const [openId,   setOpenId]   = useState(null);
  const [report,   setReport]   = useState(null);
  const [copied,   setCopied]   = useState("");
  const [polling,  setPolling]  = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [loadingThemes, setLT]  = useState(true);
  const [loadingReport, setLR]  = useState(false);
  const pollRef = useRef(null);

  const domain = storeUrl.replace(/^https?:\/\//,"").replace(/\/$/,"").toLowerCase();

  // Load themes
  useEffect(()=>{
    fetch("/api/shopify/themes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({storeUrl,accessToken})})
      .then(r=>r.json()).then(d=>{ if(d.themes){ setThemes(d.themes); const m=d.themes.find(t=>t.role==="main")||d.themes[0]; if(m) setThemeId(String(m.id)); } }).finally(()=>setLT(false));
  },[]);

  // Load projects
  const loadProjects = useCallback(async(quiet=false)=>{
    const r = await fetch(`/api/projects/list?store=${encodeURIComponent(domain)}`);
    const d = await r.json();
    setProjects(d.projects||[]);
  },[domain]);

  useEffect(()=>{ loadProjects(); },[loadProjects]);

  // Polling while waiting for audit
  useEffect(()=>{
    if(polling){ pollRef.current = setInterval(()=>loadProjects(true),7000); }
    else { clearInterval(pollRef.current); }
    return ()=>clearInterval(pollRef.current);
  },[polling,loadProjects]);

  const openReport = async(id)=>{
    setLR(true); setOpenId(id);
    const r = await fetch(`/api/projects/${id}?store=${encodeURIComponent(domain)}`);
    const d = await r.json();
    setReport(d.project||null); setLR(false);
  };

  const delProject = async(id)=>{
    setDeleting(id);
    await fetch(`/api/projects/${id}?store=${encodeURIComponent(domain)}`,{method:"DELETE"});
    await loadProjects(true);
    setDeleting(null);
  };

  const copy = (text,key)=>{ navigator.clipboard.writeText(text); setCopied(key); setTimeout(()=>setCopied(""),2200); };

  const selectedTheme = themes.find(t=>String(t.id)===themeId);

  const prompt = `Audit the Shopify theme using the shopify-auditor MCP tools.

Store URL: ${domain}
Access Token: [paste your shpat_ token here]
Theme ID: ${themeId||"[select a theme]"}

Steps:
1. shopify_connect — verify the credentials
2. shopify_get_audit_bundle — use theme_id ${themeId||"[id]"} (this fetches the top priority files)
3. Analyse all files across 8 categories:
   CSS Architecture · SEO · Performance · Accessibility
   Code Quality · Internationalization · Liquid Best Practices · JS/Security
4. save_audit_report — save the structured report to the dashboard (mandatory final step)

For each issue include: severity, category, file path, line, what was found (specific), fix, effort.
Also return: overall score /100, grades per category (A-F), phased action plan, positives.`;

  // If viewing a report
  if (openId && report) return <ReportView report={report} onBack={()=>{setOpenId(null);setReport(null);}}/>;
  if (openId && loadingReport) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:14}}>Loading report…</div>;

  return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"11px 22px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:28,height:28,borderRadius:6,background:C.green,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:800,color:C.text}}>Theme Auditor</div>
          <div style={{fontSize:11,color:C.muted}}>{shop.name} · {shop.domain}</div>
        </div>
        <div style={{display:"flex",gap:7,alignItems:"center"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:C.green}}/>
          <span style={{fontSize:11,color:C.muted}}>Connected</span>
          <button onClick={onDisconnect} style={{marginLeft:6,background:"transparent",color:C.dim,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 11px",fontSize:11}}>Disconnect</button>
        </div>
      </div>

      <div style={{padding:"22px",maxWidth:860,margin:"0 auto"}}>

        {/* ── Audit Panel ─────────────────────────────── */}
        <div style={{background:C.surface,border:`1px solid ${C.purple}44`,borderRadius:12,padding:"20px 22px",marginBottom:22}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.purple}}/>
            <span style={{fontSize:14,fontWeight:700,color:C.text}}>Run New Audit</span>
            <span style={{background:C.purple+"22",color:C.purple,fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:3}}>MCP</span>
          </div>

          {/* MCP URL */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.07em",marginBottom:6}}>STEP 1 — Add to Claude Code / Claude Desktop → MCP settings</div>
            <div style={{display:"flex",gap:8}}>
              <code style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 12px",fontSize:12,color:C.purple,display:"block"}}>{mcpUrl}</code>
              <button onClick={()=>copy(mcpUrl,"url")} style={{background:C.purple+"22",color:C.purple,border:`1px solid ${C.purple}44`,borderRadius:6,padding:"7px 14px",fontSize:11,fontWeight:700,flexShrink:0}}>{copied==="url"?"Copied!":"Copy URL"}</button>
            </div>
          </div>

          {/* Theme picker */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.07em",marginBottom:6}}>STEP 2 — Select theme to audit</div>
            {loadingThemes ? (
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.muted}}><Spinner/>Loading themes…</div>
            ) : (
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {themes.map(t=>(
                  <div key={t.id} onClick={()=>setThemeId(String(t.id))}
                    style={{background:themeId===String(t.id)?C.purple+"22":C.card,border:`1px solid ${themeId===String(t.id)?C.purple+"66":C.border}`,borderRadius:8,padding:"9px 14px",cursor:"pointer",transition:"all .15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span style={{fontSize:12,fontWeight:600,color:C.text}}>{t.name}</span>
                      {t.role==="main"&&<span style={{background:C.green+"22",color:C.green,fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:3}}>LIVE</span>}
                    </div>
                    <div style={{fontSize:10,color:C.dim,marginTop:2}}>{t.id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prompt */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.07em",marginBottom:6}}>STEP 3 — Copy prompt → paste in Claude Code → add your token → send</div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"11px 13px",marginBottom:8,maxHeight:130,overflowY:"auto"}}>
              <pre style={{fontSize:11,color:C.muted,lineHeight:1.6,whiteSpace:"pre-wrap",fontFamily:"monospace",margin:0}}>{prompt}</pre>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={()=>copy(prompt,"prompt")} style={{background:C.accent+"22",color:C.accent,border:`1px solid ${C.accent}44`,borderRadius:6,padding:"7px 16px",fontSize:12,fontWeight:700}}>
                {copied==="prompt"?"Copied!":"Copy Prompt"}
              </button>
              <button onClick={()=>setPolling(p=>!p)}
                style={{background:polling?C.green+"22":"transparent",color:polling?C.green:C.muted,border:`1px solid ${polling?C.green+"55":C.border}`,borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600}}>
                {polling?"⏸ Stop auto-refresh":"▶ Auto-refresh (waiting for Claude)"}
              </button>
              <button onClick={()=>loadProjects(true)} style={{background:"transparent",color:C.dim,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 11px",fontSize:11}}>↻</button>
              {polling&&<div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.green}}><div style={{width:5,height:5,borderRadius:"50%",background:C.green,animation:"pulse 1.5s ease-in-out infinite"}}/>Listening…</div>}
            </div>
            <div style={{fontSize:11,color:C.dim,marginTop:7}}>Claude will call <code style={{fontSize:10,color:C.purple}}>save_audit_report</code> when done — the report appears below automatically.</div>
          </div>
        </div>

        {/* ── Projects List ───────────────────────────── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text}}>Saved Audit Reports ({projects.length})</div>
        </div>

        {projects.length===0 ? (
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"44px 22px",textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:10}}>📋</div>
            <div style={{fontSize:13,color:C.text,marginBottom:7}}>No audit reports yet</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>Add the MCP URL to Claude Code, copy the prompt above, add your access token and send.<br/>Claude will run the audit and the report will appear here.</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:8}}>
            {projects.map(p=>(
              <div key={p.id} onClick={()=>openReport(p.id)}
                style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent+"66"} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                {/* Score circle */}
                <div style={{width:48,height:48,borderRadius:9,background:SC(p.overallScore)+"22",border:`1px solid ${SC(p.overallScore)}44`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <div style={{fontSize:18,fontWeight:900,color:SC(p.overallScore),lineHeight:1}}>{p.overallScore}</div>
                  <div style={{fontSize:8,color:C.dim}}>/100</div>
                </div>
                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>{p.themeName}</div>
                  <div style={{fontSize:11,color:C.muted}}>{new Date(p.auditDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                </div>
                {/* Pills */}
                <div style={{display:"flex",gap:5}}>
                  {p.critical>0&&<span style={{background:C.critical+"22",color:C.critical,border:`1px solid ${C.critical}44`,borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:700}}>{p.critical} Crit</span>}
                  {p.high>0&&<span style={{background:C.high+"22",color:C.high,border:`1px solid ${C.high}44`,borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:700}}>{p.high} High</span>}
                  <span style={{background:C.card,color:C.muted,borderRadius:4,padding:"2px 7px",fontSize:10}}>{p.issueCount} issues</span>
                </div>
                {/* Actions */}
                <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                  <button onClick={e=>{e.stopPropagation();openReport(p.id);}} style={{background:C.accent+"22",color:C.accent,border:`1px solid ${C.accent}44`,borderRadius:6,padding:"5px 11px",fontSize:11,fontWeight:700}}>View</button>
                  <button onClick={e=>{e.stopPropagation();delProject(p.id);}} disabled={deleting===p.id} style={{background:"transparent",color:C.dim,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 9px",fontSize:11}}>{deleting===p.id?"…":"✕"}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
