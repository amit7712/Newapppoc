import React, { useMemo, useState } from "react";
import { Box, Button, Chip, Container, LinearProgress, Paper, Stack, Typography } from "@mui/material";
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

function GameHeader({onBack,title,subtitle}) {
 return <Stack direction="row" alignItems="center" spacing={1.2} sx={{mb:2}}>
   <Button startIcon={<ArrowBackIcon/>} onClick={onBack}>Games</Button>
   <Box sx={{flex:1}}><Typography fontWeight={1000}>{title}</Typography><Typography variant="body2" color="text.secondary">{subtitle}</Typography></Box>
 </Stack>;
}

export function AlphabetMatchingGame({onBack}) {
 const [round,setRound]=useState(0), [matches,setMatches]=useState({}), [selectedSmall,setSelectedSmall]=useState(null), [attempts,setAttempts]=useState(5), [message,setMessage]=useState(""), [wrong,setWrong]=useState(null);
 const letters=useMemo(()=>{const start=(round*6)%26;return Array.from({length:6},(_,i)=>ALPHABET[(start+i)%26]);},[round]);
 const capitals=useMemo(()=>shuffle(letters),[round]);
 const chooseSmall=l=>{if(!matches[l]&&attempts>0){setSelectedSmall(l);setMessage("");setWrong(null);}};
 const chooseCapital=c=>{if(!selectedSmall||attempts<=0||matches[selectedSmall])return;if(selectedSmall===c){setMatches(m=>({...m,[selectedSmall]:c}));setMessage("Great! "+selectedSmall+" → "+c);setSelectedSmall(null);}else{setAttempts(a=>a-1);setWrong(c);setMessage("Oops! "+selectedSmall+" does not match "+c+".");}};
 const reset=()=>{setMatches({});setSelectedSmall(null);setAttempts(5);setMessage("");setWrong(null);};
 const complete=Object.keys(matches).length===letters.length;
 return <Box sx={{minHeight:"100vh",bgcolor:"#f7f8fc"}}><Container maxWidth="md" sx={{py:3}}>
  <GameHeader onBack={onBack} title="Small → Capital Match" subtitle="Match each small letter with its capital letter"/>
  <Paper sx={{p:{xs:1.5,md:2.5},borderRadius:4}}>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1} justifyContent="space-between" alignItems={{sm:"center"}}>
    <Chip label={"Round "+(round+1)} color="primary"/><Chip label={"Retries: "+attempts+"/5"} color={attempts<=1?"error":"default"}/><Chip label={Object.keys(matches).length+"/"+letters.length+" matched"}/>
   </Stack>
   <LinearProgress variant="determinate" value={(Object.keys(matches).length/letters.length)*100} sx={{mt:2,height:10,borderRadius:10}}/>
   <Box sx={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,mt:3}}>
    <Paper variant="outlined" sx={{p:1.5,borderRadius:3}}><Typography fontWeight={1000} sx={{mb:1}}>Small letters</Typography><Stack spacing={1}>{letters.map(l=><Button key={l} variant={selectedSmall===l?"contained":"outlined"} disabled={!!matches[l]||attempts===0} onClick={()=>chooseSmall(l)} sx={{fontSize:26,fontWeight:1000,textTransform:"none"}}>{l.toLowerCase()}{matches[l]&&" ✓"}</Button>)}</Stack></Paper>
    <Paper variant="outlined" sx={{p:1.5,borderRadius:3}}><Typography fontWeight={1000} sx={{mb:1}}>Capital letters</Typography><Stack spacing={1}>{capitals.map(c=><Button key={c} variant={Object.values(matches).includes(c)?"contained":"outlined"} disabled={Object.values(matches).includes(c)||attempts===0} onClick={()=>chooseCapital(c)} sx={{fontSize:26,fontWeight:1000}}>{c}{wrong===c&&" ✕"}</Button>)}</Stack></Paper>
   </Box>
   <Paper sx={{mt:2,p:1.5,borderRadius:3,bgcolor:message.startsWith("Great")?"#e9f8ef":"#fff4e5"}}><Typography fontWeight={900}>{message||"Select a small letter, then tap its matching capital."}</Typography></Paper>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1.2} sx={{mt:2}}><Button variant="outlined" startIcon={<RefreshIcon/>} onClick={reset}>Retry Round</Button>{(complete||attempts===0)&&<Button variant="contained" onClick={()=>{setRound(r=>r+1);reset();}}>Next Round</Button>}</Stack>
  </Paper>
 </Container></Box>;
}

export function AlphabetPictureMatchingGame({onBack}) {
 const [round,setRound]=useState(0), [matched,setMatched]=useState([]), [selected,setSelected]=useState(null), [attempts,setAttempts]=useState(5), [message,setMessage]=useState("");
 const letter=ALPHABET[round%26];
 const choices=useMemo(()=>{const valid=PICTURE_POOL[letter]||[];const others=ALPHABET.filter(x=>x!==letter).flatMap(x=>PICTURE_POOL[x]||[]);return shuffle([...valid.slice(0,2),...shuffle(others).slice(0,4)]);},[round]);
 const reset=()=>{setMatched([]);setSelected(null);setAttempts(5);setMessage("");};
 const choose=item=>{if(matched.includes(item[1])||attempts<=0)return;setSelected(item[1]);if(item[1].toUpperCase().startsWith(letter)){setMatched(m=>[...m,item[1]]);setMessage("Correct! "+letter+" is for "+item[1]+".");}else{setAttempts(a=>a-1);setMessage("Try again. Find a picture that starts with "+letter+".");}};
 const validCount=(PICTURE_POOL[letter]||[]).slice(0,2).length, complete=matched.length>=validCount;
 return <Box sx={{minHeight:"100vh",bgcolor:"#f7f8fc"}}><Container maxWidth="md" sx={{py:3}}>
  <GameHeader onBack={onBack} title="Alphabet → Picture Match" subtitle="Find pictures that begin with the shown letter"/>
  <Paper sx={{p:{xs:1.5,md:2.5},borderRadius:4}}>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1} justifyContent="space-between" alignItems={{sm:"center"}}><Chip label={"Letter "+letter} color="primary" sx={{fontSize:20,fontWeight:1000}}/><Chip label={"Retries: "+attempts+"/5"} color={attempts<=1?"error":"default"}/><Chip label={matched.length+"/"+validCount+" found"}/></Stack>
   <LinearProgress variant="determinate" value={(matched.length/validCount)*100} sx={{mt:2,height:10,borderRadius:10}}/>
   <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr 1fr",sm:"repeat(3,1fr)"},gap:1.5,mt:3}}>
    {choices.map(([emoji,word])=><Paper key={word} onClick={()=>choose([emoji,word])} sx={{p:1.2,borderRadius:3,cursor:"pointer",border:"2px solid",borderColor:matched.includes(word)?"#39a96b":selected===word?"#6658d3":"transparent",bgcolor:matched.includes(word)?"#e9f8ef":"#fff",textAlign:"center"}}><Typography sx={{fontSize:{xs:48,md:64}}}>{emoji}</Typography><Typography fontWeight={950}>{word}</Typography>{matched.includes(word)&&<CheckCircleIcon color="success"/>}</Paper>)}
   </Box>
   <Paper sx={{mt:2,p:1.5,borderRadius:3,bgcolor:message.startsWith("Correct")?"#e9f8ef":"#fff4e5"}}><Typography fontWeight={900}>{message||("Find the pictures for "+letter+".")}</Typography></Paper>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1.2} sx={{mt:2}}><Button variant="outlined" startIcon={<RefreshIcon/>} onClick={reset}>Retry Round</Button>{(complete||attempts===0)&&<Button variant="contained" onClick={()=>{setRound(r=>r+1);reset();}}>Next Letter</Button>}</Stack>
  </Paper>
 </Container></Box>;
}
