/* =====================================================
   U9 ADMIN

   File:
   JS/PAGE-1/page-1.js

   PAGE1:
   User Management

   No Pagination

===================================================== */


(function(){

"use strict";


const API_URL =
"https://tvtakmswbzawaweytimx.supabase.co/functions/v1/admin-users-list";


const elements={};



/* ==============================
   ELEMENTS
============================== */

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




/* ==============================
   MESSAGE
============================== */


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





/* ==============================
   FORMAT
============================== */


function formatAmount(value){

    const num =
        Number(value ?? 0);


    if(!Number.isFinite(num))
        return "0.00";


    return num.toLocaleString(
        "en-US",
        {
            minimumFractionDigits:2,
            maximumFractionDigits:2
        }
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


    return `${String(
        date.getMonth()+1
    ).padStart(2,"0")}/${String(
        date.getDate()
    ).padStart(2,"0")}/${date.getFullYear()}`;

}





/* ==============================
   TABLE
============================== */


function createCell(value){

    const td =
        document.createElement(
            "td"
        );


    td.textContent =
        value ??
        "—";


    return td;

}




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


    td.colSpan=6;

    td.textContent=text;


    tr.appendChild(td);

    elements.tbody.appendChild(tr);

}





function renderUsers(users){


    elements.tbody.replaceChildren();



    if(
        !users ||
        users.length===0
    ){

        renderMessage(
            "暂无用户数据"
        );

        return;
    }




    const fragment =
        document.createDocumentFragment();



    users.forEach(
        user=>{


            const tr =
                document.createElement(
                    "tr"
                );


            tr.appendChild(
                createCell(
                    user.username
                )
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


            fragment.appendChild(tr);

        }
    );



    elements.tbody.appendChild(
        fragment
    );


}







/* ==============================
   LOAD USERS
============================== */


async function loadUsers(){


    renderMessage(
        "正在加载用户数据..."
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
                "加载失败"
            );

        }



        renderUsers(
            result.users || []
        );



        setMessage(
            "用户数据加载完成。"
        );



    }
    catch(error){


        console.error(
            "[U9 Admin PAGE1]",
            error
        );


        renderMessage(
            "加载失败"
        );


        setMessage(
            error.message,
            true
        );

    }



}








/* ==============================
   INIT
============================== */


function init(){


    getElements();



    if(
        !elements.tbody ||
        !elements.refresh
    ){

        console.error(
            "PAGE1 HTML missing"
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
    document.readyState==="loading"
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
