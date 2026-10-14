/* =====================================================
   U9 ADMIN

   File:
   JS/PAGE-1/page-1.js

   PAGE 1:
   User Management

   Features:
   1. Load users
   2. Refresh
   3. Format Coins / Balance
   4. Registration date
   5. Order count
   6. Loading / Empty / Error states

===================================================== */


(function () {

    "use strict";


    let loading = false;


    const API_URL =
        "https://tvtakmswbzawaweytimx.supabase.co/functions/v1/admin-users-list";


    const elements = {};



    /* =====================================================
       ELEMENTS
    ===================================================== */


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




    /* =====================================================
       MESSAGE
    ===================================================== */


    function setMessage(
        text,
        error = false
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





    /* =====================================================
       FORMAT
    ===================================================== */


    function formatAmount(value){


        const number =
            Number(value ?? 0);



        if(
            !Number.isFinite(number)
        ){

            return "0.00";

        }



        return number.toLocaleString(
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
        ){

            return "—";

        }



        const month =
            String(
                date.getMonth()+1
            )
            .padStart(2,"0");



        const day =
            String(
                date.getDate()
            )
            .padStart(2,"0");



        const year =
            date.getFullYear();



        return (
            `${month}/${day}/${year}`
        );

    }







    /* =====================================================
       TABLE
    ===================================================== */


    function createCell(value){


        const td =
            document.createElement(
                "td"
            );


        td.textContent =
            (
                value === null ||
                value === undefined ||
                value === ""
            )
            ?
            "—"
            :
            String(value);



        return td;

    }







    function renderTableMessage(text){


        elements.tbody.replaceChildren();



        const tr =
            document.createElement(
                "tr"
            );


        const td =
            document.createElement(
                "td"
            );


        td.colSpan = 6;


        td.textContent =
            text;



        tr.appendChild(td);


        elements.tbody.appendChild(tr);


    }







    function renderUsers(users){


        elements.tbody.replaceChildren();



        if(
            !users ||
            users.length === 0
        ){

            renderTableMessage(
                "暂无用户数据"
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









    /* =====================================================
       LOAD USERS
    ===================================================== */


    async function loadUsers(){


        if(loading)
            return;



        loading = true;



        renderTableMessage(
            "正在加载用户数据..."
        );


        setMessage("");



        try{


            const response =
                await fetch(
                    API_URL,
                    {

                        method:"POST",


                        headers:{

                            "Content-Type":
                                "application/json"

                        },


                        credentials:
                            "include",


                        body:
                            JSON.stringify({})

                    }
                );




            const result =
                await response.json();





            if(!response.ok){

                throw new Error(
                    result.message ||
                    result.error ||
                    "加载失败"
                );

            }




            if(
                !result.success
            ){

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



            renderTableMessage(
                "加载失败"
            );



            setMessage(
                error.message ||
                "用户数据加载失败。",
                true
            );


        }
        finally{


            loading = false;


            if(elements.refresh){

                elements.refresh.disabled =
                    false;

            }

        }


    }








    /* =====================================================
       INIT
    ===================================================== */


    function init(){


        getElements();



        if(
            !elements.tbody ||
            !elements.refresh
        ){

            console.error(
                "[U9 Admin PAGE1] HTML missing"
            );

            return;

        }




        elements.refresh.onclick =
            function(){

                if(loading)
                    return;


                loadUsers();

            };




        loadUsers();


    }







    /* =====================================================
       PUBLIC API
    ===================================================== */


    window.U9AdminUsers = {


        refresh:function(){

            loadUsers();

        },


        load:function(){

            loadUsers();

        }


    };







    /* =====================================================
       BOOT
    ===================================================== */


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
