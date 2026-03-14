const SYSTEM=`You are Coach — a sharp adaptive performance coach. Output STRICT JSON ONLY: {"reply":"short warm reply","actions":[]} Actions: {"type":"addTask","task":{"title":"...","date":"YYYY-MM-DD","time":"HH:MM","category":"run|football|game|bike|pilates|recovery|sauna|other","notes":"..."}} {"type":"updateTask","taskId":"...","changes":{}} {"type":"deleteTask","taskId":"..."} {"type":"completeTask","taskId":"..."} If match cancelled: delete game task, add quality training. If game tomorrow: add match, taper day before, recovery day after. If tired: swap hard sessions for easy walk+mobility.`;
const cors=()=>({"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"});
export async function handler(event){
  if(event.httpMethod==="OPTIONS")return{statusCode:204,headers:cors(),body:""};
  if(event.httpMethod!=="POST")return{statusCode:405,headers:cors(),body:""};
  const apiKey=process.env.ANTHROPIC_API_KEY;
  if(!apiKey)return{statusCode:200,headers:cors(),body:JSON.stringify({reply:"Add ANTHROPIC_API_KEY in Netlify environment variables then redeploy.",actions:[]})};
  let payload;try{payload=JSON.parse(event.body||"{}");}catch{return{statusCode:400,headers:cors(),body:"{}"};};
  try{
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:SYSTEM,messages:[{role:"user",content:JSON.stringify(payload)}]})});
    const data=await res.json();
    const raw=data.content?.[0]?.text||"";
    let out;try{out=JSON.parse(raw.replace(/```json|```/g,"").trim());}catch{out={reply:raw||"Try again.",actions:[]};}
    return{statusCode:200,headers:cors(),body:JSON.stringify({reply:String(out.reply||""),actions:Array.isArray(out.actions)?out.actions:[]})};
  }catch(e){return{statusCode:200,headers:cors(),body:JSON.stringify({reply:"Coach couldn't connect. Try again.",actions:[]})};}
}
