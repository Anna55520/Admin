(function(){

"use strict";


let modal;
let closeButton;
let title;



function init(){


    modal =
        document.getElementById(
            "U9-admin-edit-modal"
        );


    closeButton =
        document.getElementById(
            "U9-admin-edit-modal-close"
        );


    title =
        document.getElementById(
            "U9-admin-edit-modal-title"
        );



    if(closeButton){

        closeButton.onclick =
            function(){

                closeEditModal();

            };

    }


}



function openEditModal(user){


    const username =
        user.username ||
        user.email ||
        "User";



    console.log(
        "Open edit modal:",
        username
    );



    if(title){

        title.textContent =
            username;

    }



    modal.classList.add(
        "active"
    );


}



function closeEditModal(){


    modal.classList.remove(
        "active"
    );


}



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
