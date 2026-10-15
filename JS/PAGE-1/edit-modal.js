/* =====================================================
   U9 ADMIN

   File:
   JS/PAGE-1/edit-modal.js

   Edit User Modal

   Functions:
   - Open modal
   - Close modal
   - Show username in header
   - Show order status
   - Show order count
   - Show coins
   - Show balance
   - Refresh button
   - Lock background scroll
   - Negative Coins / Balance display in red

===================================================== */


(function(){

"use strict";


const elements = {};

let currentUser = null;





/* ===============================
   ELEMENTS
================================ */


function getElements(){


    elements.modal =
        document.getElementById(
            "U9-admin-edit-modal"
        );



    elements.close =
        document.getElementById(
            "U9-admin-edit-modal-close"
        );



    elements.title =
        document.getElementById(
            "U9-admin-edit-modal-title"
        );



    elements.refresh =
        document.getElementById(
            "U9-admin-edit-modal-refresh"
        );





    /*
        User Status
    */


    elements.orderStatus =
        document.getElementById(
            "U9-edit-order-status"
        );



    elements.orderCount =
        document.getElementById(
            "U9-edit-order-count"
        );



    elements.coins =
        document.getElementById(
            "U9-edit-user-coins"
        );



    elements.balance =
        document.getElementById(
            "U9-edit-user-balance"
        );



}









/* ===============================
   FORMAT
================================ */


function formatAmount(value){


    const num =
        Number(value ?? 0);



    if(!Number.isFinite(num)){

        return "0.00";

    }



    return num.toFixed(2);


}









/* ===============================
   NEGATIVE AMOUNT COLOR
================================ */


function updateNegativeColor(element, value){


    if(!element)
        return;



    const amount =
        Number(value ?? 0);



    element.classList.toggle(
        "is-negative",
        Number.isFinite(amount) &&
        amount < 0
    );


}









/* ===============================
   LOAD USER DATA
================================ */


function renderUserData(user){


    if(!user)
        return;






    /*
        Order Status

        Temporary

        Later connect:
        latest_order_status
    */


    if(elements.orderStatus){


        elements.orderStatus.textContent =
            "Matching";


    }






    /*
        Order Count
    */


    if(elements.orderCount){


        elements.orderCount.textContent =
            Number(
                user.order_count || 0
            );


    }







    /*
        Coins
    */


    if(elements.coins){


        elements.coins.textContent =
            formatAmount(
                user.coins
            );


        updateNegativeColor(
            elements.coins,
            user.coins
        );


    }







    /*
        Balance
    */


    if(elements.balance){


        elements.balance.textContent =
            formatAmount(
                user.balance
            );


        updateNegativeColor(
            elements.balance,
            user.balance
        );


    }



}









/* ===============================
   OPEN MODAL
================================ */


function openEditModal(user){


    if(!elements.modal){


        console.error(
            "[U9 Admin] Edit modal missing."
        );


        return;


    }



    currentUser =
        user || {};





    const username =
        currentUser.username ||
        currentUser.email ||
        "User";





    console.log(
        "Open edit modal:",
        username
    );







    if(elements.title){


        elements.title.textContent =
            username;


    }






    renderUserData(
        currentUser
    );







    elements.modal.classList.add(
        "active"
    );





    document.body.style.overflow =
        "hidden";



}









/* ===============================
   CLOSE MODAL
================================ */


function closeEditModal(){


    if(!elements.modal)
        return;





    elements.modal.classList.remove(
        "active"
    );





    document.body.style.overflow =
        "";





    currentUser = null;



}









/* ===============================
   REFRESH MODAL
================================ */


function refreshEditModal(){



    if(!currentUser){


        console.warn(
            "[U9 Admin] No user selected."
        );


        return;


    }




    console.log(
        "Refresh edit modal:",
        currentUser
    );



    renderUserData(
        currentUser
    );



}









/* ===============================
   INIT
================================ */


function init(){


    getElements();





    if(!elements.modal){


        console.error(
            "[U9 Admin] Edit modal HTML not found."
        );


        return;


    }








    if(elements.close){


        elements.close.onclick =
            function(){


                closeEditModal();


            };


    }








    if(elements.refresh){


        elements.refresh.onclick =
            function(){


                refreshEditModal();


            };


    }







    console.log(
        "[U9 Admin] Edit modal initialized."
    );


}









/* ===============================
   GLOBAL FUNCTIONS

   Used by page-1.js

================================ */


window.openEditModal =
    openEditModal;




window.closeEditModal =
    closeEditModal;









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
