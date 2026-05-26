import { App } from './app.js';
import { StorageManager } from './storage.js';

// --- keys ---
const STORAGE_KEY = 'todoapp_lists';
const BG_STORAGE_KEY = 'todoapp_bg';

// --- icons ---
const SHEET_ICONS = [
  { icon: 'bi-list-task',         label: 'General'   },
  { icon: 'bi-briefcase-fill',    label: 'Work'      },
  { icon: 'bi-house-fill',        label: 'Home'      },
  { icon: 'bi-cart-fill',         label: 'Shopping'  },
  { icon: 'bi-book-fill',         label: 'Study'     },
  { icon: 'bi-heart-pulse-fill',  label: 'Health'    },
  { icon: 'bi-airplane-fill',     label: 'Travel'    },
  { icon: 'bi-piggy-bank-fill',   label: 'Finance'   },
  { icon: 'bi-people-fill',       label: 'Family'    },
  { icon: 'bi-star-fill',         label: 'Important' },
  { icon: 'bi-tools',             label: 'DIY'       },
  { icon: 'bi-music-note-beamed', label: 'Fun'       },
];

// --- backgrounds ---
const BACKGROUNDS = [
  { id: 'girl_and_cats_chill', label: 'Chill',      file: 'girl_and_cats_chill.gif' },
  { id: 'black_cat',           label: 'Black Cat',  file: 'black_cat.gif'           },
  { id: 'house_with_cats',     label: 'Cozy House', file: 'house_with_cats.gif'     },
  { id: 'snow',                label: 'Snow',       file: 'snow.gif'                },
];

// --- initialization ---
const storage = new StorageManager(STORAGE_KEY, BG_STORAGE_KEY);
const app = new App({ storage, icons: SHEET_ICONS, backgrounds: BACKGROUNDS });
app.init();
