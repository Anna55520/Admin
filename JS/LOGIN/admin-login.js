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


                body:
                JSON.stringify({

                    username:
                    username.trim(),

                    password

                })

            }
        );






        const result =
        await response
        .json()
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







        console.log(
            "[U9 Admin] Login success:",
            result.admin
        );







        /*
            Wait for cookie storage.

            Then refresh admin state.
        */


        await new Promise(
            function(resolve){

                setTimeout(
                    resolve,
                    300
                );

            }
        );







        if(
            window.U9AdminRefreshAuthState
        ){


            const auth =
            await window.U9AdminRefreshAuthState();



            console.log(
                "[U9 Admin] Session refresh:",
                auth
            );


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



    await fetch(
        "https://tvtakmswbzawaweytimx.supabase.co/functions/v1/admin-logout",
        {

            method:"POST",

            credentials:"include"

        }
    )
    .catch(
        function(){}
    );







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





        /*
            临时测试账号入口

            后面可以替换成弹窗输入
        */


        const username =
        prompt(
            "Admin username"
        );



        const password =
        prompt(
            "Admin password"
        );





        if(
            !username ||
            !password
        ){

            return;

        }






        const result =
        await adminLogin(
            username,
            password
        );





        if(!result.success){


            alert(
                result.error
            );


            return;

        }







        alert(
            "Login successful."
        );



        location.reload();



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
