/* =====================================================
   U9 ADMIN LOGIN

   File:
   JS/LOGIN/admin-login.js

   Functions:
   - Admin login
   - Logout
   - Login button handler

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


    elements.username =
        document.getElementById(
            "U9-admin-login-username"
        );


    elements.password =
        document.getElementById(
            "U9-admin-login-password"
        );


    elements.message =
        document.getElementById(
            "U9-admin-login-message"
        );


}









/* ===============================
   MESSAGE
================================ */


function showMessage(
    message,
    type = ""
){


    if(!elements.message){

        return;

    }



    elements.message.textContent =
        message;



    elements.message.className =
        type;


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
                function(){

                    return {};

                }
            );







        if(!response.ok){


            throw new Error(
                result.error ||
                "Login failed."
            );


        }






        /*
            Server creates:
            HttpOnly admin_session cookie

            Verify session after login
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
   LOGOUT
================================ */


async function adminLogout(){



    /*
        HttpOnly cookie cannot
        be removed by JS.

        Server logout function should
        clear it later.

        Here only refresh state.
    */



    if(
        window.U9AdminRefreshAuthState
    ){


        await window.U9AdminRefreshAuthState();


    }



}









/* ===============================
   LOGIN BUTTON
================================ */


function initLoginButton(){



    if(!elements.button){


        console.warn(
            "[U9 Admin] Login button missing."
        );


        return;

    }







    elements.button.onclick =
    async function(){



        console.log(
            "[U9 Admin] Login button clicked."
        );





        const username =
            elements.username
            ? elements.username.value.trim()
            : "";



        const password =
            elements.password
            ? elements.password.value
            : "";







        if(
            !username ||
            !password
        ){


            showMessage(
                "Please enter username and password.",
                "error"
            );


            return;

        }







        elements.button.disabled =
            true;



        showMessage(
            "Logging in..."
        );








        const result =
            await adminLogin(
                username,
                password
            );








        elements.button.disabled =
            false;







        if(
            !result.success
        ){


            showMessage(
                result.error ||
                "Login failed.",
                "error"
            );


            return;

        }







        showMessage(
            "Login successful.",
            "success"
        );






        console.log(
            "[U9 Admin] Login success:",
            result.admin
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
