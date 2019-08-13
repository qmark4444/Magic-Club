

function deleteTrick(trickId) {
    $.ajax({
        url: '/trick/' + trickId + '/delete-json',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify({trickId}),
        type: 'POST',
        success: ((res) => {
            // Replace follow button with unfollow.
            console.log("Result: ", res)
            $("#"+trickId).remove();
        }),
        error: ((error) => {
            console.log("Error:", error);
        })
    });
}