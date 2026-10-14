/* =====================================================
   U9 ADMIN

   File:
   JS/PAGE-1/edit-modal.js

   Edit User Modal

   Functions:
   - Open modal
   - Close modal
   - Show username in header
   - Lock background scroll

===================================================== */


(function(){

"use strict";


const elements = {};





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



    // Disable background scrolling

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



    // Restore background scrolling

    document.body.style.overflow =
        "";


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
