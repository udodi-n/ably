
import { useState, useEffect, useRef } from 'react';
import * as Ably from 'ably';
import { generateQuestions } from './gameLogic.js';

export default function App(){
  const [screen,setScreen]=useState('lobby');
  const [name,setName]=useState('');
  const [roomCode,setRoomCode]=useState('');
  const [questions,setQuestions]=useState([]);
  const [idx,setIdx]=useState(0);
  const [input,setInput]=useState('');
  const [scores,setScores]=useState({me:0,opp:0});
  const [oppProg,setOppProg]=useState(0);
  const [players,setPlayers]=useState([]);
  const [winner,setWinner]=useState(null);
  const ablyRef=useRef(null);
  const channelRef=useRef(null);
  const startRef=useRef(Date.now());

  const getAbly = async () => {
    const clientId = name || 'anon-'+Math.random().toString(36).slice(2,6);
    // Token from our Vercel Node function
    const ably = new Ably.Realtime({ authUrl: `/api/ably-token?clientId=${clientId}`, authMethod: 'GET' });
    ablyRef.current = ably;
    return ably;
  };

  const createRoom = async () => {
    if(!name) return alert('Enter name');
    const code = Math.random().toString(36).substring(2,6).toUpperCase();
    setRoomCode(code);
    setQuestions(generateQuestions(code));
    const ably = await getAbly();
    const channel = ably.channels.get(`math-rush:${code}`);
    channelRef.current = channel;
    // presence = who is in room
    await channel.presence.enter({ name });
    channel.presence.subscribe(() => {
      channel.presence.get((err, members)=>{
        if(!err) setPlayers(members.map(m=>m.data));
      });
    });
    channel.subscribe('answered', (msg)=> setOppProg(msg.data.idx+1));
    channel.subscribe('finished', (msg)=> { setWinner(msg.data.winner); setScreen('end'); });
    setScreen('waiting');
    setPlayers([{name}]);
  };

  const joinRoom = async () => {
    if(!name || !roomCode) return alert('Name + code');
    const code = roomCode.toUpperCase();
    setQuestions(generateQuestions(code));
    const ably = await getAbly();
    const channel = ably.channels.get(`math-rush:${code}`);
    channelRef.current = channel;
    await channel.presence.enter({ name });
    channel.presence.subscribe(() => {
      channel.presence.get((err, members)=>{
        if(!err) {
          const mem = members.map(m=>m.data);
          setPlayers(mem);
          if(mem.length===2 && screen==='waiting') setTimeout(()=>startGame(), 500);
        }
      });
    });
    channel.presence.get((err, members)=>{
      if(!err) setPlayers(members.map(m=>m.data));
    });
    channel.subscribe('answered', (msg)=> {
      if(msg.data.clientId !== name) setOppProg(msg.data.idx+1);
    });
    channel.subscribe('finished', (msg)=> { setWinner(msg.data.winner); setScreen('end'); });
    setRoomCode(code);
    setScreen('waiting');
  };

  const startGame = () => {
    setScreen('game'); setIdx(0); setScores({me:0,opp:0}); setOppProg(0); startRef.current=Date.now();
  };

  useEffect(()=>{ if(screen==='waiting' && players.length===2) startGame(); }, [players]);

  const submit = () => {
    const q = questions[idx];
    if(parseInt(input) !== q.answer){ setInput(''); return; }
    const t = Date.now() - startRef.current;
    const pts = Math.max(100, 1000 - Math.floor(t/10));
    setScores(s=>({...s, me: s.me+pts}));
    channelRef.current.publish('answered', { idx, clientId: name, points: pts });
    if(idx===24){
      channelRef.current.publish('finished', { winner: name });
      setWinner(name); setScreen('end');
    } else {
      setIdx(idx+1); setInput(''); startRef.current=Date.now();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="border-b border-zinc-800 flex justify-between p-4"><h1 className="font-black text-xl">MATH RUSH <span className="text-[#CCFF00]">// 1v1 ABLY</span></h1><div className="text-xs text-zinc-500">{roomCode&&`ROOM ${roomCode}`}</div></div>
      {screen==='lobby'&&(
        <div className="max-w-[480px] mx-auto p-6 mt-10">
          <h2 className="text-[54px] leading-[0.9] font-black">WHO'S<br/>FASTER?</h2>
          <p className="text-zinc-400 mt-4">Vercel Serverless + Ably. Works Nigeria → USA.</p>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="YOUR NAME" className="w-full mt-8 bg-zinc-900 border border-zinc-800 p-4 outline-none focus:border-[#CCFF00]"/>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={createRoom} className="bg-[#CCFF00] text-black p-4 font-bold">CREATE ROOM</button>
            <div className="flex"><input value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())} placeholder="CODE" className="w-full bg-zinc-900 border border-zinc-800 p-4 outline-none"/><button onClick={joinRoom} className="bg-white text-black px-6 font-bold">JOIN</button></div>
          </div>
          <div className="mt-8 text-[11px] text-zinc-600 border border-zinc-900 p-3 leading-relaxed">
            Setup:<br/>
            1. ably.com → create app → copy API Key<br/>
            2. Vercel → Settings → Env Vars → ABLY_API_KEY=your_key<br/>
            3. Deploy. No other servers needed.
          </div>
        </div>
      )}
      {screen==='waiting'&&(
        <div className="max-w-[480px] mx-auto p-6 mt-20 text-center">
          <div className="text-[80px] font-black tracking-widest">{roomCode}</div>
          <div className="text-zinc-500 animate-pulse mt-4">WAITING... Send code to friend</div>
          <div className="mt-8 flex justify-center gap-2">{players.map((p,i)=><div key={i} className="bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm">{p.name}</div>)}</div>
        </div>
      )}
      {screen==='game'&&questions[idx]&&(
        <div className="max-w-[640px] mx-auto p-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><div className="text-[10px] text-zinc-500">YOU {scores.me}</div><div className="h-2 bg-zinc-900 mt-1"><div className="h-2 bg-[#CCFF00]" style={{width:`${(idx/25)*100}%`}}/></div></div>
            <div><div className="text-[10px] text-zinc-500">OPP {oppProg}/25</div><div className="h-2 bg-zinc-900 mt-1"><div className="h-2 bg-white" style={{width:`${(oppProg/25)*100}%`}}/></div></div>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <div className="text-xs text-zinc-500">Q {idx+1}/25 TIER {questions[idx].tier+1}</div>
            <div className="text-[56px] font-black mt-4">{questions[idx].text} = ?</div>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} autoFocus type="number" className="mt-8 w-full bg-black border-2 border-[#CCFF00] text-center text-4xl p-4 outline-none"/>
            <button onClick={submit} className="w-full mt-4 bg-[#CCFF00] text-black font-black text-xl p-4">ENTER</button>
          </div>
        </div>
      )}
      {screen==='end'&&(<div className="max-w-[480px] mx-auto p-6 mt-10 text-center"><h2 className="text-6xl font-black">{winner===name?'YOU WIN':'FINISHED'}</h2><div className="mt-6 bg-zinc-900 border border-zinc-800 p-6">Score: {scores.me}</div><button onClick={()=>window.location.reload()} className="w-full mt-6 bg-white text-black p-4 font-black">PLAY AGAIN</button></div>)}
    </div>
  )
}
