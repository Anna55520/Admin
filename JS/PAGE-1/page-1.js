/* =====================================================
   U9 ADMIN
   File: JS/PAGE-1/page-1.js

   PAGE 1: User Management

   Data source:
   Supabase Edge Function
   admin-users-list

   Display:
   - Username
   - Account
   - Coins
   - Balance
   - Created Date
   - Order Count

   ===================================================== */

(function () {

    "use strict";


    let initialized = false;
    let loading = false;


    const elements = {};


    /* =====================================================
       SUPABASE
    ===================================================== */

    function getSupabase() {

        return window.supabaseClient || null;

    }



    /* =====================================================
       ELEMENTS
    ===================================================== */

    function getElements() {


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

    function setMessage(message, error = false) {


        if (!elements.message) return;


        elements.message.textContent =
            message || "";


        elements.message.classList.toggle(
            "error",
            error
        );

    }




    /* =====================================================
       FORMAT
    ===================================================== */

    function formatAmount(value) {


        const number = Number(value ?? 0);


        if (!Number.isFinite(number)) {

            return "0.00";

        }


        return number.toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    }



    function formatDate(value) {


        if (!value) {

            return "—";

        }


        const date =
            new Date(value);


        if (Number.isNaN(date.getTime())) {

            return "—";

        }


        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");


        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        const year =
            date.getFullYear();



        return `${month}/${day}/${year}`;

    }




    /* =====================================================
       TABLE
    ===================================================== */

    function createCell(value) {


        const td =
            document.createElement("td");


        td.textContent =
            value === null ||
            value === undefined ||
            value === ""
                ? "—"
                : String(value);


        return td;

    }





    function renderLoading() {


        elements.tbody.innerHTML = `

            <tr>
                <td colspan="6">
                    正在加载用户数据...
                </td>
            </tr>

        `;

    }




    function renderEmpty() {


        elements.tbody.innerHTML = `

            <tr>
                <td colspan="6">
                    暂无用户数据
                </td>
            </tr>

        `;

    }





    function renderUsers(users) {


        elements.tbody.replaceChildren();



        if (!users || users.length === 0) {

            renderEmpty();

            return;

        }



        const fragment =
            document.createDocumentFragment();



        users.forEach(function(user){



            const tr =
                document.createElement("tr");



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



        });



        elements.tbody.appendChild(
            fragment
        );


    }




    /* =====================================================
       LOAD USERS
    ===================================================== */

    async function loadUsers(){


        if (loading) return;


        loading = true;


        setMessage("");

        renderLoading();



        try {


            const supabase =
                getSupabase();



            if (!supabase) {

                throw new Error(
                    "Supabase client not ready"
                );

            }



            const {
                data,
                error
            } =
            await supabase.functions.invoke(
                "admin-users-list"
            );



            if (error) {

                throw error;

            }



            console.log(
                "[U9 Admin] Users:",
                data
            );



            /*
              支持两种返回格式

              [
                {...}
              ]

              或

              {
                users:[]
              }

            */


            const users =
                Array.isArray(data)
                    ? data
                    : data.users;



            renderUsers(
                users || []
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


            elements.tbody.innerHTML = `

                <tr>
                    <td colspan="6">
                        加载失败
                    </td>
                </tr>

            `;


            setMessage(
                error.message ||
                "加载失败",
                true
            );


        }
        finally{


            loading = false;


        }


    }





    /* =====================================================
       INIT
    ===================================================== */

    function initialize(){


        if(initialized) return;


        getElements();



        if(
            !elements.tbody ||
            !elements.refresh
        ){

            console.error(
                "[U9 Admin PAGE1] Missing HTML"
            );

            return;

        }



        initialized = true;



        elements.refresh.addEventListener(
            "click",
            function(){

                loadUsers();

            }
        );



        loadUsers();


    }




    window.U9AdminUsers = {

        refresh:
            loadUsers,

        load:
            loadUsers

    };




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
