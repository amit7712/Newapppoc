import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar, Box, Button, Card, CardContent, Chip, Container, Dialog,
  DialogActions, DialogContent, DialogTitle, FormControlLabel,
  IconButton, LinearProgress, MenuItem, Paper, Select, Slider, Stack,
  Switch, Toolbar, Typography
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ExtensionIcon from "@mui/icons-material/Extension";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StarIcon from "@mui/icons-material/Star";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import CelebrationIcon from "@mui/icons-material/Celebration";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { alphabet, PHONICS_SOUNDS } from "./alphabet.js";

const defaults = { repeat: false, order: "random", autoVoice: false, speed: 0.7 };

const loadSettings = () => {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem("af-settings") || "{}") }; }
  catch { return defaults; }
};

export default function App() {
  const [screen, setScreen] = useState("home");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [visited, setVisited] = useState(new Set());
  const [used, setUsed] = useState(new Set());
  const [nextAnimating, setNextAnimating] = useState(false);

  useEffect(() => localStorage.setItem("af-settings", JSON.stringify(settings)), [settings]);

  // Repeat OFF = never show the same alphabet again until every A-Z letter
  // has been shown once. The current letter is also tracked immediately on start.
  useEffect(() => {
    if (screen === "learn" && !settings.repeat) {
      setUsed(prev => prev.has(index) ? prev : new Set([...prev, index]));
    }
  }, [screen, index, settings.repeat]);

  const cards = useMemo(() => alphabet.map(([upper, lower, picture, word, example]) => ({
    upper, lower, picture, word, example
  })), []);

  const current = cards[index % cards.length];
  const progress = ((visited.size + (flipped ? 1 : 0)) / cards.length) * 100;

  const speak = (text, lang = "en-IN") => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = settings.speed;
    if (lang === "hi-IN") {
      const voice = window.speechSynthesis.getVoices().find(v => /^hi(-|_)/i.test(v.lang));
      if (voice) utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const flipCard = () => {
    const nextFlipped = !flipped;
    setFlipped(nextFlipped);
    setVisited(old => new Set([...old, index]));
    if (nextFlipped && settings.autoVoice) {
      window.setTimeout(() => speak(current.word), 180);
    }
  };

  const pickNextIndex = () => {
    if (settings.order === "series") return (index + 1) % cards.length;

    let pool = cards.map((_, i) => i).filter(i => !used.has(i) && i !== index);
    if (!pool.length) {
      pool = cards.map((_, i) => i).filter(i => i !== index);
      setUsed(new Set([index]));
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const next = () => {
    if (nextAnimating) return;

    // IMPORTANT: the Next Letter action now uses the card's flip animation.
    // The new alphabet is swapped only after the card has rotated, so it
    // never changes instantly underneath the user.
    const nextIndex = pickNextIndex();
    setNextAnimating(true);

    if (flipped) {
      setFlipped(false);
      window.setTimeout(() => {
        setIndex(nextIndex);
        if (!settings.repeat) setUsed(old => new Set([...old, nextIndex]));
        window.setTimeout(() => {
          setFlipped(true);
          setNextAnimating(false);
        }, 40);
      }, 360);
    } else {
      setIndex(nextIndex);
      if (!settings.repeat) setUsed(old => new Set([...old, nextIndex]));
      window.setTimeout(() => {
        setFlipped(true);
        setNextAnimating(false);
      }, 40);
    }
  };

  const start = () => {
    setVisited(new Set());

    const firstIndex = settings.order === "random"
      ? Math.floor(Math.random() * cards.length)
      : 0;

    // In Repeat OFF mode, the first displayed alphabet belongs to the cycle.
    setUsed(settings.repeat ? new Set() : new Set([firstIndex]));
    setIndex(firstIndex);
    setFlipped(false);
    setScreen("learn");
  };

  if (screen === "home") {
    return (
      <Box sx={pageSx}>
        <Header onSettings={() => setSettingsOpen(true)} />
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
          <Box sx={homeHero}>
            <Box className="bubble bubble-a" /><Box className="bubble bubble-b" /><Box className="bubble bubble-c" />
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
              <Chip icon={<StarIcon />} label="Little Learner" sx={{ bgcolor: "rgba(255,255,255,.82)", fontWeight: 950 }} />
              <Chip label={`⭐ ${visited.size} letters`} sx={{ bgcolor: "rgba(255,255,255,.82)", fontWeight: 950 }} />
            </Stack>
            <Box sx={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.35fr .65fr" }, alignItems: "center", gap: 2, mt: 2 }}>
              <Box>
                <Typography sx={{ fontSize: { xs: 40, sm: 52, md: 68 }, lineHeight: .98, fontWeight: 1000, color: "#18213d" }}>
                  Learn letters.<br /><Box component="span" sx={{ color: "#6C63FF" }}>Play &amp; grow!</Box> 🚀
                </Typography>
                <Typography sx={{ mt: 1.5, maxWidth: 610, color: "#58627c", fontWeight: 750, fontSize: { xs: 16, md: 19 } }}>
                  Flip, listen, discover words and collect stars while you learn ABC.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 2.5 }}>
                  <Button size="large" variant="contained" onClick={start} startIcon={<PlayArrowIcon />} sx={mainBtn}>Start Learning</Button>
                  <Button size="large" variant="outlined" onClick={() => setScreen("games")} startIcon={<ExtensionIcon />} sx={secondaryBtn}>Play Games</Button>
                </Stack>
              </Box>
              <Box className="mascot-card">
                <Box className="mascot">🦊</Box>
                <Typography fontWeight={1000} sx={{ color: "#18213d" }}>Hi, little learner!</Typography>
                <Typography variant="body2" sx={{ color: "#66708b", fontWeight: 700 }}>Ready for today's ABC adventure?</Typography>
                <Box className="sparkle">✨</Box>
              </Box>
            </Box>
          </Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3, mb: 1.2 }}>
            <Typography variant="h5" fontWeight={1000}>What do you want to do?</Typography>
            <Chip label="Tap to explore" size="small" sx={{ fontWeight: 900 }} />
          </Stack>
          <Box sx={tileGrid}>
            <HomeTile emoji="🎮" title="Games" subtitle="Learn by playing" tone="#e9e7ff" onClick={() => setScreen("games")} />
            <HomeTile emoji="📝" title="Worksheets" subtitle="Practice & print" tone="#fff0d9" onClick={() => setScreen("worksheets")} />
            <HomeTile emoji="⭐" title="My Progress" subtitle={`${visited.size}/${cards.length} letters explored`} tone="#e2f8ec" onClick={() => setScreen("progress")} />
            <HomeTile emoji="📚" title="Alphabet" subtitle="A to Z adventure" tone="#e5f3ff" onClick={start} />
          </Box>
          <Paper sx={{ mt: 3, p: 2.2, borderRadius: 5, bgcolor: "#fff", border: "1px solid #ececf5", boxShadow: "0 12px 36px rgba(42,49,93,.07)" }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box className="reward-icon">🏆</Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={1000}>Today's learning goal</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={650}>Explore 5 letters and hear their sounds.</Typography>
                <LinearProgress variant="determinate" value={Math.min((visited.size / 5) * 100, 100)} sx={{ mt: 1, height: 9, borderRadius: 9 }} />
              </Box>
              <Typography fontWeight={1000} color="primary.main">{Math.min(visited.size, 5)}/5</Typography>
            </Stack>
          </Paper>
        </Container>
        <Settings open={settingsOpen} close={() => setSettingsOpen(false)} settings={settings} setSettings={setSettings} />
      </Box>
    );
  }

  if (screen === "games") return <Games onBack={() => setScreen("home")} onStart={start} />;
  if (screen === "worksheets") return <Worksheets onBack={() => setScreen("home")} />;
  if (screen === "progress") return <Progress onBack={() => setScreen("home")} visited={visited.size} total={cards.length} />
  return (
    <Box sx={pageSx}>
      <Header back={() => setScreen("home")} onSettings={() => setSettingsOpen(true)} />
      <Container maxWidth="sm" sx={{ pb: 6 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography fontWeight={900}>Letter {index + 1} of {cards.length}</Typography>
          <Chip size="small" label={settings.order === "random" ? "Random" : "A → Z"} />
        </Stack>
        <LinearProgress value={Math.min(progress, 100)} variant="determinate"
          sx={{ height: 10, borderRadius: 10, mb: 2 }} />

        <Box className={`flip-scene ${flipped ? "is-flipped" : ""}`} onClick={flipCard}>
          <Box className="flip-card">
            <Card className="flip-face flip-front" elevation={0}>
              <CardContent sx={cardFaceSx}>
                <Typography sx={{ fontSize: 58 }}>↻</Typography>
                <Typography variant="h4" fontWeight={950}>Tap to Flip</Typography>
                <Typography sx={{ opacity: .85 }}>Meet a new letter</Typography>
              </CardContent>
            </Card>

            <Card className="flip-face flip-back" elevation={0}>
              <CardContent sx={{ ...cardFaceSx, color: "#172033" }}>
                <Typography sx={{ fontSize: { xs: 92, md: 112 }, fontWeight: 950, lineHeight: .9, color: "primary.main" }}>
                  {current.upper} <Box component="span" sx={{ color: "secondary.main" }}>{current.lower}</Box>
                </Typography>
                <Chip label="CAPITAL + small" sx={{ fontWeight: 900 }} />
                <Typography sx={{ fontSize: 58, mt: 1 }}>{current.picture}</Typography>
                <Typography variant="h4" fontWeight={950}>{current.word}</Typography>
                <Typography fontWeight={900} color="primary.main">
                  Hindi sound: {PHONICS_SOUNDS[current.upper]}
                </Typography>
                <Typography color="text.secondary">{current.example}</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} mt={2}>
          <Sound label="Letter" fn={() => speak(current.upper)} />
          <Sound label="Word" fn={() => speak(current.word)} />
          <Sound label="Hindi Phonics" fn={() => speak(PHONICS_SOUNDS[current.upper], "hi-IN")} />
        </Stack>

        <Button fullWidth variant="contained" onClick={next}
          startIcon={settings.order === "random" ? <ShuffleIcon /> : <PlayArrowIcon />}
          sx={{ mt: 2, borderRadius: 4, py: 1.6, fontWeight: 950 }}>
          Next Letter
        </Button>

        <Paper sx={{ mt: 3, p: 2.2, borderRadius: 4 }}>
          <Typography fontWeight={950}>Learning Journey</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
            Flip the card, listen to the sounds, then move to the next letter.
          </Typography>
          <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
            <Chip label={`Explored: ${visited.size}`} />
            <Chip label={`Remaining: ${Math.max(cards.length - visited.size, 0)}`} />
          </Stack>
        </Paper>
      </Container>
      <Settings open={settingsOpen} close={() => setSettingsOpen(false)} settings={settings} setSettings={setSettings} />
    </Box>
  );
}

function HomeTile({ emoji, title, subtitle, tone, onClick }) {
  return <Paper className="home-tile" onClick={onClick} sx={{ bgcolor: tone }}>
    <Box className="tile-emoji">{emoji}</Box>
    <Box sx={{ flex: 1 }}>
      <Typography fontWeight={1000} fontSize={20}>{title}</Typography>
      <Typography variant="body2" sx={{ color: "#626b83", fontWeight: 700 }}>{subtitle}</Typography>
    </Box>
    <Box className="tile-arrow"><ArrowForwardIcon /></Box>
  </Paper>;
}

function Games({ onBack, onStart }) {
  return <Box sx={pageSx}>
    <Header back={onBack} onSettings={() => {}} />
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Chip icon={<ExtensionIcon />} label="PLAY ZONE" sx={{ fontWeight: 950 }} />
      <Typography variant="h3" fontWeight={1000} sx={{ mt: 1 }}>🎮 Games</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Pick a game. Every tap should feel like play.</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)" }, gap: 2 }}>
        <GameCard emoji="🔤" title="Alphabet Flipper" subtitle="Flip letters, discover words and hear sounds." color="#e9e7ff" live onClick={onStart} />
        <GameCard emoji="🧩" title="Letter Builder" subtitle="Build simple words with letter tiles." color="#e5f3ff" live onClick={onStart} />
        <GameCard emoji="🎯" title="Find the Letter" subtitle="Spot the letter hiding in the crowd." color="#e2f8ec" onClick={onStart} />
        <GameCard emoji="🧠" title="Memory Match" subtitle="Match capital and small letters." color="#fff0d9" onClick={onStart} />
      </Box>
    </Container>
  </Box>;
}

function GameCard({ emoji, title, subtitle, color, onClick, live }) {
  return <Paper className="game-card" onClick={onClick} sx={{ bgcolor: color }}>
    {live && <Chip label="PLAY NOW" size="small" color="secondary" sx={{ position: "absolute", top: 14, right: 14, fontWeight: 1000 }} />}
    <Box className="game-emoji">{emoji}</Box>
    <Typography fontWeight={1000} fontSize={21}>{title}</Typography>
    <Typography color="text.secondary" fontWeight={700}>{subtitle}</Typography>
    <Button variant="contained" endIcon={<ArrowForwardIcon />} sx={{ mt: 2, borderRadius: 3, fontWeight: 950 }} onClick={e => { e.stopPropagation(); onClick(); }}>
      {live ? "Start" : "Try demo"}
    </Button>
  </Paper>;
}

function Worksheets({ onBack }) {
  return <Box sx={pageSx}><Header back={onBack} onSettings={() => {}} /><Container maxWidth="md" sx={{ py: 5 }}>
    <Chip icon={<AssignmentIcon />} label="PRACTICE ZONE" sx={{ fontWeight: 950 }} />
    <Typography variant="h3" fontWeight={1000} sx={{ mt: 1 }}>📝 Worksheets</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Practice letters with simple printable activities.</Typography>
    <Paper sx={{ p: 3, borderRadius: 4 }}>
      <Typography fontWeight={950}>Random Worksheet</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>Generate a random set of letters for practice.</Typography>
      <Button variant="contained" sx={{ mt: 2, borderRadius: 3, fontWeight: 900 }} onClick={() => window.print()}>Print Practice Sheet</Button>
    </Paper>
  </Container></Box>;
}

function Progress({ onBack, visited, total }) {
  const pct = total ? Math.round((visited / total) * 100) : 0;
  return <Box sx={pageSx}><Header back={onBack} onSettings={() => {}} /><Container maxWidth="md" sx={{ py: 5 }}>
    <Chip icon={<EmojiEventsIcon />} label="MY JOURNEY" sx={{ fontWeight: 950 }} />
    <Typography variant="h3" fontWeight={1000} sx={{ mt: 1 }}>⭐ Progress</Typography>
    <Paper sx={{ p: 3, borderRadius: 4, mt: 2 }}>
      <Typography fontWeight={950}>Your learning journey</Typography>
      <Typography sx={{ mt: 1 }}>{visited} of {total} letters explored</Typography>
      <LinearProgress value={pct} variant="determinate" sx={{ height: 12, borderRadius: 8, mt: 2 }} />
      <Typography color="text.secondary" sx={{ mt: 1 }}>{pct}% complete</Typography>
    </Paper>
  </Container></Box>;
}

function Header({ back, onSettings }) {
  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: "blur(14px)", zIndex: 5 }}>
      <Toolbar sx={{ maxWidth: 900, width: "100%", mx: "auto" }}>
        {back && <IconButton onClick={back} aria-label="Back"><ArrowBackIcon /></IconButton>}
        <Typography sx={{ flex: 1 }} fontWeight={950}>🔤 Alphabet Flipper</Typography>
        <IconButton onClick={onSettings} aria-label="Settings"><SettingsIcon /></IconButton>
      </Toolbar>
    </AppBar>
  );
}

function Sound({ label, fn }) {
  return (
    <Button fullWidth variant="outlined" startIcon={<VolumeUpIcon />}
      onClick={e => { e.stopPropagation(); fn(); }}
      sx={{ borderRadius: 3, fontWeight: 900, py: 1.2 }}>
      {label}
    </Button>
  );
}

function Settings({ open, close, settings, setSettings }) {
  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle fontWeight={950}>
        Learning Settings
        <IconButton onClick={close} sx={{ float: "right" }} aria-label="Close"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <FormControlLabel control={<Switch checked={settings.repeat}
          onChange={e => setSettings(x => ({ ...x, repeat: e.target.checked }))} />}
          label="Repeat Alphabets" />
        <Typography mt={2} fontWeight={900}>Learning Order</Typography>
        <Select fullWidth value={settings.order}
          onChange={e => setSettings(x => ({ ...x, order: e.target.value }))} sx={{ mt: 1 }}>
          <MenuItem value="random">Random</MenuItem>
          <MenuItem value="series">A → Z</MenuItem>
        </Select>
        <FormControlLabel sx={{ mt: 1 }} control={<Switch checked={settings.autoVoice}
          onChange={e => setSettings(x => ({ ...x, autoVoice: e.target.checked }))} />}
          label="Auto Voice" />
        <Typography mt={2} fontWeight={900}>Voice Speed: {settings.speed.toFixed(1)}×</Typography>
        <Slider min={.4} max={1.1} step={.1} value={settings.speed}
          onChange={(_, value) => setSettings(x => ({ ...x, speed: value }))} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={close} variant="contained" sx={{ borderRadius: 3, fontWeight: 900 }}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}

const homeHero = {
  position: "relative",
  p: { xs: 0, md: 0 },
  background: "transparent",
  border: "0",
  boxShadow: "none"
};

const tileGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", sm: "repeat(2,1fr)" },
  gap: { xs: 1.2, sm: 2 }
};

const mainBtn = {
  px: 3, py: 1.35, borderRadius: 1.75, fontWeight: 950,
  boxShadow: "0 12px 30px rgba(108,99,255,.28)"
};

const secondaryBtn = {
  px: 3, py: 1.35, borderRadius: 1.75, fontWeight: 950,
  borderWidth: 2
};

const pageSx = {
  minHeight: "100vh",
  background: "radial-gradient(circle at 15% 10%, rgba(108,99,255,.16), transparent 28%), radial-gradient(circle at 90% 20%, rgba(255,108,168,.12), transparent 25%), #f7f8fc"
};

const heroSx = {
  position: "relative", overflow: "hidden", borderRadius: 7, p: { xs: 3, md: 6 },
  background: "linear-gradient(135deg,#ffffff 0%,#eef0ff 55%,#fdf1f8 100%)",
  border: "1px solid rgba(108,99,255,.14)", boxShadow: "0 24px 70px rgba(45,48,90,.12)"
};

const primaryButtonSx = {
  mt: 3, px: 4, py: 1.6, borderRadius: 4, fontWeight: 950,
  boxShadow: "0 12px 30px rgba(108,99,255,.28)"
};

const cardFaceSx = {
  minHeight: { xs: 390, md: 450 }, display: "grid", placeItems: "center",
  textAlign: "center", p: 3
};
