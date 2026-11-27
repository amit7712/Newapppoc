import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Container, FormControlLabel, IconButton, LinearProgress, Paper, Popover, Select, MenuItem, Stack, Switch, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SettingsIcon from "@mui/icons-material/Settings";

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
 const [order,setOrder]=useState("series"), [repeat,setRepeat]=useState(true), [roundLetters,setRoundLetters]=useState([]), [seenLetters,setSeenLetters]=useState([]), [settingsAnchor,setSettingsAnchor]=useState(null);

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
  <Paper sx={{p:{xs:1.5,md:2.5},borderRadius:5,border:"1px solid #e5e7ef",boxShadow:"0 12px 40px rgba(40,45,80,.08)"}}>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1} justifyContent="space-between" alignItems={{sm:"center"}} sx={{mb:1}}>
    <Chip label={"Round "+(round+1)} color="primary"/><Chip label={"Retries: "+attempts+"/5"} color={attempts<=1?"error":"default"}/><Chip label={Object.keys(matches).length+"/"+letters.length+" matched"}/>
   </Stack>
   <Stack direction="row" justifyContent="flex-end" sx={{mt:1}}>
     <IconButton aria-label="Game settings" onClick={e=>setSettingsAnchor(e.currentTarget)} sx={{border:"1px solid #d8dbe7",bgcolor:"#fff"}}>
       <SettingsIcon/>
     </IconButton>
   </Stack>
   <Popover
     open={Boolean(settingsAnchor)}
     anchorEl={settingsAnchor}
     onClose={()=>setSettingsAnchor(null)}
     anchorOrigin={{vertical:"bottom",horizontal:"right"}}
     transformOrigin={{vertical:"top",horizontal:"right"}}
     PaperProps={{sx:{p:2,borderRadius:3,minWidth:260}}}
   >
     <Typography fontWeight={1000} sx={{mb:1.5}}>Game Settings</Typography>
     <FormControlLabel control={<Switch checked={repeat} onChange={e=>setRepeat(e.target.checked)} />} label="Allow Repeat Letters"/>
     <Select fullWidth size="small" value={order} onChange={e=>{setOrder(e.target.value);makeRound(0,e.target.value);setSettingsAnchor(null)}} sx={{mt:1}}>
       <MenuItem value="series">Series Rounds</MenuItem><MenuItem value="random">Random Rounds</MenuItem>
     </Select>
     <Typography variant="caption" color="text.secondary" sx={{display:"block",mt:1}}>
       Series = A→Z groups. Random = shuffled letters. Repeat On allows letters to appear again.
     </Typography>
   </Popover>
   <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mt:2,mb:1}}>
    <Typography fontWeight={900} color="text.secondary">Match the letters</Typography>
    <Chip size="small" icon={<EmojiEventsIcon/>} label={Object.keys(matches).length===letters.length?"Round complete!":"Keep going"} color={Object.keys(matches).length===letters.length?"success":"default"}/>
   </Stack>
   <LinearProgress variant="determinate" value={(Object.keys(matches).length/letters.length)*100} sx={{height:10,borderRadius:10}}/>
   <Box sx={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,mt:3}}>
    <Paper variant="outlined" sx={{p:1.5,borderRadius:4,bgcolor:"#fbfbfe"}}><Typography fontWeight={1000} sx={{mb:1}}>🔤 Small letters</Typography><Stack spacing={1}>{letters.map(l=><Button key={l} variant={selectedSmall===l?"contained":"outlined"} disabled={!!matches[l]||attempts===0} onClick={()=>chooseSmall(l)} sx={{fontSize:28,fontWeight:1000,textTransform:"none",minHeight:58,borderRadius:3}}>{l.toLowerCase()}{matches[l]&&" ✓"}</Button>)}</Stack></Paper>
    <Paper variant="outlined" sx={{p:1.5,borderRadius:4,bgcolor:"#fbfbfe"}}><Typography fontWeight={1000} sx={{mb:1}}>🔠 Capital letters</Typography><Stack spacing={1}>{capitals.map(c=><Button key={c} variant={Object.values(matches).includes(c)?"contained":"outlined"} disabled={Object.values(matches).includes(c)||attempts===0} onClick={()=>chooseCapital(c)} sx={{fontSize:26,fontWeight:1000}}>{c}{wrong===c&&" ✕"}</Button>)}</Stack></Paper>
   </Box>
   <Paper sx={{mt:2,p:1.5,borderRadius:3,bgcolor:message.startsWith("Great")?"#e9f8ef":"#fff4e5"}}><Typography fontWeight={900}>{message||"Select a small letter, then tap its matching capital."}</Typography></Paper>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1.2} sx={{mt:2}}>
    <Button variant="outlined" startIcon={<RefreshIcon/>} disabled={attempts>0} onClick={reset}>Retry Round</Button>
    {(complete||attempts===0)&&<Button variant="contained" onClick={()=>makeRound(round+1,order)}>{order==="random"?"Next Random Round":"Next Series Round"}</Button>}
   </Stack>
  </Paper>
 </Container></Box>;
}

export function AlphabetPictureMatchingGame({onBack}) {
 const [round,setRound]=useState(0), [matched,setMatched]=useState([]), [selected,setSelected]=useState(null), [attempts,setAttempts]=useState(10), [message,setMessage]=useState("");
 const [targetLetter,setTargetLetter]=useState("A"), [targetCount,setTargetCount]=useState(2), [choices,setChoices]=useState([]), [settingsAnchor,setSettingsAnchor]=useState(null);
 const [order,setOrder]=useState("random"), [repeat,setRepeat]=useState(true), [soundOn,setSoundOn]=useState(true), [maxRetries,setMaxRetries]=useState(10), [seenLetters,setSeenLetters]=useState([]);

 const speakWord=(word)=>{
   if(!soundOn || !("speechSynthesis" in window)) return;
   window.speechSynthesis.cancel();
   const u=new SpeechSynthesisUtterance(word);
   u.lang="en-US"; u.rate=0.8;
   window.speechSynthesis.speak(u);
 };
 const speakTarget=(letter)=>{
   if(!soundOn || !("speechSynthesis" in window)) return;
   window.speechSynthesis.cancel();
   const u=new SpeechSynthesisUtterance(letter);
   u.lang="en-US"; u.rate=0.8;
   window.speechSynthesis.speak(u);
 };

 const buildRound=(nextRound=0, nextOrder=order)=>{
   let source=repeat ? ALPHABET : ALPHABET.filter(l=>!seenLetters.includes(l));
   if(!source.length){
     setSeenLetters([]);
     source=[...ALPHABET];
   }
   let letter;
   if(nextOrder==="series"){
     letter=ALPHABET[nextRound%ALPHABET.length];
     if(!repeat && seenLetters.includes(letter)){
       const available=source;
       letter=available[0]||ALPHABET[nextRound%ALPHABET.length];
     }
   } else {
     letter=shuffle(source)[0];
   }
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
   setAttempts(maxRetries);
   setMessage("");
   setSeenLetters(old=>repeat ? old : [...new Set([...old,letter])]);
   if(soundOn) window.setTimeout(()=>speakTarget(letter),80);
 };

 useEffect(()=>{ buildRound(0,order); },[]);
 useEffect(()=>{ if(choices.length && soundOn) speakTarget(targetLetter); },[targetLetter, soundOn]);
 useEffect(()=>{
   if(!soundOn || !("speechSynthesis" in window)) return;
   const unlock = () => {
     window.speechSynthesis.getVoices();
     window.speechSynthesis.resume();
   };
   window.addEventListener("pointerdown", unlock, {once:true});
   window.addEventListener("touchstart", unlock, {once:true});
   return () => {
     window.removeEventListener("pointerdown", unlock);
     window.removeEventListener("touchstart", unlock);
   };
 },[soundOn]);

 const choose=item=>{
   if(matched.includes(item[1])||attempts<=0)return;
   setSelected(item[1]);
   if(soundOn){ window.speechSynthesis?.resume(); speakWord(item[1]); }
   const isTarget=PICTURE_POOL[targetLetter]?.some(([emoji,word])=>word===item[1]);
   if(isTarget){
     setMatched(m=>m.includes(item[1])?m:[...m,item[1]]);
     setMessage("Correct! "+targetLetter+" is for "+item[1]+".");
   } else {
     setAttempts(a=>Math.max(0,a-1));
     setMessage("Try again. Find a picture that starts with "+targetLetter+".");
   }
 };
 const complete=matched.length>=targetCount;
 const allMatched=complete;
 useEffect(()=>{ if(complete){ setMessage("Great! You found all "+targetCount+" "+targetLetter+" pictures!"); } },[complete,targetCount,targetLetter]);

 return <Box sx={{minHeight:"100vh",bgcolor:"#f7f8fc"}}><Container maxWidth="md" sx={{py:3}}>
  <GameHeader onBack={onBack} title="Alphabet → Picture Match" subtitle="Tap the letter or picture to hear its sound, then find the matching pictures"/>
  <Paper sx={{p:{xs:1.5,md:2.5},borderRadius:5,border:"1px solid #e5e7ef",boxShadow:"0 12px 40px rgba(40,45,80,.08)"}}>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1} justifyContent="space-between" alignItems={{sm:"center"}} sx={{mb:1}}>
    <Chip label={"Round "+(round+1)} color="primary"/>
    <Chip label={"Letter "+targetLetter} color="secondary" sx={{fontSize:20,fontWeight:1000}}/>
    <Chip label={"Find "+targetCount+" picture"+(targetCount===1?"":"s")}/>
    <Chip label={"Retries: "+attempts+"/"+maxRetries} color={attempts<=1?"error":"default"}/>
   </Stack>
   <Stack direction="row" justifyContent="flex-end" sx={{mt:1}}>
    <IconButton aria-label="Game settings" onClick={e=>setSettingsAnchor(e.currentTarget)} sx={{border:"1px solid #d8dbe7",bgcolor:"#fff"}}>
      <SettingsIcon/>
    </IconButton>
   </Stack>
   <Popover
    open={Boolean(settingsAnchor)}
    anchorEl={settingsAnchor}
    onClose={()=>setSettingsAnchor(null)}
    anchorOrigin={{vertical:"bottom",horizontal:"right"}}
    transformOrigin={{vertical:"top",horizontal:"right"}}
    PaperProps={{sx:{p:2,borderRadius:3,minWidth:280}}}
   >
    <Typography fontWeight={1000} sx={{mb:1.5}}>Game Settings</Typography>
    <FormControlLabel control={<Switch checked={repeat} onChange={e=>{setRepeat(e.target.checked);setSeenLetters([]);buildRound(0,order)}} />} label="Allow Repeat Letters"/>
    <Select fullWidth size="small" value={order} onChange={e=>{setOrder(e.target.value);setSeenLetters([]);buildRound(0,e.target.value);setSettingsAnchor(null)}} sx={{mt:1}}>
      <MenuItem value="series">Series Rounds</MenuItem><MenuItem value="random">Random Rounds</MenuItem>
    </Select>
    <FormControlLabel control={<Switch checked={soundOn} onChange={e=>{const next=e.target.checked;setSoundOn(next);if(next){window.speechSynthesis?.resume();window.setTimeout(()=>speakTarget(targetLetter),100);}}} />} label="Sound On"/>
    <Select fullWidth size="small" value={maxRetries} onChange={e=>{const value=Number(e.target.value);setMaxRetries(value);setAttempts(value)}} sx={{mt:1}}>
      <MenuItem value={5}>5 Retries</MenuItem><MenuItem value={6}>6 Retries</MenuItem><MenuItem value={8}>8 Retries</MenuItem><MenuItem value={10}>10 Retries</MenuItem>
    </Select>
    <Typography variant="caption" color="text.secondary" sx={{display:"block",mt:1}}>
      Series = A→Z rounds. Random = shuffled letters. Repeat controls whether a letter may appear again. Sound controls letter and picture-word pronunciation.
    </Typography>
   </Popover>
   <LinearProgress variant="determinate" value={(matched.length/targetCount)*100} sx={{mt:2,height:10,borderRadius:10}}/>
   <Paper onClick={()=>speakTarget(targetLetter)} sx={{mt:2,p:{xs:2,md:2.5},borderRadius:4,textAlign:"center",cursor:soundOn?"pointer":"default",border:"2px solid #6658d3",bgcolor:"#f7f5ff"}}>
    <Typography variant="overline" fontWeight={900} color="text.secondary">Find pictures for</Typography>
    <Typography variant="h1" fontWeight={1000} sx={{lineHeight:1}}>{targetLetter}</Typography>
    <Stack direction="row" justifyContent="center" alignItems="center" spacing={.5}><VolumeUpIcon fontSize="small"/><Typography fontWeight={800}>Tap to hear the letter</Typography></Stack>
   </Paper>
   <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr 1fr",sm:"repeat(3,1fr)"},gap:1.5,mt:3}}>
    {choices.map(([emoji,word])=><Paper key={word} onClick={()=>choose([emoji,word])} sx={{p:1.2,borderRadius:4,cursor:attempts>0&&!allMatched?"pointer":"default",border:"2px solid",borderColor:matched.includes(word)?"#39a96b":selected===word?"#6658d3":"transparent",bgcolor:matched.includes(word)?"#e9f8ef":allMatched?"#f1f2f6":"#fff",textAlign:"center",opacity:allMatched&&!matched.includes(word)?0.45:1,pointerEvents:allMatched&&!matched.includes(word)?"none":"auto"}}>
      <Typography sx={{fontSize:{xs:52,md:68},lineHeight:1.1}}>{emoji}</Typography><Typography fontWeight={950} sx={{mt:.5}}>{word}</Typography>{matched.includes(word)&&<CheckCircleIcon color="success"/>}
    </Paper>)}
   </Box>
   <Paper sx={{mt:2,p:1.5,borderRadius:3,bgcolor:message.startsWith("Correct")||message.startsWith("Great")?"#e9f8ef":"#fff4e5"}}><Typography fontWeight={900}>{message||("Find "+targetCount+" picture"+(targetCount===1?"":"s")+" for "+targetLetter+".")}</Typography></Paper>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1.2} sx={{mt:2}}>
    <Button variant="outlined" startIcon={<RefreshIcon/>} onClick={()=>buildRound(round,order)}>New Random Set</Button>
    {(complete||attempts===0)&&<Button variant="contained" color="success" startIcon={<AutoAwesomeIcon/>} onClick={()=>buildRound(round+1,order)}>{order==="series"?"Next Series Round":"Next Random Round"}</Button>}
   </Stack>
  </Paper>
 </Container></Box>;
}
