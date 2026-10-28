import {defineConfig} from 'vite';
export default defineConfig(({mode})=>({
 base:'/gabi-os/',
 define:{'import.meta.env.VITE_PRIVATE_OFFICE':JSON.stringify(mode==='private'?'1':'0')},
 plugins:[{name:'private-desktop-bridge',configureServer(server){
  server.middlewares.use('/__desktop',(req,res,next)=>{
   const connection=req as unknown as {socket:{remoteAddress?:string};headers:{host?:string}};
   const ip=connection.socket.remoteAddress,host=connection.headers.host;
   if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip||'')||!['localhost:5173','127.0.0.1:5173'].includes(host||'')){
    res.statusCode=403;res.end('El chat privado solo está disponible en esta PC.');return;
   }
   next();
  });
 }}],
 build:{rollupOptions:{output:{manualChunks:{phaser:['phaser']}}},chunkSizeWarningLimit:1600},
 server:{port:5173,strictPort:true,proxy:{'/__desktop':{target:'http://127.0.0.1:8787',changeOrigin:true,rewrite:path=>path.replace(/^\/__desktop/,'')}}},
}));
