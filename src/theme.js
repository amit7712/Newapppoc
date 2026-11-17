import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#6C63FF" },
    secondary: { main: "#FF6CA8" },
    background: { default: "#f7f8fc", paper: "#ffffff" }
  },
  shape: { borderRadius: 16 },
  typography: { fontFamily: '"Nunito", "Inter", system-ui, sans-serif' },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: "none" } } }
  }
});
