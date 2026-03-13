export async function askAI(message){

 const response = await fetch(
  "https://api.openai.com/v1/chat/completions",
  {

   method:"POST",

   headers:{
    "Content-Type":"application/json",
    "Authorization":"Bearer " + import.meta.env.VITE_OPENAI_KEY
   },

   body:JSON.stringify({

    model:"gpt-4o-mini",

    messages:[
     {
      role:"system",
      content:"You are a calm mentor that helps people build discipline and clarity."
     },
     {
      role:"user",
      content:message
     }
    ]

   })

  }
 )

 const data = await response.json()

 return data.choices[0].message.content

}