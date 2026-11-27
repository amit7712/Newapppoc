import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Container, FormControlLabel, LinearProgress, Paper, Select, MenuItem, Stack, Switch, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PICTURE_POOL = {
  A:[["🍎","Apple"],["✈️","Aeroplane"],["🐜","Ant"],["🐊","Alligator"]], B:[["⚽","Ball"],["🦋","Butterfly"],["🍌","Banana"],["🐻","Bear"]],
  C:[["🐱","Cat"],["🚗","Car"],["🍰","Cake"],["🐄","Cow"]], D:[["🐶","Dog"],["🦆","Duck"],["🥁","Drum"],["🍩","Donut"]],
  E:[["🐘","Elephant"],["🥚","Egg"],["🦅","Eagle"],["✏️","Eraser"]], F:[["🐟","Fish"],["🦊","Fox"],["🌸","Flower"],["🍟","Fries"]],
  G:[["🦒","Giraffe"],["🍇","Grapes"],["🎁","Gift"],["🐐","Goat"]], H:[["🐴","Horse"],["🏠","House"],["🎩","Hat"],["🖐️","Hand"]],
  I:[["🍦","Ice cream"],["🦎","Iguana"],["🏝️","Island"],["🖋️","Ink"]], J:[["🫙","Jar"],["🧃","Juice"],["🧥","Jacket"],["🪼","Jellyfish"]],
  K:[["🪁","Kite"],["🐨","Koala"],["🔑","Key"],["🥝","Kiwi"]], L:[["🦁","Lion"],["🍋","Lemon"],["🪔","Lamp"],["🍃","Leaf"]],
  M:[["🐒","Monkey"],["🥭","Mango"],["🌙","Moon"],["🗺️","Map"]], N:[["👃","Nose"],["🥜","Nut"],["🪺","Nest"],["📰","Newspaper"]],
  O:[["🍊","Orange"],["🐙","Octopus"],["🦉","Owl"],["🛢️","Oil"]], P:[["🍕","Pizza"],["🐼","Panda"],["🦜","Parrot"],["✏️","Pencil"]],
  Q:[["👸","Queen"],["🧶","Quilt"],["❓","Question"],["🐦","Quail"]], R:[["🐇","Rabbit"],["🌈","Rainbow"],["🤖","Robot"],["💍","Ring"]],
  S:[["☀️","Sun"],["🐍","Snake"],["⭐","Star"],["🚢","Ship"]], T:[["🐯","Tiger"],["🌳","Tree"],["🚂","Train"],["🐢","Turtle"]],
  U:[["☂️","Umbrella"],["🦄","Unicorn"],["🧅","Onion"],["🦅","Urial"]], V:[["🚐","Van"],["🌋","Volcano"],["🎻","Violin"],["🦺","Vest"]],
  W:[["🐋","Whale"],["🍉","Watermelon"],["⌚","Watch"],["🪵","Wood"]], X:[["🎸","Xylophone"],["🩻","X-ray"],["❌","X mark"],["🪵","Xylophagous"]],
  Y:[["🪀","Yo-yo"],["🧶","Yarn"],["🥛","Yogurt"],["🐂","Yak"]], Z:[["🦓","Zebra"],["🦒","Zebu"],["🧢","Zip"],["🧟","Zombie"]]
};
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const speakLetter = (letter) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(letter);
  u.lang = "en-US";
  u.rate = 0.8;
  window.speechSynthesis.speak(u);
};

function GameHeader({onBack,title,subtitle}) {
 return <Stack direction="row" alignItems="center" spacing={1.2} sx={{mb:2}}>
   <Button startIcon={<ArrowBackIcon/>} onClick={onBack}>Games</Button>
   <Box sx={{flex:1}}><Typography fontWeight={1000}>{title}</Typography><Typography variant="body2" color="text.secondary">{subtitle}</Typography></Box>
 </Stack>;
}

export function AlphabetMatchingGame({onBack}) {
 const [round,setRound]=useState(0), [matches,setMatches]=useState({}), [selectedSmall,setSelectedSmall]=useState(null), [attempts,setAttempts]=useState(5), [message,setMessage]=useState(""), [wrong,setWrong]=useState(null);
 const [order,setOrder]=useState("series"), [repeat,setRepeat]=useState(true), [roundLetters,setRoundLetters]=useState([]), [seenLetters,setSeenLetters]=useState([]);

 const makeRound=(nextRound, nextOrder=order)=>{
   let source = repeat ? ALPHABET : ALPHABET.filter(l => !seenLetters.includes(l));
   if(source.length < 6){
     if(!repeat) setSeenLetters([]);
     source = ALPHABET;
   }
   let next;
   if(nextOrder==="series"){
     const start = repeat ? ((nextRound*6)%26) : ALPHABET.indexOf(source[0]);
     const sequence = Array.from({length:26},(_,i)=>ALPHABET[(start+i)%26]);
     next = sequence.filter(l => repeat || !seenLetters.includes(l)).slice(0,6);
     if(next.length < 6) next = shuffle(source).slice(0,6);
   } else {
     next=shuffle(source).slice(0,6);
   }
   setSeenLetters(old => repeat ? old : [...new Set([...old,...next])]);
   setRoundLetters(next);
   setRound(nextRound);
   setMatches({});
   setSelectedSmall(null);
   setAttempts(5);
   setMessage("");
   setWrong(null);
 };
 const letters=roundLetters.length ? roundLetters : ALPHABET.slice(0,6);
 const capitals=useMemo(()=>shuffle(letters),[round,letters.join("")]);

 const chooseSmall=l=>{
   if(!matches[l]&&attempts>0){
     setSelectedSmall(l); setMessage(""); setWrong(null); speakLetter(l.toLowerCase());
   }
 };
 const chooseCapital=c=>{
   if(!selectedSmall||attempts<=0||matches[selectedSmall])return;
   speakLetter(c);
   if(selectedSmall.toUpperCase()===c){
     setMatches(m=>({...m,[selectedSmall]:c}));
     setMessage("Great! "+selectedSmall.toLowerCase()+" → "+c);
     setSelectedSmall(null);
   } else {
     setAttempts(a=>a-1); setWrong(c);
     setMessage("Oops! "+selectedSmall.toLowerCase()+" does not match "+c+".");
   }
 };
 const reset=()=>{setMatches({});setSelectedSmall(null);setAttempts(5);setMessage("");setWrong(null);};
 const complete=Object.keys(matches).length===letters.length;

 return <Box sx={{minHeight:"100vh",bgcolor:"#f7f8fc"}}><Container maxWidth="md" sx={{py:3}}>
  <GameHeader onBack={onBack} title="Small → Capital Match" subtitle="Tap a letter to hear it, then match small → capital"/>
  <Paper sx={{p:{xs:1.5,md:2.5},borderRadius:4}}>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1} justifyContent="space-between" alignItems={{sm:"center"}}>
    <Chip label={"Round "+(round+1)} color="primary"/><Chip label={"Retries: "+attempts+"/5"} color={attempts<=1?"error":"default"}/><Chip label={Object.keys(matches).length+"/"+letters.length+" matched"}/>
   </Stack>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1.5} alignItems={{xs:"stretch",sm:"center"}} sx={{mt:2}}>
     <FormControlLabel control={<Switch checked={repeat} onChange={e=>setRepeat(e.target.checked)} />} label="Allow Repeat Letters"/>
     <Select size="small" value={order} onChange={e=>{setOrder(e.target.value);makeRound(0,e.target.value)}} sx={{minWidth:170}}>
       <MenuItem value="series">Series Rounds</MenuItem><MenuItem value="random">Random Rounds</MenuItem>
     </Select>
   </Stack>
   <Typography variant="caption" color="text.secondary">Series = A→Z groups. Random = shuffled letters. Repeat On allows letters to appear again.</Typography>
   <LinearProgress variant="determinate" value={(Object.keys(matches).length/letters.length)*100} sx={{mt:2,height:10,borderRadius:10}}/>
   <Box sx={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,mt:3}}>
    <Paper variant="outlined" sx={{p:1.5,borderRadius:3}}><Typography fontWeight={1000} sx={{mb:1}}>Small letters</Typography><Stack spacing={1}>{letters.map(l=><Button key={l} variant={selectedSmall===l?"contained":"outlined"} disabled={!!matches[l]||attempts===0} onClick={()=>chooseSmall(l)} sx={{fontSize:26,fontWeight:1000,textTransform:"none"}}>{l.toLowerCase()}{matches[l]&&" ✓"}</Button>)}</Stack></Paper>
    <Paper variant="outlined" sx={{p:1.5,borderRadius:3}}><Typography fontWeight={1000} sx={{mb:1}}>Capital letters</Typography><Stack spacing={1}>{capitals.map(c=><Button key={c} variant={Object.values(matches).includes(c)?"contained":"outlined"} disabled={Object.values(matches).includes(c)||attempts===0} onClick={()=>chooseCapital(c)} sx={{fontSize:26,fontWeight:1000}}>{c}{wrong===c&&" ✕"}</Button>)}</Stack></Paper>
   </Box>
   <Paper sx={{mt:2,p:1.5,borderRadius:3,bgcolor:message.startsWith("Great")?"#e9f8ef":"#fff4e5"}}><Typography fontWeight={900}>{message||"Select a small letter, then tap its matching capital."}</Typography></Paper>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1.2} sx={{mt:2}}>
    <Button variant="outlined" startIcon={<RefreshIcon/>} onClick={reset}>Retry Round</Button>
    {(complete||attempts===0)&&<Button variant="contained" onClick={()=>makeRound(round+1,order)}>{order==="random"?"Next Random Round":"Next Series Round"}</Button>}
   </Stack>
  </Paper>
 </Container></Box>;
}

export function AlphabetPictureMatchingGame({onBack}) {
 const [round,setRound]=useState(0), [matched,setMatched]=useState([]), [selected,setSelected]=useState(null), [attempts,setAttempts]=useState(5), [message,setMessage]=useState("");
 const [targetLetter,setTargetLetter]=useState("A"), [targetCount,setTargetCount]=useState(2), [choices,setChoices]=useState([]);

 const buildRound=(nextRound)=>{
   const letter=shuffle(ALPHABET)[0];
   const valid=PICTURE_POOL[letter]||[];
   const count=1+Math.floor(Math.random()*Math.min(4,valid.length));
   const targets=shuffle(valid).slice(0,count);
   const others=shuffle(ALPHABET.filter(x=>x!==letter).flatMap(x=>PICTURE_POOL[x]||[])).slice(0,Math.max(4,6-count));
   setTargetLetter(letter);
   setTargetCount(count);
   setChoices(shuffle([...targets,...others]));
   setRound(nextRound);
   setMatched([]);
   setSelected(null);
   setAttempts(5);
   setMessage("");
 };
 useEffect(() => { if(choices.length===0) buildRound(0); }, []);

 const choose=item=>{
   if(matched.includes(item[1])||attempts<=0)return;
   setSelected(item[1]);
   const isTarget=PICTURE_POOL[targetLetter]?.some(([emoji,word])=>word===item[1]);
   if(isTarget){
     setMatched(m=>[...m,item[1]]);
     setMessage("Correct! "+targetLetter+" is for "+item[1]+".");
   } else {
     setAttempts(a=>a-1);
     setMessage("Try again. Find a picture that starts with "+targetLetter+".");
   }
 };
 const complete=matched.length>=targetCount;

 return <Box sx={{minHeight:"100vh",bgcolor:"#f7f8fc"}}><Container maxWidth="md" sx={{py:3}}>
  <GameHeader onBack={onBack} title="Alphabet → Picture Match" subtitle="Find a random number of pictures that begin with the shown letter"/>
  <Paper sx={{p:{xs:1.5,md:2.5},borderRadius:4}}>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1} justifyContent="space-between" alignItems={{sm:"center"}}>
    <Chip label={"Letter "+targetLetter} color="primary" sx={{fontSize:20,fontWeight:1000}}/>
    <Chip label={"Find "+targetCount+" picture"+(targetCount===1?"":"s")} color="secondary"/>
    <Chip label={"Retries: "+attempts+"/5"} color={attempts<=1?"error":"default"}/>
    <Chip label={matched.length+"/"+targetCount+" found"}/>
   </Stack>
   <LinearProgress variant="determinate" value={(matched.length/targetCount)*100} sx={{mt:2,height:10,borderRadius:10}}/>
   <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr 1fr",sm:"repeat(3,1fr)"},gap:1.5,mt:3}}>
    {choices.map(([emoji,word])=><Paper key={word} onClick={()=>choose([emoji,word])} sx={{p:1.2,borderRadius:3,cursor:"pointer",border:"2px solid",borderColor:matched.includes(word)?"#39a96b":selected===word?"#6658d3":"transparent",bgcolor:matched.includes(word)?"#e9f8ef":"#fff",textAlign:"center"}}><Typography sx={{fontSize:{xs:48,md:64}}}>{emoji}</Typography><Typography fontWeight={950}>{word}</Typography>{matched.includes(word)&&<CheckCircleIcon color="success"/>}</Paper>)}
   </Box>
   <Paper sx={{mt:2,p:1.5,borderRadius:3,bgcolor:message.startsWith("Correct")?"#e9f8ef":"#fff4e5"}}><Typography fontWeight={900}>{message||("Find "+targetCount+" picture"+(targetCount===1?"":"s")+" for "+targetLetter+".")}</Typography></Paper>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1.2} sx={{mt:2}}>
    <Button variant="outlined" startIcon={<RefreshIcon/>} onClick={()=>buildRound(round)}>New Random Set</Button>
    {(complete||attempts===0)&&<Button variant="contained" onClick={()=>buildRound(round+1)}>Next Random Letter</Button>}
   </Stack>
  </Paper>
 </Container></Box>;
}
