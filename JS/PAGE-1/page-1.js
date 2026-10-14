/* =====================================================
   U9 ADMIN

   File:
   JS/PAGE-1/page-1.js

   PAGE1:
   User Management

   Functions:
   - Load users
   - Render user table
   - Open edit modal

   No Pagination

===================================================== */


(function(){

"use strict";



const API_URL =
"https://tvtakmswbzawaweytimx.supabase.co/functions/v1/admin-users-list";



const elements = {};






/* ===============================
   ELEMENTS
================================ */


function getElements(){


    elements.tbody =
        document.getElementById(
            "U9-admin-users-tbody"
        );



    elements.message =
        document.getElementById(
            "U9-admin-users-message"
        );



    elements.refresh =
        document.getElementById(
            "U9-admin-users-refresh"
        );


}








/* ===============================
   MESSAGE
================================ */


function setMessage(
    text,
    error=false
){


    if(!elements.message)
        return;



    elements.message.textContent =
        text || "";



    elements.message.classList.toggle(
        "error",
        error
    );


}









/* ===============================
   FORMAT
================================ */


function formatAmount(value){


    const number =
        Number(value ?? 0);



    if(!Number.isFinite(number))
        return "0.00";



    return number.toLocaleString(
        "en-US",
        {
            minimumFractionDigits:2,
            maximumFractionDigits:2
        }
    );


}






function formatUsername(value){


    if(!value)
        return "—";



    const text =
        String(value);



    if(text.length <= 8)
        return text;



    return (
        text.slice(0,4)
        +
        "..."
        +
        text.slice(-4)
    );


}






function formatDate(value){


    if(!value)
        return "—";



    const date =
        new Date(value);



    if(
        Number.isNaN(
            date.getTime()
        )
    )
        return "—";



    return (
        String(
            date.getMonth()+1
        ).padStart(2,"0")
        +
        "/"
        +
        String(
            date.getDate()
        ).padStart(2,"0")
        +
        "/"
        +
        date.getFullYear()
    );


}









/* ===============================
   TABLE CELL
================================ */


function createCell(value){


    const td =
        document.createElement(
            "td"
        );



    td.textContent =
        value ?? "—";



    return td;


}









/* ===============================
   ACTION BUTTON
================================ */


function createActionCell(user){


    const td =
        document.createElement(
            "td"
        );



    td.className =
        "action-column";




    const button =
        document.createElement(
            "button"
        );



    button.type =
        "button";



    button.className =
        "U9-admin-edit-button";





    const img =
        document.createElement(
            "img"
        );



    img.src =
        "SVG/BUTTON/one.svg";



    img.alt =
        "Edit";





    button.appendChild(
        img
    );






    button.onclick =
        function(){


            if(
                typeof window.openEditModal ===
                "function"
            ){


                window.openEditModal(
                    user
                );


            }
            else{


                console.error(
                    "[U9 Admin] Edit modal JS not loaded."
                );


            }


        };






    td.appendChild(
        button
    );



    return td;


}









/* ===============================
   RENDER MESSAGE
================================ */


function renderMessage(text){


    elements.tbody.replaceChildren();



    const tr =
        document.createElement(
            "tr"
        );



    const td =
        document.createElement(
            "td"
        );



    td.colSpan =
        7;



    td.textContent =
        text;



    tr.appendChild(
        td
    );



    elements.tbody.appendChild(
        tr
    );


}









/* ===============================
   RENDER USERS
================================ */


function renderUsers(users){


    elements.tbody.replaceChildren();




    if(
        !users ||
        users.length===0
    ){


        renderMessage(
            "No user data available"
        );


        return;


    }






    const fragment =
        document.createDocumentFragment();






    users.forEach(
        function(user){



            const tr =
                document.createElement(
                    "tr"
                );





            const username =
                createCell(
                    formatUsername(
                        user.username
                    )
                );


            username.className =
                "username-column";



            tr.appendChild(
                username
            );






            tr.appendChild(
                createCell(
                    user.account
                )
            );






            tr.appendChild(
                createCell(
                    formatAmount(
                        user.coins
                    )
                )
            );






            tr.appendChild(
                createCell(
                    formatAmount(
                        user.balance
                    )
                )
            );






            tr.appendChild(
                createCell(
                    formatDate(
                        user.created_at
                    )
                )
            );






            tr.appendChild(
                createCell(
                    user.order_count ?? 0
                )
            );






            tr.appendChild(
                createActionCell(
                    user
                )
            );






            fragment.appendChild(
                tr
            );



        }
    );






    elements.tbody.appendChild(
        fragment
    );


}









/* ===============================
   LOAD USERS
================================ */


async function loadUsers(){


    renderMessage(
        "Loading user data..."
    );




    try{


        const response =
            await fetch(
                API_URL,
                {
                    method:"GET",

                    credentials:"include",

                    headers:{
                        "Content-Type":
                        "application/json"
                    }

                }
            );






        const result =
            await response.json();






        if(!response.ok){


            throw new Error(
                result.message ||
                "Load failed"
            );


        }







        renderUsers(
            result.users || []
        );





        setMessage(
            "User data loaded."
        );



    }
    catch(error){


        console.error(
            "[U9 Admin PAGE1]",
            error
        );



        renderMessage(
            "Load failed"
        );



        setMessage(
            error.message,
            true
        );


    }


}









/* ===============================
   INIT
================================ */


function init(){


    getElements();




    if(
        !elements.tbody ||
        !elements.refresh
    ){


        console.error(
            "[U9 Admin PAGE1] HTML missing."
        );


        return;


    }







    elements.refresh.onclick =
        function(){


            loadUsers();


        };






    loadUsers();


}









if(
    document.readyState === "loading"
){


    document.addEventListener(
        "DOMContentLoaded",
        init,
        {
            once:true
        }
    );


}
else{


    init();


}



})();
