/* =====================================================
   U9 ADMIN

   File:
   JS/PAGE-1/edit-modal.js

   Edit Modal

   Functions:
   - Open modal
   - Close modal

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


    elements.username =
        document.getElementById(
            "U9-admin-edit-username"
        );

}






/* ===============================
   OPEN
================================ */


function openEditModal(user){


    if(!elements.modal)
        return;



    const username =
        user.username ||
        user.email ||
        "User";



    console.log(
        "Open edit modal:",
        username
    );



    if(elements.username){

        elements.username.value =
            username;

    }



    const title =
        elements.modal.querySelector(
            ".U9-admin-edit-modal-header h3"
        );



    if(title){

        title.textContent =
            username;

    }



    elements.modal.classList.add(
        "active"
    );


}






/* ===============================
   CLOSE
================================ */


function closeEditModal(){


    if(!elements.modal)
        return;



    elements.modal.classList.remove(
        "active"
    );


}






/* ===============================
   INIT
================================ */


function init(){


    getElements();



    if(!elements.modal){

        console.error(
            "[U9 Admin] Edit modal missing."
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
   GLOBAL
================================ */


window.openEditModal =
    openEditModal;


window.closeEditModal =
    closeEditModal;






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
