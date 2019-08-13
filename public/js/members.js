function deactivateMember(memberId) {
    $.ajax({
        url: '/members/member/' + memberId,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify({memberId}),
        type: 'POST',
        success: ((res) => {
            console.log("Result: ", res);
            // window.location.reload(); // just need to refresh the table
            let oldChild = document.querySelector('tr[id="' + memberId + '"]').querySelector('button[onclick]');
            console.log(oldChild)
            let parent = oldChild.parentNode;
            console.log(parent)
            let newChild = oldChild.cloneNode(true);
            console.log(newChild)
            // newChild.querySelectorAll('td').lastChild.setAttribute("disabled", "true");
            // newChild.lastChild.disabled = true;
            newChild.disabled = false;
            console.log(newChild)
            // parent.replaceChild(newChild, oldChild);
        }),
        error: ((error) => {
            console.log("Error:", error);
        })
    });
}

function status(response) {
    // if (response.status >= 200 && response.status < 300) {
    if (response.ok) {
        return Promise.resolve(response)
    } else {
        return Promise.reject(new Error(response.statusText))
    }
}

function toggleMember(memberId) {
    fetch(
        '/members/member/' + memberId, 
        {
            method: 'post',
            headers: {
                "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            // body: 'data=',
            // body: new FormData(form),
            body: JSON.stringify({memberId}),
            credentials: 'include',
            mode: 'cors'
        }
    )
    .then( status ) //callback
    .then( response => response.json()) // can convert to other types: response.blob()
    .then( res => {
        console.log("Result: ", res);
        let oldChild = document.querySelector('tr[id="' + memberId + '"]').querySelector('button[onclick]');
        let parent = oldChild.parentNode;
        let newChild = oldChild.cloneNode(true);
        newChild.classList.toggle('btn-primary');
        newChild.classList.toggle('btn-danger');
        if(res.local.active){
            newChild.innerHTML = 'Suspend';
        }
        else{
            newChild.innerHTML = 'Activate';
        }    
        parent.replaceChild(newChild, oldChild);
    })
    .catch( err =>
        {console.log("Error:", err);}
    );
}