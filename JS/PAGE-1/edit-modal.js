/* =====================================================
   U9 ADMIN

   File:
   JS/MODAL/edit-modal.js

   User Edit Modal Controller

===================================================== */


(function(){

"use strict";



window.openEditModal =
function(user){


    console.log(
        "[U9 Edit Modal]",
        user
    );


    alert(
        "Open edit modal: "
        +
        user.username
    );


};



})();
