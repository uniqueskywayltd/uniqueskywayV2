/** Blocking theme init — prevents FOUC; storage key matches ThemeProvider (`usw_theme`). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("usw_theme");if(t==="dark"){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`;
