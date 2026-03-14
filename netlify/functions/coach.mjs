const cors=()=>({"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"});
export async function handler(event){
  if(event.httpMethod==="OPTIONS")return{statusCode:204,headers:cors(),body:""};
  if(event.httpMethod!=="POST")return{statusCode:405,headers:cors(),body:JSON.stringify({reply:"Method not allowed",actions:[]})};
  const apiKey=process.env.ANTHROPIC_API_KEY;
  if(!apiKey)return{statusCode:200,headers:cors(),body:JSON.stringify({reply:"Add ANTHROPIC_API_KEY in Netlify environment variables.",actions:[]})};
  let payload;
  try{payload=JSON.parse(event.body||"{}");}
  catch{return{statusCode:200,headers:cors(),body:JSON.stringify({reply:"Invalid request.",actions:[]})};}
  const msg=payload.message||"";
  const ctx=payload.context||{};
  const system=`You are Coach, a sharp performance coach for a football player who trains daily. You have full access to their schedule and MUST make real changes when asked.

RESPOND ONLY WITH THIS EXACT JSON FORMAT - no other text:
{"reply":"your warm 1-3 sentence response","actions":[]}

ACTION TYPES you can use:
{"type":"addTask","task":{"title":"...","date":"YYYY-MM-DD","time":"HH:MM","category":"run|football|game|bike|pilates|recovery|sauna|other","notes":"..."}}
{"type":"updateTask","taskId":"EXACT_ID_FROM_CONTEXT","changes":{"title":"...","time":"...","notes":"..."}}
{"type":"deleteTask","taskId":"EXACT_ID_FROM_CONTEXT"}
{"type":"completeTask","taskId":"EXACT_ID_FROM_CONTEXT"}

RULES:
- Always include at least one action for schedule-related requests
- Use exact task IDs from the context upcomingTasks array
- Today is ${new Date().toISOString().slice(0,10)}
- Tomorrow is ${new Date(Date.now()+86400000).toISOString().slice(0,10)}

SCENARIOS:
- "match cancelled" or "game cancelled": find and deleteTask the game, addTask quality training session instead (run+sprints or football fitness)
- "game tomorrow/today at [time]": addTask the match with category "game", addTask recovery day after, update day-before sessions to be lighter
- "tired/sore/heavy legs": addTask easy recovery session, suggest reducing tomorrow's load
- "not playing [game]" or "change of plans": addTask alternative quality training to replace the missed session
- General question: give advice and suggest concrete actions`;

  try{
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:1000,system,messages:[{role:"user",content:JSON.stringify({message:msg,context:ctx})}]})
    });
    const data=await res.json();
    const raw=data?.content?.[0]?.text||"";
    let out;
    try{out=JSON.parse(raw.replace(/```json|```/g,"").trim());}
    catch{out={reply:raw||"Something went wrong.",actions:[]};}
    return{statusCode:200,headers:cors(),body:JSON.stringify({reply:String(out.reply||""),actions:Array.isArray(out.actions)?out.actions:[]})};
  }catch(e){
    return{statusCode:200,headers:cors(),body:JSON.stringify({reply:"Coach error: "+String(e.message||e),actions:[]})};
  }
}
