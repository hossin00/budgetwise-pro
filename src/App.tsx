import { useState, useMemo } from 'react';
import { Wallet, Plus, Trash2, X, TrendingUp, TrendingDown, Target, Download } from 'lucide-react';

interface Envelope { id:string; name:string; emoji:string; budget:number; spent:number; color:string; }
interface Transaction { id:string; envelopeId:string; amount:number; note:string; date:string; type:'spend'|'add'; }
interface Goal { id:string; name:string; target:number; saved:number; color:string; }

const COLORS=['#f59e0b','#3b82f6','#10b981','#ec4899','#8b5cf6','#f97316','#06b6d4','#22c55e'];
const SAVE_E='bw_envelopes_v1'; const SAVE_T='bw_txns_v1'; const SAVE_G='bw_goals_v1';
const loadE=():Envelope[]=>{try{return JSON.parse(localStorage.getItem(SAVE_E)||'[]')}catch{return[]}};
const loadT=():Transaction[]=>{try{return JSON.parse(localStorage.getItem(SAVE_T)||'[]')}catch{return[]}};
const loadG=():Goal[]=>{try{return JSON.parse(localStorage.getItem(SAVE_G)||'[]')}catch{return[]}};

export default function App() {
  const [envelopes,setEnvelopes] = useState<Envelope[]>(loadE);
  const [txns,     setTxns]      = useState<Transaction[]>(loadT);
  const [goals,    setGoals]     = useState<Goal[]>(loadG);
  const [tab,      setTab]       = useState<'envelopes'|'goals'|'history'>('envelopes');
  const [showAdd,  setShowAdd]   = useState<null|'envelope'|'goal'|'spend'>('null' as any);
  const [selEnv,   setSelEnv]    = useState<string|null>(null);

  const saveE=(items:Envelope[])=>{setEnvelopes(items);localStorage.setItem(SAVE_E,JSON.stringify(items))};
  const saveT=(items:Transaction[])=>{setTxns(items);localStorage.setItem(SAVE_T,JSON.stringify(items))};
  const saveG=(items:Goal[])=>{setGoals(items);localStorage.setItem(SAVE_G,JSON.stringify(items))};

  const totalBudget = envelopes.reduce((s,e)=>s+e.budget, 0);
  const totalSpent  = envelopes.reduce((s,e)=>s+e.spent,  0);
  const remaining   = totalBudget - totalSpent;

  const exportCSV = () => {
    const header = 'Date,Envelope,Amount,Note,Type';
    const rows = txns.map(t => {
      const env = envelopes.find(e=>e.id===t.envelopeId)?.name||'';
      return [t.date,env,t.amount,t.note,t.type].join(',');
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([[header,...rows].join('\n')],{type:'text/csv'}));
    a.download = 'budget-report.csv'; a.click();
  };

  const addSpend = (envId:string, amount:number, note:string) => {
    const env = envelopes.find(e=>e.id===envId); if(!env) return;
    const newSpent = env.spent + amount;
    saveE(envelopes.map(e=>e.id===envId?{...e,spent:newSpent}:e));
    saveT([{id:crypto.randomUUID(),envelopeId:envId,amount,note,date:new Date().toISOString().split('T')[0],type:'spend'},...txns]);
  };

  return (
    <div style={{minHeight:'100vh',background:'#0a0800',display:'flex',flexDirection:'column'}}>
      <header style={{padding:'16px 20px',borderBottom:'1px solid #451a0320',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px #f59e0b30'}}><Wallet size={16} color="white"/></div>
          <div><div style={{fontWeight:'700',fontSize:'16px',color:'white',lineHeight:1}}>BudgetWise Pro</div>
          <div style={{fontSize:'11px',color:'#92400e',marginTop:'2px'}}>Envelope budgeting</div></div>
        </div>
        <div style={{display:'flex',gap:'4px'}}>
          <button onClick={exportCSV} style={{padding:'7px',borderRadius:'7px',background:'none',border:'none',cursor:'pointer',color:'#92400e'}}><Download size={15}/></button>
          <button onClick={()=>setShowAdd(tab==='goals'?'goal':'envelope')}
            style={{display:'flex',alignItems:'center',gap:'5px',padding:'8px 14px',borderRadius:'9px',background:'#f59e0b',border:'none',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',boxShadow:'0 4px 12px #f59e0b30'}}>
            <Plus size={13}/> Add
          </button>
        </div>
      </header>

      {/* Summary card */}
      {envelopes.length>0&&<div style={{margin:'12px 20px',padding:'16px',background:'linear-gradient(135deg,#451a03,#78350f)',borderRadius:'14px',border:'1px solid #f59e0b20'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',textAlign:'center'}}>
          <div><div style={{fontSize:'16px',fontWeight:'700',color:'#fcd34d'}}>${totalBudget.toLocaleString()}</div><div style={{fontSize:'10px',color:'#92400e'}}>Budgeted</div></div>
          <div><div style={{fontSize:'16px',fontWeight:'700',color:'#f87171'}}>${totalSpent.toLocaleString()}</div><div style={{fontSize:'10px',color:'#92400e'}}>Spent</div></div>
          <div><div style={{fontSize:'16px',fontWeight:'700',color:remaining>=0?'#34d399':'#f87171'}}>${remaining.toLocaleString()}</div><div style={{fontSize:'10px',color:'#92400e'}}>Left</div></div>
        </div>
        <div style={{height:'5px',background:'#451a03',borderRadius:'3px',overflow:'hidden',marginTop:'12px'}}>
          <div style={{width:`${Math.min(100,totalBudget>0?(totalSpent/totalBudget*100):0)}%`,height:'100%',background:remaining<0?'#ef4444':'#f59e0b',borderRadius:'3px',transition:'width 0.5s'}}/>
        </div>
      </div>}

      {/* Tabs */}
      <div style={{display:'flex',padding:'0 20px',borderBottom:'1px solid #451a0320'}}>
        {(['envelopes','goals','history'] as const).map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'10px 14px',fontSize:'12px',fontWeight:'500',borderBottom:`2px solid ${tab===t?'#f59e0b':'transparent'}`,color:tab===t?'#fcd34d':'#92400e',background:'none',border:'none',borderBottomWidth:'2px',borderBottomStyle:'solid',cursor:'pointer',fontFamily:'Inter',textTransform:'capitalize',transition:'all 0.2s'}}>{t}</button>)}
      </div>

      <div style={{flex:1,overflow:'auto',padding:'14px 20px'}}>
        {tab==='envelopes'&&(
          envelopes.length===0?(
            <div style={{textAlign:'center',padding:'60px 20px'}}>
              <div style={{fontSize:'52px',marginBottom:'16px'}}>💼</div>
              <h3 style={{fontSize:'20px',fontWeight:'700',color:'white',marginBottom:'8px'}}>Create your first envelope</h3>
              <p style={{color:'#92400e',fontSize:'14px',marginBottom:'24px',lineHeight:'1.6',maxWidth:'240px',margin:'0 auto 24px'}}>Allocate your income into spending categories like Food, Rent, Fun.</p>
              <button onClick={()=>setShowAdd('envelope')} style={{padding:'12px 24px',borderRadius:'10px',background:'#f59e0b',border:'none',color:'white',fontSize:'14px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',boxShadow:'0 4px 16px #f59e0b30'}}>Add first envelope</button>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {envelopes.map(env=>{
                const pct = env.budget>0?Math.min(100,(env.spent/env.budget)*100):0;
                const over = env.spent > env.budget;
                const barColor = pct>90?'#ef4444':pct>70?'#f59e0b':env.color;
                return <div key={env.id} style={{background:'#1a1000',border:`1px solid ${over?env.color+'40':'#451a0320'}`,borderRadius:'12px',padding:'14px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontSize:'20px'}}>{env.emoji}</span>
                      <span style={{color:'white',fontSize:'13px',fontWeight:'500'}}>{env.name}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontSize:'12px',color:over?'#f87171':'#fcd34d',fontWeight:'600'}}>
                        ${env.spent.toFixed(0)} / ${env.budget.toFixed(0)}
                      </span>
                      <button onClick={()=>{setSelEnv(env.id);setShowAdd('spend');}}
                        style={{padding:'4px 10px',borderRadius:'7px',background:env.color+'20',border:`1px solid ${env.color}30`,color:env.color,fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter'}}>Spend</button>
                      <button onClick={()=>saveE(envelopes.filter(e=>e.id!==env.id))} style={{padding:'4px',background:'none',border:'none',cursor:'pointer',color:'#92400e'}}><Trash2 size={12}/></button>
                    </div>
                  </div>
                  <div style={{height:'6px',background:'#451a03',borderRadius:'3px',overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:barColor,borderRadius:'3px',transition:'width 0.5s'}}/>
                  </div>
                  {over&&<div style={{fontSize:'11px',color:'#f87171',marginTop:'4px',textAlign:'right'}}>Over by ${(env.spent-env.budget).toFixed(0)}</div>}
                </div>;
              })}
            </div>
          )
        )}
        {tab==='goals'&&(
          goals.length===0?(
            <div style={{textAlign:'center',padding:'60px 20px'}}>
              <div style={{fontSize:'52px',marginBottom:'16px'}}>🎯</div>
              <h3 style={{fontSize:'20px',fontWeight:'700',color:'white',marginBottom:'8px'}}>Set a savings goal</h3>
              <p style={{color:'#92400e',fontSize:'14px',marginBottom:'24px',lineHeight:'1.6',maxWidth:'240px',margin:'0 auto 24px'}}>Emergency fund, vacation, new laptop — track any goal.</p>
              <button onClick={()=>setShowAdd('goal')} style={{padding:'12px 24px',borderRadius:'10px',background:'#f59e0b',border:'none',color:'white',fontSize:'14px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',boxShadow:'0 4px 16px #f59e0b30'}}>Add first goal</button>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {goals.map(goal=>{
                const pct = goal.target>0?Math.min(100,(goal.saved/goal.target)*100):0;
                return <div key={goal.id} style={{background:'#1a1000',border:'1px solid #451a0320',borderRadius:'12px',padding:'16px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                    <span style={{color:'white',fontSize:'14px',fontWeight:'500'}}>{goal.name}</span>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontSize:'13px',fontWeight:'700',color:goal.color}}>{pct.toFixed(0)}%</span>
                      <button onClick={()=>{const add=parseFloat(prompt('Add amount:')||'0');if(add>0)saveG(goals.map(g=>g.id===goal.id?{...g,saved:g.saved+add}:g));}} style={{padding:'4px 10px',borderRadius:'7px',background:goal.color+'20',border:`1px solid ${goal.color}30`,color:goal.color,fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter'}}>+Add</button>
                      <button onClick={()=>saveG(goals.filter(g=>g.id!==goal.id))} style={{padding:'4px',background:'none',border:'none',cursor:'pointer',color:'#92400e'}}><Trash2 size={12}/></button>
                    </div>
                  </div>
                  <div style={{height:'8px',background:'#451a03',borderRadius:'4px',overflow:'hidden',marginBottom:'6px'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:goal.color,borderRadius:'4px',transition:'width 0.5s'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'#92400e'}}>
                    <span>${goal.saved.toLocaleString()} saved</span>
                    <span>${(goal.target-goal.saved).toLocaleString()} to go</span>
                  </div>
                </div>;
              })}
            </div>
          )
        )}
        {tab==='history'&&(
          txns.length===0?(
            <div style={{textAlign:'center',padding:'40px 20px'}}>
              <div style={{fontSize:'40px',marginBottom:'12px'}}>📋</div>
              <p style={{color:'#92400e',fontSize:'14px'}}>Your transaction history will appear here.</p>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {[...txns].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>{
                const env = envelopes.find(e=>e.id===t.envelopeId);
                return <div key={t.id} style={{background:'#1a1000',border:'1px solid #451a0320',borderRadius:'10px',padding:'11px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{color:'white',fontSize:'13px',fontWeight:'500'}}>{t.note||env?.name||'Expense'}</div>
                    <div style={{color:'#92400e',fontSize:'11px',marginTop:'2px'}}>{t.date} · {env?.emoji} {env?.name}</div>
                  </div>
                  <span style={{fontSize:'14px',fontWeight:'700',color:'#f87171'}}>-${t.amount.toFixed(2)}</span>
                </div>;
              })}
            </div>
          )
        )}
      </div>

      {/* Add envelope modal */}
      {showAdd==='envelope'&&(
        <ModalBase onClose={()=>setShowAdd(null as any)} title="New Envelope">
          <EnvelopeForm onAdd={env=>{saveE([env,...envelopes]);setShowAdd(null as any);}}/>
        </ModalBase>
      )}
      {showAdd==='goal'&&(
        <ModalBase onClose={()=>setShowAdd(null as any)} title="New Goal">
          <GoalForm onAdd={g=>{saveG([g,...goals]);setShowAdd(null as any);}}/>
        </ModalBase>
      )}
      {showAdd==='spend'&&selEnv&&(
        <ModalBase onClose={()=>setShowAdd(null as any)} title={`Log Spend — ${envelopes.find(e=>e.id===selEnv)?.emoji} ${envelopes.find(e=>e.id===selEnv)?.name}`}>
          <SpendForm onAdd={(amount,note)=>{addSpend(selEnv,amount,note);setShowAdd(null as any);setSelEnv(null);}}/>
        </ModalBase>
      )}
    </div>
  );
}

function ModalBase({children,onClose,title}:{children:React.ReactNode;onClose:()=>void;title:string}) {
  return (
    <div style={{position:'fixed',inset:0,background:'#00000080',zIndex:50,display:'flex',alignItems:'flex-end'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:'100%',background:'#1a1000',borderRadius:'20px 20px 0 0',border:'1px solid #451a0320',padding:'24px',maxHeight:'80vh',overflowY:'auto'}}>
        <div style={{width:'36px',height:'3px',background:'#451a03',borderRadius:'2px',margin:'0 auto 20px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'18px'}}>
          <h3 style={{color:'white',fontSize:'16px',fontWeight:'700',fontFamily:'Inter'}}>{title}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#92400e'}}><X size={16}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EnvelopeForm({onAdd}:{onAdd:(e:Envelope)=>void}) {
  const EMOJIS=['🍔','🚗','🏠','💡','🎭','🛍','💊','📚','✈️','☕','🐾','💸'];
  const [name,setName]=useState(''); const [budget,setBudget]=useState(''); const [emoji,setEmoji]=useState('🍔'); const [color,setColor]=useState('#f59e0b');
  const inp={width:'100%',background:'#0a0800',border:'1px solid #451a0320',borderRadius:'10px',padding:'11px 14px',color:'white',fontSize:'14px',outline:'none',fontFamily:'Inter'};
  return <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
    <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name (e.g. Food)" style={inp} autoFocus onFocus={e=>e.target.style.borderColor='#f59e0b'} onBlur={e=>e.target.style.borderColor='#451a0320'}/>
    <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Monthly budget ($)" style={inp} onFocus={e=>e.target.style.borderColor='#f59e0b'} onBlur={e=>e.target.style.borderColor='#451a0320'}/>
    <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>{EMOJIS.map(e=><button key={e} onClick={()=>setEmoji(e)} style={{width:'36px',height:'36px',borderRadius:'8px',border:`1px solid ${emoji===e?'#f59e0b':'#451a0320'}`,background:emoji===e?'#f59e0b15':'transparent',fontSize:'18px',cursor:'pointer'}}>{e}</button>)}</div>
    <div style={{display:'flex',gap:'6px'}}>{COLORS.map(c=><button key={c} onClick={()=>setColor(c)} style={{width:'28px',height:'28px',borderRadius:'50%',background:c,border:`2px solid ${color===c?'white':c+'60'}`,cursor:'pointer',transform:color===c?'scale(1.2)':'scale(1)',transition:'all 0.15s'}}/>)}</div>
    <button onClick={()=>{if(!name.trim()||!budget)return;onAdd({id:crypto.randomUUID(),name:name.trim(),emoji,budget:parseFloat(budget),spent:0,color});}} disabled={!name.trim()||!budget} style={{padding:'14px',borderRadius:'12px',background:!name.trim()||!budget?'#451a03':'#f59e0b',border:'none',color:'white',fontSize:'15px',fontWeight:'700',cursor:!name.trim()||!budget?'not-allowed':'pointer',fontFamily:'Inter',opacity:!name.trim()||!budget?0.5:1}}>Create Envelope</button>
  </div>;
}

function GoalForm({onAdd}:{onAdd:(g:Goal)=>void}) {
  const [name,setName]=useState(''); const [target,setTarget]=useState(''); const [color,setColor]=useState('#f59e0b');
  const inp={width:'100%',background:'#0a0800',border:'1px solid #451a0320',borderRadius:'10px',padding:'11px 14px',color:'white',fontSize:'14px',outline:'none',fontFamily:'Inter'};
  return <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
    <input value={name} onChange={e=>setName(e.target.value)} placeholder="Goal name (e.g. Emergency Fund)" style={inp} autoFocus onFocus={e=>e.target.style.borderColor='#f59e0b'} onBlur={e=>e.target.style.borderColor='#451a0320'}/>
    <input type="number" value={target} onChange={e=>setTarget(e.target.value)} placeholder="Target amount ($)" style={inp} onFocus={e=>e.target.style.borderColor='#f59e0b'} onBlur={e=>e.target.style.borderColor='#451a0320'}/>
    <div style={{display:'flex',gap:'6px'}}>{COLORS.map(c=><button key={c} onClick={()=>setColor(c)} style={{width:'28px',height:'28px',borderRadius:'50%',background:c,border:`2px solid ${color===c?'white':c+'60'}`,cursor:'pointer',transform:color===c?'scale(1.2)':'scale(1)',transition:'all 0.15s'}}/>)}</div>
    <button onClick={()=>{if(!name.trim()||!target)return;onAdd({id:crypto.randomUUID(),name:name.trim(),target:parseFloat(target),saved:0,color});}} disabled={!name.trim()||!target} style={{padding:'14px',borderRadius:'12px',background:!name.trim()||!target?'#451a03':'#f59e0b',border:'none',color:'white',fontSize:'15px',fontWeight:'700',cursor:!name.trim()||!target?'not-allowed':'pointer',fontFamily:'Inter',opacity:!name.trim()||!target?0.5:1}}>Create Goal</button>
  </div>;
}

function SpendForm({onAdd}:{onAdd:(amount:number,note:string)=>void}) {
  const [amount,setAmount]=useState(''); const [note,setNote]=useState('');
  const inp={width:'100%',background:'#0a0800',border:'1px solid #451a0320',borderRadius:'10px',padding:'11px 14px',color:'white',fontSize:'14px',outline:'none',fontFamily:'Inter'};
  return <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
    <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount spent ($)" style={inp} autoFocus onFocus={e=>e.target.style.borderColor='#f59e0b'} onBlur={e=>e.target.style.borderColor='#451a0320'}/>
    <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" style={inp} onFocus={e=>e.target.style.borderColor='#f59e0b'} onBlur={e=>e.target.style.borderColor='#451a0320'}/>
    <button onClick={()=>{if(!amount)return;onAdd(parseFloat(amount),note.trim());}} disabled={!amount} style={{padding:'14px',borderRadius:'12px',background:!amount?'#451a03':'#f59e0b',border:'none',color:'white',fontSize:'15px',fontWeight:'700',cursor:!amount?'not-allowed':'pointer',fontFamily:'Inter',opacity:!amount?0.5:1}}>Log Spend</button>
  </div>;
}
