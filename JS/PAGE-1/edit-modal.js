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



    // 禁止背景页面滚动
    document.body.style.overflow =
        "hidden";


}





function closeEditModal(){


    modal.classList.remove(
        "active"
    );



    // 恢复页面滚动
    document.body.style.overflow =
        "";


}
