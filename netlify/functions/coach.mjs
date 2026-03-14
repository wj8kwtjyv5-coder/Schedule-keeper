const cors=()=>({"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"});
export async function handler(event){
  if(event.httpMethod==="OPTIONS")return{statusCode:204,headers:cors(),body:""};
  if(event.httpMethod!=="POST")return{statusCode:405,headers:cors(),body:JSON.stringify({reply:"Method not allowed",actions:[]})};
  const apiKey=process.env.ANTHROPIC_API_KEY;
  if(!apiKey)return{statusCode:200,headers:cors(),body:JSON.stringify({reply:"Add ANTHROPIC_API_KEY in Netlify environment variables then redeploy.",actions:[]})};
  let payload;
  try{payload=JSON.parse(event.body||"{}");}
  catch{return{statusCode:200,headers:cors(),body:JSON.stringify({reply:"Invalid request.",actions:[]})};}
  const msg=payload.message||"";
  const ctx=payload.context||{};
  try{
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({
        model:"claude-haiku-4-5-20251001",
        max_tokens:800,
        system:"You are Coach, a performance coach for a football player. Respond ONLY with valid JSON: {\"reply\":\"your message\",\"actions\":[]}. Actions can be: {\"type\":\"addTask\",\"task\":{\"title\":\"...\",\"date\":\"YYYY-MM-DD\",\"time\":\"HH:MM\",\"category\":\"run|football|game|bike|pilates|recovery|sauna|other\",\"notes\":\"...\"}} or {\"type\":\"deleteTask\",\"taskId\":\"...\"} or {\"type\":\"completeTask\",\"taskId\":\"...\"}. If match cancelled: delete the game task and add quality training. If game scheduled: add match task and recovery day after. Be warm and concise.",
        messages:[{role:"user",content:JSON.stringify({message:msg,context:ctx})}]
      })
    });
    const data=await res.json();
    const raw=data?.content?.[0]?.text||"";
    let out;
    try{out=JSON.parse(raw.replace(/```json|```/g,"").trim());}
    catch{out={reply:raw||"Got it!",actions:[]};}
    return{statusCode:200,headers:cors(),body:JSON.stringify({reply:String(out.reply||""),actions:Array.isArray(out.actions)?out.actions:[]})};
  }catch(e){
    return{statusCode:200,headers:cors(),body:JSON.stringify({reply:"Coach hit an error: "+String(e.message||e),actions:[]})};
  }
}
