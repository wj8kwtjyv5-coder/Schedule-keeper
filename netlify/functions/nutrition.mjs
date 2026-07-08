const cors=()=>({"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"});
export async function handler(event){
  if(event.httpMethod==="OPTIONS")return{statusCode:204,headers:cors(),body:""};
  if(event.httpMethod!=="POST")return{statusCode:405,headers:cors(),body:JSON.stringify({error:"Method not allowed"})};
  const apiKey=(process.env.ANTHROPICAPIKEY||process.env.ANTHROPIC_API_KEY||"").replace(/\s+/g,"");
  if(!apiKey)return{statusCode:200,headers:cors(),body:JSON.stringify({error:"no_key"})};
  let payload;
  try{payload=JSON.parse(event.body||"{}");}
  catch{return{statusCode:200,headers:cors(),body:JSON.stringify({error:"invalid_request"})};}
  const{foodText,imageBase64,mimeType}=payload;
  if(!foodText&&!imageBase64)return{statusCode:200,headers:cors(),body:JSON.stringify({error:"no_input"})};
  const system=`You are a nutrition expert. Estimate macros for the meal described or shown. Return ONLY valid JSON, no other text: {"name":"short meal name","cal":500,"protein":35,"carbs":48,"fat":12}. Round to nearest integer. Assume realistic home/restaurant portions. If multiple foods, sum all totals together.`;
  const messages=imageBase64
    ?[{role:"user",content:[
        {type:"image",source:{type:"base64",media_type:mimeType||"image/jpeg",data:imageBase64}},
        {type:"text",text:"Estimate macros for this meal. Return JSON only."}
      ]}]
    :[{role:"user",content:`Estimate macros for: ${foodText}`}];
  try{
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:200,system,messages})
    });
    const data=await res.json();
    const raw=data?.content?.[0]?.text||"";
    let out;
    try{out=JSON.parse(raw.replace(/```json|```/g,"").trim());}
    catch{return{statusCode:200,headers:cors(),body:JSON.stringify({error:"parse_error"})};}
    return{statusCode:200,headers:cors(),body:JSON.stringify({
      name:String(out.name||foodText||"Meal").slice(0,80),
      cal:Math.max(0,Math.round(+out.cal||0)),
      protein:Math.max(0,Math.round(+out.protein||0)),
      carbs:Math.max(0,Math.round(+out.carbs||0)),
      fat:Math.max(0,Math.round(+out.fat||0)),
    })};
  }catch(e){
    return{statusCode:200,headers:cors(),body:JSON.stringify({error:"connection_error",message:String(e.message||e)})};
  }
}
