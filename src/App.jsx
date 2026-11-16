import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar, Box, Button, Card, CardContent, Chip, Container, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel,
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
import { alphabet, PHONICS_SOUNDS } from "./alphabet.js";

const defaults = { repeat: true, order: "random", autoVoice: false, speed: 0.7 };

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

  useEffect(() => localStorage.setItem("af-settings", JSON.stringify(settings)), [settings]);

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
    setFlipped(value => !value);
    setVisited(old => new Set([...old, index]));
  };

  const next = () => {
    setFlipped(false);
    setIndex(old => settings.order === "random"
      ? Math.floor(Math.random() * cards.length)
      : (old + 1) % cards.length);
  };

  const start = () => {
    setIndex(settings.order === "random" ? Math.floor(Math.random() * cards.length) : 0);
    setFlipped(false);
    setScreen("learn");
  };

  if (screen === "home") {
    return (
      <Box sx={pageSx}>
        <Header onSettings={() => setSettingsOpen(true)} />
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
          <Box sx={heroSx}>
            <Box className="hero-orb orb-one" /><Box className="hero-orb orb-two" />
            <Chip icon={<AutoAwesomeIcon />} label="LEARN • PLAY • DISCOVER" color="secondary" sx={{ fontWeight: 950, mb: 1.5 }} />
            <Typography sx={{ fontSize: { xs: 42, sm: 58, md: 72 }, lineHeight: .98, fontWeight: 950, letterSpacing: -2 }}>
              Welcome to <Box component="span" sx={{ color: "primary.main" }}>Alphabet Flipper</Box>! 🚀
            </Typography>
            <Typography sx={{ mt: 1.5, maxWidth: 680, fontSize: { xs: 16, md: 20 }, color: "text.secondary", fontWeight: 700 }}>
              Flip, listen, match and learn letters through playful mini-games.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} mt={2.5}>
              <Button size="large" variant="contained" onClick={start} startIcon={<PlayArrowIcon />} sx={primaryButtonSx}>Start Learning</Button>
              <Button size="large" variant="outlined" onClick={() => setScreen("games")} startIcon={<ExtensionIcon />} sx={{ ...primaryButtonSx, mt: { xs: 0, sm: 3 } }}>Explore Games</Button>
            </Stack>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" }, gap: 2, mt: 3 }}>
            <FeatureButton icon={<ExtensionIcon />} title="Games" text="Tap to explore letter games." onClick={() => setScreen("games")} />
            <FeatureButton icon={<AssignmentIcon />} title="Worksheets" text="Practice printable activities." onClick={() => setScreen("worksheets")} />
            <FeatureButton icon={<CheckCircleIcon />} title="Progress" text={"Explore " + visited.size + " of " + cards.length + " letters."} onClick={() => setScreen("progress")} />
          </Box>
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

function FeatureButton({ icon, title, text, onClick }) {
  return <Paper onClick={onClick} sx={{ p: 2.4, borderRadius: 4, minHeight: 145, cursor: "pointer", transition: "transform .2s, box-shadow .2s", "&:hover": { transform: "translateY(-5px)", boxShadow: "0 16px 40px rgba(60,65,120,.15)" } }}>
    <Box sx={{ color: "primary.main", mb: .8 }}>{icon}</Box>
    <Typography fontWeight={950}>{title}</Typography>
    <Typography variant="body2" color="text.secondary">{text}</Typography>
  </Paper>;
}

function Games({ onBack, onStart }) {
  return <Box sx={pageSx}><Header back={onBack} onSettings={() => {}} /><Container maxWidth="md" sx={{ py: 5 }}>
    <Typography variant="h3" fontWeight={950}>🎮 Games</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Choose a game and start learning.</Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)" }, gap: 2 }}>
      <FeatureButton icon={<PlayArrowIcon />} title="Alphabet Flipper" text="Flip letters, discover words and hear sounds." onClick={onStart} />
      <FeatureButton icon={<ExtensionIcon />} title="Letter Builder" text="Build simple words like S-I-P. Coming next." onClick={onStart} />
    </Box>
  </Container></Box>;
}

function Worksheets({ onBack }) {
  return <Box sx={pageSx}><Header back={onBack} onSettings={() => {}} /><Container maxWidth="md" sx={{ py: 5 }}>
    <Typography variant="h3" fontWeight={950}>📝 Worksheets</Typography>
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
    <Typography variant="h3" fontWeight={950}>⭐ Progress</Typography>
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
