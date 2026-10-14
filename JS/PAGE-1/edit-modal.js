/* =====================================================
   U9 ADMIN

   File:
   JS/PAGE-1/edit-modal.js

   Edit User Modal

   Functions:
   - Open modal
   - Close modal
   - Show username in header
   - Refresh button
   - Lock background scroll

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
        user.username ||
        user.email ||
        "User";




    console.log(
        "Open edit modal:",
        username
    );





    if(elements.title){


        elements.title.textContent =
            username;


    }






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
