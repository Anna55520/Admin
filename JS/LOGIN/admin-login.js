/* =====================================================
   U9 ADMIN LOGIN

   File:
   JS/LOGIN/admin-login.js

   Functions:
   - Admin login
   - Logout
   - Session refresh

===================================================== */


(function(){

"use strict";



const ADMIN_LOGIN_URL =
    "https://tvtakmswbzawaweytimx.supabase.co/functions/v1/admin-login";




const elements = {};





/* ===============================
   ELEMENTS
================================ */


function getElements(){


    elements.button =
        document.getElementById(
            "U9-admin-login-button"
        );


}






/* ===============================
   LOGIN REQUEST
================================ */


async function adminLogin(
    username,
    password
){


    try{


        const response =
            await fetch(
                ADMIN_LOGIN_URL,
                {

                    method:"POST",

                    credentials:"include",

                    headers:{

                        "Content-Type":
                            "application/json"

                    },


                    body:JSON.stringify({

                        username,
                        password

                    })

                }
            );




        const result =
            await response.json()
                .catch(
                    ()=>({})
                );





        if(!response.ok){


            throw new Error(
                result.error ||
                "Login failed."
            );


        }




        /*
            Cookie is created by server.

            Now verify session.
        */


        if(
            window.U9AdminRefreshAuthState
        ){


            await window.U9AdminRefreshAuthState();


        }




        return {


            success:true,

            admin:
                result.admin


        };



    }
    catch(error){


        console.error(
            "[U9 Admin Login]",
            error
        );


        return {


            success:false,

            error:
                error.message


        };


    }



}








/* ===============================
   CHECK SESSION
================================ */


async function checkAdminSession(){


    try{


        if(
            window.U9AdminCheckSession
        ){


            return await
                window.U9AdminCheckSession();



        }



        return {


            authenticated:false,

            admin:null


        };



    }
    catch(error){


        console.error(
            "[U9 Admin Session Check]",
            error
        );


        return {


            authenticated:false,

            admin:null


        };


    }



}







/* ===============================
   LOGOUT
================================ */


async function adminLogout(){


    document.cookie =
        "admin_session=; Path=/; Max-Age=0";



    if(
        window.U9AdminRefreshAuthState
    ){


        await window.U9AdminRefreshAuthState();


    }



}







/* ===============================
   BUTTON
================================ */


function initLoginButton(){


    if(!elements.button){

        return;

    }



    elements.button.onclick =
        async function(){



            console.log(
                "[U9 Admin] Login button clicked."
            );



        };



}







/* ===============================
   GLOBAL
================================ */


window.U9AdminLogin =
    adminLogin;


window.U9AdminLogout =
    adminLogout;


window.U9AdminCheckSession =
    checkAdminSession;







/* ===============================
   INIT
================================ */


function initialize(){


    getElements();


    initLoginButton();



    console.log(
        "[U9 Admin Login] Initialized."
    );


}




if(
    document.readyState === "loading"
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
