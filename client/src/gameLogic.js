
export function hashCode(str){let h=0;for(let i=0;i<str.length;i++)h=Math.imul(31,h)+str.charCodeAt(i)|0;return Math.abs(h);}
export function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}}
export function generateQuestions(roomCode){
  const seed=hashCode(roomCode); const rng=mulberry32(seed); const qs=[];
  for(let i=0;i<25;i++){
    const tier=Math.floor(i/5); let q,a;
    if(tier===0){const x=Math.floor(rng()*40)+10,y=Math.floor(rng()*20)+1;if(rng()>0.5){q=`${x} + ${y}`;a=x+y;}else{q=`${x} - ${y}`;a=x-y;}}
    else if(tier===1){const x=Math.floor(rng()*80)+20,y=Math.floor(rng()*80)+10,op=['+','-','x'][Math.floor(rng()*3)];if(op==='+'){q=`${x} + ${y}`;a=x+y;}else if(op==='-'){q=`${x} - ${y}`;a=x-y;}else{const m=Math.floor(rng()*8)+2;q=`${x} x ${m}`;a=x*m;}}
    else if(tier===2){if(rng()>0.5){const x=Math.floor(rng()*12)+3,y=Math.floor(rng()*12)+3;q=`${x} x ${y}`;a=x*y;}else{const y=Math.floor(rng()*11)+2,ans=Math.floor(rng()*12)+3,x=y*ans;q=`${x} / ${y}`;a=ans;}}
    else if(tier===3){if(rng()>0.5){const n=Math.floor(rng()*14)+6;q=`${n}²`;a=n*n;}else{const x=Math.floor(rng()*12)+2,y=Math.floor(rng()*12)+2,z=Math.floor(rng()*10)+2;q=`${x} x ${y} + ${z}`;a=x*y+z;}}
    else{const x=Math.floor(rng()*20)+10,y=Math.floor(rng()*9)+2,z=Math.floor(rng()*20)+5;if(rng()>0.5){q=`${x} x ${y} + ${z}`;a=x*y+z;}else{q=`${x} x ${y} - ${z}`;a=x*y-z;}}
    qs.push({id:i,text:q,answer:a,tier});
  } return qs;
}
