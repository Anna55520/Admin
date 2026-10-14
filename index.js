/* =====================================================
   U9 ADMIN

   File:
   index.js

   Functions:
   1. Switch admin pages
   2. Update active navigation button
   3. Open PAGE1 by default
   4. Check admin session through admin-me
   5. Expose admin authentication state

   Security:
   - Uses public anon key only
   - Never uses service-role key
===================================================== */


(function(){

"use strict";



const SUPABASE_URL =
"https://tvtakmswbzawaweytimx.supabase.co";



const ADMIN_ME_URL =
`${SUPABASE_URL}/functions/v1/admin-me`;



let adminSessionCheckPromise = null;







/* ===============================
   GET PUBLIC KEY
================================ */


function getPublicKey(){


    const client =
        window.supabaseClient;



    const key =

        window.U9_SUPABASE_PUBLIC_KEY ||

        window.SUPABASE_ANON_KEY ||

        window.SUPABASE_PUBLISHABLE_KEY ||

        (client && client.supabaseKey) ||

        "";



    return typeof key === "string"
        ? key.trim()
        : "";


}







/* ===============================
   CHECK ADMIN SESSION
================================ */


async function checkAdminSession(){


    if(adminSessionCheckPromise){

        return adminSessionCheckPromise;

    }



    adminSessionCheckPromise =
    (async function(){


        try{


            const publicKey =
                getPublicKey();




            if(!publicKey){


                console.error(
                    "[U9 Admin] Supabase public key is missing."
                );


                return {

                    authenticated:false,

                    admin:null

                };


            }





            const response =
            await fetch(
                ADMIN_ME_URL,
                {

                    method:"GET",

                    credentials:"include",

                    cache:"no-store",

                    headers:{

                        "apikey":
                            publicKey,

                        "Authorization":
                            `Bearer ${publicKey}`

                    }

                }
            );






            if(response.status===401){


                return {

                    authenticated:false,

                    admin:null

                };


            }






            const result =
            await response.json()
            .catch(
                function(){

                    return {};

                }
            );







            if(
                !response.ok ||
                result.authenticated !== true ||
                !result.admin
            ){


                console.warn(
                    "[U9 Admin] admin-me did not confirm session.",
                    response.status
                );



                return {

                    authenticated:false,

                    admin:null

                };


            }






            return {


                authenticated:true,

                admin:
                    result.admin


            };





        }
        catch(error){



            console.error(
                "[U9 Admin] Session check failed:",
                error
            );



            return {

                authenticated:false,

                admin:null

            };



        }
        finally{


            adminSessionCheckPromise=null;


        }



    })();



    return adminSessionCheckPromise;


}








window.U9AdminCheckSession =
    checkAdminSession;







/* ===============================
   AUTH STATE
================================ */


window.U9AdminAuth = {


    authenticated:false,


    admin:null


};






async function refreshAdminAuthState(){


    const result =
        await checkAdminSession();




    window.U9AdminAuth.authenticated =
        result.authenticated;



    window.U9AdminAuth.admin =
        result.admin;






    window.dispatchEvent(

        new CustomEvent(
            "u9-admin-auth-changed",
            {

                detail:result

            }

        )

    );




    return result;


}




window.U9AdminRefreshAuthState =
    refreshAdminAuthState;









/* ===============================
   PAGE NAVIGATION
================================ */


function initAdminNavigation(){


    const nav =
        document.getElementById(
            "U9-admin-bottom-nav"
        );



    const main =
        document.getElementById(
            "U9-admin-main"
        );




    if(!nav || !main){


        console.error(
            "[U9 Admin] Navigation missing."
        );


        return;


    }






    const buttons =
        Array.from(
            nav.querySelectorAll(
                "button[data-target]"
            )
        );




    const pages =
        Array.from(
            main.querySelectorAll(
                ".U9-admin-page"
            )
        );







    function switchPage(pageId){


        const target =
            document.getElementById(
                pageId
            );



        if(
            !target ||
            !main.contains(target)
        ){


            console.warn(
                "[U9 Admin] Page not found:",
                pageId
            );


            return;


        }







        pages.forEach(
            function(page){


                const active =
                    page===target;



                page.classList.toggle(
                    "active",
                    active
                );



                page.hidden =
                    !active;


            }
        );







        buttons.forEach(
            function(button){


                const active =
                    button.dataset.target === pageId;



                button.classList.toggle(
                    "active",
                    active
                );



                button.setAttribute(
                    "aria-pressed",
                    String(active)
                );


            }
        );



    }








    nav.addEventListener(
        "click",
        function(event){


            const button =
                event.target.closest(
                    "button[data-target]"
                );



            if(
                !button ||
                !nav.contains(button)
            ){

                return;

            }



            switchPage(
                button.dataset.target
            );



        }
    );







    switchPage(
        "U9-admin-page-1"
    );



    window.U9AdminSwitchPage =
        switchPage;



}









/* ===============================
   INITIALIZE
================================ */


async function initialize(){


    initAdminNavigation();




    function startSessionCheck(){


        refreshAdminAuthState();



    }




    if(
        window.U9_SUPABASE_PUBLIC_KEY ||
        window.supabaseClient
    ){


        startSessionCheck();



    }
    else{


        window.addEventListener(
            "U9AdminSupabaseReady",
            startSessionCheck,
            {
                once:true
            }
        );


    }






    console.log(
        "[U9 Admin] Navigation initialized."
    );



}






if(
    document.readyState==="loading"
){


    document.addEventListener(
        "DOMContentLoaded",
        initialize,
        {
            once:true
        }
    );


}
else{


    initialize();


}



})();
