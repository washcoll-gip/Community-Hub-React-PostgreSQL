import { createTheme } from '@mui/material/styles';
import { grey, blue, orange, red } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: blue[700],
    },
    secondary: {
      main: orange[700],
    },
    error: {
      main: red[700],
    },
    background: {
      default: grey[100],
      paper: '#fff',
    },
  },
  shape: {
    borderRadius: 0, // Hard edges
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
  },
  typography: {
    fontFamily: 'system-ui, Arial, sans-serif',
    button: {
      fontWeight: 500,
    },
  },
});

export default theme;
