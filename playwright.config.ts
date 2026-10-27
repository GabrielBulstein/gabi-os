import { defineConfig, devices } from '@playwright/test';
const preview=process.env.OFFICE_PREVIEW==='1';
const baseURL=`http://localhost:${preview?'4173':'5173'}/gabi-os/`;
export default defineConfig({
  testDir:'tests/browser',fullyParallel:false,workers:1,timeout:30000,
  use:{baseURL,screenshot:'only-on-failure',headless:true},
  projects:[
    {name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:960},channel:process.env.PW_CHANNEL}},
    {name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium',channel:process.env.PW_CHANNEL}},
  ],
  webServer:{command:preview?'npm run preview':'npm run dev',url:baseURL,reuseExistingServer:true},
});
