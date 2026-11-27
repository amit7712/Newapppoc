import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AppBar, Box, Button, Card, CardContent, Chip, Container, Dialog,
  DialogActions, DialogContent, DialogTitle, FormControlLabel,
  IconButton, LinearProgress, MenuItem, Paper, Select, Slider, Stack,
  Switch, Toolbar, Typography, TextField, Avatar
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
import EditIcon from "@mui/icons-material/Edit";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { alphabet, PHONICS_SOUNDS } from "./alphabet.js";
import { AlphabetMatchingGame, AlphabetPictureMatchingGame } from "./MatchingGames.jsx";
import PracticeSheets from "./PracticeSheets.jsx";

const defaults = { repeat: false, order: "random", autoVoice: false, speed: 0.7 };
const defaultProfile = { name: "Little Learner", level: "LKG", avatar: "🦊", visited: [] };
const allowedLevels = new Set(["LKG", "UKG", "Class 1"]);
const allowedAvatars = new Set(["🦊","🐼","🐯","🐰","🐸","🦁"]);

const HINDI_VARNAMALA = [
  ["अ","अनार","🍎"],["आ","आम","🥭"],["इ","इमली","🌿"],["ई","ईख","🌾"],["उ","उल्लू","🦉"],["ऊ","ऊन","🧶"],
  ["ऋ","ऋषि","🧘"],["ए","एड़ी","🦶"],["ऐ","ऐनक","👓"],["ओ","ओखली","🥣"],["औ","औरत","👩"],["अं","अंगूर","🍇"],["अः","अः","🔤"],
  ["क","कबूतर","🕊️"],["ख","खरगोश","🐇"],["ग","गमला","🪴"],["घ","घर","🏠"],["ङ","ङकार","🔤"],
  ["च","चम्मच","🥄"],["छ","छाता","☂️"],["ज","जहाज़","🚢"],["झ","झंडा","🚩"],["ञ","ञकार","🔤"],
  ["ट","टमाटर","🍅"],["ठ","ठेला","🛒"],["ड","डमरू","🥁"],["ढ","ढक्कन","🫙"],["ण","णकार","🔤"],
  ["त","तरबूज","🍉"],["थ","थर्मस","🧴"],["द","दवात","🖋️"],["ध","धनुष","🏹"],["न","नल","🚰"],
  ["प","पतंग","🪁"],["फ","फल","🍎"],["ब","बकरी","🐐"],["भ","भालू","🐻"],["म","मछली","🐟"],
  ["य","यज्ञ","🔥"],["र","रथ","🛞"],["ल","लट्टू","🪀"],["व","वन","🌳"],["श","शेर","🦁"],["ष","षट्कोण","⬡"],["स","सूरज","☀️"],["ह","हाथी","🐘"],
  ["क्ष","क्षत्रिय","🛡️"],["त्र","त्रिशूल","🔱"],["ज्ञ","ज्ञान","📚"]
];


const USERS_KEY = "af-users-v1";
const ACCESS_OPTIONS = [
  { key: "home", label: "Home" },
  { key: "learn", label: "Learn ABC" },
  { key: "games", label: "Games" },
  { key: "worksheets", label: "Worksheets" },
  { key: "progress", label: "My Progress" }
];

const DEFAULT_ADMIN = {
  id: "admin-default", username: "admin",
  name: "Administrator", level: "Class 1", avatar: "🦁", role: "admin",
  active: true, access: ACCESS_OPTIONS.map(x => x.key), visited: []
};


const loadUsers = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    if (!Array.isArray(raw)) return [DEFAULT_ADMIN];
    const users = raw.filter(u => u && typeof u.username === "string").map(u => ({
      id: String(u.id || u.username),
      username: u.username.slice(0, 40),
      name: typeof u.name === "string" ? u.name.slice(0, 30) : "Little Learner",
      level: allowedLevels.has(u.level) ? u.level : "LKG",
      avatar: allowedAvatars.has(u.avatar) ? u.avatar : "🦊",
      role: u.role === "admin" ? "admin" : "user",
      active: u.active !== false,
      access: Array.isArray(u.access) ? u.access.filter(x => ACCESS_OPTIONS.some(o => o.key === x)) : ["home"],
      visited: Array.isArray(u.visited) ? u.visited.filter(Number.isInteger).filter(i => i >= 0 && i < 26) : []
    }));
    return users.length ? users : [DEFAULT_ADMIN];
  } catch { return [DEFAULT_ADMIN]; }
};

const saveUsers = users => localStorage.setItem(USERS_KEY, JSON.stringify(users));


const loadProfile = () => {
  try {
    const raw = JSON.parse(localStorage.getItem("af-profile") || "{}");
    return {
      name: typeof raw.name === "string" ? raw.name.slice(0, 30) : defaultProfile.name,
      level: allowedLevels.has(raw.level) ? raw.level : defaultProfile.level,
      avatar: allowedAvatars.has(raw.avatar) ? raw.avatar : defaultProfile.avatar,
      visited: Array.isArray(raw.visited) ? raw.visited.filter(Number.isInteger).filter(i => i >= 0 && i < 26) : []
    };
  } catch { return defaultProfile; }
};

const loadSettings = () => {
  try {
    const raw = JSON.parse(localStorage.getItem("af-settings") || "{}");
    return {
      repeat: raw.repeat === true,
      order: raw.order === "series" ? "series" : "random",
      autoVoice: raw.autoVoice === true,
      speed: Number.isFinite(Number(raw.speed)) ? Math.min(1.1, Math.max(.4, Number(raw.speed))) : defaults.speed
    };
  } catch { return defaults; }
};

export default function App() {
  // auth-admin-2 is intentionally login-free. The app opens directly and
  // browser-local learner metadata remains visible and editable.
  const [screen, setScreen] = useState("home");
  const [session] = useState(DEFAULT_ADMIN);
  const [users, setUsers] = useState(loadUsers);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [profile, setProfile] = useState(loadProfile);
  const [profileOpen, setProfileOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [visited, setVisited] = useState(() => new Set(profile.visited));
  const [used, setUsed] = useState(new Set());
  const [nextAnimating, setNextAnimating] = useState(false);
  const flippedRef = useRef(false);
  const hasRenderedLearnRef = useRef(false);
  useEffect(() => { flippedRef.current = flipped; }, [flipped]);

  // Auto voice is driven ONLY by the actual revealed state.
  // There is deliberately no speech timer attached to the initial/start state.
  useEffect(() => {
    if (screen !== "learn") {
      hasRenderedLearnRef.current = false;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      return;
    }

    if (!flipped) {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      return;
    }

    // Speak only on a false -> true reveal transition.
    if (!hasRenderedLearnRef.current) {
      hasRenderedLearnRef.current = true;
      return;
    }

    if (settings.autoVoice) {
      const word = current.word;
      const timer = window.setTimeout(() => {
        if (flippedRef.current && screen === "learn") speak(word);
      }, 120);
      return () => window.clearTimeout(timer);
    }
  }, [screen, flipped, index, settings.autoVoice]);

  useEffect(() => localStorage.setItem("af-settings", JSON.stringify(settings)), [settings]);
  useEffect(() => {
    localStorage.setItem("af-profile", JSON.stringify({ ...profile, visited: [...visited] }));
  }, [profile, visited]);

  // Never allow queued/previous speech to play while the card is hidden.
  // This is especially important on mobile browsers where speech can survive
  // a previous screen interaction.
  useEffect(() => {
    if (!flipped && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [flipped, screen]);

  // Cancel speech when the browser tab is backgrounded/hidden.
  useEffect(() => {
    const stopSpeech = () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
    document.addEventListener("visibilitychange", stopSpeech);
    window.addEventListener("pagehide", stopSpeech);
    return () => {
      document.removeEventListener("visibilitychange", stopSpeech);
      window.removeEventListener("pagehide", stopSpeech);
    };
  }, []);

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
  const canAccess = () => true; // auth-admin-2 is intentionally login-free
  const goTo = target => setScreen(target);
  const progress = ((visited.size + (flipped ? 1 : 0)) / cards.length) * 100;

  const speak = (text, lang = "en-IN") => {
    // Central safety gate: hidden cards can never start speech.
    if (screen !== "learn" || !flipped) {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      return;
    }
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
    // First tap: reveal the current letter.
    if (!flipped) {
      setFlipped(true);
      setVisited(old => new Set([...old, index]));
      return;
    }

    // Second tap: do NOT turn back to the empty "Tap to Flip" face.
    // Pick a new alphabet and flip directly to the new letter.
    if (nextAnimating) return;
    const nextIndex = pickNextIndex();
    setNextAnimating(true);
    setFlipped(false);

    window.setTimeout(() => {
      setIndex(nextIndex);
      if (!settings.repeat) {
        setUsed(old => new Set([...old, nextIndex]));
      }
      window.setTimeout(() => {
        setFlipped(true);
        setVisited(old => new Set([...old, nextIndex]));
        setNextAnimating(false);
      }, 40);
    }, 360);
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
    if (!canAccess("learn")) return;
    // Starting a new learning session must always begin silently.
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
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

  if (screen === "admin") {
    return <AdminScreen users={users} setUsers={setUsers} onBack={() => setScreen("home")} />;
  }

  if (screen === "home") {
    return (
      <Box sx={pageSx}>
        <Header onSettings={() => setSettingsOpen(true)} onAdmin={() => setScreen("admin")} />
        <Container maxWidth="lg" sx={{ py: { xs: 1.5, md: 3 } }}>
          <Paper className="profile-panel" sx={{ p: { xs: 1.5, md: 2 }, mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ width: { xs: 48, md: 58 }, height: { xs: 48, md: 58 }, bgcolor: "#e9e7ff", fontSize: { xs: 25, md: 30 } }}>
                {profile.avatar}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 1000, lineHeight: 1.1 }}>
                  Hi, {profile.name} 👋
                </Typography>
                <Typography variant="body2" sx={{ color: "#68708a", fontWeight: 800, mt: .3 }}>
                  {profile.level} • Little Learner
                </Typography>
              </Box>
              <IconButton onClick={() => setProfileOpen(true)} aria-label="Edit learner profile" sx={{ bgcolor: "#f1f0ff" }}>
                <EditIcon />
              </IconButton>
            </Stack>
          </Paper>

          <Box className="home-welcome">
            <Box>
              <Typography sx={{ fontSize: { xs: 31, sm: 42, md: 54 }, lineHeight: .98, fontWeight: 1000, color: "#18213d" }}>
                Ready to learn?
              </Typography>
              <Typography sx={{ mt: 1, color: "#58627c", fontWeight: 750, fontSize: { xs: 15, md: 18 }, maxWidth: 620 }}>
                Pick one activity and continue your ABC adventure.
              </Typography>
            </Box>
            <Box className="home-welcome-emoji">🚀</Box>
          </Box>

          <Box className="home-stats">
            <Paper className="home-stat">
              <Typography className="stat-icon">🔤</Typography>
              <Box>
                <Typography className="stat-value">{visited.size}/26</Typography>
                <Typography className="stat-label">Letters explored</Typography>
              </Box>
            </Paper>
            <Paper className="home-stat">
              <Typography className="stat-icon">⭐</Typography>
              <Box>
                <Typography className="stat-value">{visited.size}</Typography>
                <Typography className="stat-label">Stars earned</Typography>
              </Box>
            </Paper>
            <Paper className="home-stat">
              <Typography className="stat-icon">🎯</Typography>
              <Box>
                <Typography className="stat-value">{Math.min(visited.size, 5)}/5</Typography>
                <Typography className="stat-label">Today's goal</Typography>
              </Box>
            </Paper>
          </Box>

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2.5, mb: 1.2 }}>
            <Typography variant="h5" fontWeight={1000}>What do you want to do?</Typography>
            <Typography variant="body2" sx={{ color: "#68708a", fontWeight: 800 }}>Choose an activity</Typography>
          </Stack>

          <Box sx={tileGrid}>
            <HomeTile emoji="🔤" title="Learn ABC" subtitle="Flip & discover letters" tone="#e5f3ff" onClick={canAccess("learn") ? start : undefined} />
            <HomeTile emoji="🎮" title="Games" subtitle="Learn by playing" tone="#e9e7ff" onClick={() => goTo("games")} />
            <HomeTile emoji="📝" title="Worksheets" subtitle="Practice & print" tone="#fff0d9" onClick={() => goTo("worksheets")} />
            <HomeTile emoji="🏆" title="My Progress" subtitle="See learning journey" tone="#e2f8ec" onClick={() => goTo("progress")} />
          </Box>

          <Paper sx={{ mt: 2.5, p: { xs: 1.7, md: 2.2 }, borderRadius: 4, bgcolor: "#fff", border: "1px solid #ececf5", boxShadow: "0 10px 30px rgba(42,49,93,.06)" }}>
            <Typography fontWeight={1000}>Stored Metadata</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
              Login के बिना browser में saved learner, settings, progress और users का data यहाँ visible है।
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)" }, gap: 1.2, mt: 1.5 }}>
              <Paper variant="outlined" sx={{ p: 1.3, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">Learner</Typography>
                <Typography fontWeight={900}>{profile.name} • {profile.level} • {profile.avatar}</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.3, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">Progress</Typography>
                <Typography fontWeight={900}>{visited.size}/26 letters • {Math.round((visited.size / 26) * 100)}%</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.3, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">Learning Settings</Typography>
                <Typography fontWeight={900}>{settings.order === "series" ? "A → Z" : "Random"} • Repeat {settings.repeat ? "On" : "Off"} • Voice {settings.autoVoice ? "On" : "Off"} • Speed {settings.speed.toFixed(1)}×</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.3, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">Stored Users</Typography>
                <Typography fontWeight={900}>{users.length} total • {users.filter(u => u.role === "user").length} learners</Typography>
              </Paper>
            </Box>
          </Paper>

          <Paper sx={{ mt: 2.5, p: { xs: 1.7, md: 2.2 }, borderRadius: 4, bgcolor: "#fff", border: "1px solid #ececf5", boxShadow: "0 10px 30px rgba(42,49,93,.06)" }}>
            <Stack direction="row" spacing={1.4} alignItems="center">
              <Box className="reward-icon">🏆</Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={1000}>Today's learning goal</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={650}>
                  Explore 5 letters and hear their sounds.
                </Typography>
                <LinearProgress variant="determinate" value={Math.min((visited.size / 5) * 100, 100)} sx={{ mt: 1, height: 9, borderRadius: 9 }} />
              </Box>
              <Typography fontWeight={1000} color="primary.main">{Math.min(visited.size, 5)}/5</Typography>
            </Stack>
          </Paper>

        </Container>

        <ProfileDialog
          open={profileOpen}
          close={() => setProfileOpen(false)}
          profile={profile}
          setProfile={setProfile}
        />
        <Settings open={settingsOpen} close={() => setSettingsOpen(false)} settings={settings} setSettings={setSettings} />
      </Box>
    );
  }

  if (screen === "games") return <Games onBack={() => goTo("home")} onStart={start} onHindi={() => goTo("hindi")} />;
  if (screen === "hindi") return <HindiVarnamala onBack={() => goTo("games")} settings={settings} setSettings={setSettings} />;
  if (screen === "match-capital") return <AlphabetMatchingGame onBack={() => goTo("games")} />;
  if (screen === "match-picture") return <AlphabetPictureMatchingGame onBack={() => goTo("games")} />;
  if (screen === "worksheets") return <PracticeSheets onBack={() => goTo("home")} />;
  if (screen === "progress") return <Progress onBack={() => goTo("home")} visited={visited.size} total={cards.length} />
  return (
    <Box sx={pageSx}>
      <Header back={() => setScreen("home")} onSettings={() => setSettingsOpen(true)} />
      <Container className="learn-container" maxWidth="sm" sx={{ pb: 6 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography fontWeight={900}>Letter {current.upper}</Typography>
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
          <Sound label="Letter" disabled={!flipped} fn={() => speak(current.upper)} />
          <Sound label="Word" disabled={!flipped} fn={() => speak(current.word)} />
          <Sound label="Hindi Phonics" disabled={!flipped} fn={() => speak(PHONICS_SOUNDS[current.upper], "hi-IN")} />
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



function AdminScreen({ users, setUsers, onBack }) {
  const [draft, setDraft] = useState({ username: "", name: "", level: "LKG", access: ["home","learn","games","worksheets","progress"] });
  const [error, setError] = useState("");


  const addUser = async () => {
    const username = draft.username.trim().toLowerCase();
    if (!username) return setError("Username required है.");

    try {
      if (users.some(u => u.username.toLowerCase() === username)) return setError("Username already exists.");
      const user = {
        id: "user-" + Date.now(), username,
        name: draft.name.trim() || "Little Learner", level: draft.level, avatar: "🦊",
        role: "user", active: true, access: [...draft.access], visited: []
      };
      const next = [...users, user]; setUsers(next); saveUsers(next);
      setDraft({ username: "", name: "", level: "LKG", access: ["home","learn","games","worksheets","progress"] });
      setError("");
    } catch (e) {
      setError(e?.message || "Unable to create user.");
    }
  };

  const updateUser = async (id, patch) => {
    try {
      const next = users.map(u => u.id === id ? { ...u, ...patch } : u);
      setUsers(next); saveUsers(next);
    } catch (e) {
      setError(e?.message || "Unable to update user.");
    }
  };

  const removeUser = async id => {
    const target = users.find(u => u.id === id);
    if (!target || target.role === "admin") return;
    try {
      const next = users.filter(u => u.id !== id); setUsers(next); saveUsers(next);
    } catch (e) {
      setError(e?.message || "Unable to delete user.");
    }
  };

  return <Box sx={pageSx}>
    <Header back={onBack} onSettings={() => {}} />
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box><Typography variant="h3" fontWeight={1000}>Admin Dashboard</Typography><Typography color="text.secondary">Users, access and learner accounts.</Typography></Box>
        <Chip label={`${users.filter(u => u.role === "user").length} registered users`} color="primary" />
      </Stack>
      <Paper sx={{ p: 2.2, borderRadius: 3, mb: 2 }}>
        <Typography fontWeight={1000} sx={{ mb: 1.5 }}>Add User</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4,1fr)" }, gap: 1.2 }}>
          <TextField size="small" label="Name" value={draft.name} onChange={e => setDraft(x => ({ ...x, name: e.target.value }))} />
          <TextField size="small" label="Username" value={draft.username} onChange={e => setDraft(x => ({ ...x, username: e.target.value }))} />
          <Select size="small" value={draft.level} onChange={e => setDraft(x => ({ ...x, level: e.target.value }))}>
            <MenuItem value="LKG">LKG</MenuItem><MenuItem value="UKG">UKG</MenuItem><MenuItem value="Class 1">Class 1</MenuItem>
          </Select>
        </Box>
        <Typography fontWeight={900} sx={{ mt: 2, mb: .8 }}>Access</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {ACCESS_OPTIONS.map(o => <FormControlLabel key={o.key}
            control={<Switch checked={draft.access.includes(o.key)} onChange={e => setDraft(x => ({ ...x, access: e.target.checked ? [...new Set([...x.access, o.key])] : x.access.filter(k => k !== o.key) }))} />}
            label={o.label} />)}
        </Stack>
        {error && <Typography color="error" fontWeight={800} sx={{ mt: 1 }}>{error}</Typography>}
        <Button variant="contained" onClick={addUser} sx={{ mt: 1.5, borderRadius: 2.5, fontWeight: 950 }}>
          Add User
        </Button>
      </Paper>
      <Box sx={{ display: "grid", gap: 1.2 }}>
        {users.map(u => <Paper key={u.id} sx={{ p: 1.8, borderRadius: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
            <Avatar>{u.avatar}</Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={1000}>{u.name} <Chip size="small" label={u.role} sx={{ ml: .5 }} /></Typography>
              <Typography variant="body2" color="text.secondary">@{u.username} • {u.level} • {u.visited?.length || 0}/26 letters</Typography>
            </Box>
            <FormControlLabel control={<Switch checked={u.active !== false} disabled={u.role === "admin"} onChange={e => updateUser(u.id, { active: e.target.checked })} />} label="Active" />
            <Button color="error" variant="outlined" disabled={u.role === "admin"} onClick={() => removeUser(u.id)}>Delete</Button>
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={.5} sx={{ mt: 1 }}>
            {ACCESS_OPTIONS.map(o => <Chip key={o.key} size="small" label={o.label} color={u.access?.includes(o.key) ? "primary" : "default"} variant={u.access?.includes(o.key) ? "filled" : "outlined"} onClick={() => u.role !== "admin" && updateUser(u.id, { access: u.access?.includes(o.key) ? u.access.filter(k => k !== o.key) : [...(u.access || []), o.key] })} />)}
          </Stack>
        </Paper>)}
      </Box>
    </Container>
  </Box>;
}


function ProfileDialog({ open, close, profile, setProfile }) {
  const [draft, setDraft] = useState(profile);

  useEffect(() => {
    if (open) setDraft(profile);
  }, [open, profile]);

  const save = () => {
    const safeName = typeof draft.name === "string" ? draft.name.trim().slice(0, 30) : "Little Learner";
    setProfile({
      name: safeName || "Little Learner",
      level: allowedLevels.has(draft.level) ? draft.level : "LKG",
      avatar: allowedAvatars.has(draft.avatar) ? draft.avatar : "🦊",
      visited: profile.visited || []
    });
    close();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle fontWeight={950}>
        Learner Profile
        <IconButton onClick={close} sx={{ float: "right" }} aria-label="Close"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Child's name" value={draft.name}
            onChange={e => setDraft(x => ({ ...x, name: String(e.target.value).slice(0, 30) }))}
            autoFocus fullWidth />
          <Select fullWidth value={draft.level}
            onChange={e => setDraft(x => ({ ...x, level: e.target.value }))}>
            <MenuItem value="LKG">LKG</MenuItem>
            <MenuItem value="UKG">UKG</MenuItem>
            <MenuItem value="Class 1">Class 1</MenuItem>
          </Select>
          <Box>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Choose avatar</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {["🦊","🐼","🐯","🐰","🐸","🦁"].map(emoji => (
                <Button key={emoji} variant={draft.avatar === emoji ? "contained" : "outlined"}
                  onClick={() => setDraft(x => ({ ...x, avatar: emoji }))}
                  sx={{ minWidth: 48, fontSize: 24, borderRadius: 2 }}>
                </Button>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button variant="contained" onClick={save}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

const pageSx = {
  minHeight: "100vh",
  bgcolor: "#f7f8fc",
  color: "#18213d"
};

const tileGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
  gap: 1.4
};

const cardFaceSx = {
  minHeight: { xs: 380, md: 440 },
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  p: 3
};

function Header({ back, onSettings, onAdmin }) {
  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar sx={{ maxWidth: 1100, width: "100%", mx: "auto" }}>
        {back && <IconButton onClick={back}><ArrowBackIcon /></IconButton>}
        <Typography sx={{ flex: 1 }} fontWeight={1000}>Alphabet Flipper</Typography>
        {onAdmin && <Button size="small" onClick={onAdmin} sx={{ mr: 1 }}>Admin</Button>}
        {onSettings && <IconButton onClick={onSettings}><SettingsIcon /></IconButton>}
      </Toolbar>
    </AppBar>
  );
}

function HomeTile({ emoji, title, subtitle, tone, onClick }) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: { xs: 1.5, md: 2 },
        minHeight: 135,
        borderRadius: 4,
        bgcolor: tone,
        cursor: onClick ? "pointer" : "default",
        border: "1px solid rgba(0,0,0,.05)"
      }}
    >
      <Typography sx={{ fontSize: 42 }}>{emoji}</Typography>
      <Typography fontWeight={1000}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
    </Paper>
  );
}

function Sound({ label, disabled, fn }) {
  return (
    <Button
      fullWidth
      variant="outlined"
      disabled={disabled}
      startIcon={<VolumeUpIcon />}
      onClick={e => { e.stopPropagation(); fn(); }}
      sx={{ borderRadius: 3, fontWeight: 900 }}
    >
      {label}
    </Button>
  );
}

function Settings({ open, close, settings, setSettings }) {
  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle fontWeight={950}>
        Settings
        <IconButton onClick={close} sx={{ float: "right" }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <FormControlLabel
          control={<Switch checked={settings.repeat} onChange={e => setSettings(x => ({ ...x, repeat: e.target.checked }))} />}
          label="Repeat Alphabets"
        />
        <Typography mt={2} fontWeight={900}>Learning Order</Typography>
        <Select fullWidth value={settings.order} onChange={e => setSettings(x => ({ ...x, order: e.target.value }))} sx={{ mt: 1 }}>
          <MenuItem value="random">Random</MenuItem>
          <MenuItem value="series">A → Z</MenuItem>
        </Select>
        <FormControlLabel
          sx={{ mt: 1 }}
          control={<Switch checked={settings.autoVoice} onChange={e => setSettings(x => ({ ...x, autoVoice: e.target.checked }))} />}
          label="Auto Voice"
        />
        <Typography mt={2} fontWeight={900}>Voice Speed: {settings.speed.toFixed(1)}×</Typography>
        <Slider
          min={.4} max={1.1} step={.1} value={settings.speed}
          onChange={(_, value) => setSettings(x => ({ ...x, speed: value }))}
        />
      </DialogContent>
      <DialogActions><Button onClick={close} variant="contained">Done</Button></DialogActions>
    </Dialog>
  );
}

function Games({ onBack, onStart, onHindi }) {
  return (
    <Box sx={pageSx}>
      <Header back={onBack} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={1000}>Games</Typography>
        <Typography color="text.secondary" sx={{ mt: .5, mb: 2 }}>Choose a playful ABC activity.</Typography>
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography fontSize={48}>🎮</Typography>
            <Typography fontWeight={950}>Alphabet Flip Challenge</Typography>
            <Typography color="text.secondary" sx={{ mt: .4 }}>English A–Z flip, phonics and sounds.</Typography>
            <Button variant="contained" onClick={onStart} sx={{ mt: 2 }}>Start Learning</Button>
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 4, bgcolor: "#fff8e8" }}>
            <Typography fontSize={48}>🇮🇳</Typography>
            <Typography fontWeight={950}>हिंदी वर्णमाला Flipper</Typography>
            <Typography color="text.secondary" sx={{ mt: .4 }}>अ से ज्ञ तक अक्षर, शब्द और हिंदी आवाज़ के साथ।</Typography>
            <Button variant="contained" onClick={onHindi} sx={{ mt: 2 }}>हिंदी शुरू करें</Button>
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 4, bgcolor: "#eef5ff" }}>
            <Typography fontSize={48}>🔤</Typography>
            <Typography fontWeight={950}>Small → Capital Matching</Typography>
            <Typography color="text.secondary" sx={{ mt: .4 }}>Match a, b, c with A, B, C. 5 retries per round.</Typography>
            <Button variant="contained" onClick={() => goTo("match-capital")} sx={{ mt: 2 }}>Play Matching</Button>
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 4, bgcolor: "#eefbf4" }}>
            <Typography fontSize={48}>🖼️</Typography>
            <Typography fontWeight={950}>Alphabet → Picture Matching</Typography>
            <Typography color="text.secondary" sx={{ mt: .4 }}>Find shuffled pictures that begin with the shown letter.</Typography>
            <Button variant="contained" onClick={() => goTo("match-picture")} sx={{ mt: 2 }}>Play Picture Match</Button>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}


function HindiVarnamala({ onBack, settings, setSettings }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [visited, setVisited] = useState(() => new Set());
  const [used, setUsed] = useState(() => new Set([0]));
  const [nextAnimating, setNextAnimating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const current = HINDI_VARNAMALA[index];

  const speakHindi = (text) => {
    if (!flipped || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hi-IN";
    u.rate = settings.speed;
    const voice = window.speechSynthesis.getVoices().find(v => /^hi(-|_)/i.test(v.lang));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  };

  const pickNextIndex = () => {
    if (settings.order === "series") return (index + 1) % HINDI_VARNAMALA.length;

    let pool = HINDI_VARNAMALA.map((_, i) => i).filter(i => !used.has(i) && i !== index);
    if (!pool.length) {
      pool = HINDI_VARNAMALA.map((_, i) => i).filter(i => i !== index);
      setUsed(new Set([index]));
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const goNext = () => {
    if (nextAnimating) return;
    const nextIndex = pickNextIndex();
    setNextAnimating(true);

    if (flipped) {
      setFlipped(false);
      window.setTimeout(() => {
        setIndex(nextIndex);
        if (!settings.repeat) setUsed(old => new Set([...old, nextIndex]));
        window.setTimeout(() => {
          setFlipped(true);
          setVisited(old => new Set([...old, nextIndex]));
          setNextAnimating(false);
        }, 40);
      }, 360);
    } else {
      setIndex(nextIndex);
      if (!settings.repeat) setUsed(old => new Set([...old, nextIndex]));
      window.setTimeout(() => {
        setFlipped(true);
        setVisited(old => new Set([...old, nextIndex]));
        setNextAnimating(false);
      }, 40);
    }
  };

  const flipCard = () => {
    if (!flipped) {
      setFlipped(true);
      setVisited(old => new Set([...old, index]));
      return;
    }
    goNext();
  };

  useEffect(() => {
    if (!flipped && "speechSynthesis" in window) window.speechSynthesis.cancel();
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [flipped]);

  return (
    <Box sx={pageSx}>
      <Header back={onBack} onSettings={() => setSettingsOpen(true)} />
      <Container maxWidth="sm" sx={{ py: 2.5, pb: 6 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Box>
            <Typography fontWeight={1000}>हिंदी वर्णमाला Flipper</Typography>
            <Typography variant="body2" color="text.secondary">
              अ से ज्ञ तक • {visited.size}/{HINDI_VARNAMALA.length}
            </Typography>
          </Box>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={(visited.size / HINDI_VARNAMALA.length) * 100}
          sx={{ height: 10, borderRadius: 10, mb: 2 }}
        />

        <Box
          className={`flip-scene ${flipped ? "is-flipped" : ""}`}
          onClick={flipCard}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") flipCard();
          }}
        >
          <Box className="flip-card">
            <Card className="flip-face flip-front" elevation={0}>
              <CardContent sx={cardFaceSx}>
                <Typography sx={{ fontSize: 58 }}>↻</Typography>
                <Typography variant="h4" fontWeight={950}>टैप करके पलटें</Typography>
                <Typography sx={{ opacity: .85 }}>हिंदी अक्षर सीखें</Typography>
              </CardContent>
            </Card>

            <Card className="flip-face flip-back" elevation={0}>
              <CardContent sx={{ ...cardFaceSx, color: "#172033" }}>
                <Typography sx={{ fontSize: { xs: 92, md: 116 }, fontWeight: 950, lineHeight: .9, color: "primary.main" }}>
                  {current[0]}
                </Typography>
                <Typography sx={{ fontSize: 60, mt: 1 }}>{current[2]}</Typography>
                <Typography variant="h4" fontWeight={950}>{current[1]}</Typography>
                <Typography fontWeight={900} color="primary.main">
                  अक्षर: {current[0]}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} mt={2}>
          <Sound label="अक्षर की आवाज़" disabled={!flipped} fn={() => speakHindi(current[0])} />
          <Sound label="शब्द की आवाज़" disabled={!flipped} fn={() => speakHindi(current[1])} />
        </Stack>

        <Button
          fullWidth
          variant="contained"
          onClick={goNext}
          disabled={nextAnimating || (!settings.repeat && settings.order === "series" && index === HINDI_VARNAMALA.length - 1)}
          startIcon={settings.order === "random" ? <ShuffleIcon /> : <PlayArrowIcon />}
          sx={{ mt: 2, borderRadius: 4, py: 1.6, fontWeight: 950 }}
        >
          अगला वर्ण
        </Button>

        <Paper sx={{ mt: 3, p: 2.2, borderRadius: 4 }}>
          <Typography fontWeight={950}>Learning Journey</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
            Flip करें, अक्षर और शब्द की आवाज़ सुनें, फिर अगले वर्ण पर जाएँ।
          </Typography>
          <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
            <Chip label={settings.order === "series" ? "Series" : "Mixed"} />
            <Chip label={settings.repeat ? "Repeat On" : "Repeat Off"} />
            <Chip label={`Explored: ${visited.size}`} />
          </Stack>
        </Paper>
      </Container>

      <Settings
        open={settingsOpen}
        close={() => setSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
      />
    </Box>
  );
}

function Worksheets({ onBack }) {
  return (
    <Box sx={pageSx}>
      <Header back={onBack} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={1000}>Worksheets</Typography>
        <Paper sx={{ mt: 2, p: 3, borderRadius: 4 }}>
          <Typography fontSize={48}>📝</Typography>
          <Typography fontWeight={950}>ABC practice worksheets</Typography>
          <Typography color="text.secondary" sx={{ mt: .5 }}>Practice material is available from this section.</Typography>
        </Paper>
      </Container>
    </Box>
  );
}

function Progress({ onBack, visited, total }) {
  const percent = total ? Math.round((visited / total) * 100) : 0;
  return (
    <Box sx={pageSx}>
      <Header back={onBack} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={1000}>My Progress</Typography>
        <Paper sx={{ mt: 2, p: 3, borderRadius: 4 }}>
          <Typography fontWeight={950}>Letters explored: {visited}/{total}</Typography>
          <LinearProgress variant="determinate" value={percent} sx={{ mt: 2, height: 10, borderRadius: 10 }} />
          <Typography color="text.secondary" sx={{ mt: 1 }}>{percent}% complete</Typography>
        </Paper>
      </Container>
    </Box>
  );
}
