import {readFile,mkdir,writeFile,rename,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {collect} from './data.mjs';
import {validateConfig,hero,readme,mergeReadme} from './render.mjs';
export async function generate(root,{token=process.env.GITHUB_TOKEN,now=new Date(),fetcher=fetch}={}) {
 const config=validateConfig(JSON.parse(await readFile(resolve(root,'profile.config.json'),'utf8')));
 const data=await collect(config,token,now,fetcher);
 const prior=await readFile(resolve(root,'README.md'),'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;});
 const files={'assets/hero-light.svg':hero(config,data,'light'),'assets/hero-dark.svg':hero(config,data,'dark'),'README.md':mergeReadme(prior,readme(config,data))};
 // Fetch and render everything first. Stage all writes before replacing any output.
 const previous=new Map();
 for(const file of Object.keys(files)) previous.set(file,await readFile(resolve(root,file)).catch(e=>{if(e.code==='ENOENT')return null;throw e;}));
 try {
  for(const [file,content] of Object.entries(files)){await mkdir(dirname(resolve(root,file)),{recursive:true});await writeFile(resolve(root,file+'.tmp'),content);}
  for(const file of Object.keys(files)) await rename(resolve(root,file+'.tmp'),resolve(root,file));
 }catch(error){
  for(const [file,bytes] of previous) {if(bytes===null)await rm(resolve(root,file),{force:true});else await writeFile(resolve(root,file),bytes);}
  throw error;
 }finally{for(const file of Object.keys(files))await rm(resolve(root,file+'.tmp'),{force:true});}
 return data;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const data=await generate(resolve(dirname(fileURLToPath(import.meta.url)),'..'));console.log('Updated public profile for '+data.asOf);}
 catch(error){console.error('Generation failed; last successful assets retained. '+error.message);process.exitCode=1;}
}
