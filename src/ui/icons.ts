const paths:Record<string,string>={
  volume:'M11 5 6 9H3v6h3l5 4V5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14',
  plus:'M12 5v14M5 12h14',minus:'M5 12h14',reset:'M4 9V4m0 0h5M4 4l4 4a8 8 0 1 1-2 9',
  settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 7l3-3 3 2h4l3-2 3 3-2 3v4l2 3-3 3-3-2h-4l-3 2-3-3 2-3v-4Z',
  close:'m6 6 12 12M6 18 18 6',follow:'M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6M12 8v8m-4-4h8',
  arrow:'M5 12h14m-6-6 6 6-6 6',cup:'M5 6h12v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V6Zm12 2h2a3 3 0 1 1 0 6h-2M8 2v2m5-2v2',
  hand:'M7 12V7a2 2 0 0 1 4 0v4-7a2 2 0 0 1 4 0v7-4a2 2 0 0 1 4 0v8c0 4-3 7-7 7-3 0-5-1-7-4l-3-5a2 2 0 0 1 3-2l4 3',
  help:'M9 9a3 3 0 1 1 4 3v3m-1 3h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  desk:'M3 10h18v4H3zM5 14v7m14-7v7M8 3h8v7H8z',
  play:'m9 5 10 7-10 7V5Z',check:'m5 12 4 4L19 6',moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
};
export const icon=(name:string)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(paths[name]||paths.help).split('~').map(d=>`<path d="${d}"/>`).join('')}</svg>`;
