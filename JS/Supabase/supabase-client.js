/* =========================================================
   U9 ADMIN SUPABASE CLIENT
========================================================= */

(function(){

"use strict";


const SUPABASE_URL =
"https://tvtakmswbzawaweytimx.supabase.co";


const SUPABASE_ANON_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dGFrbXN3Ynphd2F3ZXl0aW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NTIzNTYsImV4cCI6MjEwNTUyODM1Nn0.Q8iMQyAW2maDcH5uDKIFBZ1ZDdNWX5mFOK01zx9N9fI";



window.U9_SUPABASE_PUBLIC_KEY =
SUPABASE_ANON_KEY;



if(window.supabaseClient){

console.log(
"U9 Admin: Supabase client already initialized."
);

return;

}




const script =
document.createElement(
"script"
);


script.src =
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";


script.onload =
function(){



if(
!window.supabase ||
typeof window.supabase.createClient !== "function"
){

console.error(
"U9 Admin: Supabase library missing."
);

return;

}




window.supabaseClient =
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
);



console.log(
"U9 Admin: Supabase client initialized."
);



window.dispatchEvent(
new Event(
"U9AdminSupabaseReady"
)
);



};



script.onerror =
function(){

console.error(
"U9 Admin: Failed loading supabase."
);

};



document.head.appendChild(script);



})();
