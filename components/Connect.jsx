import { useState } from "react";
const C = { bg:"#080C14",surface:"#0D1321",card:"#111827",border:"#1E2A3A",text:"#E8EDF5",muted:"#8B9DC3",dim:"#4B5E7A",green:"#10B981",red:"#EF4444" };

export default function Connect({ onConnected }) {
  const [url,   setUrl]   = useState("");
  const [tok,   setTok]   = useState("");
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState("");
  const [guide, setGuide] = useState(false);

  const go = async () => {
    if (!url.trim() || !tok.trim()) { setErr("Both fields are required."); return; }
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/shopify/connect", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ storeUrl:url.trim(), accessToken:tok.trim() }) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || "Connection failed."); return; }
      onConnected({ shop:d.shop, storeUrl:url.trim(), accessToken:tok.trim() });
    } catch(e) { setErr("Network error."); }
    finally { setBusy(false); }
  };

  const STEPS = [
    { n:"1", t:"Store Admin → Settings → Apps and sales channels", d:"Bottom-left corner of your Shopify admin" },
    { n:"2", t:"Click 'Develop apps'",  d:"Enable custom app development if prompted" },
    { n:"3", t:"Create an app",         d:"Name it anything e.g. Theme Auditor → Create app" },
    { n:"4", t:"Configuration → Admin API integration", d:"Enable: read_themes, write_themes, read_files, read_content → Save" },
    { n:"5", t:"Install app",           d:"Click Install app at the top → confirm" },
    { n:"6", t:"API credentials → Reveal token once", d:"Copy the shpat_xxx token — shown only once!" },
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
      <div style={{width:"100%",maxWidth:460}}>
        <div style={{textAlign:"center",marginBottom:30}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:36,height:36,borderRadius:8,background:C.green,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{fontSize:19,fontWeight:800,color:C.text}}>Theme Auditor</span>
          </div>
          <p style={{fontSize:12,color:C.muted}}>Connect your store · run audits via Claude + MCP</p>
        </div>

        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"24px 26px",marginBottom:12}}>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.08em",marginBottom:7}}>STORE URL</label>
            <div style={{display:"flex",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
              <span style={{padding:"10px 12px",fontSize:12,color:C.dim,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>https://</span>
              <input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="your-store.myshopify.com"
                style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"10px 12px",fontSize:13,color:C.text,fontFamily:"monospace"}}/>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.08em",marginBottom:7}}>ADMIN API ACCESS TOKEN</label>
            <input type="password" value={tok} onChange={e=>setTok(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
              style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.text,outline:"none",fontFamily:"monospace"}}/>
            <div style={{fontSize:11,color:C.dim,marginTop:5}}>Store Admin → Settings → Apps → Develop apps → your app → API credentials</div>
          </div>
          {err && <div style={{background:"#1a0505",border:`1px solid ${C.red}33`,borderRadius:8,padding:"9px 13px",marginBottom:14,fontSize:12,color:C.red}}>{err}</div>}
          <button onClick={go} disabled={busy} style={{width:"100%",background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:14,fontWeight:700,opacity:busy?.75:1}}>
            {busy?"Connecting…":"Connect Store →"}
          </button>
        </div>

        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
          <div onClick={()=>setGuide(o=>!o)} style={{padding:"12px 18px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:13,fontWeight:600,color:C.text}}>How to get the shpat_ token</span>
            <span style={{color:C.dim,transform:guide?"rotate(180deg)":"none",transition:"0.2s"}}>▾</span>
          </div>
          {guide && (
            <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 18px"}}>
              {STEPS.map((s,i)=>(
                <div key={i} style={{display:"flex",gap:11,marginBottom:i<STEPS.length-1?12:0}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:C.green+"22",border:`1px solid ${C.green}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,fontWeight:700,color:C.green,marginTop:1}}>{s.n}</div>
                  <div><div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:1}}>{s.t}</div><div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{s.d}</div></div>
                </div>
              ))}
              <div style={{marginTop:12,background:C.card,borderRadius:6,padding:"8px 12px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#EAB308",marginBottom:3,letterSpacing:"0.06em"}}>REQUIRED SCOPES</div>
                <code style={{fontSize:11,color:C.muted}}>read_themes · write_themes · read_files · read_content</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
