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
import {
  supabaseConfigured, supabase, signIn, signOut, getAccount,
  saveProfile, saveProgress, listUsers, adminUserAction
} from "./supabase.js";

const defaults = { repeat: false, order: "random", autoVoice: false, speed: 0.7 };
const defaultProfile = { name: "Little Learner", level: "LKG", avatar: "🦊", visited: [] };
const allowedLevels = new Set(["LKG", "UKG", "Class 1"]);
const allowedAvatars = new Set(["🦊","🐼","🐯","🐰","🐸","🦁"]);
const USERS_KEY = "af-users-v1";
const SESSION_KEY = "af-session-v1";
const ACCESS_OPTIONS = [
  { key: "home", label: "Home" },
  { key: "learn", label: "Learn ABC" },
  { key: "games", label: "Games" },
  { key: "worksheets", label: "Worksheets" },
  { key: "progress", label: "My Progress" }
];

const loadUsers = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(u => u && typeof u.username === "string" && typeof u.password === "string").map(u => ({
      id: String(u.id || u.username),
      username: u.username.slice(0, 40),
      password: u.password,
      name: typeof u.name === "string" ? u.name.slice(0, 30) : "Little Learner",
      level: allowedLevels.has(u.level) ? u.level : "LKG",
      avatar: allowedAvatars.has(u.avatar) ? u.avatar : "🦊",
      role: u.role === "admin" ? "admin" : "user",
      active: u.active !== false,
      access: Array.isArray(u.access) ? u.access.filter(x => ACCESS_OPTIONS.some(o => o.key === x)) : ["home"],
      visited: Array.isArray(u.visited) ? u.visited.filter(Number.isInteger).filter(i => i >= 0 && i < 26) : []
    }));
  } catch { return []; }
};

const loadSession = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return raw && typeof raw.username === "string" ? raw : null;
  } catch { return null; }
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
  const [screen, setScreen] = useState(() => !supabaseConfigured && loadSession() ? "home" : "auth");
  const [session, setSession] = useState(() => !supabaseConfigured ? loadSession() : null);
  const [users, setUsers] = useState(() => !supabaseConfigured ? loadUsers() : []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [profile, setProfile] = useState(() => !supabaseConfigured ? loadProfile() : defaultProfile);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);
  const [authError, setAuthError] = useState("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [visited, setVisited] = useState(() => new Set(profile.visited));
  const [used, setUsed] = useState(new Set());
  const [nextAnimating, setNextAnimating] = useState(false);
  const flippedRef = useRef(false);
  const hasRenderedLearnRef = useRef(false);
  useEffect(() => { flippedRef.current = flipped; }, [flipped]);

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    let alive = true;
    (async () => {
      try {
        const { data: { session: remoteSession } } = await supabase.auth.getSession();
        if (remoteSession?.user) {
          const account = await getAccount(remoteSession.user.id);
          if (alive && account && account.active) {
            setSession(account);
            setProfile({ name: account.name, level: account.level, avatar: account.avatar, visited: account.visited });
            setVisited(new Set(account.visited));
            setScreen("home");
          } else if (alive) {
            await supabase.auth.signOut();
            setScreen("auth");
          }
        } else if (alive) {
          setScreen("auth");
        }
      } catch (error) {
        if (alive) setAuthError(error?.message || "Unable to load your account.");
      } finally {
        if (alive) setAuthLoading(false);
      }
    })();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, remoteSession) => {
      if (!alive || !remoteSession?.user) return;
      try {
        const account = await getAccount(remoteSession.user.id);
        if (!account?.active) {
          await supabase.auth.signOut();
          setScreen("auth");
          setAuthError("This account is inactive.");
          return;
        }
        setSession(account);
        setProfile({ name: account.name, level: account.level, avatar: account.avatar, visited: account.visited });
        setVisited(new Set(account.visited));
        setScreen("home");
      } catch (error) {
        if (alive) setAuthError(error?.message || "Unable to load your account.");
      }
    });
    return () => {
      alive = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabaseConfigured || !session?.id) return;
    saveProfile(session.id, profile).catch(error => setAuthError(error?.message || "Profile save failed."));
  }, [profile.name, profile.level, profile.avatar, session?.id]);

  useEffect(() => {
    if (!supabaseConfigured || !session?.id) return;
    saveProgress(session.id, profile.level, visited).catch(error => setAuthError(error?.message || "Progress save failed."));
  }, [visited, profile.level, session?.id]);

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
  const isAdmin = session?.role === "admin";
  const canAccess = target => isAdmin || Boolean(session?.access?.includes(target));
  const goTo = target => {
    if (!session) return setScreen("auth");
    if (!canAccess(target)) return;
    setScreen(target);
  };
  const logout = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (supabaseConfigured) {
      signOut().catch(() => {});
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    setSession(null);
    setProfile(defaultProfile);
    setVisited(new Set());
    setScreen("auth");
  };
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

  if (authLoading) {
    return <Box sx={{ ...pageSx, minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Typography fontWeight={900}>Loading Alphabet Flipper…</Typography>
    </Box>;
  }

  if (screen === "auth") {
    return <AuthScreen
      users={users}
      setUsers={setUsers}
      onLogin={(u) => {
        const safe = {
          id: u.id,
          username: u.username,
          role: u.role,
          active: u.active !== false,
          access: u.access || ["home"]
        };
        if (!supabaseConfigured) localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
        setSession(safe);
        setProfile({ name: u.name || "Little Learner", level: u.level || "LKG", avatar: u.avatar || "🦊", visited: u.visited || [] });
        setVisited(new Set(u.visited || []));
        setScreen("home");
      }}
    />;
  }

  if (screen === "admin") {
    return <AdminScreen users={users} setUsers={setUsers} onBack={() => setScreen("home")} />;
  }

  if (screen === "home") {
    return (
      <Box sx={pageSx}>
        <Header onSettings={() => setSettingsOpen(true)} onAdmin={isAdmin ? () => setScreen("admin") : undefined} onLogout={logout} />
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

  if (screen === "games") return <Games onBack={() => goTo("home")} onStart={start} />;
  if (screen === "worksheets") return <Worksheets onBack={() => goTo("home")} />;
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



function AuthScreen({ users, setUsers, onLogin }) {
  const [mode, setMode] = useState(supabaseConfigured ? "login" : (users.some(u => u.role === "admin") ? "login" : "setup"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    const u = email.trim().toLowerCase();
    if (!u || !u.includes("@") || password.length < 4) return setError("Email और password सही भरें.");

    if (supabaseConfigured) {
      try {
        const account = await signIn(u, password);
        if (!account?.active) return setError("Account inactive है.");
        onLogin(account);
      } catch (e) {
        setError(e?.message || "Login failed.");
      }
      return;
    }

    if (mode === "setup") {
      if (users.some(x => x.role === "admin")) return setMode("login");
      const admin = {
        id: "admin-" + Date.now(), username: u.split("@")[0], email: u, password,
        name: name.trim() || "Administrator", level: "Class 1", avatar: "🦁",
        role: "admin", active: true, access: ACCESS_OPTIONS.map(x => x.key), visited: []
      };
      const next = [admin, ...users]; setUsers(next); saveUsers(next); onLogin(admin); return;
    }

    const found = users.find(x => (x.email || x.username).toLowerCase() === u && x.password === password);
    if (!found || !found.active) return setError("Login failed या account inactive है.");
    onLogin(found);
  };

  return <Box sx={{ ...pageSx, minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
    <Paper sx={{ width: "100%", maxWidth: 430, p: { xs: 2.5, sm: 4 }, borderRadius: 4, boxShadow: "0 24px 70px rgba(45,48,90,.12)" }}>
      <Stack spacing={2}>
        <Box sx={{ textAlign: "center" }}>
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}logo.svg`} alt="Alphabet Flipper" />
          <Typography variant="h4" fontWeight={1000} sx={{ mt: 1 }}>Alphabet Flipper</Typography>
          <Typography color="text.secondary" fontWeight={700}>{mode === "setup" ? "First-time admin setup" : "Sign in to continue"}</Typography>
        </Box>
        {!supabaseConfigured && mode === "setup" && <TextField label="Admin name" value={name} onChange={e => setName(e.target.value)} fullWidth />}
        <TextField label={mode === "setup" ? "Admin email" : "Email"} value={email} onChange={e => setEmail(e.target.value)} fullWidth type="email" autoComplete="email" />
        <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth autoComplete={mode === "setup" ? "new-password" : "current-password"} />
        {error && <Typography color="error" fontWeight={800}>{error}</Typography>}
        <Button variant="contained" size="large" onClick={submit} sx={{ py: 1.5, borderRadius: 3, fontWeight: 950 }}>
          {mode === "setup" ? "Create Admin & Continue" : "Login"}
        </Button>
        <Typography variant="caption" color="text.secondary">
          {supabaseConfigured
            ? "Secure sign-in is handled by Supabase Auth. User accounts are created only from the admin panel."
            : "Prototype auth is browser-local. Add Supabase configuration to enable secure Auth + database storage."}
        </Typography>
      </Stack>
    </Paper>
  </Box>;
}

function AdminScreen({ users, setUsers, onBack }) {
  const [draft, setDraft] = useState({ email: "", username: "", password: "", name: "", level: "LKG", access: ["home","learn","games","worksheets","progress"] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    let alive = true;
    listUsers()
      .then(rows => { if (alive) setUsers(rows); })
      .catch(e => { if (alive) setError(e?.message || "Unable to load users."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [setUsers]);

  const addUser = async () => {
    const email = draft.email.trim().toLowerCase();
    const username = draft.username.trim().toLowerCase();
    if (!email || !email.includes("@") || !username || draft.password.length < 8) return setError("Email, username और password सही भरें.");

    try {
      if (supabaseConfigured) {
        await adminUserAction("create", {
          email, username, password: draft.password, name: draft.name.trim() || "Little Learner",
          level: draft.level, access: draft.access
        });
        setUsers(await listUsers());
      } else {
        if (users.some(u => u.username.toLowerCase() === username)) return setError("Username already exists.");
        const user = {
          id: "user-" + Date.now(), username, email, password: draft.password,
          name: draft.name.trim() || "Little Learner", level: draft.level, avatar: "🦊",
          role: "user", active: true, access: [...draft.access], visited: []
        };
        const next = [...users, user]; setUsers(next); saveUsers(next);
      }
      setDraft({ email: "", username: "", password: "", name: "", level: "LKG", access: ["home","learn","games","worksheets","progress"] });
      setError("");
    } catch (e) {
      setError(e?.message || "Unable to create user.");
    }
  };

  const updateUser = async (id, patch) => {
    try {
      if (supabaseConfigured) {
        await adminUserAction("update", { id, ...patch });
        setUsers(await listUsers());
      } else {
        const next = users.map(u => u.id === id ? { ...u, ...patch } : u);
        setUsers(next); saveUsers(next);
      }
    } catch (e) {
      setError(e?.message || "Unable to update user.");
    }
  };

  const removeUser = async id => {
    const target = users.find(u => u.id === id);
    if (!target || target.role === "admin") return;
    try {
      if (supabaseConfigured) {
        await adminUserAction("delete", { id });
        setUsers(await listUsers());
      } else {
        const next = users.filter(u => u.id !== id); setUsers(next); saveUsers(next);
      }
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
          <TextField size="small" label="Email" type="email" value={draft.email} onChange={e => setDraft(x => ({ ...x, email: e.target.value }))} />
          <TextField size="small" label="Name" value={draft.name} onChange={e => setDraft(x => ({ ...x, name: e.target.value }))} />
          <TextField size="small" label="Username" value={draft.username} onChange={e => setDraft(x => ({ ...x, username: e.target.value }))} />
          <TextField size="small" label="Password" type="password" value={draft.password} onChange={e => setDraft(x => ({ ...x, password: e.target.value }))} />
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
        <Button variant="contained" onClick={addUser} disabled={loading} sx={{ mt: 1.5, borderRadius: 2.5, fontWeight: 950 }}>
          {loading ? "Loading…" : "Add User"}
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
                  {emoji}
                </Button>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={close} variant="outlined" sx={{ borderRadius: 3, fontWeight: 900 }}>Cancel</Button>
        <Button onClick={save} variant="contained" sx={{ borderRadius: 3, fontWeight: 900 }}>Save Profile</Button>
      </DialogActions>
    </Dialog>
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
      <Typography color="text.secondary" sx={{ mb: 3 }}>Choose a game to learn, play and earn stars.</Typography>
      <Paper sx={{ p: 2.2, mb: 3, borderRadius: 4, bgcolor: "#fff", border: "1px solid #ececf5" }}>
        <Typography fontWeight={950}>🎯 Game Zone</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
          Each game has its own activity. Alphabet Flipper is ready to play now; new games will be added here separately.
        </Typography>
      </Paper>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)" }, gap: 2 }}>
        <GameCard emoji="🔤" title="Alphabet Flipper" subtitle="Flip letters, discover words and hear sounds." color="#e9e7ff" live onClick={onStart} />
        <GameCard emoji="🧩" title="Letter Builder" subtitle="Build simple words with letter tiles." color="#e5f3ff" />
        <GameCard emoji="🎯" title="Find the Letter" subtitle="Spot the letter hiding in the crowd." color="#e2f8ec" />
        <GameCard emoji="🧠" title="Memory Match" subtitle="Match capital and small letters." color="#fff0d9" />
      </Box>
    </Container>
  </Box>;
}

function GameCard({ emoji, title, subtitle, color, onClick, live }) {
  const available = Boolean(onClick);
  return <Paper className="game-card" onClick={available ? onClick : undefined}
    sx={{ bgcolor: color, opacity: available ? 1 : .78, cursor: available ? "pointer" : "default" }}>
    {live && <Chip label="PLAY NOW" size="small" color="secondary" sx={{ position: "absolute", top: 14, right: 14, fontWeight: 1000 }} />}
    <Box className="game-emoji">{emoji}</Box>
    <Typography fontWeight={1000} fontSize={21}>{title}</Typography>
    <Typography color="text.secondary" fontWeight={700}>{subtitle}</Typography>
    <Button variant="contained" endIcon={<ArrowForwardIcon />} disabled={!available}
      sx={{ mt: 2, borderRadius: 3, fontWeight: 950 }}
      onClick={available ? (e => { e.stopPropagation(); onClick(); }) : undefined}>
      {live ? "Start" : "Coming Soon"}
    </Button>
  </Paper>;
}

function Worksheets({ onBack }) {
  return <Box sx={pageSx}><Header back={onBack} onSettings={() => {}} /><Container maxWidth="md" sx={{ py: 5 }}>
    <Chip icon={<AssignmentIcon />} label="PRACTICE ZONE" sx={{ fontWeight: 950 }} />
    <Typography variant="h3" fontWeight={1000} sx={{ mt: 1 }}>📝 Worksheets</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Choose a practice activity. Worksheets stay separate from Games and Learning.</Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)" }, gap: 2 }}>
      <Paper className="game-card" sx={{ bgcolor: "#fff0d9" }}>
        <Box className="game-emoji">✏️</Box>
        <Typography fontWeight={1000} fontSize={21}>Alphabet Practice</Typography>
        <Typography color="text.secondary" fontWeight={700}>Practice letters and simple words.</Typography>
        <Button variant="contained" sx={{ mt: 2, borderRadius: 3, fontWeight: 950 }} onClick={() => window.print()}>
          Print Practice Sheet
        </Button>
      </Paper>
      <Paper className="game-card" sx={{ bgcolor: "#e5f3ff" }}>
        <Box className="game-emoji">🔤</Box>
        <Typography fontWeight={1000} fontSize={21}>Capital & Small</Typography>
        <Typography color="text.secondary" fontWeight={700}>Practice matching uppercase and lowercase letters.</Typography>
        <Button variant="outlined" disabled sx={{ mt: 2, borderRadius: 3, fontWeight: 950 }}>Coming Soon</Button>
      </Paper>
    </Box>
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

function Header({ back, onSettings, onAdmin, onLogout }) {
  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: "blur(14px)", zIndex: 5 }}>
      <Toolbar sx={{ maxWidth: 900, width: "100%", mx: "auto" }}>
        {back && <IconButton onClick={back} aria-label="Back"><ArrowBackIcon /></IconButton>}
        <Box className="brand" sx={{ flex: 1 }}>
  <img className="brand-logo" src={`${import.meta.env.BASE_URL}logo.svg`} alt="Alphabet Flipper" />
  <Typography fontWeight={950} className="brand-name">Alphabet Flipper</Typography>
</Box>
        <Stack direction="row" spacing={.5}>
          {onAdmin && <Button size="small" variant="outlined" onClick={onAdmin} sx={{ fontWeight: 900 }}>Admin</Button>}
          {onLogout && <Button size="small" variant="text" onClick={onLogout} sx={{ fontWeight: 900 }}>Logout</Button>}
          <IconButton onClick={onSettings} aria-label="Settings"><SettingsIcon /></IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

function Sound({ label, fn, disabled = false }) {
  return (
    <Button fullWidth variant="outlined" startIcon={<VolumeUpIcon />}
      disabled={disabled}
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
