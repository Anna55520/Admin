/* =====================================================
   U9 ADMIN
   File: JS/PAGE-1/page-1.js

   PAGE 1: User Management

   Data:
   admin-users-list Edge Function

   Features:
   1. Load users
   2. Pagination
   3. Refresh
   4. Coins format
   5. Balance format
   6. Order count

===================================================== */


(function () {

    "use strict";


    const PAGE_SIZE = 20;


    const API_URL =
        "https://tvtakmswbzawaweytimx.supabase.co/functions/v1/admin-users-list";



    let currentPage = 1;

    let totalUsers = 0;

    let loading = false;



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


        elements.prev =
            document.getElementById(
                "U9-admin-users-prev"
            );


        elements.next =
            document.getElementById(
                "U9-admin-users-next"
            );


        elements.pageInfo =
            document.getElementById(
                "U9-admin-users-page-info"
            );


    }






    /* =====================================================
       MESSAGE
    ===================================================== */


    function setMessage(
        message,
        isError=false
    ){

        if(!elements.message)
            return;


        elements.message.textContent =
            message || "";


        elements.message.classList.toggle(
            "error",
            isError
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



        return `${month}/${day}/${year}`;

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
            value === null ||
            value === undefined ||
            value === ""
                ?
                "—"
                :
                String(value);



        return td;

    }






    function renderMessage(message){


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
            message;



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
       PAGINATION
    ===================================================== */


    function updatePagination(){


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    totalUsers /
                    PAGE_SIZE
                )
            );



        elements.pageInfo.textContent =
            `第 ${currentPage} / ${totalPages} 页，共 ${totalUsers} 位用户`;



        elements.prev.disabled =
            loading ||
            currentPage <= 1;



        elements.next.disabled =
            loading ||
            currentPage >= totalPages;


    }









    /* =====================================================
       LOAD USERS
    ===================================================== */


    async function loadUsers(){


        if(loading)
            return;



        loading = true;


        updatePagination();



        renderMessage(
            "正在加载用户数据..."
        );


        setMessage("");




        try{


            const url =
                `${API_URL}?page=${currentPage}&page_size=${PAGE_SIZE}`;




            const response =
                await fetch(
                    url,
                    {
                        method:"GET",

                        credentials:"include"
                    }
                );





            const result =
                await response.json();





            if(
                !response.ok
            ){

                throw new Error(
                    result.error ||
                    "加载失败"
                );

            }






            /*
              期待返回:

              {
                 users:[],
                 total:5
              }

            */



            totalUsers =
                result.total ?? 0;



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



            totalUsers = 0;



            renderMessage(
                "加载失败"
            );



            setMessage(
                error.message ||
                "用户数据加载失败",
                true
            );



        }
        finally{


            loading=false;


            updatePagination();


        }



    }









    /* =====================================================
       EVENTS
    ===================================================== */


    function initEvents(){


        elements.refresh.onclick =
            function(){

                currentPage = 1;

                loadUsers();

            };




        elements.prev.onclick =
            function(){

                if(
                    loading ||
                    currentPage <= 1
                )
                    return;



                currentPage--;

                loadUsers();


            };





        elements.next.onclick =
            function(){


                const totalPages =
                    Math.max(
                        1,
                        Math.ceil(
                            totalUsers /
                            PAGE_SIZE
                        )
                    );



                if(
                    loading ||
                    currentPage >= totalPages
                )
                    return;



                currentPage++;


                loadUsers();


            };


    }









    /* =====================================================
       INIT
    ===================================================== */


    function init(){


        getElements();



        if(
            !elements.tbody ||
            !elements.refresh ||
            !elements.pageInfo
        ){

            console.error(
                "[U9 Admin PAGE1] HTML missing"
            );

            return;

        }




        initEvents();



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
